-- migrations/005_drop_legacy_instance_id_constraint.sql
-- @implements INFRASTRUCTURE
-- PURPOSE: Remove legacy single-column uniqueness constraint that blocks multi-tenant upserts
-- REASON: Track A requires UNIQUE (project_id, instance_id) only
-- IDEMPOTENT: Uses IF EXISTS to safely run on fresh or existing databases

ALTER TABLE relationships
  DROP CONSTRAINT IF EXISTS relationships_instance_id_key;

-- NOTE: The correct constraint (relationships_project_instance_unique) is NOT touched.
