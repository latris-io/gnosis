# Operator Scripts Allowlist

**Generated:** 2026-01-03  
**Purpose:** Document approved Tier 2 state-mutating scripts and their governance requirements  
**Status:** Active

---

## Overview

This document lists all Tier 2 scripts (repair, maintenance, migration, legacy) that are permitted for operator use. Each script requires explicit confirmation before execution to prevent accidental state mutation.

**Key Principles:**
1. All Tier 2 scripts require `--confirm-repair` flag
2. All Tier 2 scripts require `PROJECT_ID` env var (or `--project-id` flag)
3. All Tier 2 scripts emit evidence artifacts to `docs/verification/track_b/operator_runs/`
4. Scripts NOT listed here are NOT approved for operator use

---

## Approved Tier 2 Scripts

### Repair Scripts (`scripts/repair/`)

| Script | Purpose | Confirm Flag | Evidence |
|--------|---------|--------------|----------|
| `sync-neo4j.ts` | Sync entities and relationships to Neo4j | ✅ Required | ✅ Written |
| `backfill-missing-brd-acs.ts` | Backfill missing E03 entities and R02 relationships | ✅ Required | ✅ Written |

**Read-Only Scripts (no flag required):**
- `check-counts.ts` — Tier 3 (read-only)
- `check-neo4j-counts.ts` — Tier 3 (read-only)
- `detect-missing-e03.ts` — Tier 3 (read-only)
- `diagnose-ledger-gap.ts` — Tier 3 (read-only)
- `verify-corpus.ts` — Tier 3 (read-only)

---

### Sync Scripts (`scripts/`)

| Script | Purpose | Confirm Flag | Evidence |
|--------|---------|--------------|----------|
| `sync-to-neo4j.ts` | Sync entities from PostgreSQL to Neo4j | ✅ Required | ✅ Written |
| `sync-relationships-to-neo4j.ts` | Sync all entities and relationships to Neo4j | ✅ Required | ✅ Written |
| `sync-relationships-replace.ts` | Replace-by-project relationship sync with parity verification | ✅ Required | ✅ Written |

---

### Maintenance Scripts (`scripts/`)

| Script | Purpose | Confirm Flag | Evidence |
|--------|---------|--------------|----------|
| `fix-e15-extraction.ts` | Remediate E15 module extraction issues | ✅ Required | ✅ Written |
| `rebuild-a3-pristine.ts` | Rebuild A3 extraction with pristine epoch-based ledger | ✅ Required | ✅ Written |
| `calibrate-tdds.ts` | TDD validation + optional E08 seeding | ✅ Required (if SEED_E08=true) | ✅ Written (if SEED_E08=true) |

---

### Migration Scripts (`scripts/`)

| Script | Purpose | Confirm Flag | Evidence |
|--------|---------|--------------|----------|
| `migrate-ledger-to-project-scope.ts` | Migrate flat ledger to per-project structure | ❌ Not required (filesystem-only) | ✅ Written |

---

### Legacy Scripts (`scripts/si-readiness/`) — DEPRECATED

These scripts are **superseded by `scripts/run-a1-extraction.ts`** and should only be used for historical debugging or emergency recovery.

| Script | Purpose | Confirm Flag | Evidence | Status |
|--------|---------|--------------|----------|--------|
| `genesis-extract.ts` | Full Track A extraction | ✅ Required | ✅ Written | DEPRECATED |
| `continue-extract.ts` | Continue aborted extraction | ✅ Required | ✅ Written | DEPRECATED |
| `extract-relationships.ts` | Extract relationships only | ✅ Required | ✅ Written | DEPRECATED |
| `extract-remaining.ts` | Extract remaining relationships | ✅ Required | ✅ Written | DEPRECATED |
| `finish-extract.ts` | Finish extraction | ✅ Required | ✅ Written | DEPRECATED |

**Recommendation:** Do NOT use these scripts. Use `scripts/run-a1-extraction.ts` instead. While deprecated scripts now emit evidence artifacts for auditability, they are riskier due to legacy code paths and should be avoided.

---

## Usage Examples

### Running a Repair Script

```bash
# Correct usage
PROJECT_ID=6df2f456-440d-4958-b475-d9808775ff69 npx tsx scripts/repair/sync-neo4j.ts --confirm-repair

# Will fail (missing confirmation)
PROJECT_ID=6df2f456-440d-4958-b475-d9808775ff69 npx tsx scripts/repair/sync-neo4j.ts

# Will fail (missing PROJECT_ID)
npx tsx scripts/repair/sync-neo4j.ts --confirm-repair
```

### Running a Migration Script

```bash
# Filesystem-only migration (no --confirm-repair required)
PROJECT_ID=6df2f456-440d-4958-b475-d9808775ff69 npx tsx scripts/migrate-ledger-to-project-scope.ts
```

### Running Calibration with E08 Seeding

```bash
# Read-only validation (no confirmation needed)
PROJECT_ID=6df2f456-440d-4958-b475-d9808775ff69 npx tsx scripts/calibrate-tdds.ts

# With E08 seeding (confirmation required)
PROJECT_ID=6df2f456-440d-4958-b475-d9808775ff69 SEED_E08=true npx tsx scripts/calibrate-tdds.ts --confirm-repair
```

---

## Evidence Artifact Format

Evidence files are written to:
```
docs/verification/track_b/operator_runs/<SCRIPT_BASENAME>__<TIMESTAMP>__<SHORT_SHA>.md
```

Each evidence file contains:
- Timestamp and git commit SHA
- Project ID
- Script name and arguments
- Environment fingerprint (Node version, GOVERNANCE_PHASE)
- BEFORE state snapshot (entity/relationship counts)
- AFTER state snapshot (entity/relationship counts)
- List of operations performed
- Any errors encountered

---

## Scripts NOT Approved for Operator Use

The following scripts are NOT listed in this allowlist and should NOT be used for state mutation without explicit governance review:

- Any script not listed above
- Scripts in `scripts/si-readiness/` (deprecated — use `run-a1-extraction.ts`)
- Any new script added without update to this allowlist

**To add a new Tier 2 script:**
1. Implement the operator guard pattern (see `scripts/_lib/operator-guard.ts`)
2. Add evidence artifact generation
3. Update this allowlist with the script details
4. Update `EXECUTION_PATHS_INVENTORY.md`

---

## Related Documents

- `docs/verification/track_b/EXECUTION_PATHS_INVENTORY.md` — Full script inventory
- `scripts/_lib/operator-guard.ts` — Shared operator guard utilities
- `scripts/_lib/state-snapshot.ts` — State snapshot utilities

