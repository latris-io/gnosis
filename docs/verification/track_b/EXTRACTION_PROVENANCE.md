# Track B Extraction Provenance

**Purpose:** Capture the exact extraction/derivation commands and outputs used to build the graph state for B.1 verification and future closure (B.4).

---

## Extraction Command

```bash
PROJECT_ID=6df2f456-440d-4958-b475-d9808775ff69 npx tsx scripts/run-a1-extraction.ts
```

---

## Last Extraction Run

**Timestamp:** 2026-01-03T00:06:19.402Z  
**Project ID:** 6df2f456-440d-4958-b475-d9808775ff69  
**Repo Root:** `/Users/martybremer/Library/CloudStorage/OneDrive-Latris/Projects/Sophia/Gnosis`

---

## Provider Execution

| Provider | Entities | Types | Duration |
|----------|----------|-------|----------|
| brd-provider | 3609 | E01:65, E02:397, E03:3147 | 204ms |
| filesystem-provider | 99 | E06:3, E11:62, E27:34 | 17ms |
| ast-provider | 672 | E08:4, E12:231, E13:16, E28:123, E29:298 | 111ms |
| git-provider | 209 | E49:10, E50:199 | 49ms |
| changeset-provider | 3 | E52:3 | 14ms |

---

## Persistence Results

| Metric | Count |
|--------|-------|
| Total extracted | 4592 |
| Created | 0 |
| Updated | 101 |
| No-Op | 4491 |

---

## E15 Module Derivation

| Metric | Count |
|--------|-------|
| Derived | 21 |
| Persisted | 0 |
| Synced | 4640 |

---

## Containment Relationships (R04-R07, R16)

| Relationship | Extracted | Persisted |
|--------------|-----------|-----------|
| R04 | 62 | 62 |
| R05 | 248 | 0 |
| R06 | 122 | 1 |
| R07 | 300 | 0 |
| R16 | 248 | 0 |

---

## Entity Breakdown

| Entity Type | Count |
|-------------|-------|
| E01 Epic | 65 |
| E02 Story | 397 |
| E03 AcceptanceCriterion | 3147 |
| E06 TechnicalDesign | 3 |
| E08 DataSchema | 4 |
| E11 SourceFile | 62 |
| E12 Function | 231 |
| E13 Class | 16 |
| E27 TestFile | 34 |
| E28 TestSuite | 123 |
| E29 TestCase | 298 |
| E49 ReleaseVersion | 10 |
| E50 Commit | 199 |
| E52 Changeset | 3 |

---

## Semantic Signals

| Metric | Count |
|--------|-------|
| Captured | 1,245,191 |
| Target | ≥ 50 |

---

## CI Determinism

The CI workflow (`.github/workflows/organ-parity.yml`) runs this extraction command **before** `npm test` to ensure deterministic graph state:

```yaml
- name: Prepare graph state (extraction + derivations)
  run: npx tsx scripts/run-a1-extraction.ts

- name: Run test suite
  run: npm test
```

---

## Closure Relevance (B.4)

This provenance artifact establishes:

1. **What was run:** Exact command and script version
2. **When:** Timestamp of extraction
3. **What was produced:** Entity counts by type, relationship derivations
4. **Idempotency evidence:** High NO-OP count (4491) indicates stable graph state

For B.4 closure verification, compare this baseline against re-extraction output to confirm zero drift.

