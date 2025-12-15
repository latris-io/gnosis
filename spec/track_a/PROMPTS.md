# Track A Cursor Prompts

**Version:** 1.0.0  
**Purpose:** Verbatim prompts for Cursor execution  
**Rule:** Use these prompts exactly as written. Do not paraphrase or summarize.

---

## Critical: Database Access Boundary

**These rules apply to ALL Track A stories:**

```
ALLOWED:
- src/api/v1/*.ts may import from src/db/*
- Tests may access database ONLY through @gnosis/api/v1

FORBIDDEN:
- Providers (src/extraction/providers/*) importing from src/db/*
- Any file outside src/api/v1/ importing from src/db/*
- Tests importing directly from src/db/*

ENFORCEMENT:
- G-API gate will fail if violated
- Cursor must halt and fix if direct DB import detected
```

---

## Phase 0: Infrastructure Setup

**Execute these prompts BEFORE SANITY tests.**

### 0.1: Project Initialization

```
Initialize the Gnosis project with the following structure:

1. Create package.json with:
   - name: "@gnosis/core"
   - type: "module"
   - scripts: test, test:sanity, verify:gates, verify:integrity, report:coverage
   - dependencies: pg, neo4j-driver, ts-morph, unified, remark-parse
   - devDependencies: typescript, vitest, @types/node, @types/pg

2. Create tsconfig.json with:
   - target: ES2022
   - module: NodeNext
   - moduleResolution: NodeNext
   - outDir: dist
   - rootDir: src
   - strict: true
   - paths: { "@gnosis/api/*": ["./src/api/*"] }

3. Create directory structure:
   src/
   ├── api/v1/
   ├── db/
   ├── entities/
   ├── relationships/
   ├── extraction/
   │   ├── providers/
   │   └── parsers/
   ├── ledger/
   ├── markers/
   └── pipeline/
   test/
   data/
   docs/
   migrations/

4. Create .env.example with:
   DATABASE_URL=postgresql://user:pass@localhost:5432/gnosis
   NEO4J_URL=bolt://localhost:7687
   NEO4J_USER=neo4j
   NEO4J_PASSWORD=password
   NODE_ENV=development

5. Create .gitignore (node_modules, dist, .env, data/*.jsonl)

Do not create any implementation files yet - just the scaffolding.
```

### 0.2: PostgreSQL Setup

```
Set up PostgreSQL for Gnosis:

1. Create database connection module at src/db/pool.ts:
   - Use pg Pool with DATABASE_URL from environment
   - Export pool instance
   - Add connection test function

2. Create initial migration at migrations/000_init.sql:
   - Enable uuid-ossp extension
   - Create projects table (id UUID PRIMARY KEY, name TEXT, created_at TIMESTAMPTZ)
   - Set up RLS helper function for project isolation

3. Create migration runner at src/db/migrate.ts:
   - Read SQL files from migrations/ in order
   - Execute against pool
   - Track applied migrations

4. Verify connection works:
   - Run: npx ts-node src/db/pool.ts
   - Should output "PostgreSQL connected"

Mark code with @implements INFRASTRUCTURE and @satisfies SANITY-003.
```

### 0.3: Neo4j Setup

```
Set up Neo4j for Gnosis:

1. Create Neo4j connection module at src/db/neo4j.ts:
   - Use neo4j-driver with NEO4J_URL, NEO4J_USER, NEO4J_PASSWORD from environment
   - Export driver and session factory
   - Add connection test function

2. Create Neo4j constraints at migrations/neo4j/000_constraints.cypher:
   - CREATE CONSTRAINT entity_id IF NOT EXISTS FOR (e:Entity) REQUIRE e.id IS UNIQUE
   - CREATE INDEX entity_type IF NOT EXISTS FOR (e:Entity) ON (e.type)

3. Create constraint runner at src/db/neo4j-migrate.ts:
   - Read Cypher files from migrations/neo4j/ in order
   - Execute against session
   - Track applied constraints

4. Verify connection works:
   - Run: npx ts-node src/db/neo4j.ts
   - Should output "Neo4j connected"

Mark code with @implements INFRASTRUCTURE and @satisfies SANITY-004.
```

### 0.4: Environment Verification

```
Create environment verification script:

1. Create src/config/env.ts:
   - Load and validate required environment variables
   - DATABASE_URL (required)
   - NEO4J_URL (required)
   - NEO4J_USER (required)
   - NEO4J_PASSWORD (required)
   - NODE_ENV (required, default: development)
   - Throw clear error if any required var missing

2. Create scripts/verify-env.ts:
   - Import env config
   - Test PostgreSQL connection
   - Test Neo4j connection
   - Output status for each

3. Add npm script: "verify:env": "npx ts-node scripts/verify-env.ts"

4. Run verification:
   - npm run verify:env
   - Should output all green checkmarks

Mark code with @implements INFRASTRUCTURE and @satisfies SANITY-005.
```

