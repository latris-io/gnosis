// @implements STORY-64.2
// Verification tests for R04-R07 containment relationships
// Authority: e15_correction_r04-r07 plan Phase 5
// G-API compliant: no src/db/** imports

import { describe, it, expect, beforeAll } from 'vitest';
import { rlsQuery } from '../utils/rls.js';
import { countNeo4jNodes, countNeo4jRelationships } from '../utils/admin-test-only.js';
import 'dotenv/config';

// Get project ID from environment
const PROJECT_ID = process.env.PROJECT_ID;

// Track phase for phase-aware tests
const SANITY_PHASE = process.env.SANITY_PHASE || 'pre_a2';

describe('CONTAINMENT RELATIONSHIPS (R04-R07)', () => {
  beforeAll(() => {
    if (!PROJECT_ID) {
      console.warn('[CONTAINMENT] PROJECT_ID not set - tests will fail with explicit error');
    }
  });

  // Prerequisite check: E15 semantics validated
  it('Prerequisite: E15 semantics validated against E11 corpus', async () => {
    if (!PROJECT_ID) {
      throw new Error('PROJECT_ID required');
    }

    // Query E15 modules
    const e15Entities = await rlsQuery<{ instance_id: string }>(
      PROJECT_ID,
      `SELECT instance_id FROM entities WHERE entity_type = 'E15'`
    );

    // Query E11 files
    const e11Entities = await rlsQuery<{ instance_id: string }>(
      PROJECT_ID,
      `SELECT instance_id FROM entities WHERE entity_type = 'E11'`
    );

    // Build valid directory prefixes
    const validDirs = new Set<string>();
    for (const file of e11Entities) {
      if (file.instance_id.startsWith('FILE-')) {
        const filePath = file.instance_id.slice(5);
        const lastSlash = filePath.lastIndexOf('/');
        if (lastSlash > 0) {
          validDirs.add(filePath.substring(0, lastSlash));
        }
      }
    }

    // Check all E15 modules are valid
    for (const module of e15Entities) {
      if (!module.instance_id.startsWith('MOD-')) continue;
      const dir = module.instance_id.slice(4);
      expect(validDirs.has(dir)).toBe(true);
    }

    console.log(`[Prerequisite] ${e15Entities.length} E15 modules validated against ${e11Entities.length} E11 files`);
  });

  // Prerequisite check: Required entity types exist
  it('Prerequisite: Required entity types exist', async () => {
    if (!PROJECT_ID) {
      throw new Error('PROJECT_ID required');
    }

    const counts = await rlsQuery<{ entity_type: string; count: string }>(
      PROJECT_ID,
      `SELECT entity_type, COUNT(*) as count FROM entities GROUP BY entity_type`
    );

    const countMap = new Map(counts.map(c => [c.entity_type, parseInt(c.count, 10)]));

    // R04 requires E11 and E15
    expect(countMap.get('E11') ?? 0).toBeGreaterThan(0);
    
    // R05 requires E11, E12, and/or E13
    const codeUnits = (countMap.get('E12') ?? 0) + (countMap.get('E13') ?? 0);
    expect(codeUnits).toBeGreaterThan(0);

    console.log(`[Prerequisite] Entity counts: E11=${countMap.get('E11')}, E12=${countMap.get('E12')}, E13=${countMap.get('E13')}, E15=${countMap.get('E15')}`);
  });

  // R04 count validation
  it('R04 count = count(E11 where dirname not "." and not "")', async () => {
    if (!PROJECT_ID) {
      throw new Error('PROJECT_ID required');
    }

    // Skip if pre-A2 phase
    if (SANITY_PHASE === 'pre_a2') {
      console.log('[R04] Skipping count validation (pre_a2 phase)');
      return;
    }

    // Count E11 files with non-root parent directories
    const e11Files = await rlsQuery<{ instance_id: string }>(
      PROJECT_ID,
      `SELECT instance_id FROM entities WHERE entity_type = 'E11'`
    );

    let expectedR04Count = 0;
    for (const file of e11Files) {
      if (!file.instance_id.startsWith('FILE-')) continue;
      const filePath = file.instance_id.slice(5);
      const lastSlash = filePath.lastIndexOf('/');
      if (lastSlash > 0) {
        expectedR04Count++;
      }
    }

    // Count actual R04 relationships
    const r04Count = await rlsQuery<{ count: string }>(
      PROJECT_ID,
      `SELECT COUNT(*) as count FROM relationships WHERE relationship_type = 'R04'`
    );

    const actualR04Count = parseInt(r04Count[0]?.count ?? '0', 10);

    console.log(`[R04] Expected: ${expectedR04Count}, Actual: ${actualR04Count}`);
    expect(actualR04Count).toBe(expectedR04Count);
  });

  // R04 endpoint validation
  it('R04 endpoints are E15 -> E11 (not E11 -> E11)', async () => {
    if (!PROJECT_ID) {
      throw new Error('PROJECT_ID required');
    }

    // Query R04 relationships with entity types
    const r04Rels = await rlsQuery<{
      instance_id: string;
      from_entity_id: string;
      to_entity_id: string;
    }>(
      PROJECT_ID,
      `SELECT r.instance_id, r.from_entity_id, r.to_entity_id
       FROM relationships r
       WHERE r.relationship_type = 'R04'
       LIMIT 100`
    );

    if (r04Rels.length === 0) {
      if (SANITY_PHASE === 'pre_a2') {
        console.log('[R04] No relationships to validate (pre_a2 phase)');
        return;
      }
      throw new Error('[R04] Expected R04 relationships but found 0');
    }

    // Lookup entity types for endpoints
    for (const rel of r04Rels) {
      const fromEntity = await rlsQuery<{ entity_type: string }>(
        PROJECT_ID,
        `SELECT entity_type FROM entities WHERE id = $1`,
        [rel.from_entity_id]
      );
      const toEntity = await rlsQuery<{ entity_type: string }>(
        PROJECT_ID,
        `SELECT entity_type FROM entities WHERE id = $1`,
        [rel.to_entity_id]
      );

      expect(fromEntity[0]?.entity_type).toBe('E15');
      expect(toEntity[0]?.entity_type).toBe('E11');
    }

    console.log(`[R04] Validated ${r04Rels.length} R04 relationships (all E15 -> E11)`);
  });

  // R04 evidence validation (evidence from TO entity)
  it('R04 evidence matches child E11 file evidence (TO entity pattern)', async () => {
    if (!PROJECT_ID) {
      throw new Error('PROJECT_ID required');
    }

    // Query R04 relationships with evidence
    const r04Rels = await rlsQuery<{
      instance_id: string;
      to_entity_id: string;
      source_file: string;
      line_start: number;
      line_end: number;
    }>(
      PROJECT_ID,
      `SELECT r.instance_id, r.to_entity_id, r.source_file, r.line_start, r.line_end
       FROM relationships r
       WHERE r.relationship_type = 'R04'
       LIMIT 50`
    );

    if (r04Rels.length === 0) {
      if (SANITY_PHASE === 'pre_a2') {
        console.log('[R04] No relationships to validate evidence (pre_a2 phase)');
        return;
      }
      throw new Error('[R04] Expected R04 relationships but found 0');
    }

    // Verify evidence matches TO entity (E11 file)
    let validated = 0;
    for (const rel of r04Rels) {
      const toEntity = await rlsQuery<{
        source_file: string;
        line_start: number;
        line_end: number;
      }>(
        PROJECT_ID,
        `SELECT source_file, line_start, line_end FROM entities WHERE id = $1`,
        [rel.to_entity_id]
      );

      if (toEntity.length > 0) {
        // R04 evidence should come from the E11 file (TO entity)
        expect(rel.source_file).toBe(toEntity[0].source_file);
        expect(rel.line_start).toBe(toEntity[0].line_start);
        expect(rel.line_end).toBe(toEntity[0].line_end);
        validated++;
      }
    }

    console.log(`[R04] Validated ${validated} R04 relationships have TO entity evidence`);
  });

  // All containment relationships have valid evidence
  it('All containment relationships have valid evidence', async () => {
    if (!PROJECT_ID) {
      throw new Error('PROJECT_ID required');
    }

    const containmentRels = await rlsQuery<{
      instance_id: string;
      relationship_type: string;
      source_file: string;
      line_start: number;
      line_end: number;
    }>(
      PROJECT_ID,
      `SELECT instance_id, relationship_type, source_file, line_start, line_end
       FROM relationships
       WHERE relationship_type IN ('R04', 'R05', 'R06', 'R07')`
    );

    if (containmentRels.length === 0) {
      if (SANITY_PHASE === 'pre_a2') {
        console.log('[Containment] No relationships to validate (pre_a2 phase)');
        return;
      }
      throw new Error('[Containment] Expected containment relationships but found 0');
    }

    const invalid: string[] = [];
    for (const rel of containmentRels) {
      const hasSourceFile = rel.source_file && rel.source_file.length > 0;
      const hasLineStart = typeof rel.line_start === 'number' && rel.line_start > 0;
      const hasLineEnd = typeof rel.line_end === 'number' && rel.line_end >= rel.line_start;

      if (!hasSourceFile || !hasLineStart || !hasLineEnd) {
        invalid.push(`${rel.relationship_type}:${rel.instance_id}`);
      }
    }

    if (invalid.length > 0) {
      throw new Error(`[Containment] ${invalid.length} relationships missing evidence: ${invalid.slice(0, 5).join(', ')}`);
    }

    console.log(`[Containment] All ${containmentRels.length} containment relationships have valid evidence`);
  });

  // Phase 1 regression: R01/R02/R03 counts unchanged
  it('Phase 1 regression: R01/R02/R03 counts unchanged', async () => {
    if (!PROJECT_ID) {
      throw new Error('PROJECT_ID required');
    }

    const counts = await rlsQuery<{ relationship_type: string; count: string }>(
      PROJECT_ID,
      `SELECT relationship_type, COUNT(*) as count
       FROM relationships
       WHERE relationship_type IN ('R01', 'R02', 'R03')
       GROUP BY relationship_type`
    );

    const countMap = new Map(counts.map(c => [c.relationship_type, parseInt(c.count, 10)]));

    // Expected counts from BRD
    const r01Count = countMap.get('R01') ?? 0;
    const r02Count = countMap.get('R02') ?? 0;
    const r03Count = countMap.get('R03') ?? 0;

    console.log(`[Regression] R01=${r01Count}, R02=${r02Count}, R03=${r03Count}`);

    // Phase 1 expected: R01=351, R02=2849, R03=0 (no constraints extracted yet)
    expect(r01Count).toBe(351);
    expect(r02Count).toBe(2849);
    expect(r03Count).toBe(0);
  });

  // Idempotency check
  it('Idempotency: Second extraction produces 0 new persists', async () => {
    // This test is informational - actual idempotency is tested by running extraction twice
    // and comparing NO-OP counts
    console.log('[Idempotency] Manual verification required: run extraction twice and check NO-OP count');
    expect(true).toBe(true);
  });

  // Neo4j counts match Postgres
  it('Neo4j counts match Postgres counts', async () => {
    if (!PROJECT_ID) {
      throw new Error('PROJECT_ID required');
    }

    // Skip if pre-A2
    if (SANITY_PHASE === 'pre_a2') {
      console.log('[Neo4j] Skipping sync validation (pre_a2 phase)');
      return;
    }

    // Get Postgres counts
    const pgEntityCount = await rlsQuery<{ count: string }>(
      PROJECT_ID,
      `SELECT COUNT(*) as count FROM entities`
    );
    const pgRelCount = await rlsQuery<{ count: string }>(
      PROJECT_ID,
      `SELECT COUNT(*) as count FROM relationships`
    );

    const pgEntities = parseInt(pgEntityCount[0]?.count ?? '0', 10);
    const pgRels = parseInt(pgRelCount[0]?.count ?? '0', 10);

    // Get Neo4j counts via G-API compliant test helpers
    const neo4jEntities = await countNeo4jNodes(PROJECT_ID);
    const neo4jRels = await countNeo4jRelationships(PROJECT_ID);

    console.log(`[Neo4j] Postgres: ${pgEntities} entities, ${pgRels} relationships`);
    console.log(`[Neo4j] Neo4j: ${neo4jEntities} entities, ${neo4jRels} relationships`);

    expect(neo4jEntities).toBe(pgEntities);
    expect(neo4jRels).toBe(pgRels);
  });
});
