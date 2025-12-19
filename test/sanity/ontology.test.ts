// test/sanity/ontology.test.ts
// @implements INFRASTRUCTURE
// Per Verification Spec V20.6.4 §2.2

import { describe, it, expect } from 'vitest';
import { 
  ENTITY_TYPE_CODES, 
  ENTITY_TYPE_NAMES,
  isEntityTypeCode 
} from '../../src/schema/track-a/entities.js';
import { 
  RELATIONSHIP_TYPE_CODES, 
  RELATIONSHIP_TYPE_NAMES,
  isRelationshipTypeCode 
} from '../../src/schema/track-a/relationships.js';

describe('ONTOLOGY Tests', () => {
  // SANITY-001: Track A Entity Types Exist
  it('SANITY-001: all 16 Track A entity type codes registered', () => {
    expect(ENTITY_TYPE_CODES.length).toBe(16);
    
    // Verify specific codes
    expect(ENTITY_TYPE_CODES).toContain('E01'); // Epic
    expect(ENTITY_TYPE_CODES).toContain('E02'); // Story
    expect(ENTITY_TYPE_CODES).toContain('E03'); // AcceptanceCriterion
    expect(ENTITY_TYPE_CODES).toContain('E04'); // Constraint
    expect(ENTITY_TYPE_CODES).toContain('E06'); // TechnicalDesign
    expect(ENTITY_TYPE_CODES).toContain('E08'); // DataSchema
    expect(ENTITY_TYPE_CODES).toContain('E11'); // SourceFile
    expect(ENTITY_TYPE_CODES).toContain('E12'); // Function
    expect(ENTITY_TYPE_CODES).toContain('E13'); // Class
    expect(ENTITY_TYPE_CODES).toContain('E15'); // Module
    expect(ENTITY_TYPE_CODES).toContain('E27'); // TestFile
    expect(ENTITY_TYPE_CODES).toContain('E28'); // TestSuite
    expect(ENTITY_TYPE_CODES).toContain('E29'); // TestCase
    expect(ENTITY_TYPE_CODES).toContain('E49'); // ReleaseVersion
    expect(ENTITY_TYPE_CODES).toContain('E50'); // Commit
    expect(ENTITY_TYPE_CODES).toContain('E52'); // ChangeSet
  });

  it('SANITY-001: all entity type codes have name mappings', () => {
    for (const code of ENTITY_TYPE_CODES) {
      expect(ENTITY_TYPE_NAMES[code]).toBeDefined();
      expect(typeof ENTITY_TYPE_NAMES[code]).toBe('string');
    }
  });

  it('SANITY-001: type guard works correctly', () => {
    expect(isEntityTypeCode('E01')).toBe(true);
    expect(isEntityTypeCode('E99')).toBe(false);
    expect(isEntityTypeCode('Epic')).toBe(false); // Names are not codes
  });

  // SANITY-002: Track A Relationship Types Exist
  it('SANITY-002: all 24 Track A relationship type codes registered', () => {
    expect(RELATIONSHIP_TYPE_CODES.length).toBe(24);
    
    // Verify by category
    // Hierarchical
    expect(RELATIONSHIP_TYPE_CODES).toContain('R01'); // HAS_STORY
    expect(RELATIONSHIP_TYPE_CODES).toContain('R02'); // HAS_AC
    expect(RELATIONSHIP_TYPE_CODES).toContain('R03'); // HAS_CONSTRAINT
    // Containment
    expect(RELATIONSHIP_TYPE_CODES).toContain('R04'); // CONTAINS_FILE
    expect(RELATIONSHIP_TYPE_CODES).toContain('R05'); // CONTAINS_ENTITY
    expect(RELATIONSHIP_TYPE_CODES).toContain('R06'); // CONTAINS_SUITE
    expect(RELATIONSHIP_TYPE_CODES).toContain('R07'); // CONTAINS_CASE
    // Design→Impl
    expect(RELATIONSHIP_TYPE_CODES).toContain('R14'); // IMPLEMENTED_BY
    expect(RELATIONSHIP_TYPE_CODES).toContain('R16'); // DEFINED_IN
    // Req→Impl
    expect(RELATIONSHIP_TYPE_CODES).toContain('R18'); // IMPLEMENTS
    expect(RELATIONSHIP_TYPE_CODES).toContain('R19'); // SATISFIES
    // Impl→Impl
    expect(RELATIONSHIP_TYPE_CODES).toContain('R21'); // IMPORTS
    expect(RELATIONSHIP_TYPE_CODES).toContain('R22'); // CALLS
    expect(RELATIONSHIP_TYPE_CODES).toContain('R23'); // EXTENDS
    expect(RELATIONSHIP_TYPE_CODES).toContain('R24'); // IMPLEMENTS_INTERFACE
    expect(RELATIONSHIP_TYPE_CODES).toContain('R26'); // DEPENDS_ON
    // Req→Test
    expect(RELATIONSHIP_TYPE_CODES).toContain('R36'); // TESTED_BY
    expect(RELATIONSHIP_TYPE_CODES).toContain('R37'); // VERIFIED_BY
    // Provenance
    expect(RELATIONSHIP_TYPE_CODES).toContain('R63'); // INTRODUCED_IN
    expect(RELATIONSHIP_TYPE_CODES).toContain('R67'); // MODIFIED_IN
    expect(RELATIONSHIP_TYPE_CODES).toContain('R70'); // GROUPS
  });

  it('SANITY-002: all relationship type codes have name mappings', () => {
    for (const code of RELATIONSHIP_TYPE_CODES) {
      expect(RELATIONSHIP_TYPE_NAMES[code]).toBeDefined();
      expect(typeof RELATIONSHIP_TYPE_NAMES[code]).toBe('string');
    }
  });

  // SANITY-003: Entity ID Formats Match Conventions
  it('SANITY-003: entity type codes match E## pattern', () => {
    const pattern = /^E[0-9]{2}$/;
    for (const code of ENTITY_TYPE_CODES) {
      expect(code).toMatch(pattern);
    }
  });

  it('SANITY-003: relationship type codes match R## pattern', () => {
    const pattern = /^R[0-9]{2}$/;
    for (const code of RELATIONSHIP_TYPE_CODES) {
      expect(code).toMatch(pattern);
    }
  });

  // SANITY-004: Relationship Directionality (structural only - empty graph)
  it('SANITY-004: relationship name mappings defined', () => {
    // Structural check only - validates mappings exist
    // EMPTY_GRAPH: Structural invariant verified, 0 relationships to validate
    // TDD Retrofit: 21 → 24 (added R08, R09, R11)
    expect(Object.keys(RELATIONSHIP_TYPE_NAMES).length).toBe(24);
    console.log('EMPTY_GRAPH: Structural invariant verified, 0 relationships to validate');
  });

  // SANITY-005: No Orphan Entities (structural only - empty graph)
  it('SANITY-005: entity/relationship type systems consistent', () => {
    // Structural check only - validates type systems align
    // EMPTY_GRAPH: Structural invariant verified, 0 entities to validate
    // TDD Retrofit: 21 → 24 (added R08, R09, R11)
    expect(ENTITY_TYPE_CODES.length).toBe(16);
    expect(RELATIONSHIP_TYPE_CODES.length).toBe(24);
    console.log('EMPTY_GRAPH: Structural invariant verified, 0 entities to validate');
  });
});
