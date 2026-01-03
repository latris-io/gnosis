// src/services/track_b/brd-registry/ledger.ts
// Track B-owned shadow ledger for BRD registry operations
// NOT the locked Track A ledger at src/ledger/shadow-ledger.ts

import * as fs from 'fs';
import * as path from 'path';
import type { BrdRegistryLedgerEntry } from './types.js';
import { LEDGER_PATH } from './config.js';

/**
 * Ensure ledger directory exists.
 */
function ensureLedgerDir(): void {
  const dir = path.dirname(LEDGER_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Append an entry to the BRD registry ledger.
 * 
 * @param entry - Ledger entry to append
 */
export function appendLedgerEntry(entry: BrdRegistryLedgerEntry): void {
  ensureLedgerDir();
  
  const line = JSON.stringify(entry) + '\n';
  fs.appendFileSync(LEDGER_PATH, line, 'utf-8');
}

/**
 * Read all entries from the BRD registry ledger.
 * 
 * @returns Array of ledger entries
 */
export function readLedger(): BrdRegistryLedgerEntry[] {
  if (!fs.existsSync(LEDGER_PATH)) {
    return [];
  }
  
  const content = fs.readFileSync(LEDGER_PATH, 'utf-8');
  const lines = content.trim().split('\n').filter(line => line.trim());
  
  return lines.map((line, index) => {
    try {
      return JSON.parse(line) as BrdRegistryLedgerEntry;
    } catch {
      console.warn(`Failed to parse ledger line ${index + 1}: ${line}`);
      return null;
    }
  }).filter((entry): entry is BrdRegistryLedgerEntry => entry !== null);
}

/**
 * Create a ledger entry for a build operation.
 */
export function createBuildEntry(
  brdPath: string,
  brdVersion: string,
  brdContentHash: string,
  counts: { epics: number; stories: number; acs: number },
  notes?: string
): BrdRegistryLedgerEntry {
  return {
    timestamp: new Date().toISOString(),
    action: 'BRD_REGISTRY_BUILD',
    brd_path: brdPath,
    brd_version: brdVersion,
    brd_content_hash: brdContentHash,
    counts,
    notes,
  };
}

/**
 * Create a ledger entry for a check operation.
 */
export function createCheckEntry(
  brdPath: string,
  brdVersion: string,
  brdContentHash: string,
  counts: { epics: number; stories: number; acs: number },
  notes?: string
): BrdRegistryLedgerEntry {
  return {
    timestamp: new Date().toISOString(),
    action: 'BRD_REGISTRY_CHECK',
    brd_path: brdPath,
    brd_version: brdVersion,
    brd_content_hash: brdContentHash,
    counts,
    notes,
  };
}

/**
 * Create a ledger entry for a gate evaluation.
 */
export function createGateEntry(
  brdPath: string,
  brdVersion: string,
  brdContentHash: string,
  counts: { epics: number; stories: number; acs: number },
  gateResult: 'PASS' | 'FAIL',
  notes?: string
): BrdRegistryLedgerEntry {
  return {
    timestamp: new Date().toISOString(),
    action: 'G_REGISTRY_GATE',
    brd_path: brdPath,
    brd_version: brdVersion,
    brd_content_hash: brdContentHash,
    counts,
    gate_result: gateResult,
    notes,
  };
}

