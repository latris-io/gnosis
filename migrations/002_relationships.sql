-- @implements INFRASTRUCTURE
-- Track A Relationships table schema
-- Required for SANITY-010: Database Schema Matches TypeScript Types
-- Per story cards (A2_RELATIONSHIP_REGISTRY.md): source_id/target_id column names

CREATE TABLE IF NOT EXISTS relationships (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  source_id TEXT NOT NULL,  -- Per story cards (no hard FK to allow batch insertion)
  target_id TEXT NOT NULL,  -- Per story cards (no hard FK to allow batch insertion)
  attributes JSONB NOT NULL DEFAULT '{}',
  evidence JSONB NOT NULL,
  project_id UUID NOT NULL REFERENCES projects(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Note: No hard FK constraints on source_id/target_id to allow batch insertion
-- Validation performed at application level (SANITY-011)

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_relationships_type ON relationships(type);
CREATE INDEX IF NOT EXISTS idx_relationships_source ON relationships(source_id);
CREATE INDEX IF NOT EXISTS idx_relationships_target ON relationships(target_id);
CREATE INDEX IF NOT EXISTS idx_relationships_project ON relationships(project_id);
CREATE INDEX IF NOT EXISTS idx_relationships_created ON relationships(created_at);

-- Composite index for relationship traversal
CREATE INDEX IF NOT EXISTS idx_relationships_source_type ON relationships(source_id, type);
CREATE INDEX IF NOT EXISTS idx_relationships_target_type ON relationships(target_id, type);

-- Row-Level Security for project isolation
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS relationships_project_isolation ON relationships;
CREATE POLICY relationships_project_isolation ON relationships
  USING (project_id = current_setting('app.project_id', true)::UUID);
