---
tdd:
  id: TDD-TRACKB-B6
  type: TechnicalDesign
  version: "1.0.0"
  status: planned
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

- [ ] B.1–B.5 complete (all Track B services ready)
- [ ] Graph API v1 operational
- [ ] HTTP server infrastructure available

---

## Scope

### In Scope

- **Entity listing endpoint** (enables graph coverage validation deferred from B.1)
- Health score endpoint
- Drift report endpoint
- Registry query endpoint
- Closure status endpoint
- Ledger query endpoint

### Out of Scope

- Modification of v1 endpoints
- Changes to Track A services
- Direct database access

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
| B.6.4 | Registry query endpoint | API |
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

- Access Track A data via Graph API v1 only
- Do not modify v1 endpoints
- Do not modify Track A locked surfaces
- Place implementation in `src/api/v2/`
- Do NOT add `@satisfies AC-B.*` markers
- Do NOT add `@implements STORY-B.*` markers

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
