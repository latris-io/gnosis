// test/sanity/integrity.test.ts
// @implements INFRASTRUCTURE
// Per Verification Spec V20.6.4 §2.3

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';
import * as fs from 'fs';
import 'dotenv/config';

let pool: Pool;

beforeAll(async () => {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
});

afterAll(async () => {
  await pool.end();
});

describe('INTEGRITY Tests', () => {
  // SANITY-010: Database Schema Matches Cursor Plan
  describe('SANITY-010: Database Schema Matches Cursor Plan', () => {
    it('entities table has correct columns', async () => {
      const result = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'entities'
        ORDER BY ordinal_position
      `);
      
      const columns = result.rows.map(r => r.column_name);
      
      // Required columns per Cursor Plan lines 444-456
      expect(columns).toContain('id');
      expect(columns).toContain('entity_type');      // NOT 'type'
      expect(columns).toContain('instance_id');
      expect(columns).toContain('name');
      expect(columns).toContain('attributes');
      expect(columns).toContain('source_file');
      expect(columns).toContain('line_start');
      expect(columns).toContain('line_end');
      expect(columns).toContain('content_hash');
      expect(columns).toContain('extracted_at');
      expect(columns).toContain('project_id');
    });

    it('relationships table has correct columns', async () => {
      const result = await pool.query(`
        SELECT column_name
        FROM information_schema.columns 
        WHERE table_name = 'relationships'
      `);
      
      const columns = result.rows.map(r => r.column_name);
      
      // Required columns per Cursor Plan lines 471-480
      expect(columns).toContain('id');
      expect(columns).toContain('relationship_type'); // NOT 'type'
      expect(columns).toContain('instance_id');
      expect(columns).toContain('name');
      expect(columns).toContain('from_entity_id');    // NOT source_id
      expect(columns).toContain('to_entity_id');      // NOT target_id
      expect(columns).toContain('confidence');
      expect(columns).toContain('extracted_at');
      expect(columns).toContain('project_id');
    });

    it('entities has CHECK constraint on entity_type', async () => {
      const result = await pool.query(`
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = 'entities' AND constraint_type = 'CHECK'
      `);
      
      const constraints = result.rows.map(r => r.constraint_name);
      expect(constraints).toContain('valid_entity_type');
    });

    it('relationships has CHECK constraint on relationship_type', async () => {
      const result = await pool.query(`
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = 'relationships' AND constraint_type = 'CHECK'
      `);
      
      const constraints = result.rows.map(r => r.constraint_name);
      expect(constraints).toContain('valid_relationship_type');
    });
  });

  // SANITY-011: All Foreign Keys Valid (structure check)
  describe('SANITY-011: All Foreign Keys Valid', () => {
    it('relationships table has FK columns', async () => {
      const result = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'relationships'
      `);
      
      const columns = result.rows.map(r => r.column_name);
      expect(columns).toContain('from_entity_id');
      expect(columns).toContain('to_entity_id');
    });

    it('relationships table has no orphaned references (empty graph)', async () => {
      const result = await pool.query(`
        SELECT COUNT(*) as orphan_count
        FROM relationships r
        WHERE NOT EXISTS (SELECT 1 FROM entities e WHERE e.id = r.from_entity_id)
           OR NOT EXISTS (SELECT 1 FROM entities e WHERE e.id = r.to_entity_id)
      `);
      
      expect(parseInt(result.rows[0].orphan_count)).toBe(0);
      console.log('EMPTY_GRAPH: Structural invariant verified, 0 orphaned relationships');
    });
  });

  // SANITY-012: No Duplicate Entity IDs (constraint check)
  describe('SANITY-012: No Duplicate Entity IDs', () => {
    it('entities table has unique instance_id constraint', async () => {
      const result = await pool.query(`
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = 'entities' AND constraint_type = 'UNIQUE'
      `);
      
      expect(result.rows.length).toBeGreaterThan(0);
    });

    it('no duplicate entity IDs exist (empty graph)', async () => {
      const result = await pool.query(`
        SELECT id, COUNT(*) as count
        FROM entities
        GROUP BY id
        HAVING COUNT(*) > 1
      `);
      
      expect(result.rows.length).toBe(0);
      console.log('EMPTY_GRAPH: Structural invariant verified, 0 duplicate IDs');
    });
  });

  // SANITY-013: Content Hashes Computable (column exists with correct type)
  describe('SANITY-013: Content Hashes Computable', () => {
    it('entities table has content_hash column with VARCHAR(71)', async () => {
      const result = await pool.query(`
        SELECT column_name, character_maximum_length
        FROM information_schema.columns 
        WHERE table_name = 'entities' AND column_name = 'content_hash'
      `);
      
      expect(result.rows.length).toBe(1);
      expect(result.rows[0].character_maximum_length).toBe(71); // sha256:... format
      console.log('EMPTY_GRAPH: Structural invariant verified, 0 entities to hash');
    });
  });

  // SANITY-014: RLS Enabled and Graph Connectivity
  describe('SANITY-014: RLS Enabled and Graph Connectivity', () => {
    it('RLS enabled on entities table', async () => {
      const result = await pool.query(`
        SELECT relrowsecurity
        FROM pg_class
        WHERE relname = 'entities'
      `);
      
      expect(result.rows[0].relrowsecurity).toBe(true);
    });

    it('RLS enabled on relationships table', async () => {
      const result = await pool.query(`
        SELECT relrowsecurity
        FROM pg_class
        WHERE relname = 'relationships'
      `);
      
      expect(result.rows[0].relrowsecurity).toBe(true);
    });

    it('graph population matches phase (SANITY_PHASE required)', async () => {
      const phase = process.env.SANITY_PHASE;
      
      // Hard-fail if phase is not specified
      if (!phase || (phase !== 'pre' && phase !== 'post_a1')) {
        throw new Error(
          `SANITY_PHASE must be 'pre' or 'post_a1', got: '${phase || '(undefined)'}'\n` +
          `Usage:\n` +
          `  SANITY_PHASE=pre npm run test:sanity        # Before A1 extraction\n` +
          `  SANITY_PHASE=post_a1 npm run test:sanity    # After A1 extraction`
        );
      }

      // Get entity counts by type
      const result = await pool.query(`
        SELECT entity_type, COUNT(*) as count
        FROM entities
        GROUP BY entity_type
        ORDER BY entity_type
      `);
      
      const counts: Record<string, number> = {};
      for (const row of result.rows) {
        counts[row.entity_type] = parseInt(row.count);
      }
      const totalEntities = Object.values(counts).reduce((a, b) => a + b, 0);

      if (phase === 'pre') {
        // Pre-A1: Graph must be empty
        expect(totalEntities).toBe(0);
        console.log('SANITY_PHASE=pre: Graph is empty as expected (0 entities)');
      } else if (phase === 'post_a1') {
        // Post-A1: Graph must have minimum A1 entities
        // Per Track A EXIT.md: E01=65, E02=351, E03=2849, E04>=0
        expect(counts['E01'] || 0).toBeGreaterThanOrEqual(65);
        expect(counts['E02'] || 0).toBeGreaterThanOrEqual(351);
        expect(counts['E03'] || 0).toBeGreaterThanOrEqual(2849);
        expect(counts['E04'] || 0).toBeGreaterThanOrEqual(0); // BRD-dependent
        
        console.log(`SANITY_PHASE=post_a1: Graph has ${totalEntities} entities`);
        console.log(`  E01: ${counts['E01'] || 0} (expected >=65)`);
        console.log(`  E02: ${counts['E02'] || 0} (expected >=351)`);
        console.log(`  E03: ${counts['E03'] || 0} (expected >=2849)`);
        console.log(`  E04: ${counts['E04'] || 0} (expected >=0)`);
      }
    });
  });

  // SANITY-015: EP-D-002 Present
  describe('SANITY-015: EP-D-002 Present', () => {
    const EP_D_002_PATH = 'docs/integrations/EP-D-002_RUNTIME_RECONCILIATION_V20_6_1.md';

    it('EP-D-002 document exists and is readable', () => {
      // Assert file exists
      expect(fs.existsSync(EP_D_002_PATH), `EP-D-002 document not found at ${EP_D_002_PATH}`).toBe(true);
      
      // Assert file is non-empty
      const stats = fs.statSync(EP_D_002_PATH);
      expect(stats.size, `EP-D-002 document is empty (0 bytes)`).toBeGreaterThan(0);
      
      // Assert file is readable
      expect(() => fs.readFileSync(EP_D_002_PATH, 'utf8'), `EP-D-002 document is not readable`).not.toThrow();
    });
  });

  // SANITY-016: Document Version Headers Valid
  describe('SANITY-016: Document Version Headers Valid', () => {
    const CANONICAL_DOCS = [
      { path: 'docs/BRD_V20_6_3_COMPLETE.md', expected: '20.6.3' },
      { path: 'docs/UNIFIED_TRACEABILITY_GRAPH_SCHEMA_V20_6_1.md', expected: '20.6.1' },
      { path: 'docs/UNIFIED_VERIFICATION_SPECIFICATION_V20_6_4.md', expected: '20.6.4' },
      { path: 'docs/GNOSIS_TO_SOPHIA_MASTER_ROADMAP_V20_6_4.md', expected: '20.6.4' },
    ];

    for (const doc of CANONICAL_DOCS) {
      it(`${doc.path} has version header ${doc.expected}`, () => {
        // Assert file exists
        expect(fs.existsSync(doc.path), `Document ${doc.path} not found`).toBe(true);
        
        // Read content and check version header
        const content = fs.readFileSync(doc.path, 'utf8');
        const match = content.match(/\*\*Version:\*\*\s*(\d+\.\d+\.\d+)/);
        
        expect(match, `Document ${doc.path} missing version header`).not.toBeNull();
        expect(match![1], `Document ${doc.path} version mismatch: expected ${doc.expected}, got ${match![1]}`).toBe(doc.expected);
      });
    }
  });

  // SANITY-017: Relationship Evidence Schema
  // Added in Pre-A2 Hardening per Constraint A.2
  // Authority: ENTRY.md Constraint A.2, migration 004
  describe('SANITY-017: Relationship Evidence Schema', () => {
    it('relationships table has required evidence columns', async () => {
      const result = await pool.query(`
        SELECT column_name, is_nullable, data_type
        FROM information_schema.columns 
        WHERE table_name = 'relationships' 
        AND column_name IN ('source_file', 'line_start', 'line_end', 'content_hash')
        ORDER BY column_name
      `);
      
      const columns = new Map(result.rows.map(r => [r.column_name, r]));
      
      // content_hash: NULLABLE VARCHAR (optional, for change detection)
      expect(columns.has('content_hash')).toBe(true);
      
      // line_end: NOT NULL INTEGER
      expect(columns.has('line_end')).toBe(true);
      expect(columns.get('line_end')?.is_nullable).toBe('NO');
      
      // line_start: NOT NULL INTEGER
      expect(columns.has('line_start')).toBe(true);
      expect(columns.get('line_start')?.is_nullable).toBe('NO');
      
      // source_file: NOT NULL VARCHAR
      expect(columns.has('source_file')).toBe(true);
      expect(columns.get('source_file')?.is_nullable).toBe('NO');
    });

    it('relationships table has valid_line_range constraint', async () => {
      const result = await pool.query(`
        SELECT conname FROM pg_constraint 
        WHERE conrelid = 'relationships'::regclass 
        AND conname = 'valid_line_range'
      `);
      expect(result.rows.length).toBe(1);
    });
  });
});


