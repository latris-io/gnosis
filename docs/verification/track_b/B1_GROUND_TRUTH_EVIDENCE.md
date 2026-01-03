# B.1 Ground Truth Evidence

**Generated:** 2026-01-02T23:57:28.050Z  
**Project ID:** 6df2f456-440d-4958-b475-d9808775ff69

---

## Health Score

| Metric | Value |
|--------|-------|
| **Score** | 100 |
| **G-HEALTH Pass** | ✅ PASS |

---

## Merkle Root Comparison

| Field | Value |
|-------|-------|
| Expected Root | `d7b2f9e7e16a0ef80798f9bf6d1c292d9dc3f7727869defc1fd2b7c8954ed182` |
| Computed Root | `d7b2f9e7e16a0ef80798f9bf6d1c292d9dc3f7727869defc1fd2b7c8954ed182` |
| Match | ✅ |

---

## File Counts

| Metric | Count |
|--------|-------|
| Expected files | 159 |
| Actual files | 159 |

---

## Baseline vs Disk

| Category | Count |
|----------|-------|
| Missing paths | 0 |
| Extra paths | 0 |
| Hash mismatched | 0 |

---

## Graph Coverage

**Status:** ⏳ DEFERRED TO B.6 (Graph API v2)


**Why deferred:**
- Graph API v1 does not expose an entity listing endpoint
- Track B cannot modify Track A locked surfaces (`src/http/**`)
- Full graph coverage validation will be added in B.6 (Graph API v2)

**B.1 validates:**
- Merkle root integrity (baseline ↔ disk)
- File count consistency
- Scope version compatibility

**B.6 will add:**
- `/api/v2/entities` endpoint for E11 listing
- Full disk ↔ graph comparison


---

## Scope Definition

**Scope version:** B1-v1

**Included patterns:**
- `src/**`
- `spec/**`
- `scripts/**`
- `package.json`
- `package-lock.json`
- `tsconfig.json`

**Excluded patterns:**
- `**/node_modules/**`
- `**/.git/**`
- `**/dist/**`
- `**/build/**`
- `**/.next/**`
- `**/coverage/**`
- `**/.cache/**`
- `**/tmp/**`
- `**/docs/verification/**`
- `**/.DS_Store`
- `**/*.log`

---

## R14 Parity Check (PG ↔ Neo4j)

**TDD:** `TDD-TRACKB-B1`

| Store | R14 Count | Status |
|-------|-----------|--------|
| PostgreSQL | 7 | ✅ |
| Neo4j | 7 | ✅ |
| **Parity** | — | ✅ MATCH |

**Targets (both stores):**
- `FILE-src/services/track_b/ground-truth/file-scope.ts`
- `FILE-src/services/track_b/ground-truth/health.ts`
- `FILE-src/services/track_b/ground-truth/index.ts`
- `FILE-src/services/track_b/ground-truth/ledger.ts`
- `FILE-src/services/track_b/ground-truth/manifest.ts`
- `FILE-src/services/track_b/ground-truth/merkle.ts`
- `FILE-src/services/track_b/ground-truth/types.ts`

---

## Pre-Self-Ingestion Verification

| Check | Result |
|-------|--------|
| Determinism replay (same root across runs) | ✅ PASS |
| Change sensitivity (single file flips root) | ✅ PASS |
| Scope invariance (excluded files don't affect root) | ✅ PASS |
| Failure semantics (evidence always written) | ✅ PASS |
| R14 + E11 consistency (edges point to valid E11s) | ✅ PASS |
| R14 PG ↔ Neo4j parity | ✅ PASS |

---

## Ledger

Operations logged to: `docs/verification/track_b/ground-truth-ledger.jsonl`

---

## Commands Run

```bash
# Set baseline
npx tsx scripts/ground-truth.ts set-baseline

# Check health
PROJECT_ID=6df2f456-440d-4958-b475-d9808775ff69 npx tsx scripts/ground-truth.ts check
```
