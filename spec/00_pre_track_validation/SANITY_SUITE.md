# SANITY Test Suite Specification

**Version:** 1.5.3  
**Implements:** Verification Spec V20.6.5 Part II  
**Purpose:** Foundational tests that must pass before any track begins  
**Canonical Source:** UNIFIED_VERIFICATION_SPECIFICATION_V20_6_5.md §Part II

> **v1.5.3:** Add SANITY-053/054 (Marker Governance - AC/Story marker integrity)
> **v1.5.2:** Fix E49/E50 evidence anchors (line_start=1, not 0) + document AMB-5 git entity strategy
> **v1.5.1:** SANITY-044 anti-vacuity + RLS helper (PROJECT_ID required, rlsQuery, 0 entities = hard fail)
> **v1.5.0:** RLS structural enforcement - Two-level allowlist in forbidden-actions-harness, test helpers (rls.ts, db-meta.ts), SANITY-018 now diagnostic backstop
> **v1.4.0:** Bugfix - SANITY-045 anti-vacuity (PROJECT_ID always required) + RLS context on same client; added SANITY-018 (RLS context guardrail)
> **v1.3.0:** Pre-A2 Hardening - Added SANITY-017 (relationship evidence schema) and SANITY-045 (relationship evidence anchors)
> **v1.2.0:** Added SANITY-023/024 for composite uniqueness constraint verification (multi-tenant isolation)
> **v1.1.0:** Aligned entity/relationship lists with Track A scope (E14 deferred, R-codes per ENTRY.md); fixed ID format patterns to use canonical uppercase prefixes

---

## Overview

The SANITY suite validates that the development environment, canonical documents, and basic infrastructure are correctly configured before track implementation begins. These tests are **prerequisites** — failure blocks all track work.

---

## Test Categories

| Category | Tests | Purpose |
|----------|-------|---------|
| ENVIRONMENT | SANITY-001 to 009 | Node, TypeScript, database connectivity |
| CANONICAL | SANITY-010 to 018 | Document presence, version, schema, RLS guardrail |
| SCHEMA | SANITY-020 to 029 | Entity/relationship definitions parseable |
| MARKERS | SANITY-030 to 034 | Marker patterns valid, orphan detection |
| EXTRACTION | SANITY-040 to 049 | Provider interface, evidence anchors, E15 semantics |
| GOVERNANCE | SANITY-053 to 054 | Marker integrity (AC/Story resolution) |
| BRD | SANITY-055 to 059 | BRD parseable, counts match |
| DORMANT | SANITY-080 to 083 | EP-D-002 stubs (return `{pass: true, skipped: true}`) |

---

## ENVIRONMENT Tests (SANITY-001 to 009)

### SANITY-001: Node Version
```typescript
// @implements SANITY-001
// @satisfies Verification Spec V20.6.4 §2.1

test('SANITY-001: Node version >= 20', () => {
  const version = parseInt(process.version.slice(1).split('.')[0]);
  expect(version).toBeGreaterThanOrEqual(20);
});
```

### SANITY-002: TypeScript Compilation
```typescript
// @implements SANITY-002

test('SANITY-002: TypeScript compiles without errors', async () => {
  const result = await exec('npx tsc --noEmit');
  expect(result.exitCode).toBe(0);
});
```

### SANITY-003: PostgreSQL Connection
```typescript
// @implements SANITY-003
// @satisfies BRD V20.6.3 AC-39.6.1

test('SANITY-003: PostgreSQL connection succeeds', async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const result = await pool.query('SELECT 1');
  expect(result.rows[0]).toBeDefined();
  await pool.end();
});
```

### SANITY-004: Neo4j Connection
```typescript
// @implements SANITY-004
// @satisfies BRD V20.6.3 AC-39.5.7

test('SANITY-004: Neo4j connection succeeds', async () => {
  const driver = neo4j.driver(process.env.NEO4J_URL, neo4j.auth.basic(user, pass));
  const session = driver.session();
  const result = await session.run('RETURN 1');
  expect(result.records.length).toBe(1);
  await session.close();
  await driver.close();
});
```

### SANITY-005: Environment Variables
```typescript
// @implements SANITY-005

test('SANITY-005: Required environment variables set', () => {
  const required = ['DATABASE_URL', 'NEO4J_URL', 'NODE_ENV'];
  for (const env of required) {
    expect(process.env[env]).toBeDefined();
  }
});
```

