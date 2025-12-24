// src/services/relationships/relationship-service.ts
// @implements STORY-64.2
// @tdd TDD-A2-RELATIONSHIP-REGISTRY
// Relationship upsert service with content_hash change detection
// Implements ENTRY.md Upsert Rule: ON CONFLICT (project_id, instance_id) DO UPDATE
// NO-OP if content_hash unchanged
//
// IMPORTANT (Pre-A2 Hardening):
// - content_hash INCLUDES evidence fields (source_file, line_start, line_end)
// - This ensures evidence corrections trigger updates (not NO-OP)
// - If evidence is ever removed from hash, the WHERE clause must be updated
//   or rows will go "green but stale"
// - Entity hash EXCLUDES evidence (semantic difference documented)

import { createHash } from 'crypto';
import { pool, setProjectContext, getClient } from '../../db/postgres.js';
import { shadowLedger } from '../../ledger/shadow-ledger.js';
import { createEvidenceAnchor } from '../../extraction/evidence.js';
import { syncRelationshipsToNeo4j, syncEntitiesToNeo4j } from '../sync/sync-service.js';
import type { Relationship, RelationshipTypeCode } from '../../schema/track-a/relationships.js';
import type { ExtractedRelationship, EvidenceAnchor } from '../../extraction/types.js';
import type { PoolClient } from 'pg';

/**
 * Relationship instance_id pattern: R{XX}:{from_instance_id}:{to_instance_id}
 * Example: R01:EPIC-64:STORY-64.1
 */
const RELATIONSHIP_INSTANCE_ID_PATTERN = /^R\d{2}:.+:.+$/;

/**
 * Validate relationship instance_id format.
 * Throws if invalid - fail fast before any DB operation.
 */
export function validateRelationshipInstanceId(instanceId: string): void {
  if (!RELATIONSHIP_INSTANCE_ID_PATTERN.test(instanceId)) {
    throw new Error(
      `Invalid relationship instance_id format: "${instanceId}". ` +
      `Must match pattern R{XX}:{from}:{to} (e.g., R01:EPIC-64:STORY-64.1)`
    );
  }
}

/**
 * Compute SHA-256 content hash for an extracted relationship.
 * 
 * IMPORTANT: Hash INCLUDES evidence fields (source_file, line_start, line_end)
 * This ensures evidence corrections trigger updates rather than NO-OP.
 * 
 * Note: Entity hash EXCLUDES evidence (different semantic - entities update
 * on content change only, not evidence change). This difference is intentional
 * and documented per Pre-A2 Hardening plan.
 */
export function computeContentHash(extracted: ExtractedRelationship): string {
  const content = JSON.stringify({
    relationship_type: extracted.relationship_type,
    instance_id: extracted.instance_id,
    name: extracted.name,
    from_instance_id: extracted.from_instance_id,
    to_instance_id: extracted.to_instance_id,
    confidence: extracted.confidence ?? 1.0,
    // IMPORTANT: Include evidence fields so corrections trigger updates
    source_file: extracted.source_file,
    line_start: extracted.line_start,
    line_end: extracted.line_end,
  });
  const hash = createHash('sha256').update(content).digest('hex');
  return `sha256:${hash}`;
}

/**
 * Upsert result indicating whether relationship was created, updated, or unchanged.
 */
export interface UpsertResult {
  relationship: Relationship | null;
  operation: 'CREATE' | 'UPDATE' | 'NO-OP';
}

/**
 * Resolve an entity instance_id to its UUID.
 * Returns null if not found.
 */
async function resolveEntityId(
  client: PoolClient,
  projectId: string,
  instanceId: string
): Promise<string | null> {
  const result = await client.query<{ id: string }>(
    'SELECT id FROM entities WHERE project_id = $1 AND instance_id = $2',
    [projectId, instanceId]
  );
  return result.rows[0]?.id ?? null;
}

/**
 * Upsert a relationship with content_hash change detection.
 * 
 * Per ENTRY.md Upsert Rule (Locked):
 * - ON CONFLICT (project_id, instance_id) DO UPDATE
 * - NO-OP if content_hash unchanged (WHERE content_hash IS DISTINCT FROM EXCLUDED.content_hash)
 * - Shadow ledger emits only on CREATE/UPDATE
 * 
 * @param projectId - Project UUID for RLS isolation
 * @param extracted - Extracted relationship data (must include evidence fields)
 */
