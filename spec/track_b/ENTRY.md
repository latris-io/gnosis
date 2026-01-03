# Track B Entry Criteria

**Track:** B (Zero Drift)  
**Prerequisite Gate:** HGR-1.1 (Track A Extension)  
**Baseline Tag:** `track-a5-green`

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

## Read-Only Constraint

Track B is **READ-ONLY** relative to Track A:

- Access Track A data via **HTTP calls** to Graph API endpoints:
  - **v1** (`GRAPH_API_URL`): traversal, relationships-by-id
  - **v2** (`GRAPH_API_V2_URL`): enumeration (after B.6.1 per CID-2026-01-03)
- Do NOT **import** from Track A locked surfaces (no `import from 'src/api/v1/*'`)
- Do NOT modify Track A schema, entities, relationships, or locked surfaces
- B.6.1 v2 endpoints may use READ-ONLY direct database access (per CID-2026-01-03)

### Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `GRAPH_API_URL` | v1 endpoints | `http://localhost:3000` |
| `GRAPH_API_V2_URL` | v2 endpoints | `http://localhost:3001` |
| `DATABASE_URL` | For B.6.1 read-only access | (existing) |

---

## Track B Gates to Be Introduced

| Gate | Purpose |
|------|---------|
| G-HEALTH | System health metrics nominal |
| G-REGISTRY | BRD registry complete and queryable |
| G-DRIFT | Zero drift between ingestions |
| G-CLOSURE | Re-ingestion produces identical graph |

---

## Advisory Note: Track A Coverage Gaps

Track A coverage gaps (ACs without R19 links) are **advisory** unless strict mode is enabled.

- Default mode: gaps are warnings, not blockers
- Strict mode (`--strict-ac-coverage`): gaps cause FAIL
- See: `npx tsx scripts/verification/a1-a4-coverage-report.ts`

---

## STOP Conditions

**STOP and escalate via CID if:**

- Any Track A locked surface must be modified
- Any gate fails and cannot be fixed without Track A changes
- Ambiguity in spec requires BRD/UTG clarification

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

# Track A lock
npx tsx scripts/verify-track-a-lock.ts
```

All must pass before proceeding.

---

## Entry Certification

```
I, [Name], certify that:

1. [ ] All Track A exit criteria are met
2. [ ] HGR-1.1 is approved
3. [ ] All entry verification commands pass
4. [ ] Track A locked surfaces are intact
5. [ ] Track B can proceed

Signature: _____________
Date: _____________
Role: _____________
```
