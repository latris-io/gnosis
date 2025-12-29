// src/services/sync/sync-service.ts
// @implements STORY-64.1
// @implements STORY-64.2
// @tdd TDD-A1-ENTITY-REGISTRY
// @tdd TDD-A2-RELATIONSHIP-REGISTRY
// Graph sync operations - allowed to import db
// Syncs entities and relationships from Postgres to Neo4j

import type { PoolClient } from 'pg';
import type { Session } from 'neo4j-driver';
import { pool, getClient, setProjectContext } from '../../db/postgres.js';
import { getSession, ensureConstraintsOnce, withSessionRetry } from '../../db/neo4j.js';

/**
 * Sync all entities for a project from Postgres to Neo4j.
 * Uses UNWIND batch pattern for performance (single query for all entities).
 * 
 * @param projectId - Project UUID
 * @returns Count of synced entities
 */
export async function syncEntitiesToNeo4j(projectId: string): Promise<{ synced: number }> {
  // Ensure Neo4j constraints exist (memoized - runs once per process)
  await ensureConstraintsOnce();

  let client: PoolClient | null = null;

  try {
    client = await pool.connect();

    // Set project context for RLS
    await setProjectContext(client, projectId);

    // Query all entities for this project
    const result = await client.query(
      'SELECT id, entity_type, instance_id, name, attributes FROM entities WHERE project_id = $1',
      [projectId]
    );

    const entities = result.rows;
    
    if (entities.length === 0) {
      return { synced: 0 };
    }

    // Use withSessionRetry for resilience against transient Neo4j errors
    const synced = await withSessionRetry(async (session) => {
      // UNWIND batch - single Cypher query for all entities (like relationship sync)
      // Use MERGE to create or update with (project_id, instance_id) identity
      // Per EXIT.md Upsert Rule (Locked): identity lookup is project-scoped
      const mergeResult = await session.run(`
        UNWIND $entities AS entity
        MERGE (n:Entity {project_id: $projectId, instance_id: entity.instanceId})
        SET n.entity_type = entity.entityType,
            n.name = entity.name,
            n.attributes = entity.attributes,
            n.synced_at = datetime()
        WITH count(n) AS mergedCount
        RETURN mergedCount
      `, {
        projectId,
        entities: entities.map(e => ({
          instanceId: e.instance_id,
          entityType: e.entity_type,
          name: e.name,
          attributes: JSON.stringify(e.attributes || {}),
        })),
      });

      return mergeResult.records[0]?.get('mergedCount')?.toNumber() ?? 0;
    });

    return { synced };
  } finally {
    client?.release();
  }
}

/**
 * Sync relationships from PostgreSQL to Neo4j.
 * Creates edges between existing Entity nodes using UNWIND + MERGE pattern.
 * 
 * Performance: Uses UNWIND to batch all relationships in a single Cypher query
 * rather than one query per relationship (critical for R01+R02 = 3,200+ rels).
 * 
 * Uniqueness Strategy (Community Edition):
 * - MERGE on (project_id, instance_id) ensures no duplicates in single-threaded writes
 * - Post-sync duplicate detection gate catches any concurrent write race conditions
 * 
 * Skipped Logic: A relationship is "skipped" when MATCH fails to find endpoint
 * entities in Neo4j. This is detected by comparing input count vs merged count.
 * 
 * @param projectId - Project scope for RLS
 * @returns Sync statistics
 * @throws Error if duplicate relationships detected post-sync
 */
