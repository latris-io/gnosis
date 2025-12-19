-- @implements INFRASTRUCTURE
-- Initial database schema: extensions, projects table, migrations table, RLS helper
-- Phase 0A: Foundational infrastructure only (no Track A entities/relationships)

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects table (multi-tenant isolation)
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Migrations tracking table
CREATE TABLE IF NOT EXISTS migrations (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS helper function: sets project context for row-level security
CREATE OR REPLACE FUNCTION set_project_id(project_uuid UUID)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.project_id', project_uuid::text, false);
END;
$$ LANGUAGE plpgsql;

-- Index for project lookups
CREATE INDEX IF NOT EXISTS idx_projects_name ON projects(name);

