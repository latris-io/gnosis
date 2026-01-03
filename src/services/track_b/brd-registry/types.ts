// src/services/track_b/brd-registry/types.ts
// Track B BRD Registry Type Definitions

/** BRD identifier extracted from markdown */
export interface BrdIdentifier {
  id: string;           // e.g., "EPIC-64", "STORY-64.1", "AC-64.1.1"
  type: 'epic' | 'story' | 'ac';
  line_number: number;  // Source line for evidence
}

/** BRD parsing result */
export interface BrdParseResult {
  version: string;              // Extracted from BRD title (e.g., V20.6.4)
  epics: BrdIdentifier[];
  stories: BrdIdentifier[];
  acs: BrdIdentifier[];
  parse_errors: string[];       // Non-fatal issues
}

/** BRD registry record (stable state artifact) */
export interface BrdRegistry {
  schema_version: '1.0.0';
  generated_at: string;
  brd_path: string;
  brd_version: string;
  brd_content_hash: string;     // sha256:{hex}
  brd_blob_hash?: string;
  brd_blob_source?: 'git_blob' | 'filesystem_fallback';
  counts: {
    epics: number;
    stories: number;
    acs: number;
  };
  identifiers: {
    epics: string[];
    stories: string[];
    acs: string[];
  };
}

/** Discrepancy found during check/gate */
export interface Discrepancy {
  type: 'PARSE_ERROR' | 'VERSION_MISMATCH' | 'HASH_MISMATCH' | 'COUNT_MISMATCH' | 'ID_MISMATCH';
  field?: string;
  expected?: string | number;
  actual?: string | number;
  details: string;
}

/** G-REGISTRY gate result */
export interface RegistryGateResult {
  pass: boolean;
  gate: 'G-REGISTRY';
  scope: 'local_integrity';     // Not "complete" until B.6
  timestamp: string;
  checks: {
    brd_parsed: boolean;
    version_matches: boolean;
    hash_computed: boolean;
    internal_consistency: boolean;
    drift_check_passed: boolean;
  };
  graph_comparison: {
    status: 'deferred';
    deferred_to: 'B.6 (Graph API v2)';
    reason: string;
  };
  discrepancies: Discrepancy[];
  counts: {
    epics: number;
    stories: number;
    acs: number;
  };
  summary: string;
}

/** Ledger entry for BRD registry operations */
export interface BrdRegistryLedgerEntry {
  timestamp: string;
  action: 'BRD_REGISTRY_BUILD' | 'BRD_REGISTRY_CHECK' | 'G_REGISTRY_GATE';
  brd_path: string;
  brd_version: string;
  brd_content_hash: string;
  counts: { epics: number; stories: number; acs: number };
  gate_result?: 'PASS' | 'FAIL';
  notes?: string;
}

/** Validation result from parser */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/** Check result from registry comparison */
export interface CheckResult {
  matches: boolean;
  discrepancies: Discrepancy[];
  current: BrdRegistry;
  stored?: BrdRegistry;
}

