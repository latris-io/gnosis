# CID-2026-01-01: A5 Graph API v1 — HTTP Adapter Layer Requirement

**Date:** 2026-01-01  
**Status:** PENDING APPROVAL  
**Baseline:** Track A1–A4 locked at `track-a4-green` (SHA `b1b88cee9c242a09a1e8d15ea856b5dd292f9aff`)  
**Constraint:** No locked-surface modifications permitted

---

## Problem Statement

BRD Story 64.5 defines HTTP endpoints:

| AC | Endpoint |
|----|----------|
| AC-64.5.1 | `GET /api/graph/{id}/relationships` |
| AC-64.5.2 | `POST /api/graph/traverse` |

However, the repository has **no HTTP infrastructure**.

---

## Evidence

### 1. No HTTP Framework Dependency

`package.json` contains no HTTP server libraries:

```bash
grep -E 'express|fastify|koa|hapi' package.json
# Result: No matches found
```

### 2. No Server/Router Files

```bash
find src -name "server.ts" -o -name "routes.ts"
# Result: No files found
```

### 3. `src/api/v1/*` is Programmatic API Only

The existing API modules are **function exports**, not HTTP handlers:

```typescript
// src/api/v1/entities.ts
export async function getEntity(projectId: string, id: string): Promise<Entity | null> {
  return entityService.getById(projectId, id);
}
```

**Usage pattern:** Imported as functions by:
- `src/ops/track-a.ts`
- `src/pipeline/orchestrator.ts`
- `src/pipeline/statistics.ts`
- Test files (`test/sanity/*.test.ts`)
- Scripts (`scripts/*.ts`)

No HTTP request/response handling anywhere in the codebase.

---

## Impact

**AC-64.5.1 and AC-64.5.2 cannot be satisfied as literal HTTP endpoints** without adding HTTP infrastructure that does not currently exist.

If A5 proceeds with "programmatic API only" (function exports following the existing pattern), the implementation would not match the BRD endpoint specification.

---

## Decision Required

**Question to Governance:**

> Do AC-64.5.1 and AC-64.5.2 require actual HTTP endpoints, or is the `/api/...` notation conceptual for the internal programmatic API?

---

## Resolution Options

### Option A: Add Minimal HTTP Adapter Layer (Recommended)

Add a lightweight HTTP server as a **new, unlocked surface**:

| Component | Location | Purpose |
|-----------|----------|---------|
| HTTP Framework | `package.json` | Add `fastify` (or `express`) as dependency |
| Server Entry | `src/http/server.ts` | Minimal HTTP server setup |
| Route Handlers | `src/http/routes/graph.ts` | Wire HTTP routes to `src/api/v1/*` functions |

**Wiring pattern:**
```typescript
// src/http/routes/graph.ts
app.get('/api/graph/:id/relationships', async (req, res) => {
  const result = await graphApi.getRelationshipsForEntity(projectId, req.params.id, filters);
  res.json({ relationships: result });
});
```

**Pros:**
- Matches BRD endpoint specification literally
- Clean separation: HTTP layer → API layer → Service layer → DB layer
- Does not modify any locked Track A surfaces

**Cons:**
- Introduces new runtime dependency
- Adds operational surface (HTTP server process)

### Option B: Programmatic API Only (Defer HTTP)

Implement A5 as programmatic function exports only (following existing `src/api/v1/*` pattern). Defer HTTP wiring to a separate story.

**Pros:**
- Minimal change
- Consistent with existing architecture

**Cons:**
- Does not satisfy BRD endpoint specification as written
- Requires reinterpretation of AC-64.5.1/64.5.2

### Option C: Clarify BRD Intent

Request clarification from BRD authority on whether `/api/...` notation is:
- Literal HTTP endpoints (requires Option A)
- Conceptual naming for programmatic API (allows Option B)

---

## Constraints

Any resolution must:

1. **NOT modify locked Track A surfaces:**
   - `src/extraction/providers/**`
   - `src/services/entities/**`, `src/services/relationships/**`, `src/services/sync/**`
   - `src/schema/track-a/**`
   - `src/db/**`
   - `migrations/**`
   - `scripts/verification/**`

2. **Keep verifiers green:**
   - `npm run test:sanity`
   - `npm test`
   - `TRACK_A_PHASE=A4 npm run verify:track-milestone`

3. **Maintain programmatic API layer:**
   - `src/api/v1/*` remains as function exports
   - HTTP layer (if added) delegates to API layer

---

## Recommendation

**Option A: Add Minimal HTTP Adapter Layer**

Rationale:
- Matches BRD specification as written
- Creates clear architectural separation
- Does not require reinterpreting acceptance criteria
- New `src/http/**` directory is not a locked surface

---

## Approval

| Role | Name | Decision | Date |
|------|------|----------|------|
| Governance | | PENDING | |

---

*End of CID*