export async function syncRelationshipsToNeo4j(
  projectId: string
): Promise<{ synced: number; skipped: number }> {
  await ensureConstraintsOnce();

  let client: PoolClient | null = null;

  try {
    // Use getClient() for consistency with RLS hardening
    client = await getClient();
    await setProjectContext(client, projectId);

    // Query relationships with entity instance_ids for MERGE
    const result = await client.query(`
      SELECT 
        r.instance_id,
        r.relationship_type,
        r.name,
        r.confidence,
        r.source_file,
        r.line_start,
        r.line_end,
        from_e.instance_id AS from_instance_id,
        to_e.instance_id AS to_instance_id
      FROM relationships r
      JOIN entities from_e ON r.from_entity_id = from_e.id
      JOIN entities to_e ON r.to_entity_id = to_e.id
      WHERE r.project_id = $1
    `, [projectId]);

    const relationships = result.rows;
    
    if (relationships.length === 0) {
      return { synced: 0, skipped: 0 };
    }

    // Use withSessionRetry for resilience against transient Neo4j errors
    const { synced, skipped } = await withSessionRetry(async (session) => {
      // UNWIND batch - single Cypher query for all relationships
      // MATCH+MERGE pattern: if either endpoint is missing, that row produces no result
      // Use explicit count() for auditable "Extract → Persist → Sync → Verify" pipeline
      const mergeResult = await session.run(`
        UNWIND $rels AS rel
        MATCH (from:Entity {instance_id: rel.fromInstanceId, project_id: $projectId})
        MATCH (to:Entity {instance_id: rel.toInstanceId, project_id: $projectId})
        MERGE (from)-[r:RELATIONSHIP {project_id: $projectId, instance_id: rel.instanceId}]->(to)
        SET r.relationship_type = rel.type,
            r.name = rel.name,
            r.confidence = rel.confidence,
            r.source_file = rel.sourceFile,
            r.line_start = rel.lineStart,
            r.line_end = rel.lineEnd,
            r.synced_at = datetime()
        WITH count(r) AS mergedCount
        RETURN mergedCount
      `, {
        projectId,
        rels: relationships.map(rel => ({
          instanceId: rel.instance_id,
          fromInstanceId: rel.from_instance_id,
          toInstanceId: rel.to_instance_id,
          type: rel.relationship_type,
          name: rel.name,
          confidence: rel.confidence,
          sourceFile: rel.source_file,
          lineStart: rel.line_start,
          lineEnd: rel.line_end,
        })),
      });

      // Explicit count for measurable sync verification
      const syncedCount = mergeResult.records[0]?.get('mergedCount')?.toNumber() ?? 0;
      const skippedCount = relationships.length - syncedCount;

      // Post-sync duplicate detection gate
      await detectDuplicateRelationships(session, projectId);

      return { synced: syncedCount, skipped: skippedCount };
    });

    return { synced, skipped };
  } finally {
    client?.release();
  }
}

/**
 * Duplicate detection gate - fails if any duplicate relationships exist.
 * Required because Community Edition lacks uniqueness constraints.
 */
async function detectDuplicateRelationships(
  session: Session,
  projectId: string
): Promise<void> {
  const result = await session.run(`
    MATCH ()-[r:RELATIONSHIP {project_id: $projectId}]->()
    WITH r.instance_id AS instanceId, collect(r) AS rels
    WHERE size(rels) > 1
    RETURN instanceId, size(rels) AS count
  `, { projectId });

  if (result.records.length > 0) {
    const duplicates = result.records.map(r => 
      `${r.get('instanceId')} (${r.get('count')} copies)`
    ).join(', ');
    throw new Error(
      `[SYNC GATE FAILED] Duplicate relationships detected in Neo4j: ${duplicates}. ` +
      `This indicates a concurrency issue. Manual cleanup required.`
    );
  }
}

/**
 * Replace-by-project relationship sync.
 * Deletes ALL Neo4j relationships for project_id, then re-inserts from Postgres.
 * This ensures Neo4j is an exact mirror of Postgres relationships.
 * 
 * Use this instead of syncRelationshipsToNeo4j when:
 * - Stale relationships exist in Neo4j (from old extraction logic)
 * - You need guaranteed parity, not incremental sync
 * 
 * @param projectId - Project scope
 * @returns Sync statistics including deleted count
 */
