// src/services/entities/entity-service.ts
// @implements STORY-64.1
// Entity upsert service with content_hash change detection
// Implements ENTRY.md Upsert Rule: ON CONFLICT (project_id, instance_id) DO UPDATE
// NO-OP if content_hash unchanged

import { createHash } from 'crypto';
import { pool, setProjectContext, getClient } from '../../db/postgres.js';
import { shadowLedger } from '../../ledger/shadow-ledger.js';
import { createEvidenceAnchor } from '../../extraction/evidence.js';
import type { Entity, EntityTypeCode } from '../../schema/track-a/entities.js';
import type { ExtractedEntity, EvidenceAnchor } from '../../extraction/types.js';
import type { PoolClient } from 'pg';

/**
 * Compute SHA-256 content hash for an extracted entity.
 * Hash is computed over: entity_type, instance_id, name, attributes
 */
export function computeContentHash(extracted: ExtractedEntity): string {
  const content = JSON.stringify({
    entity_type: extracted.entity_type,
    instance_id: extracted.instance_id,
    name: extracted.name,
    attributes: extracted.attributes,
  });
  const hash = createHash('sha256').update(content).digest('hex');
  return `sha256:${hash}`;
}

/**
 * Upsert result indicating whether entity was created, updated, or unchanged.
 */
export interface UpsertResult {
  entity: Entity | null;
  operation: 'CREATE' | 'UPDATE' | 'NO-OP';
}

/**
 * Upsert an entity with content_hash change detection.
 * 
 * Per ENTRY.md Upsert Rule (Locked):
 * - ON CONFLICT (project_id, instance_id) DO UPDATE
 * - NO-OP if content_hash unchanged (WHERE content_hash IS DISTINCT FROM EXCLUDED.content_hash)
 * - Shadow ledger emits only on CREATE/UPDATE
 * 
 * @param projectId - Project UUID for RLS isolation
 * @param extracted - Extracted entity data
 * @param evidence - Optional evidence anchor (created if not provided)
 */
export async function upsert(
  projectId: string,
  extracted: ExtractedEntity,
  evidence?: EvidenceAnchor
): Promise<UpsertResult> {
  const contentHash = computeContentHash(extracted);
  const evidenceAnchor = evidence ?? createEvidenceAnchor(
    extracted.source_file,
    extracted.line_start,
    extracted.line_end
  );

  const client = await getClient();
  try {
    await setProjectContext(client, projectId);

    // Upsert with content_hash change detection
    // xmax = 0 means INSERT (new row), xmax > 0 means UPDATE (existing row modified)
    // No row returned means NO-OP (content_hash unchanged)
    const result = await client.query<{
      id: string;
      entity_type: string;
      instance_id: string;
      name: string;
      attributes: Record<string, unknown>;
      source_file: string | null;
      line_start: number | null;
      line_end: number | null;
      content_hash: string | null;
      extracted_at: Date;
      project_id: string;
      inserted: boolean;
    }>(`
      INSERT INTO entities (
        id, entity_type, instance_id, name, attributes, content_hash,
        source_file, line_start, line_end, project_id, extracted_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()
      )
      ON CONFLICT (project_id, instance_id) DO UPDATE SET
        name = EXCLUDED.name,
        attributes = EXCLUDED.attributes,
        content_hash = EXCLUDED.content_hash,
        source_file = EXCLUDED.source_file,
        line_start = EXCLUDED.line_start,
        line_end = EXCLUDED.line_end,
        extracted_at = NOW()
      WHERE entities.content_hash IS DISTINCT FROM EXCLUDED.content_hash
      RETURNING 
        id, entity_type, instance_id, name, attributes,
        source_file, line_start, line_end, content_hash,
        extracted_at, project_id,
        (xmax = 0) AS inserted
    `, [
      extracted.entity_type,
      extracted.instance_id,
      extracted.name,
      JSON.stringify(extracted.attributes),
      contentHash,
      extracted.source_file,
      extracted.line_start,
      extracted.line_end,
      projectId,
    ]);

    // No row returned = NO-OP (content_hash unchanged)
    if (result.rows.length === 0) {
      return { entity: null, operation: 'NO-OP' };
    }

    const row = result.rows[0];
    const entity: Entity = {
      id: row.id,
      entity_type: row.entity_type as EntityTypeCode,
      instance_id: row.instance_id,
      name: row.name,
      attributes: row.attributes,
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
      await shadowLedger.logCreate(
        entity.entity_type,
        entity.id,
        entity.instance_id,
        contentHash,
        evidenceAnchor,
        projectId
      );
    } else {
      await shadowLedger.logUpdate(
        entity.entity_type,
        entity.id,
        entity.instance_id,
        contentHash,
        evidenceAnchor,
        projectId
      );
    }

    return { entity, operation };
  } finally {
    client.release();
  }
}

