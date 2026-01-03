/**
 * B.4 Provenance Validation
 *
 * Validates provenance artifacts with EXACT SHA match requirement.
 * No older SHAs allowed - both extraction provenance and operator evidence
 * must match the pinned SHA for this run.
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import type {
  RunBinding,
  HealthCheckResult,
  ProvenanceValidationResult,
  ProvenanceArtifactResult,
} from './types.js';

// ============================================================
// Constants
// ============================================================

const EXTRACTION_PROVENANCE_PATH =
  'docs/verification/track_b/EXTRACTION_PROVENANCE.md';
const OPERATOR_EVIDENCE_TEMPLATE =
  'docs/verification/track_b/templates/B4_OPERATOR_EVIDENCE_TEMPLATE.md';

// ============================================================
// Health Check
// ============================================================

export async function checkV2Health(url: string): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    const resp = await fetch(`${url}/health`);
    return {
      checked_at: new Date().toISOString(),
      url,
      status: resp.ok ? 'ok' : 'unreachable',
      response_time_ms: Date.now() - start,
    };
  } catch {
    return {
      checked_at: new Date().toISOString(),
      url,
      status: 'unreachable',
    };
  }
}

// ============================================================
// Run ID Generation
// ============================================================

export function generateRunId(): string {
  return `B4-CLOSURE-${new Date().toISOString().replace(/[:.]/g, '-')}`;
}

// ============================================================
// Run Binding Capture
// ============================================================

export async function captureRunBinding(): Promise<RunBinding> {
  const sha = execSync('git rev-parse HEAD').toString().trim();
  const status = execSync('git status --porcelain').toString().trim();
  const runId = generateRunId();
  const v2Url = process.env.GRAPH_API_V2_URL;

  if (!process.env.PROJECT_ID) {
    throw new Error('PROJECT_ID environment variable required');
  }
  if (!v2Url) {
    throw new Error('GRAPH_API_V2_URL environment variable required');
  }

  const v2Health = await checkV2Health(v2Url);

  let branch = '';
  try {
    branch = execSync('git branch --show-current').toString().trim();
  } catch {
    branch = 'detached';
  }

  return {
    run_id: runId,
    project_id: process.env.PROJECT_ID,
    git_sha: sha,
    git_branch: branch,
    working_tree_clean: status === '',
    graph_api_v2_url: v2Url,
    v2_health: v2Health,
    started_at: new Date().toISOString(),
  };
}

// ============================================================
// SHA Validation
// ============================================================

export function validateShaUnchanged(binding: RunBinding): {
  unchanged: boolean;
  current_sha: string;
} {
  const currentSha = execSync('git rev-parse HEAD').toString().trim();
  return {
    unchanged: currentSha === binding.git_sha,
    current_sha: currentSha,
  };
}

// ============================================================
// Provenance Validation (Exact SHA Match Required)
// ============================================================

export function validateProvenance(
  binding: RunBinding
): ProvenanceValidationResult {
  const errors: string[] = [];

  // 1. EXTRACTION_PROVENANCE.md - exact SHA required
  const extraction: ProvenanceArtifactResult = {
    path: EXTRACTION_PROVENANCE_PATH,
    exists: false,
    parseable: false,
    project_id_matches: false,
    git_sha_matches: false,
    found_sha: null,
  };

  if (!fs.existsSync(EXTRACTION_PROVENANCE_PATH)) {
    errors.push(`Missing: ${EXTRACTION_PROVENANCE_PATH}`);
  } else {
    extraction.exists = true;
    try {
      const content = fs.readFileSync(EXTRACTION_PROVENANCE_PATH, 'utf-8');
      extraction.parseable = true;

      // Extract SHA from provenance (look for commit SHA pattern)
      const shaMatch = content.match(
        /\*\*Commit SHA\*\*\s*\|\s*`([a-f0-9]{40})`/
      );
      extraction.found_sha = shaMatch?.[1] ?? null;

      extraction.project_id_matches = content.includes(binding.project_id);
      extraction.git_sha_matches = extraction.found_sha === binding.git_sha;

      if (!extraction.git_sha_matches) {
        errors.push(
          `EXTRACTION_PROVENANCE.md SHA mismatch: found ${extraction.found_sha?.slice(0, 12) ?? 'none'}..., expected ${binding.git_sha.slice(0, 12)}...`
        );
      }
      if (!extraction.project_id_matches) {
        errors.push(`EXTRACTION_PROVENANCE.md project_id mismatch`);
      }
    } catch (err) {
      errors.push(
        `Failed to parse ${EXTRACTION_PROVENANCE_PATH}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  // 2. Operator evidence - exact SHA required
  const operatorPath = `docs/verification/track_b/B4_OPERATOR_EVIDENCE_${binding.run_id}.md`;
  const operator: ProvenanceArtifactResult = {
    path: operatorPath,
    exists: false,
    parseable: false,
    project_id_matches: false,
    git_sha_matches: false,
    found_sha: null,
  };

  if (!fs.existsSync(operatorPath)) {
    errors.push(`Missing operator evidence: ${operatorPath}`);
    errors.push(`Create from template: ${OPERATOR_EVIDENCE_TEMPLATE}`);
  } else {
    operator.exists = true;
    try {
      const content = fs.readFileSync(operatorPath, 'utf-8');
      operator.parseable = true;

      // Extract SHA from operator evidence
      const shaMatch = content.match(/\*\*GIT_SHA\*\*\s*\|\s*`([a-f0-9]{40})`/);
      operator.found_sha = shaMatch?.[1] ?? null;

      operator.project_id_matches = content.includes(binding.project_id);
      operator.git_sha_matches = operator.found_sha === binding.git_sha;

      if (!operator.git_sha_matches) {
        errors.push(
          `Operator evidence SHA mismatch: found ${operator.found_sha?.slice(0, 12) ?? 'none'}..., expected ${binding.git_sha.slice(0, 12)}...`
        );
      }
      if (!operator.project_id_matches) {
        errors.push(`Operator evidence project_id mismatch`);
      }
    } catch (err) {
      errors.push(
        `Failed to parse ${operatorPath}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  return {
    valid: errors.length === 0,
    extraction_provenance: extraction,
    operator_evidence: operator,
    errors,
  };
}

// ============================================================
// Operator Evidence Path Helper
// ============================================================

export function getOperatorEvidencePath(runId: string): string {
  return `docs/verification/track_b/B4_OPERATOR_EVIDENCE_${runId}.md`;
}