export async function upsert(
  projectId: string,
  extracted: ExtractedRelationship
): Promise<UpsertResult> {
  // Validate instance_id format BEFORE any DB operation
  validateRelationshipInstanceId(extracted.instance_id);

  const contentHash = computeContentHash(extracted);
  const evidenceAnchor = createEvidenceAnchor(
    extracted.source_file,
    extracted.line_start,
    extracted.line_end
  );

  const client = await getClient();
  try {
    await setProjectContext(client, projectId);

    // Resolve entity UUIDs from instance_ids
    const fromEntityId = await resolveEntityId(client, projectId, extracted.from_instance_id);
    const toEntityId = await resolveEntityId(client, projectId, extracted.to_instance_id);

    if (!fromEntityId) {
      throw new Error(
        `Cannot resolve from_entity_id for relationship ${extracted.instance_id}: ` +
        `entity "${extracted.from_instance_id}" not found in project ${projectId}`
      );
    }
    if (!toEntityId) {
      throw new Error(
        `Cannot resolve to_entity_id for relationship ${extracted.instance_id}: ` +
        `entity "${extracted.to_instance_id}" not found in project ${projectId}`
      );
    }

    // Upsert with content_hash change detection
    // xmax = 0 means INSERT (new row), xmax > 0 means UPDATE (existing row modified)
    // No row returned means NO-OP (content_hash unchanged)
    const result = await client.query<{
      id: string;
      relationship_type: string;
      instance_id: string;
      name: string;
      from_entity_id: string;
      to_entity_id: string;
      confidence: number;
      source_file: string;
      line_start: number;
      line_end: number;
      content_hash: string | null;
      extracted_at: Date;
      project_id: string;
      inserted: boolean;
    }>(`
      INSERT INTO relationships (
        id, relationship_type, instance_id, name,
        from_entity_id, to_entity_id, confidence,
        source_file, line_start, line_end, content_hash,
        project_id, extracted_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW()
      )
      ON CONFLICT (project_id, instance_id) DO UPDATE SET
        name = EXCLUDED.name,
        from_entity_id = EXCLUDED.from_entity_id,
        to_entity_id = EXCLUDED.to_entity_id,
        confidence = EXCLUDED.confidence,
        source_file = EXCLUDED.source_file,
        line_start = EXCLUDED.line_start,
        line_end = EXCLUDED.line_end,
        content_hash = EXCLUDED.content_hash,
        extracted_at = NOW()
      WHERE relationships.content_hash IS DISTINCT FROM EXCLUDED.content_hash
      RETURNING 
        id, relationship_type, instance_id, name,
        from_entity_id, to_entity_id, confidence,
        source_file, line_start, line_end, content_hash,
        extracted_at, project_id,
        (xmax = 0) AS inserted
    `, [
      extracted.relationship_type,
      extracted.instance_id,
      extracted.name,
      fromEntityId,
      toEntityId,
      extracted.confidence ?? 1.0,
      extracted.source_file,
      extracted.line_start,
      extracted.line_end,
      contentHash,
      projectId,
    ]);

    // No row returned = NO-OP (content_hash unchanged)
    if (result.rows.length === 0) {
      return { relationship: null, operation: 'NO-OP' };
    }

    const row = result.rows[0];
    const relationship: Relationship = {
      id: row.id,
      relationship_type: row.relationship_type as RelationshipTypeCode,
      instance_id: row.instance_id,
      name: row.name,
      from_entity_id: row.from_entity_id,
      to_entity_id: row.to_entity_id,
      confidence: row.confidence,
      source_file: row.source_file,
      line_start: row.line_start,
      line_end: row.line_end,
      content_hash: row.content_hash,
      extracted_at: row.extracted_at,
      project_id: row.project_id,
    };

    const operation = row.inserted ? 'CREATE' : 'UPDATE';

    // Log to shadow ledger only on CREATE/UPDATE (never on NO-OP)
    if (operation === 'CREATE') {
      await shadowLedger.logRelationshipCreate(
        relationship.relationship_type,
        relationship.id,
        relationship.instance_id,
        contentHash,
        evidenceAnchor,
        projectId
      );
    } else {
      await shadowLedger.logRelationshipUpdate(
        relationship.relationship_type,
        relationship.id,
        relationship.instance_id,
        contentHash,
        evidenceAnchor,
        projectId
      );
    }

    return { relationship, operation };
  } finally {
    client.release();
  }
}

