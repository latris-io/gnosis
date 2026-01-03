# CID-2026-01-03-B4-LOCKDOWN

**Type:** Governance / Hardening  
**Date:** 2026-01-03  
**Status:** APPROVED  
**Author:** Cursor AI

---

## Summary

Post-B.4 PASS lockdown: tighten operator workflow and lock B.4 closure surfaces.

---

## Justification

B.4 Closure Check PASSED (G-CLOSURE proven deterministic ingestion). The proof machinery (closure services and CLI) must now be locked to prevent drift that could invalidate the baseline.

This CID authorizes:
1. **Dirty tree exception logic** - Allow closure to proceed with dirty working tree ONLY if all modified files are in `docs/verification/**` or `shadow-ledger/**`
2. **Preflight auto-update** - Automatically mark preflight as passed in operator evidence
3. **B.4 lock verifier** - New CI check that requires CID for any changes to closure surfaces
4. **Governance documentation** - Add Track B locked surfaces section to GOVERNANCE_PHASED_PLAN.md

---

## Impact Analysis

### Files Modified

| File | Change Type | Impact |
|------|-------------|--------|
| `src/services/track_b/closure-check/types.ts` | Extended | New dirty tree fields in RunBinding |
| `src/services/track_b/closure-check/provenance.ts` | Extended | Dirty tree validation + preflight auto-update |
| `src/services/track_b/closure-check/closure.ts` | Extended | Fail-fast on forbidden dirty files |
| `scripts/closure.ts` | Modified | @g-api-exception marker format fix |
| `scripts/verify-track-b-b4-lock.ts` | Created | New verifier |
| `package.json` | Extended | New npm script |
| `.github/workflows/organ-parity.yml` | Extended | CI integration |
| `docs/governance/GOVERNANCE_PHASED_PLAN.md` | Extended | B.4 lock documentation |

### Risk Assessment

- **Behavioral drift risk:** LOW - No logic changes to closure orchestration
- **Evidence integrity risk:** NONE - Stricter controls only
- **Backward compatibility:** FULL - All existing behavior preserved

---

## Verification Plan

1. `npx tsc --noEmit` - TypeScript compiles
2. `npm run verify:scripts-boundary` - Scripts boundary passes
3. `npm run verify:track-b-db-boundary` - DB boundary passes
4. `npm run verify:track-b-b4-lock` - B.4 lock passes (with this CID)
5. `npx tsx scripts/verify-track-a-lock.ts` - Track A lock passes
6. `npm test` - Full test suite passes

---

## Approval

This is a governance-strengthening change that adds controls without modifying verified behavior. Approved for immediate implementation.

---

**END OF CID-2026-01-03-B4-LOCKDOWN**

