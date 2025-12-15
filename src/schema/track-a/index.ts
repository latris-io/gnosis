// src/schema/track-a/index.ts
// @implements INFRASTRUCTURE
// Track A Schema - barrel export

// Entity types and registry
export type { EntityTypeCode, Entity } from './entities.js';
export {
  ENTITY_TYPE_NAMES,
  ENTITY_TYPE_CODES,
  isEntityTypeCode,
  getEntityTypeName,
} from './entities.js';

// Relationship types and registry
export type { RelationshipTypeCode, Relationship } from './relationships.js';
export {
  RELATIONSHIP_TYPE_NAMES,
  RELATIONSHIP_TYPE_CODES,
  isRelationshipTypeCode,
  getRelationshipTypeName,
} from './relationships.js';

// ID format patterns (for SANITY-003)
export {
  ID_PATTERNS,
  validateEntityId,
  getIdPatternDescription,
} from './id-formats.js';