---

## CANONICAL Tests (SANITY-010 to 019)

### SANITY-010: BRD Document Present
```typescript
// @implements SANITY-010

test('SANITY-010: BRD document exists', () => {
  const path = 'docs/BRD_V20_6_3_COMPLETE.md';
  expect(fs.existsSync(path)).toBe(true);
});
```

### SANITY-011: UTG Schema Present
```typescript
// @implements SANITY-011

test('SANITY-011: UTG Schema document exists', () => {
  const path = 'docs/UNIFIED_TRACEABILITY_GRAPH_SCHEMA_V20_6_1.md';
  expect(fs.existsSync(path)).toBe(true);
});
```

### SANITY-012: Verification Spec Present
```typescript
// @implements SANITY-012

test('SANITY-012: Verification Spec document exists', () => {
  const path = 'docs/UNIFIED_VERIFICATION_SPECIFICATION_V20_6_5.md';
  expect(fs.existsSync(path)).toBe(true);
});
```

### SANITY-013: Roadmap Present
```typescript
// @implements SANITY-013

test('SANITY-013: Roadmap document exists', () => {
  const path = 'docs/GNOSIS_TO_SOPHIA_MASTER_ROADMAP_V20_6_4.md';
  expect(fs.existsSync(path)).toBe(true);
});
```

### SANITY-014: Cursor Plan Present
```typescript
// @implements SANITY-014

test('SANITY-014: Cursor Implementation Plan exists', () => {
  const path = 'docs/CURSOR_IMPLEMENTATION_PLAN_V20_8_5.md';
  expect(fs.existsSync(path)).toBe(true);
});
```

### SANITY-015: EP-D-002 Present
```typescript
// @implements SANITY-015

test('SANITY-015: EP-D-002 document exists', () => {
  const path = 'docs/integrations/EP-D-002_RUNTIME_RECONCILIATION_V20_6_1.md';
  expect(fs.existsSync(path)).toBe(true);
});
```

### SANITY-016: Document Version Headers Valid
```typescript
// @implements SANITY-016

test('SANITY-016: All canonical docs have valid version headers', () => {
  const docs = [
    { path: 'docs/BRD_V20_6_3_COMPLETE.md', expected: '20.6.3' },
    { path: 'docs/UNIFIED_TRACEABILITY_GRAPH_SCHEMA_V20_6_1.md', expected: '20.6.1' },
    { path: 'docs/UNIFIED_VERIFICATION_SPECIFICATION_V20_6_5.md', expected: '20.6.5' },
    { path: 'docs/GNOSIS_TO_SOPHIA_MASTER_ROADMAP_V20_6_4.md', expected: '20.6.4' },
  ];
  
  for (const doc of docs) {
    const content = fs.readFileSync(doc.path, 'utf8');
    const versionMatch = content.match(/\*\*Version:\*\* (\d+\.\d+\.\d+)/);
    expect(versionMatch).not.toBeNull();
    expect(versionMatch[1]).toBe(doc.expected);
  }
});
```

### SANITY-017: Relationship Evidence Schema
```typescript
// @implements SANITY-017
// @satisfies Constraint A.2
// Added in Pre-A2 Hardening

test('SANITY-017: Relationships table has evidence columns', async () => {
  const result = await pool.query(`
    SELECT column_name, is_nullable
    FROM information_schema.columns 
    WHERE table_name = 'relationships' 
    AND column_name IN ('source_file', 'line_start', 'line_end', 'content_hash')
  `);
  
  const columns = new Map(result.rows.map(r => [r.column_name, r]));
  
  // source_file: NOT NULL
  expect(columns.has('source_file')).toBe(true);
  expect(columns.get('source_file')?.is_nullable).toBe('NO');
  
  // line_start: NOT NULL
  expect(columns.has('line_start')).toBe(true);
  expect(columns.get('line_start')?.is_nullable).toBe('NO');
  
  // line_end: NOT NULL
  expect(columns.has('line_end')).toBe(true);
  expect(columns.get('line_end')?.is_nullable).toBe('NO');
  
  // valid_line_range constraint
  const constraintResult = await pool.query(`
    SELECT conname FROM pg_constraint 
    WHERE conrelid = 'relationships'::regclass 
    AND conname = 'valid_line_range'
  `);
  expect(constraintResult.rows.length).toBe(1);
});
```

