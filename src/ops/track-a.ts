// src/ops/track-a.ts
// @implements STORY-64.1
// @implements STORY-64.2
// @implements STORY-64.3
// @implements STORY-64.4
// @tdd TDD-A1-ENTITY-REGISTRY
// @tdd TDD-A2-RELATIONSHIP-REGISTRY
// @tdd TDD-A3-MARKER-EXTRACTION
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
  syncRelationshipsToNeo4j as serviceSyncRelationships,
  replaceRelationshipsInNeo4j as serviceReplaceRelationships,
  verifyRelationshipParity as serviceVerifyParity,
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
  deriveR16,
  type EntityInput 
} from '../extraction/providers/containment-derivation-provider.js';
import {
  parseFrontmatter,
  discoverTDDs,
} from '../extraction/providers/tdd-frontmatter-provider.js';
import {
  deriveR63,
  deriveR67,
  type SourceFileInput as GitSourceFileInput,
  type CommitInput,
} from '../extraction/providers/git-relationship-provider.js';
import { ChangeSetProvider } from '../extraction/providers/changeset-provider.js';
import {
  deriveTDDRelationships,
  flattenRelationships,
} from '../extraction/providers/tdd-relationship-provider.js';
import {
  deriveTestRelationships,
} from '../extraction/providers/test-relationship-provider.js';
import * as path from 'path';
import { queryEntities, getAllEntities } from '../api/v1/entities.js';
import { extractAndValidateMarkers } from '../api/v1/markers.js';
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
 * Validate E15 entities have directory-based instance_ids.
 * Track A E15 must be derived from directory structure (MOD-path/to/dir),
 * NOT from import statements (MOD-packagename).
 * 
 * Validation rules:
 * - Must start with MOD-
 * - Must contain at least one / (directory path)
 * - Must not be node_modules path
 * 
 * @throws Error if any E15 violates Track A semantics
 * @exported for regression testing
 */
export function validateE15Semantics(entities: ExtractedEntity[]): void {
  const e15Entities = entities.filter(e => e.entity_type === 'E15');
  const invalid: string[] = [];
  
  for (const e of e15Entities) {
    const id = e.instance_id;
    
    // Must start with MOD-
    if (!id.startsWith('MOD-')) {
      invalid.push(`${id}: missing MOD- prefix`);
      continue;
    }
    
    const path = id.slice(4); // Remove MOD- prefix
    
    // Must contain at least one / (directory path, not npm package)
    if (!path.includes('/')) {
      invalid.push(`${id}: single-segment (npm-style) not allowed in Track A`);
      continue;
    }
    
    // Must not be node_modules path
    if (path.includes('node_modules')) {
      invalid.push(`${id}: node_modules paths not allowed`);
    }
  }
  
  if (invalid.length > 0) {
    throw new Error(
      `[E15 SEMANTIC VIOLATION] Invalid E15 entities detected at persistence boundary:\n` +
      invalid.map(msg => `  - ${msg}`).join('\n') +
      `\n\nE15 must be directory-based (derived by module-derivation-provider), not import-based.`
    );
  }
}

/**
 * Batch upsert entities for A1 extraction.
 * Delegates to entity-service.
 * 
 * GUARDRAIL: Validates E15 semantics before persistence to prevent
 * npm-style modules from polluting the graph.
 */
