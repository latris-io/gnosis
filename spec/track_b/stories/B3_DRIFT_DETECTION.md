# Story B.3: Drift Detection

**Track:** B (Zero Drift)  
**Duration:** ~2 days  
**Gate:** G-DRIFT

---

## User Story

**As a** traceability system  
**I want** to detect changes between builds  
**So that** regressions are caught

---

## Acceptance Criteria

| AC | Description | Pillar |
|----|-------------|--------|
| AC-B.3.1 | Create GraphSnapshot with Merkle root | — |
| AC-B.3.2 | Diff snapshots: adds, deletes, mutations | — |
| AC-B.3.3 | G-DRIFT gate: fail if unexpected changes | Gate |
| AC-B.3.4 | Drift report via Graph API v2 | API |
| AC-B.3.5 | Log drift detection to shadow ledger | Shadow |

---

## Technical Details

### GraphSnapshot

```typescript
interface GraphSnapshot {
  id: string;
  created_at: string;
  commit_sha: string;
  entity_merkle_root: string;
  relationship_merkle_root: string;
  entity_count: number;
  relationship_count: number;
}
```

### Diff Computation

Compare two snapshots:
- Entities added (new IDs)
- Entities deleted (missing IDs)
- Entities mutated (same ID, different hash)
- Relationships added/deleted/mutated

### Drift Report

```typescript
interface DriftReport {
  snapshot_a: string;
  snapshot_b: string;
  drift_detected: boolean;
  summary: {
    entities_added: number;
    entities_deleted: number;
    entities_mutated: number;
    relationships_added: number;
    relationships_deleted: number;
    relationships_mutated: number;
  };
  details: DriftItem[];
}
```

---

## Dependencies

| Dependency | Source |
|------------|--------|
| All entities | Graph API v1 |
| All relationships | Graph API v1 |
| E50 Commit | Graph API v1 |

---

## Definition of Done

- [ ] Snapshot creation implemented
- [ ] Diff algorithm working
- [ ] G-DRIFT gate implemented
- [ ] Drift report endpoint added
- [ ] Shadow ledger logging added
- [ ] Tests passing
- [ ] Markers present

