// test/unit/containment-derivation-provider.test.ts
// Unit tests for R04-R07 containment relationship derivation
// @implements STORY-64.2

import { describe, it, expect } from 'vitest';
import {
  deriveR04,
  deriveR05,
  deriveR06,
  deriveR07,
  validateEvidenceAnchors,
  type EntityInput,
} from '../../src/extraction/providers/containment-derivation-provider.js';

// Valid evidence helper
const validEvidence = (file: string, start: number, end: number) => ({
  source_file: file,
  line_start: start,
  line_end: end,
});

describe('deriveR04 (Module CONTAINS_FILE SourceFile)', () => {
  describe('basic derivation', () => {
    it('derives R04 from directory path matching', () => {
      const modules: EntityInput[] = [
        { entity_type: 'E15', instance_id: 'MOD-src/services', ...validEvidence('/repo/src/services/a.ts', 1, 1), attributes: {} },
      ];
      const files: EntityInput[] = [
        { entity_type: 'E11', instance_id: 'FILE-src/services/entity.ts', ...validEvidence('/repo/src/services/entity.ts', 1, 100), attributes: {} },
        { entity_type: 'E11', instance_id: 'FILE-src/services/project.ts', ...validEvidence('/repo/src/services/project.ts', 1, 50), attributes: {} },
      ];

      const relationships = deriveR04(modules, files);

      expect(relationships).toHaveLength(2);
      expect(relationships[0].relationship_type).toBe('R04');
      expect(relationships[0].from_instance_id).toBe('MOD-src/services');
      expect(relationships[0].to_instance_id).toBe('FILE-src/services/entity.ts');
    });

    it('skips root-level files (no containing module)', () => {
      const modules: EntityInput[] = [
        { entity_type: 'E15', instance_id: 'MOD-src', ...validEvidence('/repo/src/index.ts', 1, 1), attributes: {} },
      ];
      const files: EntityInput[] = [
        { entity_type: 'E11', instance_id: 'FILE-package.json', ...validEvidence('/repo/package.json', 1, 50), attributes: {} },
        { entity_type: 'E11', instance_id: 'FILE-src/index.ts', ...validEvidence('/repo/src/index.ts', 1, 10), attributes: {} },
      ];

      const relationships = deriveR04(modules, files);

      expect(relationships).toHaveLength(1);
      expect(relationships[0].to_instance_id).toBe('FILE-src/index.ts');
    });
  });

  describe('evidence from TO entity', () => {
    it('R04 evidence comes from E11 file (TO entity), not E15 module', () => {
      const modules: EntityInput[] = [
        { entity_type: 'E15', instance_id: 'MOD-src/db', ...validEvidence('/repo/src/db/a.ts', 1, 1), attributes: {} },
      ];
      const files: EntityInput[] = [
        { entity_type: 'E11', instance_id: 'FILE-src/db/postgres.ts', ...validEvidence('/repo/src/db/postgres.ts', 10, 100), attributes: {} },
      ];

      const relationships = deriveR04(modules, files);

      expect(relationships).toHaveLength(1);
      const r04 = relationships[0];
      // Evidence should come from the E11 file, not the E15 module
      expect(r04.source_file).toBe('/repo/src/db/postgres.ts');
      expect(r04.line_start).toBe(10);
      expect(r04.line_end).toBe(100);
    });
  });

  describe('instance_id format', () => {
    it('uses correct instance_id format R04:FROM:TO', () => {
      const modules: EntityInput[] = [
        { entity_type: 'E15', instance_id: 'MOD-src', ...validEvidence('/repo/src/a.ts', 1, 1), attributes: {} },
      ];
      const files: EntityInput[] = [
        { entity_type: 'E11', instance_id: 'FILE-src/index.ts', ...validEvidence('/repo/src/index.ts', 1, 10), attributes: {} },
      ];

      const relationships = deriveR04(modules, files);

      expect(relationships[0].instance_id).toBe('R04:MOD-src:FILE-src/index.ts');
    });
  });
});

