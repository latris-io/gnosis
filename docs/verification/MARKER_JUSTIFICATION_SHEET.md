# Marker Justification Sheet — Track A Gap ACs (v2.0)

**Date:** 2026-01-01  
**Purpose:** Document code anchors for 15 in-scope gap ACs with **runtime enforcement proof**  
**Authority:** TDD frontmatter in `spec/track_a/stories/A{1-5}_*.md`

---

## Runtime Enforcement Threshold

For a marker type to be **direct**, one of these must be true:

| Enforcement Type | Proof Required |
|------------------|----------------|
| **Persistence path** | `validateX()` is called on every upsert/persist call |
| **DB constraint** | `NOT NULL` / `CHECK` / `UNIQUE` in migrations |
| **Verifier test** | Hard assertion in `test/verification/*.test.ts` |

If none apply, marker type is **CID** (defer) or **test** (add test).

---

## Classification Legend

| Type | Meaning |
|------|---------|
| **direct** | Runtime-enforced; add `@satisfies` |
| **test** | Needs test to verify; add `@satisfies` on test |
| **CID** | No runtime enforcement; defer implementation |

---

## STORY-64.1: Entity Registry

| AC_ID | Requirement | Candidate Anchor | Runtime Enforcement Proof | Marker Type |
|-------|-------------|------------------|---------------------------|-------------|
| **AC-64.1.2** | Unique ID format enforced per entity type | `src/schema/track-a/id-formats.ts:validateEntityId` | ❌ **NOT ENFORCED**: Function exists but is NOT called in `entity-service.ts:upsert`. DB only has `CHECK (entity_type ~ '^E[0-9]{2}$')` (validates E-code format, not instance_id format). | **CID** |
| **AC-64.1.3** | Required vs optional attributes specified | `src/schema/track-a/entities.ts:Entity` + DB schema | ✅ **DB enforced**: `migrations/003_reset_schema_to_cursor_plan.sql` lines 28-32: `entity_type NOT NULL`, `instance_id NOT NULL`, `name NOT NULL`. TypeScript interface matches. | **direct** |
| **AC-64.1.4** | Entity validation on creation | N/A | ❌ **NOT ENFORCED**: No runtime validation function is called in `upsert`. TypeScript types only. | **CID** |
| **AC-64.1.7** | Temporal queries (extracted_at) | `src/services/entities/entity-service.ts:upsert` | ✅ **DB enforced**: `migrations/003_reset_schema_to_cursor_plan.sql` line 36: `extracted_at TIMESTAMPTZ DEFAULT NOW()`. SQL sets `NOW()` on INSERT and UPDATE (lines 89, 98 in entity-service.ts). | **direct** |
| **AC-64.1.8** | Schema versioning | N/A | ❌ **NOT IMPLEMENTED**: No versioning mechanism exists. | **CID** |

---

## STORY-64.2: Relationship Registry

| AC_ID | Requirement | Candidate Anchor | Runtime Enforcement Proof | Marker Type |
|-------|-------------|------------------|---------------------------|-------------|
| **AC-64.2.2** | RelationshipMetadata schema (confidence, provenance, timestamps) | `src/schema/track-a/relationships.ts:Relationship` + DB schema | ✅ **DB enforced**: `migrations/003_reset_schema_to_cursor_plan.sql` lines 62-70: `confidence DECIMAL(3,2)`, `extracted_at TIMESTAMPTZ`, `source_file VARCHAR`. All required fields exist with types. | **direct** |
| **AC-64.2.3** | Confidence scoring 0.0-1.0 required | `migrations/003_reset_schema_to_cursor_plan.sql` line 76 | ✅ **DB enforced**: `CONSTRAINT valid_confidence CHECK (confidence >= 0 AND confidence <= 1)`. DB rejects values outside range. | **direct** |
| **AC-64.2.6** | Bidirectional traversal supported | `src/services/relationships/relationship-service.ts` | ❌ **NOT IMPLEMENTED**: Schema has `from_entity_id` and `to_entity_id` columns with indexes, but NO query function supports reverse traversal (e.g., `queryByToEntity`). Only `queryByType` and `getAll` exist. | **CID** |
| **AC-64.2.7** | Query API with confidence filtering | N/A | ❌ **NOT IMPLEMENTED**: No `min_confidence` filter in any query function. | **CID** |
| **AC-64.2.8** | Audit trail (created_at, created_by) | `src/services/relationships/relationship-service.ts:upsert` | ⚠️ **PARTIAL**: `extracted_at = NOW()` is set (line 164, 176). But `created_by`, `verified_at`, `verified_by` columns don't exist. | **CID** |

