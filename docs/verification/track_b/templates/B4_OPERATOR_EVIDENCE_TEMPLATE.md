# B.4 Closure Check Operator Evidence

**Run ID:** `B4-CLOSURE-<timestamp>`
**Generated:** <ISO-8601 timestamp>

---

## Required Bindings (MUST BE CONSTANT THROUGHOUT RUN)

| Field | Value | Verified |
|-------|-------|----------|
| **PROJECT_ID** | `6df2f456-440d-4958-b475-d9808775ff69` | [ ] |
| **GIT_SHA** | `<full commit sha>` | [ ] |
| **GIT_BRANCH** | `main` | [ ] |
| **WORKING_TREE_CLEAN** | `true` | [ ] |
| **GRAPH_API_V2_URL** | `http://localhost:3001` | [ ] |
| **GRAPH_API_URL** | `http://localhost:3000` (if used) | [ ] |

---

## Pre-Run Verification Checklist

| Check | Command | Status |
|-------|---------|--------|
| Git SHA captured | `git rev-parse HEAD` | [ ] |
| Working tree clean | `git status --porcelain` (empty) | [ ] |
| V2 server healthy | `curl $GRAPH_API_V2_URL/health` | [ ] |
| Pre-B4 preflight passed | `npx tsx scripts/preb4-preflight.ts` | [ ] |
| No concurrent writers | Operator attestation | [ ] |

---

## Operator Attestation

**I attest that:**

1. [ ] No other process is writing to the graph for PROJECT_ID during this run
2. [ ] The git SHA was constant throughout both ingestion phases
3. [ ] I did not modify any source files between Phase 1 and Phase 2
4. [ ] All environment variables remained constant throughout the run

**Operator:** _________________  
**Date:** _________________

---

## Run Phases

### Phase 1: Baseline Snapshot

| Metric | Value |
|--------|-------|
| Timestamp | <ISO-8601> |
| Snapshot ID | <snapshot-id> |
| Entity Count | <count> |
| Relationship Count | <count> |
| Entity Merkle Root | <hash> |
| Relationship Merkle Root | <hash> |

### Settle Window

**Duration:** 3 seconds (mandatory)  
**Reason:** Prevents "last write arrives after completion" drift

### Phase 2: Re-Ingestion + Snapshot

| Metric | Value |
|--------|-------|
| Timestamp | <ISO-8601> |
| Extraction Command | `npx tsx scripts/run-a1-extraction.ts` |
| Settle Window | 3 seconds |
| Snapshot ID | <snapshot-id> |
| Entity Count | <count> |
| Relationship Count | <count> |
| Entity Merkle Root | <hash> |
| Relationship Merkle Root | <hash> |

### Phase 3: Diff + Gate

| Metric | Value |
|--------|-------|
| Diff Command | `npx tsx scripts/drift.ts diff <phase1-id> <phase2-id>` |
| Total Drift Items | <count> |
| G-CLOSURE Result | PASS / FAIL |

---

## G-CLOSURE Gate Result

**Result:** `<PASS / FAIL>`

| Category | Added | Deleted | Mutated |
|----------|-------|---------|---------|
| Entities | 0 | 0 | 0 |
| Relationships | 0 | 0 | 0 |

**Unexpected Items:** 0  
**Allowed Items:** 0

---

## Ledger Entries

Logged to: `shadow-ledger/<project_id>/ledger.jsonl`

```json
{"track":"B","story":"B.4","action":"PRECONDITION_CHECK","..."}
{"track":"B","story":"B.4","action":"PHASE1_SNAPSHOT","..."}
{"track":"B","story":"B.4","action":"PHASE2_REINGESTION","..."}
{"track":"B","story":"B.4","action":"PHASE2_SNAPSHOT","..."}
{"track":"B","story":"B.4","action":"GATE_EVALUATED","..."}
```

---

## Failure Analysis (if applicable)

_Complete this section only if G-CLOSURE fails._

| Drift Item | Category | Type | Change | Instance ID |
|------------|----------|------|--------|-------------|
| 1 | entity/relationship | <type> | added/deleted/mutated | <id> |

**Root Cause:** _________________  
**Remediation:** _________________

---

## Evidence Artifacts

| Artifact | Path | SHA256 |
|----------|------|--------|
| Phase 1 Snapshot | `data/track_b/drift-detection/<id>.json` | <hash> |
| Phase 2 Snapshot | `data/track_b/drift-detection/<id>.json` | <hash> |
| This Evidence | `docs/verification/track_b/B4_CLOSURE_CHECK_EVIDENCE.md` | <hash> |

---

## Compliance Statement

All graph reads performed via HTTP Graph API v2 enumeration endpoints.
Re-ingestion performed via `src/ops/track-a.ts` (no direct DB access in B.4 code).
No modifications to Track A locked surfaces.

