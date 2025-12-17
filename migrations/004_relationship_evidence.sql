-- migrations/004_relationship_evidence.sql
-- @implements INFRASTRUCTURE
-- PURPOSE: Add evidence anchor columns to relationships table
-- PREREQUISITE: relationships table must be empty (Track A has 0 relationships)
--
-- Per Pre-A2 Hardening Plan:
-- - Constraint A.2 requires evidence anchors for all relationships
-- - These columns mirror the entity pattern (source_file, line_start, line_end)
-- - content_hash enables change detection in upsert operations

-- Safety guard: fail if relationships exist (makes NOT NULL safe)
DO $$
DECLARE
  rel_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO rel_count FROM relationships;
  IF rel_count > 0 THEN
    RAISE EXCEPTION 'Cannot add NOT NULL evidence columns: relationships table is not empty. Count: %', rel_count;
  END IF;
END $$;

-- Add ALL columns in single atomic ALTER TABLE (prevents partial application)
ALTER TABLE relationships
  ADD COLUMN source_file VARCHAR(500) NOT NULL,
  ADD COLUMN line_start INTEGER NOT NULL,
  ADD COLUMN line_end INTEGER NOT NULL,
  ADD COLUMN content_hash VARCHAR(100),
  ADD CONSTRAINT valid_line_range CHECK (line_end >= line_start);

-- NOTE: Skipping index on source_file for now; not required for Track A correctness.
-- Add later if provenance queries are needed:
-- CREATE INDEX idx_relationships_source_file ON relationships(source_file);
