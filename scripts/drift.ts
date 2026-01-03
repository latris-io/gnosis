#!/usr/bin/env npx tsx
/**
 * B.3 Drift Detection CLI
 * 
 * Track B: Story B.3 - Drift Detection
 * TDD ID: TDD-TRACKB-B3
 * 
 * @g-api-exception TRACK_B_OWNED - Track B CLI may import from src/services/track_b/**
 * 
 * Commands:
 *   npx tsx scripts/drift.ts snapshot <label>   - Create snapshot
 *   npx tsx scripts/drift.ts diff <base> <curr> - Compare two snapshots
 *   npx tsx scripts/drift.ts gate <base> <curr> - Evaluate G-DRIFT
 *   npx tsx scripts/drift.ts full <label>       - snapshot + diff vs last + gate
 *   npx tsx scripts/drift.ts list               - List all snapshots
 * 
 * Required environment variables:
 *   PROJECT_ID - Project UUID (default: 6df2f456-440d-4958-b475-d9808775ff69)
 *   GRAPH_API_V2_URL - Graph API v2 base URL (default: http://localhost:3001)
 */

import * as path from 'path';
import * as fs from 'fs';
import {
  createGraphSnapshot,
  saveSnapshot,
  loadSnapshot,
  findLatestSnapshot,
  listSnapshots,
  computeDiff,
  loadAllowlist,
  evaluateGDrift,
  formatGDriftResult,
  logSnapshotCreated,
  logDiffComputed,
  logGateEvaluated,
  emitDriftSignals,
  checkV2ApiHealth,
} from '../src/services/track_b/drift-detection/index.js';

// Configuration
const REPO_ROOT = process.cwd();
const PROJECT_ID = process.env.PROJECT_ID || '6df2f456-440d-4958-b475-d9808775ff69';
const GRAPH_API_V2_URL = process.env.GRAPH_API_V2_URL || 'http://localhost:3001';
const ALLOWLIST_PATH = path.join(REPO_ROOT, 'data/track_b/drift-detection/allowlist.json');

/**
 * Print usage information.
 */
function printUsage(): void {
  console.log(`
B.3 Drift Detection CLI

Usage:
  npx tsx scripts/drift.ts <command> [args]

Commands:
  snapshot <label>    Create a new graph snapshot with the given label
  diff <base> <curr>  Compare two snapshots (by ID or "latest")
  gate <base> <curr>  Evaluate G-DRIFT gate between two snapshots
  full <label>        Full workflow: snapshot + diff vs last + gate
  list                List all snapshots

Environment:
  PROJECT_ID          Project UUID (default: 6df2f456-440d-4958-b475-d9808775ff69)
  GRAPH_API_V2_URL    Graph API v2 base URL (default: http://localhost:3001)

Examples:
  # Create initial snapshot
  npx tsx scripts/drift.ts snapshot baseline-1

  # Run full drift check
  npx tsx scripts/drift.ts full current-check

  # Compare specific snapshots
  npx tsx scripts/drift.ts diff SNAPSHOT-baseline-93ba787-... SNAPSHOT-current-...
`);
}

/**
 * Command: snapshot
 * Create a new graph snapshot.
 */
async function cmdSnapshot(label: string): Promise<void> {
  console.log(`\n[drift] Creating snapshot with label: ${label}`);
  console.log(`[drift] Project ID: ${PROJECT_ID}`);
  console.log(`[drift] API URL: ${GRAPH_API_V2_URL}\n`);
  
  // Check API health
  const healthy = await checkV2ApiHealth(GRAPH_API_V2_URL);
  if (!healthy) {
    console.error(`[drift] ERROR: Graph API v2 not reachable at ${GRAPH_API_V2_URL}`);
    console.error('[drift] Make sure to start the v2 server: npx tsx src/track_b/http/server.ts');
    process.exit(1);
  }
  
  // Create snapshot
  const snapshot = await createGraphSnapshot(GRAPH_API_V2_URL, PROJECT_ID, label);
  
  // Save to disk
  const filepath = await saveSnapshot(REPO_ROOT, snapshot);
  
  // Log to ledger
  await logSnapshotCreated(REPO_ROOT, snapshot.id);
  
  console.log(`\n[drift] Snapshot created successfully!`);
  console.log(`[drift]   ID: ${snapshot.id}`);
  console.log(`[drift]   Entities: ${snapshot.entity_count}`);
  console.log(`[drift]   Relationships: ${snapshot.relationship_count}`);
  console.log(`[drift]   File: ${filepath}`);
}