### 0.5: Copy Canonical Documents

```
Copy the canonical documents to the docs/ directory:

Required files (copy from project knowledge or provided sources):
- docs/BRD_V20_6_3_COMPLETE.md
- docs/UNIFIED_TRACEABILITY_GRAPH_SCHEMA_V20_6_1.md
- docs/UNIFIED_VERIFICATION_SPECIFICATION_V20_6_4.md
- docs/GNOSIS_TO_SOPHIA_MASTER_ROADMAP_V20_6_4.md
- docs/CURSOR_IMPLEMENTATION_PLAN_V20_8_5.md
- docs/integrations/EP-D-002_RUNTIME_RECONCILIATION_V20_6_1.md

Verify each file:
- Exists at correct path
- Has correct version in header
- Is readable

This satisfies SANITY-010 through SANITY-015.
```

### 0.6: Test Framework Setup

```
Set up the test framework:

1. Create vitest.config.ts:
   - test.include: ['test/**/*.test.ts']
   - test.environment: 'node'
   - test.globals: true

2. Create test/setup.ts:
   - Load environment variables
   - Initialize database connections
   - Export test utilities

3. Create test/sanity/sanity.test.ts:
   - Implement SANITY-001 through SANITY-009 (environment tests)
   - Implement SANITY-010 through SANITY-016 (canonical doc tests)
   - Leave placeholders for SANITY-020+ (will be filled in A.1)

4. Add npm script: "test:sanity": "vitest run test/sanity/"

5. Run SANITY suite:
   - npm run test:sanity
   - Environment tests (001-009) should pass
   - Canonical tests (010-016) should pass
   - Schema/marker tests (020+) may be skipped/placeholder

Mark code with @implements INFRASTRUCTURE.
```

### Phase 0 Verification

```
Verify Phase 0 infrastructure is complete:

Run these commands and show output:

1. npm run verify:env
   Expected: All connections successful

2. npm run test:sanity
   Expected: SANITY-001 to 016 pass (schema tests may be placeholder)

3. ls -la docs/
   Expected: All 6 canonical documents present

4. ls -la src/
   Expected: All directories created (api, db, entities, etc.)

5. cat .env (or confirm .env exists with required vars)
   Expected: DATABASE_URL, NEO4J_URL, NODE_ENV set

If all pass, Phase 0 is complete. Proceed to Story A.1.
```

---

## Story A.1: Entity Registry

### Initial Implementation Prompt

```
I need you to implement Story A.1: Entity Registry from the spec file spec/track_a/stories/A1_ENTITY_REGISTRY.md

Key requirements:
1. Create entity type definitions in src/entities/types.ts
2. Create PostgreSQL migration in migrations/001_entities.sql
3. Implement BRD parser in src/extraction/providers/brd-provider.ts
4. Implement AST provider in src/extraction/providers/ast-provider.ts
5. Create shadow ledger in src/ledger/shadow-ledger.ts
6. Create semantic corpus in src/ledger/semantic-corpus.ts
7. Create entity API in src/api/v1/entities.ts

Constraints:
- All entity types must match Epic 64 specification (E01-E50)
- Every entity must have an evidence anchor
- All operations must log to shadow ledger
- Semantic corpus must be initialized for Track C signals
- Use PostgreSQL with RLS per AC-39.6.1
- Do not import database modules directly in providers

Start with src/entities/types.ts and the PostgreSQL migration.

Mark all code with @implements STORY-64.1 and @satisfies AC-64.1.X markers.
```

### Verification Prompt

```
Run the verification tests for Story A.1:

npm run test -- --grep "Entity Registry"

Expected results:
- VERIFY-E01: Epic extraction passes (65 epics)
- VERIFY-E02: Story extraction passes (351 stories)
- VERIFY-E03: AC extraction passes (2,901 ACs)
- VERIFY-E12: Function extraction passes
- All entities have evidence anchors
- Shadow ledger contains entries
- VERIFY-CORPUS-01: Semantic corpus initialized
- Semantic signal capture works

Show me the test output and confirm all tests pass.
```

### Fix Issues Prompt

```
The following issues were found in Story A.1 implementation:

[LIST SPECIFIC ISSUES HERE]

Please fix these issues:
1. Do not change code that is working correctly
2. Focus only on the failing tests
3. Ensure @implements and @satisfies markers are present
4. Verify shadow ledger logging after fixes
5. Re-run tests to confirm fixes

Show me the corrected code and test results.
```

---

## Story A.2: Relationship Registry

### Initial Implementation Prompt

