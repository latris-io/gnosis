# Human Gate Review 2 (HGR-2)

**Track:** B (Zero Drift)  
**Gate:** HGR-2  
**Criticality:** ⭐ CRITICAL — Oracle Transition Gate

---

## Purpose

HGR-2 is the most critical human gate in the entire roadmap. It marks the transition from:

- **Before:** Gnosis validated by external shadow ledger
- **After:** Gnosis IS the oracle; bootstrap scripts retired

**This transition is IRREVERSIBLE.**

---

## Pre-Review Checklist

Before HGR-2 review begins:

- [ ] All Track B stories complete
- [ ] All Track A gates + all Track B gates passing
- [ ] Shadow ledger vs Gnosis graph: 100% match confirmed
- [ ] Closure check: deterministic ingestion confirmed
- [ ] Semantic corpus quality requirements met
- [ ] Post-implementation verifiers pass:
  - `npm run verify:tdd-registry`
  - `npm run verify:track-b-requirement-mapping`

---

## Review Materials

| Material | Location | Purpose |
|----------|----------|---------|
| Track B Closeout Packet | `docs/verification/track_b/B_CLOSEOUT_PACKET_*.md` | Evidence summary |
| Gate Results | `npm run verify:all-gates` | All gates |
| Closure Report | `npm run verify:closure` | Determinism proof |
| Drift Report | `npm run verify:drift` | Zero drift proof |
| TDD Registry | `docs/verification/track_b/TDD_REGISTRY_VERIFICATION.md` | E06/R14 links |
| Semantic Corpus | `semantic-corpus/` | Training signals |

---

## Oracle Transition Acknowledgment

This acknowledgment is REQUIRED before Gnosis becomes the oracle.

```
"I, [Name], have verified that:

1. ☐ Shadow ledger matches Gnosis graph 100%
2. ☐ All Track A and Track B gates pass
3. ☐ Closure check succeeds (deterministic ingestion)
4. ☐ Semantic corpus meets quality requirements
5. ☐ I approve Gnosis becoming the oracle
6. ☐ I understand bootstrap scripts will be retired
7. ☐ I understand this transition is irreversible

Signature: _____________
Date: _____________
Role: _____________"
```

---

## Post-HGR-2 Actions

Upon approval:

1. Tag Track B baseline: `track-b-green`
2. Retire bootstrap scripts
3. Update `.current-track` to `C`
4. Begin Track C (Semantic Understanding)

---

## Rejection Criteria

HGR-2 **MUST** be rejected if:

- Any Track A gate fails
- Any Track B gate fails (G-HEALTH, G-REGISTRY, G-DRIFT, G-CLOSURE)
- Shadow ledger ↔ graph mismatch detected
- Closure check fails (non-deterministic ingestion)
- Semantic corpus quality below threshold
- TDD registry verification fails (E06 nodes missing or unlinked)
- Any Related Canonical Requirements lack traceability markers

---

## Governance Note

**Track B verification is gate-based, not AC-based.**

- Execution Obligations (B.x.y) are planning checkpoints only
- Verification authority resides in gate outcomes and HGR-2 approval
- Track B does NOT use `@satisfies AC-B.*` markers
- Track B does NOT use `@implements STORY-B.*` markers

If a Track B TDD lists Related Canonical Requirements (existing BRD IDs), those files MUST have canonical markers (`@implements STORY-*`, `@satisfies AC-*`).

---

## B.6.1 Database Access Exception (CID-2026-01-03)

The only permitted direct database access in Track B is the **CID-approved, hardened, read-only B.6.1 enumeration service**.

This exception is necessary because:
- Graph API v1 has no entity enumeration endpoint
- B.3/B.4 require whole-graph snapshots
- B.6.1 enumeration endpoints must query the database directly

Hardening requirements (verified by code review and `npm run verify:track-b-db-boundary`):
1. `SET TRANSACTION READ ONLY` on all connections
2. RLS context set via `SELECT set_project_id($1)`
3. Explicit column selection (no `SELECT *`)
4. Explicit `project_id` filter in WHERE clause
5. Pagination with max 1000 rows per request
6. Module-level connection pool (not per-request)

**Evidence:** `docs/verification/track_b/B6_1_ENUMERATION_EVIDENCE.md`
