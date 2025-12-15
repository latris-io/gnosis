# Track A Entry Criteria

**Version:** 1.0.0  
**Implements:** Roadmap V20.6.4 Track A Entry  
**Purpose:** Prerequisites that must be satisfied before Track A implementation begins  
**Canonical Source:** GNOSIS_TO_SOPHIA_MASTER_ROADMAP_V20_6_4.md §Track A

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

- [ ] `docs/BRD_V20_6_3_COMPLETE.md` exists
- [ ] `docs/UNIFIED_TRACEABILITY_GRAPH_SCHEMA_V20_6_1.md` exists
- [ ] `docs/UNIFIED_VERIFICATION_SPECIFICATION_V20_6_4.md` exists
- [ ] `docs/GNOSIS_TO_SOPHIA_MASTER_ROADMAP_V20_6_4.md` exists
- [ ] `docs/CURSOR_IMPLEMENTATION_PLAN_V20_8_5.md` exists
- [ ] `docs/integrations/EP-D-002_RUNTIME_RECONCILIATION_V20_6_1.md` exists

### SANITY Suite

- [ ] All SANITY-001 to 005 tests pass (Environment)
- [ ] All SANITY-010 to 016 tests pass (Canonical)
- [ ] All SANITY-020 to 022 tests pass (Schema)
- [ ] All SANITY-030 to 033 tests pass (Markers)
- [ ] All SANITY-040 to 044 tests pass (Extraction)
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
| E04 | Requirement | Requirements | BRD parsing |
| E06 | ArchitecturalDecision | Design | ADR files |
| E08 | Component | Design | Module analysis |
| E11 | SourceFile | Implementation | Filesystem |
| E12 | Function | Implementation | AST analysis |
| E13 | Class | Implementation | AST analysis |
| E14 | Interface | Implementation | AST analysis |
| E15 | Module | Implementation | Import analysis |
| E27 | TestFile | Verification | Filesystem |
| E28 | TestSuite | Verification | AST analysis |
| E29 | TestCase | Verification | AST analysis |
| E49 | ReleaseVersion | Provenance | Git analysis |
| E50 | Commit | Provenance | Git analysis |
| E52 | ChangeSet | Provenance | Derived |

### Relationships to Implement (21)

| ID | Name | From → To |
|----|------|-----------|
| R01 | CONTAINS | Epic → Story |
| R02 | CONTAINS | Story → AcceptanceCriterion |
| R03 | SATISFIES | AcceptanceCriterion → Requirement |
| R04 | DERIVES_FROM | Requirement → Requirement |
| R05 | CONFLICTS_WITH | Requirement → Requirement |
| R10 | DECIDES | ArchitecturalDecision → Component |
| R11 | COMPONENT_OF | Component → Component |
| R21 | IMPORTS | SourceFile → SourceFile |
| R22 | CALLS | Function → Function |
| R23 | EXTENDS | Class → Class |
| R24 | IMPLEMENTS_INTERFACE | Class → Interface |
| R25 | DEFINES | SourceFile → Function/Class/Interface |
| R26 | DEPENDS_ON | Module → Module |
| R40 | CONTAINS | TestFile → TestSuite |
| R41 | CONTAINS | TestSuite → TestCase |
| R42 | TESTS | TestCase → Function |
| R43 | TESTS | TestCase → AcceptanceCriterion |
| R44 | COVERS | TestSuite → Story |
| R45 | VERIFIES | TestCase → Requirement |
| R60 | RELEASED_IN | Commit → ReleaseVersion |
| R61 | CHANGES | Commit → SourceFile |

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

Every extracted entity/relationship MUST capture provenance in `attributes` JSONB:

```typescript
interface EvidenceAnchor {
  source_file: string;
  line_start: number;
  line_end: number;
  commit_sha: string;
  extraction_timestamp: Date;
  extractor_version: string;
}
```

**Verification:** SANITY-044

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
- Store in `data/semantic_corpus.jsonl`

### API Boundary (Track A)
- Graph API v1 exposed at `@gnosis/api`
- No direct database imports in track code
- All operations through API methods

### Extension Protocol (Track A)
- N/A (Track A establishes base schema)
- No extensions permitted until Track B

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
