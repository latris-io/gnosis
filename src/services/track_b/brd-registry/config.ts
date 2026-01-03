// src/services/track_b/brd-registry/config.ts
// Track B BRD Registry Configuration
// Single source of truth for expected BRD version and paths

/** Expected BRD version for this repo baseline */
export const EXPECTED_BRD_VERSION = 'V20.6.4';

/** Canonical BRD file path */
export const BRD_PATH = 'docs/BRD_V20_6_4_COMPLETE.md';

/** Registry state file path */
export const REGISTRY_PATH = 'data/track_b/BRD_REGISTRY.json';

/** 
 * Canonical ledger path (per CID-2026-01-03)
 * Track B writes to shadow-ledger/<project_id>/ledger.jsonl
 * with `track: "B"` and `story: "B.2"` discriminators.
 */
export const LEDGER_DIR = 'shadow-ledger';
export const LEDGER_FILE = 'ledger.jsonl';

/** Get project-scoped ledger path */
export function getLedgerPath(projectId: string): string {
  return `${LEDGER_DIR}/${projectId}/${LEDGER_FILE}`;
}

/** Evidence file path */
export const EVIDENCE_PATH = 'docs/verification/track_b/B2_BRD_REGISTRY_EVIDENCE.md';

/** Registry schema version */
export const SCHEMA_VERSION = '1.0.0' as const;

