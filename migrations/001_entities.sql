-- @implements INFRASTRUCTURE
-- Track A Entities table schema
-- Required for SANITY-010: Database Schema Matches TypeScript Types

CREATE TABLE IF NOT EXISTS entities (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  attributes JSONB NOT NULL DEFAULT '{}',
  evidence JSONB NOT NULL,
  project_id UUID NOT NULL REFERENCES projects(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(type);
CREATE INDEX IF NOT EXISTS idx_entities_project ON entities(project_id);
CREATE INDEX IF NOT EXISTS idx_entities_attributes ON entities USING GIN(attributes);
CREATE INDEX IF NOT EXISTS idx_entities_created ON entities(created_at);

-- Row-Level Security for project isolation
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS entities_project_isolation ON entities;
CREATE POLICY entities_project_isolation ON entities
  USING (project_id = current_setting('app.project_id', true)::UUID);
