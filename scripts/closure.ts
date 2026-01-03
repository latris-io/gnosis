#!/usr/bin/env npx tsx
/**
 * B.4 Closure Check CLI
 *
 * Tier: 2 (Operator script)
 * Confirm Flag: --confirm-repair (REQUIRED)
 * Required Env: PROJECT_ID, GRAPH_API_V2_URL
 *
 * Commands:
 *   precheck  - Validate provenance and health only
 *   run       - Full closure run (two ingestions + comparison)
 *
 * Evidence:
 *   Operator: docs/verification/track_b/operator_runs/closure__<TIMESTAMP>__<SHORT_SHA>.md
 *   Gate: docs/verification/track_b/B4_CLOSURE_CHECK_EVIDENCE.md
 *
 * @g-api-exception TRACK_B_OWNED - Track B CLI may import from src/services/track_b/**
 */

import * as path from 'path';
import { fileURLToPath } from 'url';
import { runClosure, runPrecheck } from '../src/services/track_b/closure-check/index.js';

// ============================================================
// Constants
// ============================================================

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

// ============================================================
// CLI Parsing
// ============================================================

function printUsage(): void {
  console.log(`
B.4 Closure Check

Usage:
  npx tsx scripts/closure.ts precheck [--run-id <id>]
  npx tsx scripts/closure.ts run --confirm-repair --run-id <id>

Commands:
  precheck  Validate provenance and V2 health only (no ingestion)
  run       Full closure run (two ingestions + comparison)

Required Environment:
  PROJECT_ID           The project UUID
  GRAPH_API_V2_URL     The Graph API v2 base URL (e.g., http://localhost:3001)

Options:
  --confirm-repair     Required for 'run' command (Tier 2 operator guard)
  --run-id <id>        Required. Pre-generated run ID (format: B4-CLOSURE-<timestamp>)
  --help               Show this help message

Workflow:
  # 1. Generate run_id
  RUN_ID="B4-CLOSURE-$(date -u +%Y-%m-%dT%H-%M-%S-000Z)"

  # 2. Create operator evidence from template
  cp docs/verification/track_b/templates/B4_OPERATOR_EVIDENCE_TEMPLATE.md \\
     "docs/verification/track_b/B4_OPERATOR_EVIDENCE_\${RUN_ID}.md"

  # 3. Fill in operator evidence with current SHA

  # 4. Run closure
  PROJECT_ID=... GRAPH_API_V2_URL=... npx tsx scripts/closure.ts run --confirm-repair --run-id "\$RUN_ID"
`);
}

// ============================================================
// Main
// ============================================================

function parseRunId(args: string[]): string | undefined {
  const idx = args.indexOf('--run-id');
  if (idx !== -1 && args[idx + 1]) {
    return args[idx + 1];
  }
  return undefined;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(0);
  }

  const command = args[0];
  const hasConfirmRepair = args.includes('--confirm-repair');
  const runId = parseRunId(args);

  // Validate environment
  if (!process.env.PROJECT_ID) {
    console.error('\n❌ ERROR: PROJECT_ID environment variable required\n');
    printUsage();
    process.exit(1);
  }

  if (!process.env.GRAPH_API_V2_URL) {
    console.error('\n❌ ERROR: GRAPH_API_V2_URL environment variable required\n');
    printUsage();
    process.exit(1);
  }

  switch (command) {
    case 'precheck': {
      const result = await runPrecheck(runId);
      process.exit(result.valid ? 0 : 1);
    }

    case 'run': {
      // Tier 2 operator guard
      if (!hasConfirmRepair) {
        console.error('\n❌ OPERATOR CONFIRMATION REQUIRED');
        console.error('');
        console.error('  This script performs state mutation (two full Track A ingestions).');
        console.error('  To confirm you understand the impact, add: --confirm-repair');
        console.error('');
        console.error('  Example:');
        console.error('    PROJECT_ID=... GRAPH_API_V2_URL=... npx tsx scripts/closure.ts run --confirm-repair --run-id <id>');
        console.error('');
        process.exit(1);
      }

      if (!runId) {
        console.error('\n❌ ERROR: --run-id is required for closure run');
        console.error('');
        console.error('  Generate a run ID first:');
        console.error('    RUN_ID="B4-CLOSURE-$(date -u +%Y-%m-%dT%H-%M-%S-000Z)"');
        console.error('');
        console.error('  Then create operator evidence:');
        console.error('    cp docs/verification/track_b/templates/B4_OPERATOR_EVIDENCE_TEMPLATE.md \\');
        console.error('       "docs/verification/track_b/B4_OPERATOR_EVIDENCE_${RUN_ID}.md"');
        console.error('');
        process.exit(1);
      }

      const result = await runClosure(REPO_ROOT, runId);

      console.log('\n' + '='.repeat(60));
      console.log(`\n  B.4 Closure Check: ${result.pass ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`  Run ID: ${result.run_id}`);
      console.log(`  Evidence: ${result.evidence_path}`);
      console.log(`  Run Evidence: ${result.run_evidence_path}`);
      console.log('\n' + '='.repeat(60) + '\n');

      process.exit(result.pass ? 0 : 1);
    }

    default: {
      console.error(`\n❌ Unknown command: ${command}\n`);
      printUsage();
      process.exit(1);
    }
  }
}

main().catch((err) => {
  console.error('\n💥 Unhandled error:', err);
  process.exit(1);
});