/**
 * Command: diff
 * Compare two snapshots.
 */
async function cmdDiff(baseId: string, currId: string): Promise<void> {
  console.log(`\n[drift] Computing diff: ${baseId} → ${currId}\n`);
  
  // Load snapshots
  const baseline = baseId === 'latest' 
    ? await findLatestSnapshot(REPO_ROOT)
    : await loadSnapshot(REPO_ROOT, baseId);
  
  if (!baseline) {
    console.error(`[drift] ERROR: Baseline snapshot not found: ${baseId}`);
    process.exit(1);
  }
  
  const current = currId === 'latest'
    ? await findLatestSnapshot(REPO_ROOT)
    : await loadSnapshot(REPO_ROOT, currId);
  
  if (!current) {
    console.error(`[drift] ERROR: Current snapshot not found: ${currId}`);
    process.exit(1);
  }
  
  // Compute diff
  const diff = computeDiff(baseline, current);
  
  // Log to ledger
  await logDiffComputed(REPO_ROOT, diff.snapshot_a, diff.snapshot_b, diff.summary.total_drift_items);
  
  // Display results
  console.log(`[drift] Diff computed: ${diff.snapshot_a} → ${diff.snapshot_b}`);
  console.log(`[drift] Summary:`);
  console.log(`[drift]   Entities:      +${diff.summary.entities_added} / -${diff.summary.entities_deleted} / ~${diff.summary.entities_mutated}`);
  console.log(`[drift]   Relationships: +${diff.summary.relationships_added} / -${diff.summary.relationships_deleted} / ~${diff.summary.relationships_mutated}`);
  console.log(`[drift]   Total items:   ${diff.summary.total_drift_items}`);
}

/**
 * Command: gate
 * Evaluate G-DRIFT gate.
 */
async function cmdGate(baseId: string, currId: string): Promise<void> {
  console.log(`\n[drift] Evaluating G-DRIFT gate: ${baseId} → ${currId}\n`);
  
  // Load snapshots
  const baseline = baseId === 'latest'
    ? await findLatestSnapshot(REPO_ROOT)
    : await loadSnapshot(REPO_ROOT, baseId);
  
  if (!baseline) {
    console.error(`[drift] ERROR: Baseline snapshot not found: ${baseId}`);
    process.exit(1);
  }
  
  const current = currId === 'latest'
    ? await findLatestSnapshot(REPO_ROOT)
    : await loadSnapshot(REPO_ROOT, currId);
  
  if (!current) {
    console.error(`[drift] ERROR: Current snapshot not found: ${currId}`);
    process.exit(1);
  }
  
  // Compute diff
  const diff = computeDiff(baseline, current);
  
  // Load allowlist
  const allowlist = loadAllowlist(ALLOWLIST_PATH);
  
  // Evaluate gate
  const result = evaluateGDrift(diff, allowlist);
  
  // Log to ledger
  await logGateEvaluated(REPO_ROOT, result.baseline_snapshot, result.current_snapshot, result.pass, result.drift_summary.total_drift_items);
  
  // Emit signals if drift detected
  if (!result.pass) {
    await emitDriftSignals(REPO_ROOT, result);
  }
  
  // Display results
  console.log(formatGDriftResult(result));
  
  // Exit code
  process.exit(result.pass ? 0 : 1);
}

/**
 * Command: full
 * Full workflow: snapshot + diff vs latest + gate.
 */
