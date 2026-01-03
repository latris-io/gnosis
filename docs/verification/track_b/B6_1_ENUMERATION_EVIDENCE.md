# B.6.1 Enumeration Endpoints — Evidence Artifact

**Date:** 2026-01-03  
**Story:** B.6.1 (Enumeration Subset)  
**TDD:** TDD-TRACKB-B6  
**Status:** COMPLETE

---

## 1. Environment

| Variable | Value |
|----------|-------|
| `GRAPH_API_V2_URL` | `http://localhost:3001` |
| `DATABASE_URL` | (configured via .env) |
| `PROJECT_ID` | `6df2f456-440d-4958-b475-d9808775ff69` |

---

## 2. Endpoints Implemented

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v2/entities` | Entity enumeration by type |
| GET | `/api/v2/relationships` | Relationship enumeration |
| GET | `/health` | Health check |

### Query Parameters

**Entities:**
- `project_id` (required): UUID
- `entity_type` (required): E[0-9]{2}
- `limit` (optional): 1-1000, default 100
- `offset` (optional): >= 0, default 0

**Relationships:**
- `project_id` (required): UUID
- `relationship_type` (optional): R[0-9]{2}
- `limit` (optional): 1-1000, default 100
- `offset` (optional): >= 0, default 0

---

## 3. Counts by Type (Exact, Paginated)

### Entity Counts (canonical project)

| Type | Count | Method |
|------|-------|--------|
| E01 (Epic) | 65 | Single page |
| E02 (Story) | 397 | Single page |
| E03 (AC) | **3147** | 4 pages (1000+1000+1000+147) |
| E06 (TechnicalDesign) | 23 | Single page |
| E08 (Component) | 4 | Single page |
| E11 (SourceFile) | 77 | Single page |
| E12 (Function) | 263 | Single page |
| E13 (Class) | 18 | Single page |
| E27 (TestFile) | 34 | Single page |
| E28 (TestSuite) | 122 | Single page |
| E29 (TestCase) | 304 | Single page |
| E49 (ReleaseVersion) | 10 | Single page |
| E50 (Commit) | 219 | Single page |
| E52 (SemVer) | 3 | Single page |

### Relationship Counts (Exact)

| Metric | Value |
|--------|-------|
| **Total Relationships** | **5412** |
| Pages Required | 6 (1000+1000+1000+1000+1000+412) |

Enumerated with pagination until `has_more=false`:
```bash
# Pagination loop
offset=0; total=0
while has_more; do
  resp=$(curl ".../relationships?project_id=...&limit=1000&offset=$offset")
  total += returned
  offset += 1000
done
# Result: 5412 total
```

---

## 4. Pagination Proof

**Test: E01 has exactly 65 entities**

```bash
# Request 1: offset=0, limit=60
curl ".../entities?...&entity_type=E01&limit=60&offset=0"
# Result: { returned: 60, has_more: true }

# Request 2: offset=60, limit=60
curl ".../entities?...&entity_type=E01&limit=60&offset=60"
# Result: { returned: 5, has_more: false }

# Edge case: limit=65 (exact match)
curl ".../entities?...&entity_type=E01&limit=65&offset=0"
# Result: { returned: 65, has_more: false }
```

**Conclusion:** Limit+1 trick works correctly. No false positives for has_more.

---

## 5. Ordering Proof

All queries use deterministic ordering:
```sql
ORDER BY instance_id, id
```

- `instance_id` is unique per project+type
- `id` (UUID) provides tie-breaker
- Pagination is stable across requests

### Verified Ordering (E11 SourceFile)

**Page 1 (offset=0, limit=5):**
```
FILE-src/api/v1/entities.ts
FILE-src/api/v1/markers.ts
FILE-src/api/v1/relationships.ts
FILE-src/api/v1/traversal.ts
FILE-src/api/v2/db.ts
```

**Page 2 (offset=5, limit=5):**
```
FILE-src/api/v2/entities.ts
FILE-src/api/v2/relationships.ts
FILE-src/config/env.ts
FILE-src/db/migrate.ts
FILE-src/db/neo4j-migrate.ts
```

Ordering is **alphabetical by instance_id** and **stable across requests**.

---

## 6. Read-Only Hardening Statement

Per CID-2026-01-03, the following hardening is implemented in `src/api/v2/db.ts`:

| Requirement | Implementation |
|-------------|----------------|
| Transaction mode | `SET TRANSACTION READ ONLY` |
| RLS context | `SELECT set_project_id($1)` |
| Explicit columns | No `SELECT *` |
| Explicit project_id filter | `WHERE project_id = $2` |
| Pagination cap | `LIMIT` capped at 1000 |
| Module-level pool | Single `Pool` instance |

---

## 7. Verification Results

| Check | Result |
|-------|--------|
| `npm run verify:track-b-db-boundary` | PASS |
| `npm run verify:scripts-boundary` | PASS |
| `npm run verify:organ-parity` | PASS |
| `npx tsx scripts/verify-track-a-lock.ts` | PASS |
| `npm test` | 297/297 tests pass |
| Smoke test: `/health` | `{"status":"ok","server":"v2"}` |
| Smoke test: `/api/v2/entities` | Correct pagination |
| Smoke test: `/api/v2/relationships` | Correct pagination |

---

## 8. Files Created

| Path | Purpose |
|------|---------|
| `src/api/v2/db.ts` | Read-only DB pool + transaction wrapper |
| `src/api/v2/entities.ts` | Entity enumeration function |
| `src/api/v2/relationships.ts` | Relationship enumeration function |
| `src/track_b/http/types.ts` | Shared request/response types |
| `src/track_b/http/routes/entities.ts` | Entity endpoint handler |
| `src/track_b/http/routes/relationships.ts` | Relationship endpoint handler |
| `src/track_b/http/server.ts` | v2 Fastify server (port 3001) |

---

## 9. Governance Compliance

- **Track A locked surfaces:** NOT modified
- **CID-2026-01-03:** Followed (read-only DB exception for B.6.1)
- **verify-track-b-db-boundary:** Enforces three-tier rules
- **No @implements/@satisfies markers:** Track B is gate-based

---

## 10. Next Steps

B.6.1 unblocks:
- **B.3 Drift Detection:** Can now enumerate all entities/relationships via v2
- **B.4 Closure Check:** Can now create whole-graph snapshots

B.6.2+ (after B.5):
- Health score endpoint
- Drift report endpoint
- Registry query endpoint
- Closure status endpoint
- Ledger query endpoint

