# Track B Exit Criteria

**Track:** B (Zero Drift)  
**Gate:** HGR-2  
**Exit Tag:** `track-b-green`

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
- [ ] **All Track A gates + all Track B gates pass**
- [ ] Track B TDDs registered as E06 nodes
- [ ] Track B TDDs linked to implementation via R14

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

# TDD registry verification
npm run verify:tdd-registry
```

---

## HGR-2 Readiness Checklist

Before requesting HGR-2 approval:

- [ ] All exit criteria above are met
- [ ] Track B closeout packet prepared (`docs/verification/track_b/B_CLOSEOUT_PACKET_*.md`)
- [ ] Shadow ledger vs Gnosis graph: 100% match confirmed
- [ ] Closure check: deterministic ingestion confirmed
- [ ] Semantic corpus quality requirements met
- [ ] Post-implementation verifiers pass:
  - `npm run verify:tdd-registry`
  - `npm run verify:track-b-requirement-mapping`

---

## Oracle Transition Acknowledgment

**This transition is IRREVERSIBLE.**

After HGR-2 approval:
- Gnosis becomes the oracle
- Bootstrap scripts are retired
- External validation is no longer authoritative

See: `spec/track_b/HUMAN_GATE_HGR2.md`

---

## Evidence Artifacts Required

All evidence must be under `docs/verification/track_b/**`:

- `B_CLOSEOUT_PACKET_<date>.md` — Summary of Track B completion
- `TDD_REGISTRY_VERIFICATION.md` — E06 nodes and R14 links
- `REQUIREMENT_TDD_CODE_MAPPING.md` — Traceability chain (if BRD IDs referenced)
- Per-story evidence as needed

---

## Exit Certification

```
I, [Name], certify that:

1. [ ] All Track B stories are complete
2. [ ] All Track A gates + all Track B gates pass
3. [ ] Shadow ledger is migrated to graph
4. [ ] Closure check succeeds
5. [ ] Track B is ready for HGR-2

Signature: _____________
Date: _____________
Role: _____________
```
