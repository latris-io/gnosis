# CID-2026-01-03-TRACKB-RESEQUENCE-V2-ENUM

**Title:** Track B Resequencing — Pull Forward v2 Enumeration + Constraint Overrides  
**Status:** APPROVED  
**Created:** 2026-01-03  
**Author:** Cursor (AI Implementation Agent)  
**Impact:** Track B spec files only; NO Track A locked surface modifications  
**REOPEN_TRACK_A:** false

---

## 1) Problem Statement

### 1.1 The Circular Dependency (Proven)

B.3/B.4 require **whole-graph enumeration** for snapshots.

From `spec/track_b/stories/B3_DRIFT_DETECTION.md`:
> | All entities | Graph API v1 |
> | All relationships | Graph API v1 |

**However, Graph API v1 HTTP has NO enumeration endpoint.**

From `src/http/routes/graph.ts`, the only v1 HTTP endpoints are:
- `GET /api/graph/:id/relationships` — requires entity ID
- `POST /api/graph/traverse` — requires start ID

### 1.2 B.6 Has Enumeration But Is Blocked

B.6 adds enumeration but requires B.1-B.5 complete:
> - [ ] B.1–B.5 complete (all Track B services ready)

**Circular dependency:** B.3/B.4 need enumeration → enumeration is in B.6 → B.6 needs B.3-B.5.

### 1.3 Constraint Conflicts Requiring Amendment

| Constraint | Location | Conflict |
|------------|----------|----------|
| "Access Track A data **only** via Graph API v1" | ENTRY.md:44 | Blocks v2 usage |
| "Direct database access" in Out of Scope | B6:51 | Blocks enumeration implementation |
| "No direct database access in Track B code" | EXIT.md:37 | Blocks B.6.1 |
| "Place implementation in `src/api/v2/`" | B6:96 | Incomplete — `src/http/**` is locked |

---

## 2) Decision

### 2.1 Resequence: Pull Forward B.6.1 Enumeration

| Order | Story | Description |
|-------|-------|-------------|
| 1 | B.1 | Ground Truth Engine (COMPLETE) |
| 2 | B.2 | BRD Registry (COMPLETE) |
| 3 | **B.6.1** | **Enumeration Endpoints (pre-B.3)** |
| 4 | B.3 | Drift Detection |
| 5 | B.4 | Closure Check |
| 6 | B.5 | Shadow Ledger Migration |
| 7 | B.6.2 | Remaining Graph API v2 |
| 8 | B.7 | Semantic Corpus Export |

### 2.2 Constraint Overrides (Complete List)

This CID explicitly overrides the following Track B constraints:

#### Override 1: ENTRY.md "v1 only" Rule (Line 44)

**Current:**
```markdown
- Access Track A data **only** via Graph API v1
```

**Amended to:**
```markdown
- Access Track A data via **HTTP calls** to Graph API endpoints:
  - **v1** (`GRAPH_API_URL`): traversal, relationships-by-id
  - **v2** (`GRAPH_API_V2_URL`): enumeration (after B.6.1 per CID-2026-01-03)
```

---

#### Override 2: EXIT.md "No direct database access" (Line 37)

**Current:**
```markdown
- [ ] G-API: No direct database access in Track B code
```

**Amended to:**
```markdown
- [ ] G-API: No direct database access in Track B code, **except** the CID-approved, hardened, read-only access used by B.6.1 enumeration endpoints (per CID-2026-01-03). Verified by `npm run verify:track-b-db-boundary`.
```

---

#### Override 3: B6 "Out of Scope: Direct database access" (Line 51)

**Current:**
```markdown
- Direct database access
```

**Amended to:**
```markdown
- Direct database access **EXCEPT** for B.6.1 enumeration subset (see below)
```

---

#### Override 4: B6 "Implementation Constraints" (Lines 93, 96)

**Current:**
```markdown
- Access Track A data via Graph API v1 only
- Place implementation in `src/api/v2/`
```

**Amended to:**
```markdown
- B.6.2+ access Track A data via Graph API v1 or v2 enumeration
- B.6.1 may use READ-ONLY direct database access (per exception)
- Place programmatic APIs in `src/api/v2/`
- Place HTTP server/routes in `src/track_b/http/` (Track B-owned)
```

