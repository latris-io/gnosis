/**
 * Track B Shadow Ledger (B.1.6)
 * 
 * Track B: Story B.1 - Ground Truth Engine
 * TDD ID: TDD-TRACKB-B1
 * 
 * Per CID-2026-01-03, Track B writes to the canonical ledger stream:
 *   shadow-ledger/<project_id>/ledger.jsonl
 * 
 * Entries are distinguished by `track: "B"` and `story: "B.1"` fields.
 * Format: Append-only JSONL
 */

import * as fs from 'fs';
import * as path from 'path';
import { GroundTruthLedgerEntry } from './types.js';

// Canonical ledger location (per CID-2026-01-03)
const LEDGER_DIR = 'shadow-ledger';
const LEDGER_FILE = 'ledger.jsonl';

// Project ID from environment (required for project-scoped ledger)
const PROJECT_ID = process.env.PROJECT_ID || '6df2f456-440d-4958-b475-d9808775ff69';

/**
 * Get the full path to the canonical ledger file.
 */
function getLedgerPath(repoRoot: string): string {
  return path.join(repoRoot, LEDGER_DIR, PROJECT_ID, LEDGER_FILE);
}

/**
 * Log a ground truth operation to the Track B shadow ledger.
 * 
 * @param repoRoot - Absolute path to repository root
 * @param entry - Ledger entry (without timestamp - will be added)
 */
export async function logGroundTruthOperation(
  repoRoot: string,
  entry: Omit<GroundTruthLedgerEntry, 'ts'>
): Promise<void> {
  const ledgerPath = getLedgerPath(repoRoot);
  const ledgerDir = path.dirname(ledgerPath);
  
  // Ensure directory exists
  await fs.promises.mkdir(ledgerDir, { recursive: true });
  
  // Create full entry with timestamp and Track B discriminators
  const fullEntry: GroundTruthLedgerEntry & { track: string; story: string; project_id: string } = {
    ts: new Date().toISOString(),
    track: 'B',
    story: 'B.1',
    project_id: PROJECT_ID,
    ...entry,
  };
  
  // Append as JSONL (one JSON object per line)
  const line = JSON.stringify(fullEntry) + '\n';
  await fs.promises.appendFile(ledgerPath, line, 'utf-8');
}

/**
 * Read all entries from the Track B shadow ledger.
 * 
 * @param repoRoot - Absolute path to repository root
 * @returns Array of ledger entries (may be empty if file doesn't exist)
 */
export async function readLedgerEntries(repoRoot: string): Promise<GroundTruthLedgerEntry[]> {
  const ledgerPath = getLedgerPath(repoRoot);
  
  try {
    const content = await fs.promises.readFile(ledgerPath, 'utf-8');
    const lines = content.trim().split('\n').filter(line => line.length > 0);
    return lines.map(line => JSON.parse(line) as GroundTruthLedgerEntry);
  } catch (error) {
    // File doesn't exist yet - return empty array
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

/**
 * Get the path to the canonical ledger file (for documentation/evidence).
 */
export function getLedgerFilePath(): string {
  return `${LEDGER_DIR}/${PROJECT_ID}/${LEDGER_FILE}`;
}

