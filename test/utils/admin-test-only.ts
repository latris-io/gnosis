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
  // A2: Neo4j entities-first prerequisite helpers
  countNeo4jNodes,
  countNeo4jRelationships,
  clearNeo4jProject,
} from '../../src/services/admin/admin-test-only.js';