describe('deriveR05 (SourceFile CONTAINS_ENTITY Function/Class)', () => {
  it('parses file path from FUNC instance_id', () => {
    const files: EntityInput[] = [
      { entity_type: 'E11', instance_id: 'FILE-src/services/entity.ts', ...validEvidence('/repo/src/services/entity.ts', 1, 200), attributes: {} },
    ];
    const codeUnits: EntityInput[] = [
      { entity_type: 'E12', instance_id: 'FUNC-src/services/entity.ts:upsert', ...validEvidence('/repo/src/services/entity.ts', 50, 100), attributes: {} },
    ];

    const relationships = deriveR05(files, codeUnits);

    expect(relationships).toHaveLength(1);
    expect(relationships[0].relationship_type).toBe('R05');
    expect(relationships[0].from_instance_id).toBe('FILE-src/services/entity.ts');
    expect(relationships[0].to_instance_id).toBe('FUNC-src/services/entity.ts:upsert');
  });

  it('parses file path from CLASS instance_id', () => {
    const files: EntityInput[] = [
      { entity_type: 'E11', instance_id: 'FILE-src/providers/ast.ts', ...validEvidence('/repo/src/providers/ast.ts', 1, 300), attributes: {} },
    ];
    const codeUnits: EntityInput[] = [
      { entity_type: 'E13', instance_id: 'CLASS-src/providers/ast.ts:ASTProvider', ...validEvidence('/repo/src/providers/ast.ts', 10, 290), attributes: {} },
    ];

    const relationships = deriveR05(files, codeUnits);

    expect(relationships).toHaveLength(1);
    expect(relationships[0].to_instance_id).toBe('CLASS-src/providers/ast.ts:ASTProvider');
  });

  it('handles multiple code units in same file', () => {
    const files: EntityInput[] = [
      { entity_type: 'E11', instance_id: 'FILE-src/utils.ts', ...validEvidence('/repo/src/utils.ts', 1, 100), attributes: {} },
    ];
    const codeUnits: EntityInput[] = [
      { entity_type: 'E12', instance_id: 'FUNC-src/utils.ts:helper1', ...validEvidence('/repo/src/utils.ts', 10, 20), attributes: {} },
      { entity_type: 'E12', instance_id: 'FUNC-src/utils.ts:helper2', ...validEvidence('/repo/src/utils.ts', 30, 40), attributes: {} },
      { entity_type: 'E13', instance_id: 'CLASS-src/utils.ts:Utils', ...validEvidence('/repo/src/utils.ts', 50, 90), attributes: {} },
    ];

    const relationships = deriveR05(files, codeUnits);

    expect(relationships).toHaveLength(3);
  });

  it('evidence comes from code unit (TO entity)', () => {
    const files: EntityInput[] = [
      { entity_type: 'E11', instance_id: 'FILE-src/index.ts', ...validEvidence('/repo/src/index.ts', 1, 500), attributes: {} },
    ];
    const codeUnits: EntityInput[] = [
      { entity_type: 'E12', instance_id: 'FUNC-src/index.ts:main', ...validEvidence('/repo/src/index.ts', 100, 150), attributes: {} },
    ];

    const relationships = deriveR05(files, codeUnits);

    expect(relationships[0].source_file).toBe('/repo/src/index.ts');
    expect(relationships[0].line_start).toBe(100);
    expect(relationships[0].line_end).toBe(150);
  });
});

describe('deriveR06 (TestFile CONTAINS_SUITE TestSuite)', () => {
  it('matches test file by file_path attribute', () => {
    const testFiles: EntityInput[] = [
      { entity_type: 'E27', instance_id: 'TSTF-test/sanity/brd.test.ts', ...validEvidence('/repo/test/sanity/brd.test.ts', 1, 100), attributes: {} },
    ];
    const suites: EntityInput[] = [
      { entity_type: 'E28', instance_id: 'TSTS-BRD-Tests', ...validEvidence('/repo/test/sanity/brd.test.ts', 5, 95), attributes: { file_path: 'test/sanity/brd.test.ts' } },
    ];

    const relationships = deriveR06(testFiles, suites);

    expect(relationships).toHaveLength(1);
    expect(relationships[0].relationship_type).toBe('R06');
    expect(relationships[0].from_instance_id).toBe('TSTF-test/sanity/brd.test.ts');
    expect(relationships[0].to_instance_id).toBe('TSTS-BRD-Tests');
  });

  it('skips suites without file_path attribute', () => {
    const testFiles: EntityInput[] = [
      { entity_type: 'E27', instance_id: 'TSTF-test/unit/utils.test.ts', ...validEvidence('/repo/test/unit/utils.test.ts', 1, 50), attributes: {} },
    ];
    const suites: EntityInput[] = [
      { entity_type: 'E28', instance_id: 'TSTS-Utils', ...validEvidence('/repo/test/unit/utils.test.ts', 5, 45), attributes: {} }, // No file_path
    ];

    const relationships = deriveR06(testFiles, suites);

    expect(relationships).toHaveLength(0);
  });
});

