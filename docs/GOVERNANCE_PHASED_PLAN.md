# Governance Phased Plan

**Version:** 1.0.0  
**Authority:** Gnosis Project Governance  
**Last Updated:** 2026-01-02

---

## Overview

This document defines the phased rollout of organ document governance enforcement in the Gnosis project. Governance ensures that organ documents (BRD, UTG, Verification Spec, Roadmap, Cursor Plan, EP-D-002) remain consistent, versioned, and change-controlled.

---

## Phase Definitions

### Phase 0: Advisory Mode (COMPLETE)
- **Status:** COMPLETE
- **Behavior:** Organ parity warnings do not block CI
- **Exit Code:** 0 (regardless of warnings)
- **Purpose:** Establish baseline, identify drift, allow fixes without breaking builds

### Phase 1: Enforcement Mode (ACTIVE)
- **Status:** ACTIVE
- **Activated:** 2026-01-02
- **Trigger:** Track A EXIT candidate + HGR-1 complete
- **Behavior:**
  - `GOVERNANCE_PHASE=1` enforced in CI
  - Organ parity hard-fails on any warning or failure
  - CID enforcement active for organ doc changes
- **Exit Code:** 1 if any warning or failure detected

### Phase 2: Strict Mode (PLANNED)
- **Status:** PLANNED
- **Behavior:** All governance checks required for merge
- **Additional:** Pre-commit hooks, automated CID validation

---

## §6 Organ Parity Verification

The organ parity verification script (`scripts/verify-organ-parity.ts`) enforces:

1. **End-Marker Parity:** Header version must match end-marker version
2. **No Forward References:** No references to future versions
3. **Invariant Counts:** BRD/UTG/Gate counts must match canonical values
4. **Story Card Consistency:** No references to non-existent versions

### Environment Variable

```bash
GOVERNANCE_PHASE=0  # Advisory mode (default)
GOVERNANCE_PHASE=1  # Enforcement mode (CI)
```

### Excluded Companion Documents

The following documents are **not** versioned organ artifacts and are excluded from organ parity checks:

| Document | Reason |
|----------|--------|
| `docs/BRD_FORMAT_SPECIFICATION.md` | Companion doc (format spec), not a versioned organ artifact. Excluded by governance decision B. |

---

## §7 CID Enforcement

Changes to organ-governed documents require a CID (Change Issue Document) reference.

### Organ-Governed Document Set

Files matching these patterns are organ-governed:
- `docs/BRD_*.md` (except `BRD_FORMAT_SPECIFICATION.md`)
- `docs/UNIFIED_TRACEABILITY_GRAPH_SCHEMA_*.md`
- `docs/UNIFIED_VERIFICATION_SPECIFICATION_*.md`
- `docs/GNOSIS_TO_SOPHIA_MASTER_ROADMAP_*.md`
- `docs/CURSOR_IMPLEMENTATION_PLAN_*.md`
- `docs/integrations/EP-*.md`

### Enforcement Rule

If any organ-governed doc is modified in a commit/PR:
- Commit message OR PR title/body MUST contain `CID-` reference
- Example: `docs: update BRD counts per CID-2026-01-02-001`

### CI Enforcement

The script `scripts/verify-cid-for-organ-changes.ts` runs in CI and fails if:
- Organ docs changed AND no `CID-` reference found

---

## Phase 1 Activation Record

| Field | Value |
|-------|-------|
| Phase | 1 (Enforcement) |
| Activated | 2026-01-02 |
| Activated By | Governance decision after Track A exit candidate |
| Trigger | Track A EXIT candidate + HGR-1 complete |

### Operational Changes

1. **CI Enforcement:** `GOVERNANCE_PHASE=1` in `.github/workflows/organ-parity.yml`
2. **Hard Failures:** Any organ parity warning or failure blocks merge
3. **CID Required:** Organ doc changes require `CID-` in commit message

### Exclusions Documented

- `docs/BRD_FORMAT_SPECIFICATION.md` is a **companion doc** (format specification)
- It is explicitly excluded from organ parity checks by governance decision B
- It does NOT require CID for changes (not an organ artifact)

---

## References

- `scripts/verify-organ-parity.ts` — Organ parity verification
- `scripts/verify-cid-for-organ-changes.ts` — CID enforcement
- `.github/workflows/organ-parity.yml` — CI workflow

---

**END OF GOVERNANCE PHASED PLAN V1.0.0**

