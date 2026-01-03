---
tdd:
  id: TDD-TRACKB-B6
  type: TechnicalDesign
  version: "1.0.0"
  status: in_progress
  implements:
    files:
      # B.6.1 Enumeration Subset (complete)
      - src/api/v2/db.ts
      - src/api/v2/entities.ts
      - src/api/v2/relationships.ts
      - src/track_b/http/types.ts
      - src/track_b/http/routes/entities.ts
      - src/track_b/http/routes/relationships.ts
      - src/track_b/http/server.ts
      # B.6.2+ endpoints (pending)
---

# Story B.6: Graph API v2

**Track:** B (Zero Drift)  
**Duration:** ~1 day  
**Gate:** API boundary  
**TDD ID:** `TDD-TRACKB-B6`

---

## Purpose

Extend the Graph API with v2 endpoints that expose Track B capabilities (health, drift, registry, closure, ledger).

---

## Entry Criteria

This story is split per CID-2026-01-03-TRACKB-RESEQUENCE-V2-ENUM:

### B.6.1 Enumeration Subset (Entry: After B.2, Before B.3)

- [ ] B.1 Ground Truth Engine complete
- [ ] B.2 BRD Registry complete
- [ ] `DATABASE_URL` configured

### B.6.2 Remaining Endpoints (Entry: After B.5)

- [ ] B.5 Shadow Ledger Migration complete
- [ ] B.6.1 Enumeration Subset complete

---

## Scope

### In Scope

- **Entity listing endpoint** (enables graph coverage validation deferred from B.1 and B.2)
  - `GET /api/v2/entities?entity_type=E01` — required for B.2 BRD→graph parity
  - `GET /api/v2/entities?entity_type=E02` — required for B.2 BRD→graph parity
  - `GET /api/v2/entities?entity_type=E03` — required for B.2 BRD→graph parity
  - `GET /api/v2/entities?entity_type=E11` — required for B.1 graph coverage
- Health score endpoint (includes graph coverage via entity listing)
- Drift report endpoint
- Registry query endpoint (completes B.2 BRD→graph comparison)
- Closure status endpoint
- Ledger query endpoint

### Out of Scope

- Modification of v1 endpoints
- Changes to Track A services
- Direct database access **EXCEPT** for B.6.1 enumeration (see below)

### B.6.1 Database Access Exception (CID-2026-01-03)

B.6.1 enumeration endpoints are permitted **READ-ONLY** direct database access:

1. **Transaction mode:** `BEGIN; SET TRANSACTION READ ONLY;`
2. **RLS context:** `SELECT set_project_id($1)` before queries
3. **Explicit columns:** No `SELECT *`
4. **Explicit project_id filter:** `WHERE project_id = $1` in all queries
5. **Pagination required:** `limit` (max 1000) + `offset`
6. **Module-level pool:** Single `Pool` instance, not per-request

```typescript
// Example: src/api/v2/db.ts
export async function withReadOnlyClient<T>(
  projectId: string,
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await v2Pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SET TRANSACTION READ ONLY');
    await client.query('SELECT set_project_id($1)', [projectId]);
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } finally {
    client.release();
  }
}

// Example enumeration with explicit project_id filter
export async function enumerateEntities(
  client: PoolClient,
  projectId: string,
  entityType: string,
  limit: number,
  offset: number
): Promise<Entity[]> {
  const result = await client.query(`
    SELECT id, instance_id, entity_type, name, content_hash,
           source_file, line_start, line_end, extracted_at
    FROM entities
    WHERE entity_type = $1
      AND project_id = $2  -- Belt+suspenders with RLS
    ORDER BY instance_id
    LIMIT $3 OFFSET $4
  `, [entityType, projectId, Math.min(limit, 1000), offset]);
  return result.rows;
}
```

---

## Related Canonical Requirements (Optional; BRD-only)

None.

This Track B capability (Graph API v2) is defined by the Roadmap Track B scope, not by a specific BRD requirement.

---

## Execution Obligations (Roadmap-defined)

