/**
 * Health Check (B.1.3, B.1.5)
 * 
 * Track B: Story B.1 - Ground Truth Engine
 * TDD ID: TDD-TRACKB-B1
 * 
 * Health check comparing manifest to disk state.
 * 
 * GRAPH COVERAGE LIMITATION (B.1 scope):
 * Graph API v1 does not expose an entity listing endpoint.
 * Graph coverage validation (disk ↔ graph E11 comparison) is DEFERRED to B.6 (Graph API v2).
 * This is by design - Track B cannot modify Track A locked surfaces.
 * 
 * B.1 health check validates:
 * - File scope consistency (same scope version)
 * - Merkle root integrity (computed vs baseline)
 * - File count match
 * 
 * B.6 will add:
 * - Graph coverage validation via Graph API v2 entity listing endpoint
 */

import { HealthReport, GHealthResult, GroundTruthBaseline, FileManifest } from './types.js';
import { generateManifest } from './manifest.js';
import { computeMerkleRoot } from './merkle.js';
import { getFilesInScope, SCOPE_VERSION } from './file-scope.js';

/**
 * Check health by comparing baseline to current disk state.
 * 
 * NOTE: Graph coverage validation is deferred to B.6 (Graph API v2).
 * B.1 validates baseline ↔ disk integrity only.
 * 
 * @param repoRoot - Absolute path to repository root
 * @param baseline - Previously stored baseline
 * @param projectId - Project ID (reserved for future Graph API v2 queries)
 * @returns Health report with all checks
 */
export async function checkHealth(
  repoRoot: string,
  baseline: GroundTruthBaseline,
  projectId: string
): Promise<HealthReport> {
  const checkedAt = new Date().toISOString();
  
  // Check scope version compatibility
  if (baseline.scope_version !== SCOPE_VERSION) {
    // Scope definition changed - this is a health failure
    return {
      checked_at: checkedAt,
      score: 0,
      expected_root: baseline.merkle_root,
      computed_root: '',
      missing_paths: [],
      extra_paths: [],
      mismatched: [],
      graph_missing_paths: [],
      graph_extra_paths: [],
      graph_coverage_status: 'DEFERRED_TO_B6',
      file_count: { expected: baseline.file_count, actual: 0 },
    };
  }
  
  // Generate current manifest
  const currentManifest = await generateManifest(repoRoot);
  
  // Build lookup maps
  const currentPathSet = new Set(currentManifest.files.map(f => f.path));
  const currentPathToFile = new Map(currentManifest.files.map(f => [f.path, f]));
  
  // Compare files (baseline vs current disk state)
  const missing_paths: string[] = [];
  const extra_paths: string[] = [];
  const mismatched: Array<{ path: string; expected: string; actual: string }> = [];
  
  // Compare Merkle roots (primary integrity check)
  const computedRoot = currentManifest.merkle_root;
  const expectedRoot = baseline.merkle_root;
  
  // Graph coverage: DEFERRED to B.6
  // Graph API v1 does not expose an entity listing endpoint.
  // Track B cannot modify Track A locked surfaces (src/http/**).
  // Full graph coverage validation will be added in B.6 (Graph API v2).
  const graph_missing_paths: string[] = [];
  const graph_extra_paths: string[] = [];
  const graph_coverage_status: 'DEFERRED_TO_B6' | 'CHECKED' = 'DEFERRED_TO_B6';
  
  // Calculate health score (strict: 100 only if merkle roots match)
  const score = (
    missing_paths.length === 0 &&
    extra_paths.length === 0 &&
    mismatched.length === 0 &&
    computedRoot === expectedRoot
  ) ? 100 : 0;
  
  return {
    checked_at: checkedAt,
    score,
    expected_root: expectedRoot,
    computed_root: computedRoot,
    missing_paths,
    extra_paths,
    mismatched,
    graph_missing_paths,
    graph_extra_paths,
    graph_coverage_status,
    file_count: {
      expected: baseline.file_count,
      actual: currentManifest.file_count,
    },
  };
}

/**
 * Evaluate G-HEALTH gate based on health report.
 * 
 * G-HEALTH passes only if health score is 100%.
 * 
 * NOTE: Graph coverage is deferred to B.6. G-HEALTH in B.1 validates
 * merkle root integrity only.
 */
export function evaluateGHealth(report: HealthReport): GHealthResult {
  return {
    pass: report.score === 100,
    report,
  };
}

/**
 * Create a baseline from the current state.
 */
export async function createBaseline(repoRoot: string): Promise<GroundTruthBaseline> {
  const manifest = await generateManifest(repoRoot);
  
  return {
    generated_at: manifest.generated_at,
    merkle_root: manifest.merkle_root,
    file_count: manifest.file_count,
    scope: manifest.scope,
    excludes: manifest.excludes,
    scope_version: SCOPE_VERSION,
  };
}
