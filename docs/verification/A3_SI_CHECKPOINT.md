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
| Marker relationships | **R18/R19/R36/R37** | All A3 scope per BRD AC-64.3.4/5 (CID-2025-12-27-001) |
| ORPHAN_MARKER signals | 0 or documented | If >0, must be in corpus with deterministic IDs |

---

## Sign-off

| Check | Status | Verified By | Date |
|-------|--------|-------------|------|
| Milestone Verification | [x] PASS | Cursor | 2025-12-25 |
| Ledger Delta Coverage | [x] PASS | Cursor | 2025-12-25 |
| Semantic Corpus | [x] PASS | Cursor | 2025-12-25 |
| G-API Boundary | [x] PASS | Cursor | 2025-12-25 |

**A3 SI-Ready:** [x] YES

### Verification Details

- **Milestone**: 27/39 passed, 0 failed, 12 skipped (documented A4 gaps)
- **Ledger**: 40 R18/R19 CREATE, 62 TDD_COHERENCE_OK/MISMATCH, 22 ORPHAN decisions, 0 NO-OP
- **Corpus**: 22 ORPHAN_MARKER signals (matches 22 ORPHAN decisions ✓)
- **G-API**: Clean (1 documented legacy exception)

### Replay Check (Idempotency Proof)

```
Run 1: 93 extracted, 31 R18, 9 R19, 22 orphans
Run 2: 93 extracted, 0 R18, 0 R19 (all NO-OP)
Corpus: 22 ORPHAN_MARKER before and after (idempotent)
```

- `count(distinct signal_instance_id) == count(ORPHAN_MARKER signals)` ✓
- Rerun produces **0 new** R18/R19 relationships ✓
- Rerun produces **0 new** ORPHAN_MARKER signals ✓

### Bug Fixed During Checkpoint

- **semantic-corpus.ts**: Added deduplication by `signal_instance_id` to ensure idempotent signal capture

---

*This checkpoint may run fresh extraction depending on `verify:track-milestone` implementation; it does not require a full manual re-extraction workflow.*

