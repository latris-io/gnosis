// src/schema/track-a/entities.ts
// @implements INFRASTRUCTURE
// Matches Cursor Plan canonical schema (lines 444-467)

/**
 * Track A Entity Type Codes (16 total)
 * Per Verification Spec V20.6.4 §2.2 SANITY-001
 */
export type EntityTypeCode = 
  | 'E01'   // Epic
  | 'E02'   // Story
  | 'E03'   // AcceptanceCriterion
  | 'E04'   // Constraint
  | 'E06'   // TechnicalDesign
  | 'E08'   // DataSchema
  | 'E11'   // SourceFile
  | 'E12'   // Function
  | 'E13'   // Class
  | 'E15'   // Module
  | 'E27'   // TestFile
  | 'E28'   // TestSuite
  | 'E29'   // TestCase
  | 'E49'   // ReleaseVersion
  | 'E50'   // Commit
  | 'E52';  // ChangeSet

/**
 * Entity interface matching Cursor Plan PostgreSQL schema
 */
export interface Entity {
  id: string;                          // UUID
  entity_type: EntityTypeCode;         // 'E01', 'E02', etc.
  instance_id: string;                 // Unique identifier
  name: string;                        // Human-readable name
  attributes: Record<string, unknown>; // JSONB
  source_file: string | null;          // Provenance
  line_start: number | null;           // Provenance
  line_end: number | null;             // Provenance
  content_hash: string | null;         // sha256:... format (71 chars)
  extracted_at: Date;
  project_id: string;                  // UUID
}

/**
 * Entity type code to name mapping
 */
export const ENTITY_TYPE_NAMES: Record<EntityTypeCode, string> = {
  'E01': 'Epic',
  'E02': 'Story',
  'E03': 'AcceptanceCriterion',
  'E04': 'Constraint',
  'E06': 'TechnicalDesign',
  'E08': 'DataSchema',
  'E11': 'SourceFile',
  'E12': 'Function',
  'E13': 'Class',
  'E15': 'Module',
  'E27': 'TestFile',
  'E28': 'TestSuite',
  'E29': 'TestCase',
  'E49': 'ReleaseVersion',
  'E50': 'Commit',
  'E52': 'ChangeSet',
};

/**
 * All valid entity type codes
 */
export const ENTITY_TYPE_CODES: EntityTypeCode[] = [
  'E01', 'E02', 'E03', 'E04', 'E06', 'E08',
  'E11', 'E12', 'E13', 'E15',
  'E27', 'E28', 'E29',
  'E49', 'E50', 'E52',
];

/**
 * Type guard for entity type codes
 */
export function isEntityTypeCode(code: string): code is EntityTypeCode {
  return ENTITY_TYPE_CODES.includes(code as EntityTypeCode);
}

/**
 * Get entity type name from code
 */
export function getEntityTypeName(code: EntityTypeCode): string {
  return ENTITY_TYPE_NAMES[code];
}