/**
 * Get relationship by UUID.
 * Project-scoped via RLS.
 */
export async function getById(
  projectId: string,
  id: string
): Promise<Relationship | null> {
  const client = await getClient();
  try {
    await setProjectContext(client, projectId);

    const result = await client.query<Relationship>(`
      SELECT id, relationship_type, instance_id, name,
             from_entity_id, to_entity_id, confidence,
             source_file, line_start, line_end, content_hash,
             extracted_at, project_id
      FROM relationships
      WHERE id = $1
    `, [id]);

    return result.rows[0] ?? null;
  } finally {
    client.release();
  }
}

/**
 * Get relationship by instance_id.
 * Project-scoped via RLS.
 */
export async function getByInstanceId(
  projectId: string,
  instanceId: string
): Promise<Relationship | null> {
  const client = await getClient();
  try {
    await setProjectContext(client, projectId);

    const result = await client.query<Relationship>(`
      SELECT id, relationship_type, instance_id, name,
             from_entity_id, to_entity_id, confidence,
             source_file, line_start, line_end, content_hash,
             extracted_at, project_id
      FROM relationships
      WHERE instance_id = $1
    `, [instanceId]);

    return result.rows[0] ?? null;
  } finally {
    client.release();
  }
}

/**
 * Query relationships by type.
 * Project-scoped via RLS.
 */
export async function queryByType(
  projectId: string,
  relationshipType: RelationshipTypeCode
): Promise<Relationship[]> {
  const client = await getClient();
  try {
    await setProjectContext(client, projectId);

    const result = await client.query<Relationship>(`
      SELECT id, relationship_type, instance_id, name,
             from_entity_id, to_entity_id, confidence,
             source_file, line_start, line_end, content_hash,
             extracted_at, project_id
      FROM relationships
      WHERE relationship_type = $1
      ORDER BY instance_id
    `, [relationshipType]);

    return result.rows;
  } finally {
    client.release();
  }
}

/**
 * Get all relationships for a project.
 * Project-scoped via RLS.
 */
export async function getAll(projectId: string): Promise<Relationship[]> {
  const client = await getClient();
  try {
    await setProjectContext(client, projectId);

    const result = await client.query<Relationship>(`
      SELECT id, relationship_type, instance_id, name,
             from_entity_id, to_entity_id, confidence,
             source_file, line_start, line_end, content_hash,
             extracted_at, project_id
      FROM relationships
      ORDER BY relationship_type, instance_id
    `);

    return result.rows;
  } finally {
    client.release();
  }
}

/**
 * Count relationships by type.
 * Project-scoped via RLS.
 */
export async function countByType(
  projectId: string
): Promise<Record<RelationshipTypeCode, number>> {
  const client = await getClient();
  try {
    await setProjectContext(client, projectId);

    const result = await client.query<{ relationship_type: RelationshipTypeCode; count: string }>(`
      SELECT relationship_type, COUNT(*) as count
      FROM relationships
      GROUP BY relationship_type
      ORDER BY relationship_type
    `);

    const counts: Partial<Record<RelationshipTypeCode, number>> = {};
    for (const row of result.rows) {
      counts[row.relationship_type] = parseInt(row.count, 10);
    }

    return counts as Record<RelationshipTypeCode, number>;
  } finally {
    client.release();
  }
}

/**
 * Batch upsert multiple relationships using bulk SQL operations.
 * Uses UNNEST for true batch INSERT...ON CONFLICT (single round-trip).
 * 
 * Performance: O(1) database round-trips instead of O(n).
 * - Single query to resolve all entity instance_ids to UUIDs
 * - Single UNNEST INSERT...ON CONFLICT for all relationships
 * 
 * Shadow ledger logging is batched at the end.
 * 
 * @param projectId - Project scope
 * @param relationships - Relationships to upsert
 * @returns Results for each relationship
 */
