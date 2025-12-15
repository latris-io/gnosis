// @implements INFRASTRUCTURE
// Neo4j constraints and indexes - basic entity uniqueness

// Unique constraint on Entity.id
CREATE CONSTRAINT entity_id IF NOT EXISTS FOR (e:Entity) REQUIRE e.id IS UNIQUE;

// Index on Entity.type for type-based queries
CREATE INDEX entity_type IF NOT EXISTS FOR (e:Entity) ON (e.type);

// Index on Entity.project_id for project isolation
CREATE INDEX entity_project IF NOT EXISTS FOR (e:Entity) ON (e.project_id);
