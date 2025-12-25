// test/unit/test-relationship-provider.test.ts
// @implements STORY-64.3
// @satisfies AC-64.3.4
// @satisfies AC-64.3.5
// Unit tests for R36/R37 derivation from test structure

import { describe, it, expect } from 'vitest';
import {
  deriveTestedByRelationships,
  deriveVerifiedByRelationships,
  deriveTestRelationships,
} from '../../src/extraction/providers/test-relationship-provider.js';
import type { ExtractedEntity } from '../../src/extraction/types.js';

describe('R36 TESTED_BY derivation', () => {
  const createStory = (storyId: string): ExtractedEntity => ({
    entity_type: 'E02',
    instance_id: storyId,
    name: `Story ${storyId}`,
    attributes: {},
    source_file: 'docs/BRD.md',
    line_start: 1,
    line_end: 10,
  });

  const createTestSuite = (name: string, instanceId: string): ExtractedEntity => ({
    entity_type: 'E28',
    instance_id: instanceId,
    name,
    attributes: {},
    source_file: 'test/example.test.ts',
    line_start: 1,
    line_end: 50,
  });

  it('derives R36 from describe("STORY-XX.YY: description")', () => {
    const stories = [createStory('STORY-64.3')];
    const suites = [createTestSuite('STORY-64.3: Marker Extraction Tests', 'TSTS-marker-extraction')];

    const relationships = deriveTestedByRelationships(suites, stories);

    expect(relationships).toHaveLength(1);
    expect(relationships[0].relationship_type).toBe('R36');
    expect(relationships[0].from_instance_id).toBe('STORY-64.3');
    expect(relationships[0].to_instance_id).toBe('TSTS-marker-extraction');
    expect(relationships[0].instance_id).toBe('R36:STORY-64.3:TSTS-marker-extraction');
    expect(relationships[0].attributes?.confidence).toBe(1.0);
    expect(relationships[0].attributes?.derived_from).toBe('test_structure');
  });

  it('ignores describe blocks without STORY-XX.YY pattern', () => {
    const stories = [createStory('STORY-64.3')];
    const suites = [
      createTestSuite('Entity Registry Tests', 'TSTS-entity-registry'),
      createTestSuite('A2 Phase 1: BRD relationships', 'TSTS-brd-rels'),
    ];

    const relationships = deriveTestedByRelationships(suites, stories);

    expect(relationships).toHaveLength(0);
  });

  it('ignores R36 when target story does not exist', () => {
    const stories: ExtractedEntity[] = []; // No stories
    const suites = [createTestSuite('STORY-64.99: Non-existent Story', 'TSTS-nonexistent')];

    const relationships = deriveTestedByRelationships(suites, stories);

    expect(relationships).toHaveLength(0);
  });

  it('extracts story ID with various formats', () => {
    const stories = [
      createStory('STORY-1.1'),
      createStory('STORY-99.99'),
    ];
    const suites = [
      createTestSuite('STORY-1.1: Simple test', 'TSTS-simple'),
      createTestSuite('Tests for STORY-99.99 verification', 'TSTS-verify'),
    ];

    const relationships = deriveTestedByRelationships(suites, stories);

    expect(relationships).toHaveLength(2);
    expect(relationships.map(r => r.from_instance_id)).toContain('STORY-1.1');
    expect(relationships.map(r => r.from_instance_id)).toContain('STORY-99.99');
  });
});

describe('R37 VERIFIED_BY derivation', () => {
  const createAC = (acId: string): ExtractedEntity => ({
    entity_type: 'E03',
    instance_id: acId,
    name: `AC ${acId}`,
    attributes: {},
    source_file: 'docs/BRD.md',
    line_start: 1,
    line_end: 5,
  });

  const createTestCase = (name: string, instanceId: string): ExtractedEntity => ({
    entity_type: 'E29',
    instance_id: instanceId,
    name,
    attributes: {},
    source_file: 'test/example.test.ts',
    line_start: 10,
    line_end: 20,
  });

  it('derives R37 from it("AC-XX.YY.ZZ: description")', () => {
    const acs = [createAC('AC-64.3.1')];
    const cases = [createTestCase('AC-64.3.1: extracts @implements markers', 'TC-implements')];

    const relationships = deriveVerifiedByRelationships(cases, acs);

    expect(relationships).toHaveLength(1);
    expect(relationships[0].relationship_type).toBe('R37');
    expect(relationships[0].from_instance_id).toBe('AC-64.3.1');
    expect(relationships[0].to_instance_id).toBe('TC-implements');
    expect(relationships[0].instance_id).toBe('R37:AC-64.3.1:TC-implements');
    expect(relationships[0].attributes?.confidence).toBe(1.0);
    expect(relationships[0].attributes?.derived_from).toBe('test_structure');
  });

  it('ignores it blocks without AC-XX.YY.ZZ pattern', () => {
    const acs = [createAC('AC-64.3.1')];
    const cases = [
      createTestCase('extracts markers from source code', 'TC-markers'),
      createTestCase('validates marker targets', 'TC-validate'),
    ];

    const relationships = deriveVerifiedByRelationships(cases, acs);

    expect(relationships).toHaveLength(0);
  });

  it('ignores R37 when target AC does not exist', () => {
    const acs: ExtractedEntity[] = []; // No ACs
    const cases = [createTestCase('AC-99.99.99: Non-existent AC', 'TC-nonexistent')];

    const relationships = deriveVerifiedByRelationships(cases, acs);

    expect(relationships).toHaveLength(0);
  });

  it('extracts AC ID with various formats', () => {
    const acs = [
      createAC('AC-1.1.1'),
      createAC('AC-99.99.99'),
    ];
    const cases = [
      createTestCase('AC-1.1.1: simple test', 'TC-simple'),
      createTestCase('Verify AC-99.99.99 requirements', 'TC-verify'),
    ];

    const relationships = deriveVerifiedByRelationships(cases, acs);

    expect(relationships).toHaveLength(2);
    expect(relationships.map(r => r.from_instance_id)).toContain('AC-1.1.1');
    expect(relationships.map(r => r.from_instance_id)).toContain('AC-99.99.99');
  });
});

