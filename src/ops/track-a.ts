// src/ops/track-a.ts
// @implements STORY-64.1
// @implements STORY-64.2
// @tdd TDD-A2-RELATIONSHIP-REGISTRY
// @tdd TDD-A4-STRUCTURAL-ANALYSIS
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
  deleteR04Relationships as serviceDeleteR04,
  deleteE15ByInstanceIds as serviceDeleteE15,
  deleteInvalidE15FromNeo4j as serviceDeleteNeo4jE15,
  closeNeo4jDriver as serviceCloseNeo4j,
  type ConstraintCheckResult,
} from '../services/admin/admin-service.js';
import type { ExtractedEntity, ExtractedRelationship } from '../extraction/types.js';
import { deriveBrdRelationships } from '../extraction/providers/brd-relationship-provider.js';
import { 
  deriveModulesFromFiles, 
  validateModuleSemantics,
  type SourceFileInput 
} from '../extraction/providers/module-derivation-provider.js';
import { 
  deriveR04, 
  deriveR05, 
  deriveR06, 
  deriveR07,
  type EntityInput 
} from '../extraction/providers/containment-derivation-provider.js';
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
  entitiesSynced: number;
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
    return { extracted: 0, persisted: 0, synced: 0, entitiesSynced: 0 };
  }
  
  // Derive relationships (pure transform)
  const relationships = deriveBrdRelationships(entities);
  
  if (relationships.length === 0) {
    return { extracted: 0, persisted: 0, synced: 0, entitiesSynced: 0 };
  }
  
  // Persist and sync via existing persistRelationshipsAndSync (already in this file)
  const persistResult = await persistRelationshipsAndSync(projectId, relationships);
  
  return {
    extracted: relationships.length,
    persisted: persistResult.results.filter(r => r.operation !== 'NO-OP').length,
    synced: persistResult.neo4jSync?.synced ?? 0,
    entitiesSynced: persistResult.neo4jSync?.entitiesSynced ?? 0,
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
// E15 Module Derivation + R04-R07 Containment Relationships
// ============================================================================

/**
 * Extract and persist E15 Module entities derived from E11 SourceFile directory structure.
 * 
 * Derivation:
 * - E15 modules are derived from unique parent directories of E11 files
 * - Skips root-level files (dirname is '.' or empty)
 * - Witness file: lexicographically smallest instance_id for evidence
 * - Sets attributes.derived_from = 'directory-structure'
 */
export async function extractAndPersistModules(projectId: string): Promise<{
  derived: number;
  persisted: number;
  synced: number;
}> {
  // Query E11 SourceFile entities via api/v1 (G-API compliant)
  const e11Entities = await queryEntities(projectId, 'E11');
  
  // Convert to SourceFileInput format
  const sourceFiles: SourceFileInput[] = e11Entities.map((e: any) => ({
    instance_id: e.instance_id ?? e.instanceId,
    source_file: e.source_file ?? e.sourceFile,
    line_start: e.line_start ?? e.lineStart ?? 1,
    line_end: e.line_end ?? e.lineEnd ?? 1,
  }));
  
  if (sourceFiles.length === 0) {
    return { derived: 0, persisted: 0, synced: 0 };
  }
  
  // Derive E15 modules from directory structure (pure transform)
  const modules = deriveModulesFromFiles(sourceFiles);
  
  if (modules.length === 0) {
    return { derived: 0, persisted: 0, synced: 0 };
  }
  
  // Persist via entity-service
  const persistResults = await batchUpsert(projectId, modules);
  const persisted = persistResults.filter(r => r.operation !== 'NO-OP').length;
  
  // Sync to Neo4j
  const syncResult = await syncEntitiesToNeo4j(projectId);
  
  return {
    derived: modules.length,
    persisted,
    synced: syncResult.synced,
  };
}

/**
 * Verify E15 Module semantics against E11 SourceFile corpus.
 * 
 * Semantics Rule:
 * MOD-<dir> is valid iff there exists at least one E11 with instance_id prefix FILE-<dir>/
 * 
 * @returns Validation result with valid and invalid module lists
 */
export async function verifyE15Semantics(projectId: string): Promise<{
  valid: number;
  invalid: number;
  invalidModules: string[];
}> {
  // Query E11 and E15 entities via api/v1 (G-API compliant)
  const [e11Entities, e15Entities] = await Promise.all([
    queryEntities(projectId, 'E11'),
    queryEntities(projectId, 'E15'),
  ]);
  
  // Convert to input formats
  const e11Files: SourceFileInput[] = e11Entities.map((e: any) => ({
    instance_id: e.instance_id ?? e.instanceId,
    source_file: e.source_file ?? e.sourceFile,
    line_start: e.line_start ?? e.lineStart ?? 1,
    line_end: e.line_end ?? e.lineEnd ?? 1,
  }));
  
  const modules = e15Entities.map((e: any) => ({
    entity_type: e.entity_type ?? e.entityType,
    instance_id: e.instance_id ?? e.instanceId,
    name: e.name,
    attributes: e.attributes ?? {},
    source_file: e.source_file ?? e.sourceFile,
    line_start: e.line_start ?? e.lineStart ?? 1,
    line_end: e.line_end ?? e.lineEnd ?? 1,
  }));
  
  // Validate semantics (pure transform)
  const result = validateModuleSemantics(modules, e11Files);
  
  return {
    valid: result.valid.length,
    invalid: result.invalid.length,
    invalidModules: result.invalid.map(m => m.instance_id),
  };
}

/**
 * Verify prerequisites for containment relationship extraction.
 * Checks that required entity types exist before derivation.
 * 
 * Required for R04-R07:
 * - R04: E15 Module, E11 SourceFile
 * - R05: E11 SourceFile, E12 Function, E13 Class
 * - R06: E27 TestFile, E28 TestSuite
 * - R07: E28 TestSuite, E29 TestCase
 */
export async function verifyContainmentPrerequisites(projectId: string): Promise<{
  ready: boolean;
  counts: Record<EntityTypeCode, number>;
  missing: EntityTypeCode[];
}> {
  const requiredTypes: EntityTypeCode[] = ['E11', 'E12', 'E13', 'E15', 'E27', 'E28', 'E29'];
  
  const entityPromises = requiredTypes.map(t => queryEntities(projectId, t));
  const entityArrays = await Promise.all(entityPromises);
  
  const counts: Record<string, number> = {};
  const missing: EntityTypeCode[] = [];
  
  requiredTypes.forEach((type, i) => {
    counts[type] = entityArrays[i].length;
    if (entityArrays[i].length === 0) {
      missing.push(type);
    }
  });
  
  return {
    ready: missing.length === 0,
    counts: counts as Record<EntityTypeCode, number>,
    missing,
  };
}

/**
 * Extract and persist containment relationships (R04-R07).
 * 
 * Derives from existing entities:
 * - R04: Module CONTAINS_FILE SourceFile
 * - R05: SourceFile CONTAINS_ENTITY Function/Class
 * - R06: TestFile CONTAINS_SUITE TestSuite
 * - R07: TestSuite CONTAINS_CASE TestCase
 * 
 * Evidence comes from the TO entity in each relationship.
 * 
 * @satisfies AC-64.2.4, AC-64.2.5, AC-64.2.6, AC-64.2.7
 */
export async function extractAndPersistContainmentRelationships(projectId: string): Promise<{
  r04: { extracted: number; persisted: number };
  r05: { extracted: number; persisted: number };
  r06: { extracted: number; persisted: number };
  r07: { extracted: number; persisted: number };
  total: { extracted: number; persisted: number; synced: number };
}> {
  // Query all required entity types via api/v1 (G-API compliant)
  const [e11s, e12s, e13s, e15s, e27s, e28s, e29s] = await Promise.all([
    queryEntities(projectId, 'E11'),
    queryEntities(projectId, 'E12'),
    queryEntities(projectId, 'E13'),
    queryEntities(projectId, 'E15'),
    queryEntities(projectId, 'E27'),
    queryEntities(projectId, 'E28'),
    queryEntities(projectId, 'E29'),
  ]);
  
  // Normalize to EntityInput format
  const normalize = (e: any): EntityInput => ({
    entity_type: e.entity_type ?? e.entityType,
    instance_id: e.instance_id ?? e.instanceId,
    source_file: e.source_file ?? e.sourceFile,
    line_start: e.line_start ?? e.lineStart ?? 1,
    line_end: e.line_end ?? e.lineEnd ?? 1,
    attributes: e.attributes ?? {},
  });
  
  const files = e11s.map(normalize);
  const functions = e12s.map(normalize);
  const classes = e13s.map(normalize);
  const modules = e15s.map(normalize);
  const testFiles = e27s.map(normalize);
  const suites = e28s.map(normalize);
  const cases = e29s.map(normalize);
  
  // Derive relationships (pure transforms)
  const r04Rels = deriveR04(modules, files);
  const r05Rels = deriveR05(files, [...functions, ...classes]);
  const r06Rels = deriveR06(testFiles, suites);
  const r07Rels = deriveR07(suites, cases);
  
  const allRelationships = [...r04Rels, ...r05Rels, ...r06Rels, ...r07Rels];
  
  if (allRelationships.length === 0) {
    return {
      r04: { extracted: 0, persisted: 0 },
      r05: { extracted: 0, persisted: 0 },
      r06: { extracted: 0, persisted: 0 },
      r07: { extracted: 0, persisted: 0 },
      total: { extracted: 0, persisted: 0, synced: 0 },
    };
  }
  
  // Persist and sync
  const persistResult = await persistRelationshipsAndSync(projectId, allRelationships);
  
  // Count persisted by relationship type
  const countPersisted = (prefix: string) => 
    persistResult.results.filter(r => 
      r.relationship?.instance_id?.startsWith(prefix) && r.operation !== 'NO-OP'
    ).length;
  
  return {
    r04: { extracted: r04Rels.length, persisted: countPersisted('R04:') },
    r05: { extracted: r05Rels.length, persisted: countPersisted('R05:') },
    r06: { extracted: r06Rels.length, persisted: countPersisted('R06:') },
    r07: { extracted: r07Rels.length, persisted: countPersisted('R07:') },
    total: {
      extracted: allRelationships.length,
      persisted: persistResult.results.filter(r => r.operation !== 'NO-OP').length,
      synced: persistResult.neo4jSync?.synced ?? 0,
    },
  };
}

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

// ============================================================================
// Admin Delete Operations (for remediation scripts)
// Re-exported from admin-service for ops layer access
// ============================================================================

export {
  serviceDeleteR04 as deleteR04Relationships,
  serviceDeleteE15 as deleteE15ByInstanceIds,
  serviceDeleteNeo4jE15 as deleteInvalidE15FromNeo4j,
  serviceCloseNeo4j as closeNeo4jDriver,
};
