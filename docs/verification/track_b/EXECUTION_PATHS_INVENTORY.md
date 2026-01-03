# Execution Paths Inventory

**Generated:** 2026-01-03T05:30:00Z  
**Updated:** 2026-01-03T06:30:00Z (Governance hardening implemented)  
**Purpose:** Identify all state-mutating execution entrypoints and determine canonicalization/provenance requirements  
**Scope:** `scripts/**` directory  
**Status:** Governance Controls Implemented

---

## Executive Summary

### Top Findings

1. **71 total scripts** exist under `scripts/` (including subdirectories)
2. **scripts/** is excluded from E11 extraction by design (`filesystem-provider.ts` only extracts `src/**/*.ts`)
3. **23 scripts** directly import from `src/ops/**` (state-mutating capability)
4. **1 canonical CI entrypoint** exists: `scripts/run-a1-extraction.ts` (invoked by `organ-parity.yml`)
5. **10 scripts** have `@g-api-exception` markers (skipped by boundary checker)
6. **Multiple competing extraction entrypoints** exist (genesis-extract, continue-extract, run-a1-extraction)

### Key Risks (MITIGATED)

| Risk | Description | Severity | Mitigation Status |
|------|-------------|----------|-------------------|
| Multiple extraction paths | 3+ scripts can build graph state with different sequences | HIGH | ✅ Legacy scripts deprecated, require `--confirm-repair` |
| No provenance for repair scripts | `scripts/repair/**` can mutate state without mandatory artifacts | MEDIUM | ✅ All emit evidence artifacts |
| si-readiness scripts are legacy | Many have `@ts-nocheck` and bypass current governance | MEDIUM | ✅ All require `--confirm-repair`, marked DEPRECATED |
| Hardcoded PROJECT_IDs | Some repair scripts hardcode canonical project ID | LOW | ✅ All use `resolveProjectId()` from env/flag |

### Governance Controls Implemented

| Control | Implementation | Status |
|---------|---------------|--------|
| Operator intent gating | `--confirm-repair` flag required for all Tier 2 scripts | ✅ Implemented |
| Evidence artifacts | Before/after state snapshots written to `operator_runs/` | ✅ Implemented |
| Project ID resolution | Env var or `--project-id` flag required | ✅ Implemented |
| Shared utilities | `scripts/_lib/operator-guard.ts`, `state-snapshot.ts` | ✅ Created |
| Allowlist documentation | `OPERATOR_SCRIPTS_ALLOWLIST.md` | ✅ Created |

---

## Part A: Graph-Based Discovery

### E11 SourceFile Coverage for scripts/**

**Finding:** `scripts/**` are excluded from E11 extraction by design; the filesystem provider includes `src/**/*.ts` (and does not include `scripts/`).

Evidence from `src/extraction/providers/filesystem-provider.ts:145`:
```typescript
const files = await glob('src/**/*.ts', { cwd: rootPath, nodir: true });
```

This is intentional — scripts are operational tooling, not canonical source artifacts.

**Graph query result:** 0 E11 entities under `FILE-scripts/**`

### State-Mutation Sinks in Graph

The following E12 Function entities represent persistence/sync operations:

| Function | File (E11) | Operation |
|----------|------------|-----------|
| `persistEntities` | `FILE-src/ops/track-a.ts` | Writes entities to PG |
| `persistRelationshipsAndSync` | `FILE-src/ops/track-a.ts` | Writes rels to PG + Neo4j |
| `syncToNeo4j` | `FILE-src/ops/track-a.ts` | Syncs entities PG → Neo4j |
| `replaceAllRelationshipsInNeo4j` | `FILE-src/ops/track-a.ts` | Replaces rels in Neo4j |
| `extractAndPersistModules` | `FILE-src/ops/track-a.ts` | Derives + persists E15 |
| `extractAndPersistContainmentRelationships` | `FILE-src/ops/track-a.ts` | Derives + persists R04-R07 |

**Limitation:** Graph lacks complete CALLS edges from scripts to ops layer (scripts are not E11 entities).

---

## Part B: Source-Code Discovery

### All Scripts Under `scripts/`

| # | Script | Location |
|---|--------|----------|
| 1 | a3-data-purity-audit.ts | scripts/ |
| 2 | a3-evidence.ts | scripts/ |
| 3 | a3-replay-gate.ts | scripts/ |
| 4 | a4-canonical-evidence.ts | scripts/ |
| 5 | a4-parity-proof.ts | scripts/ |
| 6 | audit-counts.ts | scripts/ |
| 7 | audit-pillars.ts | scripts/ |
| 8 | brd-registry.ts | scripts/ |
| 9 | calibrate-tdds.ts | scripts/ |
| 10 | check-brd-counts.ts | scripts/ |
| 11 | check-constraints.ts | scripts/ |
| 12 | check-db-role.ts | scripts/ |
| 13 | check-r18-r19-parity.ts | scripts/ |
| 14 | check-test-entities.ts | scripts/ |
| 15 | determinism-check.ts | scripts/ |
| 16 | extract-test-relationships.ts | scripts/ |
| 17 | fix-e15-extraction.ts | scripts/ |
| 18 | ground-truth.ts | scripts/ |
| 19 | migrate-ledger-to-project-scope.ts | scripts/ |
| 20 | pre-phase2-check.ts | scripts/ |
| 21 | pristine-gate-neo4j.ts | scripts/ |
| 22 | pristine-gate-postgres.ts | scripts/ |
| 23 | rebuild-a3-pristine.ts | scripts/ |
| 24 | register-track-b-tdds.ts | scripts/ |
| 25 | run-a1-extraction.ts | scripts/ |
| 26 | run-foundation-validation.ts | scripts/ |
| 27 | setup-project.ts | scripts/ |
| 28 | sync-relationships-replace.ts | scripts/ |
| 29 | sync-relationships-to-neo4j.ts | scripts/ |
| 30 | sync-to-neo4j.ts | scripts/ |
| 31 | test-epoch-ledger.ts | scripts/ |
| 32 | test-r36-r37.ts | scripts/ |
| 33 | validate-a1-exit.ts | scripts/ |
| 34 | validate-a2-exit.ts | scripts/ |
| 35 | verify-cid-for-organ-changes.ts | scripts/ |
| 36 | verify-cross-store.ts | scripts/ |
| 37 | verify-infrastructure.ts | scripts/ |
| 38 | verify-organ-parity.ts | scripts/ |
| 39 | verify-scripts-boundary.ts | scripts/ |
| 40 | verify-self-ingestion.ts | scripts/ |
| 41 | verify-track-a-entry.ts | scripts/ |
| 42 | verify-track-a-lock.ts | scripts/ |
| 43 | verify-track-b-b1-b2-completeness.ts | scripts/ |
| 44-50 | repair/*.ts | scripts/repair/ |
| 51-66 | si-readiness/*.ts | scripts/si-readiness/ |
| 67-71 | verification/*.ts | scripts/verification/ |

**Total: 71 TypeScript scripts**

### Scripts Importing from `src/ops/**`

```bash
grep -rl "src/ops/" scripts/
```

| Script | Ops Functions Used |
|--------|-------------------|
| run-a1-extraction.ts | persistEntities, extractAndPersistModules, extractAndPersistContainmentRelationships |
| register-track-b-tdds.ts | persistEntities, persistRelationshipsAndSync |
| calibrate-tdds.ts | persistEntities |
| sync-to-neo4j.ts | syncToNeo4j |
| sync-relationships-to-neo4j.ts | replaceAllRelationshipsInNeo4j, syncToNeo4j |
| sync-relationships-replace.ts | replaceAllRelationshipsInNeo4j, verifyNeo4jParity |
| fix-e15-extraction.ts | extractAndPersistModules, deleteR04Relationships, deleteE15ByInstanceIds |
| rebuild-a3-pristine.ts | extractAndPersistMarkerRelationships, extractAndPersistTestRelationships |
| setup-project.ts | initProject |
| a3-replay-gate.ts | (indirect via ops) |
| si-readiness/genesis-extract.ts | persistEntities, persistRelationshipsAndSync, syncToNeo4j, replaceAllRelationshipsInNeo4j |
| si-readiness/continue-extract.ts | persistEntities, extractAndPersist*, syncToNeo4j |
| si-readiness/extract-relationships.ts | syncRelationshipsToNeo4j |
| si-readiness/finish-extract.ts | syncRelationshipsToNeo4j |
| repair/backfill-missing-brd-acs.ts | persistEntities, persistRelationships |
| repair/sync-neo4j.ts | syncToNeo4j, replaceAllRelationshipsInNeo4j |

---

## Part C: Tier Classification

### Tier 1 — Canonical State Constructors

Scripts that **must** run to build baseline graph state for CI/closure.

| Script | Purpose | Mutates | Canonical? | Provenance? |
|--------|---------|---------|------------|-------------|
| **run-a1-extraction.ts** | Full entity extraction + derivations | PG + Neo4j | ✅ YES (CI blessed) | ✅ Provenance via Track B extraction provenance artifact (no formal epoch object yet) |
| register-track-b-tdds.ts | Track B TDD E06 + R14 registration | PG + Neo4j | ✅ YES (Track B blessed) | ✅ Evidence artifact |
| setup-project.ts | Create project record | PG | ✅ YES | ❌ None |

**run-a1-extraction.ts Analysis:**
- **Is there exactly one blessed entrypoint?** YES — This is the only script invoked by CI (organ-parity.yml line 82).
- **Competing entrypoints:** genesis-extract.ts and continue-extract.ts exist but are marked `LEGACY_SCAN_OK` and not CI-integrated.
- **Risk:** Low — CI discipline enforced.

**register-track-b-tdds.ts Analysis:**
- Track B-owned, creates E06 + R14 for story cards
- Writes evidence to `docs/verification/track_b/TDD_REGISTRY_VERIFICATION.md`
- No competing entrypoint

### Tier 2 — Maintenance / Repair / Migration

Scripts that perform targeted mutations but are NOT baseline constructors.

| Script | Purpose | Mutates | Confirm Flag | Evidence | PROJECT_ID |
|--------|---------|---------|--------------|----------|------------|
| fix-e15-extraction.ts | Remediate E15 module issues | PG + Neo4j | ✅ Required | ✅ Written | ✅ Env/flag |
| rebuild-a3-pristine.ts | Rebuild A3 marker extraction | PG + ledger | ✅ Required | ✅ Written | ✅ Env/flag |
| sync-to-neo4j.ts | Sync entities to Neo4j | Neo4j | ✅ Required | ✅ Written | ✅ Env/flag |
| sync-relationships-to-neo4j.ts | Sync rels to Neo4j | Neo4j | ✅ Required | ✅ Written | ✅ Env/flag |
| sync-relationships-replace.ts | Replace-sync rels to Neo4j | Neo4j | ✅ Required | ✅ Written | ✅ Env/flag |
| migrate-ledger-to-project-scope.ts | Migrate ledger structure | Filesystem | ❌ Not required | ✅ Written | ✅ Env/flag |
| repair/backfill-missing-brd-acs.ts | Backfill missing E03/R02 | PG | ✅ Required | ✅ Written | ✅ Env/flag |
| repair/sync-neo4j.ts | Repair Neo4j sync | Neo4j | ✅ Required | ✅ Written | ✅ Env/flag |
| calibrate-tdds.ts | TDD validation + E08 seeding | PG | ✅ Required (if SEED_E08=true) | ✅ Written | ✅ Env/flag |

#### Legacy Scripts (DEPRECATED)

| Script | Purpose | Confirm Flag | Evidence | Status |
|--------|---------|--------------|----------|--------|
| si-readiness/genesis-extract.ts | Legacy full extraction | ✅ Required | ✅ Written | ⚠️ DEPRECATED |
| si-readiness/continue-extract.ts | Continue aborted extraction | ✅ Required | ✅ Written | ⚠️ DEPRECATED |
| si-readiness/extract-relationships.ts | Extract relationships | ✅ Required | ✅ Written | ⚠️ DEPRECATED |
| si-readiness/extract-remaining.ts | Extract remaining rels | ✅ Required | ✅ Written | ⚠️ DEPRECATED |
| si-readiness/finish-extract.ts | Finish extraction | ✅ Required | ✅ Written | ⚠️ DEPRECATED |

**Note:** While these legacy scripts now emit evidence artifacts to `operator_runs/`, they are superseded by `scripts/run-a1-extraction.ts` which should be preferred for all new extractions.

**Governance Controls Implemented:**
1. ✅ All scripts require `--confirm-repair` flag (except filesystem-only migrations)
2. ✅ All scripts emit evidence artifacts to `docs/verification/track_b/operator_runs/`
3. ✅ All scripts use `resolveProjectId()` — no hardcoded PROJECT_IDs

**Closure Baseline Rule:**
Any Tier 2 evidence artifact must include the git SHA and be stored under `operator_runs/`. Closure baselines must reference the most recent operator evidence if any exists since the last baseline. This ensures closure is honest about operator changes between baselines.

### Tier 3 — Read-Only Diagnostics

Scripts that perform NO writes — safe to run ad-hoc.

| Script | Purpose |
|--------|---------|
| verify-organ-parity.ts | Check organ doc consistency |
| verify-scripts-boundary.ts | Check G-API boundary compliance |
| verify-track-a-lock.ts | Check Track A lock enforcement |
| verify-track-a-entry.ts | Verify Track A entry criteria |
| verify-cross-store.ts | Check PG ↔ Neo4j parity |
| verify-self-ingestion.ts | Verify extraction correctness |
| verify-track-b-b1-b2-completeness.ts | B.1+B.2 completeness check |
| verify-cid-for-organ-changes.ts | Check CID for organ changes |
| check-brd-counts.ts | Verify BRD counts |
| check-constraints.ts | Check DB constraints |
| check-r18-r19-parity.ts | Check R18/R19 counts |
| audit-counts.ts | Count audit |
| audit-pillars.ts | Pillar audit |
| pristine-gate-postgres.ts | Postgres pristine gate |
| pristine-gate-neo4j.ts | Neo4j pristine gate |
| a4-parity-proof.ts | A4 parity proof |
| verification/*.ts | All verification readers/reconcilers |
| ground-truth.ts (check command) | Health check (read-only) |
| brd-registry.ts (check/gate commands) | Registry check (read-only) |

---

## Part D: CI & Workflow Integration

### Current CI Configuration

**File:** `.github/workflows/organ-parity.yml`

```yaml
# Key steps (in order):

# 1) Track A lock enforcement
- name: Enforce Track A lock (CID-gated)
  run: npx tsx scripts/verify-track-a-lock.ts

# 2) Organ document parity
- name: Verify organ document parity
  run: npm run verify:organ-parity

# 3) CID enforcement
- name: Verify CID for organ doc changes
  run: npx tsx scripts/verify-cid-for-organ-changes.ts

# 4) Scripts boundary
- name: Verify G-API scripts boundary
  run: npm run verify:scripts-boundary

# 5) Graph state preparation (THE CANONICAL EXTRACTION)
- name: Prepare graph state (extraction + derivations)
  run: npx tsx scripts/run-a1-extraction.ts

# 6) Test suite
- name: Run test suite
  run: npm test
```

### CI Observations

1. **Single canonical extraction entrypoint:** `scripts/run-a1-extraction.ts` (line 82)
2. **Graph prepared before tests:** Extraction runs before `npm test`
3. **No explicit provenance artifact:** CI does not capture epoch/SHA for extraction run
4. **No closure gate:** CI does not verify snapshot matches expected state

---

## Part E: @g-api-exception Usage

### Scripts With Exception Markers

```bash
grep -rl "@g-api-exception" scripts/
```

| Script | Exception Reason |
|--------|------------------|
| verify-track-b-b1-b2-completeness.ts | VERIFICATION_SCRIPT — Read-only service access for parity |
| ground-truth.ts | TRACK_B_OWNED — Track B service consumption |
| brd-registry.ts | TRACK_B_OWNED — Track B service consumption |
| pristine-gate-postgres.ts | AUDIT_SCRIPT — Direct DB for verification |
| pristine-gate-neo4j.ts | AUDIT_SCRIPT — Direct DB for verification |
| pre-phase2-check.ts | LEGACY_VERIFICATION_SCRIPT |
| a4-parity-proof.ts | Direct — DB access for evidence |
| a4-canonical-evidence.ts | Direct — DB access for evidence |
| verification/a1-a4-coverage-report.ts | Direct — DB access for coverage |

**Pattern:** Exceptions are used for:
1. Read-only verification scripts requiring service/DB access
2. Track B-owned scripts consuming Track B services
3. Legacy scripts awaiting governance upgrade

---

## Part F: Recommendations Status

### Priority 1 — Canonicalization

| Recommendation | Status | Notes |
|----------------|--------|-------|
| **R1:** Document `run-a1-extraction.ts` as the blessed extraction entrypoint | ✅ Done | See `OPERATOR_SCRIPTS_ALLOWLIST.md` |
| **R2:** Add extraction provenance artifact to CI | ⏳ Pending | Future Track B work |
| **R3:** Deprecate si-readiness scripts | ✅ Done | All marked DEPRECATED, require `--confirm-repair` |

### Priority 2 — Repair Script Governance

| Recommendation | Status | Notes |
|----------------|--------|-------|
| **R4:** Require `--confirm-repair` flag for repair scripts | ✅ Done | All Tier 2 scripts updated |
| **R5:** Emit before/after evidence for all Tier 2 scripts | ✅ Done | Evidence to `operator_runs/` |
| **R6:** Remove hardcoded PROJECT_IDs from repair scripts | ✅ Done | All use `resolveProjectId()` |

### Priority 3 — Future Cleanup

| Recommendation | Status | Notes |
|----------------|--------|-------|
| **R7:** Move `@ts-nocheck` scripts to strict TypeScript | ⏳ Pending | Low priority |
| **R8:** Consider archiving si-readiness/ once no longer needed | ⏳ Pending | Low priority |
| **R9:** Create operator allowlist | ✅ Done | `OPERATOR_SCRIPTS_ALLOWLIST.md` |

---

## Appendix A: Governance Hardening Changes (2026-01-03)

This section documents the exact changes made to each file during the Tier 2 governance hardening.

### New Files Created

#### `scripts/_lib/operator-guard.ts` (231 lines)

**Purpose:** Shared utilities for operator confirmation and evidence generation.

**Functions Provided:**
- `parseArgs(argv)` — Lightweight CLI arg parser (no external deps)
- `requireConfirmRepair(scriptName)` — Exits if `--confirm-repair` flag missing
- `resolveProjectId()` — Resolves `PROJECT_ID` from env or `--project-id` flag
- `getGitSha()` / `getGitShortSha()` — Git commit SHA utilities
- `getNodeVersion()` — Node.js version
- `getEnvironmentFingerprint()` — Environment metadata object
- `createEvidence(scriptName, projectId)` — Initialize evidence artifact
- `formatEvidenceMarkdown(evidence)` — Render evidence as markdown
- `writeEvidenceMarkdown(evidence)` — Write to `operator_runs/` directory

**Types Exported:**
- `EvidenceArtifact` — Full evidence structure
- `StateSnapshot` — Before/after state counts

---

#### `scripts/_lib/state-snapshot.ts` (96 lines)

**Purpose:** Capture entity/relationship counts from PostgreSQL and Neo4j.

**Functions Provided:**
- `captureStateSnapshot(projectId)` — Returns PG + Neo4j counts
- `capturePostgresCounts(projectId)` — Query entities/relationships count from PG
- `captureNeo4jCounts(projectId)` — Query entities/relationships count from Neo4j
- `formatSnapshot(snapshot)` — Human-readable snapshot string

**Behavior:**
- Sets RLS context via `set_config('app.current_project_id', $1, false)`
- Handles connection errors gracefully (records error, doesn't crash)

---

#### `docs/verification/track_b/OPERATOR_SCRIPTS_ALLOWLIST.md`

**Purpose:** Authoritative list of approved Tier 2 scripts and their governance requirements.

**Sections:**
- Overview of key principles
- Tables for repair, sync, maintenance, migration, and legacy scripts
- Usage examples with correct/incorrect invocations
- Evidence artifact format specification

---

#### `docs/verification/track_b/operator_runs/.gitkeep`

**Purpose:** Placeholder to ensure evidence output directory is tracked in git.

---

### Modified Files

#### `scripts/repair/sync-neo4j.ts`

**Changes:**
1. Added JSDoc header with Tier 2 classification
2. Added `requireConfirmRepair()` guard at script start
3. Added `resolveProjectId()` instead of hardcoded ID
4. Added `createEvidence()` + `captureStateSnapshot()` calls for before/after
5. Added `writeEvidenceMarkdown()` in finally block
6. Wrapped main logic in try/catch to capture errors in evidence

**Before:** 29 lines, hardcoded `projectId = '6df2f456-...'`  
**After:** 74 lines, parameterized with evidence

---

#### `scripts/repair/backfill-missing-brd-acs.ts`

**Changes:**
1. Added JSDoc header with Tier 2 classification
2. Added `requireConfirmRepair()` guard
3. Replaced hardcoded `projectId` with `resolveProjectId()`
4. Added evidence artifact generation with before/after snapshots
5. Updated ledger path to use project-scoped path: `shadow-ledger/${projectId}/ledger.jsonl`
6. Added graceful handling for missing detection report
7. Added `closeConnections()` in finally block

**Before:** 297 lines, hardcoded project ID  
**After:** 307 lines, parameterized with evidence

---

#### `scripts/sync-to-neo4j.ts`

**Changes:**
1. Updated JSDoc header with Tier 2 classification
2. Added `requireConfirmRepair()` guard
3. Added `resolveProjectId()` for project ID resolution
4. Added evidence artifact with before/after state snapshots
5. Removed `PROJECT_SLUG` support (simplified to PROJECT_ID only)

**Before:** 69 lines  
**After:** 72 lines

---

#### `scripts/sync-relationships-to-neo4j.ts`

**Changes:**
1. Added JSDoc header with Tier 2 classification
2. Added `requireConfirmRepair()` guard
3. Added evidence artifact generation
4. Added before/after state snapshots

**Before:** 36 lines  
**After:** 72 lines

---

#### `scripts/sync-relationships-replace.ts`

**Changes:**
1. Added JSDoc header with Tier 2 classification  
2. Added `requireConfirmRepair()` guard
3. Added evidence artifact with before/after snapshots
4. Removed implicit PROJECT_SLUG fallback (explicit PROJECT_ID required)

**Before:** 89 lines  
**After:** 121 lines

---

#### `scripts/fix-e15-extraction.ts`

**Changes:**
1. Updated JSDoc header with Tier 2 classification
2. Added `requireConfirmRepair()` guard
3. Added `resolveProjectId()` call (was already using env var but now enforced)
4. Added evidence artifact with before/after snapshots
5. Removed `queryEntities` import (not used)

**Before:** 163 lines  
**After:** 174 lines

---

#### `scripts/rebuild-a3-pristine.ts`

**Changes:**
1. Updated JSDoc header with Tier 2 classification
2. Added `requireConfirmRepair()` guard
3. Added `resolveProjectId()` call
4. Added evidence artifact generation
5. Refactored `validateLedgerPristine()` and `validateCorpusPristine()` to accept `projectId` parameter
6. Removed unused `getCurrentEpoch` import

**Before:** 401 lines  
**After:** 366 lines (reduced due to function refactoring)

---

#### `scripts/calibrate-tdds.ts`

**Changes:**
1. Updated JSDoc header with Tier 2 classification
2. Added conditional `requireConfirmRepair()` — only required if `SEED_E08=true`
3. Replaced manual PROJECT_ID check with `resolveProjectId()`
4. Added evidence artifact generation (only when `SEED_E08=true`)
5. Added before/after state snapshots when in seeding mode

**Before:** 474 lines  
**After:** 498 lines

---

#### `scripts/migrate-ledger-to-project-scope.ts`

**Changes:**
1. Updated JSDoc header with Tier 2 classification (filesystem-only)
2. Added `resolveProjectId()` call instead of hardcoded CANONICAL_PROJECT_ID
3. Added evidence artifact generation (no `--confirm-repair` required for filesystem-only)
4. Refactored `migrateLedger()` and `migrateCorpus()` to accept `projectId` and `evidence` parameters

**Before:** 213 lines  
**After:** 218 lines

---

#### `scripts/si-readiness/genesis-extract.ts`

**Changes:**
1. Updated JSDoc header marking as DEPRECATED (superseded by `run-a1-extraction.ts`)
2. Added `requireConfirmRepair()` guard
3. Added full evidence artifact generation with before/after state snapshots
4. Added explicit PROJECT_ID validation (required via env or `.si-universe.env`)
5. Evidence written to `operator_runs/` even on failure

**Before:** No operator guard, no evidence  
**After:** Requires `--confirm-repair` flag, writes evidence artifact

---

#### `scripts/si-readiness/continue-extract.ts`

**Changes:**
1. Updated JSDoc header marking as DEPRECATED
2. Added `requireConfirmRepair()` guard
3. Added full evidence artifact generation with before/after state snapshots
4. Added graceful error handling for ledger/corpus file reads
5. Evidence written to `operator_runs/` even on failure

**Before:** No operator guard, no evidence  
**After:** Requires `--confirm-repair` flag, writes evidence artifact

---

#### `scripts/si-readiness/extract-relationships.ts`

**Changes:**
1. Updated JSDoc header marking as DEPRECATED
2. Added `requireConfirmRepair()` guard
3. Added full evidence artifact generation with before/after state snapshots
4. Evidence written to `operator_runs/` even on failure

**Before:** No operator guard, no evidence  
**After:** Requires `--confirm-repair` flag, writes evidence artifact

---

#### `scripts/si-readiness/extract-remaining.ts`

**Changes:**
1. Updated JSDoc header marking as DEPRECATED
2. Added `requireConfirmRepair()` guard
3. Added full evidence artifact generation with before/after state snapshots
4. Added `PARTIAL` status support for scripts with non-fatal errors
5. Evidence written to `operator_runs/` even on failure

**Before:** No operator guard, no evidence  
**After:** Requires `--confirm-repair` flag, writes evidence artifact

---

#### `scripts/si-readiness/finish-extract.ts`

**Changes:**
1. Updated JSDoc header marking as DEPRECATED
2. Added `requireConfirmRepair()` guard
3. Added full evidence artifact generation with before/after state snapshots
4. Added graceful error handling for ledger/corpus file reads
5. Evidence written to `operator_runs/` even on failure

**Before:** No operator guard, no evidence  
**After:** Requires `--confirm-repair` flag, writes evidence artifact

---

### Verification Results

All verifiers pass after changes:

```
✅ npm run verify:scripts-boundary — PASS (9 files skipped with @g-api-exception)
✅ npm run lint:markers — PASS (no structural violations)
✅ npx tsx scripts/verify-track-a-lock.ts — PASS (no locked surfaces changed)
✅ npm run test:sanity (with PROJECT_ID) — 66/66 tests pass
```

**Dry-Run Test Results:**

```bash
# Without --confirm-repair: FAILS FAST
$ PROJECT_ID=6df2f456-... npx tsx scripts/repair/sync-neo4j.ts
→ "OPERATOR CONFIRMATION REQUIRED" (exit 1)

# Without PROJECT_ID: FAILS FAST  
$ npx tsx scripts/repair/sync-neo4j.ts --confirm-repair
→ "PROJECT_ID REQUIRED" (exit 1)
```

---

## Appendix B: Key Script Details

### run-a1-extraction.ts (Tier 1 — CANONICAL)

**Location:** `scripts/run-a1-extraction.ts`  
**Lines:** 358  
**Markers:** `@implements STORY-64.1`, `@satisfies AC-64.1.*`

**Purpose:** Orchestrates full Track A entity extraction + E15 derivation + R04-R07 containment relationships.

**Mutates:**
- Entities: E01-E52 (all Track A entity types) → PostgreSQL
- Relationships: R04-R07, R16 (containment) → PostgreSQL
- Sync: Entities + relationships → Neo4j

**Prerequisites:**
- `PROJECT_ID` env var
- Database connections (PG + Neo4j)
- Repository at extraction root

**Invoked by CI:** YES (organ-parity.yml line 82)

---

### register-track-b-tdds.ts (Tier 1 — Track B)

**Location:** `scripts/register-track-b-tdds.ts`  
**Lines:** 580  
**Markers:** None (Track B)

**Purpose:** Parses Track B story cards and registers them as E06 TechnicalDesign nodes with R14 IMPLEMENTED_BY edges.

**Mutates:**
- Entities: E06 (TDD-TRACKB-B*) → PostgreSQL
- Relationships: R14 → PostgreSQL + Neo4j

**Prerequisites:**
- `PROJECT_ID` env var
- Track B story cards in `spec/track_b/stories/`

**Evidence:** Writes to `docs/verification/track_b/TDD_REGISTRY_VERIFICATION.md`

---

## Conclusion

The execution paths inventory reveals a **well-governed** system with the following controls:

1. ✅ **CI is canonicalized** — `run-a1-extraction.ts` is the single blessed entrypoint
2. ✅ **Repair scripts require confirmation** — `--confirm-repair` flag prevents accidental mutation
3. ✅ **Evidence artifacts are mandatory** — All Tier 2 scripts emit before/after snapshots
4. ✅ **PROJECT_IDs are parameterized** — No hardcoded IDs, all use env var or flag
5. ✅ **Legacy scripts are deprecated** — si-readiness scripts require confirmation and are marked DEPRECATED
6. ✅ **Allowlist is documented** — `OPERATOR_SCRIPTS_ALLOWLIST.md` lists approved scripts

**Related Documents:**
- `docs/verification/track_b/OPERATOR_SCRIPTS_ALLOWLIST.md` — Approved Tier 2 scripts
- `scripts/_lib/operator-guard.ts` — Shared operator guard utilities
- `scripts/_lib/state-snapshot.ts` — State snapshot utilities

