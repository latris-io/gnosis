/**
 * B.3 Shadow Ledger Writer
 * 
 * Track B: Story B.3 - Drift Detection
 * TDD ID: TDD-TRACKB-B3
 * 
 * Writes B.3 operations to the canonical shadow ledger.
 * Path: shadow-ledger/<project_id>/ledger.jsonl
 * 
 * Entry schema includes:
 *   - timestamp: ISO-8601 (canonical)
 *   - ts: legacy alias (for backward compatibility)
 *   - track: 'B'
 *   - story: 'B.3'
 */

import * as fs from 'fs';
import * as path from 'path';
import { DriftLedgerEntry } from './types.js';

// Canonical ledger location (per CID-2026-01-03)
const LEDGER_DIR = 'shadow-ledger';
const LEDGER_FILE = 'ledger.jsonl';

// Project ID from environment
const PROJECT_ID = process.env.PROJECT_ID || '6df2f456-440d-4958-b475-d9808775ff69';

/**
 * Get the full path to the canonical ledger file.
 */
function getLedgerPath(repoRoot: string): string {
  return path.join(repoRoot, LEDGER_DIR, PROJECT_ID, LEDGER_FILE);
}

/**
 * Log a drift detection operation to the shadow ledger.
 * 
 * @param repoRoot - Absolute path to repository root
 * @param entry - Partial entry (timestamp, ts, track, story, project_id will be added)
 */
export async function logDriftOperation(
  repoRoot: string,
  entry: Omit<DriftLedgerEntry, 'timestamp' | 'ts' | 'track' | 'story' | 'project_id'>
): Promise<void> {
  const ledgerPath = getLedgerPath(repoRoot);
  const ledgerDir = path.dirname(ledgerPath);
  
  // Ensure directory exists
  await fs.promises.mkdir(ledgerDir, { recursive: true });
  
  // Canonical timestamp (ISO-8601)
  const iso = new Date().toISOString();
  
  // Create full entry with Track B discriminators
  const fullEntry: DriftLedgerEntry = {
    timestamp: iso,
    ts: iso, // legacy alias (to be removed later)
    track: 'B',
    story: 'B.3',
    project_id: PROJECT_ID,
    ...entry,
  };
  
  // Append as JSONL
  const line = JSON.stringify(fullEntry) + '\n';
  await fs.promises.appendFile(ledgerPath, line, 'utf-8');
}

/**
 * Log snapshot creation.
 */
export async function logSnapshotCreated(repoRoot: string, snapshotId: string): Promise<void> {
  await logDriftOperation(repoRoot, {
    action: 'SNAPSHOT_CREATED',
    snapshot_id: snapshotId,
  });
}

/**
 * Log diff computation.
 */
export async function logDiffComputed(
  repoRoot: string,
  baselineId: string,
  currentId: string,
  driftCount: number
): Promise<void> {
  await logDriftOperation(repoRoot, {
    action: 'DIFF_COMPUTED',
    baseline_id: baselineId,
    current_id: currentId,
    drift_count: driftCount,
  });
}

/**
 * Log gate evaluation.
 */
export async function logGateEvaluated(
  repoRoot: string,
  baselineId: string,
  currentId: string,
  pass: boolean,
  driftCount: number
): Promise<void> {
  await logDriftOperation(repoRoot, {
    action: 'GATE_EVALUATED',
    baseline_id: baselineId,
    current_id: currentId,
    gate_pass: pass,
    drift_count: driftCount,
  });
}

/**
 * Get the path to the canonical ledger file (for documentation/evidence).
 */
export function getLedgerFilePath(): string {
  return `${LEDGER_DIR}/${PROJECT_ID}/${LEDGER_FILE}`;
}

