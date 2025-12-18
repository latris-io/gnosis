// src/ops/track-a.ts
// @implements STORY-64.1
// @implements STORY-64.2
// Operator/CLI entrypoints - delegates to services, MUST NOT import db
// NOT public API surface (per A5), but enforces G-API boundary

import { resolveProjectId, type ProjectIdentity } from '../services/projects/project-service.js';
import { batchUpsert, type UpsertResult as EntityUpsertResult } from '../services/entities/entity-service.js';
import { 
  batchUpsert as relBatchUpsert,
  batchUpsertAndSync as relBatchUpsertAndSync,
  type UpsertResult as RelationshipUpsertResult,
  type BatchUpsertAndSyncResult,
} from '../services/relationships/relationship-service.js';
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
import type { ExtractedEntity, ExtractedRelationship } from '../extraction/types.js';
import { deriveBrdRelationships } from '../extraction/providers/brd-relationship-provider.js';
import { queryEntities } from '../api/v1/entities.js';
import type { EntityTypeCode } from '../schema/track-a/entities.js';

// Re-export types for convenience
export type { ProjectIdentity, ConstraintCheckResult, BatchUpsertAndSyncResult };
export type { EntityUpsertResult, RelationshipUpsertResult };

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
): Promise<EntityUpsertResult[]> {
  return batchUpsert(projectId, entities);
}

/**
 * Batch upsert relationships (PostgreSQL only, no Neo4j sync).
 * Delegates to relationship-service.
 */
export async function persistRelationships(
  projectId: string,
  relationships: ExtractedRelationship[]
): Promise<RelationshipUpsertResult[]> {
  return relBatchUpsert(projectId, relationships);
}

/**
 * Batch upsert relationships AND sync to Neo4j.
 * Delegates to relationship-service.
 */
export async function persistRelationshipsAndSync(
  projectId: string,
  relationships: ExtractedRelationship[]
): Promise<BatchUpsertAndSyncResult> {
  return relBatchUpsertAndSync(projectId, relationships);
}

/**
 * Extract and persist BRD hierarchy relationships (R01/R02/R03).
 * 
 * Queries existing BRD entities (E01 Epic, E02 Story, E03 AC, E04 Constraint)
 * and derives parent-child relationships from instance_id patterns.
 * 
 * @satisfies AC-64.2.1, AC-64.2.2, AC-64.2.3
 */
export async function extractAndPersistBrdRelationships(projectId: string): Promise<{
  extracted: number;
  persisted: number;
  synced: number;
}> {
  // Query BRD entities via api/v1 (G-API compliant - no direct DB import)
  const brdTypes: EntityTypeCode[] = ['E01', 'E02', 'E03', 'E04'];
  const entityPromises = brdTypes.map(t => queryEntities(projectId, t));
  const entityArrays = await Promise.all(entityPromises);
  
  // Normalize to snake_case (handles both snake_case and camelCase returns)
  const entities = entityArrays.flat().map((e: any) => ({
    entity_type: e.entity_type ?? e.entityType,
    instance_id: e.instance_id ?? e.instanceId,
    source_file: e.source_file ?? e.sourceFile,
    line_start: e.line_start ?? e.lineStart,
    line_end: e.line_end ?? e.lineEnd,
  }));
  
  if (entities.length === 0) {
    return { extracted: 0, persisted: 0, synced: 0 };
  }
  
  // Derive relationships (pure transform)
  const relationships = deriveBrdRelationships(entities);
  
  if (relationships.length === 0) {
    return { extracted: 0, persisted: 0, synced: 0 };
  }
  
  // Persist and sync via existing persistRelationshipsAndSync (already in this file)
  const persistResult = await persistRelationshipsAndSync(projectId, relationships);
  
  return {
    extracted: relationships.length,
    persisted: persistResult.results.filter(r => r.operation !== 'NO-OP').length,
    synced: persistResult.neo4jSync?.synced ?? 0,
  };
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
