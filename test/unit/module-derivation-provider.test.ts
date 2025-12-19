// test/unit/module-derivation-provider.test.ts
// Unit tests for E15 Module derivation from E11 directory structure
// @implements STORY-64.1

import { describe, it, expect } from 'vitest';
import {
  deriveModulesFromFiles,
  validateModuleSemantics,
  type SourceFileInput,
} from '../../src/extraction/providers/module-derivation-provider.js';

describe('deriveModulesFromFiles', () => {
  describe('basic derivation', () => {
    it('derives modules from unique parent directories', () => {
      const files: SourceFileInput[] = [
        { instance_id: 'FILE-src/services/entity-service.ts', source_file: '/repo/src/services/entity-service.ts', line_start: 1, line_end: 100 },
        { instance_id: 'FILE-src/services/project-service.ts', source_file: '/repo/src/services/project-service.ts', line_start: 1, line_end: 50 },
        { instance_id: 'FILE-src/db/postgres.ts', source_file: '/repo/src/db/postgres.ts', line_start: 1, line_end: 30 },
      ];

      const modules = deriveModulesFromFiles(files);

      expect(modules).toHaveLength(2); // src/services and src/db
      expect(modules.map(m => m.instance_id).sort()).toEqual([
        'MOD-src/db',
        'MOD-src/services',
      ]);
    });

    it('skips root-level files (dirname is "." or empty)', () => {
      const files: SourceFileInput[] = [
        { instance_id: 'FILE-package.json', source_file: '/repo/package.json', line_start: 1, line_end: 50 },
        { instance_id: 'FILE-tsconfig.json', source_file: '/repo/tsconfig.json', line_start: 1, line_end: 20 },
        { instance_id: 'FILE-src/index.ts', source_file: '/repo/src/index.ts', line_start: 1, line_end: 10 },
      ];

      const modules = deriveModulesFromFiles(files);

      expect(modules).toHaveLength(1);
      expect(modules[0].instance_id).toBe('MOD-src');
    });

    it('returns empty array when no files provided', () => {
      const modules = deriveModulesFromFiles([]);
      expect(modules).toHaveLength(0);
    });

    it('returns empty array when all files are root-level', () => {
      const files: SourceFileInput[] = [
        { instance_id: 'FILE-package.json', source_file: '/repo/package.json', line_start: 1, line_end: 50 },
        { instance_id: 'FILE-.gitignore', source_file: '/repo/.gitignore', line_start: 1, line_end: 10 },
      ];

      const modules = deriveModulesFromFiles(files);
      expect(modules).toHaveLength(0);
    });
  });

  describe('witness file selection', () => {
    it('uses lexicographically smallest instance_id as witness', () => {
      const files: SourceFileInput[] = [
        { instance_id: 'FILE-src/services/z-service.ts', source_file: '/repo/src/services/z-service.ts', line_start: 100, line_end: 200 },
        { instance_id: 'FILE-src/services/a-service.ts', source_file: '/repo/src/services/a-service.ts', line_start: 1, line_end: 50 },
        { instance_id: 'FILE-src/services/m-service.ts', source_file: '/repo/src/services/m-service.ts', line_start: 500, line_end: 600 },
      ];

      const modules = deriveModulesFromFiles(files);

      expect(modules).toHaveLength(1);
      const mod = modules[0];
      expect(mod.instance_id).toBe('MOD-src/services');
      // Evidence should come from a-service.ts (lexicographically first)
      expect(mod.source_file).toBe('/repo/src/services/a-service.ts');
      expect(mod.line_start).toBe(1);
      expect(mod.line_end).toBe(50);
    });

    it('witness selection is deterministic', () => {
      const files: SourceFileInput[] = [
        { instance_id: 'FILE-src/db/b.ts', source_file: '/repo/src/db/b.ts', line_start: 50, line_end: 100 },
        { instance_id: 'FILE-src/db/a.ts', source_file: '/repo/src/db/a.ts', line_start: 1, line_end: 30 },
      ];

      // Run multiple times to verify determinism
      for (let i = 0; i < 5; i++) {
        const modules = deriveModulesFromFiles(files);
        expect(modules[0].source_file).toBe('/repo/src/db/a.ts');
      }
    });
  });

  describe('attributes', () => {
    it('sets derived_from = "directory-structure"', () => {
      const files: SourceFileInput[] = [
        { instance_id: 'FILE-src/index.ts', source_file: '/repo/src/index.ts', line_start: 1, line_end: 10 },
      ];

      const modules = deriveModulesFromFiles(files);

      expect(modules[0].attributes.derived_from).toBe('directory-structure');
    });

    it('sets path attribute to normalized directory path', () => {
      const files: SourceFileInput[] = [
        { instance_id: 'FILE-src/services/entity-service.ts', source_file: '/repo/src/services/entity-service.ts', line_start: 1, line_end: 100 },
      ];

      const modules = deriveModulesFromFiles(files);

      expect(modules[0].attributes.path).toBe('src/services');
    });

    it('sets file_count to number of files in directory', () => {
      const files: SourceFileInput[] = [
        { instance_id: 'FILE-src/services/a.ts', source_file: '/repo/src/services/a.ts', line_start: 1, line_end: 10 },
        { instance_id: 'FILE-src/services/b.ts', source_file: '/repo/src/services/b.ts', line_start: 1, line_end: 20 },
        { instance_id: 'FILE-src/services/c.ts', source_file: '/repo/src/services/c.ts', line_start: 1, line_end: 30 },
      ];

      const modules = deriveModulesFromFiles(files);

      expect(modules[0].attributes.file_count).toBe(3);
    });
  });

  describe('path normalization', () => {
    it('handles mixed forward and backslashes in paths', () => {
      // Note: instance_ids should use forward slashes. If backslashes are present
      // in the path component after FILE-, they won't be recognized as directory separators
      // by path.posix.dirname, so the file will be treated as root-level (no module).
      // This test verifies that forward-slash paths work correctly.
      const files: SourceFileInput[] = [
        { instance_id: 'FILE-src/services/entity.ts', source_file: 'C:\\repo\\src\\services\\entity.ts', line_start: 1, line_end: 100 },
      ];

      const modules = deriveModulesFromFiles(files);

      expect(modules).toHaveLength(1);
      expect(modules[0].instance_id).toBe('MOD-src/services');
    });

    it('removes leading ./ from paths', () => {
      const files: SourceFileInput[] = [
        { instance_id: 'FILE-./src/index.ts', source_file: '/repo/src/index.ts', line_start: 1, line_end: 10 },
      ];

      const modules = deriveModulesFromFiles(files);

      expect(modules[0].attributes.path).toBe('src');
    });

    it('removes trailing / from paths', () => {
      const files: SourceFileInput[] = [
        { instance_id: 'FILE-src/index.ts', source_file: '/repo/src/index.ts', line_start: 1, line_end: 10 },
      ];

      const modules = deriveModulesFromFiles(files);

      expect(modules[0].attributes.path).not.toMatch(/\/$/);
    });
  });
});

