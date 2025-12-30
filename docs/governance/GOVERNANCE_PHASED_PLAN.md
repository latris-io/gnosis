# Phased Governance Plan for Gnosis → Sophia

**Version:** 1.0.0
**Date:** December 19, 2025
**Status:** ACTIVE (Phase 0)
**Classification:** Meta-Governance Document

---

## 1. Executive Summary

### The "Needle Threading" Problem

- Track A is ~60% complete with active development; heavy governance now would slow convergence for no leverage
- Organ documents have known version drift (end-markers, cross-references) that could propagate as false ground truth
- LLMs drift unless constrained; humans under pressure make local fixes; governance without enforcement fails
- HGR-2 ("oracle transition") is the point of no return — after which the system trusts its own outputs as truth
- The window between "too early" (friction) and "too late" (corrupted foundation) is narrow

### Guiding Principle

> **"Fast during convergence, immutable before oracle, enforceable always."**

---

## 2. Terminology & Authority Boundary

### Organ Documents (Truth-Bearing, Governed)

**Definition:** Canonical documents that define system truth. These are the ONLY source of requirements, schema, verification criteria, and execution constraints.

**The Six Governed Organ Docs:**

| # | Document | File | Version |
|---|----------|------|---------|
| 1 | Business Requirements Document | `docs/BRD_V20_6_4_COMPLETE.md` | V20.6.4 |
| 2 | Unified Traceability Graph Schema | `docs/UNIFIED_TRACEABILITY_GRAPH_SCHEMA_V20_6_1.md` | V20.6.1 |
| 3 | Unified Verification Specification | `docs/UNIFIED_VERIFICATION_SPECIFICATION_V20_6_6.md` | V20.6.6 |
| 4 | Gnosis → Sophia Master Roadmap | `docs/GNOSIS_TO_SOPHIA_MASTER_ROADMAP_V20_6_4.md` | V20.6.4 |
| 5 | Cursor Implementation Plan | `docs/CURSOR_IMPLEMENTATION_PLAN_V20_8_5.md` | V20.8.5 |
| 6 | Extension Protocols | `docs/integrations/EP-*.md` | V20.6.1 |

### Track Documents (Execution Artifacts, Non-Authoritative)

**Definition:** Files that implement, test, or guide execution of organ doc requirements. These must NEVER redefine canon.

**Includes:**
- `spec/track_a/*.md` (ENTRY, EXIT, PROMPTS, story cards)
- `spec/00_pre_track_validation/*.md`
- `test/**/*.ts`
- `src/**/*.ts`
- `scripts/**/*.ts`
- `migrations/**/*.sql`

**Authority Rule:** Track docs may only move toward **stricter fidelity** to organ docs — never looser.

---

## 3. Governance Document Classification

### This Document's Classification

`GOVERNANCE_PHASED_PLAN.md` is classified as **meta-governance** — neither an organ doc nor a track doc.

**Rationale:**
- It governs how organ docs are governed, not system requirements
- It must evolve with process learnings without triggering full CID ceremony
- It defines enforcement rules but is not itself a source of system truth

**Update Rules:**
- Does NOT require CID for internal refinements
- Wording changes that do not affect scope, authority, or enforcement semantics do not require CID
- Requires CID ONLY when changing phase triggers, enforcement rules, or authority boundaries
- Changes must be logged in the Version History section below

---

## 4. The Three-Phase Governance Model

### Phase 0 — Convergence Guardrails (CURRENT)

**Trigger:** Project start through Track A convergence
**Status:** ACTIVE

**Goals:**
- Enable fast iteration during Track A development
- Detect drift without blocking progress
- Establish baseline parity measurements

**Enforcement:**
- **All organ doc checks are WARNING-ONLY** (no blocking)
- Full organ counts (83 entities, 114 relationships, 21 gates) → warn only
- Track A subset counts (16 entities, 24 relationships, 6 gates) → warn only
- Version parity checks → warn only
- End-marker checks → warn only

**Allowed Changes:**
- Track doc modifications without ceremony
- Bug fixes to extraction/validation code
- Infrastructure improvements

**Forbidden Changes:**
- Silent organ doc modifications (requires CID even in Phase 0)
- Weakening of SANITY test assertions
- Removal or skipping of existing tests

**Required Artifacts:**
- `verify-organ-parity.ts` producing warnings
- CID for any organ doc change (lightweight)

**CI Enforcement:**
- `npm run verify:organ-parity` outputs warnings, exit 0
- No merge blocking

**Exit Criteria (trigger to Phase 1):**
- Track A declared exit-candidate, OR
- First parity-blocking violations are desired by developer

---

### Phase 1 — Pre-HGR-1 Hardening

**Trigger:** Track A exit-candidate declared
**Status:** PENDING

**Goals:**
- Stabilize organ doc semantics
- Enforce parity before human gate review
- Prevent drift from entering HGR-1 review

