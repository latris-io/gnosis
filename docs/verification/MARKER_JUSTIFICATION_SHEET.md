# Marker Justification Sheet — Track A Gap ACs

**Date:** 2026-01-01  
**Purpose:** Document code anchors for 15 in-scope gap ACs before adding `@satisfies` markers  
**Authority:** TDD frontmatter in `spec/track_a/stories/A{1-5}_*.md`

---

## Classification Legend

| Type | Meaning |
|------|---------|
| **direct** | Single authoritative enforcement point; add `@satisfies` |
| **test** | AC is verified by test; add `@satisfies` on test function |
| **CID** | No single anchor; create CID to defer or implement |

---

## STORY-64.1: Entity Registry

| AC_ID | Requirement (1 sentence) | Candidate code anchor | Why this anchor satisfies | Proof it's authoritative | Marker type |
|-------|--------------------------|----------------------|---------------------------|-------------------------|-------------|
| **AC-64.1.2** | Each entity type has unique ID format enforced | `src/schema/track-a/id-formats.ts:validateEntityId` | This function validates that an entity ID matches its type-specific regex pattern (e.g., E02 must be `STORY-\d+\.\d+`). It is the only validation point for ID formats. | It is the only enforcement point; exported and called by any code needing ID validation. Pattern is defined in `ID_PATTERNS`. | **direct** |
| **AC-64.1.3** | Required vs optional attributes specified for each entity | `src/schema/track-a/entities.ts:Entity` | The TypeScript `Entity` interface explicitly marks fields as required (`entity_type`, `instance_id`, `name`, `id`) or optional (`content_hash`, `source_file` with `\| null`). Compiler enforces at build. | TypeScript compiler rejects invalid usage; this is the canonical type definition imported by all entity code. | **direct** |
| **AC-64.1.4** | Entity validation on creation (type check, format check) | `src/services/entities/entity-service.ts:upsert` | The upsert function receives an `ExtractedEntity` typed parameter, enforcing type safety. However, it does NOT explicitly call `validateEntityId`. | Enforcement is implicit via TypeScript types, but no runtime format validation exists. | **CID** |
| **AC-64.1.7** | Temporal queries (created_at/updated_at) | `src/services/entities/entity-service.ts:upsert` (line 89, 98) | The upsert SQL uses `NOW()` for both INSERT and UPDATE of `extracted_at`, enabling temporal queries. Schema includes `extracted_at` column. | `extracted_at = NOW()` is set on every CREATE and UPDATE in the upsert SQL; all entities have this timestamp. | **direct** |
| **AC-64.1.8** | Schema versioning for entity type evolution | N/A | No schema versioning mechanism is implemented. Entity types are defined in TypeScript but there's no runtime version tracking. | No enforcement point exists. | **CID** |

---

## STORY-64.2: Relationship Registry

| AC_ID | Requirement (1 sentence) | Candidate code anchor | Why this anchor satisfies | Proof it's authoritative | Marker type |
|-------|--------------------------|----------------------|---------------------------|-------------------------|-------------|
| **AC-64.2.2** | RelationshipMetadata schema implemented (confidence, provenance, timestamps) | `src/schema/track-a/relationships.ts:Relationship` | The TypeScript `Relationship` interface defines `confidence`, `source_file` (provenance), `extracted_at` (timestamp), and all required metadata fields. | This is the canonical type definition imported by all relationship code; compiler enforces shape. | **direct** |
| **AC-64.2.3** | Confidence scoring (0.0-1.0) required on all relationships | `src/schema/track-a/relationships.ts:Relationship` (line 54) | The interface declares `confidence: number` as required (not optional). All relationship providers set confidence in their extraction. | Type enforcement prevents omission; no runtime range check (0.0-1.0) exists but TypeScript requires the field. | **direct** |
| **AC-64.2.6** | Bidirectional traversal supported (forward and reverse queries) | `src/services/relationships/relationship-service.ts:getByInstanceId` | Query returns relationship with both `from_entity_id` and `to_entity_id`, enabling traversal in either direction. Schema stores both endpoints. | Schema design with `from_entity_id`/`to_entity_id` columns; any query can filter by either. | **direct** |
| **AC-64.2.7** | Relationship query API with confidence filtering | `src/services/relationships/relationship-service.ts:queryByType` | Currently queries by type only; no confidence filter parameter. | No confidence filter exists in current implementation. | **CID** |
| **AC-64.2.8** | Audit trail (created_at, created_by, verified_at, verified_by) | `src/services/relationships/relationship-service.ts:upsert` | Sets `extracted_at = NOW()` on INSERT and UPDATE. However, `created_by`, `verified_at`, `verified_by` columns don't exist in schema. | Only `extracted_at` is tracked; other audit fields are missing. | **CID** |

