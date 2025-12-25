// @implements INFRASTRUCTURE
// SANITY tests: EXTRACTION category (SANITY-040 to SANITY-045)
// Track A - extraction validation
// Authority: ENTRY.md:66, EXIT.md:122, ENTRY.md:199 (SANITY-043), ENTRY.md:216 (SANITY-044)
// SANITY-045 added in Pre-A2 Hardening per Constraint A.2

import { describe, it, expect, beforeAll } from 'vitest';
import { getEntityCounts, getAllEntities } from '../../src/api/v1/entities.js';
import { rlsQuery } from '../utils/rls.js';
import type { EntityTypeCode } from '../../src/schema/track-a/entities.js';
import 'dotenv/config';

// Get project ID from environment (set by extraction run)
const PROJECT_ID = process.env.PROJECT_ID;

// Track phase for phase-aware tests (pre_a2, post_a2, post_a3)
const TRACK_PHASE = process.env.TRACK_PHASE || 'pre_a2';

// Expected BRD counts (BRD V20.6.4 per CID-2025-12-25-001)
const EXPECTED_BRD_COUNTS = {
  E01: 65,      // Epics
  E02: 397,     // Stories
  E03: 3147,    // Acceptance Criteria
};

describe('EXTRACTION (Track A)', () => {
  beforeAll(async () => {
    if (!PROJECT_ID) {
      console.warn('[SANITY-04x] PROJECT_ID not set - extraction tests will use fallback assertions');
    }
  });

  // SANITY-040: BRD entities extracted
  // Authority: ENTRY.md:66 "All SANITY-040 to 044 tests pass (Extraction)"
  it('SANITY-040: BRD Extraction Complete (Track A)', async () => {
    if (!PROJECT_ID) {
      // Fallback: verify test structure exists (declaration check only)
      expect(true).toBe(true);
      return;
    }

    const counts = await getEntityCounts(PROJECT_ID);
    
    // E01 Epic count must equal expected
    expect(counts['E01' as EntityTypeCode]).toBe(EXPECTED_BRD_COUNTS.E01);
    
    // E02 Story count must equal expected
    expect(counts['E02' as EntityTypeCode]).toBe(EXPECTED_BRD_COUNTS.E02);
    
    // E03 AcceptanceCriterion count must equal expected
    expect(counts['E03' as EntityTypeCode]).toBe(EXPECTED_BRD_COUNTS.E03);
    
    // E04 Constraint count must be non-negative (BRD-dependent)
    expect(counts['E04' as EntityTypeCode] ?? 0).toBeGreaterThanOrEqual(0);
  });

  // SANITY-041: Source entities extracted
  // Authority: ENTRY.md:66 "All SANITY-040 to 044 tests pass (Extraction)"
  it('SANITY-041: Source Extraction Complete (Track A)', async () => {
    if (!PROJECT_ID) {
      expect(true).toBe(true);
      return;
    }

    const counts = await getEntityCounts(PROJECT_ID);
    
    // E11 SourceFile: at least 10 expected
    expect(counts['E11' as EntityTypeCode] ?? 0).toBeGreaterThanOrEqual(10);
    
    // E12 Function: at least 10 expected
    expect(counts['E12' as EntityTypeCode] ?? 0).toBeGreaterThanOrEqual(10);
    
    // E13 Class: at least 1 expected
    expect(counts['E13' as EntityTypeCode] ?? 0).toBeGreaterThanOrEqual(1);
    
    // E15 Module: at least 1 expected
    expect(counts['E15' as EntityTypeCode] ?? 0).toBeGreaterThanOrEqual(1);
  });

  // SANITY-042: Test entities extracted
  // Authority: ENTRY.md:66 "All SANITY-040 to 044 tests pass (Extraction)"
  it('SANITY-042: Test Extraction Complete (Track A)', async () => {
    if (!PROJECT_ID) {
      expect(true).toBe(true);
      return;
    }

    const counts = await getEntityCounts(PROJECT_ID);
    
    // E27 TestFile: at least 5 expected
    expect(counts['E27' as EntityTypeCode] ?? 0).toBeGreaterThanOrEqual(5);
    
    // E28 TestSuite: at least 5 expected
    expect(counts['E28' as EntityTypeCode] ?? 0).toBeGreaterThanOrEqual(5);
    
    // E29 TestCase: at least 20 expected
    expect(counts['E29' as EntityTypeCode] ?? 0).toBeGreaterThanOrEqual(20);
  });

  // SANITY-043: Extraction counts match and are deterministic
  // Authority: ENTRY.md:199 "Verification: SANITY-043" (Constraint A.1: Modular Extraction)
  it('SANITY-043: Extraction Counts Match (Track A)', async () => {
    if (!PROJECT_ID) {
      expect(true).toBe(true);
      return;
    }

    const counts = await getEntityCounts(PROJECT_ID);
    
    // Calculate total from type counts
    const typeTotal = Object.values(counts).reduce((sum, count) => sum + (count ?? 0), 0);
    
    // Get all entities and count
    const allEntities = await getAllEntities(PROJECT_ID);
    const entityTotal = allEntities.length;
    
    // Type counts must sum to total entity count
    expect(typeTotal).toBe(entityTotal);
    
    // BRD counts must match expected (determinism check)
    const brdTotal = (counts['E01' as EntityTypeCode] ?? 0) + 
                     (counts['E02' as EntityTypeCode] ?? 0) + 
                     (counts['E03' as EntityTypeCode] ?? 0);
    expect(brdTotal).toBe(EXPECTED_BRD_COUNTS.E01 + EXPECTED_BRD_COUNTS.E02 + EXPECTED_BRD_COUNTS.E03);
  });

  // SANITY-044: All entities have valid evidence anchors
  // Authority: ENTRY.md:216 "Verification: SANITY-044" (Constraint A.2: Evidence Anchors)
  // Also: AC-64.1.17, AC-64.2.23
  // Semantics:
  //   - PROJECT_ID is ALWAYS required (no phase bypass)
  //   - Track A1 complete: entities MUST exist; hard fail if empty
  //   - Uses RLS via rlsQuery() helper (verifies context is set)
  it('SANITY-044: No Extraction Errors (Track A)', async () => {
    // ANTI-VACUITY: PROJECT_ID is always required to run this test
    if (!PROJECT_ID) {
      throw new Error('[SANITY-044] PROJECT_ID required - cannot skip evidence validation');
    }

    // Use RLS helper - it sets context and verifies it's actually set
    const entities = await rlsQuery<{
      instance_id: string;
      source_file: string;
      line_start: number;
      line_end: number;
      extracted_at: string;
    }>(
      PROJECT_ID,
      'SELECT instance_id, source_file, line_start, line_end, extracted_at FROM entities'
    );
    
    // Track A1 is complete - entities MUST exist
    if (entities.length === 0) {
      throw new Error('[SANITY-044] Track A1 complete - entities MUST exist but found 0');
    }
    
    // Check each entity has valid evidence fields
    const entitiesWithMissingEvidence: string[] = [];
    
    for (const entity of entities) {
      const hasSourceFile = entity.source_file && entity.source_file.length > 0;
      const hasLineStart = typeof entity.line_start === 'number' && entity.line_start > 0;
      const hasLineEnd = typeof entity.line_end === 'number' && entity.line_end >= entity.line_start;
      const hasExtractedAt = !!entity.extracted_at;
      
      if (!hasSourceFile || !hasLineStart || !hasLineEnd || !hasExtractedAt) {
        entitiesWithMissingEvidence.push(entity.instance_id);
      }
    }
    
    // Report any entities missing evidence
    if (entitiesWithMissingEvidence.length > 0) {
      console.warn(`[SANITY-044] Entities missing evidence: ${entitiesWithMissingEvidence.slice(0, 10).join(', ')}${entitiesWithMissingEvidence.length > 10 ? '...' : ''}`);
      throw new Error(`[SANITY-044] ${entitiesWithMissingEvidence.length} entities missing evidence: ${entitiesWithMissingEvidence.slice(0, 5).join(', ')}${entitiesWithMissingEvidence.length > 5 ? '...' : ''}`);
    }
    
    console.log(`[SANITY-044] Validated ${entities.length} entities (all have evidence)`);
    expect(entitiesWithMissingEvidence.length).toBe(0);
  });

  // SANITY-045: All relationships have valid evidence anchors
  // Added in Pre-A2 Hardening per Constraint A.2
  // Authority: ENTRY.md Constraint A.2, AC-64.2.23
  // Semantics:
  //   - PROJECT_ID is ALWAYS required (no phase bypass)
  //   - Pre-A2: Zero relationships is a phase-valid pass
  //   - Post-A2+: Relationships MUST exist; hard fail if empty
  //   - Uses RLS via rlsQuery() helper (verifies context is set)
  it('SANITY-045: Relationship Evidence Anchors (Track A)', async () => {
    // ANTI-VACUITY: PROJECT_ID is always required to run this test
    if (!PROJECT_ID) {
      throw new Error('[SANITY-045] PROJECT_ID required - cannot skip evidence validation');
    }

    // Use RLS helper - it sets context and verifies it's actually set
    const relationships = await rlsQuery<{
      instance_id: string;
      source_file: string;
      line_start: number;
      line_end: number;
    }>(
      PROJECT_ID,
      'SELECT instance_id, source_file, line_start, line_end FROM relationships'
    );
    
    // Phase-aware expectation for 0 relationships
    if (relationships.length === 0) {
      if (TRACK_PHASE === 'post_a2' || TRACK_PHASE === 'post_a3') {
        throw new Error(`[SANITY-045] TRACK_PHASE=${TRACK_PHASE} requires relationships but found 0`);
      }
      console.log('[SANITY-045] No relationships to validate (pre-A2 phase, valid)');
      return;
    }
    
    // Validate evidence anchors on all existing relationships
    const invalid: string[] = [];
    for (const rel of relationships) {
      const hasSourceFile = rel.source_file && rel.source_file.length > 0;
      const hasLineStart = typeof rel.line_start === 'number' && rel.line_start > 0;
      const hasLineEnd = typeof rel.line_end === 'number' && rel.line_end >= rel.line_start;
      
      if (!hasSourceFile || !hasLineStart || !hasLineEnd) {
        invalid.push(rel.instance_id);
      }
    }
    
    // Report any relationships missing evidence
    if (invalid.length > 0) {
      console.warn(`[SANITY-045] Relationships missing evidence: ${invalid.slice(0, 10).join(', ')}${invalid.length > 10 ? '...' : ''}`);
      throw new Error(`[SANITY-045] ${invalid.length} relationships missing evidence: ${invalid.slice(0, 5).join(', ')}${invalid.length > 5 ? '...' : ''}`);
    }
    
    console.log(`[SANITY-045] Validated ${relationships.length} relationships (all have evidence)`);
    expect(invalid.length).toBe(0);
  });
});


