# Track B Entry Criteria

**Track:** B (Zero Drift)  
**Prerequisite Gate:** HGR-1.1 (Track A Extension)

---

## Required Before Track B Can Begin

### Track A Completion

- [ ] Track A complete (A1–A5)
- [ ] HGR-1 approved (A1–A3 baseline)
- [ ] HGR-1.1 approved (A4–A5 extension)
- [ ] Final baseline tag: `track-a5-green`

### Infrastructure

- [ ] Graph API v1 operational
- [ ] PostgreSQL + Neo4j parity confirmed
- [ ] Shadow ledger from Track A intact and valid

### Verification

- [ ] All Track A gates passing
- [ ] Core Sanity Suite passes on Track A graph
- [ ] ≥50 semantic signals captured
- [ ] All ACs mapped to implementation (R19 SATISFIES)
- [ ] All ACs mapped to tests (R37 VERIFIED_BY)

### Governance

- [ ] Phase-1 governance active (organ parity hard-fail)
- [ ] Track A lock enforcement active
- [ ] `.current-track` updated to `B`

---

## Entry Verification Commands

```bash
# Track A verification
TRACK_A_PHASE=A4 npm run verify:track-milestone

# Sanity suite
npm run test:sanity

# Full test suite
npm test

# Organ parity
npm run verify:organ-parity

# Scripts boundary
npm run verify:scripts-boundary

# Marker governance
npm run lint:markers
```

All must pass before proceeding.

---

## Entry Certification

```
I, [Name], certify that:

1. [ ] All Track A exit criteria are met
2. [ ] HGR-1.1 is approved
3. [ ] All entry verification commands pass
4. [ ] Track B can proceed

Signature: _____________
Date: _____________
Role: _____________
```