/**
 * Get entity by UUID.
 * Project-scoped via RLS.
 */
export async function getById(
  projectId: string,
  id: string
): Promise<Entity | null> {
  const client = await getClient();
  try {
    await setProjectContext(client, projectId);

    const result = await client.query<Entity>(`
      SELECT id, entity_type, instance_id, name, attributes,
             source_file, line_start, line_end, content_hash,
             extracted_at, project_id
      FROM entities
      WHERE id = $1
    `, [id]);

    return result.rows[0] ?? null;
  } finally {
    client.release();
  }
}

/**
 * Get entity by instance_id.
 * Project-scoped via RLS.
 */
export async function getByInstanceId(
  projectId: string,
  instanceId: string
): Promise<Entity | null> {
  const client = await getClient();
  try {
    await setProjectContext(client, projectId);

    const result = await client.query<Entity>(`
      SELECT id, entity_type, instance_id, name, attributes,
             source_file, line_start, line_end, content_hash,
             extracted_at, project_id
      FROM entities
      WHERE instance_id = $1
    `, [instanceId]);

    return result.rows[0] ?? null;
  } finally {
    client.release();
  }
}

/**
 * Query entities by type.
 * Project-scoped via RLS.
 */
export async function queryByType(
  projectId: string,
  entityType: EntityTypeCode
): Promise<Entity[]> {
  const client = await getClient();
  try {
    await setProjectContext(client, projectId);

    const result = await client.query<Entity>(`
      SELECT id, entity_type, instance_id, name, attributes,
             source_file, line_start, line_end, content_hash,
             extracted_at, project_id
      FROM entities
      WHERE entity_type = $1
      ORDER BY instance_id
    `, [entityType]);

    return result.rows;
  } finally {
    client.release();
  }
}

/**
 * Get all entities for a project.
 * Project-scoped via RLS.
 */
export async function getAll(projectId: string): Promise<Entity[]> {
  const client = await getClient();
  try {
    await setProjectContext(client, projectId);

    const result = await client.query<Entity>(`
      SELECT id, entity_type, instance_id, name, attributes,
             source_file, line_start, line_end, content_hash,
             extracted_at, project_id
      FROM entities
      ORDER BY entity_type, instance_id
    `);

    return result.rows;
  } finally {
    client.release();
  }
}

/**
 * Count entities by type.
 * Project-scoped via RLS.
 */
export async function countByType(
  projectId: string
): Promise<Record<EntityTypeCode, number>> {
  const client = await getClient();
  try {
    await setProjectContext(client, projectId);

    const result = await client.query<{ entity_type: EntityTypeCode; count: string }>(`
      SELECT entity_type, COUNT(*) as count
      FROM entities
      GROUP BY entity_type
      ORDER BY entity_type
    `);

    const counts: Partial<Record<EntityTypeCode, number>> = {};
    for (const row of result.rows) {
      counts[row.entity_type] = parseInt(row.count, 10);
    }

    return counts as Record<EntityTypeCode, number>;
  } finally {
    client.release();
  }
}

/**
 * Batch upsert multiple entities.
 * Returns results for each entity.
 */
export async function batchUpsert(
  projectId: string,
  entities: ExtractedEntity[]
): Promise<UpsertResult[]> {
  const results: UpsertResult[] = [];

  for (const extracted of entities) {
    const result = await upsert(projectId, extracted);
    results.push(result);
  }

  return results;
}
