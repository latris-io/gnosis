// src/services/sync/sync-service.ts
// @implements STORY-64.1
// Graph sync operations - allowed to import db
// Syncs entities from Postgres to Neo4j

import { pool, setProjectContext } from '../../db/postgres.js';
import { getSession } from '../../db/neo4j.js';

/**
 * Sync all entities for a project from Postgres to Neo4j.
 * Internally queries via entity tables and creates/updates Neo4j nodes.
 * 
 * @param projectId - Project UUID
 * @returns Count of synced entities
 */
export async function syncEntitiesToNeo4j(projectId: string): Promise<{ synced: number }> {
  const client = await pool.connect();
  const session = getSession();

  try {
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
      // Use MERGE to create or update
      await session.run(
        `MERGE (n {instance_id: $instanceId})
         SET n.entity_type = $entityType,
             n.name = $name,
             n.attributes = $attributes,
             n.synced_at = datetime()`,
        {
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
    client.release();
    await session.close();
  }
}
