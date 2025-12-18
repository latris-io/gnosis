// src/services/sync/sync-service.ts
// @implements STORY-64.1
// @implements STORY-64.2
// Graph sync operations - allowed to import db
// Syncs entities and relationships from Postgres to Neo4j

import type { PoolClient } from 'pg';
import type { Session } from 'neo4j-driver';
import { pool, getClient, setProjectContext } from '../../db/postgres.js';
import { getSession, ensureConstraintsOnce } from '../../db/neo4j.js';

/**
 * Sync all entities for a project from Postgres to Neo4j.
 * Internally queries via entity tables and creates/updates Neo4j nodes.
 * 
 * @param projectId - Project UUID
 * @returns Count of synced entities
 */
export async function syncEntitiesToNeo4j(projectId: string): Promise<{ synced: number }> {
  // Ensure Neo4j constraints exist (memoized - runs once per process)
  await ensureConstraintsOnce();

  let client: PoolClient | null = null;
  let session: Session | null = null;

  try {
    session = getSession();
    client = await pool.connect();

    // Set project context for RLS
    await setProjectContext(client, projectId);

    // Query all entities for this project
    const result = await client.query(
      'SELECT id, entity_type, instance_id, name, attributes FROM entities WHERE project_id = $1',
      [projectId]
    );

    const entities = result.rows;
    let synced = 0;

    for (const entity of entities) {
      // Use MERGE to create or update with (project_id, instance_id) identity
      // Per EXIT.md Upsert Rule (Locked): identity lookup is project-scoped
      await session.run(
        `MERGE (n:Entity {project_id: $projectId, instance_id: $instanceId})
         SET n.entity_type = $entityType,
             n.name = $name,
             n.attributes = $attributes,
             n.synced_at = datetime()`,
        {
          projectId: projectId,
          instanceId: entity.instance_id,
          entityType: entity.entity_type,
          name: entity.name,
          attributes: JSON.stringify(entity.attributes || {}),
        }
      );
      synced++;
    }

    return { synced };
  } finally {
    client?.release();
    if (session) await session.close();
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
 * @satisfies AC-64.2.1
 */
export async function syncRelationshipsToNeo4j(
  projectId: string
): Promise<{ synced: number; skipped: number }> {
  await ensureConstraintsOnce();

  let client: PoolClient | null = null;
  let session: Session | null = null;

  try {
    session = getSession();
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
    const synced = mergeResult.records[0]?.get('mergedCount')?.toNumber() ?? 0;
    const skipped = relationships.length - synced;

    // Post-sync duplicate detection gate
    await detectDuplicateRelationships(session, projectId);

    return { synced, skipped };
  } finally {
    client?.release();
    if (session) await session.close();
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
