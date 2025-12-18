// test/verification/relationship-sync.test.ts
// @implements STORY-64.2
// Verification: Neo4j relationship sync infrastructure
// G-API compliant: no src/db/** imports

import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { syncToNeo4j, syncRelationshipsToNeo4j } from '../../src/ops/track-a.js';
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
});

// NOTE: Duplicate detection gate is tested implicitly - if duplicates exist,
// syncRelationshipsToNeo4j() throws an error. Creating duplicates safely in
// tests would require direct Neo4j writes bypassing MERGE, which defeats the
// purpose. The gate's existence is verified by code review.