**Enforcement:**
- **Parity violations become BLOCKING**
- CID required for ANY organ doc change
- Version references must be synchronized across all docs

**Allowed Changes:**
- Organ doc changes with CID approval
- Track doc refinements that increase fidelity

**Forbidden Changes:**
- Organ doc changes without CID
- Forward version references
- Weakening assertions in SANITY suite

**Required Artifacts:**
- All Phase 0 artifacts
- CID log with change history
- Parity report showing zero violations

**CI Enforcement:**
- `npm run verify:organ-parity` exits non-zero on violations
- Merge blocked until parity passes

**Exit Criteria:**
- HGR-1 human gate approved

---

### Phase 2 — Oracle Transition Controls (Pre-HGR-2)

**Trigger:** HGR-1 approved
**Status:** PENDING

**Goals:**
- Treat organ docs as effectively immutable
- Prevent backward truth mutation
- Ensure historical integrity for oracle transition

**Enforcement:**
- Organ docs treated as **immutable historical truth**
- CID + HGR-ORG-1 human gate required for any change
- Backward truth mutation explicitly forbidden
- Historical integrity verification required

**Allowed Changes:**
- Only critical corrections with full CID + HGR-ORG-1 approval
- Typo fixes that don't affect semantics (with CID)

**Forbidden Changes:**
- ANY semantic change without HGR-ORG-1
- Retroactive count adjustments
- Version number changes without full re-verification

**Required Artifacts:**
- Immutable snapshot of organ docs at HGR-1
- Full parity verification log
- CID chain showing all changes since Phase 0

**CI Enforcement:**
- Organ doc changes trigger mandatory review workflow
- Automated hash verification against HGR-1 snapshot

**Exit Criteria:**
- HGR-2 approved (oracle transition complete)

---

## 5. Minimal Artifacts to Create NOW

### Required Files

| File | Purpose | Size |
|------|---------|------|
| `docs/governance/GOVERNANCE_PHASED_PLAN.md` | This document | ~400 lines |
| `docs/governance/ORGAN_VERSIONING_RULES.md` | Version parity rules | ~50 lines |
| `docs/governance/CID_TEMPLATE.md` | Change impact declaration template | ~30 lines |
| `scripts/verify-organ-parity.ts` | CI-enforceable parity checker | ~200 lines |

### Optional (Recommended)

| File | Purpose | Size |
|------|---------|------|
| `docs/governance/CID_LOG.md` | Running log of CIDs | grows |

---

## 6. CI Enforcement Design

### `verify-organ-parity.ts` Specification

**Files Read:**
- All six organ docs (glob: `docs/BRD_*.md`, `docs/UNIFIED_*.md`, `docs/GNOSIS_*.md`, `docs/CURSOR_*.md`, `docs/integrations/EP-*.md`)
- Story cards (glob: `spec/track_a/stories/*.md`)

**Data Extracted:**
- Header version (regex: `\*\*Version:\*\* (\d+\.\d+\.\d+)`)
- End-marker version (regex: `\*\*END OF .+ V(\d+\.\d+\.\d+)\*\*`)
- Cross-reference versions (regex: `V(\d+\.\d+\.\d+)`)
- Invariant counts from BRD/UTG/Verification spec

**Invariants Checked:**

| Check | Description | Phase 0 | Phase 1+ |
|-------|-------------|---------|----------|
| `endmarker-parity` | Header version matches end-marker | warn | fail |
| `no-forward-refs` | No references to non-existent versions | warn | fail |
| `brd-counts` | 65 epics, 351 stories, 2849 ACs | warn | fail |
| `utg-entity-count` | 83 entities | warn | fail |
| `utg-relationship-count` | 114 relationships | warn | fail |
| `gate-count` | 21 gates | warn | fail |
| `crossref-consistency` | All organ docs reference compatible versions | warn | fail |

**Phase Detection:**
```bash
GOVERNANCE_PHASE=0 npm run verify:organ-parity  # warnings only
GOVERNANCE_PHASE=1 npm run verify:organ-parity  # failures block
```

**Output Format:**
```
[PHASE 0] Organ Parity Verification
=====================================

WARN: roadmap-endmarker
  File: docs/GNOSIS_TO_SOPHIA_MASTER_ROADMAP_V20_6_4.md
  Header: V20.6.4
  End-marker: V20.6.3
  Action: Update end-marker to V20.6.4

PASS: brd-counts (65/351/2849)
PASS: utg-entity-count (83)
...

Summary: 2 warnings, 0 failures
Exit: 0 (Phase 0 = warnings only)
```

---

## 7. CID Rules (Phased)

### What is a CID?

A **Change Impact Declaration** (CID) is a lightweight, machine-checkable record that:
- Identifies what organ doc is being changed
- States the semantic impact (or lack thereof)
- Provides traceability for audit

### CID Requirements by Phase

