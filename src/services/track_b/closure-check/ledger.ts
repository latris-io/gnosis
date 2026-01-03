/**
 * B.4 Closure Ledger
 *
 * Logs closure operations to the canonical shadow ledger.
 * All entries include run_id for correlation.
 */

import * as fs from 'fs';
import * as path from 'path';
import type {
  ClosureLedgerEntry,
  ClosureAction,
  RunBinding,
  ProvenanceValidationResult,
} from './types.js';

// ============================================================
// Ledger Path
// ============================================================

function getLedgerPath(repoRoot: string, projectId: string): string {
  return path.join(repoRoot, 'shadow-ledger', projectId, 'ledger.jsonl');
}

// ============================================================
// Log Closure Operation
// ============================================================

interface LogClosureParams {
  action: ClosureAction;
  binding?: RunBinding;
  provenance?: ProvenanceValidationResult;
  snapshot_id?: string;
  detected_sha?: string;
  drift_count?: number;
  pass?: boolean;
  errors?: string[];
}

export async function logClosureOperation(
  repoRoot: string,
  runId: string,
  projectId: string,
  params: LogClosureParams
): Promise<void> {
  const ledgerPath = getLedgerPath(repoRoot, projectId);

  // Ensure directory exists
  const ledgerDir = path.dirname(ledgerPath);
  await fs.promises.mkdir(ledgerDir, { recursive: true });

  const now = new Date().toISOString();

  const entry: ClosureLedgerEntry = {
    timestamp: now,
    ts: now, // Legacy alias
    track: 'B',
    story: 'B.4',
    project_id: projectId,
    run_id: runId,
    action: params.action,
    ...(params.binding && { binding: params.binding }),
    ...(params.provenance && { provenance: params.provenance }),
    ...(params.snapshot_id && { snapshot_id: params.snapshot_id }),
    ...(params.detected_sha && { detected_sha: params.detected_sha }),
    ...(params.drift_count !== undefined && { drift_count: params.drift_count }),
    ...(params.pass !== undefined && { pass: params.pass }),
    ...(params.errors && { errors: params.errors }),
  };

  await fs.promises.appendFile(
    ledgerPath,
    JSON.stringify(entry) + '\n',
    'utf-8'
  );
}

