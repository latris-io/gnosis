// test/pipeline/pipeline.integration.test.ts
// @implements STORY-64.4
// @tdd TDD-A4-STRUCTURAL-ANALYSIS
//
// INTEGRATION TESTS - Full pipeline execution (~8-10 minutes)
// Run with: npm run test:pipeline:integration
//
// These tests are NOT run by default `npm test`.
// They require database connections and run the full extraction pipeline.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'crypto';
import { runPipeline } from '../../src/ops/pipeline.js';
import { closeConnections } from '../../src/ops/track-a.js';
import type { PipelineConfig, PipelineResult } from '../../src/pipeline/types.js';
import { createTestProject, deleteProjectEntities, deleteProjectRelationships, deleteProject } from '../utils/admin-test-only.js';

// Integration tests need adequate time - 10 minutes
const INTEGRATION_TIMEOUT = 600000;

describe('Structural Analysis Pipeline - Integration', () => {
  let projectId: string;
  let cachedResult: PipelineResult | null = null;
  
  beforeAll(async () => {
    projectId = randomUUID();
    console.log(`[INTEGRATION] Creating test project: ${projectId}`);
    await createTestProject(projectId, 'pipeline-integration-test');
  }, 60000);
  
  afterAll(async () => {
    if (projectId) {
      try {
        console.log(`[INTEGRATION] Cleaning up project: ${projectId}`);
        await deleteProjectRelationships(projectId);
        await deleteProjectEntities(projectId);
        await deleteProject(projectId);
      } catch (e) {
        console.warn('Cleanup warning:', e);
      }
      
      try {
        await closeConnections();
      } catch (e) {
        console.warn('Connection close warning:', e);
      }
    }
  }, 60000);
  
  // Helper to get cached pipeline result or run once
  async function getPipelineResult(): Promise<PipelineResult> {
    if (cachedResult) return cachedResult;
    
    console.log('[PIPELINE] Starting full extraction...');
    const startTime = Date.now();
    
    const config: PipelineConfig = {
      project_id: projectId,
      repo_path: process.cwd(),
      incremental: false,
      fail_fast: false,
    };
    
    cachedResult = await runPipeline(config);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[PIPELINE] Completed in ${duration}s`);
    console.log(`[PIPELINE] Stages: ${cachedResult.stages.length}, Success: ${cachedResult.success}`);
    
    // Log any stage failures for debugging
    for (const stage of cachedResult.stages) {
      if (!stage.success) {
        console.error(`[PIPELINE] Stage ${stage.stage} FAILED:`, stage.errors);
      }
    }
    
    return cachedResult;
  }
  
  // VERIFY-PIPELINE-01: Orchestrates all providers
  it('executes all extraction providers successfully', async () => {
    const result = await getPipelineResult();
    
    // Pipeline must succeed
    expect(result.success, 'Pipeline must succeed').toBe(true);
    
    const expectedStages = [
      'SNAPSHOT', 'FILESYSTEM', 'BRD', 'AST', 'MODULE', 'GIT',
      'MARKERS', 'BRD_REL', 'CONTAINMENT_REL', 'TDD_REL', 'AST_REL',
      'TEST_REL', 'GIT_REL', 'VALIDATE'
    ];
    
    for (const stage of expectedStages) {
      const stageResult = result.stages.find(s => s.stage === stage);
      expect(stageResult, `Stage ${stage} should be present`).toBeDefined();
      expect(stageResult!.success, `Stage ${stage} must succeed. Errors: ${stageResult!.errors.join(', ')}`).toBe(true);
    }
  }, INTEGRATION_TIMEOUT);
  
  // VERIFY-PIPELINE-02: Dependency order
  it('executes providers in dependency order', async () => {
    const result = await getPipelineResult();
    const stageOrder = result.stages.map(s => s.stage);
    
    expect(stageOrder.indexOf('FILESYSTEM')).toBeLessThan(stageOrder.indexOf('AST'));
    expect(stageOrder.indexOf('BRD')).toBeLessThan(stageOrder.indexOf('BRD_REL'));
    expect(stageOrder.indexOf('AST')).toBeLessThan(stageOrder.indexOf('AST_REL'));
    expect(stageOrder.indexOf('MARKERS')).toBeLessThan(stageOrder.indexOf('AST_REL'));
    expect(stageOrder.indexOf('GIT')).toBeLessThan(stageOrder.indexOf('GIT_REL'));
  }, INTEGRATION_TIMEOUT);
  
  // VERIFY-PIPELINE-03: Handles failures gracefully
  it('handles provider failures gracefully with fail_fast=false', async () => {
    const config: PipelineConfig = {
      project_id: projectId,
      repo_path: '/nonexistent/path/that/does/not/exist',
      incremental: false,
      fail_fast: false,
    };
    
    const result = await runPipeline(config);
    
    // Pipeline should complete (not throw)
    expect(result).toBeDefined();
    // Some stages will fail due to invalid path
    expect(result.success).toBe(false);
    expect(result.stages.some(s => !s.success)).toBe(true);
  }, 120000);
  
  // VERIFY-PIPELINE-04: Reports statistics
  it('reports extraction statistics', async () => {
    const result = await getPipelineResult();
    
    expect(result.statistics).toBeDefined();
    expect(result.statistics.total_entities).toBeGreaterThanOrEqual(0);
    expect(result.statistics.entities_by_type).toBeDefined();
    expect(typeof result.statistics.entities_by_type).toBe('object');
    expect(result.statistics.total_relationships).toBeGreaterThanOrEqual(0);
    expect(result.statistics.relationships_by_type).toBeDefined();
  }, INTEGRATION_TIMEOUT);
  
  // VERIFY-PIPELINE-05: Evaluates integrity signals
  it('evaluates structural integrity signals with findings', async () => {
    const result = await getPipelineResult();
    
    expect(result.integrity_check).toBeDefined();
    expect(result.integrity_check.findings).toBeDefined();
    expect(Array.isArray(result.integrity_check.findings)).toBe(true);
    expect(result.integrity_check.findings.length).toBeGreaterThan(0);
    expect(result.integrity_check.summary).toBeDefined();
    
    // Each finding should have required fields
    for (const finding of result.integrity_check.findings) {
      expect(finding.name).toBeDefined();
      expect(['info', 'warning', 'critical']).toContain(finding.severity);
      expect(finding.message).toBeDefined();
    }
  }, INTEGRATION_TIMEOUT);
  
  // VERIFY-PIPELINE-07: Creates snapshot
  it('creates snapshot before extraction', async () => {
    const result = await getPipelineResult();
    
    expect(result.snapshot_id).toBeDefined();
    expect(result.snapshot_id).toMatch(/^snapshot-\d+-[a-f0-9]+$/);
  }, INTEGRATION_TIMEOUT);
  
  // AC-64.4.10: Performance verification
  it('completes within acceptable time bounds', async () => {
    const result = await getPipelineResult();
    
    // Pipeline should complete in under 15 minutes
    expect(result.total_duration_ms).toBeLessThan(15 * 60 * 1000);
    
    console.log(`[PERFORMANCE] Total duration: ${(result.total_duration_ms / 1000).toFixed(1)}s`);
  }, INTEGRATION_TIMEOUT);
});