export async function batchUpsert(
  projectId: string,
  relationships: ExtractedRelationship[]
): Promise<UpsertResult[]> {
  if (relationships.length === 0) {
    return [];
  }

  // Validate all instance_ids upfront
  for (const rel of relationships) {
    validateRelationshipInstanceId(rel.instance_id);
  }

  const client = await getClient();
  try {
    await setProjectContext(client, projectId);

    // Step 1: Collect all unique instance_ids needed for resolution
    const fromIds = new Set(relationships.map(r => r.from_instance_id));
    const toIds = new Set(relationships.map(r => r.to_instance_id));
    const allInstanceIds = [...new Set([...fromIds, ...toIds])];

    // Step 2: Batch resolve all entity instance_ids to UUIDs in single query
    const entityResult = await client.query<{ instance_id: string; id: string }>(`
      SELECT instance_id, id FROM entities WHERE instance_id = ANY($1)
    `, [allInstanceIds]);

    const entityMap = new Map(entityResult.rows.map(r => [r.instance_id, r.id]));

    // Step 3: Build arrays for UNNEST
    const relationshipTypes: string[] = [];
    const instanceIds: string[] = [];
    const names: string[] = [];
    const fromEntityIds: string[] = [];
    const toEntityIds: string[] = [];
    const confidences: number[] = [];
    const sourceFiles: string[] = [];
    const lineStarts: number[] = [];
    const lineEnds: number[] = [];
    const contentHashes: string[] = [];

    for (const rel of relationships) {
      const fromEntityId = entityMap.get(rel.from_instance_id);
      const toEntityId = entityMap.get(rel.to_instance_id);

      if (!fromEntityId) {
        throw new Error(
          `Cannot resolve from_entity_id for relationship ${rel.instance_id}: ` +
          `entity "${rel.from_instance_id}" not found in project ${projectId}`
        );
      }
      if (!toEntityId) {
        throw new Error(
          `Cannot resolve to_entity_id for relationship ${rel.instance_id}: ` +
          `entity "${rel.to_instance_id}" not found in project ${projectId}`
        );
      }

      relationshipTypes.push(rel.relationship_type);
      instanceIds.push(rel.instance_id);
      names.push(rel.name);
      fromEntityIds.push(fromEntityId);
      toEntityIds.push(toEntityId);
      confidences.push(rel.confidence ?? 1.0);
      sourceFiles.push(rel.source_file);
      lineStarts.push(rel.line_start);
      lineEnds.push(rel.line_end);
      contentHashes.push(computeContentHash(rel));
    }

    // Step 4: Bulk upsert with UNNEST (single query for all relationships)
    const upsertResult = await client.query<{
      id: string;
      relationship_type: string;
      instance_id: string;
      name: string;
      from_entity_id: string;
      to_entity_id: string;
      confidence: number;
      source_file: string;
      line_start: number;
      line_end: number;
      content_hash: string;
      extracted_at: Date;
      project_id: string;
      inserted: boolean;
    }>(`
      INSERT INTO relationships (
        id, relationship_type, instance_id, name,
        from_entity_id, to_entity_id, confidence,
        source_file, line_start, line_end, content_hash,
        project_id, extracted_at
      )
      SELECT 
        gen_random_uuid(),
        r.relationship_type,
        r.instance_id,
        r.name,
        r.from_entity_id::uuid,
        r.to_entity_id::uuid,
        r.confidence,
        r.source_file,
        r.line_start,
        r.line_end,
        r.content_hash,
        $11::uuid,
        NOW()
      FROM UNNEST(
        $1::text[], $2::text[], $3::text[], $4::text[], $5::text[],
        $6::float[], $7::text[], $8::int[], $9::int[], $10::text[]
      ) AS r(
        relationship_type, instance_id, name, from_entity_id, to_entity_id,
        confidence, source_file, line_start, line_end, content_hash
      )
      ON CONFLICT (project_id, instance_id) DO UPDATE SET
        name = EXCLUDED.name,
        from_entity_id = EXCLUDED.from_entity_id,
        to_entity_id = EXCLUDED.to_entity_id,
        confidence = EXCLUDED.confidence,
        source_file = EXCLUDED.source_file,
        line_start = EXCLUDED.line_start,
        line_end = EXCLUDED.line_end,
        content_hash = EXCLUDED.content_hash,
        extracted_at = NOW()
      WHERE relationships.content_hash IS DISTINCT FROM EXCLUDED.content_hash
      RETURNING 
        id, relationship_type, instance_id, name,
        from_entity_id, to_entity_id, confidence,
        source_file, line_start, line_end, content_hash,
        extracted_at, project_id,
        (xmax = 0) AS inserted
    `, [
      relationshipTypes, instanceIds, names, fromEntityIds, toEntityIds,
      confidences, sourceFiles, lineStarts, lineEnds, contentHashes,
      projectId,
    ]);

    // Step 5: Build results map from returned rows
    const returnedMap = new Map(upsertResult.rows.map(r => [r.instance_id, r]));

    // Step 6: Build results and batch log to shadow ledger
    const results: UpsertResult[] = [];
    const createLogs: Array<{ type: string; id: string; instanceId: string; hash: string; evidence: ReturnType<typeof createEvidenceAnchor> }> = [];
    const updateLogs: Array<{ type: string; id: string; instanceId: string; hash: string; evidence: ReturnType<typeof createEvidenceAnchor> }> = [];

    for (let i = 0; i < relationships.length; i++) {
      const rel = relationships[i];
      const row = returnedMap.get(rel.instance_id);

      if (!row) {
        // NO-OP (content_hash unchanged)
        results.push({ relationship: null, operation: 'NO-OP' });
      } else {
        const relationship: Relationship = {
          id: row.id,
          relationship_type: row.relationship_type as RelationshipTypeCode,
          instance_id: row.instance_id,
          name: row.name,
          from_entity_id: row.from_entity_id,
          to_entity_id: row.to_entity_id,
          confidence: row.confidence,
          source_file: row.source_file,
          line_start: row.line_start,
          line_end: row.line_end,
          content_hash: row.content_hash,
          extracted_at: row.extracted_at,
          project_id: row.project_id,
        };
        const operation = row.inserted ? 'CREATE' : 'UPDATE';
        results.push({ relationship, operation });

        const evidence = createEvidenceAnchor(rel.source_file, rel.line_start, rel.line_end);
        if (operation === 'CREATE') {
          createLogs.push({ type: row.relationship_type, id: row.id, instanceId: row.instance_id, hash: contentHashes[i], evidence });
        } else {
          updateLogs.push({ type: row.relationship_type, id: row.id, instanceId: row.instance_id, hash: contentHashes[i], evidence });
        }
      }
    }

    // Step 7: Batch log to shadow ledger (fire-and-forget for performance)
    for (const log of createLogs) {
      await shadowLedger.logRelationshipCreate(log.type, log.id, log.instanceId, log.hash, log.evidence, projectId);
    }
    for (const log of updateLogs) {
      await shadowLedger.logRelationshipUpdate(log.type, log.id, log.instanceId, log.hash, log.evidence, projectId);
    }

    return results;
  } finally {
    client.release();
  }
}

