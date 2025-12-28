# Shadow Ledger Coverage Specification

**Version**: 2.0  
**Status**: Active  
**Last Updated**: 2025-12-28  
**Normative Reference**: UNIFIED_VERIFICATION_SPECIFICATION_V20_6_6.md §8.1.4

---

## Purpose

This document specifies the requirements for shadow ledger coverage in the Gnosis traceability system. The shadow ledger is an append-only log that captures all entity and relationship mutations, providing an audit trail for governance and future self-ingestion.

> **Normative Reference:** Epoch semantics are defined in UVS §8.1.4 (normative). This specification references but does not redefine them.

---

## Requirements

### REQ-1: 100% Mutation Coverage

Every CREATE and UPDATE operation on entities and relationships MUST be logged to the shadow ledger.

**Acceptance Criteria**:
- All entities in the database have a corresponding CREATE entry in the ledger
- All relationships in the database have a corresponding CREATE entry in the ledger
- Coverage = (Ledger Entries / DB Mutations) ≥ 100%

### REQ-2: Service Layer Logging

All mutations MUST pass through the service layer to ensure ledger logging:

| Service | Logging Method |
|---------|---------------|
| `entity-service.ts` | `shadowLedger.logCreate()` / `shadowLedger.logUpdate()` |
| `relationship-service.ts` | `shadowLedger.logRelationshipCreate()` / `shadowLedger.logRelationshipUpdate()` |

**Forbidden Paths**:
- Direct SQL INSERT/UPDATE statements bypassing the service layer
- Bulk imports that don't use `persistEntities()` or `persistRelationships()`

### REQ-3: Ledger Entry Schema

Each ledger entry MUST contain:

```typescript
interface LedgerEntry {
  timestamp: string;          // ISO 8601
  operation: 'CREATE' | 'UPDATE';
  kind: 'entity' | 'relationship' | 'decision';  // Required (V2.0)
  entity_type: string;        // E-code or R-code
  entity_id: string;          // UUID
  instance_id: string;        // Business key
  content_hash: string;       // SHA-256
  evidence: EvidenceAnchor;   // Provenance
  project_id: string;
  
  // Epoch fields (V2.0 - required for new entries)
  epoch_id: string;           // UUID of the extraction run
  repo_sha: string;           // Git SHA of repository at extraction
  runner_sha: string;         // Git SHA of Gnosis codebase
  brd_hash: string;           // SHA-256 of BRD content (format: sha256:<64hex>)
}
```

**Epoch Field Requirements:**
- **New entries** (created after V2.0 implementation) MUST include `epoch_id`, `repo_sha`, `runner_sha`, `brd_hash`.
- **Legacy entries** (pre-V2.0) may exist without epoch fields and are treated as historical artifacts, not invalidations.
- Gates and verification checks MUST NOT fail solely because legacy entries lack epoch fields.

### REQ-4: NO-OP Exclusion

When content_hash is unchanged (NO-OP), no ledger entry should be created. The ledger only captures actual mutations.

### REQ-5: Neo4j Sync Exclusion

Neo4j synchronization operations are intentionally excluded from ledger logging:
- `syncEntitiesToNeo4j()` - MERGE-only, no ledger
- `syncRelationshipsToNeo4j()` - MERGE-only, no ledger
- `replaceRelationshipsInNeo4j()` - DELETE+CREATE, no ledger

**Rationale**: Neo4j is a derived mirror of PostgreSQL. Logging Neo4j syncs would create duplicate entries for the same logical mutation.

### REQ-6: Epoch Metadata Files

Each extraction run produces an epoch metadata file at:

```
shadow-ledger/{project_id}/epochs/{epoch_id}.json
```

**Required fields:**
- `epoch_id`, `project_id`, `repo_sha`, `runner_sha`, `brd_hash`
- `started_at`, `completed_at`, `status`
- Computed counts: `entities_created`, `relationships_created`, `decisions_logged`, etc.

> Epoch metadata files are **append-only evidence artifacts**.
> They are not authoritative sources of correctness and must not be mutated post-completion.

---

## File Paths

**Current (V2.0):**
- Ledger: `shadow-ledger/{project_id}/ledger.jsonl`
- Epochs: `shadow-ledger/{project_id}/epochs/{epoch_id}.json`
- Corpus: `semantic-corpus/{project_id}/signals.jsonl`

**Legacy (pre-V2.0):**
- Root ledger: `shadow-ledger/ledger.jsonl` (deprecated, may exist as historical artifact)

---

## Verification Procedure

### Automated Audit

Run the ledger coverage audit:

```bash
npx tsx scripts/si-readiness/ledger-coverage-audit.ts
```

Expected output:
```
Coverage: 100.0%
✓ PASS: 100% ledger coverage achieved
```

### Manual Verification

1. Count entities in database:
   ```sql
   SELECT COUNT(*) FROM entities;
   ```

2. Count relationships in database:
   ```sql
   SELECT COUNT(*) FROM relationships;
   ```

3. Count unique instance_ids in ledger:
   ```bash
   jq -r '.instance_id' shadow-ledger/{project_id}/ledger.jsonl | sort -u | wc -l
   ```

4. Verify: Ledger count ≥ DB count (allowing for UPDATE entries)

---

## Recovery Procedure

If ledger coverage falls below 100%, perform a genesis re-extraction:

```bash
# 1. Backup existing state
cp shadow-ledger/{project_id}/ledger.jsonl backup/ledger-$(date +%Y%m%d).jsonl

# 2. Run genesis extraction (clears and re-extracts)
npx tsx scripts/si-readiness/genesis-extract.ts

# 3. Verify coverage
npx tsx scripts/si-readiness/ledger-coverage-audit.ts
```

---

## Governance

- **Gate**: Pre-A3 SI-Readiness
- **Blocking**: Yes - A3 cannot proceed without 100% coverage
- **Owner**: Track A Lead
- **Audit Frequency**: Before each track transition

---

## History

| Date | Version | Change |
|------|---------|--------|
| 2025-12-28 | 2.0 | Added epoch fields (REQ-3), epoch metadata (REQ-6), project-scoped paths, normative UVS reference |
| 2025-12-21 | 1.0 | Initial specification after achieving 100% coverage |

---

*This specification is part of the Gnosis governance documentation.*

