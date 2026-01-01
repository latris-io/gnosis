# Marker Justification Sheet — Track A Gap ACs (v2.1)

**Date:** 2026-01-01  
**Purpose:** Document code anchors for 15 in-scope gap ACs with **runtime enforcement proof**  
**Authority:** TDD frontmatter in `spec/track_a/stories/A{1-5}_*.md`

---

## Runtime Enforcement Threshold

For a marker type to be **direct**, one of these must be true:

| Enforcement Type | Proof Required |
|------------------|----------------|
| **Write boundary** | Marker on upsert/persist function that enforces via DB constraints |
| **DB constraint** | NOT NULL / CHECK in migrations (marker on write function, not SQL) |
| **Verifier test** | Hard assertion in `test/verification/*.test.ts` |

**Rule:** Never place `@satisfies` in SQL migrations. Anchor on write-boundary code.

---

## Classification Legend

| Type | Meaning |
|------|---------|
| **direct** | Runtime-enforced via write boundary; add `@satisfies` |
| **test** | Needs test to verify; add `@satisfies` on test |
| **CID** | No runtime enforcement; defer implementation |

---

## STORY-64.1: Entity Registry

| AC_ID | BRD Requirement | Candidate Anchor | Runtime Enforcement Proof | Marker Type |
|-------|-----------------|------------------|---------------------------|-------------|
| **AC-64.1.2** | Each entity type has unique ID format enforced | `src/schema/track-a/id-formats.ts:validateEntityId` | ❌ **NOT ENFORCED**: Function exists but NOT called in `entity-service.ts:upsert`. DB only validates `entity_type ~ '^E[0-9]{2}$'`, not instance_id format. | **CID** |
| **AC-64.1.3** | Required vs optional attributes specified | `src/services/entities/entity-service.ts:upsert` | ✅ **Write boundary + DB constraints**: `upsert` persists to DB which enforces `NOT NULL` on `entity_type`, `instance_id`, `name` (migrations line 28-32). INSERT fails if required fields missing. | **direct** |
| **AC-64.1.4** | Entity validation on creation | N/A | ❌ **NOT ENFORCED**: No runtime validation function called in `upsert`. TypeScript types only. | **CID** |
| **AC-64.1.7** | Entity count per type for metrics | `src/services/entities/entity-service.ts:countByType` | ✅ **Function exists**: `countByType(projectId)` returns `Record<EntityTypeCode, number>`. Exposed via `api/v1/entities.ts:getEntityCounts`. | **direct** |
| **AC-64.1.8** | Schema versioning | N/A | ❌ **NOT IMPLEMENTED**: No versioning mechanism exists. | **CID** |

---

## STORY-64.2: Relationship Registry

| AC_ID | BRD Requirement | Candidate Anchor | Runtime Enforcement Proof | Marker Type |
|-------|-----------------|------------------|---------------------------|-------------|
| **AC-64.2.2** | RelationshipMetadata schema (confidence, provenance, timestamps) | `src/services/relationships/relationship-service.ts:upsert` | ✅ **Write boundary + DB schema**: `upsert` persists to DB with `confidence`, `source_file`, `extracted_at` fields. Schema enforces structure. | **direct** |
| **AC-64.2.3** | Confidence scoring 0.0-1.0 required | `src/services/relationships/relationship-service.ts:upsert` | ✅ **Write boundary + DB CHECK**: `upsert` persists to DB which enforces `CHECK (confidence >= 0 AND confidence <= 1)` (migrations line 76). INSERT/UPDATE fails if out of range. | **direct** |
| **AC-64.2.6** | Bidirectional traversal supported | N/A | ❌ **NOT IMPLEMENTED**: Schema has `from_entity_id`/`to_entity_id` columns with indexes, but NO query function supports reverse traversal. Only `queryByType` and `getAll` exist. | **CID** |
| **AC-64.2.7** | Query API with confidence filtering | N/A | ❌ **NOT IMPLEMENTED**: No `min_confidence` filter in any query function. | **CID** |
| **AC-64.2.8** | Audit trail (created_at, created_by) | N/A | ❌ **PARTIAL**: `extracted_at` exists but `created_by`, `verified_at`, `verified_by` columns don't exist. | **CID** |

---

## STORY-64.4: Structural Analysis Pipeline

| AC_ID | BRD Requirement | Candidate Anchor | Runtime Enforcement Proof | Marker Type |
|-------|-----------------|------------------|---------------------------|-------------|
| **AC-64.4.10** | Analysis <10 min for 100K LOC | `test/pipeline/pipeline.integration.test.ts` (assertion) | ⚠️ **MEASURABLE**: `PipelineResult.total_duration_ms` field exists. Needs test with assertion `expect(result.total_duration_ms).toBeLessThan(600000)`. | **test** |

---

## STORY-64.5: Graph API v1