| ID | Description | Pillar |
|----|-------------|--------|
| B.6.1 | Entity listing endpoint (for graph coverage) | API |
| B.6.2 | Health score endpoint | API |
| B.6.3 | Drift report endpoint | API |
| B.6.4 | Registry query endpoint (completes B.2.3 BRD→graph comparison) | API |
| B.6.5 | Closure status endpoint | API |
| B.6.6 | Ledger query endpoint | API |
| B.6.7 | Track C cannot import Track A/B internals | Boundary |

**Important:** Execution Obligations (B.x.y) are planning checkpoints only; verification authority resides exclusively in gate outcomes and HGR approvals.

---

## Gate(s) Involved

- **API boundary**: Track C will only access via Graph API v2

---

## Evidence Artifacts

- `docs/verification/track_b/B6_GRAPH_API_V2_EVIDENCE.md`

---

## Implementation Constraints

- Do not modify v1 endpoints
- Do not modify Track A locked surfaces
- Do NOT add `@satisfies AC-B.*` or `@implements STORY-B.*` markers

### Placement

- Programmatic APIs: `src/api/v2/`
- HTTP server/routes: `src/track_b/http/` (Track B-owned; `src/http/**` is locked)

### Data Access

- **B.6.1:** READ-ONLY direct database access (per exception above)
- **B.6.2+:** Access data via B.1-B.5 service functions or v2 enumeration

### API Boundary Gate Clarification

The gate "Track C will only access via Graph API v2" is satisfied when:

1. All Track B data is accessible via `GRAPH_API_V2_URL/api/v2/*`
2. Track C uses `GRAPH_API_V2_URL` as its sole boundary surface
3. The API contract (URL + response schema) is the boundary, not process topology
4. A separate v2 server satisfies this requirement

### Legacy Node Filtering (IMPORTANT)

When returning Track B TDD entities (E06), v2 endpoints **MUST**:

- Filter to `instance_id` starting with `TDD-TRACKB-` by default
- **Never** return legacy `DESIGN-TRACKB-*` nodes unless explicitly requested
- Legacy nodes exist from prior migrations; they are harmless but should not appear in normal API responses

---

## Technical Details

### API v2 Endpoints

```typescript
// Entity listing (enables graph coverage validation deferred from B.1)
// This endpoint was not available in v1; Track B could not modify locked surfaces.
GET /api/v2/entities?entity_type=E11&project_id=...
→ { entities: Entity[], count: number }

// Health (from B.1, now includes graph coverage via entity listing above)
GET /api/v2/health
→ { score: number, details: HealthDetail[], graph_coverage: GraphCoverage }

// Drift (from B.3)
GET /api/v2/drift/:snapshotA/:snapshotB
→ DriftReport

POST /api/v2/drift/check
→ { drift_detected: boolean, report_id: string }

// Registry (from B.2)
GET /api/v2/registry/status
→ RegistryComparison

GET /api/v2/registry/brd
→ { version: string, hash: string, counts: {...} }

// Closure (from B.4)
GET /api/v2/closure/status
→ { last_check: string, passed: boolean }

POST /api/v2/closure/verify
→ { passed: boolean, differences: Difference[] }

// Ledger (from B.5)
GET /api/v2/ledger/entries?limit=100&offset=0
→ { entries: LedgerEntry[], total: number }

GET /api/v2/ledger/epochs
→ { epochs: Epoch[] }
```

### Design Principles

- Build on v1 patterns (programmatic API + optional HTTP)
- Do not modify v1 endpoints
- New module: `src/api/v2/`
- Services: `src/services/track_b/`

---

## Dependencies

| Dependency | Source |
|------------|--------|
| Graph API v1 | `src/api/v1/` |
| B.1 Ground Truth | Health data |
| B.2 BRD Registry | Registry data |
| B.3 Drift Detection | Drift data |
| B.4 Closure Check | Closure data |
| B.5 Ledger Migration | Ledger data |

---

## Required Verifiers

```bash
npm run verify:organ-parity
npm run verify:scripts-boundary
npm run lint:markers
npm test
npx tsx scripts/verify-track-a-lock.ts
```

---

## Definition of Done

- [ ] All Execution Obligations completed
- [ ] All v2 endpoints implemented
- [ ] v1 endpoints unchanged
- [ ] Evidence artifacts produced
- [ ] Verifiers green
- [ ] TDD registered as E06 in graph (`TDD-TRACKB-B6`)
- [ ] TDD linked to implementation SourceFiles via R14
