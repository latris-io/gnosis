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
```bash
npm run verify:scripts-boundary
```
- [ ] Passes with exit 0
- [ ] Ledger delta coverage = 100% for A3 mutations
- [ ] No silent writes detected

### 3. Semantic Corpus Verification
- [ ] Semantic corpus contains ORPHAN_MARKER signals if orphans exist
- [ ] OR: Proof that orphan count = 0

### 4. G-API Boundary
```bash
npm run verify:scripts-boundary
```
- [ ] Passes with exit 0 (or only documented @g-api-exception files skipped)

---

## A3 Expected Counts

| Entity/Relationship | Expected | Notes |
|---------------------|----------|-------|
| Marker relationships | TBD | R18/R19/R36/R37 per schema |
| ORPHAN_MARKER signals | 0 or documented | If >0, must be in corpus |

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

*This checkpoint does NOT require full re-extraction. It is a lightweight verification gate.*
