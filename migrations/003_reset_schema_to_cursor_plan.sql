-- migrations/003_reset_schema_to_cursor_plan.sql
-- @implements INFRASTRUCTURE
--
-- Purpose: Align schema constraints with Cursor Plan V20.8.5
-- This is a CONSTRAINT PATCH, not a full schema reset.
-- Tables are created in 001/002; this migration enforces:
--   - Composite uniqueness: (project_id, instance_id)
--   - Removes any global-only instance_id uniqueness
--
-- Safe: Non-destructive, idempotent

-- ============================================================
-- ENTITIES: Drop ALL global unique constraints on instance_id
-- (loops to handle multiple constraints if they exist)
-- ============================================================
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE t.relname = 'entities'
      AND c.contype = 'u'
      AND pg_get_constraintdef(c.oid) ILIKE '%(instance_id)%'
      AND pg_get_constraintdef(c.oid) NOT ILIKE '%project_id%'
  LOOP
    EXECUTE format('ALTER TABLE entities DROP CONSTRAINT %I', r.conname);
    RAISE NOTICE 'Dropped constraint: %', r.conname;
  END LOOP;
END $$;

-- ENTITIES: Add composite unique if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE t.relname = 'entities'
      AND c.contype = 'u'
      AND (pg_get_constraintdef(c.oid) ILIKE '%(project_id, instance_id)%'
           OR pg_get_constraintdef(c.oid) ILIKE '%(instance_id, project_id)%')
  ) THEN
    ALTER TABLE entities
      ADD CONSTRAINT entities_project_instance_unique UNIQUE (project_id, instance_id);
    RAISE NOTICE 'Added composite unique constraint on entities(project_id, instance_id)';
  END IF;
END $$;

-- ============================================================
-- RELATIONSHIPS: Drop ALL global unique constraints on instance_id
-- ============================================================
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE t.relname = 'relationships'
      AND c.contype = 'u'
      AND pg_get_constraintdef(c.oid) ILIKE '%(instance_id)%'
      AND pg_get_constraintdef(c.oid) NOT ILIKE '%project_id%'
  LOOP
    EXECUTE format('ALTER TABLE relationships DROP CONSTRAINT %I', r.conname);
    RAISE NOTICE 'Dropped constraint: %', r.conname;
  END LOOP;
END $$;

-- RELATIONSHIPS: Add composite unique if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE t.relname = 'relationships'
      AND c.contype = 'u'
      AND (pg_get_constraintdef(c.oid) ILIKE '%(project_id, instance_id)%'
           OR pg_get_constraintdef(c.oid) ILIKE '%(instance_id, project_id)%')
  ) THEN
    ALTER TABLE relationships
      ADD CONSTRAINT relationships_project_instance_unique UNIQUE (project_id, instance_id);
    RAISE NOTICE 'Added composite unique constraint on relationships(project_id, instance_id)';
  END IF;
END $$;

-- ============================================================
-- INDEXES: Add composite indexes (idempotent)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_entities_project_instance 
  ON entities(project_id, instance_id);
CREATE INDEX IF NOT EXISTS idx_relationships_project_instance 
  ON relationships(project_id, instance_id);

-- Verification query (for manual sanity check)
-- SELECT c.conname, pg_get_constraintdef(c.oid) 
-- FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid 
-- WHERE t.relname IN ('entities', 'relationships') AND c.contype = 'u';
