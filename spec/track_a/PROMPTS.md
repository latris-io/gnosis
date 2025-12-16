# Track A Cursor Prompts

**Version:** 1.2.0  
**Purpose:** Verbatim prompts for Cursor execution  
**Rule:** Use these prompts exactly as written. Do not paraphrase or summarize.

> **v1.2.0:** Added verify:track-a-entry script, Phase 0.7

**Schema Authority:** `src/schema/track-a/entities.ts` and `src/schema/track-a/relationships.ts` are authoritative. Do not hardcode type lists.

---

## Critical: Database Access Boundary

**These rules apply to ALL Track A stories:**

```
ARCHITECTURE LAYERS:
  Providers → Services → API → DB
  (data flows left-to-right; imports flow right-to-left)

ALLOWED:
- src/services/** may import from src/db/**
- src/api/v1/** may import from src/services/**
- Tests may access database ONLY through @gnosis/api/v1

FORBIDDEN:
- Providers (src/extraction/providers/*) importing from src/db/* or src/services/*
- API (src/api/v1/*) importing directly from src/db/* (must use services)
- Tests importing directly from src/db/* or src/services/*

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
   - scripts: test, test:sanity, verify:track-a-entry, verify:gates, verify:integrity, report:coverage
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

### 0.7: Track A Entry Verification Script

```
Create the Track A entry verification script:

1. Create scripts/verify-track-a-entry.ts:
   - Check all ENTRY.md prerequisites programmatically
   - Verify environment variables (DATABASE_URL, NEO4J_URL, NODE_ENV)
   - Verify canonical documents exist in docs/
   - Verify SANITY-001 through SANITY-024 pass
   - Output pass/fail status for each check

2. Expected output format:
   ✓ Environment prerequisites met
   ✓ Canonical documents present (6/6)
   ✓ SANITY suite passes
   ✓ Project structure valid
   
   TRACK A ENTRY: APPROVED

Mark code with @implements INFRASTRUCTURE.
```

---

## Story A.1: Entity Registry

### Initial Implementation Prompt

```
Implement Story A.1: Entity Registry per spec/track_a/stories/A1_ENTITY_REGISTRY.md

Architecture:
1. Entity service layer (src/services/entities/) - implements ENTRY.md Upsert Rule (Locked)
2. Entity API (src/api/v1/entities.ts) - project-scoped operations
3. Providers (src/extraction/providers/) - emit ExtractedEntity only, NO DB imports
4. Shadow ledger (src/ledger/shadow-ledger.ts) - CREATE/UPDATE only, not NO-OP

