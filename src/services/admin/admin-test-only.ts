// src/services/admin/admin-test-only.ts
// @implements INFRASTRUCTURE
// Test-only destructive helpers - guarded by NODE_ENV

// Hard runtime guard - throws immediately in non-test environments
if (process.env.NODE_ENV !== 'test') {
  throw new Error(
    'admin-test-only.ts can only be loaded when NODE_ENV=test. ' +
    'This module contains destructive operations not permitted in production.'
  );
}

import { pool, getClient, setProjectContext } from '../../db/postgres.js';
import { getSession } from '../../db/neo4j.js';

/**
 * Create a test project.
 * For test setup only.
 */
export async function createTestProject(projectId: string, name: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      INSERT INTO projects (id, name)
      VALUES ($1, $2)
      ON CONFLICT (id) DO NOTHING
    `, [projectId, name]);
  } finally {
    client.release();
  }
}

/**
 * Delete entities for a project.
 * For test cleanup only.
 */
export async function deleteProjectEntities(projectId: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('DELETE FROM entities WHERE project_id = $1', [projectId]);
  } finally {
    client.release();
  }
}

/**
 * Delete a project.
 * For test cleanup only.
 */
export async function deleteProject(projectId: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('DELETE FROM projects WHERE id = $1', [projectId]);
  } finally {
    client.release();
  }
}

/**
 * Create a test entity.
 * For test setup only.
 */
export async function createTestEntity(
  projectId: string,
  entityType: string,
  instanceId: string,
  name: string
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      INSERT INTO entities (id, project_id, entity_type, instance_id, name, attributes)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, '{}')
      ON CONFLICT (project_id, instance_id) DO NOTHING
    `, [projectId, entityType, instanceId, name]);
  } finally {
    client.release();
  }
}

/**
 * Delete Neo4j nodes for specified projects.
 * Uses DETACH DELETE for proper cleanup.
 * For test cleanup only.
 */
export async function deleteNeo4jProjectNodes(projectIds: string[]): Promise<void> {
  let session: ReturnType<typeof getSession> | null = null;
  try {
    session = getSession();
    await session.run(
      'MATCH (n:Entity) WHERE n.project_id IN $projectIds DETACH DELETE n',
      { projectIds }
    );
  } finally {
    if (session) await session.close();
  }
}

/**
 * Query Neo4j entities by instance_id.
 * Returns array of { projectId, name } for assertions.
 * For test verification only.
 */
export async function queryNeo4jByInstanceId(
  instanceId: string
): Promise<Array<{ projectId: string; name: string }>> {
  let session: ReturnType<typeof getSession> | null = null;
  try {
    session = getSession();
    const result = await session.run(
      'MATCH (n:Entity {instance_id: $instanceId}) RETURN n.project_id as projectId, n.name as name',
      { instanceId }
    );
    return result.records.map(r => ({
      projectId: r.get('projectId'),
      name: r.get('name'),
    }));
  } finally {
    if (session) await session.close();
  }
}

/**
 * Create a test relationship.
 * For test setup only.
 * Uses RLS context via getClient() + setProjectContext().
 */
export async function createTestRelationship(
  projectId: string,
  relationshipType: string,
  instanceId: string,
  name: string,
  fromInstanceId: string,
  toInstanceId: string
): Promise<void> {
  const client = await getClient();
  try {
    await setProjectContext(client, projectId);
    
    // Resolve entity UUIDs (RLS scoped)
    const fromResult = await client.query(
      'SELECT id FROM entities WHERE instance_id = $1',
      [fromInstanceId]
    );
    const toResult = await client.query(
      'SELECT id FROM entities WHERE instance_id = $1',
      [toInstanceId]
    );
    
    if (!fromResult.rows[0] || !toResult.rows[0]) {
      throw new Error(`Endpoint entities not found for relationship ${instanceId}`);
    }

    // Check if relationship already exists (RLS-scoped)
    const existing = await client.query(
      'SELECT id FROM relationships WHERE instance_id = $1',
      [instanceId]
    );
    
    if (existing.rows.length === 0) {
      await client.query(`
        INSERT INTO relationships (
          id, project_id, relationship_type, instance_id, name,
          from_entity_id, to_entity_id, confidence,
          source_file, line_start, line_end
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6, 1.0,
          'test.md', 1, 1
        )
      `, [
        projectId, relationshipType, instanceId, name,
        fromResult.rows[0].id, toResult.rows[0].id
      ]);
    }
  } finally {
    client.release();
  }
}

