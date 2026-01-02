# B.1 Ground Truth Evidence

**Generated:** 2026-01-02T22:31:25.139Z  
**Project ID:** 6df2f456-440d-4958-b475-d9808775ff69

---

## Verification Summary

| Verifier | Status | Notes |
|----------|--------|-------|
| `verify:organ-parity` | ✅ PASS | — |
| `verify:scripts-boundary` | ✅ PASS | `ground-truth.ts` skipped via `@g-api-exception TRACK_B_OWNED` |
| `lint:markers` | ✅ PASS | — |
| `verify-track-a-lock` | ✅ PASS | No Track A locked surfaces modified |
| G-HEALTH | ✅ PASS | Score: 100 (baseline ↔ disk) |

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
| Expected Root | `6f4bd324c7ba5aa289a2731f7c3fd7f37ebd8d558f13bef784260640fc78f0e0` |
| Computed Root | `6f4bd324c7ba5aa289a2731f7c3fd7f37ebd8d558f13bef784260640fc78f0e0` |
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

**Status:** ⏳ DEFERRED TO B.6 (Graph API v2) — per spec update

**Why deferred (governance-compliant decision):**

1. **Graph API v1 routes** (Track A locked surface `src/http/**`):
   - `GET /api/graph/:id/relationships` — requires entity ID, returns adjacent relationships
   - `POST /api/graph/traverse` — requires start_id, returns connected subgraph
   - **Neither can enumerate all E11 entities**

2. **Track A lock constraint:**
   - Adding `/api/v1/entities` would require modifying `src/http/routes/graph.ts`
   - `src/http/**` is a locked Track A surface per `verify-track-a-lock.ts`
   - Track B cannot modify locked surfaces without CID + `REOPEN_TRACK_A: true`

3. **Spec alignment:**
   - B.1 story card updated to clarify scope: baseline ↔ disk only
   - B.6 story card updated to add entity listing endpoint (B.6.1)
   - Graph coverage validation will be enforced before HGR-2 via B.6

**B.1 validates (per updated spec):**
- Merkle root integrity (baseline ↔ disk)
- File count consistency
- Scope version compatibility

**B.6 will add (per updated spec):**
- `GET /api/v2/entities?entity_type=E11` endpoint
- Graph coverage check integrated into `/api/v2/health`
- Full disk ↔ graph comparison required for HGR-2


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
