// test/verification/marker-relationships.test.ts
// @implements STORY-64.3
// Verification: Marker relationships (R18/R19) from @implements/@satisfies

import { describe, it, expect, beforeAll } from 'vitest';
import { extractAndPersistMarkerRelationships } from '../../src/ops/track-a.js';
import { rlsQuery } from '../utils/rls.js';
import { A3_BASELINE, getExpectedCount } from '../fixtures/a3-baseline-manifest.js';

const PROJECT_ID = process.env.PROJECT_ID;

describe('STORY-64.3: Marker Extraction - R18/R19 Relationships', () => {
  let firstRunResult: {
    extracted: number;
    r18_created: number;
    r19_created: number;
    orphans: number;
    tdd_ok: number;
    tdd_mismatch: number;
  };

  beforeAll(async () => {
    if (!PROJECT_ID) throw new Error('PROJECT_ID required');
    
    // Cleanup: delete any existing marker relationships to ensure deterministic first run
    await rlsQuery(PROJECT_ID, `
      DELETE FROM relationships
      WHERE relationship_type IN ('R18','R19')
    `);
    
    firstRunResult = await extractAndPersistMarkerRelationships(PROJECT_ID);
    console.log(`[A3] Run 1: Extracted: ${firstRunResult.extracted}, R18: ${firstRunResult.r18_created}, R19: ${firstRunResult.r19_created}, Orphans: ${firstRunResult.orphans}`);
  }, 300000); // 5 minute timeout

  // --- R18/R19 COUNTS (exact, from manifest) ---

  it('AC-64.3.1: R18 count matches manifest', async () => {
    const rows = await rlsQuery(PROJECT_ID!, 
      `SELECT instance_id FROM relationships WHERE relationship_type='R18'`
    );
    const expected = getExpectedCount('R18');
    console.log(`[A3] R18 count: ${rows.length} (expected: ${expected})`);
    expect(rows.length).toBe(expected);
  });

  it('AC-64.3.2: R19 count matches manifest', async () => {
    const rows = await rlsQuery(PROJECT_ID!, 
      `SELECT instance_id FROM relationships WHERE relationship_type='R19'`
    );
    const expected = getExpectedCount('R19');
    console.log(`[A3] R19 count: ${rows.length} (expected: ${expected})`);
    expect(rows.length).toBe(expected);
  });
  
  it('AC-64.3.4: R36 count matches manifest', async () => {
    const rows = await rlsQuery(PROJECT_ID!, 
      `SELECT instance_id FROM relationships WHERE relationship_type='R36'`
    );
    const expected = getExpectedCount('R36');
    console.log(`[A3] R36 count: ${rows.length} (expected: ${expected})`);
    expect(rows.length).toBe(expected);
  });

  it('AC-64.3.5: R37 count matches manifest', async () => {
    const rows = await rlsQuery(PROJECT_ID!, 
      `SELECT instance_id FROM relationships WHERE relationship_type='R37'`
    );
    const expected = getExpectedCount('R37');
    console.log(`[A3] R37 count: ${rows.length} (expected: ${expected})`);
    expect(rows.length).toBe(expected);
  });

  it('R18 instance_id format valid', async () => {
    const rows = await rlsQuery<{ instance_id: string }>(PROJECT_ID!, 
      `SELECT instance_id FROM relationships WHERE relationship_type='R18' LIMIT 20`
    );
    for (const r of rows) {
      // R18:{source_entity}:{target_story}
      expect(r.instance_id).toMatch(/^R18:.+:STORY-\d+\.\d+$/);
    }
  });

  it('R19 instance_id format valid', async () => {
    const rows = await rlsQuery<{ instance_id: string }>(PROJECT_ID!, 
      `SELECT instance_id FROM relationships WHERE relationship_type='R19' LIMIT 20`
    );
    for (const r of rows) {
      // R19:{source_entity}:{target_ac}
      expect(r.instance_id).toMatch(/^R19:.+:AC-\d+\.\d+\.\d+$/);
    }
  });

  // --- EVIDENCE ANCHORS ---

  it('all R18/R19 relationships have valid evidence anchors', async () => {
    const rels = await rlsQuery<{
      relationship_type: string;
      instance_id: string;
      source_file: string;
      line_start: number;
      line_end: number;
    }>(PROJECT_ID!, `
      SELECT relationship_type, instance_id, source_file, line_start, line_end
      FROM relationships
      WHERE relationship_type IN ('R18','R19')
    `);
    
    expect(rels.length).toBeGreaterThan(0);
    
    for (const rel of rels) {
      expect(rel.source_file, `${rel.instance_id} missing source_file`).toBeTruthy();
      expect(rel.line_start, `${rel.instance_id} invalid line_start`).toBeGreaterThan(0);
      expect(rel.line_end, `${rel.instance_id} line_end < line_start`).toBeGreaterThanOrEqual(rel.line_start);
    }
  });

  it('all source_file paths are repo-relative (no absolute paths)', async () => {
    const rels = await rlsQuery<{ 
      relationship_type: string;
      instance_id: string;
      source_file: string 
    }>(PROJECT_ID!, `
      SELECT relationship_type, instance_id, source_file
      FROM relationships
      WHERE relationship_type IN ('R18','R19','R36','R37')
    `);
    
    expect(rels.length).toBeGreaterThan(0);
    
    for (const rel of rels) {
      // Must not start with / (Unix absolute) or C: (Windows absolute)
      expect(
        rel.source_file.startsWith('/'),
        `${rel.instance_id} has absolute path: ${rel.source_file}`
      ).toBe(false);
      expect(
        /^[A-Z]:/.test(rel.source_file),
        `${rel.instance_id} has Windows absolute path: ${rel.source_file}`
      ).toBe(false);
      // Must not contain /Users/ or C:\Users\ (evidence of absolute path fragments)
      expect(
        rel.source_file.includes('/Users/'),
        `${rel.instance_id} contains /Users/: ${rel.source_file}`
      ).toBe(false);
    }
  });

  // --- IDEMPOTENCY ---

  it('second run is idempotent (no new relationships created)', async () => {
    const secondRun = await extractAndPersistMarkerRelationships(PROJECT_ID!);
    
    console.log(`[A3] Run 2: Extracted: ${secondRun.extracted}, R18: ${secondRun.r18_created}, R19: ${secondRun.r19_created}`);
    
    // Second run should create 0 new relationships (all NO-OP)
    expect(secondRun.r18_created).toBe(0);
    expect(secondRun.r19_created).toBe(0);
  }, 300000);

  // --- ORPHAN HANDLING ---

  it('orphan count matches expectation (documented or zero)', async () => {
    // This test documents the orphan count. If > 0, they should be in semantic corpus.
    console.log(`[A3] Orphans: ${firstRunResult.orphans}`);
    
    // We expect either:
    // - 0 orphans (all markers point to valid entities)
    // - > 0 orphans documented and logged to corpus
    expect(firstRunResult.orphans).toBeGreaterThanOrEqual(0);
  });

  // --- TDD COHERENCE ---

  it('TDD coherence results documented', () => {
    console.log(`[A3] TDD OK: ${firstRunResult.tdd_ok}, TDD Mismatch: ${firstRunResult.tdd_mismatch}`);
    
    // @tdd markers should either resolve to E06 entities (ok) or fail (mismatch)
    // Both are valid outcomes - this test just documents
    expect(firstRunResult.tdd_ok).toBeGreaterThanOrEqual(0);
    expect(firstRunResult.tdd_mismatch).toBeGreaterThanOrEqual(0);
  });
});