export async function replaceRelationshipsInNeo4j(
  projectId: string
): Promise<{ deleted: number; synced: number; skipped: number }> {
  await ensureConstraintsOnce();

  let client: PoolClient | null = null;
  let session: Session | null = null;

  try {
    session = getSession();
    client = await getClient();
    await setProjectContext(client, projectId);

    // Step 1: Delete ALL existing relationships for this project
    const deleteResult = await session.run(`
      MATCH ()-[r:RELATIONSHIP {project_id: $projectId}]->()
      WITH r, r.instance_id AS id
      DELETE r
      RETURN count(id) AS deletedCount
    `, { projectId });

    const deleted = deleteResult.records[0]?.get('deletedCount')?.toNumber() ?? 0;

    // Step 2: Query all relationships from Postgres
    const result = await client.query(`
      SELECT 
        r.instance_id,
        r.relationship_type,
        r.name,
        r.confidence,
        r.source_file,
        r.line_start,
        r.line_end,
        from_e.instance_id AS from_instance_id,
        to_e.instance_id AS to_instance_id
      FROM relationships r
      JOIN entities from_e ON r.from_entity_id = from_e.id
      JOIN entities to_e ON r.to_entity_id = to_e.id
      WHERE r.project_id = $1
    `, [projectId]);

    const relationships = result.rows;
    
    if (relationships.length === 0) {
      return { deleted, synced: 0, skipped: 0 };
    }

    // Step 3: Re-insert all relationships from Postgres
    const mergeResult = await session.run(`
      UNWIND $rels AS rel
      MATCH (from:Entity {instance_id: rel.fromInstanceId, project_id: $projectId})
      MATCH (to:Entity {instance_id: rel.toInstanceId, project_id: $projectId})
      CREATE (from)-[r:RELATIONSHIP {
        project_id: $projectId,
        instance_id: rel.instanceId,
        relationship_type: rel.type,
        name: rel.name,
        confidence: rel.confidence,
        source_file: rel.sourceFile,
        line_start: rel.lineStart,
        line_end: rel.lineEnd,
        synced_at: datetime()
      }]->(to)
      WITH count(r) AS createdCount
      RETURN createdCount
    `, {
      projectId,
      rels: relationships.map(rel => ({
        instanceId: rel.instance_id,
        fromInstanceId: rel.from_instance_id,
        toInstanceId: rel.to_instance_id,
        type: rel.relationship_type,
        name: rel.name,
        confidence: rel.confidence,
        sourceFile: rel.source_file,
        lineStart: rel.line_start,
        lineEnd: rel.line_end,
      })),
    });

    const synced = mergeResult.records[0]?.get('createdCount')?.toNumber() ?? 0;
    const skipped = relationships.length - synced;

    // Post-sync duplicate detection gate
    await detectDuplicateRelationships(session, projectId);

    return { deleted, synced, skipped };
  } finally {
    client?.release();
    if (session) await session.close();
  }
}

/**
 * Verify relationship parity between Postgres and Neo4j.
 * Read-only comparison of relationship counts by type.
 * 
 * @param projectId - Project scope
 * @returns Parity check result with counts by relationship_type
 */
export async function verifyRelationshipParity(
  projectId: string
): Promise<{
  consistent: boolean;
  postgres: { total: number; byType: Record<string, number> };
  neo4j: { total: number; byType: Record<string, number> };
  mismatches: Array<{ type: string; pg: number; neo4j: number }>;
}> {
  let client: PoolClient | null = null;
  let session: Session | null = null;

  try {
    session = getSession();
    client = await getClient();
    await setProjectContext(client, projectId);

    // Postgres counts by type
    const pgResult = await client.query(`
      SELECT relationship_type, COUNT(*)::int AS count
      FROM relationships
      WHERE project_id = $1
      GROUP BY relationship_type
      ORDER BY relationship_type
    `, [projectId]);

    const pgByType: Record<string, number> = {};
    let pgTotal = 0;
    for (const row of pgResult.rows) {
      pgByType[row.relationship_type] = row.count;
      pgTotal += row.count;
    }

    // Neo4j counts by type (using r.relationship_type property)
    const neo4jResult = await session.run(`
      MATCH ()-[r:RELATIONSHIP {project_id: $projectId}]->()
      RETURN r.relationship_type AS type, count(r) AS count
      ORDER BY type
    `, { projectId });

    const neo4jByType: Record<string, number> = {};
    let neo4jTotal = 0;
    for (const record of neo4jResult.records) {
      const type = record.get('type');
      const count = record.get('count').toNumber();
      neo4jByType[type] = count;
      neo4jTotal += count;
    }

    // Find mismatches
    const allTypes = new Set([...Object.keys(pgByType), ...Object.keys(neo4jByType)]);
    const mismatches: Array<{ type: string; pg: number; neo4j: number }> = [];

    for (const type of allTypes) {
      const pgCount = pgByType[type] || 0;
      const neo4jCount = neo4jByType[type] || 0;
      if (pgCount !== neo4jCount) {
        mismatches.push({ type, pg: pgCount, neo4j: neo4jCount });
      }
    }

    return {
      consistent: mismatches.length === 0 && pgTotal === neo4jTotal,
      postgres: { total: pgTotal, byType: pgByType },
      neo4j: { total: neo4jTotal, byType: neo4jByType },
      mismatches,
    };
  } finally {
    client?.release();
    if (session) await session.close();
  }
}
