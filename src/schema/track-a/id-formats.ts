// src/schema/track-a/id-formats.ts
// @implements INFRASTRUCTURE
// Per Verification Spec V20.6.4 §2.2.3 SANITY-003

import type { EntityTypeCode } from './entities.js';

/**
 * Entity ID format patterns by type code
 * Per Verification Spec SANITY-003
 */
export const ID_PATTERNS: Record<EntityTypeCode, RegExp> = {
  'E01': /^EPIC-\d+$/,                           // Epic
  'E02': /^STORY-\d+\.\d+$/,                     // Story
  'E03': /^AC-\d+\.\d+\.\d+$/,                   // AcceptanceCriterion
  'E04': /^CNST-[A-Z]+-\d+$/,                    // Constraint
  'E06': /^TDD-[\w.]+$/,                         // TechnicalDesign
  'E08': /^SCHEMA-[\w]+$/,                       // DataSchema
  'E11': /^FILE-.+$/,                            // SourceFile
  'E12': /^FUNC-.+:.+$/,                         // Function
  'E13': /^CLASS-.+:.+$/,                        // Class
  'E15': /^MOD-[\w.]+$/,                         // Module
  'E27': /^TSTF-.+$/,                            // TestFile
  'E28': /^TSTS-[\w.]+$/,                        // TestSuite
  'E29': /^TC-.+:.+$/,                           // TestCase
  'E49': /^REL-[\w.]+$/,                         // ReleaseVersion
  'E50': /^COMMIT-[a-f0-9]+$/,                   // Commit
  'E52': /^CHGSET-[\w]+$/,                       // ChangeSet
};

/**
 * Validate an entity ID matches expected format for its type
 */
export function validateEntityId(typeCode: EntityTypeCode, id: string): boolean {
  const pattern = ID_PATTERNS[typeCode];
  return pattern ? pattern.test(id) : false;
}

/**
 * Get human-readable description of ID pattern
 */
export function getIdPatternDescription(typeCode: EntityTypeCode): string {
  const descriptions: Record<EntityTypeCode, string> = {
    'E01': 'EPIC-{number}',
    'E02': 'STORY-{epic}.{number}',
    'E03': 'AC-{epic}.{story}.{number}',
    'E04': 'CNST-{type}-{number}',
    'E06': 'TDD-{version}',
    'E08': 'SCHEMA-{name}',
    'E11': 'FILE-{path}',
    'E12': 'FUNC-{file}:{name}',
    'E13': 'CLASS-{file}:{name}',
    'E15': 'MOD-{name}',
    'E27': 'TSTF-{path}',
    'E28': 'TSTS-{name}',
    'E29': 'TC-{suite}:{name}',
    'E49': 'REL-{version}',
    'E50': 'COMMIT-{sha}',
    'E52': 'CHGSET-{id}',
  };
  return descriptions[typeCode];
}
