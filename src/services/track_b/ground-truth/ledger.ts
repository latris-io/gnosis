/**
 * Track B Shadow Ledger (B.1.6)
 * 
 * Track B: Story B.1 - Ground Truth Engine
 * TDD ID: TDD-TRACKB-B1
 * 
 * Since src/ledger/shadow-ledger.ts is a locked Track A surface,
 * Track B uses its own simple JSONL logger for ground truth operations.
 * 
 * File path: docs/verification/track_b/ground-truth-ledger.jsonl
 * Format: Append-only JSONL
 */

import * as fs from 'fs';
import * as path from 'path';
import { GroundTruthLedgerEntry } from './types.js';

// Track B ledger file location
const LEDGER_DIR = 'docs/verification/track_b';
const LEDGER_FILE = 'ground-truth-ledger.jsonl';

/**
 * Get the full path to the ledger file.
 */
function getLedgerPath(repoRoot: string): string {
  return path.join(repoRoot, LEDGER_DIR, LEDGER_FILE);
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
  
  // Create full entry with timestamp
  const fullEntry: GroundTruthLedgerEntry = {
    ts: new Date().toISOString(),
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
 * Get the path to the ledger file (for documentation/evidence).
 */
export function getLedgerFilePath(): string {
  return `${LEDGER_DIR}/${LEDGER_FILE}`;
}

