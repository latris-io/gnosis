# Track A Exit Criteria

**Version:** 1.2.1  
**Implements:** Roadmap V20.6.4 Track A Exit  
**Purpose:** Verification checklist before HGR-1 (Human Gate Review 1)  
**Canonical Source:** GNOSIS_TO_SOPHIA_MASTER_ROADMAP_V20_6_4.md §Track A

> **v1.2.1:** Added SANITY model clarification note  
> **v1.2.0:** Entity count consistency: "16 in scope, 15 extractable (E14 deferred)"  
> **v1.1.0:** Added script reference note

---

## Verification Scripts

> **Note:** Verification scripts are defined during Phase 0 infrastructure setup. See `PROMPTS.md` §Phase 0.1 for `package.json` script definitions and §Phase 0.6 for test framework setup.

**Available scripts** (per `package.json`):
- `test:sanity` — Run SANITY suite
- `verify:gates` — Verify gate requirements
- `verify:integrity` — Run integrity checks
- `report:coverage` — Generate coverage report
- `validate:a1` — Validate A1 Entity Registry exit criteria

**Phase 0 deliverables** (create if missing):
- `verify:track-a-entry` — Verify Track A entry criteria (referenced in ENTRY.md)

---

## Prerequisites

- [ ] All Track A stories complete:
  - [x] A.1 Entity Registry — Definition of Done complete *(verified 2025-12-16)*
  - [ ] A.2 Relationship Registry — Definition of Done complete
  - [ ] A.3 Marker Extraction — Definition of Done complete
  - [ ] A.4 Structural Analysis — Definition of Done complete
  - [ ] A.5 Graph API v1 — Definition of Done complete

---

## Entity Verification

All 16 Track A entity types in scope; 15 extractable and verified (E14 Interface deferred):

| ID | Entity | Test | Status |
|----|--------|------|--------|
| E01 | Epic | VERIFY-E01 | [x] Pass (65) |
| E02 | Story | VERIFY-E02 | [x] Pass (351) |
| E03 | AcceptanceCriterion | VERIFY-E03 | [x] Pass (2,849) |
| E04 | Constraint | VERIFY-E04 | [x] Pass (0 - none in BRD) |
| E06 | TechnicalDesign | VERIFY-E06 | [x] Pass (1) |
| E08 | DataSchema | VERIFY-E08 | [x] Pass (4) |
| E11 | SourceFile | VERIFY-E11 | [x] Pass (21) |
| E12 | Function | VERIFY-E12 | [x] Pass (51) |
| E13 | Class | VERIFY-E13 | [x] Pass (7) |
| E15 | Module | VERIFY-E15 | [x] Pass (25) |
| E27 | TestFile | VERIFY-E27 | [x] Pass (6) |
| E28 | TestSuite | VERIFY-E28 | [x] Pass (21) |
| E29 | TestCase | VERIFY-E29 | [x] Pass (48) |
| E49 | ReleaseVersion | VERIFY-E49 | [x] Pass (0 - no tags) |
| E50 | Commit | VERIFY-E50 | [x] Pass (22) |
| E52 | ChangeSet | VERIFY-E52 | [x] Pass (0 - no STORY refs) |

---

## Relationship Verification

All 21 Track A relationship types extractable and verified:

| ID | Relationship | Test | Status |
|----|--------------|------|--------|
| R01 | HAS_STORY (Epic→Story) | VERIFY-R01 | [ ] Pass |
| R02 | HAS_AC (Story→AC) | VERIFY-R02 | [ ] Pass |
| R03 | HAS_CONSTRAINT | VERIFY-R03 | [ ] Pass |
| R04 | CONTAINS_FILE | VERIFY-R04 | [ ] Pass |
| R05 | CONTAINS_ENTITY | VERIFY-R05 | [ ] Pass |
| R06 | CONTAINS_SUITE | VERIFY-R06 | [ ] Pass |
| R07 | CONTAINS_CASE | VERIFY-R07 | [ ] Pass |
| R14 | IMPLEMENTED_BY | VERIFY-R14 | [ ] Pass |
| R16 | DEFINED_IN | VERIFY-R16 | [ ] Pass |
| R18 | IMPLEMENTS | VERIFY-R18 | [ ] Pass |
| R19 | SATISFIES | VERIFY-R19 | [ ] Pass |
| R21 | IMPORTS | VERIFY-R21 | [ ] Pass |
| R22 | CALLS | VERIFY-R22 | [ ] Pass |
| R23 | EXTENDS | VERIFY-R23 | [ ] Pass |
| R24 | IMPLEMENTS_INTERFACE | VERIFY-R24 | [ ] Pass |
| R26 | DEPENDS_ON | VERIFY-R26 | [ ] Pass |
| R36 | TESTED_BY | VERIFY-R36 | [ ] Pass |
| R37 | VERIFIED_BY | VERIFY-R37 | [ ] Pass |
| R63 | INTRODUCED_IN | VERIFY-R63 | [ ] Pass |
| R67 | MODIFIED_IN | VERIFY-R67 | [ ] Pass |
| R70 | GROUPS | VERIFY-R70 | [ ] Pass |

---

## Gate Verification

| Gate | Threshold | Actual | Status |
|------|-----------|--------|--------|
| G01 | 100% stories have @implements | ___% *(record actual)* | [ ] Pass |
| G03 | 0 orphan code entities | ___ orphans *(record actual)* | [ ] Pass |
| G04 | 100% stories have tests | ___% *(record actual)* | [ ] Pass |
| G06 | 0 orphan tests | ___ orphans *(record actual)* | [ ] Pass |
| G-API | No direct DB imports | ___ violations *(record actual)* | [ ] Pass |
| G-COGNITIVE | Health check passes | ___ *(record actual)* | [ ] Pass |

