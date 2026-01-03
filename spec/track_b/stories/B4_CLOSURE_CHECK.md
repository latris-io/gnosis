---
tdd:
  id: TDD-TRACKB-B4
  type: TechnicalDesign
  version: "1.0.0"
  status: planned
---

# Story B.4: Closure Check

**Track:** B (Zero Drift)  
**Duration:** ~1 day  
**Gate:** G-CLOSURE  
**TDD ID:** `TDD-TRACKB-B4`

---

## Purpose

Verify that re-ingestion produces identical results, proving the extraction pipeline is deterministic.

---

## Entry Criteria

- [ ] B.3 Drift Detection complete
- [ ] `GRAPH_API_V2_URL` environment variable configured
- [ ] Track A pipeline accessible via `src/ops/track-a.ts`

---

## Scope

### In Scope

- Re-running extraction pipeline
- Graph comparison (instance IDs, properties)
- G-CLOSURE gate implementation
- Difference reporting
- Shadow ledger logging for closure checks

### Out of Scope

- Modification of Track A extraction logic
- Changes to existing entity schemas
- Direct database access

---

## Related Canonical Requirements (Optional; BRD-only)

None.

This Track B capability (Closure Check) is defined by the Roadmap Track B scope, not by a specific BRD requirement.

---

## Execution Obligations (Roadmap-defined)

| ID | Description | Pillar |
|----|-------------|--------|
| B.4.1 | Re-run extraction pipeline | — |
| B.4.2 | Compare resulting graph to stored graph | — |
| B.4.3 | G-CLOSURE gate: fail if graphs differ | Gate |
| B.4.4 | Report exact differences if any | — |
| B.4.5 | Log closure check to shadow ledger | Shadow |

**Important:** Execution Obligations (B.x.y) are planning checkpoints only; verification authority resides exclusively in gate outcomes and HGR approvals.

---

## Gate(s) Involved

- **G-CLOSURE**: Re-ingestion produces identical graph (fail if graphs differ)

---

## Evidence Artifacts

- `docs/verification/track_b/B4_CLOSURE_CHECK_EVIDENCE.md`

---

## Implementation Constraints

- Access Track A data via Graph API v1 only
- Use Track A pipeline via ops layer only
- Do not modify Track A locked surfaces
- Place implementation in `src/services/track_b/closure-check/`
- Do NOT add `@satisfies AC-B.*` markers
- Do NOT add `@implements STORY-B.*` markers

---

## Technical Details

### Closure Verification Process

1. Store current graph state (snapshot)
2. Clear extraction artifacts
3. Re-run full extraction pipeline (via ops layer)
4. Compare new graph to stored snapshot
5. Pass only if 100% identical

### Comparison Method

- Compare entity instance_ids
- Compare relationship instance_ids
- Compare entity properties (excluding timestamps)
- Compare relationship properties

### Failure Modes

If closure fails:
- Non-deterministic ID generation
- Timestamp-dependent logic
- External state dependency
- Random/UUID usage without seed

---

## Dependencies

| Dependency | Source |
|------------|--------|
| Track A pipeline | `src/ops/track-a.ts` |
| Graph snapshots | B.3 Drift Detection |
| All entities | `GRAPH_API_V2_URL/api/v2/entities` (via B.3) |
| All relationships | `GRAPH_API_V2_URL/api/v2/relationships` (via B.3) |

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
- [ ] G-CLOSURE gate passing
- [ ] Evidence artifacts produced
- [ ] Verifiers green
- [ ] TDD registered as E06 in graph (`TDD-TRACKB-B4`)
- [ ] TDD linked to implementation SourceFiles via R14
