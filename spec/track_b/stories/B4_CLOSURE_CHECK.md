---
tdd:
  id: TDD-TRACKB-B4
  type: TechnicalDesign
  version: "1.0.0"
  status: planned
---

# Story B.4: Closure Check

**Track:** B (Zero Drift)  
**Duration:** ~1 day  
**Gate:** G-CLOSURE  
**TDD ID:** `TDD-TRACKB-B4`

---

## Purpose

Verify that re-ingestion produces identical results, proving the extraction pipeline is deterministic.

---

## Entry Criteria

- [ ] B.3 Drift Detection complete
- [ ] `GRAPH_API_V2_URL` environment variable configured
- [ ] Track A pipeline accessible via `src/ops/track-a.ts`
- [ ] Pre-B.4 preflight passed: `npx tsx scripts/preb4-preflight.ts`

---

## Freeze the World (Run Binding Contract)

**B.4 enforces these invariants throughout both ingestion phases:**

| Binding | Requirement | Enforcement |
|---------|-------------|-------------|
| **GIT_SHA** | Must be constant across both phases | Captured at run start; validated before Phase 2 |
| **PROJECT_ID** | Must be constant | Environment variable; recorded in evidence |
| **GRAPH_API_V2_URL** | Must be constant and healthy | Health check before each phase |
| **Working tree** | Must be clean (no uncommitted changes) | `git status --porcelain` empty |
| **No concurrent writers** | No other process may write to PROJECT_ID graph | Operator attestation in evidence template |

**If any binding is violated, B.4 MUST abort with failure.**

---

## Settle Window Requirement

**Mandatory 3-second settle window after each pipeline completion.**

| When | Why |
|------|-----|
| After Phase 1 extraction completes | Prevents "last write arrives after completion" drift |
| After Phase 2 re-ingestion completes | Ensures all writes are flushed before snapshot |

The settle window is a hard requirement, not a suggestion. Timing races are a known source of false closure failures.

---

## Provenance Preconditions

**B.4 requires these artifacts to exist before the run:**

| Artifact | Path | Purpose |
|----------|------|---------|
| Operator Evidence (template) | `docs/verification/track_b/templates/B4_OPERATOR_EVIDENCE_TEMPLATE.md` | Binding fields and checklist |
| Extraction Provenance | `docs/verification/track_b/EXTRACTION_PROVENANCE.md` | Baseline definition |

**The operator MUST complete the evidence template before starting B.4.**

---

## Operator Evidence Template

The operator evidence file must contain:

```yaml
Required Fields:
  - PROJECT_ID
  - GIT_SHA (full 40 chars)
  - GIT_BRANCH
  - WORKING_TREE_CLEAN (true/false)
  - GRAPH_API_V2_URL
  - run_id (B4-CLOSURE-<timestamp>)
  - Phase 1 timestamp + snapshot ID + Merkle roots
  - Phase 2 timestamp + snapshot ID + Merkle roots
  - G-CLOSURE result (PASS/FAIL)
  - Operator attestation (no concurrent writers)
```

Template location: `docs/verification/track_b/templates/B4_OPERATOR_EVIDENCE_TEMPLATE.md`

---

## Scope

### In Scope

- Re-running extraction pipeline
- Graph comparison (instance IDs, properties)
- G-CLOSURE gate implementation
- Difference reporting
- Shadow ledger logging for closure checks

### Out of Scope

- Modification of Track A extraction logic
- Changes to existing entity schemas
- Direct database access

---

## Related Canonical Requirements (Optional; BRD-only)

None.

This Track B capability (Closure Check) is defined by the Roadmap Track B scope, not by a specific BRD requirement.

---

## Execution Obligations (Roadmap-defined)

| ID | Description | Pillar |
|----|-------------|--------|
| B.4.1 | Re-run extraction pipeline | — |
| B.4.2 | Compare resulting graph to stored graph | — |
| B.4.3 | G-CLOSURE gate: fail if graphs differ | Gate |
| B.4.4 | Report exact differences if any | — |
| B.4.5 | Log closure check to shadow ledger | Shadow |

**Important:** Execution Obligations (B.x.y) are planning checkpoints only; verification authority resides exclusively in gate outcomes and HGR approvals.

---

## Gate(s) Involved

- **G-CLOSURE**: Re-ingestion produces identical graph (fail if graphs differ)

---

## Evidence Artifacts

- `docs/verification/track_b/B4_CLOSURE_CHECK_EVIDENCE.md`

---

## Implementation Constraints

- Access Track A data via Graph API v1 (traversal) or v2 (enumeration)
- Use v2 enumeration for whole-graph snapshots (via B.3)
- Use Track A pipeline via ops layer only
- Do not modify Track A locked surfaces
- Place implementation in `src/services/track_b/closure-check/`
- Do NOT add `@satisfies AC-B.*` markers
- Do NOT add `@implements STORY-B.*` markers

---

## Technical Details

### Closure Verification Process

1. **Preflight:** Run `npx tsx scripts/preb4-preflight.ts` (must pass)
2. **Capture bindings:** Record GIT_SHA, PROJECT_ID, GRAPH_API_V2_URL
3. **Phase 1 snapshot:** Capture current graph state via B.3
4. **Settle:** Wait 3 seconds
5. **Phase 2 re-ingestion:** Run `npx tsx scripts/run-a1-extraction.ts` + TDD registries
6. **Settle:** Wait 3 seconds
7. **Phase 2 snapshot:** Capture new graph state via B.3
8. **Compare:** Use B.3 diff - must show zero drift
9. **Gate:** G-CLOSURE passes only if 100% identical Merkle roots

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
| Graph snapshots | B.3 Drift Detection |
| All entities | `GRAPH_API_V2_URL/api/v2/entities` (via B.3) |
| All relationships | `GRAPH_API_V2_URL/api/v2/relationships` (via B.3) |

---

## Required Verifiers

```bash
npm run verify:organ-parity
npm run verify:scripts-boundary
npm run lint:markers
npm test
npx tsx scripts/verify-track-a-lock.ts
```

---

## Definition of Done

- [ ] All Execution Obligations completed
- [ ] G-CLOSURE gate passing
- [ ] Evidence artifacts produced
- [ ] Verifiers green
- [ ] TDD registered as E06 in graph (`TDD-TRACKB-B4`)
- [ ] TDD linked to implementation SourceFiles via R14
