# Pre-A4 Stabilization Packet

**Date:** 2025-12-30T18:06:47Z  
**Branch:** `chore/pre-a4-stabilization`  
**Purpose:** Eliminate all doc/spec drift before A4 implementation

---

## 1. Baseline Values

| Field | Value |
|-------|-------|
| PROJECT_ID | `6df2f456-440d-4958-b475-d9808775ff69` |
| CANONICAL_SHA | `d6c2c9e2171eb2c3019f1b2cd2a3eba96e1e33ab` |
| BRD_HASH | `bc1c78269d7b5192ddad9c06c1aa49c29abcf4a60cdaa039157a22b5c8c77977` |
| FREEZE_TIMESTAMP | `2025-12-30T02:39:29.502Z` |
| Canonical BRD Counts | E01=65, E02=397, E03=3147 |

---

## 2. Pre-Fix Test Results

### 2.1 Sanity Tests

```
Test Files  10 passed (10)
Tests  66 passed (66)
```

### 2.2 Full Test Suite

```
Test Files  28 passed (29)  [1 transient SSL error]
Tests  255 passed (256)
```

### 2.3 Organ Parity

```
PASS: 11 checks passed
- endmarker-parity: V20.6.4, V20.6.1, V20.6.6, V20.6.4, V20.8.5, V20.6.1
- no-forward-refs: No forward version references found
- brd-counts: 65/397/3147 (matches expected)
```

### 2.4 DB Reality (Pristine Gates)

```
=== POSTGRES ===
BRD: epics=65, stories=397, acs=3147 (PASS)
Entities: 4309, Relationships: 4303
Evidence anchors: 0 bad

=== NEO4J ===
Nodes: 4309, Edges: 4303
Parity: PASS
```

---

## 3. Drift Findings

### Category A: BRD Counts + Version References

| File | Line | Issue |
|------|------|-------|
| PROMPTS.md | 584 | `65/351/2849` |
| A2_RELATIONSHIP_REGISTRY.md | 637,647,702 | `351`, `2849` |
| A1_ENTITY_REGISTRY.md | 697,789 | `2849`, `351` |
| A4_STRUCTURAL_ANALYSIS.md | 439 | `2980` |
| A5_GRAPH_API_V1.md | 568 | `351` |
| All story cards | headers | `BRD V20.6.3` |
| ENTRY.md | 117 | `BRD V20.6.3` |

### Category B: Ledger/Corpus Paths

| File | Line | Issue |
|------|------|-------|
| ENTRY.md | 252 | `semantic-corpus/signals.jsonl` |
| PROMPTS.md | 305 | `shadow-ledger/ledger.jsonl` |
| A1_ENTITY_REGISTRY.md | 352,414,729,754,757 | Non-scoped paths |
| A1_ENTITY_REGISTRY.md | 342 | `DELETE` op in LedgerEntry |

### Category C: HGR-1 / EXIT Coherence

| File | Issue |
|------|-------|
| EXIT.md L76 | "All 21 Track A relationship types extractable" (incorrect) |
| HUMAN_GATE_HGR-1.md | Placeholder values "(record actual value)" |

### Category D: Pipeline + Relationship Codes

| File | Issue |
|------|-------|
| PROMPTS.md L451 | `src/api/v1/pipeline.ts` |
| A4 L578 | `src/api/v1/pipeline.ts` in file list |
| A4 L213,291 | `PIPELINE_START`/`PIPELINE_COMPLETE` ops |
| A4 L105-106 | Phantom codes R40-R45, R60-R61 |

### Category E: UVS Version Parity

| Location | Value |
|----------|-------|
| Filename | V20_6_6.md |
| Header | 20.6.6 |
| SANITY_SUITE expected | 20.6.5 (wrong) |
| ORGAN_VERSIONING_RULES | V20.6.5 (wrong) |
| GOVERNANCE_PHASED_PLAN | V20.6.5 (wrong) |

---

## 4. Fixes Applied

### Category A

- PROMPTS.md: `65/351/2849` → `65/397/3147`
- A2: `351` → `397`, `2849` → `3147`
- A1: `2849` → `3147`, `351` → `397`
- A4: `2980` → `3147`
- A5: `351` → `397`
- All story cards: `BRD V20.6.3` → `BRD V20.6.4`

### Category B

- ENTRY.md: `semantic-corpus/signals.jsonl` → `semantic-corpus/{project_id}/signals.jsonl`
- PROMPTS.md: `shadow-ledger/ledger.jsonl` → `shadow-ledger/{project_id}/ledger.jsonl`
- A1: All paths updated to project-scoped format
- A1: `DELETE` → `DECISION` in LedgerEntry type

### Category C

- EXIT.md: "All 21 types extractable" → "HGR-1 requires A1-A3 relationships only"
- EXIT.md: Version bump 1.5.4 → 1.5.5
- HUMAN_GATE_HGR-1.md: Filled baseline SHA/hash values

### Category D

- PROMPTS.md: `src/api/v1/pipeline.ts` → `src/ops/pipeline.ts (internal)`
- A4: Removed `src/api/v1/pipeline.ts` from file list
- A4: `PIPELINE_START`/`PIPELINE_COMPLETE` → DECISION entries
- A4: `R40-R45, R60-R61` → `R36/R37, R63/R67/R70`
- A4: Version bump 2.0.0 → 2.1.0

### Category E

- SANITY_SUITE.md: `expected: '20.6.5'` → `expected: '20.6.6'`
- SANITY_SUITE.md: `V20.6.5` → `V20.6.6` (3 occurrences)
- All story cards: `Verification Spec V20.6.5` → `V20.6.6`
- ORGAN_VERSIONING_RULES.md: `V20.6.5` → `V20.6.6`
- GOVERNANCE_PHASED_PLAN.md: `V20.6.5` → `V20.6.6`
- CID_LOG.md: Added CID-2025-004

---

## 5. Post-Fix Verification

### 5.1 Final Sanity Tests

```
Test Files  10 passed (10)
Tests  66 passed (66)
```

### 5.2 Final Full Tests

```
Test Files  29 passed (29)
Tests  256 passed (256)
```

### 5.3 Final Organ Parity

```
PASS: 11 checks passed
Summary: 11 pass, 0 warn, 0 fail
```

---

## 6. Commits

| Commit | Category | Description |
|--------|----------|-------------|
| `743e5a9` | A | BRD count and version corrections |
| (merged) | B | Ledger/corpus path and schema fixes (included in A) |
| `3f9fd16` | C | HGR-1 scope and EXIT coherence |
| (merged) | D | Pipeline boundary + relationship code fixes (included in A) |
| `0fb1cf0` | E | UVS version parity (CID-2025-004) |
| `9328055` | — | Add stabilization packet |

---

## 7. Final Decision

**Status:** PASS

**Result:** Pre-A4 stabilization complete. All drift eliminated. Proceed to A4 implementation.

---

**END OF PRE_A4_STABILIZATION_PACKET**

