// test/pipeline/pipeline.test.ts
// @implements STORY-64.4
// @tdd TDD-A4-STRUCTURAL-ANALYSIS
//
// UNIT TESTS - Fast, no database required (~5s)
// Run with: npm test
//
// For integration tests (full pipeline), see: pipeline.integration.test.ts
// Run integration with: npm run test:pipeline:integration

import { describe, it, expect } from 'vitest';
import { getAvailableStages, validateConfig } from '../../src/ops/pipeline.js';

describe('Structural Analysis Pipeline - Unit Tests', () => {
  
  // ============================================================
  // Configuration Validation Tests
  // ============================================================
  
  describe('Configuration Validation', () => {
    it('validates required fields', () => {
      const result = validateConfig({
        project_id: '',
        repo_path: '',
        incremental: false,
        fail_fast: true,
      });
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('project_id is required');
      expect(result.errors).toContain('repo_path is required');
    });
    
    it('validates skip_stages values', () => {
      const result = validateConfig({
        project_id: 'test',
        repo_path: '.',
        incremental: false,
        fail_fast: true,
        skip_stages: ['INVALID_STAGE' as any],
      });
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid skip stage'))).toBe(true);
    });
    
    it('accepts valid configuration', () => {
      const result = validateConfig({
        project_id: 'test-project-id',
        repo_path: process.cwd(),
        incremental: false,
        fail_fast: true,
        skip_stages: ['GIT'],
      });
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('accepts incremental mode', () => {
      const result = validateConfig({
        project_id: 'test',
        repo_path: '.',
        incremental: true,
        fail_fast: false,
      });
      
      expect(result.valid).toBe(true);
    });
    
    // VERIFY-PIPELINE-03 (Unit): fail_fast config validation
    it('fail_fast configuration is validated', () => {
      const strictConfig = validateConfig({
        project_id: 'test',
        repo_path: '.',
        incremental: false,
        fail_fast: true,
      });
      expect(strictConfig.valid).toBe(true);
      
      const tolerantConfig = validateConfig({
        project_id: 'test',
        repo_path: '.',
        incremental: false,
        fail_fast: false,
      });
      expect(tolerantConfig.valid).toBe(true);
    });
  });
  
  // ============================================================
  // Stage Management Tests
  // ============================================================
  
  describe('Stage Management', () => {
    // VERIFY-PIPELINE-01 (Unit): Correct stage list
    it('returns correct list of available stages', () => {
      const stages = getAvailableStages();
      
      expect(stages).toContain('SNAPSHOT');
      expect(stages).toContain('FILESYSTEM');
      expect(stages).toContain('BRD');
      expect(stages).toContain('AST');
      expect(stages).toContain('MODULE');
      expect(stages).toContain('TEST');
      expect(stages).toContain('GIT');
      expect(stages).toContain('MARKERS');
      expect(stages).toContain('BRD_REL');
      expect(stages).toContain('CONTAINMENT_REL');
      expect(stages).toContain('TDD_REL');
      expect(stages).toContain('AST_REL');
      expect(stages).toContain('TEST_REL');
      expect(stages).toContain('GIT_REL');
      expect(stages).toContain('VALIDATE');
      expect(stages.length).toBe(15);
    });
    
    // VERIFY-PIPELINE-02 (Unit): Dependency order via stage list
    it('stages are in dependency order', () => {
      const stages = getAvailableStages();
      
      // SNAPSHOT first (creates git state)
      expect(stages.indexOf('SNAPSHOT')).toBe(0);
      
      // Entity extraction before relationship extraction
      expect(stages.indexOf('FILESYSTEM')).toBeLessThan(stages.indexOf('BRD_REL'));
      expect(stages.indexOf('BRD')).toBeLessThan(stages.indexOf('BRD_REL'));
      expect(stages.indexOf('AST')).toBeLessThan(stages.indexOf('AST_REL'));
      expect(stages.indexOf('MARKERS')).toBeLessThan(stages.indexOf('AST_REL'));
      
      // Relationship stages after entity stages
      expect(stages.indexOf('GIT')).toBeLessThan(stages.indexOf('GIT_REL'));
      expect(stages.indexOf('MODULE')).toBeLessThan(stages.indexOf('CONTAINMENT_REL'));
      
      // VALIDATE last (integrity check after all extraction)
      expect(stages.indexOf('VALIDATE')).toBe(stages.length - 1);
    });
    
    // VERIFY-PIPELINE-06 (Unit): Incremental config validation
    it('incremental configuration is validated', () => {
      const incrConfig = validateConfig({
        project_id: 'test',
        repo_path: '.',
        incremental: true,
        fail_fast: false,
      });
      expect(incrConfig.valid).toBe(true);
    });
  });
});
