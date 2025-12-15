-- migrations/003_reset_schema_to_cursor_plan.sql
-- @implements INFRASTRUCTURE
-- Purpose: Reset schema to match Cursor Plan canonical specification (lines 443-507)
-- Note: DEFERRABLE on relationship FKs is a canonical-compatible extension for ingestion ordering

-- Drop tables created by incorrect 001/002
DROP TABLE IF EXISTS relationships CASCADE;
DROP TABLE IF EXISTS entities CASCADE;

-- Ensure pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================================
-- ENTITIES TABLE (per Cursor Plan lines 444-467)
-- =============================================================================
CREATE TABLE entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(10) NOT NULL,
  instance_id VARCHAR(500) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  attributes JSONB DEFAULT '{}',
  source_file VARCHAR(500),
  line_start INTEGER,
  line_end INTEGER,
  content_hash VARCHAR(71),  -- Format: sha256:... (7 + 64 = 71 chars)
  extracted_at TIMESTAMPTZ DEFAULT NOW(),
  project_id UUID NOT NULL REFERENCES projects(id),
  CONSTRAINT valid_entity_type CHECK (entity_type ~ '^E[0-9]{2}$')
);

-- Indexes (per Cursor Plan lines 461-463) - use EXACT names from Cursor Plan
CREATE INDEX idx_entities_type ON entities(entity_type);
CREATE INDEX idx_entities_project ON entities(project_id);
CREATE INDEX idx_entities_instance ON entities(instance_id);

-- RLS (per Cursor Plan lines 466-468)
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
CREATE POLICY entities_allow_all ON entities USING (true);  -- Permissive initially per line 429

-- =============================================================================
-- RELATIONSHIPS TABLE (per Cursor Plan lines 470-494)
-- =============================================================================
CREATE TABLE relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_type VARCHAR(10) NOT NULL,
  instance_id VARCHAR(500) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  from_entity_id UUID NOT NULL REFERENCES entities(id) DEFERRABLE INITIALLY DEFERRED,
  to_entity_id UUID NOT NULL REFERENCES entities(id) DEFERRABLE INITIALLY DEFERRED,
  confidence DECIMAL(3,2) DEFAULT 1.0,
  extracted_at TIMESTAMPTZ DEFAULT NOW(),
  project_id UUID NOT NULL REFERENCES projects(id),
  CONSTRAINT valid_relationship_type CHECK (relationship_type ~ '^R[0-9]{2}$'),
  CONSTRAINT valid_confidence CHECK (confidence >= 0 AND confidence <= 1)
);

-- Indexes (per Cursor Plan lines 487-490) - use EXACT names from Cursor Plan
CREATE INDEX idx_relationships_type ON relationships(relationship_type);
CREATE INDEX idx_relationships_from ON relationships(from_entity_id);
CREATE INDEX idx_relationships_to ON relationships(to_entity_id);
CREATE INDEX idx_relationships_project ON relationships(project_id);

-- RLS (per Cursor Plan lines 492-495)
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
CREATE POLICY relationships_allow_all ON relationships USING (true);  -- Permissive initially per line 429
