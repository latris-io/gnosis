// test/sanity/integrity.test.ts
// @implements INFRASTRUCTURE
// Per Verification Spec V20.6.4 §2.3

import { describe, it, expect } from 'vitest';
import { metaQuery } from '../utils/db-meta.js';
import { rlsQuery } from '../utils/rls.js';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

const PROJECT_ID = process.env.PROJECT_ID || '6df2f456-440d-4958-b475-d9808775ff69';

describe('INTEGRITY Tests', () => {
  // SANITY-010: Database Schema Matches Cursor Plan
  describe('SANITY-010: Database Schema Matches Cursor Plan', () => {
    it('entities table has correct columns', async () => {
      const rows = await metaQuery<{ column_name: string }>(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'entities'
        ORDER BY ordinal_position
      `);
      
      const columns = rows.map(r => r.column_name);
      
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
      const rows = await metaQuery<{ column_name: string }>(`
        SELECT column_name
        FROM information_schema.columns 
        WHERE table_name = 'relationships'
      `);
      
      const columns = rows.map(r => r.column_name);
      
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
      const rows = await metaQuery<{ constraint_name: string }>(`
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = 'entities' AND constraint_type = 'CHECK'
      `);
      
      const constraints = rows.map(r => r.constraint_name);
      expect(constraints).toContain('valid_entity_type');
    });

    it('relationships has CHECK constraint on relationship_type', async () => {
      const rows = await metaQuery<{ constraint_name: string }>(`
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = 'relationships' AND constraint_type = 'CHECK'
      `);
      
      const constraints = rows.map(r => r.constraint_name);
      expect(constraints).toContain('valid_relationship_type');
    });
  });

  // SANITY-023: Entities Composite Uniqueness
  // @satisfies BRD Epic 39.5 (Complete Data Isolation)
  // Per spec v1.2.0: verifies multi-tenant isolation via composite uniqueness
  describe('SANITY-023: Entities Composite Uniqueness', () => {
    it('entities enforces UNIQUE(project_id, instance_id)', async () => {
      const rows = await metaQuery<{ conname: string; def: string }>(`
        SELECT c.conname, pg_get_constraintdef(c.oid) AS def
        FROM pg_constraint c
        WHERE c.conrelid = 'entities'::regclass AND c.contype = 'u'
      `);

      // Must have composite uniqueness
      const hasComposite = rows.some(r =>
        r.def.includes('(project_id, instance_id)') ||
        r.def.includes('(instance_id, project_id)')
      );
      expect(hasComposite, 'entities must have UNIQUE(project_id, instance_id)').toBe(true);

      // Must NOT have global uniqueness on instance_id alone
      const hasGlobalInstanceOnly = rows.some(r =>
        r.def.includes('(instance_id)') && !r.def.includes('project_id')
      );
      expect(hasGlobalInstanceOnly, 'entities must NOT have UNIQUE(instance_id) alone').toBe(false);
    });
  });

  // SANITY-024: Relationships Composite Uniqueness
  // @satisfies BRD Epic 39.5 (Complete Data Isolation)
  // Per spec v1.2.0: verifies multi-tenant isolation via composite uniqueness
  // This test prevents the "UNIQUE(instance_id) alone" regression that blocks multi-tenant upserts
  describe('SANITY-024: Relationships Composite Uniqueness', () => {
    it('relationships enforces UNIQUE(project_id, instance_id)', async () => {
      const rows = await metaQuery<{ conname: string; def: string }>(`
        SELECT c.conname, pg_get_constraintdef(c.oid) AS def
        FROM pg_constraint c
        WHERE c.conrelid = 'relationships'::regclass AND c.contype = 'u'
      `);

      // Must have composite uniqueness
      const hasComposite = rows.some(r =>
        r.def.includes('(project_id, instance_id)') ||
        r.def.includes('(instance_id, project_id)')
      );
      expect(hasComposite, 'relationships must have UNIQUE(project_id, instance_id)').toBe(true);

      // Must NOT have global uniqueness on instance_id alone (known prior failure mode)
      const hasGlobalInstanceOnly = rows.some(r =>
        r.def.includes('(instance_id)') && !r.def.includes('project_id')
      );
      expect(hasGlobalInstanceOnly, 'relationships must NOT have UNIQUE(instance_id) alone - blocks multi-tenant upserts').toBe(false);
    });
  });

  // SANITY-011: All Foreign Keys Valid (structure check)
  describe('SANITY-011: All Foreign Keys Valid', () => {
    it('relationships table has FK columns', async () => {
      const rows = await metaQuery<{ column_name: string }>(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'relationships'
      `);
      
      const columns = rows.map(r => r.column_name);
      expect(columns).toContain('from_entity_id');
      expect(columns).toContain('to_entity_id');
    });

    it('relationships table has no orphaned references (empty graph)', async () => {
      const rows = await metaQuery<{ orphan_count: string }>(`
        SELECT COUNT(*) as orphan_count
        FROM relationships r
        WHERE NOT EXISTS (SELECT 1 FROM entities e WHERE e.id = r.from_entity_id)
           OR NOT EXISTS (SELECT 1 FROM entities e WHERE e.id = r.to_entity_id)
      `);
      
      expect(parseInt(rows[0].orphan_count)).toBe(0);
      console.log('EMPTY_GRAPH: Structural invariant verified, 0 orphaned relationships');
    });
  });

  // SANITY-012: No Duplicate Entity IDs (constraint check)
  describe('SANITY-012: No Duplicate Entity IDs', () => {
    it('entities table has unique instance_id constraint', async () => {
      const rows = await metaQuery<{ constraint_name: string }>(`
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = 'entities' AND constraint_type = 'UNIQUE'
      `);
      
      expect(rows.length).toBeGreaterThan(0);
    });

    it('no duplicate entity IDs exist (empty graph)', async () => {
      const rows = await metaQuery<{ id: string; count: string }>(`
        SELECT id, COUNT(*) as count
        FROM entities
        GROUP BY id
        HAVING COUNT(*) > 1
      `);
      
      expect(rows.length).toBe(0);
      console.log('EMPTY_GRAPH: Structural invariant verified, 0 duplicate IDs');
    });
  });

  // SANITY-013: Content Hashes Computable (column exists with correct type)
  describe('SANITY-013: Content Hashes Computable', () => {
    it('entities table has content_hash column with VARCHAR(71)', async () => {
      const rows = await metaQuery<{ column_name: string; character_maximum_length: number }>(`
        SELECT column_name, character_maximum_length
        FROM information_schema.columns 
        WHERE table_name = 'entities' AND column_name = 'content_hash'
      `);
      
      expect(rows.length).toBe(1);
      expect(rows[0].character_maximum_length).toBe(71); // sha256:... format
      console.log('EMPTY_GRAPH: Structural invariant verified, 0 entities to hash');
    });
  });

  // SANITY-014: RLS Enabled and Graph Connectivity
  describe('SANITY-014: RLS Enabled and Graph Connectivity', () => {
    it('RLS enabled on entities table', async () => {
      const rows = await metaQuery<{ relrowsecurity: boolean }>(`
        SELECT relrowsecurity
        FROM pg_class
        WHERE relname = 'entities'
      `);
      
      expect(rows[0].relrowsecurity).toBe(true);
    });

    it('RLS enabled on relationships table', async () => {
      const rows = await metaQuery<{ relrowsecurity: boolean }>(`
        SELECT relrowsecurity
        FROM pg_class
        WHERE relname = 'relationships'
      `);
      
      expect(rows[0].relrowsecurity).toBe(true);
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

      // Get entity counts by type (use RLS-aware query since FORCE RLS is enabled)
      const rows = await rlsQuery<{ entity_type: string; count: string }>(PROJECT_ID, `
        SELECT entity_type, COUNT(*) as count
        FROM entities
        GROUP BY entity_type
        ORDER BY entity_type
      `);
      
      const counts: Record<string, number> = {};
      for (const row of rows) {
        counts[row.entity_type] = parseInt(row.count);
      }
      const totalEntities = Object.values(counts).reduce((a, b) => a + b, 0);

      if (phase === 'pre') {
        // Pre-A1: Graph must be empty
        expect(totalEntities).toBe(0);
        console.log('SANITY_PHASE=pre: Graph is empty as expected (0 entities)');
      } else if (phase === 'post_a1') {
        // Post-A1: Graph must have minimum A1 entities
        // Per Track A EXIT.md: E01=65, E02=397, E03=3147, E04>=0
        expect(counts['E01'] || 0).toBeGreaterThanOrEqual(65);
        expect(counts['E02'] || 0).toBeGreaterThanOrEqual(397);
        expect(counts['E03'] || 0).toBeGreaterThanOrEqual(3147);
        expect(counts['E04'] || 0).toBeGreaterThanOrEqual(0); // BRD-dependent
        
        console.log(`SANITY_PHASE=post_a1: Graph has ${totalEntities} entities`);
        console.log(`  E01: ${counts['E01'] || 0} (expected >=65)`);
        console.log(`  E02: ${counts['E02'] || 0} (expected >=397)`);
        console.log(`  E03: ${counts['E03'] || 0} (expected >=3147)`);
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
      { path: 'docs/BRD_V20_6_4_COMPLETE.md', expected: '20.6.4' },
      { path: 'docs/UNIFIED_TRACEABILITY_GRAPH_SCHEMA_V20_6_1.md', expected: '20.6.1' },
      { path: 'docs/UNIFIED_VERIFICATION_SPECIFICATION_V20_6_6.md', expected: '20.6.6' },
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
      const rows = await metaQuery<{ column_name: string; is_nullable: string; data_type: string }>(`
        SELECT column_name, is_nullable, data_type
        FROM information_schema.columns 
        WHERE table_name = 'relationships' 
        AND column_name IN ('source_file', 'line_start', 'line_end', 'content_hash')
        ORDER BY column_name
      `);
      
      const columns = new Map(rows.map(r => [r.column_name, r]));
      
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
      const rows = await metaQuery<{ conname: string }>(`
        SELECT conname FROM pg_constraint 
        WHERE conrelid = 'relationships'::regclass 
        AND conname = 'valid_line_range'
      `);
      expect(rows.length).toBe(1);
    });
  });

  // SANITY-018: RLS Context Guardrail (Diagnostic Backstop)
  // Role: Secondary safety net for RLS enforcement (diagnostic output).
  // Primary enforcement: forbidden-actions harness + two-level helper allowlists.
  // This test detects if project-scoped queries bypass the approved helpers.
  // Updated: Now detects multi-line SQL queries by normalizing whitespace.
  describe('SANITY-018: RLS Context Guardrail (Diagnostic)', () => {
    
    // Helper to detect RLS violations in content (supports multi-line SQL)
    function detectRlsViolations(content: string, filename: string): string[] {
      const violations: string[] = [];
      
      // Normalize whitespace to detect multi-line SQL queries
      const normalized = content.replace(/\s+/g, ' ');
      
      // Check if file uses PROJECT_ID (indicates project-scoped queries)
      const usesProjectId = content.includes('PROJECT_ID');
      
      // Check if file touches RLS-protected tables (case-insensitive, multi-line safe)
      const rlsTablePattern = /\b(FROM|JOIN)\s+(entities|relationships)\b/i;
      const touchesRlsTables = rlsTablePattern.test(normalized);
      
      // Check if file uses raw pool.query (specifically pool.query, not generic .query())
      const usesPoolQuery = /\bpool\.query\s*\(/i.test(normalized);
      
      // Check if file uses approved RLS helpers
      const usesRlsHelper = content.includes('rlsQuery') || content.includes('withRlsClient');
      
      // Skip files that don't query RLS tables or don't use PROJECT_ID
      if (!usesProjectId || !touchesRlsTables) {
        return violations;
      }
      
      // Must import from utils/rls.ts
      if (!content.includes('utils/rls')) {
        violations.push(`${filename}: Uses PROJECT_ID and queries RLS tables but doesn't import from utils/rls.ts`);
      }
      
      // Flag pool.query usage on RLS tables (multi-line safe via normalized content)
      if (usesPoolQuery && touchesRlsTables && !usesRlsHelper) {
        violations.push(`${filename}: pool.query on RLS table detected - use rlsQuery() instead`);
      }
      
      return violations;
    }
    
    it('SANITY tests querying project data must use RLS helpers', () => {
      const sanityDir = path.join(__dirname, '.');
      const sanityFiles = fs.readdirSync(sanityDir)
        .filter(f => f.endsWith('.test.ts'))
        .map(f => path.join(sanityDir, f));

      const violations: string[] = [];

      for (const file of sanityFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        const filename = path.basename(file);

        // Skip integrity.test.ts - it uses db-meta.ts for database-wide checks
        if (filename === 'integrity.test.ts') {
          continue;
        }

        violations.push(...detectRlsViolations(content, filename));
      }

      if (violations.length > 0) {
        throw new Error(
          `[SANITY-018 Diagnostic] RLS helper violations found:\n${violations.join('\n')}\n\n` +
          `Project-scoped queries must use test/utils/rls.ts:\n` +
          `  import { rlsQuery } from '../utils/rls.js';\n` +
          `  const rows = await rlsQuery(PROJECT_ID, 'SELECT ... FROM entities');\n\n` +
          `Note: Primary enforcement is in forbidden-actions-harness.test.ts`
        );
      }
    });
    
    it('detects multi-line pool.query violations (regression test)', () => {
      // This test proves the detection logic works for multi-line SQL
      
      // VIOLATION: pool.query with multi-line SQL touching RLS table
      const violationFixture = `
        const PROJECT_ID = 'test';
        const result = await pool.query(\`
          SELECT *
          FROM relationships
          WHERE id = $1
        \`, [id]);
      `;
      
      // Should detect this as a violation
      const violations = detectRlsViolations(violationFixture, 'test-fixture.ts');
      expect(violations.length).toBeGreaterThan(0);
      expect(violations.some(v => v.includes('pool.query'))).toBe(true);
      
      // NON-VIOLATION: rlsQuery helper with multi-line SQL
      const helperFixture = `
        import { rlsQuery } from '../utils/rls.js';
        const PROJECT_ID = 'test';
        const result = await rlsQuery(PROJECT_ID, \`
          SELECT *
          FROM relationships
          WHERE id = $1
        \`);
      `;
      
      // Should NOT detect this as a violation (uses helper)
      const noViolations = detectRlsViolations(helperFixture, 'test-fixture.ts');
      expect(noViolations.filter(v => v.includes('pool.query'))).toHaveLength(0);
    });
  });
});
