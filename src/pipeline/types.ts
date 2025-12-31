// src/pipeline/types.ts
// @implements STORY-64.4
// @tdd TDD-A4-STRUCTURAL-ANALYSIS
// NOTE: Infrastructure modules do not carry @satisfies markers.
// Only ast-relationship-provider.ts carries @satisfies AC-64.4.1/2/3.

import type { ExtractedEntity, ExtractedRelationship, RepoSnapshot } from '../extraction/types.js';

/**
 * Pipeline execution stages in dependency order.
 * Per A4 story card v2.1.0
 */
export type PipelineStage =
  | 'SNAPSHOT'
  | 'FILESYSTEM'
  | 'BRD'
  | 'AST'
  | 'MODULE'
  | 'TEST'
  | 'GIT'
  | 'MARKERS'
  | 'BRD_REL'
  | 'CONTAINMENT_REL'
  | 'TDD_REL'
  | 'AST_REL'
  | 'TEST_REL'
  | 'GIT_REL'
  | 'VALIDATE';

/**
 * Pipeline configuration options.
 */
export interface PipelineConfig {
  project_id: string;
  repo_path: string;
  incremental: boolean;
  skip_stages?: PipelineStage[];
  fail_fast: boolean;
}

/**
 * Result of a single pipeline stage execution.
 */
export interface StageResult {
  stage: PipelineStage;
  success: boolean;
  duration_ms: number;
  entities_created: number;
  relationships_created: number;
  errors: string[];
  warnings: string[];
}

/**
 * Complete pipeline execution result.
 */
export interface PipelineResult {
  snapshot_id: string;
  success: boolean;
  total_duration_ms: number;
  stages: StageResult[];
  statistics: ExtractionStatistics;
  integrity_check: IntegrityResult;
}

/**
 * Statistics about the extraction run.
 */
export interface ExtractionStatistics {
  total_entities: number;
  entities_by_type: Record<string, number>;
  total_relationships: number;
  relationships_by_type: Record<string, number>;
  orphan_entities: number;
  orphan_markers: number;
}

/**
 * Integrity evaluation result.
 * Uses "findings" (not "checks") per epistemic hygiene.
 * Findings are signals for human gate review, not oracle assertions.
 */
export interface IntegrityResult {
  findings: IntegrityFinding[];
  summary: string;
}

/**
 * A single integrity finding with severity.
 * Severity levels:
 * - info: informational, no action required
 * - warning: potential issue, human should review
 * - critical: likely integrity violation, requires investigation
 */
export interface IntegrityFinding {
  name: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  evidence?: Record<string, unknown>;
}

/**
 * Change set for incremental extraction.
 * Track A does NOT delete from graph during incremental runs.
 * Deleted paths are tracked and surfaced as integrity findings.
 */
export interface ChangeSet {
  additions: ExtractedEntity[];
  modifications: ExtractedEntity[];
  deleted_paths: string[];
}

/**
 * Extended RepoSnapshot with project_id for pipeline context.
 */
export interface PipelineSnapshot extends RepoSnapshot {
  project_id: string;
}

/**
 * Stage provider interface for pipeline orchestration.
 * Providers must be pure functions that emit entities/relationships
 * without direct DB access (except service-layer modules).
 */
export interface StageProvider {
  name: string;
  stage: PipelineStage;
  execute(
    snapshot: PipelineSnapshot,
    config: PipelineConfig
  ): Promise<{
    entities: ExtractedEntity[];
    relationships: ExtractedRelationship[];
    warnings?: string[];
  }>;
}