Constraints:
- Entity types: reference src/schema/track-a/entities.ts (ENTITY_TYPE_CODES export is authoritative)
- Extraction types: use src/extraction/types.ts (ExtractedEntity, EvidenceAnchor)
- Schema is defined in migrations/000_init.sql and migrations/003_reset_schema_to_cursor_plan.sql; do NOT create new migrations unless the story card explicitly requires it
- Do not create new migrations unless the story card explicitly requires a schema change; if it does, use migrations/004+
- Do NOT duplicate type definitions
- Providers must NOT import from src/db/* or src/services/*
- Shadow ledger writes to shadow-ledger/ledger.jsonl

Mark code with @implements STORY-64.1 and @satisfies AC-64.1.X markers.
```

### Verification Prompt

```
Run verification for Story A.1:

1. npm run sanity
2. npm test

If grep "Entity Registry" returns 0 tests, report it — do not invent tests.
Run only tests that exist. Show output and summarize pass/fail.

Check story card (spec/track_a/stories/A1_ENTITY_REGISTRY.md) for any additional verification requirements.
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
Implement Story A.2: Relationship Registry per spec/track_a/stories/A2_RELATIONSHIP_REGISTRY.md

Prerequisites:
- Story A.1 complete (entity service + API operational)

Architecture:
1. Relationship service layer (src/services/relationships/) - implements ENTRY.md Upsert Rule
2. Relationship API (src/api/v1/relationships.ts) - project-scoped operations  
3. Providers (src/extraction/providers/) - emit ExtractedRelationship only, NO DB imports

Constraints:
- Relationship types: reference src/schema/track-a/relationships.ts (RELATIONSHIP_TYPE_CODES export is authoritative)
- Extraction types: use src/extraction/types.ts (ExtractedRelationship uses from_instance_id/to_instance_id)
- Schema is defined in migrations/000_init.sql and migrations/003_reset_schema_to_cursor_plan.sql; do NOT create new migrations unless the story card explicitly requires it
- Do not create new migrations unless the story card explicitly requires a schema change; if it does, use migrations/004+
- Do NOT duplicate type definitions
- Providers must NOT import from src/db/* or src/services/*

Mark code with @implements STORY-64.2 and @satisfies AC-64.2.X markers.
```

### Verification Prompt

```
Run the verification tests for Story A.2:

1. npm run sanity
2. npm test

If grep "Relationship Registry" returns 0 tests, report it — do not invent tests.
Run only tests that exist. Show output and summarize pass/fail.

Check story card (spec/track_a/stories/A2_RELATIONSHIP_REGISTRY.md) for any additional verification requirements.
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
- Use marker relationship types from src/schema/track-a/relationships.ts (do not assume specific R-codes)
- Use src/extraction/types.ts for ExtractedRelationship
- All extractions must log to shadow ledger (CREATE/UPDATE only, not NO-OP)
- Providers must NOT import from src/db/* or src/services/*

Mark all code with @implements STORY-64.3 and @satisfies AC-64.3.X markers.
```

### Verification Prompt

```
Run the verification tests for Story A.3:

1. npm run sanity
2. npm test

If grep "Marker Extraction" returns 0 tests, report it — do not invent tests.
Run only tests that exist. Show output and summarize pass/fail.

Check story card (spec/track_a/stories/A3_MARKER_EXTRACTION.md) for any additional verification requirements.
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
- All pipeline operations must log to shadow ledger (CREATE/UPDATE only, not NO-OP)
- Reference src/schema/track-a/ for entity and relationship types (schema is authoritative)
- Use src/extraction/types.ts for ExtractedEntity, ExtractedRelationship

Mark all code with @implements STORY-64.4 and @satisfies AC-64.4.X markers.
```

### Verification Prompt

```
Run verification for Story A.4:

1. npm run sanity
2. npm test

If grep "Structural Analysis" returns 0 tests, report it — do not invent tests.
Run only tests that exist. Show output and summarize pass/fail.

Check story card (spec/track_a/stories/A4_STRUCTURAL_ANALYSIS.md) for any additional verification requirements.
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
- All operations must log to shadow ledger (CREATE/UPDATE only, not NO-OP)
- Must support pagination for large result sets
- API must call services, services call db (API must NOT import src/db/* directly)
- G-API gate must pass
- Reference src/schema/track-a/ for entity and relationship types (schema is authoritative)
- Use src/extraction/types.ts for ExtractedEntity, ExtractedRelationship

Mark all code with @implements STORY-64.5 and @satisfies AC-64.5.X markers.
```

### Verification Prompt

```
Run verification for Story A.5:

1. npm run sanity
2. npm test
3. npm run verify:g-api (if script exists)

If grep "Graph API" returns 0 tests, report it — do not invent tests.
Run only tests that exist. Show output and summarize pass/fail.

Check story card (spec/track_a/stories/A5_GRAPH_API_V1.md) for any additional verification requirements.
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
STOP. You referenced an entity or relationship that does not exist in Track A.

Valid Track A entity codes are exactly those exported by ENTITY_TYPE_CODES in src/schema/track-a/entities.ts.
Valid Track A relationship codes are exactly those exported by RELATIONSHIP_TYPE_CODES in src/schema/track-a/relationships.ts.

(If any hardcoded list in prompts conflicts with schema exports, schema exports win.)

Delete the hallucinated code and re-implement using only valid entities/relationships from the schema files.
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

Verification commands (run during story implementation):
rg -n "(from|require)\s+['\"].*(/db/|@gnosis/db|src/db|\\./db|\\.\\./db)" src/extraction/providers
rg -n "(from|require)\s+['\"].*(/services/|src/services|\\./services|\\.\\./services)" src/extraction/providers

Both must return 0 results.
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