async function cmdFull(label: string): Promise<void> {
  console.log(`\n[drift] Running full drift check with label: ${label}`);
  console.log(`[drift] Project ID: ${PROJECT_ID}`);
  console.log(`[drift] API URL: ${GRAPH_API_V2_URL}\n`);
  
  // Check API health
  const healthy = await checkV2ApiHealth(GRAPH_API_V2_URL);
  if (!healthy) {
    console.error(`[drift] ERROR: Graph API v2 not reachable at ${GRAPH_API_V2_URL}`);
    console.error('[drift] Make sure to start the v2 server: npx tsx src/track_b/http/server.ts');
    process.exit(1);
  }
  
  // Find latest baseline
  const baseline = await findLatestSnapshot(REPO_ROOT);
  
  if (!baseline) {
    console.log('[drift] No existing baseline found. Creating initial snapshot...');
    await cmdSnapshot(label);
    console.log('\n[drift] Initial snapshot created. Run again to compare against this baseline.');
    return;
  }
  
  console.log(`[drift] Found baseline: ${baseline.id}`);
  
  // Create current snapshot
  const current = await createGraphSnapshot(GRAPH_API_V2_URL, PROJECT_ID, label);
  const filepath = await saveSnapshot(REPO_ROOT, current);
  await logSnapshotCreated(REPO_ROOT, current.id);
  
  console.log(`[drift] Created current snapshot: ${current.id}`);
  console.log(`[drift] Saved to: ${filepath}`);
  
  // Compute diff
  const diff = computeDiff(baseline, current);
  await logDiffComputed(REPO_ROOT, diff.snapshot_a, diff.snapshot_b, diff.summary.total_drift_items);
  
  // Load allowlist
  const allowlist = loadAllowlist(ALLOWLIST_PATH);
  
  // Evaluate gate
  const result = evaluateGDrift(diff, allowlist);
  await logGateEvaluated(REPO_ROOT, result.baseline_snapshot, result.current_snapshot, result.pass, result.drift_summary.total_drift_items);
  
  // Emit signals if drift detected
  if (!result.pass) {
    await emitDriftSignals(REPO_ROOT, result);
  }
  
  // Display results
  console.log(formatGDriftResult(result));
  
  // Write evidence if in CI or requested
  await writeEvidence(result, baseline, current);
  
  // Exit code
  process.exit(result.pass ? 0 : 1);
}

/**
 * Command: list
 * List all snapshots.
 */
async function cmdList(): Promise<void> {
  console.log(`\n[drift] Listing snapshots in ${REPO_ROOT}/data/track_b/drift-detection/\n`);
  
  const ids = await listSnapshots(REPO_ROOT);
  
  if (ids.length === 0) {
    console.log('[drift] No snapshots found.');
    return;
  }
  
  console.log(`[drift] Found ${ids.length} snapshot(s):\n`);
  
  for (const id of ids) {
    const snap = await loadSnapshot(REPO_ROOT, id);
    if (snap) {
      console.log(`  ${snap.id}`);
      console.log(`    Created: ${snap.created_at}`);
      console.log(`    Entities: ${snap.entity_count}, Relationships: ${snap.relationship_count}`);
      console.log(`    Commit: ${snap.commit_sha.slice(0, 7)}`);
      console.log('');
    }
  }
}

/**
 * Write evidence artifact.
 */
