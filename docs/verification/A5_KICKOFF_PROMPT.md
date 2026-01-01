# A5 Kickoff Prompt — Graph API V1

**Date:** 2026-01-01  
**Phase:** Track A — Story A.5 (Graph API V1)  
**Prerequisite:** A4 LOCKED (see `A4_LOCK_ATTESTATION.md`)

---

## A5 Scope

**Story:** STORY-64.5 — Graph API V1  
**Goal:** Read-only query interface for the traceability graph

The A5 phase implements a query API layer on top of the existing entity and relationship data. This is a **read-only** interface that does not modify extraction, persistence, or sync logic.

---

## Locked Surfaces

These paths are frozen per the A4 Lock Attestation. **Any modification requires CID + reopening Track A.**

### Extraction & Providers
- `src/extraction/providers/**`

### Services (Entity, Relationship, Sync)
- `src/services/entities/**`
- `src/services/relationships/**`
- `src/services/sync/**`

### Schema Definitions
- `src/schema/track-a/**`

### Database Layer
- `src/db/**`
- `migrations/**`

### Verification Infrastructure
- `scripts/verification/**` (verifiers + expectations)

### Story Cards (A1-A4)
- `spec/track_a/stories/A1_ENTITY_EXTRACTION.md`
- `spec/track_a/stories/A2_RELATIONSHIP_DERIVATION.md`
- `spec/track_a/stories/A3_MARKER_EXTRACTION.md`
- `spec/track_a/stories/A4_STRUCTURAL_ANALYSIS.md`

---

## Boundary Rule

> **Changes to extraction, persistence, sync, schema, or verifiers require a formal CID.**

If A5 implementation reveals a defect in A1-A4 logic:
1. Document the issue with specific evidence
2. Request a CID with justification
3. Wait for human approval before modifying locked surfaces

---

## A5 MAY

✅ Add new API routes in `src/api/v1/**`  
✅ Create safe query wrappers (read-only) in `src/api/v1/**`  
✅ Add read services in `src/services/graph/**` (new directory)  
✅ Add database indexes (via new migration) if needed for query performance  
✅ Add query parameter validation  
✅ Add response formatting and pagination  
✅ Update `spec/track_a/stories/A5_GRAPH_API_V1.md` (this story card is UNLOCKED)

---

## A5 MAY NOT

❌ Modify extraction logic (`src/extraction/**`)  
❌ Modify entity/relationship persistence (`src/services/entities/**`, `src/services/relationships/**`)  
❌ Modify sync logic (`src/services/sync/**`)  
❌ Modify schema definitions (`src/schema/track-a/**`)  
❌ Modify database schema (except adding indexes)  
❌ Modify verifier expectations (`scripts/verification/expectations/**`)  
❌ Modify A1-A4 story cards

---

## Required Verifiers

All of the following must remain green throughout A5:

```bash
# Sanity checks
npm run test:sanity

# Full test suite
npm test

# Organ document parity
npm run verify:organ-parity

# Scripts boundary enforcement
npm run verify:scripts-boundary

# Track milestone (A4 phase)
TRACK_A_PHASE=A4 npm run verify:track-milestone

# Marker governance
npm run lint:markers
```

---

## Strict Mode Policy

**Strict AC Coverage:** OPTIONAL for A5

The `--strict-ac-coverage` flag is available but should NOT block A5 progression. Annotation gaps are advisory. System completeness is the primary gate.

Run with strict mode (informational):
```bash
npx tsx scripts/verification/a1-a4-coverage-report.ts --strict-ac-coverage
```

---

## A5 In-Scope ACs (from TDD)

Per `spec/track_a/stories/A5_GRAPH_API_V1.md` addresses.acceptance_criteria:

- AC-64.5.1: Single-hop query endpoint
- AC-64.5.2: Multi-hop traversal API
- AC-64.5.3: Confidence filter parameter
- AC-64.5.4: Provenance filter parameter

These are currently classified as `GAP_PENDING_ANNOTATION` in the coverage report. A5 implementation should add the necessary query functions and corresponding `@satisfies` markers.

---

## Out-of-Scope for A5

Per TDD frontmatter, the following ACs are NOT in A5 scope:
- AC-64.5.5 through AC-64.5.10

These remain classified as `OUT_OF_SCOPE` in the coverage report.

---

## Getting Started

1. Read the A5 story card: `spec/track_a/stories/A5_GRAPH_API_V1.md`
2. Review the A4 Lock Attestation: `docs/verification/A4_LOCK_ATTESTATION.md`
3. Run verification suite to confirm green baseline
4. Implement query API per the story card
5. Add `@satisfies` markers for in-scope ACs
6. Regenerate coverage report to confirm gap reduction

---

*End of A5 Kickoff Prompt*