/**
 * Batch upsert result with Neo4j sync stats.
 */
export interface BatchUpsertAndSyncResult {
  results: UpsertResult[];
  neo4jSync: {
    synced: number;           // relationships synced
    skipped: number;          // relationships skipped
    entitiesSynced?: number;  // entities synced first (optional for backward compat)
  };
}

/**
 * Batch upsert relationships AND sync to Neo4j.
 * Use this when you need sync stats; use batchUpsert() for PostgreSQL-only.
 * 
 * PHASE 0 NOTE: PostgreSQL upserts are still per-row (calls upsert() in loop).
 * This is acceptable for Phase 0 infrastructure validation.
 * PHASE 2 TODO: Implement true bulk INSERT ... ON CONFLICT for PostgreSQL
 * to match the UNWIND batching already used in Neo4j sync.
 * 
 * @param projectId - Project scope
 * @param relationships - Relationships to upsert
 * @returns Results array + Neo4j sync stats
 */
export async function batchUpsertAndSync(
  projectId: string,
  relationships: ExtractedRelationship[]
): Promise<BatchUpsertAndSyncResult> {
  // Phase 0: per-row upsert (functional but not optimal)
  const results = await batchUpsert(projectId, relationships);

  // PREREQUISITE: Entities must exist in Neo4j before relationship sync
  // This is idempotent (MERGE) and safe to call every time
  const entitiesSync = await syncEntitiesToNeo4j(projectId);

  // Now sync relationships (entities guaranteed to exist)
  const relationshipsSync = await syncRelationshipsToNeo4j(projectId);

  // Null-safe return value extraction (handles any return shape)
  const entitiesSynced = (entitiesSync as any)?.synced ?? (entitiesSync as any)?.entitiesSynced ?? 0;
  const synced = relationshipsSync?.synced ?? 0;
  const skipped = relationshipsSync?.skipped ?? 0;

  return {
    results,
    neo4jSync: {
      synced,
      skipped,
      entitiesSynced,
    },
  };
}
