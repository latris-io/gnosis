# Story B.5: Shadow Ledger Migration

**Track:** B (Zero Drift)  
**Duration:** ~1 day  
**Gate:** —

---

## User Story

**As a** traceability system  
**I want** my shadow ledger to be part of the graph  
**So that** all traceability data is queryable

---

## Acceptance Criteria

| AC | Description | Pillar |
|----|-------------|--------|
| AC-B.5.1 | Read shadow ledger JSONL files | — |
| AC-B.5.2 | Create graph entities for ledger entries | — |
| AC-B.5.3 | Validate 100% migration completeness | — |
| AC-B.5.4 | Provide queryable ledger via Graph API v2 | API |
| AC-B.5.5 | Maintain original ledger as backup | — |

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

## Definition of Done

- [ ] Ledger reading implemented
- [ ] Graph entity creation working
- [ ] Migration validation passing
- [ ] Query endpoint added
- [ ] Original files preserved
- [ ] Tests passing
- [ ] Markers present