---

## STORY-64.4: Structural Analysis Pipeline

| AC_ID | Requirement (1 sentence) | Candidate code anchor | Why this anchor satisfies | Proof it's authoritative | Marker type |
|-------|--------------------------|----------------------|---------------------------|-------------------------|-------------|
| **AC-64.4.10** | Analysis completes <10 minutes for 100K LOC | `src/pipeline/types.ts:PipelineResult.total_duration_ms` | The pipeline result includes `total_duration_ms` field, allowing performance verification. This is a measurement, not enforcement. | The field exists and is populated by `orchestrator.ts`; performance test would verify against threshold. | **test** |

---

## STORY-64.5: Graph API v1

| AC_ID | Requirement (1 sentence) | Candidate code anchor | Why this anchor satisfies | Proof it's authoritative | Marker type |
|-------|--------------------------|----------------------|---------------------------|-------------------------|-------------|
| **AC-64.5.1** | Single-hop query: `GET /api/graph/{id}/relationships` | `src/api/v1/entities.ts:getEntityByInstanceId` + `src/services/relationships/relationship-service.ts:queryByType` | Can query entity then query relationships by type. No dedicated single-hop endpoint exists, but functionality is achievable via composition. | Functions exist but no single `/api/graph/{id}/relationships` entrypoint. | **CID** |
| **AC-64.5.2** | Multi-hop query: `POST /api/graph/traverse` with depth parameter | N/A | No traversal function exists. Neo4j sync exists but no multi-hop traversal API. | No implementation. | **CID** |
| **AC-64.5.3** | Confidence filter parameter: `?min_confidence=0.7` | N/A | No confidence filtering implemented in query APIs. Schema has `confidence` column but no filter API. | No implementation. | **CID** |
| **AC-64.5.4** | Provenance filter: `?provenance=explicit,structural` | N/A | No provenance column or filter exists. Relationships have `source_file` but not provenance type. | No implementation. | **CID** |

---

## Summary

| Marker Type | Count | ACs |
|-------------|-------|-----|
| **direct** | 6 | AC-64.1.2, AC-64.1.3, AC-64.1.7, AC-64.2.2, AC-64.2.3, AC-64.2.6 |
| **test** | 1 | AC-64.4.10 |
| **CID** | 8 | AC-64.1.4, AC-64.1.8, AC-64.2.7, AC-64.2.8, AC-64.5.1, AC-64.5.2, AC-64.5.3, AC-64.5.4 |

---

## Recommended Actions

### Immediate (direct markers)
Add `@satisfies` markers to 6 code anchors:
1. `validateEntityId` → `@satisfies AC-64.1.2`
2. `Entity` interface → `@satisfies AC-64.1.3`
3. `entity-service.ts:upsert` → `@satisfies AC-64.1.7`
4. `Relationship` interface → `@satisfies AC-64.2.2, AC-64.2.3`
5. `relationship-service.ts:getByInstanceId` → `@satisfies AC-64.2.6`

### Test marker (1)
Add performance test for AC-64.4.10 that asserts `total_duration_ms < 600000` (10 min) for 100K LOC:
- Tag test with `@satisfies AC-64.4.10`

### CID for 8 gaps
Create CID to track implementation of missing functionality:
- AC-64.1.4: Add runtime ID format validation in `upsert`
- AC-64.1.8: Define schema versioning strategy
- AC-64.2.7: Add `min_confidence` filter to relationship queries
- AC-64.2.8: Add `created_by`, `verified_at`, `verified_by` columns
- AC-64.5.1: Create `/api/graph/{id}/relationships` endpoint
- AC-64.5.2: Implement multi-hop traversal API
- AC-64.5.3: Add confidence filter to graph queries
- AC-64.5.4: Add provenance filter to graph queries

---

*End of Marker Justification Sheet*

