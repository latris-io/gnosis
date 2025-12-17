// src/services/sync/sync-service.ts
// @implements STORY-64.1
// Graph sync operations - allowed to import db
// Syncs entities from Postgres to Neo4j

import type { PoolClient } from 'pg';
import type { Session } from 'neo4j-driver';
import { pool, setProjectContext } from '../../db/postgres.js';
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
