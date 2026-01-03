# B.4 Closure Check Evidence

**Generated:** 2026-01-03T22:06:33.396Z  
**Status:** ✅ PASS  
**Run ID:** `B4-CLOSURE-2026-01-03T21-49-56-000Z`

---

## Environment Binding

| Field | Value |
|-------|-------|
| **PROJECT_ID** | `6df2f456-440d-4958-b475-d9808775ff69` |
| **GIT_SHA** | `45fa0c647d06ec513015f5b83ce4cd44f2cc2842` |
| **GIT_BRANCH** | `main` |
| **WORKING_TREE_CLEAN** | ⚠️ No (dirty) |
| **GRAPH_API_V2_URL** | `http://localhost:3001` |
| **Started At** | 2026-01-03T21:50:33.467Z |

### V2 API Health

| Field | Value |
|-------|-------|
| **URL** | `http://localhost:3001` |
| **Status** | ✅ ok |
| **Checked At** | 2026-01-03T21:50:33.456Z |
| **Response Time** | 17ms |

---

## Provenance Validation

**Result:** ✅ VALID

### Extraction Provenance

| Field | Value |
|-------|-------|
| **Path** | `docs/verification/track_b/EXTRACTION_PROVENANCE.md` |
| **Exists** | ✅ |
| **Parseable** | ✅ |
| **Project ID Matches** | ✅ |
| **SHA Matches** | ✅ |
| **Found SHA** | `45fa0c647d06ec513015f5b83ce4cd44f2cc2842` |

### Operator Evidence

| Field | Value |
|-------|-------|
| **Path** | `docs/verification/track_b/B4_OPERATOR_EVIDENCE_B4-CLOSURE-2026-01-03T21-49-56-000Z.md` |
| **Exists** | ✅ |
| **Parseable** | ✅ |
| **Project ID Matches** | ✅ |
| **SHA Matches** | ✅ |
| **Found SHA** | `45fa0c647d06ec513015f5b83ce4cd44f2cc2842` |

---

## Snapshots

### Snapshot 1 (AFTER_1)

| Field | Value |
|-------|-------|
| **ID** | `SNAPSHOT-closure-after-1-45fa0c6-2026-01-03T21-59-01-322Z` |
| **Entity Count** | 4796 |
| **Relationship Count** | 5553 |
| **Entity Merkle Root** | `0b29cf92c65c3955...` |
| **Relationship Merkle Root** | `f6f35bdcb92a0e59...` |

### Snapshot 2 (AFTER_2)

| Field | Value |
|-------|-------|
| **ID** | `SNAPSHOT-closure-after-2-45fa0c6-2026-01-03T22-06-28-564Z` |
| **Entity Count** | 4796 |
| **Relationship Count** | 5553 |
| **Entity Merkle Root** | `0b29cf92c65c3955...` |
| **Relationship Merkle Root** | `f6f35bdcb92a0e59...` |

---

## Explicit Comparison

| Check | Snapshot 1 | Snapshot 2 | Match |
|-------|------------|------------|-------|
| Entity Count | 4796 | 4796 | ✅ |
| Relationship Count | 5553 | 5553 | ✅ |
| Entity Merkle Root | `0b29cf92c65c...` | `0b29cf92c65c...` | ✅ |
| Relationship Merkle Root | `f6f35bdcb92a...` | `f6f35bdcb92a...` | ✅ |

**Drift Items:** 0

---

## G-CLOSURE Gate

**Result:** ✅ PASS

| Check | Result |
|-------|--------|
| Provenance OK | ✅ |
| SHA OK | ✅ |
| Counts Match | ✅ |
| Entity Roots Match | ✅ |
| Relationship Roots Match | ✅ |
| Drift Items | 0 |

---

## Commands Executed

```bash
# Full Track A Pipeline (executed twice)
npx tsx scripts/run-a1-extraction.ts
npx tsx scripts/register-track-b-tdds.ts
```

---

## Verification

```bash
# Ledger entries for this run
grep '"run_id":"B4-CLOSURE-2026-01-03T21-49-56-000Z"' shadow-ledger/6df2f456-440d-4958-b475-d9808775ff69/ledger.jsonl
```