```
I need you to implement Story A.2: Relationship Registry from the spec file spec/track_a/stories/A2_RELATIONSHIP_REGISTRY.md

Prerequisites confirmed:
- Story A.1 Entity Registry is complete
- All 16 entity types are extractable
- Entity API is operational

Key requirements:
1. Create relationship type definitions in src/relationships/types.ts
2. Create PostgreSQL migration in migrations/002_relationships.sql
3. Implement BRD relationship provider in src/extraction/providers/brd-relationship-provider.ts
4. Implement AST relationship provider in src/extraction/providers/ast-relationship-provider.ts
5. Create relationship API in src/api/v1/relationships.ts

Constraints:
- All 21 relationship types must match Epic 64 specification (R01-R61)
- Relationships must reference existing entities
- All operations must log to shadow ledger
- Neo4j must be used for graph traversal
- Do not import database modules directly in providers

Start with src/relationships/types.ts and the PostgreSQL migration.

Mark all code with @implements STORY-64.2 and @satisfies AC-64.2.X markers.
```

### Verification Prompt

```
Run the verification tests for Story A.2:

npm run test -- --grep "Relationship Registry"

Expected results:
- VERIFY-R01: 351 Epic→Story CONTAINS relationships
- VERIFY-R02: 2,901 Story→AC CONTAINS relationships
- VERIFY-R21: File import relationships extracted
- VERIFY-R22: Function call relationships extracted
- All relationships have evidence anchors
- Neo4j traversal works

Show me the test output and confirm all tests pass.
```

---

## Story A.3: Marker Extraction

### Initial Implementation Prompt

```
I need you to implement Story A.3: Marker Extraction from the spec file spec/track_a/stories/A3_MARKER_EXTRACTION.md

Prerequisites confirmed:
- Story A.1 Entity Registry is complete
- Story A.2 Relationship Registry is complete
- SANITY-030 to 033 pass (marker patterns)

Key requirements:
1. Create marker types in src/markers/types.ts
2. Implement marker provider in src/extraction/providers/marker-provider.ts
3. Implement marker validator in src/markers/validator.ts
4. Create marker API in src/api/v1/markers.ts

Marker patterns:
- @implements STORY-{epic}.{story} → /@implements\s+(STORY-\d+\.\d+)/g
- @satisfies AC-{epic}.{story}.{ac} → /@satisfies\s+(AC-\d+\.\d+\.\d+)/g

Constraints:
- Must extract from single-line and multi-line comments
- Must validate marker targets exist in entity registry
- Must report orphan markers (target not found)
- Must create IMPLEMENTS and SATISFIES relationships
- All extractions must log to shadow ledger

Mark all code with @implements STORY-64.3 and @satisfies AC-64.3.X markers.
```

### Verification Prompt

```
Run the verification tests for Story A.3:

npm run test -- --grep "Marker Extraction"

Expected results:
- VERIFY-MARKER-01: @implements markers extracted
- VERIFY-MARKER-02: @satisfies markers extracted
- VERIFY-MARKER-03: Markers linked to source entities
- VERIFY-MARKER-04: Marker targets validated
- VERIFY-MARKER-05: Orphan markers reported
- VERIFY-MARKER-06: Multiline comments supported

Show me the test output and confirm all tests pass.
```

---

## Story A.4: Structural Analysis

### Initial Implementation Prompt

```
I need you to implement Story A.4: Structural Analysis Pipeline from the spec file spec/track_a/stories/A4_STRUCTURAL_ANALYSIS.md

Prerequisites confirmed:
- Stories A.1, A.2, A.3 are complete
- All extraction providers are operational

Key requirements:
1. Create pipeline types in src/pipeline/types.ts
2. Implement orchestrator in src/pipeline/orchestrator.ts
3. Implement integrity validator in src/pipeline/integrity.ts
4. Implement incremental extractor in src/pipeline/incremental.ts
5. Create pipeline API in src/api/v1/pipeline.ts

Provider execution order:
1. SNAPSHOT → 2. FILESYSTEM → 3. BRD → 4. AST → 5. TEST → 6. GIT
7. MARKERS → 8. BRD_REL → 9. AST_REL → 10. TEST_REL → 11. GIT_REL → 12. VALIDATE

Constraints:
- Must execute providers in dependency order
- Must handle provider failures gracefully
- Must validate graph integrity post-extraction
- Must support incremental extraction
- All pipeline operations must log to shadow ledger

Mark all code with @implements STORY-64.4 and @satisfies AC-64.4.X markers.
```

### Verification Prompt

```
Run the verification tests for Story A.4:

npm run test -- --grep "Structural Analysis Pipeline"

Expected results:
- VERIFY-PIPELINE-01: All providers executed
- VERIFY-PIPELINE-02: Dependency order correct
- VERIFY-PIPELINE-03: Failures handled gracefully
- VERIFY-PIPELINE-04: Statistics reported
- VERIFY-PIPELINE-05: Integrity validated
- VERIFY-PIPELINE-06: Incremental extraction works
- VERIFY-PIPELINE-07: Snapshot created

Show me the test output and confirm all tests pass.
```

