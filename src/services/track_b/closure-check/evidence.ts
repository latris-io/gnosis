/**
 * B.4 Evidence Writer
 *
 * Writes evidence artifacts to:
 * 1. Run-specific directory: docs/verification/track_b/runs/<run_id>/
 * 2. Latest path (copy): docs/verification/track_b/B4_CLOSURE_CHECK_EVIDENCE.md
 *
 * Evidence is ALWAYS written, even on failure.
 */

import * as fs from 'fs';
import * as path from 'path';
import type { EvidenceData, ClosureStatus } from './types.js';

// ============================================================
// Evidence Paths
// ============================================================

const LATEST_EVIDENCE_PATH =
  'docs/verification/track_b/B4_CLOSURE_CHECK_EVIDENCE.md';

function getRunEvidencePath(runId: string): string {
  return `docs/verification/track_b/runs/${runId}/B4_CLOSURE_CHECK_EVIDENCE.md`;
}

// ============================================================
// Evidence Generation
// ============================================================

function getStatusEmoji(status: ClosureStatus): string {
  switch (status) {
    case 'PASS':
      return '✅';
    case 'FAIL':
      return '❌';
    case 'PRECONDITION_FAILED':
      return '⚠️';
    case 'SHA_DRIFT':
      return '🔄';
    case 'ERROR':
      return '💥';
  }
}

