# A3 End-of-Phase SI Checkpoint

**Purpose:** Lightweight verification gate to confirm SI-readiness after A3 (Marker Extraction) completion.

---

## Required Checks

Before marking A3 complete, verify:

### 1. Milestone Verification
```bash
TRACK_A_PHASE=A3 npm run verify:track-milestone
```
- [ ] All expected entity counts match
- [ ] All expected relationship counts match
- [ ] Cross-store parity confirmed

### 2. Ledger Delta Coverage
- [ ] N/A (no dedicated ledger-delta verifier yet)
- [ ] Manual check (A3 run): confirm `shadow-ledger/ledger.jsonl` contains CREATE/UPDATE entries for R18/R19 and DECISION entries for TDD_COHERENCE_OK / TDD_COHERENCE_MISMATCH / ORPHAN outcomes
- [ ] Confirm no NO-OP entries were logged (A3 requirement)
- [ ] Confirm `project_id` present on entries (multi-tenant isolation)
- [ ] Confirm deterministic IDs: `relationship_instance_id` / `signal_instance_id` stable across a rerun

### 3. Semantic Corpus Verification
- [ ] If orphans exist: corpus contains ORPHAN_MARKER signals with deterministic `signal_instance_id`
- [ ] OR: Proof that orphan count = 0
- [ ] Replay check: rerun A3 on same snapshot/project and confirm no duplicate ORPHAN_MARKER signals (idempotent upsert)

### 4. G-API Boundary
```bash
npm run verify:scripts-boundary
```
- [ ] Passes with exit 0 (or only documented @g-api-exception files skipped)

---

## A3 Expected Counts

| Entity/Relationship | Expected | Notes |
|---------------------|----------|-------|
| Marker relationships | **R18/R19 only** | R36/R37 deferred to A4 TEST-REL; counts must match milestone expectations |
| ORPHAN_MARKER signals | 0 or documented | If >0, must be in corpus with deterministic IDs |

---

## Sign-off

| Check | Status | Verified By | Date |
|-------|--------|-------------|------|
| Milestone Verification | [ ] PASS / [ ] FAIL | | |
| Ledger Delta Coverage | [ ] PASS / [ ] FAIL | | |
| Semantic Corpus | [ ] PASS / [ ] FAIL | | |
| G-API Boundary | [ ] PASS / [ ] FAIL | | |

**A3 SI-Ready:** [ ] YES / [ ] NO

---

*This checkpoint may run fresh extraction depending on `verify:track-milestone` implementation; it does not require a full manual re-extraction workflow.*