describe('validateModuleSemantics', () => {
  const validE11Files: SourceFileInput[] = [
    { instance_id: 'FILE-src/services/entity.ts', source_file: '/repo/src/services/entity.ts', line_start: 1, line_end: 100 },
    { instance_id: 'FILE-src/db/postgres.ts', source_file: '/repo/src/db/postgres.ts', line_start: 1, line_end: 50 },
  ];

  it('validates MOD-<dir> when FILE-<dir>/... exists', () => {
    const modules = [
      { entity_type: 'E15', instance_id: 'MOD-src/services', name: 'src/services', attributes: {}, source_file: '', line_start: 1, line_end: 1 },
      { entity_type: 'E15', instance_id: 'MOD-src/db', name: 'src/db', attributes: {}, source_file: '', line_start: 1, line_end: 1 },
    ];

    const result = validateModuleSemantics(modules, validE11Files);

    expect(result.valid).toHaveLength(2);
    expect(result.invalid).toHaveLength(0);
  });

  it('rejects MOD-<dir> when no FILE-<dir>/... exists', () => {
    const modules = [
      { entity_type: 'E15', instance_id: 'MOD-src/services', name: 'src/services', attributes: {}, source_file: '', line_start: 1, line_end: 1 },
      { entity_type: 'E15', instance_id: 'MOD-pg', name: 'pg', attributes: {}, source_file: '', line_start: 1, line_end: 1 },
      { entity_type: 'E15', instance_id: 'MOD-neo4j-driver', name: 'neo4j-driver', attributes: {}, source_file: '', line_start: 1, line_end: 1 },
    ];

    const result = validateModuleSemantics(modules, validE11Files);

    expect(result.valid).toHaveLength(1);
    expect(result.valid[0].instance_id).toBe('MOD-src/services');
    expect(result.invalid).toHaveLength(2);
    expect(result.invalid.map(m => m.instance_id).sort()).toEqual(['MOD-neo4j-driver', 'MOD-pg']);
  });

  it('eliminates npm packages (no backing E11 files)', () => {
    // This is the key test - npm packages like 'pg', 'neo4j-driver' will never
    // have corresponding FILE-pg/... or FILE-neo4j-driver/... in the E11 corpus
    const npmModules = [
      { entity_type: 'E15', instance_id: 'MOD-pg', name: 'pg', attributes: {}, source_file: '', line_start: 1, line_end: 1 },
      { entity_type: 'E15', instance_id: 'MOD-neo4j-driver', name: 'neo4j-driver', attributes: {}, source_file: '', line_start: 1, line_end: 1 },
      { entity_type: 'E15', instance_id: 'MOD-vitest', name: 'vitest', attributes: {}, source_file: '', line_start: 1, line_end: 1 },
    ];

    const result = validateModuleSemantics(npmModules, validE11Files);

    expect(result.valid).toHaveLength(0);
    expect(result.invalid).toHaveLength(3);
  });

  it('rejects modules without MOD- prefix', () => {
    const modules = [
      { entity_type: 'E15', instance_id: 'src/services', name: 'src/services', attributes: {}, source_file: '', line_start: 1, line_end: 1 },
    ];

    const result = validateModuleSemantics(modules, validE11Files);

    expect(result.valid).toHaveLength(0);
    expect(result.invalid).toHaveLength(1);
  });

  it('returns empty valid and invalid arrays when no modules provided', () => {
    const result = validateModuleSemantics([], validE11Files);

    expect(result.valid).toHaveLength(0);
    expect(result.invalid).toHaveLength(0);
  });
});
