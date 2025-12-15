-- migrations/003_identity_composite_uniqueness.sql
-- @implements INFRASTRUCTURE
-- Purpose: Enforce project-scoped identity (project_id, instance_id)
-- Safe: Non-destructive, idempotent constraint changes only
--
-- This migration:
-- 1. Drops global UNIQUE(instance_id) if it exists
-- 2. Adds composite UNIQUE(project_id, instance_id)
-- 3. Adds helpful indexes
--
-- To run: psql $DATABASE_URL -f migrations/003_identity_composite_uniqueness.sql

-- ENTITIES: Drop global unique(instance_id) if it exists (but not composite)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE t.relname = 'entities'
      AND c.contype = 'u'
      AND pg_get_constraintdef(c.oid) ILIKE '%(instance_id)%'
      AND pg_get_constraintdef(c.oid) NOT ILIKE '%project_id%'
  ) THEN
    EXECUTE (
      SELECT format('ALTER TABLE entities DROP CONSTRAINT %I;', c.conname)
      FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid
      WHERE t.relname = 'entities'
        AND c.contype = 'u'
        AND pg_get_constraintdef(c.oid) ILIKE '%(instance_id)%'
        AND pg_get_constraintdef(c.oid) NOT ILIKE '%project_id%'
      LIMIT 1
    );
    RAISE NOTICE 'Dropped global unique constraint on entities.instance_id';
  ELSE
    RAISE NOTICE 'No global unique constraint on entities.instance_id found (OK)';
  END IF;
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
      AND pg_get_constraintdef(c.oid) ILIKE '%(project_id, instance_id)%'
  ) THEN
    ALTER TABLE entities
      ADD CONSTRAINT entities_project_instance_unique UNIQUE (project_id, instance_id);
    RAISE NOTICE 'Added composite unique constraint on entities(project_id, instance_id)';
  ELSE
    RAISE NOTICE 'Composite unique constraint on entities already exists (OK)';
  END IF;
END $$;

-- RELATIONSHIPS: Drop global unique(instance_id) if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE t.relname = 'relationships'
      AND c.contype = 'u'
      AND pg_get_constraintdef(c.oid) ILIKE '%(instance_id)%'
      AND pg_get_constraintdef(c.oid) NOT ILIKE '%project_id%'
  ) THEN
    EXECUTE (
      SELECT format('ALTER TABLE relationships DROP CONSTRAINT %I;', c.conname)
      FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid
      WHERE t.relname = 'relationships'
        AND c.contype = 'u'
        AND pg_get_constraintdef(c.oid) ILIKE '%(instance_id)%'
        AND pg_get_constraintdef(c.oid) NOT ILIKE '%project_id%'
      LIMIT 1
    );
    RAISE NOTICE 'Dropped global unique constraint on relationships.instance_id';
  ELSE
    RAISE NOTICE 'No global unique constraint on relationships.instance_id found (OK)';
  END IF;
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
      AND pg_get_constraintdef(c.oid) ILIKE '%(project_id, instance_id)%'
  ) THEN
    ALTER TABLE relationships
      ADD CONSTRAINT relationships_project_instance_unique UNIQUE (project_id, instance_id);
    RAISE NOTICE 'Added composite unique constraint on relationships(project_id, instance_id)';
  ELSE
    RAISE NOTICE 'Composite unique constraint on relationships already exists (OK)';
  END IF;
END $$;

-- Add composite indexes if not exist
CREATE INDEX IF NOT EXISTS idx_entities_project_instance ON entities(project_id, instance_id);
CREATE INDEX IF NOT EXISTS idx_relationships_project_instance ON relationships(project_id, instance_id);

-- Verify
SELECT 'Migration 003 complete: composite uniqueness enforced' AS status;
