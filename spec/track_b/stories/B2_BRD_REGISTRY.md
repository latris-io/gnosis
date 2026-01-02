# Story B.2: BRD Registry

**Track:** B (Zero Drift)  
**Duration:** ~2 days  
**Gate:** G-REGISTRY

---

## User Story

**As a** traceability system  
**I want** to parse the authoritative BRD  
**So that** I know exactly what requirements exist

---

## Acceptance Criteria

| AC | Description | Pillar |
|----|-------------|--------|
| AC-B.2.1 | Parse markdown BRD → Extract epics/stories/ACs | — |
| AC-B.2.2 | Store BRD version with content hash | — |
| AC-B.2.3 | Compare BRD stories to graph stories via API | API |
| AC-B.2.4 | G-REGISTRY gate: fail on mismatch | Gate |
| AC-B.2.5 | Log BRD parsing to shadow ledger | Shadow |

---

## Technical Details

### BRD Parsing

Track A already extracts E01 Epic, E02 Story, E03 AcceptanceCriterion.

Track B adds:
- BRD version tracking
- Content hash per BRD file
- Registry comparison logic

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
| BRD parser | Track A (reuse) |

---

## Definition of Done

- [ ] BRD parsing enhanced for registry
- [ ] Version/hash tracking implemented
- [ ] Comparison endpoint added
- [ ] G-REGISTRY gate implemented
- [ ] Shadow ledger logging added
- [ ] Tests passing
- [ ] Markers present

