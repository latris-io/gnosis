// src/api/v1/markers.ts
// @implements STORY-64.3
// @satisfies AC-64.3.3
// @satisfies AC-64.3.4
// @satisfies AC-64.3.5
// @satisfies AC-64.3.9
// @tdd TDD-A3-MARKER-EXTRACTION
//
// Marker extraction API - orchestrates extraction, validation, and persistence.
// Per A3 plan:
// - Orchestrates MarkerProvider (extraction) and MarkerValidator (validation)
// - Creates R18/R19 relationships via relationshipService.upsert()
// - Logs to shadow ledger based on upsert outcome (CREATE/UPDATE, no entry for NO-OP)
// - Logs DECISION entries for ORPHAN, TDD_COHERENCE_OK, TDD_COHERENCE_MISMATCH
// - Signals orphans and TDD mismatches to semantic corpus with deterministic signal_instance_id
//
// Layer rules:
// - MAY import from services (for relationship persistence)
// - MUST NOT import from db

import { MarkerProvider } from '../../extraction/providers/marker-provider.js';
import { MarkerValidator } from '../../markers/validator.js';
import { getProjectLedger } from '../../ledger/shadow-ledger.js';
import { getProjectCorpus } from '../../ledger/semantic-corpus.js';
import * as relationshipService from '../../services/relationships/relationship-service.js';
import type { RepoSnapshot, ExtractedRelationship } from '../../extraction/types.js';
import type { 
  RawMarker, 
  ValidatedMarker, 
  OrphanMarker, 
  TDDMismatch,
  MarkerExtractionResult 
} from '../../markers/types.js';

/**
 * Compute deterministic signal_instance_id for idempotent replay.
 * Pattern: {marker_type}:{target_id}:{source_entity_id}:{source_file}:{line_start}:{line_end}
 */
function computeSignalInstanceId(marker: RawMarker): string {
  return `${marker.type}:${marker.target_id}:${marker.source_entity_id}:${marker.source_file}:${marker.line_start}:${marker.line_end}`;
}

/**
 * Extract and validate markers from a repository snapshot.
 * 
 * This is the main entry point for A3 marker extraction.
 * 
 * Flow:
 * 1. MarkerProvider extracts raw markers from comments
 * 2. MarkerValidator validates targets against entity registry
 * 3. For validated @implements/@satisfies: create R18/R19 relationships
 * 4. For validated @tdd: log TDD_COHERENCE_OK decision (no relationship)
 * 5. For orphans: signal to semantic corpus and log ORPHAN decision
 * 6. For TDD mismatches: signal to semantic corpus and log TDD_COHERENCE_MISMATCH decision
 */
export async function extractAndValidateMarkers(
  projectId: string,
  snapshot: RepoSnapshot
): Promise<MarkerExtractionResult> {
  const provider = new MarkerProvider();
  const validator = new MarkerValidator(projectId);

  // 1. Provider extracts raw markers
  const rawMarkers = await provider.extract(snapshot);

  // 2. Validator validates (no persistence)
  const { validated, orphans, tddMismatches } = await validator.validateMarkers(rawMarkers);

  // Statistics tracking
  const stats = {
    total_extracted: rawMarkers.length,
    validated_count: validated.length,
    orphan_count: orphans.length,
    tdd_mismatch_count: tddMismatches.length,
    r18_created: 0,
    r19_created: 0,
    tdd_ok_count: 0,
  };

  // Get project-scoped ledger and corpus
  const ledger = getProjectLedger(projectId);
  const corpus = getProjectCorpus(projectId);

  // 3. Process validated markers
  for (const marker of validated) {
    if (marker.type === 'tdd') {
      // @tdd is coherence-only - log decision, no relationship
      await ledger.logDecision({
        decision: 'TDD_COHERENCE_OK',
        marker_type: marker.type,
        target_id: marker.target_id,
        source_entity_id: marker.source_entity_id,
        source_file: marker.source_file,
        line_start: marker.line_start,
        line_end: marker.line_end,
        project_id: projectId,
      });
      stats.tdd_ok_count++;
      continue;
    }

    // Build R18/R19 relationship
    const relationship: ExtractedRelationship = {
      relationship_type: marker.type === 'implements' ? 'R18' : 'R19',
      instance_id: `${marker.type === 'implements' ? 'R18' : 'R19'}:${marker.source_entity_id}:${marker.target_id}`,
      name: marker.type === 'implements' ? 'IMPLEMENTS' : 'SATISFIES',
      from_instance_id: marker.source_entity_id,
      to_instance_id: marker.target_id,
      confidence: 1.0,
      source_file: marker.source_file,
      line_start: marker.line_start,
      line_end: marker.line_end,
    };

    // Upsert relationship - service logs to shadow ledger on CREATE/UPDATE
    // No ledger entry for NO-OP (relationship unchanged)
    const result = await relationshipService.upsert(projectId, relationship);

    if (result.operation === 'CREATE' || result.operation === 'UPDATE') {
      if (marker.type === 'implements') {
        stats.r18_created++;
      } else {
        stats.r19_created++;
      }
    }
  }

  // 4. Signal orphans to semantic corpus and log DECISION
  for (const orphan of orphans) {
    // Signal with deterministic ID for idempotent replay
    await corpus.capture({
      type: 'ORPHAN_MARKER',
      marker_type: orphan.type,
      target_id: orphan.target_id,
      source_entity_id: orphan.source_entity_id,
      project_id: projectId,
      context: {
        source_file: orphan.source_file,
        line_start: orphan.line_start,
        line_end: orphan.line_end,
        signal_instance_id: computeSignalInstanceId(orphan),
      },
      evidence: {
        orphan: true,
        validation_error: orphan.validation_error,
      },
    });

    // Log ORPHAN decision to shadow ledger
    await ledger.logDecision({
      decision: 'ORPHAN',
      marker_type: orphan.type,
      target_id: orphan.target_id,
      source_entity_id: orphan.source_entity_id,
      source_file: orphan.source_file,
      line_start: orphan.line_start,
      line_end: orphan.line_end,
      reason: orphan.validation_error,
      project_id: projectId,
    });
  }

  // 5. Signal TDD mismatches to semantic corpus and log DECISION
  for (const mismatch of tddMismatches) {
    // Signal with deterministic ID for idempotent replay
    // Use TDD_COHERENCE_MISMATCH type - distinct from ORPHAN_MARKER
    await corpus.capture({
      type: 'TDD_COHERENCE_MISMATCH',
      marker_type: mismatch.type,
      target_id: mismatch.target_id,
      source_entity_id: mismatch.source_entity_id,
      project_id: projectId,
      context: {
        source_file: mismatch.source_file,
        line_start: mismatch.line_start,
        line_end: mismatch.line_end,
        signal_instance_id: computeSignalInstanceId(mismatch),
      },
      evidence: {
        expected_entity_type: 'E06',
        mismatch: true,
        validation_error: mismatch.validation_error,
      },
    });

    // Log TDD_COHERENCE_MISMATCH decision to shadow ledger
    await ledger.logDecision({
      decision: 'TDD_COHERENCE_MISMATCH',
      marker_type: mismatch.type,
      target_id: mismatch.target_id,
      source_entity_id: mismatch.source_entity_id,
      source_file: mismatch.source_file,
      line_start: mismatch.line_start,
      line_end: mismatch.line_end,
      reason: mismatch.validation_error,
      project_id: projectId,
    });
  }

  return {
    validated,
    orphans,
    tddMismatches,
    stats,
  };
}

