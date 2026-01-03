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
  npx tsx scripts/closure.ts precheck [--confirm-repair]
  npx tsx scripts/closure.ts run --confirm-repair

Commands:
  precheck  Validate provenance and V2 health only (no ingestion)
  run       Full closure run (two ingestions + comparison)

Required Environment:
  PROJECT_ID           The project UUID
  GRAPH_API_V2_URL     The Graph API v2 base URL (e.g., http://localhost:3001)

Options:
  --confirm-repair     Required for 'run' command (Tier 2 operator guard)
  --help               Show this help message

Examples:
  # Validate provenance only
  PROJECT_ID=... GRAPH_API_V2_URL=http://localhost:3001 npx tsx scripts/closure.ts precheck

  # Full closure run
  PROJECT_ID=... GRAPH_API_V2_URL=http://localhost:3001 npx tsx scripts/closure.ts run --confirm-repair
`);
}

// ============================================================
// Main
// ============================================================

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(0);
  }

  const command = args[0];
  const hasConfirmRepair = args.includes('--confirm-repair');

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
      const result = await runPrecheck();
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
        console.error('    PROJECT_ID=... GRAPH_API_V2_URL=... npx tsx scripts/closure.ts run --confirm-repair');
        console.error('');
        process.exit(1);
      }

      const result = await runClosure(REPO_ROOT);

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

