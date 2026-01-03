// src/services/track_b/brd-registry/config.ts
// Track B BRD Registry Configuration
// Single source of truth for expected BRD version and paths

/** Expected BRD version for this repo baseline */
export const EXPECTED_BRD_VERSION = 'V20.6.4';

/** Canonical BRD file path */
export const BRD_PATH = 'docs/BRD_V20_6_4_COMPLETE.md';

/** Registry state file path */
export const REGISTRY_PATH = 'data/track_b/BRD_REGISTRY.json';

/** Ledger file path */
export const LEDGER_PATH = 'docs/verification/track_b/brd-registry-ledger.jsonl';

/** Evidence file path */
export const EVIDENCE_PATH = 'docs/verification/track_b/B2_BRD_REGISTRY_EVIDENCE.md';

/** Registry schema version */
export const SCHEMA_VERSION = '1.0.0' as const;

