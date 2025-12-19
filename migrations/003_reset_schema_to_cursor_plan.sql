-- migrations/003_reset_schema_to_cursor_plan.sql
-- @implements INFRASTRUCTURE
--
-- PURPOSE: Reset schema to Cursor Plan V20.8.5 specification
-- WARNING: Drops and recreates tables. Only safe on dev/empty databases.
--
-- This migration replaces the schema from 001/002 with the authoritative
-- Cursor Plan schema including:
--   - entity_type/relationship_type (E-codes/R-codes)
--   - instance_id for stable business keys
--   - Composite uniqueness: UNIQUE(project_id, instance_id)
--   - Flat provenance fields (source_file, line_start, line_end)
--   - content_hash for change detection
--   - confidence for relationships

-- Drop old schema (from 001/002)
DROP TABLE IF EXISTS relationships CASCADE;
DROP TABLE IF EXISTS entities CASCADE;

-- Ensure extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================================
-- ENTITIES TABLE (per Cursor Plan V20.8.5 lines 443-468)
-- =============================================================================
CREATE TABLE entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(10) NOT NULL,
  instance_id VARCHAR(500) NOT NULL,
  name VARCHAR(255) NOT NULL,
  attributes JSONB DEFAULT '{}',
  content_hash VARCHAR(71),
  source_file VARCHAR(500),
  line_start INTEGER,
  line_end INTEGER,
  extracted_at TIMESTAMPTZ DEFAULT NOW(),
  project_id UUID NOT NULL REFERENCES projects(id),
  
  -- Constraints
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
  USING (project_id = current_setting('app.project_id', true)::UUID);

-- =============================================================================
-- RELATIONSHIPS TABLE (per Cursor Plan V20.8.5 lines 471-495)
-- =============================================================================
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
  
  -- Constraints
  -- IMPORTANT: Uses ^R[0-9]{2}$ (2-digit only) per Cursor Plan line 482
  -- R113/R114 are DORMANT until Track D.9 per cursorrules line 106
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
  USING (project_id = current_setting('app.project_id', true)::UUID);

