# Track A Entry Criteria

**Version:** 1.3.0  
**Implements:** Roadmap V20.6.4 Track A Entry  
**Purpose:** Prerequisites that must be satisfied before Track A implementation begins  
**Canonical Source:** GNOSIS_TO_SOPHIA_MASTER_ROADMAP_V20_6_4.md §Track A

> **v1.3.0:** Added SANITY model note, range 020-024, relationship endpoint deviation notice  
> **v1.2.0:** Multi-tenant identity fix: composite uniqueness ON CONFLICT (project_id, instance_id)  
> **v1.1.0:** Added instance_id patterns reference section

---

## Prerequisites

**Before checking this list, complete Phase 0 (Infrastructure Setup) from PROMPTS.md**

→ See `PROMPTS.md` §Phase 0: Infrastructure Setup (prompts 0.1 through 0.6)

---

## Track A Overview

| Attribute | Value |
|-----------|-------|
| **Duration** | 12-14 days |
| **Question Answered** | "What exists in my codebase?" |
| **Ingestion** | #1 (Initial) |
| **Oracle** | External (bootstrap scripts) |
| **Entities Added** | 16 |
| **Relationships Added** | 21 |
| **Gates** | G01, G03, G04, G06, G-API, G-COGNITIVE |

---

## Entry Checklist

### Environment Prerequisites

- [ ] Node.js >= 20.x installed
- [ ] TypeScript >= 5.x installed
- [ ] PostgreSQL 16+ running and accessible
- [ ] Neo4j 5.x running and accessible
- [ ] Environment variables configured:
  - [ ] `DATABASE_URL` set
  - [ ] `NEO4J_URL` set
  - [ ] `NODE_ENV` set

### Canonical Documents Present

- [ ] `docs/BRD_V20_6_4_COMPLETE.md` exists
- [ ] `docs/UNIFIED_TRACEABILITY_GRAPH_SCHEMA_V20_6_1.md` exists
- [ ] `docs/UNIFIED_VERIFICATION_SPECIFICATION_V20_6_6.md` exists
- [ ] `docs/GNOSIS_TO_SOPHIA_MASTER_ROADMAP_V20_6_4.md` exists
- [ ] `docs/CURSOR_IMPLEMENTATION_PLAN_V20_8_5.md` exists
- [ ] `docs/integrations/EP-D-002_RUNTIME_RECONCILIATION_V20_6_1.md` exists

### SANITY Suite (Entry Gate)

> **Model:** ENTRY.md lists minimum required tests for Track A entry. EXIT.md uses broader category ranges to accommodate future test additions within each category.

- [ ] All SANITY-001 to 005 tests pass (Environment)
- [ ] All SANITY-010 to 016 tests pass (Canonical)
- [ ] All SANITY-020 to 024 test declarations exist (Schema — pass required at EXIT)
- [ ] All SANITY-030 to 033 test declarations exist (Markers — pass required at EXIT)
- [ ] All SANITY-040 to 044 test declarations exist (Extraction — pass required at EXIT)
- [ ] All SANITY-055 to 057 tests pass (BRD)
- [ ] All SANITY-080 to 083 tests return `{skipped: true}` (Dormant)

### Project Structure

- [ ] `src/` directory exists
- [ ] `test/` directory exists
- [ ] `docs/` directory exists with canonical documents
- [ ] `package.json` configured with required dependencies
- [ ] `tsconfig.json` configured for TypeScript compilation

### Extension Proposals

- [ ] No extension proposals required for Track A (base schema only)
- [ ] If any extensions proposed: signed `spec/extensions/EXT-###.md` artifact exists

---

## Track A Scope

### Entities to Implement (16)

| ID | Name | Layer | Source |
|----|------|-------|--------|
| E01 | Epic | Requirements | BRD parsing |
| E02 | Story | Requirements | BRD parsing |
| E03 | AcceptanceCriterion | Requirements | BRD parsing |
| E04 | Constraint | Requirements | BRD parsing |
| E06 | TechnicalDesign | Design | ADR files |
| E08 | DataSchema | Design | Module analysis |
| E11 | SourceFile | Implementation | Filesystem |
| E12 | Function | Implementation | AST analysis |
| E13 | Class | Implementation | AST analysis |
| E15 | Module | Implementation | Import analysis |
| E27 | TestFile | Verification | Filesystem |
| E28 | TestSuite | Verification | AST analysis |
| E29 | TestCase | Verification | AST analysis |
| E49 | ReleaseVersion | Provenance | Git analysis |
| E50 | Commit | Provenance | Git analysis |
| E52 | ChangeSet | Provenance | Derived |

### Relationship Endpoint Resolution Notice