export async function persistEntities(
  projectId: string,
  entities: ExtractedEntity[]
): Promise<EntityUpsertResult[]> {
  // Fail fast if any E15 violates Track A semantics
  validateE15Semantics(entities);
  
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
 * Extract and persist marker relationships (R18/R19).
 * @implements STORY-64.3
 * @satisfies AC-64.3.1
 * @satisfies AC-64.3.2
 * 
 * Scans src/** and scripts/** for @implements/@satisfies/@tdd markers.
 * Creates R18 (IMPLEMENTS) and R19 (SATISFIES) relationships.
 * Logs TDD_COHERENCE_OK/MISMATCH decisions for @tdd markers.
 * Signals orphan markers to semantic corpus.
 */
export async function extractAndPersistMarkerRelationships(
  projectId: string
): Promise<{
  extracted: number;
  r18_created: number;
  r19_created: number;
  orphans: number;
  tdd_ok: number;
  tdd_mismatch: number;
}> {
  // Create snapshot for the real repository
  const snapshot = {
    id: `marker-extraction-${Date.now()}`,
    root_path: process.cwd(),
    timestamp: new Date(),
  };
  
  const result = await extractAndValidateMarkers(projectId, snapshot);
  
  return {
    extracted: result.stats.total_extracted,
    r18_created: result.stats.r18_created,
    r19_created: result.stats.r19_created,
    orphans: result.stats.orphan_count,
    tdd_ok: result.stats.tdd_ok_count,
    tdd_mismatch: result.stats.tdd_mismatch_count,
  };
}

/**
 * Extract and persist R36/R37 test structure relationships.
 * @implements STORY-64.3
 * @satisfies AC-64.3.4
 * @satisfies AC-64.3.5
 * 
 * Derives relationships from test structure (describe/it blocks):
 * - R36: Story → TestSuite from describe('STORY-XX.YY: ...')
 * - R37: AC → TestCase from it('AC-XX.YY.ZZ: ...')
 */
export async function extractAndPersistTestRelationships(
  projectId: string
): Promise<{
  r36_created: number;
  r37_created: number;
  r36_updated: number;
  r37_updated: number;
}> {
  // Get all entities needed for derivation
  const dbEntities = await getAllEntities(projectId);
  
  // Convert to ExtractedEntity format (provider expects source_file as non-null string)
  const extractedEntities: ExtractedEntity[] = dbEntities.map(e => ({
    entity_type: e.entity_type,
    instance_id: e.instance_id,
    name: e.name,
    attributes: e.attributes || {},
    source_file: e.source_file || '',
    line_start: e.line_start || 0,
    line_end: e.line_end || 0,
  }));
  
  // Derive R36/R37 relationships
  const testRels = deriveTestRelationships(extractedEntities);
  
  if (testRels.length === 0) {
    return { r36_created: 0, r37_created: 0, r36_updated: 0, r37_updated: 0 };
  }
  
  // Persist relationships
  const results = await relBatchUpsertAndSync(projectId, testRels);
  
  // Count by type
  let r36_created = 0, r37_created = 0, r36_updated = 0, r37_updated = 0;
  for (const r of results.results) {
    if (r.relationship && r.relationship.relationship_type === 'R36') {
      if (r.operation === 'CREATE') r36_created++;
      else if (r.operation === 'UPDATE') r36_updated++;
    } else if (r.relationship && r.relationship.relationship_type === 'R37') {
      if (r.operation === 'CREATE') r37_created++;
      else if (r.operation === 'UPDATE') r37_updated++;
    }
  }
  
  return { r36_created, r37_created, r36_updated, r37_updated };
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
 * Extract and persist containment relationships (R04-R07) and R16.
 * 
 * Derives from existing entities:
 * - R04: Module CONTAINS_FILE SourceFile
 * - R05: SourceFile CONTAINS_ENTITY Function/Class
 * - R06: TestFile CONTAINS_SUITE TestSuite
 * - R07: TestSuite CONTAINS_CASE TestCase
 * - R16: Function/Class DEFINED_IN SourceFile (per Track A canon ENTRY.md)
 * 
 * Evidence comes from the TO entity (R04-R07) or FROM entity (R16).
 * 
 * @satisfies AC-64.2.4, AC-64.2.5, AC-64.2.6, AC-64.2.7, AC-64.2.8
 */
export async function extractAndPersistContainmentRelationships(projectId: string): Promise<{
  r04: { extracted: number; persisted: number };
  r05: { extracted: number; persisted: number };
  r06: { extracted: number; persisted: number };
  r07: { extracted: number; persisted: number };
  r16: { extracted: number; persisted: number };
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
  // R16: Function/Class → SourceFile (per Track A canon, not DataSchema → SourceFile)
  const r16Rels = deriveR16([...functions, ...classes], files);
  
  const allRelationships = [...r04Rels, ...r05Rels, ...r06Rels, ...r07Rels, ...r16Rels];
  
  if (allRelationships.length === 0) {
    return {
      r04: { extracted: 0, persisted: 0 },
      r05: { extracted: 0, persisted: 0 },
      r06: { extracted: 0, persisted: 0 },
      r07: { extracted: 0, persisted: 0 },
      r16: { extracted: 0, persisted: 0 },
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
    r16: { extracted: r16Rels.length, persisted: countPersisted('R16:') },
    total: {
      extracted: allRelationships.length,
      persisted: persistResult.results.filter(r => r.operation !== 'NO-OP').length,
      synced: persistResult.neo4jSync?.synced ?? 0,
    },
  };
}

// ============================================================================
// TDD Relationship Extraction
// ============================================================================

const MAX_NAME_LENGTH = 100;

/**
 * Apply TDD relationship invariants:
 * 1. source_file must be repo-relative (never absolute)
 * 2. name must be length-safe with full_name preserved in attributes
 */
function applyTddRelationshipInvariants(
  relationships: ExtractedRelationship[],
  repoRoot: string
): ExtractedRelationship[] {
  return relationships.map(rel => {
    // Invariant 1: Repo-relative source_file
    let sourceFile = rel.source_file;
    if (path.isAbsolute(sourceFile)) {
      sourceFile = path.relative(repoRoot, sourceFile);
    }
    
    // Invariant 2: Length-safe name with full_name preservation
    const fullName = rel.name;
    let name = fullName;
    let attributes = { ...rel.attributes };
    
    if (fullName.length > MAX_NAME_LENGTH) {
      // Deterministic truncation: keep prefix, add ellipsis
      name = fullName.substring(0, MAX_NAME_LENGTH - 3) + '...';
      // Preserve full name in attributes for audit/debugging
      attributes = { ...attributes, full_name: fullName };
    }
    
    return {
      ...rel,
      source_file: sourceFile,
      name,
      attributes,
    };
  });
}

/**
 * Extract E06 TechnicalDesign entities from TDD frontmatter.
 * 
 * @param projectId - Project to extract for
 * @param specDir - Path to spec directory (defaults to ./spec)
 * @returns Persistence results
 */
export async function extractAndPersistTddEntities(
  projectId: string,
  specDir?: string
): Promise<{ extracted: number; persisted: number }> {
  const resolvedSpecDir = specDir || path.resolve(process.cwd(), 'spec');
  
  const tddEntities = await discoverTDDs(resolvedSpecDir);
  
  if (tddEntities.length === 0) {
    return { extracted: 0, persisted: 0 };
  }
  
  const results = await persistEntities(projectId, tddEntities);
  const persisted = results.filter(r => r.operation !== 'NO-OP').length;
  
  return {
    extracted: tddEntities.length,
    persisted,
  };
}

/**
 * Extract and persist TDD Bridge relationships (R08, R09, R11, R14).
 * 
 * Invariants enforced:
 * - source_file is always repo-relative
 * - name is length-safe (<=100 chars), with full_name in attributes if truncated
 * 
 * @param projectId - Project to extract for
 * @param specDir - Path to spec directory (defaults to ./spec)
 * @returns Extraction and persistence results with breakdown by type
 */
export async function extractAndPersistTddRelationships(
  projectId: string,
  specDir?: string
): Promise<{
  extracted: { r08: number; r09: number; r11: number; r14: number; total: number };
  persisted: number;
  synced: number;
}> {
  const resolvedSpecDir = specDir || path.resolve(process.cwd(), 'spec');
  const repoRoot = process.cwd();
  const storiesDir = path.join(resolvedSpecDir, 'track_a', 'stories');
  
  // Read story files
  const fs = await import('fs/promises');
  let files: string[];
  try {
    files = await fs.readdir(storiesDir);
  } catch {
    return {
      extracted: { r08: 0, r09: 0, r11: 0, r14: 0, total: 0 },
      persisted: 0,
      synced: 0,
    };
  }
  
  const mdFiles = files.filter(f => f.endsWith('.md'));
  let allRelationships: ExtractedRelationship[] = [];
  let counts = { r08: 0, r09: 0, r11: 0, r14: 0 };
  
  for (const file of mdFiles) {
    const filePath = path.join(storiesDir, file);
    const frontmatter = await parseFrontmatter(filePath);
    
    if (frontmatter && frontmatter.id) {
      const derived = await deriveTDDRelationships(frontmatter);
      counts.r08 += derived.r08.length;
      counts.r09 += derived.r09.length;
      counts.r11 += derived.r11.length;
      counts.r14 += derived.r14.length;
      
      const flat = flattenRelationships(derived);
      allRelationships.push(...flat);
    }
  }
  
  if (allRelationships.length === 0) {
    return {
      extracted: { ...counts, total: 0 },
      persisted: 0,
      synced: 0,
    };
  }
  
  // Apply invariants before persistence
  const safeRelationships = applyTddRelationshipInvariants(allRelationships, repoRoot);
  
  // Persist and sync
  const result = await persistRelationshipsAndSync(projectId, safeRelationships);
  const persisted = result.results.filter(r => r.operation !== 'NO-OP').length;
  
  return {
    extracted: { ...counts, total: allRelationships.length },
    persisted,
    synced: result.neo4jSync?.synced ?? 0,
  };
}

// ============================================================================
// Git Relationship Extraction (R63, R67, R70)
// ============================================================================

/**
 * Extract and persist git-based relationships (R63, R67, R70).
 * 
 * Per Track A canon (ENTRY.md):
 * - R63: SourceFile INTRODUCED_IN Commit (Track A deviation from global canon)
 * - R67: SourceFile MODIFIED_IN Commit
 * - R70: ChangeSet GROUPS Commit
 * 
 */
export async function extractAndPersistGitRelationships(projectId: string): Promise<{
  r63: { extracted: number; persisted: number };
  r67: { extracted: number; persisted: number };
  r70: { extracted: number; persisted: number };
  total: { extracted: number; persisted: number; synced: number };
}> {
  const rootPath = process.cwd();
  
  // Query required entity types via api/v1 (G-API compliant)
  const [e11s, e50s] = await Promise.all([
    queryEntities(projectId, 'E11'),
    queryEntities(projectId, 'E50'),
  ]);
  
  // Normalize to input types
  const sourceFiles: GitSourceFileInput[] = e11s.map((e: any) => ({
    instance_id: e.instance_id ?? e.instanceId,
    source_file: e.source_file ?? e.sourceFile,
  }));
  
  const commits: CommitInput[] = e50s.map((e: any) => ({
    instance_id: e.instance_id ?? e.instanceId,
    sha: e.attributes?.sha ?? '',
  }));
  
  // Derive R63: SourceFile INTRODUCED_IN Commit (Track A canon)
  const r63Rels = deriveR63(sourceFiles, commits, rootPath);
  
  // Derive R67: SourceFile MODIFIED_IN Commit
  const r67Rels = deriveR67(sourceFiles, commits, rootPath);
  
  // Derive R70: ChangeSet GROUPS Commit (via changeset provider)
  const changesetProvider = new ChangeSetProvider();
  const changesetResult = await changesetProvider.extract({
    id: 'git-rel-extraction',
    root_path: rootPath,
    timestamp: new Date(),
  });
  const r70Rels = changesetResult.relationships;
  
  const allRelationships = [...r63Rels, ...r67Rels, ...r70Rels];
  
  if (allRelationships.length === 0) {
    return {
      r63: { extracted: 0, persisted: 0 },
      r67: { extracted: 0, persisted: 0 },
      r70: { extracted: 0, persisted: 0 },
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
    r63: { extracted: r63Rels.length, persisted: countPersisted('R63:') },
    r67: { extracted: r67Rels.length, persisted: countPersisted('R67:') },
    r70: { extracted: r70Rels.length, persisted: countPersisted('R70:') },
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

// ============================================================================
// Neo4j Sync Operations (for scripts)
// Re-exported from sync-service for ops layer access
// ============================================================================

/**
 * Replace all relationships in Neo4j for a project.
 * Uses replace-by-project strategy: deletes all existing relationships then recreates.
 * 
 * @param projectId - Project UUID to sync
 * @returns Sync results with counts for deleted, synced, and skipped relationships
 */
export async function replaceAllRelationshipsInNeo4j(projectId: string): Promise<{
  deleted: number;
  synced: number;
  skipped: number;
}> {
  return serviceReplaceRelationships(projectId);
}

/**
 * Verify PostgreSQL and Neo4j relationship parity.
 * Returns detailed parity information for verification scripts.
 * 
 * @param projectId - Project UUID to verify
 * @returns Full parity check results from sync-service
 */
export async function verifyNeo4jParity(projectId: string) {
  return serviceVerifyParity(projectId);
}


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
