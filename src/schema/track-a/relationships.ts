// src/schema/track-a/relationships.ts
// @implements INFRASTRUCTURE
// Matches Cursor Plan canonical schema (lines 470-494)

/**
 * Track A Relationship Type Codes (24 total)
 * Per Verification Spec V20.6.6 §2.2 SANITY-002
 */
export type RelationshipTypeCode =
  // Hierarchical (R01-R03)
  | 'R01'   // HAS_STORY: Epic → Story
  | 'R02'   // HAS_AC: Story → AcceptanceCriterion
  | 'R03'   // HAS_CONSTRAINT: Story/Epic → Constraint
  // Containment (R04-R07)
  | 'R04'   // CONTAINS_FILE: Module → SourceFile
  | 'R05'   // CONTAINS_ENTITY: SourceFile → Function/Class/Interface
  | 'R06'   // CONTAINS_SUITE: TestFile → TestSuite
  | 'R07'   // CONTAINS_CASE: TestSuite → TestCase
  // TDD Bridge (R08, R09, R11)
  | 'R08'   // DESIGNED_IN: Story → TechnicalDesign
  | 'R09'   // SPECIFIED_IN: AcceptanceCriterion → TechnicalDesign
  | 'R11'   // DEFINES_SCHEMA: Story → DataSchema
  // Design→Impl (R14, R16)
  | 'R14'   // IMPLEMENTED_BY: TechnicalDesign → SourceFile
  | 'R16'   // DEFINED_IN: Function/Class → SourceFile (Track A canon per ENTRY.md)
  // Req→Impl (R18-R19)
  | 'R18'   // IMPLEMENTS: SourceFile → Story
  | 'R19'   // SATISFIES: Function/Class → AcceptanceCriterion
  // Impl→Impl (R21-R24, R26)
  | 'R21'   // IMPORTS: SourceFile → SourceFile
  | 'R22'   // CALLS: Function → Function
  | 'R23'   // EXTENDS: Class → Class
  | 'R24'   // IMPLEMENTS_INTERFACE: Class → Interface
  | 'R26'   // DEPENDS_ON: Module → Module
  // Req→Test (R36-R37)
  | 'R36'   // TESTED_BY: Story → TestSuite
  | 'R37'   // VERIFIED_BY: AcceptanceCriterion → TestCase
  // Provenance (R63, R67, R70)
  | 'R63'   // INTRODUCED_IN: Story → ReleaseVersion
  | 'R67'   // MODIFIED_IN: SourceFile → Commit
  | 'R70';  // GROUPS: ChangeSet → Commit

/**
 * Relationship interface matching Cursor Plan PostgreSQL schema
 * Updated in Pre-A2 Hardening to include evidence anchor fields
 */
export interface Relationship {
  id: string;                              // UUID
  relationship_type: RelationshipTypeCode; // 'R01', 'R02', etc.
  instance_id: string;                     // Unique identifier (pattern: R{XX}:{from}:{to})
  name: string;                            // Human-readable name (e.g., 'HAS_STORY')
  from_entity_id: string;                  // UUID (NOT source_id)
  to_entity_id: string;                    // UUID (NOT target_id)
  confidence: number;                      // 0.00 to 1.00
  // Evidence anchor fields (added in Pre-A2 Hardening per Constraint A.2)
  source_file: string;                     // File where relationship was extracted
  line_start: number;                      // Starting line (1-indexed, > 0)
  line_end: number;                        // Ending line (>= line_start)
  content_hash: string | null;             // SHA-256 hash for change detection
  extracted_at: Date;
  project_id: string;                      // UUID
}

/**
 * Relationship type code to name mapping
 */
export const RELATIONSHIP_TYPE_NAMES: Record<RelationshipTypeCode, string> = {
  'R01': 'HAS_STORY',
  'R02': 'HAS_AC',
  'R03': 'HAS_CONSTRAINT',
  'R04': 'CONTAINS_FILE',
  'R05': 'CONTAINS_ENTITY',
  'R06': 'CONTAINS_SUITE',
  'R07': 'CONTAINS_CASE',
  'R08': 'DESIGNED_IN',
  'R09': 'SPECIFIED_IN',
  'R11': 'DEFINES_SCHEMA',
  'R14': 'IMPLEMENTED_BY',
  'R16': 'DEFINED_IN',
  'R18': 'IMPLEMENTS',
  'R19': 'SATISFIES',
  'R21': 'IMPORTS',
  'R22': 'CALLS',
  'R23': 'EXTENDS',
  'R24': 'IMPLEMENTS_INTERFACE',
  'R26': 'DEPENDS_ON',
  'R36': 'TESTED_BY',
  'R37': 'VERIFIED_BY',
  'R63': 'INTRODUCED_IN',
  'R67': 'MODIFIED_IN',
  'R70': 'GROUPS',
};

/**
 * All valid relationship type codes
 */
export const RELATIONSHIP_TYPE_CODES: RelationshipTypeCode[] = [
  'R01', 'R02', 'R03', 'R04', 'R05', 'R06', 'R07',
  'R08', 'R09', 'R11',
  'R14', 'R16', 'R18', 'R19',
  'R21', 'R22', 'R23', 'R24', 'R26',
  'R36', 'R37',
  'R63', 'R67', 'R70',
];

/**
 * Type guard for relationship type codes
 */
export function isRelationshipTypeCode(code: string): code is RelationshipTypeCode {
  return RELATIONSHIP_TYPE_CODES.includes(code as RelationshipTypeCode);
}

/**
 * Get relationship type name from code
 */
export function getRelationshipTypeName(code: RelationshipTypeCode): string {
  return RELATIONSHIP_TYPE_NAMES[code];
}


