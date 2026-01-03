# B.1 Ground Truth Evidence

**Generated:** 2026-01-03T18:00:32.254Z  
**Project ID:** 6df2f456-440d-4958-b475-d9808775ff69

---

## Health Score

| Metric | Value |
|--------|-------|
| **Score** | 0 |
| **G-HEALTH Pass** | ❌ FAIL |

---

## Merkle Root Comparison

| Field | Value |
|-------|-------|
| Expected Root | `d7b2f9e7e16a0ef80798f9bf6d1c292d9dc3f7727869defc1fd2b7c8954ed182` |
| Computed Root | `129050df0ea8df9b46e915cdfa8cb077c5906bce6b1dc4a53b144a77c0b38a1a` |
| Match | ❌ |

---

## File Counts

| Metric | Count |
|--------|-------|
| Expected files | 159 |
| Actual files | 174 |

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

## Ledger

Operations logged to: `shadow-ledger/6df2f456-440d-4958-b475-d9808775ff69/ledger.jsonl`

---

## Commands Run

```bash
# Set baseline
npx tsx scripts/ground-truth.ts set-baseline

# Check health
PROJECT_ID=6df2f456-440d-4958-b475-d9808775ff69 npx tsx scripts/ground-truth.ts check
```
