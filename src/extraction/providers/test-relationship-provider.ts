// src/extraction/providers/test-relationship-provider.ts
// @implements STORY-64.3
// @satisfies AC-64.3.4
// @satisfies AC-64.3.5
//
// Derives R36 (TESTED_BY) and R37 (VERIFIED_BY) relationships from test structure.
//
// Per UTG Schema V20.6.1:
// - R36: Story → TestSuite derived from describe('STORY-XX.YY: ...')
// - R37: AcceptanceCriterion → TestCase derived from it('AC-XX.YY.ZZ: ...')
//
// This is NOT marker-based extraction - it's test structure parsing.

import type { ExtractedEntity, ExtractedRelationship } from '../types.js';
import { normalizeEvidencePath } from '../evidence-path.js';

// Patterns for extracting story/AC references from test names
const STORY_PATTERN = /STORY-(\d+\.\d+)/i;
const AC_PATTERN = /AC-(\d+\.\d+\.\d+)/i;

/**
 * Derive R36 (TESTED_BY) relationships from E28 TestSuite entities.
 * 
 * Pattern: describe('STORY-XX.YY: description') → R36
 * Creates: Story (E02) → TestSuite (E28)
 * 
 * @param suites E28 TestSuite entities
 * @param stories E02 Story entities (for validation)
 * @returns R36 relationships
 */
export function deriveTestedByRelationships(
  suites: ExtractedEntity[],
  stories: ExtractedEntity[]
): ExtractedRelationship[] {
  const relationships: ExtractedRelationship[] = [];
  const storyIds = new Set(stories.map(s => s.instance_id));

  for (const suite of suites) {
    if (suite.entity_type !== 'E28') continue;

    const match = suite.name.match(STORY_PATTERN);
    if (!match) continue;

    const storyId = `STORY-${match[1]}`;
    
    // Only create relationship if target story exists
    if (!storyIds.has(storyId)) {
      // Log orphan for semantic corpus? For now, skip silently
      // (story might not be extracted yet, or might be out of scope)
      continue;
    }

    // R36: Story → TestSuite (Story is TESTED_BY TestSuite)
    const instanceId = `R36:${storyId}:${suite.instance_id}`;
    // Truncate name to fit VARCHAR(100) constraint
    const fullName = `${storyId} TESTED_BY ${suite.instance_id}`;
    const name = fullName.length > 100 ? fullName.slice(0, 97) + '...' : fullName;

    // Normalize source_file to repo-relative path (fails loudly if outside repo)
    const normalizedSourceFile = normalizeEvidencePath(suite.source_file || '');

    relationships.push({
      relationship_type: 'R36',
      instance_id: instanceId,
      from_instance_id: storyId,
      to_instance_id: suite.instance_id,
      name,
      // Evidence from the TestSuite location (where the describe() is)
      source_file: normalizedSourceFile,
      line_start: suite.line_start || 0,
      line_end: suite.line_end || suite.line_start || 0,
      attributes: {
        derived_from: 'test_structure',
        pattern: 'describe(STORY-XX.YY)',
        confidence: 1.0,
      },
    });
  }

  return relationships;
}

/**
 * Derive R37 (VERIFIED_BY) relationships from E29 TestCase entities.
 * 
 * Pattern: it('AC-XX.YY.ZZ: description') → R37
 * Creates: AcceptanceCriterion (E03) → TestCase (E29)
 * 
 * @param cases E29 TestCase entities
 * @param acs E03 AcceptanceCriterion entities (for validation)
 * @returns R37 relationships
 */
export function deriveVerifiedByRelationships(
  cases: ExtractedEntity[],
  acs: ExtractedEntity[]
): ExtractedRelationship[] {
  const relationships: ExtractedRelationship[] = [];
  const acIds = new Set(acs.map(a => a.instance_id));

  for (const testCase of cases) {
    if (testCase.entity_type !== 'E29') continue;

    const match = testCase.name.match(AC_PATTERN);
    if (!match) continue;

    const acId = `AC-${match[1]}`;
    
    // Only create relationship if target AC exists
    if (!acIds.has(acId)) {
      // Skip silently - AC might not exist or be out of scope
      continue;
    }

    // R37: AC → TestCase (AC is VERIFIED_BY TestCase)
    const instanceId = `R37:${acId}:${testCase.instance_id}`;
    // Truncate name to fit VARCHAR(100) constraint
    const fullName = `${acId} VERIFIED_BY ${testCase.instance_id}`;
    const name = fullName.length > 100 ? fullName.slice(0, 97) + '...' : fullName;

    // Normalize source_file to repo-relative path (fails loudly if outside repo)
    const normalizedSourceFile = normalizeEvidencePath(testCase.source_file || '');

    relationships.push({
      relationship_type: 'R37',
      instance_id: instanceId,
      from_instance_id: acId,
      to_instance_id: testCase.instance_id,
      name,
      // Evidence from the TestCase location (where the it() is)
      source_file: normalizedSourceFile,
      line_start: testCase.line_start || 0,
      line_end: testCase.line_end || testCase.line_start || 0,
      attributes: {
        derived_from: 'test_structure',
        pattern: 'it(AC-XX.YY.ZZ)',
        confidence: 1.0,
      },
    });
  }

  return relationships;
}

/**
 * Derive all test structure relationships (R36, R37).
 * 
 * @param entities All extracted entities (filters for E28, E29, E02, E03)
 * @returns R36 and R37 relationships
 */
export function deriveTestRelationships(
  entities: ExtractedEntity[]
): ExtractedRelationship[] {
  const suites = entities.filter(e => e.entity_type === 'E28');
  const cases = entities.filter(e => e.entity_type === 'E29');
  const stories = entities.filter(e => e.entity_type === 'E02');
  const acs = entities.filter(e => e.entity_type === 'E03');

  const r36 = deriveTestedByRelationships(suites, stories);
  const r37 = deriveVerifiedByRelationships(cases, acs);

  return [...r36, ...r37];
}

