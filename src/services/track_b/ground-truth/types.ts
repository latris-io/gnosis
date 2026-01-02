/**
 * Ground Truth Engine Types
 * 
 * Track B: Story B.1 - Ground Truth Engine
 * TDD ID: TDD-TRACKB-B1
 * 
 * Types and interfaces for file manifests, Merkle roots, health checks, and G-HEALTH gate.
 */

// File manifest entry (per-file)
export interface FileManifest {
  path: string;       // POSIX, relative to repo root
  sha256: string;     // hex SHA-256
  size: number;       // bytes
  mtime: string;      // ISO 8601
}

// Full ground truth manifest
export interface GroundTruthManifest {
  generated_at: string;
  merkle_root: string;
  file_count: number;
  scope: string[];      // included patterns
  excludes: string[];   // excluded patterns
  files: FileManifest[];
}

// Health check result
export interface HealthReport {
  checked_at: string;
  score: number;           // 0 or 100 (strict)
  expected_root: string;
  computed_root: string;
  // Baseline vs disk
  missing_paths: string[];
  extra_paths: string[];
  mismatched: Array<{
    path: string;
    expected: string;
    actual: string;
  }>;
  // Graph coverage (deferred to B.6 - Graph API v2)
  // B.1 cannot add entity listing endpoint to Track A locked surfaces
  graph_missing_paths: string[];  // on disk, not in graph (empty in B.1)
  graph_extra_paths: string[];    // in graph, not on disk (empty in B.1)
  graph_coverage_status?: 'DEFERRED_TO_B6' | 'CHECKED';
  file_count: { expected: number; actual: number };
}

// G-HEALTH gate result
export interface GHealthResult {
  pass: boolean;
  report: HealthReport;
}

// Baseline file structure
export interface GroundTruthBaseline {
  generated_at: string;
  merkle_root: string;
  file_count: number;
  scope: string[];
  excludes: string[];
  scope_version: string;  // e.g. "B1-v1"
}

// Shadow ledger entry for Track B operations
export interface GroundTruthLedgerEntry {
  ts: string;
  action: 'SET_BASELINE' | 'HEALTH_CHECK';
  merkle_root: string;
  file_count: number;
  scope: string[];
  excludes: string[];
  actor: string;
  notes?: string;
}

