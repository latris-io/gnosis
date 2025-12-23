// src/markers/types.ts
// @implements STORY-64.3
// @satisfies AC-64.3.1
// @satisfies AC-64.3.2
// @tdd TDD-A3-MARKER-EXTRACTION
//
// Type definitions for marker extraction (A3).
// Per plan: validator validates, API persists. Types support layer separation.

/**
 * Marker type - the three marker patterns extracted from comments.
 * - implements: @implements STORY-X.Y
 * - satisfies: @satisfies AC-X.Y.Z
 * - tdd: @tdd TDD-* (v2.0.0 addition)
 */
export type MarkerType = 'implements' | 'satisfies' | 'tdd';

/**
 * Raw marker as extracted by MarkerProvider.
 * Contains file-absolute line positions for evidence anchoring.
 * NO database access at this layer.
 */
export interface RawMarker {
  /** Marker type */
  type: MarkerType;
  /** Target identifier (STORY-X.Y, AC-X.Y.Z, or TDD-*) */
  target_id: string;
  /** Source entity instance_id (FILE-*, FUNC-*, CLASS-*) */
  source_entity_id: string;
  /** Full path to source file */
  source_file: string;
  /** File-absolute line number (1-indexed) where marker starts */
  line_start: number;
  /** File-absolute line number (1-indexed) where marker ends */
  line_end: number;
  /** Raw text of the marker (e.g., "@implements STORY-64.3") */
  raw_text: string;
}

/**
 * Validated marker - target entity exists and is correct type.
 * For @implements/@satisfies: target Story/AC exists.
 * For @tdd: target E06 TechnicalDesign entity exists.
 */
export interface ValidatedMarker extends RawMarker {
  /** Marker has been validated successfully */
  validated: true;
}

/**
 * Orphan marker - target entity does not exist.
 * These are reported to semantic corpus for Track C learning.
 */
export interface OrphanMarker extends RawMarker {
  /** Marker validation failed */
  validated: false;
  /** Reason for validation failure */
  validation_error: string;
}

/**
 * TDD coherence mismatch - @tdd marker but E06 entity missing or wrong type.
 * Semantically different from orphan (target may exist but wrong type).
 */
export interface TDDMismatch extends RawMarker {
  /** TDD coherence validation failed */
  validated: false;
  /** Reason for TDD coherence failure */
  validation_error: string;
}

/**
 * Result of marker validation.
 * Returned by MarkerValidator, consumed by markers.ts API.
 */
export interface ValidationResult {
  /** Markers that passed validation (target exists and correct type) */
  validated: ValidatedMarker[];
  /** Markers where target does not exist (@implements/@satisfies) */
  orphans: OrphanMarker[];
  /** @tdd markers where E06 entity missing or wrong type */
  tddMismatches: TDDMismatch[];
}

/**
 * Result of marker extraction and processing.
 * Returned by markers.ts API after full extraction + validation + persistence.
 */
export interface MarkerExtractionResult {
  /** Successfully validated markers (relationships created for non-tdd) */
  validated: ValidatedMarker[];
  /** Orphan markers (signaled to semantic corpus) */
  orphans: OrphanMarker[];
  /** TDD coherence mismatches (signaled to semantic corpus) */
  tddMismatches: TDDMismatch[];
  /** Statistics for reporting */
  stats: {
    /** Total markers extracted */
    total_extracted: number;
    /** Markers that passed validation */
    validated_count: number;
    /** Orphan markers */
    orphan_count: number;
    /** TDD mismatches */
    tdd_mismatch_count: number;
    /** R18 relationships created */
    r18_created: number;
    /** R19 relationships created */
    r19_created: number;
    /** TDD coherence OK (validated @tdd markers) */
    tdd_ok_count: number;
  };
}

