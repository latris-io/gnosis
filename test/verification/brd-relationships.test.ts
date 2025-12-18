// test/verification/brd-relationships.test.ts
// @implements STORY-64.2
// Verification: BRD hierarchy relationships (R01/R02/R03)

import { describe, it, expect, beforeAll } from 'vitest';
import { extractAndPersistBrdRelationships } from '../../src/ops/track-a.js';
import { rlsQuery } from '../utils/rls.js';
import {
  clearNeo4jProject,
  countNeo4jNodes,
  countNeo4jRelationships,
} from '../utils/admin-test-only.js';

const PROJECT_ID = process.env.PROJECT_ID;

describe('A2 Phase 1: BRD relationships (R01/R02/R03)', () => {
  let firstRunResult: { extracted: number; persisted: number; synced: number };

  beforeAll(async () => {
    if (!PROJECT_ID) throw new Error('PROJECT_ID required');
    
    // Cleanup: delete any existing BRD relationships to ensure deterministic first run
    await rlsQuery(PROJECT_ID, `
      DELETE FROM relationships
      WHERE relationship_type IN ('R01','R02','R03')
    `);
    
    firstRunResult = await extractAndPersistBrdRelationships(PROJECT_ID);
    console.log(`[A2-Phase1] Run 1: Extracted: ${firstRunResult.extracted}, Persisted: ${firstRunResult.persisted}, Synced: ${firstRunResult.synced}`);
  }, 900000); // 15 minute timeout for extraction (batch upsert is slow with remote DB)

  it('R01 count = 351 and instance_id format valid', async () => {
    const rows = await rlsQuery(PROJECT_ID!, 
      `SELECT instance_id FROM relationships WHERE relationship_type='R01'`
    );
    expect(rows.length).toBe(351);
    for (const r of rows.slice(0, 10)) {
      expect(r.instance_id).toMatch(/^R01:EPIC-\d+:STORY-\d+\.\d+$/);
    }
  });

  it('R02 count = 2849 and instance_id format valid', async () => {
    const rows = await rlsQuery(PROJECT_ID!, 
      `SELECT instance_id FROM relationships WHERE relationship_type='R02'`
    );
    expect(rows.length).toBe(2849);
    for (const r of rows.slice(0, 10)) {
      expect(r.instance_id).toMatch(/^R02:STORY-\d+\.\d+:AC-\d+\.\d+\.\d+$/);
    }
  });

  it('R03 count = 0', async () => {
    const rows = await rlsQuery(PROJECT_ID!, 
      `SELECT 1 FROM relationships WHERE relationship_type='R03'`
    );
    expect(rows.length).toBe(0);
  });

  it('all emitted relationships have valid evidence anchors', async () => {
    const rels = await rlsQuery(PROJECT_ID!, `
      SELECT relationship_type, instance_id, source_file, line_start, line_end
      FROM relationships
      WHERE relationship_type IN ('R01','R02','R03')
    `);
    expect(rels.length).toBe(3200);
    for (const rel of rels) {
      expect(rel.source_file).toBeTruthy();
      expect(rel.line_start).toBeGreaterThan(0);
      expect(rel.line_end).toBeGreaterThanOrEqual(rel.line_start);
      expect(rel.instance_id).toMatch(/^R\d{2}:.+:.+$/);
    }
  });

  // Stronger evidence test: verify evidence matches TO entity
  it('R01 evidence matches Story entity evidence (sample 10)', async () => {
    const sample = await rlsQuery(PROJECT_ID!, `
      SELECT r.instance_id, r.source_file AS rel_sf, r.line_start AS rel_ls, r.line_end AS rel_le,
             e.source_file AS ent_sf, e.line_start AS ent_ls, e.line_end AS ent_le
      FROM relationships r
      JOIN entities e ON e.id = r.to_entity_id
      WHERE r.relationship_type = 'R01'
      ORDER BY r.instance_id
      LIMIT 10
    `);
    expect(sample.length).toBe(10);
    for (const row of sample) {
      expect(row.rel_sf).toBe(row.ent_sf);
      expect(row.rel_ls).toBe(row.ent_ls);
      expect(row.rel_le).toBe(row.ent_le);
    }
  });

  it('R02 evidence matches AC entity evidence (sample 10)', async () => {
    const sample = await rlsQuery(PROJECT_ID!, `
      SELECT r.instance_id, r.source_file AS rel_sf, r.line_start AS rel_ls, r.line_end AS rel_le,
             e.source_file AS ent_sf, e.line_start AS ent_ls, e.line_end AS ent_le
      FROM relationships r
      JOIN entities e ON e.id = r.to_entity_id
      WHERE r.relationship_type = 'R02'
      ORDER BY r.instance_id
      LIMIT 10
    `);
    expect(sample.length).toBe(10);
    for (const row of sample) {
      expect(row.rel_sf).toBe(row.ent_sf);
      expect(row.rel_ls).toBe(row.ent_ls);
      expect(row.rel_le).toBe(row.ent_le);
    }
  });

  // Idempotency: second run should persist 0 (all NO-OP)
  it('second run is idempotent (persisted = 0)', async () => {
    const run2 = await extractAndPersistBrdRelationships(PROJECT_ID!);
    console.log(`[A2-Phase1] Run 2: Extracted: ${run2.extracted}, Persisted: ${run2.persisted}, Synced: ${run2.synced}`);
    
    // First run should have persisted > 0
    expect(firstRunResult.persisted).toBeGreaterThan(0);
    
    // Second run must still extract all 3200 (not skip extraction)
    expect(run2.extracted).toBe(3200);
    
    // Second run should persist 0 (idempotent - all NO-OP)
    expect(run2.persisted).toBe(0);
    
    // Counts unchanged in DB
    const total = await rlsQuery(PROJECT_ID!, 
      `SELECT COUNT(*)::int AS n FROM relationships WHERE relationship_type IN ('R01','R02','R03')`
    );
    expect(total[0].n).toBe(3200);
  }, 900000); // 15 minute timeout for second extraction
});

describe('Neo4j entities-first prerequisite', () => {
  it('enforces entities sync before relationship sync', async () => {
    if (!PROJECT_ID) throw new Error('PROJECT_ID required');
    
    // 1) Clear Neo4j for this project only (scoped by project_id)
    await clearNeo4jProject(PROJECT_ID);
    
    // 2) Verify Neo4j empty for this project
    expect(await countNeo4jNodes(PROJECT_ID)).toBe(0);
    expect(await countNeo4jRelationships(PROJECT_ID)).toBe(0);
    
    // 3) Run extraction (triggers persist+sync with prerequisite)
    const res = await extractAndPersistBrdRelationships(PROJECT_ID);
    
    // 4) STRONG TRUTH: Verify Neo4j now has correct counts
    expect(await countNeo4jNodes(PROJECT_ID)).toBe(3516);
    expect(await countNeo4jRelationships(PROJECT_ID)).toBe(3200);
    
    // 5) Safe assertions for return value (MERGE may report 0 on re-sync)
    // entitiesSynced reports what the sync function returned, not Neo4j truth
    // ops always returns a number (0 when absent), so this is safe
    expect(res.entitiesSynced).toBeGreaterThanOrEqual(0);
    
    // synced should match relationship count (we cleared Neo4j first)
    expect(res.synced).toBe(3200);
  }, 120000);  // 120 seconds (safe margin for slow CI)
});
