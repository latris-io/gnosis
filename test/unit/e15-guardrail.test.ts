// test/unit/e15-guardrail.test.ts
// @implements STORY-64.1
// Regression test for E15 semantic guardrail
// Prevents future refactors from weakening the persistence boundary rule

import { describe, it, expect } from 'vitest';
import { validateE15Semantics } from '../../src/ops/track-a.js';
import type { ExtractedEntity } from '../../src/extraction/types.js';

describe('E15 Semantic Guardrail', () => {
  // Helper to create minimal E15 entity
  const makeE15 = (instanceId: string): ExtractedEntity => ({
    entity_type: 'E15',
    instance_id: instanceId,
    name: 'test',
    attributes: {},
    source_file: 'test.ts',
    line_start: 1,
    line_end: 1,
  });

  describe('rejects npm-style (import-derived) E15', () => {
    it('rejects single-segment MOD-yaml', () => {
      const entities = [makeE15('MOD-yaml')];
      expect(() => validateE15Semantics(entities)).toThrow('single-segment (npm-style) not allowed');
    });

    it('rejects single-segment MOD-typescript', () => {
      const entities = [makeE15('MOD-typescript')];
      expect(() => validateE15Semantics(entities)).toThrow('single-segment (npm-style) not allowed');
    });

    it('rejects single-segment MOD-fs', () => {
      const entities = [makeE15('MOD-fs')];
      expect(() => validateE15Semantics(entities)).toThrow('single-segment (npm-style) not allowed');
    });

    it('rejects MOD-neo4j-driver (hyphenated npm package)', () => {
      const entities = [makeE15('MOD-neo4j-driver')];
      expect(() => validateE15Semantics(entities)).toThrow('single-segment (npm-style) not allowed');
    });
  });

  describe('rejects invalid E15 formats', () => {
    it('rejects E15 without MOD- prefix', () => {
      const entities = [makeE15('src/utils')];
      expect(() => validateE15Semantics(entities)).toThrow('missing MOD- prefix');
    });

    it('rejects node_modules paths', () => {
      const entities = [makeE15('MOD-node_modules/yaml')];
      expect(() => validateE15Semantics(entities)).toThrow('node_modules paths not allowed');
    });
  });

  describe('accepts directory-derived E15', () => {
    it('accepts MOD-src/utils', () => {
      const entities = [makeE15('MOD-src/utils')];
      expect(() => validateE15Semantics(entities)).not.toThrow();
    });

    it('accepts MOD-src/extraction/providers', () => {
      const entities = [makeE15('MOD-src/extraction/providers')];
      expect(() => validateE15Semantics(entities)).not.toThrow();
    });

    it('accepts MOD-test/unit', () => {
      const entities = [makeE15('MOD-test/unit')];
      expect(() => validateE15Semantics(entities)).not.toThrow();
    });
  });

  describe('allows non-E15 entities to pass through', () => {
    it('ignores E11 entities', () => {
      const entities: ExtractedEntity[] = [{
        entity_type: 'E11',
        instance_id: 'FILE-src/test.ts',
        name: 'test.ts',
        attributes: {},
        source_file: 'src/test.ts',
        line_start: 1,
        line_end: 100,
      }];
      expect(() => validateE15Semantics(entities)).not.toThrow();
    });

    it('validates only E15 in mixed batch', () => {
      const entities: ExtractedEntity[] = [
        {
          entity_type: 'E11',
          instance_id: 'FILE-src/test.ts',
          name: 'test.ts',
          attributes: {},
          source_file: 'src/test.ts',
          line_start: 1,
          line_end: 100,
        },
        makeE15('MOD-src/utils'), // valid E15
      ];
      expect(() => validateE15Semantics(entities)).not.toThrow();
    });

    it('rejects batch with one invalid E15', () => {
      const entities: ExtractedEntity[] = [
        makeE15('MOD-src/utils'), // valid
        makeE15('MOD-yaml'),       // invalid
      ];
      expect(() => validateE15Semantics(entities)).toThrow('MOD-yaml');
    });
  });

  describe('error message quality', () => {
    it('includes all invalid E15s in error message', () => {
      const entities = [
        makeE15('MOD-yaml'),
        makeE15('MOD-fs'),
        makeE15('MOD-path'),
      ];
      
      try {
        validateE15Semantics(entities);
        expect.fail('Should have thrown');
      } catch (err) {
        const message = (err as Error).message;
        expect(message).toContain('MOD-yaml');
        expect(message).toContain('MOD-fs');
        expect(message).toContain('MOD-path');
        expect(message).toContain('E15 SEMANTIC VIOLATION');
      }
    });
  });
});