describe('deriveTestRelationships (combined)', () => {
  it('derives both R36 and R37 from mixed entities', () => {
    const entities: ExtractedEntity[] = [
      // Stories
      { entity_type: 'E02', instance_id: 'STORY-64.3', name: 'Marker Extraction', attributes: {}, source_file: 'BRD.md', line_start: 1, line_end: 10 },
      // ACs
      { entity_type: 'E03', instance_id: 'AC-64.3.1', name: 'Extract markers', attributes: {}, source_file: 'BRD.md', line_start: 11, line_end: 15 },
      // TestSuites
      { entity_type: 'E28', instance_id: 'TSTS-marker', name: 'STORY-64.3: Marker Tests', attributes: {}, source_file: 'test.ts', line_start: 1, line_end: 100 },
      // TestCases
      { entity_type: 'E29', instance_id: 'TC-extract', name: 'AC-64.3.1: extracts markers', attributes: {}, source_file: 'test.ts', line_start: 10, line_end: 30 },
    ];

    const relationships = deriveTestRelationships(entities);

    expect(relationships).toHaveLength(2);
    expect(relationships.filter(r => r.relationship_type === 'R36')).toHaveLength(1);
    expect(relationships.filter(r => r.relationship_type === 'R37')).toHaveLength(1);
  });

  it('returns empty array when no patterns match', () => {
    const entities: ExtractedEntity[] = [
      { entity_type: 'E02', instance_id: 'STORY-64.3', name: 'Story', attributes: {}, source_file: 'BRD.md', line_start: 1, line_end: 10 },
      { entity_type: 'E28', instance_id: 'TSTS-test', name: 'Some Tests', attributes: {}, source_file: 'test.ts', line_start: 1, line_end: 100 },
      { entity_type: 'E29', instance_id: 'TC-test', name: 'tests something', attributes: {}, source_file: 'test.ts', line_start: 10, line_end: 30 },
    ];

    const relationships = deriveTestRelationships(entities);

    expect(relationships).toHaveLength(0);
  });
});

describe('Evidence anchors', () => {
  it('R36 evidence comes from TestSuite location', () => {
    const stories: ExtractedEntity[] = [
      { entity_type: 'E02', instance_id: 'STORY-1.1', name: 'Story', attributes: {}, source_file: 'BRD.md', line_start: 1, line_end: 10 },
    ];
    const suites: ExtractedEntity[] = [
      { entity_type: 'E28', instance_id: 'TSTS-test', name: 'STORY-1.1: Test', attributes: {}, source_file: 'test/my.test.ts', line_start: 5, line_end: 50 },
    ];

    const relationships = deriveTestedByRelationships(suites, stories);

    expect(relationships[0].source_file).toBe('test/my.test.ts');
    expect(relationships[0].line_start).toBe(5);
    expect(relationships[0].line_end).toBe(50);
  });

  it('R37 evidence comes from TestCase location', () => {
    const acs: ExtractedEntity[] = [
      { entity_type: 'E03', instance_id: 'AC-1.1.1', name: 'AC', attributes: {}, source_file: 'BRD.md', line_start: 1, line_end: 5 },
    ];
    const cases: ExtractedEntity[] = [
      { entity_type: 'E29', instance_id: 'TC-test', name: 'AC-1.1.1: Test', attributes: {}, source_file: 'test/my.test.ts', line_start: 10, line_end: 25 },
    ];

    const relationships = deriveVerifiedByRelationships(cases, acs);

    expect(relationships[0].source_file).toBe('test/my.test.ts');
    expect(relationships[0].line_start).toBe(10);
    expect(relationships[0].line_end).toBe(25);
  });
});

