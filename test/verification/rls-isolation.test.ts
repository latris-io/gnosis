// test/verification/rls-isolation.test.ts
// @implements INFRASTRUCTURE
// Regression test: RLS isolation must prevent cross-project data deletion
// 
// INCIDENT: 2024-12-24 - deleteProjectRelationships(TEST_PROJECT) deleted MAIN project data
// ROOT CAUSE: FORCE ROW LEVEL SECURITY was not enabled, so table owner bypassed RLS
// 
// This test proves the fix works and prevents regression.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  createTestProject,
  createTestEntity,
  createTestRelationship,
  deleteProjectRelationships,
  deleteProjectEntities,
  deleteProject,
} from '../../src/services/admin/admin-test-only.js';
import { rlsQuery } from '../utils/rls.js';

const MAIN_PROJECT = process.env.PROJECT_ID || '6df2f456-440d-4958-b475-d9808775ff69';
const TEST_PROJECT = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

describe('RLS Isolation (Regression)', () => {
  let mainEntityCountBefore: number;
  let mainRelCountBefore: number;

  beforeAll(async () => {
    // Capture MAIN project counts before test
    const entities = await rlsQuery<{ cnt: string }>(MAIN_PROJECT, 'SELECT COUNT(*) as cnt FROM entities');
    const rels = await rlsQuery<{ cnt: string }>(MAIN_PROJECT, 'SELECT COUNT(*) as cnt FROM relationships');
    mainEntityCountBefore = parseInt(entities[0].cnt);
    mainRelCountBefore = parseInt(rels[0].cnt);

    console.log(`[BEFORE] Main project: ${mainEntityCountBefore} entities, ${mainRelCountBefore} relationships`);

    // Create TEST project with data
    await createTestProject(TEST_PROJECT, 'RLS Isolation Test');
    await createTestEntity(TEST_PROJECT, 'E01', 'EPIC-TEST-1', 'Test Epic');
    await createTestEntity(TEST_PROJECT, 'E02', 'STORY-TEST-1.1', 'Test Story');
    await createTestRelationship(
      TEST_PROJECT,
      'R01',
      'R01:EPIC-TEST-1:STORY-TEST-1.1',
      'HAS_STORY',
      'EPIC-TEST-1',
      'STORY-TEST-1.1'
    );

    // Verify TEST project has data
    const testEntities = await rlsQuery<{ cnt: string }>(TEST_PROJECT, 'SELECT COUNT(*) as cnt FROM entities');
    const testRels = await rlsQuery<{ cnt: string }>(TEST_PROJECT, 'SELECT COUNT(*) as cnt FROM relationships');
    console.log(`[BEFORE] Test project: ${testEntities[0].cnt} entities, ${testRels[0].cnt} relationships`);
  });

  afterAll(async () => {
    // Cleanup TEST project
    await deleteProjectRelationships(TEST_PROJECT);
    await deleteProjectEntities(TEST_PROJECT);
    await deleteProject(TEST_PROJECT);
  });

  it('deleteProjectRelationships(TEST_PROJECT) does NOT affect MAIN project', async () => {
    // THE BUG: This used to delete ALL relationships, not just TEST_PROJECT's
    await deleteProjectRelationships(TEST_PROJECT);

    // MAIN project must be unchanged
    const mainEntities = await rlsQuery<{ cnt: string }>(MAIN_PROJECT, 'SELECT COUNT(*) as cnt FROM entities');
    const mainRels = await rlsQuery<{ cnt: string }>(MAIN_PROJECT, 'SELECT COUNT(*) as cnt FROM relationships');

    const mainEntityCountAfter = parseInt(mainEntities[0].cnt);
    const mainRelCountAfter = parseInt(mainRels[0].cnt);

    console.log(`[AFTER DELETE] Main project: ${mainEntityCountAfter} entities, ${mainRelCountAfter} relationships`);

    // CRITICAL ASSERTIONS - These failed before the RLS fix
    expect(mainEntityCountAfter).toBe(mainEntityCountBefore);
    expect(mainRelCountAfter).toBe(mainRelCountBefore);

    // TEST project relationships should be deleted
    const testRels = await rlsQuery<{ cnt: string }>(TEST_PROJECT, 'SELECT COUNT(*) as cnt FROM relationships');
    expect(parseInt(testRels[0].cnt)).toBe(0);
  });

  it('deleteProjectEntities(TEST_PROJECT) does NOT affect MAIN project', async () => {
    // Delete TEST entities
    await deleteProjectEntities(TEST_PROJECT);

    // MAIN project must be unchanged
    const mainEntities = await rlsQuery<{ cnt: string }>(MAIN_PROJECT, 'SELECT COUNT(*) as cnt FROM entities');
    const mainEntityCountAfter = parseInt(mainEntities[0].cnt);

    console.log(`[AFTER ENTITY DELETE] Main project: ${mainEntityCountAfter} entities`);

    // CRITICAL ASSERTION
    expect(mainEntityCountAfter).toBe(mainEntityCountBefore);

    // TEST project entities should be deleted
    const testEntities = await rlsQuery<{ cnt: string }>(TEST_PROJECT, 'SELECT COUNT(*) as cnt FROM entities');
    expect(parseInt(testEntities[0].cnt)).toBe(0);
  });
});

