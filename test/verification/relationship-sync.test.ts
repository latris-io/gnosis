// test/verification/relationship-sync.test.ts
// @implements STORY-64.2
// Verification: Neo4j relationship sync infrastructure
// G-API compliant: no src/db/** imports

import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { syncToNeo4j, syncRelationshipsToNeo4j, persistRelationshipsAndSync } from '../../src/ops/track-a.js';
import type { ExtractedRelationship } from '../../src/extraction/types.js';
import {
  createTestProject,
  createTestEntity,
  createTestRelationship,
  deleteProjectRelationships,
  deleteProjectEntities,
  deleteProject,
  deleteNeo4jProjectNodes,
  queryNeo4jRelationshipByInstanceId,
} from '../utils/admin-test-only.js';

const TEST_PROJECT = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
const EPIC_INSTANCE = 'EPIC-TEST-REL';
const STORY_INSTANCE = 'STORY-TEST-REL';
const REL_INSTANCE = 'R01:EPIC-TEST-REL:STORY-TEST-REL';

describe('Relationship Neo4j Sync (A2 Phase 0)', () => {
  beforeAll(async () => {
    await createTestProject(TEST_PROJECT, 'Relationship Sync Test');
    await createTestEntity(TEST_PROJECT, 'E01', EPIC_INSTANCE, 'Test Epic');
    await createTestEntity(TEST_PROJECT, 'E02', STORY_INSTANCE, 'Test Story');
    // Sync entities to Neo4j so relationship sync can find endpoints
    await syncToNeo4j(TEST_PROJECT);
  });

  afterAll(async () => {
    await deleteProjectRelationships(TEST_PROJECT);
    await deleteProjectEntities(TEST_PROJECT);
    await deleteProject(TEST_PROJECT);
    await deleteNeo4jProjectNodes([TEST_PROJECT]);
  });

  it('syncs relationships from PostgreSQL to Neo4j', async () => {
    // Create relationship in PostgreSQL
    await createTestRelationship(
      TEST_PROJECT, 'R01', REL_INSTANCE, 'HAS_STORY',
      EPIC_INSTANCE, STORY_INSTANCE
    );

    // Sync to Neo4j
    const result = await syncRelationshipsToNeo4j(TEST_PROJECT);
    expect(result.synced).toBe(1);
    expect(result.skipped).toBe(0);

    // Verify in Neo4j (project-scoped query)
    const neo4jRels = await queryNeo4jRelationshipByInstanceId(TEST_PROJECT, REL_INSTANCE);
    expect(neo4jRels.length).toBe(1);
    expect(neo4jRels[0].projectId).toBe(TEST_PROJECT);
    expect(neo4jRels[0].type).toBe('R01');
    expect(neo4jRels[0].fromInstanceId).toBe(EPIC_INSTANCE);
    expect(neo4jRels[0].toInstanceId).toBe(STORY_INSTANCE);
  });

  it('returns synced:0 for empty relationship set', async () => {
    // Create new project with entities but no relationships
    const emptyProject = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
    await createTestProject(emptyProject, 'Empty Rel Test');
    await createTestEntity(emptyProject, 'E01', 'EPIC-EMPTY', 'Empty Epic');
    await syncToNeo4j(emptyProject); // Sync entity (though not needed for this test)

    try {
      const result = await syncRelationshipsToNeo4j(emptyProject);
      expect(result.synced).toBe(0);
      expect(result.skipped).toBe(0);
    } finally {
      await deleteProjectEntities(emptyProject);
      await deleteProject(emptyProject);
      await deleteNeo4jProjectNodes([emptyProject]);
    }
  });

  it('skips relationships when endpoint entities missing in Neo4j', async () => {
    // Create project with relationship in PostgreSQL but entities NOT synced to Neo4j
    const orphanProject = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
    await createTestProject(orphanProject, 'Orphan Rel Test');
    await createTestEntity(orphanProject, 'E01', 'EPIC-ORPHAN', 'Orphan Epic');
    await createTestEntity(orphanProject, 'E02', 'STORY-ORPHAN', 'Orphan Story');
    await createTestRelationship(
      orphanProject, 'R01', 'R01:EPIC-ORPHAN:STORY-ORPHAN', 'HAS_STORY',
      'EPIC-ORPHAN', 'STORY-ORPHAN'
    );
    // Note: entities exist in PostgreSQL but NOT synced to Neo4j

    try {
      const result = await syncRelationshipsToNeo4j(orphanProject);
      // Should skip because endpoint entities not in Neo4j
      expect(result.synced).toBe(0);
      expect(result.skipped).toBe(1);
    } finally {
      await deleteProjectRelationships(orphanProject);
      await deleteProjectEntities(orphanProject);
      await deleteProject(orphanProject);
    }
  });

  it('batchUpsertAndSync is idempotent (no duplicate drift)', async () => {
    // Idempotency test: running same data twice should not create duplicates
    const IDEM_PROJECT = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
    const testRels: ExtractedRelationship[] = [{
      relationship_type: 'R01',
      instance_id: 'R01:EPIC-IDEM:STORY-IDEM',
      name: 'HAS_STORY',
      from_instance_id: 'EPIC-IDEM',
      to_instance_id: 'STORY-IDEM',
      confidence: 1.0,
      source_file: 'test.md',
      line_start: 1,
      line_end: 1,
    }];

    await createTestProject(IDEM_PROJECT, 'Idempotency Test');
    await createTestEntity(IDEM_PROJECT, 'E01', 'EPIC-IDEM', 'Idem Epic');
    await createTestEntity(IDEM_PROJECT, 'E02', 'STORY-IDEM', 'Idem Story');
    await syncToNeo4j(IDEM_PROJECT);

    try {
      // First run - should CREATE
      const run1 = await persistRelationshipsAndSync(IDEM_PROJECT, testRels);
      expect(run1.results[0].operation).toBe('CREATE');
      expect(run1.neo4jSync.synced).toBe(1);

      // Second run - should be NO-OP (idempotent)
      const run2 = await persistRelationshipsAndSync(IDEM_PROJECT, testRels);
      expect(run2.results[0].operation).toBe('NO-OP'); // content_hash unchanged
      
      // Neo4j sync STILL runs (always syncs), MERGE is idempotent
      expect(run2.neo4jSync.synced).toBe(1); // MERGE returns 1 (merged, not "new")
      expect(run2.neo4jSync.skipped).toBe(0);

      // Verify no duplicates in Neo4j
      const neo4jRels = await queryNeo4jRelationshipByInstanceId(
        IDEM_PROJECT, 
        testRels[0].instance_id
      );
      expect(neo4jRels.length).toBe(1); // Still exactly 1, not 2

    } finally {
      await deleteProjectRelationships(IDEM_PROJECT);
      await deleteProjectEntities(IDEM_PROJECT);
      await deleteProject(IDEM_PROJECT);
      await deleteNeo4jProjectNodes([IDEM_PROJECT]);
    }
  });
});

// NOTE: Duplicate detection gate is tested implicitly - if duplicates exist,
// syncRelationshipsToNeo4j() throws an error. Creating duplicates safely in
// tests would require direct Neo4j writes bypassing MERGE, which defeats the
// purpose. The gate's existence is verified by code review.