function generateEvidenceMarkdown(data: EvidenceData): string {
  const lines: string[] = [];

  lines.push('# B.4 Closure Check Evidence');
  lines.push('');
  lines.push(
    `**Generated:** ${new Date().toISOString()}  `
  );
  lines.push(
    `**Status:** ${getStatusEmoji(data.status)} ${data.status}  `
  );
  lines.push(`**Run ID:** \`${data.binding.run_id}\``);
  lines.push('');
  lines.push('---');
  lines.push('');

  // Environment Binding
  lines.push('## Environment Binding');
  lines.push('');
  lines.push('| Field | Value |');
  lines.push('|-------|-------|');
  lines.push(`| **PROJECT_ID** | \`${data.binding.project_id}\` |`);
  lines.push(`| **GIT_SHA** | \`${data.binding.git_sha}\` |`);
  lines.push(`| **GIT_BRANCH** | \`${data.binding.git_branch}\` |`);
  lines.push(
    `| **WORKING_TREE_CLEAN** | ${data.binding.working_tree_clean ? '✅ Yes' : '⚠️ No (dirty)'} |`
  );
  lines.push(`| **GRAPH_API_V2_URL** | \`${data.binding.graph_api_v2_url}\` |`);
  lines.push(`| **Started At** | ${data.binding.started_at} |`);
  lines.push('');

  // V2 Health
  lines.push('### V2 API Health');
  lines.push('');
  lines.push('| Field | Value |');
  lines.push('|-------|-------|');
  lines.push(`| **URL** | \`${data.binding.v2_health.url}\` |`);
  lines.push(
    `| **Status** | ${data.binding.v2_health.status === 'ok' ? '✅ ok' : '❌ unreachable'} |`
  );
  lines.push(`| **Checked At** | ${data.binding.v2_health.checked_at} |`);
  if (data.binding.v2_health.response_time_ms !== undefined) {
    lines.push(
      `| **Response Time** | ${data.binding.v2_health.response_time_ms}ms |`
    );
  }
  lines.push('');

  // Provenance Validation
  lines.push('---');
  lines.push('');
  lines.push('## Provenance Validation');
  lines.push('');
  lines.push(
    `**Result:** ${data.provenance.valid ? '✅ VALID' : '❌ INVALID'}`
  );
  lines.push('');

  // Extraction Provenance
  lines.push('### Extraction Provenance');
  lines.push('');
  lines.push('| Field | Value |');
  lines.push('|-------|-------|');
  lines.push(`| **Path** | \`${data.provenance.extraction_provenance.path}\` |`);
  lines.push(
    `| **Exists** | ${data.provenance.extraction_provenance.exists ? '✅' : '❌'} |`
  );
  lines.push(
    `| **Parseable** | ${data.provenance.extraction_provenance.parseable ? '✅' : '❌'} |`
  );
  lines.push(
    `| **Project ID Matches** | ${data.provenance.extraction_provenance.project_id_matches ? '✅' : '❌'} |`
  );
  lines.push(
    `| **SHA Matches** | ${data.provenance.extraction_provenance.git_sha_matches ? '✅' : '❌'} |`
  );
  lines.push(
    `| **Found SHA** | \`${data.provenance.extraction_provenance.found_sha ?? 'N/A'}\` |`
  );
  lines.push('');

  // Operator Evidence
  lines.push('### Operator Evidence');
  lines.push('');
  lines.push('| Field | Value |');
  lines.push('|-------|-------|');
  lines.push(`| **Path** | \`${data.provenance.operator_evidence.path}\` |`);
  lines.push(
    `| **Exists** | ${data.provenance.operator_evidence.exists ? '✅' : '❌'} |`
  );
  lines.push(
    `| **Parseable** | ${data.provenance.operator_evidence.parseable ? '✅' : '❌'} |`
  );
  lines.push(
    `| **Project ID Matches** | ${data.provenance.operator_evidence.project_id_matches ? '✅' : '❌'} |`
  );
  lines.push(
    `| **SHA Matches** | ${data.provenance.operator_evidence.git_sha_matches ? '✅' : '❌'} |`
  );
  lines.push(
    `| **Found SHA** | \`${data.provenance.operator_evidence.found_sha ?? 'N/A'}\` |`
  );
  lines.push('');

  if (data.provenance.errors.length > 0) {
    lines.push('### Provenance Errors');
    lines.push('');
    for (const err of data.provenance.errors) {
      lines.push(`- ${err}`);
    }
    lines.push('');
  }

  // SHA Drift (if applicable)
  if (data.status === 'SHA_DRIFT' && data.detected_sha) {
    lines.push('---');
    lines.push('');
    lines.push('## SHA Drift Detected');
    lines.push('');
    lines.push('| Field | Value |');
    lines.push('|-------|-------|');
    lines.push(`| **Expected SHA** | \`${data.binding.git_sha}\` |`);
    lines.push(`| **Detected SHA** | \`${data.detected_sha}\` |`);
    lines.push('');
    lines.push(
      '> ⚠️ Git SHA changed between ingestion phases. Closure cannot proceed.'
    );
    lines.push('');
  }

  // Snapshots (if available)
  if (data.snapshot1 || data.snapshot2) {
    lines.push('---');
    lines.push('');
    lines.push('## Snapshots');
    lines.push('');

    if (data.snapshot1) {
      lines.push('### Snapshot 1 (AFTER_1)');
      lines.push('');
      lines.push('| Field | Value |');
      lines.push('|-------|-------|');
      lines.push(`| **ID** | \`${data.snapshot1.id}\` |`);
      lines.push(`| **Entity Count** | ${data.snapshot1.entity_count} |`);
      lines.push(
        `| **Relationship Count** | ${data.snapshot1.relationship_count} |`
      );
      lines.push(
        `| **Entity Merkle Root** | \`${data.snapshot1.entity_merkle_root.slice(0, 16)}...\` |`
      );
      lines.push(
        `| **Relationship Merkle Root** | \`${data.snapshot1.relationship_merkle_root.slice(0, 16)}...\` |`
      );
      lines.push('');
    }

    if (data.snapshot2) {
      lines.push('### Snapshot 2 (AFTER_2)');
      lines.push('');
      lines.push('| Field | Value |');
      lines.push('|-------|-------|');
      lines.push(`| **ID** | \`${data.snapshot2.id}\` |`);
      lines.push(`| **Entity Count** | ${data.snapshot2.entity_count} |`);
      lines.push(
        `| **Relationship Count** | ${data.snapshot2.relationship_count} |`
      );
      lines.push(
        `| **Entity Merkle Root** | \`${data.snapshot2.entity_merkle_root.slice(0, 16)}...\` |`
      );
      lines.push(
        `| **Relationship Merkle Root** | \`${data.snapshot2.relationship_merkle_root.slice(0, 16)}...\` |`
      );
      lines.push('');
    }
  }

  // Explicit Comparison (if available)
  if (data.comparison) {
    lines.push('---');
    lines.push('');
    lines.push('## Explicit Comparison');
    lines.push('');
    lines.push('| Check | Snapshot 1 | Snapshot 2 | Match |');
    lines.push('|-------|------------|------------|-------|');
    lines.push(
      `| Entity Count | ${data.comparison.entity_count_1} | ${data.comparison.entity_count_2} | ${data.comparison.counts_match ? '✅' : '❌'} |`
    );
    lines.push(
      `| Relationship Count | ${data.comparison.relationship_count_1} | ${data.comparison.relationship_count_2} | ${data.comparison.counts_match ? '✅' : '❌'} |`
    );
    lines.push(
      `| Entity Merkle Root | \`${data.comparison.entity_merkle_root_1.slice(0, 12)}...\` | \`${data.comparison.entity_merkle_root_2.slice(0, 12)}...\` | ${data.comparison.entity_roots_match ? '✅' : '❌'} |`
    );
    lines.push(
      `| Relationship Merkle Root | \`${data.comparison.relationship_merkle_root_1.slice(0, 12)}...\` | \`${data.comparison.relationship_merkle_root_2.slice(0, 12)}...\` | ${data.comparison.relationship_roots_match ? '✅' : '❌'} |`
    );
    lines.push('');
    lines.push(`**Drift Items:** ${data.comparison.drift_items}`);
    lines.push('');
  }

  // Gate Result (if available)
  if (data.gateResult) {
    lines.push('---');
    lines.push('');
    lines.push('## G-CLOSURE Gate');
    lines.push('');
    lines.push(
      `**Result:** ${data.gateResult.pass ? '✅ PASS' : '❌ FAIL'}`
    );
    lines.push('');
    lines.push('| Check | Result |');
    lines.push('|-------|--------|');
    lines.push(
      `| Provenance OK | ${data.gateResult.provenance_ok ? '✅' : '❌'} |`
    );
    lines.push(`| SHA OK | ${data.gateResult.sha_ok ? '✅' : '❌'} |`);
    lines.push(
      `| Counts Match | ${data.gateResult.counts_match ? '✅' : '❌'} |`
    );
    lines.push(
      `| Entity Roots Match | ${data.gateResult.entity_roots_match ? '✅' : '❌'} |`
    );
    lines.push(
      `| Relationship Roots Match | ${data.gateResult.relationship_roots_match ? '✅' : '❌'} |`
    );
    lines.push(`| Drift Items | ${data.gateResult.drift_items} |`);
    lines.push('');

    if (data.gateResult.failure_reasons.length > 0) {
      lines.push('### Failure Reasons');
      lines.push('');
      for (const reason of data.gateResult.failure_reasons) {
        lines.push(`- ${reason}`);
      }
      lines.push('');
    }
  }

  // Error (if applicable)
  if (data.error) {
    lines.push('---');
    lines.push('');
    lines.push('## Error');
    lines.push('');
    lines.push('```');
    lines.push(data.error);
    lines.push('```');
    lines.push('');
  }

  // Commands
  lines.push('---');
  lines.push('');
  lines.push('## Commands Executed');
  lines.push('');
  lines.push('```bash');
  lines.push('# Full Track A Pipeline (executed twice)');
  lines.push('npx tsx scripts/run-a1-extraction.ts');
  lines.push('npx tsx scripts/register-track-b-tdds.ts');
  lines.push('```');
  lines.push('');

  // Verification
  lines.push('---');
  lines.push('');
  lines.push('## Verification');
  lines.push('');
  lines.push('```bash');
  lines.push('# Ledger entries for this run');
  lines.push(
    `grep '"run_id":"${data.binding.run_id}"' shadow-ledger/${data.binding.project_id}/ledger.jsonl`
  );
  lines.push('```');
  lines.push('');

  return lines.join('\n');
}

// ============================================================
// Write Evidence (Always writes, even on failure)
// ============================================================

export async function writeEvidence(data: EvidenceData): Promise<{
  run_path: string;
  latest_path: string;
}> {
  const markdown = generateEvidenceMarkdown(data);

  // 1. Write to run-specific directory
  const runPath = getRunEvidencePath(data.binding.run_id);
  const runDir = path.dirname(runPath);
  await fs.promises.mkdir(runDir, { recursive: true });
  await fs.promises.writeFile(runPath, markdown, 'utf-8');

  // 2. Copy to latest (overwrites)
  await fs.promises.writeFile(LATEST_EVIDENCE_PATH, markdown, 'utf-8');

  return {
    run_path: runPath,
    latest_path: LATEST_EVIDENCE_PATH,
  };
}

// ============================================================
// Exports
// ============================================================

export { getRunEvidencePath, LATEST_EVIDENCE_PATH };