/**
 * Delete relationships for a project.
 * For test cleanup only.
 * Uses RLS context via getClient() + setProjectContext().
 */
export async function deleteProjectRelationships(projectId: string): Promise<void> {
  const client = await getClient();
  try {
    await setProjectContext(client, projectId);
    // RLS-scoped delete - no need for WHERE project_id clause
    await client.query('DELETE FROM relationships');
  } finally {
    client.release();
  }
}

/**
 * Query Neo4j relationships by project and instance_id.
 * Project-scoped to prevent cross-project collision in parallel tests.
 * For test verification only.
 */
export async function queryNeo4jRelationshipByInstanceId(
  projectId: string,
  instanceId: string
): Promise<Array<{ projectId: string; type: string; fromInstanceId: string; toInstanceId: string }>> {
  let session: ReturnType<typeof getSession> | null = null;
  try {
    session = getSession();
    const result = await session.run(`
      MATCH (from:Entity)-[r:RELATIONSHIP {project_id: $projectId, instance_id: $instanceId}]->(to:Entity)
      RETURN r.project_id as projectId, r.relationship_type as type,
             from.instance_id as fromInstanceId, to.instance_id as toInstanceId
    `, { projectId, instanceId });
    return result.records.map(r => ({
      projectId: r.get('projectId'),
      type: r.get('type'),
      fromInstanceId: r.get('fromInstanceId'),
      toInstanceId: r.get('toInstanceId'),
    }));
  } finally {
    if (session) await session.close();
  }
}

/**
 * Count all nodes in Neo4j for a specific project.
 * Uses generic {project_id} match to handle any node labels.
 * Scoped by project_id to avoid cross-project interference.
 */
export async function countNeo4jNodes(projectId: string): Promise<number> {
  let session: ReturnType<typeof getSession> | null = null;
  try {
    session = getSession();
    const result = await session.run(
      'MATCH (n {project_id: $projectId}) RETURN count(n) AS n',
      { projectId }
    );
    return result.records[0]?.get('n')?.toNumber() ?? 0;
  } finally {
    if (session) await session.close();
  }
}

/**
 * Count relationships in Neo4j for a specific project.
 * Scoped by project_id to avoid cross-project interference.
 */
export async function countNeo4jRelationships(projectId: string): Promise<number> {
  let session: ReturnType<typeof getSession> | null = null;
  try {
    session = getSession();
    const result = await session.run(
      'MATCH ()-[r:RELATIONSHIP {project_id: $projectId}]->() RETURN count(r) AS n',
      { projectId }
    );
    return result.records[0]?.get('n')?.toNumber() ?? 0;
  } finally {
    if (session) await session.close();
  }
}

/**
 * Clear all Neo4j data for a specific project (all nodes + relationships).
 * DETACH DELETE removes nodes and their relationships atomically.
 * Scoped by project_id - does NOT affect other projects.
 * Uses generic {project_id} match to handle any future node labels.
 */
export async function clearNeo4jProject(projectId: string): Promise<void> {
  let session: ReturnType<typeof getSession> | null = null;
  try {
    session = getSession();
    await session.run(
      'MATCH (n {project_id: $projectId}) DETACH DELETE n',
      { projectId }
    );
  } finally {
    if (session) await session.close();
  }
}
