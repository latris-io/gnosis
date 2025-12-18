// src/ops/track-a.ts
// @implements STORY-64.1
// @implements STORY-64.2
// Operator/CLI entrypoints - delegates to services, MUST NOT import db
// NOT public API surface (per A5), but enforces G-API boundary

import { resolveProjectId, type ProjectIdentity } from '../services/projects/project-service.js';
import { batchUpsert, type UpsertResult } from '../services/entities/entity-service.js';
import { 
  syncEntitiesToNeo4j, 
  syncRelationshipsToNeo4j as serviceSyncRelationships 
} from '../services/sync/sync-service.js';
import { closeConnections } from '../services/connections/connection-service.js';
import {
  checkConstraints as serviceCheckConstraints,
  fixUpsertConstraint as serviceFixConstraint,
  getDbInfo as serviceGetDbInfo,
  closeAdminPool,
  type ConstraintCheckResult,
} from '../services/admin/admin-service.js';
import type { ExtractedEntity } from '../extraction/types.js';

// Re-export types for convenience
export type { ProjectIdentity, UpsertResult, ConstraintCheckResult };

/**
 * Resolve project by UUID or slug.
 * Creates project if slug provided and not found.
 */
export async function initProject(opts: {
  projectId?: string;
  projectSlug?: string;
}): Promise<ProjectIdentity> {
  return resolveProjectId(opts);
}

/**
 * Batch upsert entities for A1 extraction.
 * Delegates to entity-service.
 */
export async function persistEntities(
  projectId: string,
  entities: ExtractedEntity[]
): Promise<UpsertResult[]> {
  return batchUpsert(projectId, entities);
}

/**
 * Sync entities from Postgres to Neo4j.
 * Delegates to sync-service.
 */
export async function syncToNeo4j(projectId: string): Promise<{ synced: number }> {
  return syncEntitiesToNeo4j(projectId);
}

/**
 * Sync relationships from Postgres to Neo4j.
 * Delegates to sync-service.
 */
export async function syncRelationshipsToNeo4j(
  projectId: string
): Promise<{ synced: number; skipped: number }> {
  return serviceSyncRelationships(projectId);
}

/**
 * Close all database connections.
 * Use for graceful shutdown.
 */
export { closeConnections };

// ============================================================================
// Admin Operations (for infrastructure scripts)
// ============================================================================

/**
 * Get database connection info (with password redacted).
 */
export function getDbInfo() {
  return serviceGetDbInfo();
}

/**
 * Check entity table constraints.
 */
export async function checkConstraints(): Promise<ConstraintCheckResult> {
  return serviceCheckConstraints();
}

/**
 * Fix missing upsert constraint.
 * DANGEROUS: Only call with proper gates.
 */
export async function fixUpsertConstraint(): Promise<void> {
  return serviceFixConstraint();
}

/**
 * Close admin pool (for check-constraints script).
 */
export { closeAdminPool };

// NOTE: Test-only destructive helpers (createTestProject, deleteProjectEntities, deleteProject)
// have been moved to src/services/admin/admin-test-only.ts with NODE_ENV guard.
// Tests should import from test/utils/admin-test-only.ts

// NOTE: getEntityCounts NOT included - scripts count in-memory, tests use api/v1