---

### 2.3 V2 Server Architecture

**Environment variables:**
| Variable | Purpose | Example |
|----------|---------|---------|
| `GRAPH_API_URL` | v1 endpoints | `http://localhost:3000` |
| `GRAPH_API_V2_URL` | v2 endpoints | `http://localhost:3001` |

**Implementation locations:**
- `src/api/v2/` — Programmatic APIs
- `src/track_b/http/` — HTTP server + routes

### 2.4 API Boundary Gate Clarification

B.6's gate is:
> **API boundary**: Track C will only access via Graph API v2

**Clarification:** The boundary is the URL contract (`GRAPH_API_V2_URL/api/v2/*`), not process topology. A separate v2 server satisfies this requirement.

---

### 2.5 Read-Only Database Hardening (Full Spec)

B.6.1 enumeration endpoints are permitted **READ-ONLY** direct database access with:

1. **Transaction mode:** `SET TRANSACTION READ ONLY`
2. **RLS context:** `SELECT set_project_id($1)`
3. **Explicit columns:** No `SELECT *`
4. **Explicit project_id filter:** Belt+suspenders WHERE clause
5. **Pagination required:** `limit` (max 1000) + `offset`
6. **Module-level pool:** Single connection pool

```typescript
// Example query with explicit project_id filter
const result = await client.query(`
  SELECT id, instance_id, entity_type, name, content_hash,
         source_file, line_start, line_end, extracted_at
  FROM entities
  WHERE entity_type = $1
    AND project_id = $2  -- Belt+suspenders with RLS
  ORDER BY instance_id
  LIMIT $3 OFFSET $4
`, [entityType, projectId, Math.min(limit, 1000), offset]);
```

---

### 2.6 G-API Enforcement Update

**New verifier:** `scripts/verify-track-b-db-boundary.ts`

| Path | DB Access | Enforcement |
|------|-----------|-------------|
| `src/api/v2/**` | ALLOWED | Read-only patterns enforced |
| `src/track_b/http/**` | FORBIDDEN | Must call v2 APIs |
| `src/services/track_b/**` | FORBIDDEN | Must use HTTP calls |

---

### 2.7 Single Canonical Ledger Stream

**Path:** `shadow-ledger/<project_id>/ledger.jsonl`

All Track B ledger entries use this path with distinguishing fields:
```json
{
  "track": "B",
  "story": "B.3",
  "action": "SNAPSHOT_CAPTURE",
  ...
}
```

**Migration of B.1/B.2 historical entries:**
1. Read from `docs/verification/track_b/*.jsonl`
2. Add `track: "B"`, `story`, `project_id` fields
3. Append to canonical stream with MIGRATION_MARKER
4. Archive originals

---

## 3) Governance Impact

### 3.1 Files Changed

| File | Change |
|------|--------|
| `spec/track_b/ENTRY.md` | v1+v2 allowed, env vars |
| `spec/track_b/EXIT.md` | B.6.1 exception |
| `spec/track_b/HUMAN_GATE_HGR2.md` | Governance note |
| `spec/track_b/OVERVIEW.md` | Story sequence |
| `spec/track_b/PROMPTS.md` | HTTP-only rule |
| `spec/track_b/stories/B3_DRIFT_DETECTION.md` | v2 deps |
| `spec/track_b/stories/B4_CLOSURE_CHECK.md` | v2 deps |
| `spec/track_b/stories/B5_SHADOW_LEDGER.md` | Single-stream |
| `spec/track_b/stories/B6_GRAPH_API_V2.md` | Split + hardening |
| **NEW:** `scripts/verify-track-b-db-boundary.ts` | G-API verifier |
| **NEW:** `.github/workflows/organ-parity.yml` | CI step |

### 3.2 Track A Lock Status

**NO Track A locked surfaces are modified.**  
**REOPEN_TRACK_A: false**

---

## 4) Approval

This CID was approved and executed on 2026-01-03.

All constraint overrides are now in effect. The verifier `npm run verify:track-b-db-boundary` enforces the B.6.1 exception boundaries.