---

## STORY-64.4: Structural Analysis Pipeline

| AC_ID | Requirement | Candidate Anchor | Runtime Enforcement Proof | Marker Type |
|-------|-------------|------------------|---------------------------|-------------|
| **AC-64.4.10** | Analysis <10 min for 100K LOC | `src/pipeline/types.ts:PipelineResult.total_duration_ms` | ⚠️ **MEASURABLE but not enforced**: Field exists and is populated by `orchestrator.ts`. No test asserts threshold. | **test** |

---

## STORY-64.5: Graph API v1

| AC_ID | Requirement | Candidate Anchor | Runtime Enforcement Proof | Marker Type |
|-------|-------------|------------------|---------------------------|-------------|
| **AC-64.5.1** | Single-hop query endpoint | N/A | ❌ **NOT IMPLEMENTED**: No `/api/graph/{id}/relationships` endpoint. Would need to compose `getEntityByInstanceId` + relationship query. | **CID** |
| **AC-64.5.2** | Multi-hop traversal API | N/A | ❌ **NOT IMPLEMENTED**: No traversal function with depth parameter. | **CID** |
| **AC-64.5.3** | Confidence filter parameter | N/A | ❌ **NOT IMPLEMENTED**: No `min_confidence` parameter in any query. | **CID** |
| **AC-64.5.4** | Provenance filter parameter | N/A | ❌ **NOT IMPLEMENTED**: No `provenance` column or filter. | **CID** |

---

## Summary After Runtime Enforcement Review

| Marker Type | Count | ACs |
|-------------|-------|-----|
| **direct** | 4 | AC-64.1.3, AC-64.1.7, AC-64.2.2, AC-64.2.3 |
| **test** | 1 | AC-64.4.10 |
| **CID** | 10 | AC-64.1.2, AC-64.1.4, AC-64.1.8, AC-64.2.6, AC-64.2.7, AC-64.2.8, AC-64.5.1, AC-64.5.2, AC-64.5.3, AC-64.5.4 |

---

## Markers to Add (4 direct)

| File | Symbol | Marker |
|------|--------|--------|
| `src/schema/track-a/entities.ts` | `Entity` interface | `@satisfies AC-64.1.3` |
| `src/services/entities/entity-service.ts` | `upsert` function | `@satisfies AC-64.1.7` |
| `src/schema/track-a/relationships.ts` | `Relationship` interface | `@satisfies AC-64.2.2` |
| `migrations/003_reset_schema_to_cursor_plan.sql` | Line 76 (valid_confidence) | `@satisfies AC-64.2.3` (comment) |

---

## Test to Add (1)

| AC | Test | Assertion |
|----|------|-----------|
| AC-64.4.10 | `test/pipeline/pipeline.integration.test.ts` | `expect(result.total_duration_ms).toBeLessThan(600000)` for 100K LOC |

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

## DB Constraint Evidence

```sql
-- From migrations/003_reset_schema_to_cursor_plan.sql

-- Entities (lines 26-42)
CREATE TABLE entities (
  entity_type VARCHAR(10) NOT NULL,
  instance_id VARCHAR(500) NOT NULL,
  name VARCHAR(255) NOT NULL,
  ...
  CONSTRAINT valid_entity_type CHECK (entity_type ~ '^E[0-9]{2}$'),
);

-- Relationships (lines 61-78)
CREATE TABLE relationships (
  ...
  confidence DECIMAL(3,2) DEFAULT 1.0,
  ...
  CONSTRAINT valid_confidence CHECK (confidence >= 0 AND confidence <= 1),
);
```

---

*End of Marker Justification Sheet v2.0*
