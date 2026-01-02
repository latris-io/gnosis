# Track B Exit Criteria

**Track:** B (Zero Drift)  
**Gate:** HGR-2

---

## Required Before Track B Can Exit

### Story Completion

- [ ] B.1 Ground Truth Engine complete
- [ ] B.2 BRD Registry complete
- [ ] B.3 Drift Detection complete
- [ ] B.4 Closure Check complete
- [ ] B.5 Shadow Ledger Migration complete
- [ ] B.6 Graph API v2 complete
- [ ] B.7 Semantic Corpus Export complete

### Gate Verification

- [ ] G-HEALTH passing (system health metrics nominal)
- [ ] G-REGISTRY passing (BRD registry complete and queryable)
- [ ] G-DRIFT passing (zero drift between ingestions)
- [ ] G-CLOSURE passing (re-ingestion produces identical graph)

### Infrastructure

- [ ] Shadow ledger migrated to graph
- [ ] Graph API v2 exposed and documented
- [ ] ≥100 semantic signals captured (A + B total)
- [ ] Semantic corpus exported and validated

### Verification

- [ ] G-API: No direct database access in Track B code
- [ ] All 8 gates passing (4 Track A + 4 Track B)
- [ ] All Track B ACs mapped to implementation (R19)
- [ ] All Track B ACs mapped to tests (R37)

---

## Exit Verification Commands

```bash
# All Track A gates still passing
TRACK_A_PHASE=A4 npm run verify:track-milestone

# Track B gates
npm run verify:track-b-gates

# Full test suite
npm test

# Closure check
npm run verify:closure

# Drift check
npm run verify:drift
```

---

## Exit Certification

```
I, [Name], certify that:

1. [ ] All Track B stories are complete
2. [ ] All 8 gates are passing
3. [ ] Shadow ledger is migrated to graph
4. [ ] Closure check succeeds
5. [ ] Track B is ready for HGR-2

Signature: _____________
Date: _____________
Role: _____________
```