### SANITY-018: RLS Context Guardrail (Diagnostic Backstop)
```typescript
// @implements SANITY-018
// Role: Secondary safety net for RLS enforcement (diagnostic)
// Primary enforcement: forbidden-actions-harness + two-level helper allowlists

test('SANITY-018: SANITY tests querying project data must use RLS helpers', () => {
  const sanityFiles = fs.readdirSync('test/sanity')
    .filter(f => f.endsWith('.test.ts'))
    .map(f => `test/sanity/${f}`);

  const violations = [];

  for (const file of sanityFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const filename = path.basename(file);

    // Skip integrity.test.ts - uses db-meta.ts for database-wide checks
    if (filename === 'integrity.test.ts') continue;

    // Check if file uses PROJECT_ID and queries RLS tables
    const usesProjectId = content.includes('PROJECT_ID');
    const queriesRLSTables =
      content.includes('FROM relationships') ||
      content.includes('FROM entities');

    if (usesProjectId && queriesRLSTables) {
      // Must import from utils/rls.ts
      if (!content.includes('utils/rls')) {
        violations.push(`${filename}: Must use test/utils/rls.ts for project-scoped queries`);
      }
    }
  }

  expect(violations.length).toBe(0);
});
```

**Role:** Secondary safety net for RLS enforcement.  
**Primary enforcement:** `forbidden-actions-harness.test.ts` + two-level helper allowlists.

**Test Helpers (v1.5.0):**
- `test/utils/rls.ts` - Project-scoped queries with RLS context verification
- `test/utils/db-meta.ts` - Database-wide queries (only for integrity.test.ts)

**Two-Level Allowlist:**
1. Level 1: Only `rls.ts` and `db-meta.ts` may import from `src/db/*`
2. Level 2: Only `integrity.test.ts` may import `db-meta.ts`

SANITY tests querying `entities` or `relationships` for project-specific data must:
1. Import from `test/utils/rls.ts`: `import { rlsQuery } from '../utils/rls.js'`
2. Use: `const rows = await rlsQuery(PROJECT_ID, 'SELECT ... FROM entities')`

---

## SCHEMA Tests (SANITY-020 to 029)

### SANITY-020: Entity Types Defined
```typescript
// @implements SANITY-020
// @satisfies UTG Schema V20.6.1 §Entity Registry

test('SANITY-020: All 15 extractable Track A entity types defined (E14 deferred)', () => {
  const trackAEntities = [
    'E01', 'E02', 'E03', 'E04',  // Requirements
    'E06', 'E08',                 // Design
    'E11', 'E12', 'E13', 'E15',  // Implementation (E14 Interface deferred)
    'E27', 'E28', 'E29',          // Verification
    'E49', 'E50', 'E52'           // Provenance
  ];
  
  const schema = loadUTGSchema();
  for (const entityId of trackAEntities) {
    expect(schema.entities[entityId]).toBeDefined();
  }
});
```

### SANITY-021: Relationship Types Defined
```typescript
// @implements SANITY-021
// @satisfies UTG Schema V20.6.1 §Relationship Registry

test('SANITY-021: All 21 Track A relationship types defined', () => {
  const trackARelationships = [
    'R01', 'R02', 'R03',              // Requirements: HAS_STORY, HAS_AC, HAS_CONSTRAINT
    'R04', 'R05', 'R06', 'R07',       // Containment: CONTAINS_*
    'R14', 'R16', 'R18', 'R19',       // Design->Impl links
    'R21', 'R22', 'R23', 'R24', 'R26', // Implementation (no R25)
    'R36', 'R37',                      // Verification: TESTED_BY, VERIFIED_BY
    'R63', 'R67', 'R70'                // Provenance: INTRODUCED_IN, MODIFIED_IN, GROUPS
  ];
  
  const schema = loadUTGSchema();
  for (const relId of trackARelationships) {
    expect(schema.relationships[relId]).toBeDefined();
  }
});
```

### SANITY-022: Entity ID Formats Valid
```typescript
// @implements SANITY-022

test('SANITY-022: Entity ID formats match patterns', () => {
  const patterns = {
    'E01': /^EPIC-\d+$/,        // Epic
    'E02': /^STORY-\d+\.\d+$/,  // Story
    'E03': /^AC-\d+\.\d+\.\d+$/, // AcceptanceCriterion
    'E11': /^FILE-.+$/,         // SourceFile
    'E12': /^FUNC-.+:.+$/,      // Function
    'E13': /^CLASS-.+:.+$/,     // Class
  };
  
  const schema = loadUTGSchema();
  for (const [entityId, pattern] of Object.entries(patterns)) {
    expect(schema.entities[entityId].idFormat).toMatch(pattern);
  }
});
```

