# Shadow Ledger Coverage Specification

**Version**: 1.0  
**Status**: Active  
**Last Updated**: 2025-12-21

---

## Purpose

This document specifies the requirements for shadow ledger coverage in the Gnosis traceability system. The shadow ledger is an append-only log that captures all entity and relationship mutations, providing an audit trail for governance and future self-ingestion.

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
  kind?: 'entity' | 'relationship';  // undefined = entity
  entity_type: string;        // E-code or R-code
  entity_id: string;          // UUID
  instance_id: string;        // Business key
  content_hash: string;       // SHA-256
  evidence: EvidenceAnchor;   // Provenance
  project_id: string;
}
```

### REQ-4: NO-OP Exclusion

When content_hash is unchanged (NO-OP), no ledger entry should be created. The ledger only captures actual mutations.

### REQ-5: Neo4j Sync Exclusion

Neo4j synchronization operations are intentionally excluded from ledger logging:
- `syncEntitiesToNeo4j()` - MERGE-only, no ledger
- `syncRelationshipsToNeo4j()` - MERGE-only, no ledger
- `replaceRelationshipsInNeo4j()` - DELETE+CREATE, no ledger

**Rationale**: Neo4j is a derived mirror of PostgreSQL. Logging Neo4j syncs would create duplicate entries for the same logical mutation.

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
   jq -r '.instance_id' shadow-ledger/ledger.jsonl | sort -u | wc -l
   ```

4. Verify: Ledger count ≥ DB count (allowing for UPDATE entries)

---

## Recovery Procedure

If ledger coverage falls below 100%, perform a genesis re-extraction:

```bash
# 1. Backup existing state
cp shadow-ledger/ledger.jsonl backup/ledger-$(date +%Y%m%d).jsonl

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
| 2025-12-21 | 1.0 | Initial specification after achieving 100% coverage |

---

*This specification is part of the Gnosis governance documentation.*
