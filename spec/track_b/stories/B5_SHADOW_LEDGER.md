---
tdd:
  id: DESIGN-TRACKB-B5
  type: TechnicalDesign
  version: "1.0.0"
  status: planned
---

# Story B.5: Shadow Ledger Migration

**Track:** B (Zero Drift)  
**Duration:** ~1 day  
**Gate:** HGR-2 prerequisite  
**TDD ID:** `DESIGN-TRACKB-B5`

---

## Purpose

Migrate the external shadow ledger into the graph, making all traceability data queryable and enabling the oracle transition.

---

## Entry Criteria

- [ ] B.4 Closure Check complete
- [ ] Graph API v1 operational
- [ ] Shadow ledger files intact (`shadow-ledger/*/ledger.jsonl`)

---

## Scope

### In Scope

- Reading shadow ledger JSONL files
- Creating graph entities for ledger entries
- Validating 100% migration completeness
- Queryable ledger via Graph API v2
- Preserving original ledger as backup

### Out of Scope

- Deleting original ledger files
- Modification of Track A ledger logic
- Direct database access

---

## Related Canonical Requirements (Optional; BRD-only)

None.

This Track B capability (Shadow Ledger Migration) is defined by the Roadmap Track B scope, not by a specific BRD requirement.

---

## Execution Obligations (Roadmap-defined)

| ID | Description | Pillar |
|----|-------------|--------|
| B.5.1 | Read shadow ledger JSONL files | — |
| B.5.2 | Create graph entities for ledger entries | — |
| B.5.3 | Validate 100% migration completeness | — |
| B.5.4 | Provide queryable ledger via Graph API v2 | API |
| B.5.5 | Maintain original ledger as backup | — |

**Important:** Execution Obligations (B.x.y) are planning checkpoints only; verification authority resides exclusively in gate outcomes and HGR approvals.

---

## Gate(s) Involved

- **HGR-2**: Shadow ledger vs Gnosis graph must match 100%

---

## Evidence Artifacts

- `docs/verification/track_b/B5_SHADOW_LEDGER_EVIDENCE.md`

---

## Implementation Constraints

- Access Track A data via Graph API v1 only
- Do not modify Track A locked surfaces
- Do not delete original ledger files
- Place implementation in `src/services/track_b/ledger-migration/`
- Do NOT add `@satisfies AC-B.*` markers
- Do NOT add `@implements STORY-B.*` markers

---

## Technical Details

### Ledger Entry → Graph Entity

```typescript
interface LedgerEntry {
  timestamp: string;
  operation: string;
  entity_type?: string;
  entity_id?: string;
  relationship_type?: string;
  relationship_id?: string;
  metadata?: Record<string, unknown>;
}

// Maps to new entity type (Track B scope)
interface LedgerGraphEntity {
  entity_type: 'LedgerEntry';
  instance_id: string;
  properties: {
    timestamp: string;
    operation: string;
    target_type: string;
    target_id: string;
    epoch_id: string;
  };
}
```

### Migration Validation

- Count entries in JSONL files
- Count LedgerEntry entities in graph
- Counts must match exactly
- Verify round-trip fidelity (can reconstruct JSONL)

---

## Dependencies

| Dependency | Source |
|------------|--------|
| Shadow ledger files | `shadow-ledger/*/ledger.jsonl` |
| Epoch metadata | `epochs/*.json` |

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
- [ ] Shadow ledger migrated to graph (100% match)
- [ ] Evidence artifacts produced
- [ ] Verifiers green
- [ ] TDD registered as E06 in graph (`DESIGN-TRACKB-B5`)
- [ ] TDD linked to implementation SourceFiles via R14