**Note:** All "record actual" fields MUST be filled with real values during HGR-1 review. Blank fields = incomplete review.

---

## SANITY Suite Verification

```bash
# Run complete SANITY suite
npm run test:sanity

# Expected output:
# SANITY-001 to 009: Environment ✓
# SANITY-010 to 019: Canonical ✓
# SANITY-020 to 029: Schema ✓
# SANITY-030 to 039: Markers ✓
# SANITY-040 to 044: Extraction ✓
# SANITY-050 to 059: BRD ✓
# SANITY-080 to 083: Dormant (skipped) ✓
#
# Total: 58 tests (54 passed, 4 skipped)
```

> **Model:** EXIT.md uses broad category ranges (e.g., 001-009) to accommodate future test additions within each category. ENTRY.md specifies the minimum subset required for Track A entry.

- [ ] All 54 active SANITY tests pass
- [ ] All 4 dormant SANITY tests return `{skipped: true}`

---

## Pillar Verification

### Shadow Ledger

- [x] Shadow ledger file exists at `shadow-ledger/ledger.jsonl`
- [x] Ledger contains entries for all entity creations
- [ ] Ledger contains entries for all relationship creations *(A2)*
- [ ] Ledger contains entries for pipeline start/complete *(A5)*
- [x] Entry count: **10** entries *(A1 verified 2025-12-16)*

### Semantic Learning

- [x] Semantic corpus exists at `semantic-corpus/signals.jsonl`
- [x] Minimum 50 signals captured during Track A
- [x] Signal types include: CORRECT, INCORRECT, PARTIAL, ORPHAN_MARKER, AMBIGUOUS
- [x] Signal count: **17,063** signals *(A1 verified 2025-12-16, must be ≥50)*
- [x] `captureSemanticSignal()` function operational

### API Boundary

- [ ] `@gnosis/api/v1` exports all required functions
- [ ] No direct database imports in src/ (outside src/db/)
- [ ] G-API verification passes
- [ ] API version header present

### Extension Protocol

- [ ] N/A for Track A (base schema only)
- [ ] No extension artifacts created
- [ ] Confirm: No entities E61+ referenced
- [ ] Confirm: No relationships R100+ referenced

---

## BRD Count Verification

| Metric | Expected | Actual | Status |
|--------|----------|--------|--------|
| Epics | 65 | 65 | [x] Match |
| Stories | 351 | 351 | [x] Match |
| Acceptance Criteria | 2,849 | 2,849 | [x] Match |

**Note:** These counts MUST match exactly. Any mismatch indicates extraction error.

---

## Infrastructure Verification

### PostgreSQL

- [ ] All migrations applied
- [ ] RLS policies active on `entities` table
- [ ] RLS policies active on `relationships` table
- [ ] Indexes created

### Neo4j

- [ ] Node constraints created for Entity
- [ ] All entities replicated to Neo4j
- [ ] All relationships replicated to Neo4j
- [ ] Traversal queries functional

---

## Integrity Check Results

Run integrity validation:

```bash
npm run verify:integrity
```

| Check | Status |
|-------|--------|
| All relationships reference valid entities | [ ] Pass |
| All entity IDs unique | [ ] Pass |
| All required entity types present | [ ] Pass |
| BRD counts match expected | [ ] Pass |
| No orphan files | [ ] Pass |
| Graph is connected (Epic→Function paths exist) | [ ] Pass |

---

## Coverage Report

```bash
npm run report:coverage
```

| Metric | Value | Status |
|--------|-------|--------|
| Story coverage (has @implements) | ___% *(record actual)* | [ ] Recorded |
| AC coverage (has @satisfies) | ___% *(record actual)* | [ ] Recorded |
| Test coverage (story has tests) | ___% *(record actual)* | [ ] Recorded |

**Note:** Coverage values are recorded for baseline, not enforced in Track A. Track B+ may set thresholds.

---

## Commit Verification

- [ ] All Track A code committed
- [ ] Commit messages follow pattern: `STORY-64.X: [Title]`
- [ ] No uncommitted changes
- [ ] Branch: `track-a` or `main`

---

## Final Checklist

- [ ] All entity tests pass (16/16)
- [ ] All relationship tests pass (21/21)
- [ ] All gate tests pass (6/6)
- [ ] All SANITY tests pass (54/54 active)
- [ ] Shadow ledger populated
- [ ] Semantic corpus populated
- [ ] Integrity checks pass
- [ ] No direct database access violations
- [ ] **Mission Alignment:** Track A makes no oracle claims — only structural extraction

---

## Human Gate HGR-1

**HALT: Awaiting HGR-1 approval**

This checklist must be reviewed and signed by a human before proceeding to Track B.

→ Complete the formal approval in: `HUMAN_GATE_HGR-1.md`

### Sign-off

```
Track A Exit Review

Date: _______________
Reviewer: _______________

Entity Verification:    [ ] Approved  [ ] Needs Work
Relationship Verification: [ ] Approved  [ ] Needs Work
Gate Verification:      [ ] Approved  [ ] Needs Work
Pillar Verification:    [ ] Approved  [ ] Needs Work
Integrity Verification: [ ] Approved  [ ] Needs Work

Overall Status: [ ] APPROVED FOR TRACK B  [ ] BLOCKED

Notes:
_________________________________________________
_________________________________________________

Signature: _______________
```

---

## Next Step

**IF APPROVED:** Proceed to Track B → `../track_b/ENTRY.md`

**IF BLOCKED:** Address issues noted above, re-run verification, request re-review.

---

**END OF TRACK A EXIT CRITERIA**