| AC_ID | BRD Requirement | Candidate Anchor | Runtime Enforcement Proof | Marker Type |
|-------|-----------------|------------------|---------------------------|-------------|
| **AC-64.5.1** | Single-hop query endpoint | N/A | ❌ **NOT IMPLEMENTED**: No `/api/graph/{id}/relationships` endpoint. | **CID** |
| **AC-64.5.2** | Multi-hop traversal API | N/A | ❌ **NOT IMPLEMENTED**: No traversal function with depth parameter. | **CID** |
| **AC-64.5.3** | Confidence filter parameter | N/A | ❌ **NOT IMPLEMENTED**: No `min_confidence` parameter in any query. | **CID** |
| **AC-64.5.4** | Provenance filter parameter | N/A | ❌ **NOT IMPLEMENTED**: No `provenance` column or filter. | **CID** |

---

## Summary v2.1

| Marker Type | Count | ACs |
|-------------|-------|-----|
| **direct** | 4 | AC-64.1.3, AC-64.1.7, AC-64.2.2, AC-64.2.3 |
| **test** | 1 | AC-64.4.10 |
| **CID** | 10 | AC-64.1.2, AC-64.1.4, AC-64.1.8, AC-64.2.6, AC-64.2.7, AC-64.2.8, AC-64.5.1, AC-64.5.2, AC-64.5.3, AC-64.5.4 |

---

## Markers to Add (4 direct + 1 test)

### Direct Markers (write boundary)

| File | Function | Marker | Justification |
|------|----------|--------|---------------|
| `src/services/entities/entity-service.ts` | `upsert` | `@satisfies AC-64.1.3` | DB enforces NOT NULL on entity_type, instance_id, name |
| `src/services/entities/entity-service.ts` | `countByType` | `@satisfies AC-64.1.7` | Returns entity counts per type for metrics |
| `src/services/relationships/relationship-service.ts` | `upsert` | `@satisfies AC-64.2.2` | Persists metadata (confidence, provenance, timestamps) |
| `src/services/relationships/relationship-service.ts` | `upsert` | `@satisfies AC-64.2.3` | DB CHECK enforces confidence 0.0-1.0 |

### Test Marker

| File | Test | Marker | Assertion |
|------|------|--------|-----------|
| `test/pipeline/pipeline.integration.test.ts` | Performance test | `@satisfies AC-64.4.10` | `expect(result.total_duration_ms).toBeLessThan(600000)` |

---

## CID Items (10)

| AC | Gap | Remediation |
|----|-----|-------------|
| AC-64.1.2 | `validateEntityId` not called on persist | Add call in `upsert` OR add DB CHECK per entity type |
| AC-64.1.4 | No runtime validation function | Add `validateEntity()` call in `upsert` |
| AC-64.1.8 | No schema versioning | Define versioning strategy |
| AC-64.2.6 | No reverse traversal query | Add `queryByEntity(entityId)` searching both columns |
| AC-64.2.7 | No confidence filter | Add `min_confidence` param to `queryByType` |
| AC-64.2.8 | Missing audit columns | Add `created_by`, `verified_at`, `verified_by` columns |
| AC-64.5.1 | No single-hop endpoint | Create `/api/graph/{id}/relationships` |
| AC-64.5.2 | No multi-hop traversal | Implement `traverse(id, depth)` |
| AC-64.5.3 | No confidence filter | Add to graph API |
| AC-64.5.4 | No provenance filter | Add `provenance` column + filter |

---

## DB Constraint Evidence (for reference)

```sql
-- From migrations/003_reset_schema_to_cursor_plan.sql

-- Entities (lines 26-42) - justifies AC-64.1.3
CREATE TABLE entities (
  entity_type VARCHAR(10) NOT NULL,      -- AC-64.1.3
  instance_id VARCHAR(500) NOT NULL,     -- AC-64.1.3
  name VARCHAR(255) NOT NULL,            -- AC-64.1.3
  ...
);

-- Relationships (lines 61-78) - justifies AC-64.2.3
CREATE TABLE relationships (
  confidence DECIMAL(3,2) DEFAULT 1.0,
  ...
  CONSTRAINT valid_confidence CHECK (confidence >= 0 AND confidence <= 1),  -- AC-64.2.3
);
```

---

## Changes from v2.0 → v2.1

| Change | Reason |
|--------|--------|
| AC-64.1.3: Moved anchor from `Entity` interface to `entity-service.ts:upsert` | Interface alone has no runtime enforcement; write boundary + DB constraint does |
| AC-64.1.7: Corrected requirement from "temporal queries" to "entity count per type" | BRD says "Entity count per type reported for metrics" |
| AC-64.2.3: Moved anchor from SQL migration to `relationship-service.ts:upsert` | Never place @satisfies in SQL; anchor on write boundary |
| AC-64.4.10: Clarified anchor is test assertion, not type field | Test assertion is the enforcement point |

---

*End of Marker Justification Sheet v2.1*