describe('deriveR07 (TestSuite CONTAINS_CASE TestCase)', () => {
  it('selects matching suite by name', () => {
    const suites: EntityInput[] = [
      { entity_type: 'E28', instance_id: 'TSTS-Entity-Service', name: 'Entity Service', ...validEvidence('/repo/test/entity.test.ts', 5, 100), attributes: { file_path: 'test/entity.test.ts' } },
    ];
    const cases: EntityInput[] = [
      { entity_type: 'E29', instance_id: 'TC-Entity-Service-upsert', name: 'upserts entity', ...validEvidence('/repo/test/entity.test.ts', 10, 30), attributes: { file_path: 'test/entity.test.ts', suite_name: 'Entity Service' } },
    ];

    const relationships = deriveR07(suites, cases);

    expect(relationships).toHaveLength(1);
    expect(relationships[0].relationship_type).toBe('R07');
    expect(relationships[0].from_instance_id).toBe('TSTS-Entity-Service');
    expect(relationships[0].to_instance_id).toBe('TC-Entity-Service-upsert');
  });

  it('skips cases without suite_name attribute', () => {
    const suites: EntityInput[] = [
      { entity_type: 'E28', instance_id: 'TSTS-Utils', name: 'Utils', ...validEvidence('/repo/test/utils.test.ts', 5, 50), attributes: { file_path: 'test/utils.test.ts' } },
    ];
    const cases: EntityInput[] = [
      { entity_type: 'E29', instance_id: 'TC-orphan', name: 'orphan test', ...validEvidence('/repo/test/utils.test.ts', 10, 20), attributes: { file_path: 'test/utils.test.ts' } }, // No suite_name
    ];

    const relationships = deriveR07(suites, cases);

    expect(relationships).toHaveLength(0);
  });

  it('handles nested suites by selecting innermost match', () => {
    const suites: EntityInput[] = [
      { entity_type: 'E28', instance_id: 'TSTS-Outer', name: 'Outer', ...validEvidence('/repo/test/nested.test.ts', 5, 100), attributes: { file_path: 'test/nested.test.ts' } },
      { entity_type: 'E28', instance_id: 'TSTS-Inner', name: 'Inner', ...validEvidence('/repo/test/nested.test.ts', 10, 50), attributes: { file_path: 'test/nested.test.ts' } },
    ];
    const cases: EntityInput[] = [
      { entity_type: 'E29', instance_id: 'TC-Inner-test', name: 'inner test', ...validEvidence('/repo/test/nested.test.ts', 15, 25), attributes: { file_path: 'test/nested.test.ts', suite_name: 'Inner' } },
    ];

    const relationships = deriveR07(suites, cases);

    expect(relationships).toHaveLength(1);
    expect(relationships[0].from_instance_id).toBe('TSTS-Inner');
  });
});

describe('validateEvidenceAnchors', () => {
  it('passes for entities with valid evidence', () => {
    const entities: EntityInput[] = [
      { entity_type: 'E11', instance_id: 'FILE-src/index.ts', source_file: '/repo/src/index.ts', line_start: 1, line_end: 100, attributes: {} },
      { entity_type: 'E12', instance_id: 'FUNC-src/index.ts:main', source_file: '/repo/src/index.ts', line_start: 10, line_end: 50, attributes: {} },
    ];

    expect(() => validateEvidenceAnchors(entities)).not.toThrow();
  });

  it('throws on missing source_file', () => {
    const entities: EntityInput[] = [
      { entity_type: 'E11', instance_id: 'FILE-src/index.ts', source_file: '', line_start: 1, line_end: 100, attributes: {} },
    ];

    expect(() => validateEvidenceAnchors(entities)).toThrow(/invalid source_file/i);
  });

  it('throws on line_start < 1', () => {
    const entities: EntityInput[] = [
      { entity_type: 'E11', instance_id: 'FILE-src/index.ts', source_file: '/repo/src/index.ts', line_start: 0, line_end: 100, attributes: {} },
    ];

    expect(() => validateEvidenceAnchors(entities)).toThrow(/invalid line_start/i);
  });

  it('throws on line_end < line_start', () => {
    const entities: EntityInput[] = [
      { entity_type: 'E12', instance_id: 'FUNC-src/index.ts:main', source_file: '/repo/src/index.ts', line_start: 50, line_end: 40, attributes: {} },
    ];

    expect(() => validateEvidenceAnchors(entities)).toThrow(/invalid line_end/i);
  });

  it('skips E15 (no native evidence requirement)', () => {
    // E15 modules use witness file evidence, so they shouldn't fail validation
    const entities: EntityInput[] = [
      { entity_type: 'E15', instance_id: 'MOD-src/services', source_file: '', line_start: 0, line_end: 0, attributes: {} },
    ];

    expect(() => validateEvidenceAnchors(entities)).not.toThrow();
  });
});