---

## Story A.5: Graph API v1

### Initial Implementation Prompt

```
I need you to implement Story A.5: Graph API v1 from the spec file spec/track_a/stories/A5_GRAPH_API_V1.md

Prerequisites confirmed:
- Stories A.1, A.2, A.3, A.4 are complete
- Database schemas deployed
- Neo4j constraints created

Key requirements:
1. Create API types in src/api/v1/types.ts
2. Implement entity operations in src/api/v1/entities.ts (enhance existing)
3. Implement relationship operations in src/api/v1/relationships.ts (enhance existing)
4. Implement traversal in src/api/v1/traversal.ts
5. Implement impact analysis in src/api/v1/impact.ts
6. Implement coverage queries in src/api/v1/coverage.ts
7. Create API index in src/api/v1/index.ts

Constraints:
- API must be exported at @gnosis/api/v1
- All operations must log to shadow ledger
- Must support pagination for large result sets
- No direct database access outside src/db/
- G-API gate must pass

Mark all code with @implements STORY-64.5 and @satisfies AC-64.5.X markers.
```

### Verification Prompt

```
Run the verification tests for Story A.5:

npm run test -- --grep "Graph API v1"

Expected results:
- VERIFY-API-01: Entity CRUD works
- VERIFY-API-02: Relationship CRUD works
- VERIFY-API-03: Type-safe queries work
- VERIFY-API-04: Graph traversal works
- VERIFY-API-05: Impact analysis works
- VERIFY-API-06: Coverage queries work
- VERIFY-API-07: API versioning correct
- VERIFY-API-08: Pagination works

Also run G-API gate verification:
npm run verify:g-api

Show me the test output and confirm all tests pass.
```

---

## Track A Exit Verification

### Complete Track A Verification Prompt

```
I need to verify Track A is complete. Run the following:

1. All SANITY tests:
   npm run test:sanity

2. All entity tests:
   npm run test -- --grep "Entity Registry"

3. All relationship tests:
   npm run test -- --grep "Relationship Registry"

4. All marker tests:
   npm run test -- --grep "Marker Extraction"

5. All pipeline tests:
   npm run test -- --grep "Pipeline"

6. All API tests:
   npm run test -- --grep "Graph API"

7. Gate verification:
   npm run verify:gates

8. Integrity check:
   npm run verify:integrity

Show me the output of each command and summarize:
- Total tests passed/failed
- Any failing tests
- Gate status (G01, G03, G04, G06, G-API, G-COGNITIVE)
- Integrity check results
```

### Generate Exit Report Prompt

```
Generate the Track A exit report for HGR-1 review.

Include:
1. Entity verification status (16 entities)
2. Relationship verification status (21 relationships)
3. Gate verification status (6 gates)
4. SANITY test results (58 tests)
5. Pillar compliance status
6. BRD count verification (65/351/2901)
7. Integrity check results
8. Coverage report

Format as the checklist in spec/track_a/EXIT.md with actual values filled in.
```

---

## Error Recovery Prompts

### Hallucinated Entity/Relationship

```
STOP. You referenced an entity or relationship that does not exist in Epic 64.

Valid Track A entities: E01-E04, E06, E08, E11-E15, E27-E29, E49-E50
Valid Track A relationships: R01-R05, R10-R11, R21-R26, R40-R45, R60-R61

Delete the hallucinated code and re-implement using only valid entities/relationships from the Verification Spec V20.6.4.
```

### G-API Violation

```
STOP. You have a G-API violation: direct database import detected.

FORBIDDEN:
- import { db } from '../database'
- import { prisma } from '@prisma/client'
- import { pool } from '../db/pool' (outside src/db/)

REQUIRED:
- import { createEntity, queryEntities } from '@gnosis/api/v1'

Remove the direct database imports and refactor to use the Graph API.
```

### Test Failure

```
The following test(s) failed:

[TEST NAME]: [ERROR MESSAGE]

Please fix the failing test(s):
1. Read the test expectation carefully
2. Check the implementation against the spec file
3. Ensure @implements and @satisfies markers are correct
4. Do not modify the test — fix the implementation
5. Re-run the test to confirm the fix

Show me the corrected code.
```

---

## Mission Alignment Reminder

Before completing any story, verify:

```
MISSION ALIGNMENT CHECK:

[ ] No oracle claims made (confidence ≠ truth)
[ ] No "understanding" language used
[ ] All outputs are evidence-bounded
[ ] Extraction is structural, not semantic
[ ] Markers are pattern-matched, not interpreted

If any check fails, revise the implementation.
```

---

**END OF TRACK A PROMPTS**
