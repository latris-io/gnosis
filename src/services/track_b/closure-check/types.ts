/**
 * B.4 Closure Check Types
 *
 * Interfaces for proving deterministic ingestion via whole-graph snapshot comparison.
 */

// ============================================================
// Health Check
// ============================================================

export interface HealthCheckResult {
  checked_at: string;
  url: string;
  status: 'ok' | 'unreachable';
  response_time_ms?: number;
}

// ============================================================
// Run Binding (Freeze-the-World)
// ============================================================

export interface RunBinding {
  run_id: string; // Format: B4-CLOSURE-<ISO-timestamp>
  project_id: string;
  git_sha: string; // Full 40 chars
  git_branch: string;
  working_tree_clean: boolean;
  dirty_files?: string[]; // Files modified in working tree (if dirty)
  dirty_tree_exception?: boolean; // True if dirty files are allowed (all in docs/verification/** or shadow-ledger/**)
  graph_api_v2_url: string;
  v2_health: HealthCheckResult;
  started_at: string; // ISO-8601
}

// ============================================================
// Provenance Validation
// ============================================================

export interface ProvenanceArtifactResult {
  path: string;
  exists: boolean;
  parseable: boolean;
  project_id_matches: boolean;
  git_sha_matches: boolean;
  found_sha: string | null;
}

export interface ProvenanceValidationResult {
  valid: boolean;
  extraction_provenance: ProvenanceArtifactResult;
  operator_evidence: ProvenanceArtifactResult;
  errors: string[];
}

// ============================================================
// Explicit Comparison (Not Implied)
// ============================================================

export interface ExplicitComparison {
  entity_count_1: number;
  entity_count_2: number;
  relationship_count_1: number;
  relationship_count_2: number;
  entity_merkle_root_1: string;
  entity_merkle_root_2: string;
  relationship_merkle_root_1: string;
  relationship_merkle_root_2: string;

  // Explicitly computed booleans
  counts_match: boolean;
  entity_roots_match: boolean;
  relationship_roots_match: boolean;
  drift_items: number;
}

// ============================================================
// G-CLOSURE Gate Result
// ============================================================

export interface GClosureResult {
  gate: 'G-CLOSURE';
  pass: boolean;
  computed_at: string;
  snapshot_1: string;
  snapshot_2: string;

  // Explicit field checks
  provenance_ok: boolean;
  sha_ok: boolean;
  counts_match: boolean;
  entity_roots_match: boolean;
  relationship_roots_match: boolean;
  drift_items: number;

  failure_reasons: string[];
}

// ============================================================
// Closure Ledger Entry
// ============================================================

export type ClosureAction =
  | 'RUN_STARTED'
  | 'PRECONDITION_CHECK'
  | 'PRECONDITION_FAILED'
  | 'PHASE1_SNAPSHOT'
  | 'SHA_DRIFT'
  | 'PHASE2_SNAPSHOT'
  | 'DIFF_COMPUTED'
  | 'GATE_EVALUATED';

export interface ClosureLedgerEntry {
  timestamp: string; // ISO-8601 (canonical)
  ts: string; // Legacy alias
  track: 'B';
  story: 'B.4';
  project_id: string;
  run_id: string;
  action: ClosureAction;
  // Action-specific fields
  binding?: RunBinding;
  provenance?: ProvenanceValidationResult;
  snapshot_id?: string;
  detected_sha?: string;
  drift_count?: number;
  pass?: boolean;
  errors?: string[];
}

// ============================================================
// Closure Result
// ============================================================

export type ClosureStatus =
  | 'PASS'
  | 'FAIL'
  | 'PRECONDITION_FAILED'
  | 'SHA_DRIFT'
  | 'ERROR';

export interface ClosureResult {
  status: ClosureStatus;
  pass: boolean;
  run_id: string;
  evidence_path: string;
  run_evidence_path: string;
}

// ============================================================
// Evidence Data
// ============================================================

export interface EvidenceData {
  status: ClosureStatus;
  binding: RunBinding;
  provenance: ProvenanceValidationResult;
  snapshot1?: {
    id: string;
    entity_count: number;
    relationship_count: number;
    entity_merkle_root: string;
    relationship_merkle_root: string;
  };
  snapshot2?: {
    id: string;
    entity_count: number;
    relationship_count: number;
    entity_merkle_root: string;
    relationship_merkle_root: string;
  };
  comparison?: ExplicitComparison;
  gateResult?: GClosureResult;
  error?: string;
  detected_sha?: string;
}

