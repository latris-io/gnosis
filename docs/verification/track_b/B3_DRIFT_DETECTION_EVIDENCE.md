# B.3 Drift Detection Evidence

**Generated:** 2026-01-03T19:19:21.939Z
**Project ID:** 6df2f456-440d-4958-b475-d9808775ff69
**Git SHA:** 051a7d57e71783f539abf792acda26bbab6dfe98

## Compliance Statement

All graph reads performed via HTTP Graph API v2 enumeration endpoints.
No direct database access. No imports from Track A locked surfaces.

## Environment

- **GRAPH_API_V2_URL:** http://localhost:3001
- **PROJECT_ID:** 6df2f456-440d-4958-b475-d9808775ff69
- **Allowlist:** Default (empty)

## Snapshot Summary

| Snapshot | Label | Entities | Relationships | Entity Root | Rel Root |
|----------|-------|----------|---------------|-------------|----------|
| Baseline | baseline-1 | 4711 | 5412 | a4f2fce5bf8c... | ed4e2192173f... |
| Current | current-check | 4711 | 5412 | a4f2fce5bf8c... | ed4e2192173f... |

## Diff Summary

| Category | Added | Deleted | Mutated |
|----------|-------|---------|---------|
| Entities | 0 | 0 | 0 |
| Relationships | 0 | 0 | 0 |

## G-DRIFT Gate Result

**Result:** PASS ✓
**Unexpected Items:** 0
**Allowed Items:** 0



## Ledger Entries

Logged to: `shadow-ledger/6df2f456-440d-4958-b475-d9808775ff69/ledger.jsonl`

- SNAPSHOT_CREATED: SNAPSHOT-current-check-051a7d5-2026-01-03T19-17-55-253Z
- DIFF_COMPUTED: SNAPSHOT-baseline-1-051a7d5-2026-01-03T19-16-30-891Z → SNAPSHOT-current-check-051a7d5-2026-01-03T19-17-55-253Z
- GATE_EVALUATED: pass=true

## Verification Commands

```bash
# Re-run drift detection
PROJECT_ID=6df2f456-440d-4958-b475-d9808775ff69 \
GRAPH_API_V2_URL=http://localhost:3001 \
npx tsx scripts/drift.ts full <label>

# Verify ledger entries
grep '"story":"B.3"' shadow-ledger/6df2f456-440d-4958-b475-d9808775ff69/ledger.jsonl
```
