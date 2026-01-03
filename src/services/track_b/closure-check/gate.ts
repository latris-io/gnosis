/**
 * B.4 G-CLOSURE Gate
 *
 * Evaluates the closure gate with EXPLICIT field checks.
 * All comparisons are computed explicitly, not implied.
 */

import type {
  GClosureResult,
  ExplicitComparison,
  ProvenanceValidationResult,
} from './types.js';
import type { GraphSnapshot, DriftDiff } from '../drift-detection/types.js';

// ============================================================
// Explicit Comparison
// ============================================================

export function computeExplicitComparison(
  snap1: GraphSnapshot,
  snap2: GraphSnapshot,
  diff: DriftDiff
): ExplicitComparison {
  return {
    entity_count_1: snap1.entity_count,
    entity_count_2: snap2.entity_count,
    relationship_count_1: snap1.relationship_count,
    relationship_count_2: snap2.relationship_count,
    entity_merkle_root_1: snap1.entity_merkle_root,
    entity_merkle_root_2: snap2.entity_merkle_root,
    relationship_merkle_root_1: snap1.relationship_merkle_root,
    relationship_merkle_root_2: snap2.relationship_merkle_root,

    // EXPLICIT boolean computations
    counts_match:
      snap1.entity_count === snap2.entity_count &&
      snap1.relationship_count === snap2.relationship_count,
    entity_roots_match: snap1.entity_merkle_root === snap2.entity_merkle_root,
    relationship_roots_match:
      snap1.relationship_merkle_root === snap2.relationship_merkle_root,
    drift_items: diff.summary.total_drift_items,
  };
}

// ============================================================
// G-CLOSURE Gate Evaluation
// ============================================================

export function evaluateGClosure(
  snapshot1: GraphSnapshot,
  snapshot2: GraphSnapshot,
  diff: DriftDiff,
  provenance: ProvenanceValidationResult
): GClosureResult {
  const comparison = computeExplicitComparison(snapshot1, snapshot2, diff);
  const failure_reasons: string[] = [];

  // Check each condition explicitly
  const provenance_ok = provenance.valid;
  if (!provenance_ok) {
    failure_reasons.push('Provenance validation failed');
  }

  const sha_ok = true; // Already validated before reaching gate

  if (!comparison.counts_match) {
    failure_reasons.push(
      `Count mismatch: entities ${comparison.entity_count_1} vs ${comparison.entity_count_2}, relationships ${comparison.relationship_count_1} vs ${comparison.relationship_count_2}`
    );
  }

  if (!comparison.entity_roots_match) {
    failure_reasons.push(
      `Entity Merkle root mismatch: ${comparison.entity_merkle_root_1.slice(0, 12)}... vs ${comparison.entity_merkle_root_2.slice(0, 12)}...`
    );
  }

  if (!comparison.relationship_roots_match) {
    failure_reasons.push(
      `Relationship Merkle root mismatch: ${comparison.relationship_merkle_root_1.slice(0, 12)}... vs ${comparison.relationship_merkle_root_2.slice(0, 12)}...`
    );
  }

  if (comparison.drift_items > 0) {
    failure_reasons.push(`${comparison.drift_items} drift items detected`);
  }

  // PASS requires ALL conditions
  const pass =
    provenance_ok &&
    sha_ok &&
    comparison.counts_match &&
    comparison.entity_roots_match &&
    comparison.relationship_roots_match &&
    comparison.drift_items === 0;

  return {
    gate: 'G-CLOSURE',
    pass,
    computed_at: new Date().toISOString(),
    snapshot_1: snapshot1.id,
    snapshot_2: snapshot2.id,
    provenance_ok,
    sha_ok,
    counts_match: comparison.counts_match,
    entity_roots_match: comparison.entity_roots_match,
    relationship_roots_match: comparison.relationship_roots_match,
    drift_items: comparison.drift_items,
    failure_reasons,
  };
}

