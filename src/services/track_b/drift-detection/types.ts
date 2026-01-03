/**
 * B.3 Drift Detection Types
 * 
 * Track B: Story B.3 - Drift Detection
 * TDD ID: TDD-TRACKB-B3
 * 
 * Interfaces for graph snapshots, diffing, and G-DRIFT gate evaluation.
 * All graph reads are HTTP-only via Graph API v2 (no DB access).
 */

/**
 * Entity digest for snapshot storage.
 * Contains the minimum information needed for drift detection.
 */
export interface EntityDigest {
  instance_id: string;
  entity_type: string;         // E01, E02, etc. - always included for reporting
  content_hash: string | null; // sha256:... or null
}

/**
 * Relationship digest for snapshot storage.
 * Includes content_hash for mutation detection.
 */
export interface RelationshipDigest {
  instance_id: string;
  relationship_type: string;   // R01, R02, etc.
  from_entity_id: string;      // instance_id of source entity
  to_entity_id: string;        // instance_id of target entity
  content_hash: string | null; // sha256:... or null - for mutation detection
  confidence: number | null;
}

/**
 * Complete graph snapshot for drift comparison.
 * 
 * Filename convention: SNAPSHOT-<label>-<commit_sha_7>-<timestamp>.json
 * Example: SNAPSHOT-baseline-93ba787-2026-01-03T12-34-56Z.json
 */
export interface GraphSnapshot {
  id: string;                       // SNAPSHOT-<label>-<commit_sha_7>-<timestamp>
  label: string;                    // User-provided label
  created_at: string;               // ISO-8601 - used for "latest" selection
  project_id: string;
  commit_sha: string;               // Full git rev-parse HEAD
  
  // Counts
  entity_count: number;
  relationship_count: number;
  
  // Merkle roots for integrity verification
  entity_merkle_root: string;       // SHA-256 hex
  relationship_merkle_root: string; // SHA-256 hex
  
  // All digests (flat arrays, type is inside each digest)
  entities: EntityDigest[];
  relationships: RelationshipDigest[];
}

/**
 * Single drift item representing an added, deleted, or mutated entity/relationship.
 */
export interface DriftItem {
  category: 'entity' | 'relationship';
  change_type: 'added' | 'deleted' | 'mutated';
  instance_id: string;
  entity_type?: string;         // Always present for entities
  relationship_type?: string;   // Always present for relationships
  old_hash?: string;            // For mutations: baseline effective hash
  new_hash?: string;            // For mutations: current effective hash
}

/**
 * Summary counts for drift between two snapshots.
 */
export interface DriftSummary {
  entities_added: number;
  entities_deleted: number;
  entities_mutated: number;
  relationships_added: number;
  relationships_deleted: number;
  relationships_mutated: number;
  total_drift_items: number;
}

/**
 * Complete diff result between two snapshots.
 */
export interface DriftDiff {
  snapshot_a: string;  // Baseline snapshot ID
  snapshot_b: string;  // Current snapshot ID
  computed_at: string; // ISO-8601
  summary: DriftSummary;
  items: DriftItem[];
}

/**
 * Allowlist file format (JSON-serializable).
 * Regex patterns are stored as strings and compiled at runtime.
 */
export interface DriftAllowlistFile {
  allowed_entity_types?: string[];        // Types where drift is expected
  allowed_instance_patterns?: string[];   // Regex STRINGS (compiled at runtime)
  allowed_relationship_types?: string[];
}

/**
 * Runtime allowlist representation with compiled RegExps.
 */
export interface DriftAllowlist {
  allowed_entity_types: Set<string>;
  allowed_instance_patterns: RegExp[];    // Compiled from strings
  allowed_relationship_types: Set<string>;
}

/**
 * G-DRIFT gate evaluation result.
 */
export interface GDriftResult {
  gate: 'G-DRIFT';
  pass: boolean;
  computed_at: string;
  baseline_snapshot: string;
  current_snapshot: string;
  drift_summary: DriftSummary;
  unexpected_items: DriftItem[];  // Items NOT covered by allowlist
  allowed_items: DriftItem[];     // Items covered by allowlist
}

/**
 * Ledger entry for B.3 operations.
 * Written to canonical path: shadow-ledger/<project_id>/ledger.jsonl
 */
export interface DriftLedgerEntry {
  timestamp: string;  // ISO-8601 (canonical)
  ts: string;         // Legacy alias (for backward compatibility)
  track: 'B';
  story: 'B.3';
  project_id: string;
  action: 'SNAPSHOT_CREATED' | 'DIFF_COMPUTED' | 'GATE_EVALUATED';
  snapshot_id?: string;
  baseline_id?: string;
  current_id?: string;
  gate_pass?: boolean;
  drift_count?: number;
}

/**
 * Semantic signal emitted when drift is detected.
 * Contributes to Track B exit requirement (100+ signals total).
 */
export interface DriftSignal {
  type: 'DRIFT_UNEXPECTED' | 'DRIFT_MUTATION' | 'DRIFT_DELETION' | 'DRIFT_ADDITION';
  severity: 'WARNING' | 'ERROR';
  instance_id: string;
  entity_type?: string;
  relationship_type?: string;
  baseline_snapshot: string;
  current_snapshot: string;
  context: Record<string, unknown>;
}