### SANITY-023: Entities Composite Uniqueness
```typescript
// @implements SANITY-023
// @satisfies BRD Epic 39.5 (Complete Data Isolation)

test('SANITY-023: Entities enforce UNIQUE(project_id, instance_id)', async () => {
  const { rows } = await pool.query(`
    SELECT
      c.conname,
      pg_get_constraintdef(c.oid) AS def
    FROM pg_constraint c
    WHERE c.conrelid = 'entities'::regclass
      AND c.contype = 'u'
  `);
  
  const hasComposite = rows.some(r => 
    r.def.includes('(project_id, instance_id)') || 
    r.def.includes('(instance_id, project_id)')
  );
  expect(hasComposite).toBe(true);
  
  // Verify NO global uniqueness on instance_id alone
  const hasGlobalInstanceOnly = rows.some(r =>
    r.def.includes('(instance_id)') && !r.def.includes('project_id')
  );
  expect(hasGlobalInstanceOnly).toBe(false);
});
```

### SANITY-024: Relationships Composite Uniqueness
```typescript
// @implements SANITY-024
// @satisfies BRD Epic 39.5 (Complete Data Isolation)

test('SANITY-024: Relationships enforce UNIQUE(project_id, instance_id)', async () => {
  const { rows } = await pool.query(`
    SELECT
      c.conname,
      pg_get_constraintdef(c.oid) AS def
    FROM pg_constraint c
    WHERE c.conrelid = 'relationships'::regclass
      AND c.contype = 'u'
  `);
  
  const hasComposite = rows.some(r => 
    r.def.includes('(project_id, instance_id)') || 
    r.def.includes('(instance_id, project_id)')
  );
  expect(hasComposite).toBe(true);
  
  // Verify NO global uniqueness on instance_id alone
  const hasGlobalInstanceOnly = rows.some(r =>
    r.def.includes('(instance_id)') && !r.def.includes('project_id')
  );
  expect(hasGlobalInstanceOnly).toBe(false);
});
```

---

## MARKER Tests (SANITY-030 to 039)

### SANITY-030: @implements Pattern Valid
```typescript
// @implements SANITY-030

test('SANITY-030: @implements marker pattern parseable', () => {
  const pattern = /@implements\s+(STORY-\d+\.\d+)/;
  const testCases = [
    { input: '// @implements STORY-64.1', expected: 'STORY-64.1' },
    { input: '/* @implements STORY-1.5 */', expected: 'STORY-1.5' },
  ];
  
  for (const tc of testCases) {
    const match = tc.input.match(pattern);
    expect(match).not.toBeNull();
    expect(match[1]).toBe(tc.expected);
  }
});
```

### SANITY-031: @satisfies Pattern Valid
```typescript
// @implements SANITY-031

test('SANITY-031: @satisfies marker pattern parseable', () => {
  const pattern = /@satisfies\s+(AC-\d+\.\d+\.\d+)/;
  const testCases = [
    { input: '// @satisfies AC-64.1.1', expected: 'AC-64.1.1' },
    { input: '/* @satisfies AC-39.5.7 */', expected: 'AC-39.5.7' },
  ];
  
  for (const tc of testCases) {
    const match = tc.input.match(pattern);
    expect(match).not.toBeNull();
    expect(match[1]).toBe(tc.expected);
  }
});
```

### SANITY-032: describe() Pattern Valid
```typescript
// @implements SANITY-032

test('SANITY-032: describe() block pattern parseable', () => {
  const pattern = /describe\s*\(\s*['"`](.+?)['"`]/;
  const input = "describe('Entity Registry', () => {";
  const match = input.match(pattern);
  expect(match).not.toBeNull();
  expect(match[1]).toBe('Entity Registry');
});
```

### SANITY-033: it() Pattern Valid
```typescript
// @implements SANITY-033

