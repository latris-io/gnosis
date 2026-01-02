---
tdd:
  id: TDD-TRACKB-B2
  type: TechnicalDesign
  version: "1.0.0"
  status: planned
---

# Story B.2: BRD Registry

**Track:** B (Zero Drift)  
**Duration:** ~2 days  
**Gate:** G-REGISTRY  
**TDD ID:** `TDD-TRACKB-B2`

---

## Purpose

Parse the authoritative BRD document and maintain a registry that can be compared against the graph, ensuring requirements in the BRD match entities in the graph.

---

## Entry Criteria

- [ ] B.1 Ground Truth Engine complete
- [ ] Graph API v1 operational
- [ ] E01/E02/E03 entities available in graph

---

## Scope

### In Scope

- BRD markdown parsing for epics/stories/ACs
- BRD version and content hash tracking
- Comparison of BRD counts to graph counts
- G-REGISTRY gate implementation
- Shadow ledger logging for BRD parsing

### Out of Scope

- Modification of Track A BRD extraction logic
- Changes to existing BRD entity schemas
- Direct database access

---

## Related Canonical Requirements (Optional; BRD-only)

None.

This Track B capability (BRD Registry) is defined by the Roadmap Track B scope, not by a specific BRD requirement.

---

## Execution Obligations (Roadmap-defined)

| ID | Description | Pillar |
|----|-------------|--------|
| B.2.1 | Parse markdown BRD → Extract epics/stories/ACs | — |
| B.2.2 | Store BRD version with content hash | — |
| B.2.3 | Compare BRD stories to graph stories via API | API |
| B.2.4 | G-REGISTRY gate: fail on mismatch | Gate |
| B.2.5 | Log BRD parsing to shadow ledger | Shadow |

**Important:** Execution Obligations (B.x.y) are planning checkpoints only; verification authority resides exclusively in gate outcomes and HGR approvals.

---

## Gate(s) Involved

- **G-REGISTRY**: BRD registry complete and queryable (fail on mismatch)

---

## Evidence Artifacts

- `docs/verification/track_b/B2_BRD_REGISTRY_EVIDENCE.md`

---

## Implementation Constraints

- Access Track A data via Graph API v1 only
- Do not modify Track A locked surfaces
- Place implementation in `src/services/track_b/brd-registry/`
- Do NOT add `@satisfies AC-B.*` markers
- Do NOT add `@implements STORY-B.*` markers

---

## Technical Details

### Registry Comparison

```typescript
interface RegistryComparison {
  brd_version: string;
  brd_hash: string;
  graph_counts: {
    epics: number;      // Expected: 65
    stories: number;    // Expected: 397
    acs: number;        // Expected: 3147
  };
  matches: boolean;
  discrepancies: Discrepancy[];
}
```

### G-REGISTRY Gate

- Parse BRD file
- Query graph via API for E01/E02/E03 counts
- Compare counts
- Fail if any mismatch

---

## Dependencies

| Dependency | Source |
|------------|--------|
| E01 Epic | Graph API v1 |
| E02 Story | Graph API v1 |
| E03 AcceptanceCriterion | Graph API v1 |
| BRD parser | Track A (reuse via ops layer) |

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
- [ ] G-REGISTRY gate passing
- [ ] Evidence artifacts produced
- [ ] Verifiers green
- [ ] TDD registered as E06 in graph (`TDD-TRACKB-B2`)
- [ ] TDD linked to implementation SourceFiles via R14
