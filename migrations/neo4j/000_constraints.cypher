// @implements INFRASTRUCTURE
// Neo4j constraints and indexes - basic entity uniqueness

// Unique constraint on Entity.id
CREATE CONSTRAINT entity_id IF NOT EXISTS FOR (e:Entity) REQUIRE e.id IS UNIQUE;

// Index on Entity.type for type-based queries
CREATE INDEX entity_type IF NOT EXISTS FOR (e:Entity) ON (e.type);

// Index on Entity.project_id for project isolation
CREATE INDEX entity_project IF NOT EXISTS FOR (e:Entity) ON (e.project_id);

// ============================================================================
// Relationship Indexes (A2 Phase 0)
// ============================================================================
// NOTE: Neo4j Community Edition does not support relationship property
// uniqueness constraints. Uniqueness is enforced via:
// 1. Deterministic instance_id generation (R{XX}:{from}:{to})
// 2. All writes use MERGE pattern (never raw CREATE)
// 3. Post-sync duplicate detection gate

// Index for fast MERGE lookups (required for performance)
CREATE INDEX rel_project_instance_index IF NOT EXISTS
FOR ()-[r:RELATIONSHIP]-()
ON (r.project_id, r.instance_id);

// Index for querying by relationship type
CREATE INDEX rel_type_index IF NOT EXISTS
FOR ()-[r:RELATIONSHIP]-()
ON (r.relationship_type);

// Index for querying by project
CREATE INDEX rel_project_index IF NOT EXISTS
FOR ()-[r:RELATIONSHIP]-()
ON (r.project_id);