> **Deviation Resolved:** As of commit `c81e3ad`, the R04 deviation has been corrected.
>
> **Original deviation:** R04 was defined as `SourceFile → SourceFile` because E15 Module
> entities were incorrectly extracted from npm import targets instead of directory structure.
>
> **Resolution:** E15 extraction was corrected to derive modules from the parent directories
> of E11 SourceFile entities. R04 now correctly uses `Module (E15) → SourceFile (E11)`
> per BRD V20.6.4 Appendix I.
>
> **TDD Retrofit (v2.0.0):** R14 is now derived from TDD frontmatter.
> R14 semantics changed from "Story → Function/Class" to "TechnicalDesign → SourceFile".
>
> **Epistemic Boundary (v2.1.0):** R08, R09, R11 are deferred post-HGR-1. Track A is structural
> inventory + explicit markers. R08/R09/R11 are author-declared design-intent bindings that
> require human validation and are NOT Track A requirements.

### Relationships to Implement (20 Track A + 3 Post-HGR-1)

| ID | Name | From → To | Scope |
|----|------|-----------|-------|
| R01 | HAS_STORY | Epic → Story | A1 |
| R02 | HAS_AC | Story → AcceptanceCriterion | A1 |
| R03 | HAS_CONSTRAINT | AcceptanceCriterion → Constraint | A2 |
| R04 | CONTAINS_FILE | Module → SourceFile | A2 |
| R05 | CONTAINS_ENTITY | SourceFile → Function/Class | A2 |
| R06 | CONTAINS_SUITE | TestFile → TestSuite | A2 |
| R07 | CONTAINS_CASE | TestSuite → TestCase | A2 |
| R08 | DESIGNED_IN | Story → TechnicalDesign | **Post-HGR-1** |
| R09 | SPECIFIED_IN | AcceptanceCriterion → TechnicalDesign | **Post-HGR-1** |
| R11 | DEFINES_SCHEMA | Story → DataSchema | **Post-HGR-1** |
| R14 | IMPLEMENTED_BY | TechnicalDesign → SourceFile | A2 |
| R16 | DEFINED_IN | Function/Class → SourceFile | A2 |
| R18 | IMPLEMENTS | SourceFile → Story | A3 |
| R19 | SATISFIES | Function/Class → AcceptanceCriterion | A3 |
| R21 | IMPORTS | SourceFile → SourceFile | A4 |
| R22 | CALLS | Function → Function | A4 |
| R23 | EXTENDS | Class → Class | A4 |
| R24 | IMPLEMENTS_INTERFACE | Class → Interface | Post-A |
| R26 | DEPENDS_ON | Module → Module | A4 |
| R36 | TESTED_BY | Function/Class → TestCase | A3 |
| R37 | VERIFIED_BY | AcceptanceCriterion → TestCase | A3 |
| R63 | INTRODUCED_IN | SourceFile → Commit | A2 |
| R67 | MODIFIED_IN | SourceFile → Commit | A2 |
| R70 | GROUPS | ChangeSet → Commit | A2 |

> **Provenance Relationship Note:** R63 INTRODUCED_IN is a Track A-scoped deviation from global canon.
> Global canon defines R63 as Story → ReleaseVersion, but Track A restricts it
> to SourceFile → Commit to avoid heuristic provenance claims. R67 MODIFIED_IN
> is SourceFile → Commit in both global canon and Track A (error correction only).

### Gates to Pass

| Gate | Threshold | Description |
|------|-----------|-------------|
| G01 | 100% | Every story has `@implements` marker |
| G03 | 0 orphans | No code without story reference |
| G04 | 100% | Every story has tests |
| G06 | 0 orphans | No tests without AC reference |
| G-API | Pass | No direct database imports |
| G-COGNITIVE | Pass | Cognitive engine health check |

---

## Architectural Constraints (MUST READ)

### Constraint A.1: Modular Extraction (Provider Interface)

**DO NOT** implement extraction as a monolithic module.

**DO** implement behind this interface:

```typescript
// src/extraction/types.ts

export interface RepoSnapshot {
  id: string;
  root_path: string;
  commit_sha?: string;
  timestamp: Date;
}

export interface ExtractionProvider {
  name: string;
  extract(snapshot: RepoSnapshot): Promise<ExtractionResult>;
  supports(fileType: string): boolean;
}

export interface ExtractionResult {
  entities: Entity[];
  relationships: Relationship[];
  evidence: EvidenceAnchor[];
}
```

**Verification:** SANITY-043

### Constraint A.2: Evidence Anchors

Every extracted entity/relationship MUST capture provenance in **flat columns**:

```typescript
// For entities: stored in entity row columns
// For relationships: stored in relationship row columns
interface EvidenceFields {
  source_file: string;   // File where extraction occurred
  line_start: number;    // Starting line (1-indexed, > 0)
  line_end: number;      // Ending line (>= line_start)
  extracted_at: Date;    // Timestamp (auto-populated)
}
```

**Storage model:**
- Entities: `source_file`, `line_start`, `line_end`, `extracted_at` columns
- Relationships: `source_file`, `line_start`, `line_end`, `extracted_at` columns (added in Pre-A2 Hardening)
- Additional context may be stored in `attributes` JSONB (entities only)

**Verification:** SANITY-044 (entities), SANITY-045 (relationships)

---

## Stories in This Track