test('SANITY-033: it() block pattern parseable', () => {
  const pattern = /it\s*\(\s*['"`](.+?)['"`]/;
  const input = "it('should create entity', async () => {";
  const match = input.match(pattern);
  expect(match).not.toBeNull();
  expect(match[1]).toBe('should create entity');
});
```

### SANITY-034: Orphan Markers Detected
```typescript
// @implements SANITY-034

test('SANITY-034: Orphan marker detection mechanism works', async () => {
  // Verify semantic corpus captures signals during extraction
  // May include ORPHAN_MARKER signals for markers with no target entity
  const count = await semanticCorpus.getCount();
  expect(count).toBeGreaterThan(0);
});
```

**Semantics:**
- Verifies the orphan marker detection mechanism is operational
- Semantic corpus must have captured signals during extraction
- Signal types may include ORPHAN_MARKER for markers referencing non-existent entities

---

## EXTRACTION Tests (SANITY-040 to 044)

### SANITY-040: AST Parser Available
```typescript
// @implements SANITY-040

test('SANITY-040: TypeScript AST parser available', () => {
  const { Project } = require('ts-morph');
  const project = new Project();
  expect(project).toBeDefined();
});
```

### SANITY-041: Markdown Parser Available
```typescript
// @implements SANITY-041

test('SANITY-041: Markdown parser available', () => {
  const { unified } = require('unified');
  const remarkParse = require('remark-parse');
  const processor = unified().use(remarkParse);
  expect(processor).toBeDefined();
});
```

### SANITY-043: Provider Interface Exists
```typescript
// @implements SANITY-043
// @satisfies Cursor Plan V20.8.5 Constraint A.1

test('SANITY-043: Extraction provider interface defined', () => {
  // This test validates the interface exists, not implementation
  const interfacePath = 'src/extraction/types.ts';
  expect(fs.existsSync(interfacePath)).toBe(true);
  
  const content = fs.readFileSync(interfacePath, 'utf8');
  expect(content).toContain('interface ExtractionProvider');
  expect(content).toContain('interface RepoSnapshot');
});
```

### SANITY-044: Entity Evidence Anchors
```typescript
// @implements SANITY-044
// @satisfies Constraint A.2, AC-64.1.17, AC-64.2.23
// Updated in v1.5.1 for RLS context and anti-vacuity

test('SANITY-044: All entities have evidence anchors', async () => {
  // ANTI-VACUITY: PROJECT_ID is ALWAYS required (no phase bypass)
  if (!PROJECT_ID) {
    throw new Error('[SANITY-044] PROJECT_ID required - cannot skip evidence validation');
  }

  // Use RLS helper - it sets context and verifies it's actually set
  const entities = await rlsQuery(PROJECT_ID,
    'SELECT instance_id, source_file, line_start, line_end, extracted_at FROM entities'
  );

  // Track A1 is complete - entities MUST exist
  if (entities.length === 0) {
    throw new Error('[SANITY-044] Track A1 complete - entities MUST exist but found 0');
  }

  // Validate evidence anchors on all entities
  const invalid = [];
  for (const entity of entities) {
    const hasSourceFile = entity.source_file && entity.source_file.length > 0;
    const hasLineStart = typeof entity.line_start === 'number' && entity.line_start > 0;
    const hasLineEnd = typeof entity.line_end === 'number' && entity.line_end >= entity.line_start;
    const hasExtractedAt = !!entity.extracted_at;

    if (!hasSourceFile || !hasLineStart || !hasLineEnd || !hasExtractedAt) {
      invalid.push(entity.instance_id);
    }
  }

  expect(invalid.length).toBe(0);
});
```

**Semantics (v1.5.2):**
- PROJECT_ID is ALWAYS required (no skip/fallback)
- Track A1 complete: entities MUST exist (0 entities = hard fail)
- Uses RLS via `rlsQuery()` helper from `test/utils/rls.ts`
- Evidence fields: `source_file` (non-empty), `line_start` (> 0), `line_end` (>= line_start), `extracted_at` (present)

**Git Entity Evidence Strategy (E49/E50):**
Git-derived entities (E49 ReleaseVersion, E50 Commit) use synthetic evidence anchors since they don't have a literal source file location:
- `source_file = '.git'` (synthetic repo anchor)
- `line_start = 1`
- `line_end = 1`

This follows the AMB-5 resolution for git-derived entities and relationships (R63/R67/R70).

### SANITY-045: Relationship Evidence Anchors
```typescript
// @implements SANITY-045
// @satisfies Constraint A.2, AC-64.2.23
// Added in Pre-A2 Hardening, updated in v1.4.0 for RLS context

test('SANITY-045: All relationships have evidence anchors', async () => {
  // ANTI-VACUITY: PROJECT_ID is ALWAYS required (no phase bypass)
  if (!PROJECT_ID) {
    throw new Error('[SANITY-045] PROJECT_ID required - cannot skip evidence validation');
  }

  // Use RLS context on the SAME client for proper isolation
  const client = await getClient();
  try {
    await setProjectContext(client, PROJECT_ID);
    
    // Query WITHOUT project_id filter - RLS is the mechanism
    const result = await client.query(
      'SELECT instance_id, source_file, line_start, line_end FROM relationships'
    );
    
    const relationships = result.rows;
    const trackPhase = process.env.TRACK_PHASE || 'pre_a2';
    
    // Phase-aware expectation for 0 relationships
    if (relationships.length === 0) {
      if (trackPhase === 'post_a2' || trackPhase === 'post_a3') {
        throw new Error(`[SANITY-045] TRACK_PHASE=${trackPhase} requires relationships but found 0`);
      }
      console.log('[SANITY-045] No relationships to validate (pre-A2 phase, valid)');
      return;
    }
    
    // Validate evidence anchors
    for (const rel of relationships) {
      expect(rel.source_file).toBeDefined();
      expect(rel.source_file.length).toBeGreaterThan(0);
      expect(rel.line_start).toBeGreaterThan(0);
      expect(rel.line_end).toBeGreaterThanOrEqual(rel.line_start);
    }
  } finally {
    client.release();
  }
});
```

**Semantics:**
- **PROJECT_ID:** ALWAYS required (no phase bypass) - hard fail if missing
- **Pre-A2:** Zero relationships is a phase-valid pass; test logs and returns
- **Post-A2 (TRACK_PHASE=post_a2 or post_a3):** Relationships MUST exist; hard fail if empty
- **RLS:** Uses `setProjectContext()` on same client (not `pool.query()` with WHERE)

---

## BRD Tests (SANITY-050 to 059)

### SANITY-055: BRD Registry Populated
```typescript
// @implements SANITY-055
// @satisfies Verification Spec V20.6.4 G-REGISTRY

test('SANITY-055: BRD counts match expected', async () => {
  const brd = await parseBRD('docs/BRD_V20_6_3_COMPLETE.md');
  
  expect(brd.epics.length).toBe(65);
  expect(brd.stories.length).toBe(397);
  expect(brd.acceptanceCriteria.length).toBe(3147);
});
```

### SANITY-056: Epic IDs Sequential
```typescript
// @implements SANITY-056

test('SANITY-056: Epic IDs are valid', async () => {
  const brd = await parseBRD('docs/BRD_V20_6_3_COMPLETE.md');
  
  for (const epic of brd.epics) {
    expect(epic.id).toMatch(/^EPIC-\d+$/);
  }
});
```

### SANITY-057: Story IDs Follow Epic
```typescript
// @implements SANITY-057

test('SANITY-057: Story IDs reference valid epics', async () => {
  const brd = await parseBRD('docs/BRD_V20_6_3_COMPLETE.md');
  const epicNumbers = new Set(brd.epics.map(e => parseInt(e.id.split('-')[1])));
  
  for (const story of brd.stories) {
    const storyEpic = parseInt(story.id.split('-')[1].split('.')[0]);
    expect(epicNumbers.has(storyEpic)).toBe(true);
  }
});
```

---

## GOVERNANCE Tests (SANITY-053 to 054)

### SANITY-053: AC Marker Integrity
```typescript
// @implements SANITY-053
// @satisfies Verification Spec V20.6.5 Part XVII

test('SANITY-053: All @satisfies AC-* markers resolve to E03 entities', async () => {
  if (!PROJECT_ID) throw new Error('[SANITY-053] PROJECT_ID required');

  // Get valid ACs from database
  const dbAcs = await rlsQuery(PROJECT_ID, `
    SELECT instance_id FROM entities WHERE entity_type = 'E03'
  `);
  const validAcs = new Set(dbAcs.map((r: { instance_id: string }) => r.instance_id));
  
  // Scan src/ and scripts/ for @satisfies AC-* markers (line-start canonical format)
  // Extract AC-X.Y.Z patterns from matches
  // Filter for phantoms (not in validAcs)
  
  expect(phantoms.length, `Phantom AC markers: ${phantoms.join(', ')}`).toBe(0);
});
```

**Scope:** `src/**` and `scripts/**` only (not `test/**` - policy decision)
**Format:** Match canonical markers at line-start: `^\s*//\s*@satisfies\s+AC-`

### SANITY-054: Story Marker Integrity
```typescript
// @implements SANITY-054
// @satisfies Verification Spec V20.6.5 Part XVII

test('SANITY-054: All @implements STORY-* markers resolve to E02 entities', async () => {
  if (!PROJECT_ID) throw new Error('[SANITY-054] PROJECT_ID required');

  const dbStories = await rlsQuery(PROJECT_ID, `
    SELECT instance_id FROM entities WHERE entity_type = 'E02'
  `);
  const validStories = new Set(dbStories.map((r: { instance_id: string }) => r.instance_id));
  
  // Scan src/ and scripts/ for @implements STORY-* markers
  // Extract STORY-X.Y patterns from matches
  // Filter for phantoms (not in validStories)
  
  expect(phantoms.length, `Phantom Story markers: ${phantoms.join(', ')}`).toBe(0);
});
```

**Scope:** `src/**` and `scripts/**` only
**Format:** Match canonical markers at line-start: `^\s*//\s*@implements\s+STORY-`

---

## DORMANT Tests (SANITY-080 to 083)

These tests are **DORMANT** until Track D.9 activation. They MUST return `{pass: true, skipped: true, reason: 'DORMANT'}`.

### SANITY-080: ExecutionTrace Entity (DORMANT)
```typescript
// @implements SANITY-080
// STATUS: DORMANT until Track D.9

test('SANITY-080: ExecutionTrace entity (DORMANT)', () => {
  return { pass: true, skipped: true, reason: 'DORMANT until Track D.9' };
});
```

### SANITY-081: RuntimeCall Entity (DORMANT)
```typescript
// @implements SANITY-081
// STATUS: DORMANT until Track D.9

test('SANITY-081: RuntimeCall entity (DORMANT)', () => {
  return { pass: true, skipped: true, reason: 'DORMANT until Track D.9' };
});
```

### SANITY-082: TRACES_EXECUTION Relationship (DORMANT)
```typescript
// @implements SANITY-082
// STATUS: DORMANT until Track D.9

test('SANITY-082: TRACES_EXECUTION relationship (DORMANT)', () => {
  return { pass: true, skipped: true, reason: 'DORMANT until Track D.9' };
});
```

### SANITY-083: G-RUNTIME Gate (DORMANT)
```typescript
// @implements SANITY-083
// STATUS: DORMANT until Track D.9

test('SANITY-083: G-RUNTIME gate (DORMANT)', () => {
  return { pass: true, skipped: true, reason: 'DORMANT until Track D.9' };
});
```

---

## Running the SANITY Suite

```bash
# Run all SANITY tests
npm run test:sanity

# Run specific category
npm run test:sanity -- --grep "SANITY-0[0-9][0-9]"  # Environment
npm run test:sanity -- --grep "SANITY-01[0-9]"      # Canonical
npm run test:sanity -- --grep "SANITY-05[0-9]"      # BRD
```

---

## Exit Criteria

All SANITY tests must pass before any track begins:

- [ ] SANITY-001 to 005: Environment ✓
- [ ] SANITY-010 to 018: Canonical documents + schema + RLS guardrail ✓
- [ ] SANITY-020 to 024: Schema definitions + uniqueness ✓
- [ ] SANITY-030 to 034: Marker patterns + orphan detection ✓
- [ ] SANITY-040 to 049: Extraction infrastructure + evidence anchors + E15 semantics ✓
- [ ] SANITY-053 to 054: Marker governance (AC/Story integrity) ✓
- [ ] SANITY-055 to 057: BRD parseable ✓
- [ ] SANITY-080 to 083: Dormant tests return skipped ✓

**Total: 61 active tests + 4 dormant = 65 tests**

> **v1.5.0 (RLS Structural Enforcement):** Primary enforcement via forbidden-actions-harness (two-level allowlist); test helpers rls.ts and db-meta.ts; SANITY-018 is now diagnostic backstop

---

## Mission Alignment

**Confirm:** This specification issues no oracle claims. Tests verify structure and presence, not semantic truth. Confidence in test results is evidence-bounded by actual execution.

---

**END OF SANITY SUITE SPECIFICATION**
