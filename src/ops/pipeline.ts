// src/ops/pipeline.ts
// @implements STORY-64.4
// @tdd TDD-A4-STRUCTURAL-ANALYSIS
// NOTE: Infrastructure modules do not carry @satisfies markers.
// Only ast-relationship-provider.ts carries @satisfies AC-64.4.1/2/3.
//
// Pipeline ops entrypoint - INTERNAL only, NOT public API.
// Per A4 spec: "DO NOT create src/api/v1/pipeline.ts (must not be public API)"

import type { PipelineConfig, PipelineResult, PipelineStage } from '../pipeline/types.js';
import { executePipeline, PipelineOrchestrator } from '../pipeline/orchestrator.js';
import { closeConnections } from '../services/connections/connection-service.js';

// Re-export types for convenience
export type { PipelineConfig, PipelineResult, PipelineStage };
export { PipelineOrchestrator };

/**
 * Run the full extraction pipeline.
 * 
 * This is the main entry point for pipeline execution.
 * 
 * @param config - Pipeline configuration
 * @returns Pipeline execution result with statistics and integrity findings
 */
export async function runPipeline(config: PipelineConfig): Promise<PipelineResult> {
  return executePipeline(config);
}

/**
 * Run the pipeline with default configuration.
 * 
 * Convenience function for common use case.
 * 
 * @param projectId - Project UUID
 * @param repoPath - Path to repository (defaults to current directory)
 * @param options - Optional configuration overrides
 */
export async function runDefaultPipeline(
  projectId: string,
  repoPath: string = process.cwd(),
  options: {
    incremental?: boolean;
    skipStages?: PipelineStage[];
    failFast?: boolean;
  } = {}
): Promise<PipelineResult> {
  const config: PipelineConfig = {
    project_id: projectId,
    repo_path: repoPath,
    incremental: options.incremental ?? false,
    skip_stages: options.skipStages,
    fail_fast: options.failFast ?? true,
  };
  
  return runPipeline(config);
}

/**
 * Run the pipeline and clean up connections.
 * 
 * Use this for CLI scripts that need to exit cleanly.
 */
export async function runPipelineAndCleanup(config: PipelineConfig): Promise<PipelineResult> {
  try {
    return await runPipeline(config);
  } finally {
    await closeConnections();
  }
}

/**
 * Get available pipeline stages.
 */
export function getAvailableStages(): PipelineStage[] {
  return [
    'SNAPSHOT',
    'FILESYSTEM',
    'BRD',
    'AST',
    'MODULE',
    'TEST',
    'GIT',
    'MARKERS',
    'BRD_REL',
    'CONTAINMENT_REL',
    'TDD_REL',
    'AST_REL',
    'TEST_REL',
    'GIT_REL',
    'VALIDATE',
  ];
}

/**
 * Validate pipeline configuration.
 */
export function validateConfig(config: PipelineConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!config.project_id) {
    errors.push('project_id is required');
  }
  
  if (!config.repo_path) {
    errors.push('repo_path is required');
  }
  
  if (config.skip_stages) {
    const validStages = new Set(getAvailableStages());
    for (const stage of config.skip_stages) {
      if (!validStages.has(stage)) {
        errors.push(`Invalid skip stage: ${stage}`);
      }
    }
  }
  
  return { valid: errors.length === 0, errors };
}

