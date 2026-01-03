# Track B Extraction Provenance

**Purpose:** Capture the exact extraction/derivation commands and outputs used to build the graph state for B.1 verification and future closure (B.4).

---

## Git State (Provenance Anchor)

| Field | Value |
|-------|-------|
| **Commit SHA** | `6f99cc330298b9bd9d076c9e995d668ae42d6e2c` |
| **Branch** | `main` |
| **Working Tree** | Clean (no uncommitted changes) |

```bash
$ git rev-parse HEAD
6f99cc330298b9bd9d076c9e995d668ae42d6e2c

$ git status --porcelain
# (empty - clean working tree)
```

---

## Environment Fingerprint

| Component | Version / Target |
|-----------|------------------|
| Node.js | v20.18.0 |
| npm | 10.8.2 |
| GOVERNANCE_PHASE | 1 |
| Database | Remote PostgreSQL (prod cluster via DATABASE_URL) |
| Neo4j | Remote AuraDB (prod instance via NEO4J_URL) |
| Project ID | `6df2f456-440d-4958-b475-d9808775ff69` |

**Note:** Database URLs are secrets; only cluster/instance type is recorded here for provenance.

---

## Extraction Command

```bash
PROJECT_ID=6df2f456-440d-4958-b475-d9808775ff69 npx tsx scripts/run-a1-extraction.ts
```

**This command covers steps 1–4 of the baseline definition:**
1. Entity extraction (providers)
2. E15 module derivation
3. Containment derivation (R04-R07, R16)
4. Track A TDD registry (via `tdd-frontmatter-provider`)

**Step 5 (Track B TDD registry) is executed separately:**
```bash
PROJECT_ID=6df2f456-440d-4958-b475-d9808775ff69 npx tsx scripts/register-track-b-tdds.ts
```

---

## Last Extraction Run

**Timestamp:** 2026-01-03T21:15:00.000Z  
**Project ID:** 6df2f456-440d-4958-b475-d9808775ff69  
**Repo Root:** `/Users/martybremer/Library/CloudStorage/OneDrive-Latris/Projects/Sophia/Gnosis`  
**Script SHA:** Covered by repo commit SHA above

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
| Total extracted | 4740 |
| Created | 0 |
| Updated | 132 |
| No-Op | 4608 |

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

## Entity Breakdown (Extraction-Produced)

| Entity Type | Count |
|-------------|-------|
| E01 Epic | 65 |
| E02 Story | 397 |
| E03 AcceptanceCriterion | 3147 |
| E06 TechnicalDesign | 3 |
| E08 DataSchema | 4 |
| E11 SourceFile | 93 |
| E12 Function | 320 |
| E13 Class | 18 |
| E27 TestFile | 34 |
| E28 TestSuite | 123 |
| E29 TestCase | 298 |
| E49 ReleaseVersion | 10 |
| E50 Commit | 225 |
| E52 Changeset | 3 |

---

## E06 Distinction: Extraction vs Registry

**Important for B.4 closure:** E06 entities come from two sources.

### Extraction-Produced E06 (filesystem-provider)

| Count | Source |
|-------|--------|
| 3 | `filesystem-provider` (from `spec/track_a/stories/*.md` TDD frontmatter) |

### Registry-Produced E06 (TDD registry scripts)

| Count | Source | IDs |
|-------|--------|-----|
| 5 | Track A TDDs | `TDD-A1-ENTITY-REGISTRY`, `TDD-A2-RELATIONSHIP-REGISTRY`, `TDD-A3-MARKER-EXTRACTION`, `TDD-A4-STRUCTURAL-ANALYSIS`, `TDD-A5-GRAPH-API-V1` |
| 7 | Track B TDDs | `TDD-TRACKB-B1` through `TDD-TRACKB-B7` |
| 4 | Other TDDs | `TDD-BRD_FORMAT_SPECIFICATION`, `TDD-LEDGER_COVERAGE_SPEC`, `TDD-UNIFIED_VERIFICATION_SPECIFICATION_V20_6_5`, `TDD-UNIFIED_VERIFICATION_SPECIFICATION_V20_6_6` |
| 7 | Legacy nodes | `DESIGN-TRACKB-B1` through `DESIGN-TRACKB-B7` (to be cleaned post-HGR-2) |

### Total E06 in Graph

| Metric | Count | Definition |
|--------|-------|------------|
| **E06 total** | 23 | All E06 entities in project |
| Canonical | 16 | `instance_id` matches `^TDD-` |
| Legacy | 7 | `instance_id` matches `^DESIGN-` |

**Note:** "Canonical" means `instance_id` starts with `TDD-`. Legacy `DESIGN-TRACKB-*` nodes exist from prior runs; future verifiers will ignore these. Cleanup deferred post-HGR-2.

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

## Baseline Definition (Critical for B.4)

**What "baseline" includes:**

| Step | Included | Command |
|------|----------|---------|
| 1. Entity extraction | ✅ | `run-a1-extraction.ts` (providers) |
| 2. E15 module derivation | ✅ | `run-a1-extraction.ts` (post-persist) |
| 3. Containment derivation (R04-R07, R16) | ✅ | `run-a1-extraction.ts` (post-persist) |
| 4. Track A TDD registry | ✅ | Included via `tdd-frontmatter-provider` |
| 5. Track B TDD registry | ✅ | `register-track-b-tdds.ts` (separate run) |
| 6. Neo4j sync | ✅ | Automatic after each step |

**Baseline state for B.4 closure comparison:**

```
Extraction + Derivations + TDD Registries = Full Baseline
```

---

## Closure Relevance (B.4)

This provenance artifact establishes:

1. **What was run:** Exact command and script version (covered by repo SHA)
2. **When:** Timestamp of extraction
3. **What was produced:** Entity counts by type, relationship derivations
4. **Idempotency evidence:** High NO-OP count (4491) indicates stable graph state
5. **E06 source distinction:** Extraction-produced vs registry-produced
6. **Baseline definition:** Full graph state includes all steps above

**For B.4 closure verification:**

1. Run extraction + derivations + registries on clean state
2. Compare entity/relationship counts against this baseline
3. Compare Merkle roots (from B.1 ground truth)
4. Confirm zero drift = closure PASS

