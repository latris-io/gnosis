// test/verification/neo4j-multi-tenant.test.ts
// @implements STORY-64.1
// Regression test: Neo4j multi-tenant isolation via real sync path
// G-API compliant: no src/db/** imports

import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { syncToNeo4j } from '../../src/ops/track-a.js';
import {
  createTestProject,
  createTestEntity,
  deleteProjectEntities,
  deleteProject,
  deleteNeo4jProjectNodes,
  queryNeo4jByInstanceId,
} from '../utils/admin-test-only.js';

const PROJECT_A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const PROJECT_B = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const SHARED_INSTANCE_ID = 'TEST-MULTI-TENANT-1';

describe('Neo4j Multi-tenant Isolation', () => {
  beforeAll(async () => {
    // Seed via test-only helpers (G-API compliant)
    await createTestProject(PROJECT_A, 'Test Project A');
    await createTestProject(PROJECT_B, 'Test Project B');
    await createTestEntity(PROJECT_A, 'E99', SHARED_INSTANCE_ID, 'Test Entity A');
    await createTestEntity(PROJECT_B, 'E99', SHARED_INSTANCE_ID, 'Test Entity B');
  });

  afterAll(async () => {
    // Clean up Postgres via test-only helpers
    await deleteProjectEntities(PROJECT_A);
    await deleteProjectEntities(PROJECT_B);
    await deleteProject(PROJECT_A);
    await deleteProject(PROJECT_B);

    // Clean up Neo4j via test-only helper (uses DETACH DELETE)
    await deleteNeo4jProjectNodes([PROJECT_A, PROJECT_B]);
  });

  it('creates separate Neo4j nodes for same instance_id in different projects', async () => {
    // Sync both projects via the REAL sync path (ops layer)
    await syncToNeo4j(PROJECT_A);
    await syncToNeo4j(PROJECT_B);

    // Query Neo4j via test-only helper (G-API compliant)
    const nodes = await queryNeo4jByInstanceId(SHARED_INSTANCE_ID);

    // Must be TWO separate nodes (one per project)
    expect(nodes.length).toBe(2);

    const projectIds = nodes.map(n => n.projectId);
    expect(projectIds).toContain(PROJECT_A);
    expect(projectIds).toContain(PROJECT_B);
  });
});