async function writeEvidence(
  result: Awaited<ReturnType<typeof evaluateGDrift>>,
  baseline: Awaited<ReturnType<typeof findLatestSnapshot>>,
  current: Awaited<ReturnType<typeof createGraphSnapshot>>
): Promise<void> {
  const evidencePath = path.join(REPO_ROOT, 'docs/verification/track_b/B3_DRIFT_DETECTION_EVIDENCE.md');
  const evidenceDir = path.dirname(evidencePath);
  
  await fs.promises.mkdir(evidenceDir, { recursive: true });
  
  const content = `# B.3 Drift Detection Evidence

**Generated:** ${new Date().toISOString()}
**Project ID:** ${PROJECT_ID}
**Git SHA:** ${current.commit_sha}

## Compliance Statement

All graph reads performed via HTTP Graph API v2 enumeration endpoints.
No direct database access. No imports from Track A locked surfaces.

## Environment

- **GRAPH_API_V2_URL:** ${GRAPH_API_V2_URL}
- **PROJECT_ID:** ${PROJECT_ID}
- **Allowlist:** ${fs.existsSync(ALLOWLIST_PATH) ? 'Custom' : 'Default (empty)'}

## Snapshot Summary

| Snapshot | Label | Entities | Relationships | Entity Root | Rel Root |
|----------|-------|----------|---------------|-------------|----------|
| Baseline | ${baseline?.label ?? 'N/A'} | ${baseline?.entity_count ?? 0} | ${baseline?.relationship_count ?? 0} | ${baseline?.entity_merkle_root.slice(0, 12) ?? 'N/A'}... | ${baseline?.relationship_merkle_root.slice(0, 12) ?? 'N/A'}... |
| Current | ${current.label} | ${current.entity_count} | ${current.relationship_count} | ${current.entity_merkle_root.slice(0, 12)}... | ${current.relationship_merkle_root.slice(0, 12)}... |

## Diff Summary

| Category | Added | Deleted | Mutated |
|----------|-------|---------|---------|
| Entities | ${result.drift_summary.entities_added} | ${result.drift_summary.entities_deleted} | ${result.drift_summary.entities_mutated} |
| Relationships | ${result.drift_summary.relationships_added} | ${result.drift_summary.relationships_deleted} | ${result.drift_summary.relationships_mutated} |

## G-DRIFT Gate Result

**Result:** ${result.pass ? 'PASS ✓' : 'FAIL ✗'}
**Unexpected Items:** ${result.unexpected_items.length}
**Allowed Items:** ${result.allowed_items.length}

${result.unexpected_items.length > 0 ? `
### Unexpected Drift Items (first 50)

| Instance ID | Category | Change | Type |
|-------------|----------|--------|------|
${result.unexpected_items.slice(0, 50).map(item => 
  `| ${item.instance_id.slice(0, 40)}... | ${item.category} | ${item.change_type} | ${item.entity_type ?? item.relationship_type ?? ''} |`
).join('\n')}
${result.unexpected_items.length > 50 ? `\n*... and ${result.unexpected_items.length - 50} more items*` : ''}
` : ''}

## Ledger Entries

Logged to: \`shadow-ledger/${PROJECT_ID}/ledger.jsonl\`

- SNAPSHOT_CREATED: ${current.id}
- DIFF_COMPUTED: ${baseline?.id ?? 'N/A'} → ${current.id}
- GATE_EVALUATED: pass=${result.pass}

## Verification Commands

\`\`\`bash
# Re-run drift detection
PROJECT_ID=${PROJECT_ID} \\
GRAPH_API_V2_URL=${GRAPH_API_V2_URL} \\
npx tsx scripts/drift.ts full <label>

# Verify ledger entries
grep '"story":"B.3"' shadow-ledger/${PROJECT_ID}/ledger.jsonl
\`\`\`
`;

  await fs.promises.writeFile(evidencePath, content, 'utf-8');
  console.log(`[drift] Evidence written to: ${evidencePath}`);
}

// Main
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command || command === '--help' || command === '-h') {
    printUsage();
    process.exit(0);
  }
  
  try {
    switch (command) {
      case 'snapshot':
        if (!args[1]) {
          console.error('[drift] ERROR: Missing label argument');
          printUsage();
          process.exit(1);
        }
        await cmdSnapshot(args[1]);
        break;
        
      case 'diff':
        if (!args[1] || !args[2]) {
          console.error('[drift] ERROR: Missing snapshot arguments');
          printUsage();
          process.exit(1);
        }
        await cmdDiff(args[1], args[2]);
        break;
        
      case 'gate':
        if (!args[1] || !args[2]) {
          console.error('[drift] ERROR: Missing snapshot arguments');
          printUsage();
          process.exit(1);
        }
        await cmdGate(args[1], args[2]);
        break;
        
      case 'full':
        if (!args[1]) {
          console.error('[drift] ERROR: Missing label argument');
          printUsage();
          process.exit(1);
        }
        await cmdFull(args[1]);
        break;
        
      case 'list':
        await cmdList();
        break;
        
      default:
        console.error(`[drift] ERROR: Unknown command: ${command}`);
        printUsage();
        process.exit(1);
    }
  } catch (error) {
    console.error('[drift] ERROR:', error);
    process.exit(1);
  }
}

main();

