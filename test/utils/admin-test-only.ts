// test/utils/admin-test-only.ts
// @implements INFRASTRUCTURE
// Re-exports test-only helpers for test code

// Re-export from guarded production module
export {
  createTestProject,
  deleteProjectEntities,
  deleteProject,
  createTestEntity,
  deleteNeo4jProjectNodes,
  queryNeo4jByInstanceId,
  // A2 Phase 0: Relationship test helpers
  createTestRelationship,
  deleteProjectRelationships,
  queryNeo4jRelationshipByInstanceId,
} from '../../src/services/admin/admin-test-only.js';
