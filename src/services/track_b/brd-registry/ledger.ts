// src/services/track_b/brd-registry/ledger.ts
// Track B-owned shadow ledger for BRD registry operations
// Per CID-2026-01-03, writes to canonical stream: shadow-ledger/<project_id>/ledger.jsonl
// Entries distinguished by track: "B", story: "B.2"

import * as fs from 'fs';
import * as path from 'path';
import type { BrdRegistryLedgerEntry } from './types.js';
import { getLedgerPath } from './config.js';

// Project ID from environment (required for project-scoped ledger)
const PROJECT_ID = process.env.PROJECT_ID || '6df2f456-440d-4958-b475-d9808775ff69';

/**
 * Ensure ledger directory exists.
 */
function ensureLedgerDir(): void {
  const ledgerPath = getLedgerPath(PROJECT_ID);
  const dir = path.dirname(ledgerPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Append an entry to the canonical ledger with Track B discriminators.
 * 
 * @param entry - Ledger entry to append
 */
export function appendLedgerEntry(entry: BrdRegistryLedgerEntry): void {
  ensureLedgerDir();
  
  // Add Track B discriminators per CID-2026-01-03
  const fullEntry = {
    track: 'B',
    story: 'B.2',
    project_id: PROJECT_ID,
    ...entry,
  };
  
  const line = JSON.stringify(fullEntry) + '\n';
  const ledgerPath = getLedgerPath(PROJECT_ID);
  fs.appendFileSync(ledgerPath, line, 'utf-8');
}

/**
 * Read B.2 entries from the canonical ledger.
 * 
 * @returns Array of ledger entries (B.2 only)
 */
export function readLedger(): BrdRegistryLedgerEntry[] {
  const ledgerPath = getLedgerPath(PROJECT_ID);
  if (!fs.existsSync(ledgerPath)) {
    return [];
  }
  
  const content = fs.readFileSync(ledgerPath, 'utf-8');
  const lines = content.trim().split('\n').filter(line => line.trim());
  
  return lines.map((line, index) => {
    try {
      const entry = JSON.parse(line) as Record<string, unknown>;
      // Filter to B.2 entries only
      if (entry.track === 'B' && entry.story === 'B.2') {
        return entry as unknown as BrdRegistryLedgerEntry;
      }
      return null;
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

