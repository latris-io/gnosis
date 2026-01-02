# Story B.4: Closure Check

**Track:** B (Zero Drift)  
**Duration:** ~1 day  
**Gate:** G-CLOSURE

---

## User Story

**As a** traceability system  
**I want** to verify re-ingestion produces identical results  
**So that** extraction is proven deterministic

---

## Acceptance Criteria

| AC | Description | Pillar |
|----|-------------|--------|
| AC-B.4.1 | Re-run extraction pipeline | — |
| AC-B.4.2 | Compare resulting graph to stored graph | — |
| AC-B.4.3 | G-CLOSURE gate: fail if graphs differ | Gate |
| AC-B.4.4 | Report exact differences if any | — |
| AC-B.4.5 | Log closure check to shadow ledger | Shadow |

---

## Technical Details

### Closure Verification Process

1. Store current graph state (snapshot)
2. Clear extraction artifacts
3. Re-run full extraction pipeline
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
| Graph snapshots | B.3 |
| All entities/relationships | Graph API v1 |

---

## Definition of Done

- [ ] Re-extraction mechanism implemented
- [ ] Graph comparison logic working
- [ ] G-CLOSURE gate implemented
- [ ] Difference reporting added
- [ ] Shadow ledger logging added
- [ ] Tests passing
- [ ] Markers present

