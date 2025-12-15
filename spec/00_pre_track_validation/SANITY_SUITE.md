# SANITY Test Suite Specification

**Version:** 1.1.0  
**Implements:** Verification Spec V20.6.4 Part II  
**Purpose:** Foundational tests that must pass before any track begins  
**Canonical Source:** UNIFIED_VERIFICATION_SPECIFICATION_V20_6_4.md §Part II

> **v1.1.0:** Aligned entity/relationship lists with Track A scope (E14 deferred, R-codes per ENTRY.md); fixed ID format patterns to use canonical uppercase prefixes

---

## Overview

The SANITY suite validates that the development environment, canonical documents, and basic infrastructure are correctly configured before track implementation begins. These tests are **prerequisites** — failure blocks all track work.

---

## Test Categories

| Category | Tests | Purpose |
|----------|-------|---------|
| ENVIRONMENT | SANITY-001 to 009 | Node, TypeScript, database connectivity |
| CANONICAL | SANITY-010 to 019 | Document presence, version, hash validation |
| SCHEMA | SANITY-020 to 029 | Entity/relationship definitions parseable |
| MARKERS | SANITY-030 to 039 | Marker patterns valid |
| EXTRACTION | SANITY-040 to 044 | Provider interface, evidence anchors |
| BRD | SANITY-050 to 059 | BRD parseable, counts match |
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
  const path = 'docs/UNIFIED_VERIFICATION_SPECIFICATION_V20_6_4.md';
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
    { path: 'docs/UNIFIED_VERIFICATION_SPECIFICATION_V20_6_4.md', expected: '20.6.4' },
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

### SANITY-044: Evidence Anchor Schema Exists
```typescript
// @implements SANITY-044
// @satisfies Cursor Plan V20.8.5 Constraint A.2

test('SANITY-044: Evidence anchor fields in entity schema', () => {
  const schemaPath = 'src/db/schema.ts';
  const content = fs.readFileSync(schemaPath, 'utf8');
  
  // Check JSONB attributes field exists for evidence
  expect(content).toContain('attributes');
  expect(content).toContain('jsonb');
});
```

---

## BRD Tests (SANITY-050 to 059)

### SANITY-055: BRD Registry Populated
```typescript
// @implements SANITY-055
// @satisfies Verification Spec V20.6.4 G-REGISTRY

test('SANITY-055: BRD counts match expected', async () => {
  const brd = await parseBRD('docs/BRD_V20_6_3_COMPLETE.md');
  
  expect(brd.epics.length).toBe(65);
  expect(brd.stories.length).toBe(351);
  expect(brd.acceptanceCriteria.length).toBe(2901);
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
- [ ] SANITY-010 to 016: Canonical documents ✓
- [ ] SANITY-020 to 022: Schema definitions ✓
- [ ] SANITY-030 to 033: Marker patterns ✓
- [ ] SANITY-040 to 044: Extraction infrastructure ✓
- [ ] SANITY-055 to 057: BRD parseable ✓
- [ ] SANITY-080 to 083: Dormant tests return skipped ✓

**Total: 54 active tests + 4 dormant = 58 tests**

---

## Mission Alignment

**Confirm:** This specification issues no oracle claims. Tests verify structure and presence, not semantic truth. Confidence in test results is evidence-bounded by actual execution.

---

**END OF SANITY SUITE SPECIFICATION**
