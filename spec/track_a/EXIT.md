# Track A Exit Criteria

**Version:** 1.0.0  
**Implements:** Roadmap V20.6.4 Track A Exit  
**Purpose:** Verification checklist before HGR-1 (Human Gate Review 1)  
**Canonical Source:** GNOSIS_TO_SOPHIA_MASTER_ROADMAP_V20_6_4.md §Track A

---

## Prerequisites

- [ ] All Track A stories complete:
  - [ ] A.1 Entity Registry — Definition of Done complete
  - [ ] A.2 Relationship Registry — Definition of Done complete
  - [ ] A.3 Marker Extraction — Definition of Done complete
  - [ ] A.4 Structural Analysis — Definition of Done complete
  - [ ] A.5 Graph API v1 — Definition of Done complete

---

## Entity Verification

All 16 Track A entity types extractable and verified:

| ID | Entity | Test | Status |
|----|--------|------|--------|
| E01 | Epic | VERIFY-E01 | [ ] Pass |
| E02 | Story | VERIFY-E02 | [ ] Pass |
| E03 | AcceptanceCriterion | VERIFY-E03 | [ ] Pass |
| E04 | Requirement | VERIFY-E04 | [ ] Pass |
| E06 | ArchitecturalDecision | VERIFY-E06 | [ ] Pass |
| E08 | Component | VERIFY-E08 | [ ] Pass |
| E11 | SourceFile | VERIFY-E11 | [ ] Pass |
| E12 | Function | VERIFY-E12 | [ ] Pass |
| E13 | Class | VERIFY-E13 | [ ] Pass |
| E14 | Interface | VERIFY-E14 | [ ] Pass |
| E15 | Module | VERIFY-E15 | [ ] Pass |
| E27 | TestFile | VERIFY-E27 | [ ] Pass |
| E28 | TestSuite | VERIFY-E28 | [ ] Pass |
| E29 | TestCase | VERIFY-E29 | [ ] Pass |
| E49 | ReleaseVersion | VERIFY-E49 | [ ] Pass |
| E50 | Commit | VERIFY-E50 | [ ] Pass |

---

## Relationship Verification

All 21 Track A relationship types extractable and verified:

| ID | Relationship | Test | Status |
|----|--------------|------|--------|
| R01 | CONTAINS (Epic→Story) | VERIFY-R01 | [ ] Pass |
| R02 | CONTAINS (Story→AC) | VERIFY-R02 | [ ] Pass |
| R03 | SATISFIES | VERIFY-R03 | [ ] Pass |
| R04 | DERIVES_FROM | VERIFY-R04 | [ ] Pass |
| R05 | CONFLICTS_WITH | VERIFY-R05 | [ ] Pass |
| R10 | DECIDES | VERIFY-R10 | [ ] Pass |
| R11 | COMPONENT_OF | VERIFY-R11 | [ ] Pass |
| R21 | IMPORTS | VERIFY-R21 | [ ] Pass |
| R22 | CALLS | VERIFY-R22 | [ ] Pass |
| R23 | EXTENDS | VERIFY-R23 | [ ] Pass |
| R24 | IMPLEMENTS_INTERFACE | VERIFY-R24 | [ ] Pass |
| R25 | DEFINES | VERIFY-R25 | [ ] Pass |
| R26 | DEPENDS_ON | VERIFY-R26 | [ ] Pass |
| R40 | CONTAINS (TestFile→Suite) | VERIFY-R40 | [ ] Pass |
| R41 | CONTAINS (Suite→Case) | VERIFY-R41 | [ ] Pass |
| R42 | TESTS (Case→Function) | VERIFY-R42 | [ ] Pass |
| R43 | TESTS (Case→AC) | VERIFY-R43 | [ ] Pass |
| R44 | COVERS | VERIFY-R44 | [ ] Pass |
| R45 | VERIFIES | VERIFY-R45 | [ ] Pass |
| R60 | RELEASED_IN | VERIFY-R60 | [ ] Pass |
| R61 | CHANGES | VERIFY-R61 | [ ] Pass |

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

- [ ] All 54 active SANITY tests pass
- [ ] All 4 dormant SANITY tests return `{skipped: true}`

---

## Pillar Verification

### Shadow Ledger

- [ ] Shadow ledger file exists at `data/shadow_ledger.jsonl`
- [ ] Ledger contains entries for all entity creations
- [ ] Ledger contains entries for all relationship creations
- [ ] Ledger contains entries for pipeline start/complete
- [ ] Entry count: ___ entries *(record actual)*

### Semantic Learning

- [ ] Semantic corpus exists at `data/semantic_corpus.jsonl`
- [ ] Minimum 50 signals captured during Track A
- [ ] Signal types include: CORRECT, INCORRECT, PARTIAL, ORPHAN_MARKER, AMBIGUOUS
- [ ] Signal count: ___ signals *(record actual, must be ≥50)*
- [ ] `captureSemanticSignal()` function operational

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
| Epics | 65 | ___ *(record actual)* | [ ] Match |
| Stories | 351 | ___ *(record actual)* | [ ] Match |
| Acceptance Criteria | 2,901 | ___ *(record actual)* | [ ] Match |

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
