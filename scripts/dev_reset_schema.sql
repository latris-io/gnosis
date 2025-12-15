-- scripts/dev_reset_schema.sql
-- @implements INFRASTRUCTURE
-- WARNING: DEV ONLY - This script DESTROYS ALL DATA
-- Purpose: Reset to Cursor Plan schema with composite uniqueness
-- Usage: Only run on empty dev databases
--
-- To run: psql $DATABASE_URL -f scripts/dev_reset_schema.sql

-- Drop existing tables
DROP TABLE IF EXISTS relationships CASCADE;
DROP TABLE IF EXISTS entities CASCADE;

-- Ensure extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ENTITIES TABLE (per Cursor Plan, with composite uniqueness)
CREATE TABLE entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(10) NOT NULL,
  instance_id VARCHAR(500) NOT NULL,
  name VARCHAR(255) NOT NULL,
  attributes JSONB DEFAULT '{}',
  source_file VARCHAR(500),
  line_start INTEGER,
  line_end INTEGER,
  content_hash VARCHAR(71),
  extracted_at TIMESTAMPTZ DEFAULT NOW(),
  project_id UUID NOT NULL REFERENCES projects(id),
  
  CONSTRAINT valid_entity_type CHECK (entity_type ~ '^E[0-9]{2}$'),
  CONSTRAINT entities_project_instance_unique UNIQUE (project_id, instance_id)
);

-- Indexes
CREATE INDEX idx_entities_type ON entities(entity_type);
CREATE INDEX idx_entities_project ON entities(project_id);
CREATE INDEX idx_entities_instance ON entities(instance_id);
CREATE INDEX idx_entities_project_instance ON entities(project_id, instance_id);

-- RLS
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
CREATE POLICY entities_isolation ON entities
  USING (project_id = current_setting('app.current_project', true)::UUID);

-- RELATIONSHIPS TABLE (per Cursor Plan, with composite uniqueness)
CREATE TABLE relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_type VARCHAR(10) NOT NULL,
  instance_id VARCHAR(500) NOT NULL,
  name VARCHAR(100) NOT NULL,
  from_entity_id UUID NOT NULL REFERENCES entities(id) DEFERRABLE INITIALLY DEFERRED,
  to_entity_id UUID NOT NULL REFERENCES entities(id) DEFERRABLE INITIALLY DEFERRED,
  confidence DECIMAL(3,2) DEFAULT 1.0,
  extracted_at TIMESTAMPTZ DEFAULT NOW(),
  project_id UUID NOT NULL REFERENCES projects(id),
  
  CONSTRAINT valid_relationship_type CHECK (relationship_type ~ '^R[0-9]{2}$'),
  CONSTRAINT valid_confidence CHECK (confidence >= 0 AND confidence <= 1),
  CONSTRAINT relationships_project_instance_unique UNIQUE (project_id, instance_id)
);

-- Indexes
CREATE INDEX idx_relationships_type ON relationships(relationship_type);
CREATE INDEX idx_relationships_from ON relationships(from_entity_id);
CREATE INDEX idx_relationships_to ON relationships(to_entity_id);
CREATE INDEX idx_relationships_project ON relationships(project_id);
CREATE INDEX idx_relationships_project_instance ON relationships(project_id, instance_id);

-- RLS
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
CREATE POLICY relationships_isolation ON relationships
  USING (project_id = current_setting('app.current_project', true)::UUID);

-- Verify
SELECT 'DEV RESET COMPLETE: entities and relationships tables created with composite uniqueness' AS status;