| Order | Story | File | Focus |
|-------|-------|------|-------|
| 1 | A.1 Entity Registry | `stories/A1_ENTITY_REGISTRY.md` | 16 entity types |
| 2 | A.2 Relationship Registry | `stories/A2_RELATIONSHIP_REGISTRY.md` | 21 relationship types |
| 3 | A.3 Marker Extraction | `stories/A3_MARKER_EXTRACTION.md` | @implements, @satisfies |
| 4 | A.4 Structural Analysis | `stories/A4_STRUCTURAL_ANALYSIS.md` | AST parsing |
| 5 | A.5 Graph API v1 | `stories/A5_GRAPH_API_V1.md` | CRUD + Query |

---

## Pillar Requirements

### Shadow Ledger (Track A)
- External JSONL file (not yet in graph)
- Every extraction operation logged
- Format: `{ timestamp, operation, entity_id, evidence }`

### Semantic Learning (Track A)
- Capture ≥50 signals during Track A
- Signal types: CORRECT, INCORRECT, PARTIAL
- Store in `semantic-corpus/{project_id}/signals.jsonl`

### API Boundary (Track A)
- Graph API v1 exposed at `@gnosis/api`
- No direct database imports in track code
- All operations through API methods

### Extension Protocol (Track A)
- N/A (Track A establishes base schema)
- No extensions permitted until Track B

### Upsert Rule (Locked)

- **Identity lookup** is project-scoped: `(project_id, instance_id)` at API/service boundary.
- **Persistence** uses PostgreSQL upsert: `ON CONFLICT (project_id, instance_id) DO UPDATE` with composite uniqueness constraint.
- **Conditional update**: Write only if `content_hash IS DISTINCT FROM EXCLUDED.content_hash`; otherwise NO-OP.
- **Shadow ledger**: `entity-link` entry emitted only on CREATE or UPDATE (not NO-OP).
- **Provenance**: Flat columns (`source_file`, `line_start`, `line_end`, `extracted_at`) overwritten on UPDATE.
- **Detection**: Use `RETURNING id, (xmax = 0) AS inserted` to distinguish INSERT vs UPDATE for ledger.

### Instance ID Patterns (Reference)

Canonical patterns used by Track A extraction. **If a story card specifies a different pattern, the story card wins until reconciled.**

| Entity | Pattern | Example | Defined In |
|--------|---------|---------|------------|
| E01 Epic | `EPIC-{number}` | `EPIC-64` | A1 §Step 3 |
| E02 Story | `STORY-{epic}.{story}` | `STORY-64.1` | A1 §Step 3 |
| E03 AcceptanceCriterion | `AC-{epic}.{story}.{ac}` | `AC-64.1.1` | A1 §Step 3 |
| E11 SourceFile | `FILE-{path}` | `FILE-src/index.ts` | A1 §Step 4 |
| E12 Function | `FUNC-{path}:{name}` | `FUNC-src/index.ts:main` | A1 §Step 4 |
| E13 Class | `CLASS-{path}:{name}` | `CLASS-src/entity.ts:Entity` | A1 §Step 4 |

**Patterns defined in story cards (not invented here):**

| Entity | Authority |
|--------|-----------|
| E04 Requirement | A1 BRD provider (if extracted) |
| E06 ArchitecturalDecision | A1 ADR provider |
| E08 Component | A1 module analysis |
| E15 Module | A1 import analysis |
| E27 TestFile | A1 filesystem provider |
| E28 TestSuite | A1 test provider |
| E29 TestCase | A1 test provider |
| E49 ReleaseVersion | A4 GIT provider |
| E50 Commit | A4 GIT provider |

> **Rule:** If an instance_id pattern is not explicitly defined above, the implementing provider defines it. Do not invent patterns here.

These patterns are used for:
- **Persistence:** `ON CONFLICT (project_id, instance_id)` deduplication
- **Identity:** `(project_id, instance_id)` at service boundary
- **Traceability:** Stable references across extractions

---

## Forbidden Actions

```
CURSOR MUST NOT:
- Reference entities E61+ (Track C)
- Reference entities E71+ (Track D)
- Reference entities E84-E85 (Dormant)
- Reference relationships R100+ (Track C+)
- Reference relationships R113-R114 (Dormant)
- Reference gates G-SEMANTIC, G-ALIGNMENT, G-CONFIDENCE (Track C)
- Reference gates G-POLICY, G-AUTONOMY (Track D)
- Reference gate G-RUNTIME (Dormant)
- Import from `@gnosis/api/v2` or higher
- Skip shadow ledger entries
- Assume tests pass without running them
```

---

## Entry Verification Command

```bash
# Run all entry criteria checks
npm run verify:track-a-entry

# This should output:
# ✓ Environment prerequisites met
# ✓ Canonical documents present
# ✓ SANITY suite passes (58 tests)
# ✓ Project structure valid
# ✓ No pending extension proposals
# 
# TRACK A ENTRY: APPROVED
```

---

## Next Step

Once all entry criteria are verified:
→ Proceed to `stories/A1_ENTITY_REGISTRY.md`

---

## Mission Alignment

**Confirm:** Track A builds structural extraction infrastructure. It makes no semantic claims. Entity/relationship extraction is deterministic pattern matching, not "understanding."

---

**END OF TRACK A ENTRY CRITERIA**
