/**
 * B.3 Drift Detection - Module Exports
 * 
 * Track B: Story B.3 - Drift Detection
 * TDD ID: TDD-TRACKB-B3
 * 
 * This module provides whole-graph drift detection via Graph API v2.
 * NO direct database access. All graph reads via HTTP.
 */

// Types
export type {
  EntityDigest,
  RelationshipDigest,
  GraphSnapshot,
  DriftItem,
  DriftSummary,
  DriftDiff,
  DriftAllowlistFile,
  DriftAllowlist,
  GDriftResult,
  DriftLedgerEntry,
  DriftSignal,
} from './types.js';

// HTTP Client
export {
  enumerateAllEntities,
  enumerateAllRelationships,
  checkV2ApiHealth,
} from './http-client.js';

// Merkle
export {
  computeEntityLeafHash,
  computeRelationshipLeafHash,
  computeRelationshipEffectiveHash,
  computeRelationshipStructuralHash,
  computeEntityMerkleRoot,
  computeRelationshipMerkleRoot,
} from './merkle.js';

// Snapshot
export {
  createGraphSnapshot,
  saveSnapshot,
  loadSnapshot,
  findLatestSnapshot,
  listSnapshots,
} from './snapshot.js';

// Diff
export { computeDiff } from './diff.js';

// Gate
export {
  DEFAULT_ALLOWLIST,
  loadAllowlist,
  evaluateGDrift,
  formatGDriftResult,
} from './gate.js';

// Ledger
export {
  logDriftOperation,
  logSnapshotCreated,
  logDiffComputed,
  logGateEvaluated,
  getLedgerFilePath,
} from './ledger.js';

// Signals
export {
  emitDriftSignals,
  countDriftSignals,
  getSignalsFilePath,
} from './signals.js';