| Phase | When Required | Format |
|-------|---------------|--------|
| 0 | Semantic organ doc changes only | `CID-YYYY-NNN` in commit message |
| 1 | ANY organ doc change | `CID-YYYY-NNN` in commit message + CID_LOG.md entry |
| 2 | ANY organ doc change | `CID-YYYY-NNN` + CID_LOG.md + HGR-ORG-1 approval |

### CID Template

See `docs/governance/CID_TEMPLATE.md` for the standard format.

### What Does NOT Require CID

- Track doc changes (ENTRY, EXIT, story cards, TDDs)
- Source code changes
- Test changes (unless they weaken assertions)
- Migration changes
- This governance document (unless changing enforcement rules)

---

## 8. Anti-Drift Rules for Track Docs / TDDs

### Execution Discipline Rules

1. **No skip/early return** — Tests must run to completion
2. **Exact expected counts** — Use `===`, never `>=` or `<=`
3. **No weakening assertions** — Existing tests may not be relaxed
4. **Canonical ID references only** — Use organ doc IDs, not local aliases
5. **Explicit escalation triggers** — When track doc conflicts with organ doc, escalate

### Red-Flag Patterns (CI Detectable)

| Pattern | Regex | Severity |
|---------|-------|----------|
| Skipped tests | `it\.skip\|describe\.skip\|test\.skip` | error |
| Focused tests | `\.only\(` | error |
| Weakened assertions | `expect\(.+\)\.toBeGreaterThanOrEqual` | warn |
| Forward version refs | `V20\.7\.\|V20\.8\.\|V21\.` | error |
| Missing markers | Files without `@implements` | warn |
| Organ doc edits | `git diff.*docs/(BRD\|UNIFIED\|GNOSIS\|CURSOR)` | require CID |

### Escalation Protocol

If a track doc appears to conflict with an organ doc:
1. HALT implementation
2. Document the conflict with specific file:line references
3. Do NOT "fix" the organ doc
4. Escalate to human for resolution
5. If organ doc is wrong, create CID to fix it

---

## 9. Transition Triggers

### Phase 0 → Phase 1

**Concrete Triggers (ANY of these):**
- All Track A stories (A1-A5) marked complete in EXIT.md
- `npm run validate:a5` passes
- Developer explicitly declares: "Track A exit-candidate"
- Developer requests parity enforcement

**NOT a Trigger:**
- Calendar date
- Percentage complete estimate
- Passing SANITY suite alone

### Phase 1 → Phase 2

**Concrete Triggers (ALL required):**
- HGR-1 human gate form completed and approved
- Zero parity violations in `verify-organ-parity.ts`
- All CIDs logged and reviewed
- Organ doc snapshot created and hashed

---

## 10. Implementation Roadmap

### Step-by-Step Adoption Plan

| Step | Task | Time | Files | Rollback |
|------|------|------|-------|----------|
| 1 | Create `docs/governance/` directory | 5 min | mkdir | rm -rf |
| 2 | Write `GOVERNANCE_PHASED_PLAN.md` | 60 min | this file | delete |
| 3 | Write `ORGAN_VERSIONING_RULES.md` | 20 min | 1 file | delete |
| 4 | Write `CID_TEMPLATE.md` | 15 min | 1 file | delete |
| 5 | Implement `verify-organ-parity.ts` | 90 min | 1 file | delete |
| 6 | Add `verify:organ-parity` to package.json | 5 min | 1 line | revert |
| 7a | Fix end-marker drift (CID-2025-001) | 10 min | 2 organ docs | revert |
| 7b | Fix V20.7.0 story refs (CID-2025-001) | 15 min | 5 story cards | revert |
| 8 | Run parity verification | 10 min | - | - |

**Total:** ~4 hours (solo developer)

### Deferred to Phase 1

- Source/test file V20.6.4 → V20.6.5 refs (cosmetic, non-blocking)
- Pre-commit hook setup (husky)
- GitHub Actions CI workflow

---

## Critical Guardrail: No Auto-Fix Rule

**RULE-NOAUTOFIX-001:** CI tools and scripts may detect and report organ doc drift, but must NEVER automatically modify organ documents. All corrections require explicit human action.

**Rationale:**
- LLMs tend to "helpfully fix" mismatches without authorization
- Auto-fixing is how historical truth gets silently rewritten
- Detection ≠ mutation must be explicit and enforced
- This protects against both well-intentioned automation and hostile drift

**Enforcement:**
- `verify-organ-parity.ts` outputs diagnostics only, never writes files
- Any script that modifies `docs/*.md` must require `--confirm` flag
- Pre-commit hooks may block, but never auto-correct organ docs

---

## Version History

| Version | Date | Changes | CID |
|---------|------|---------|-----|
| 1.0.0 | 2025-12-19 | Initial governance plan | - |

---

**END OF GOVERNANCE_PHASED_PLAN V1.0.0**

