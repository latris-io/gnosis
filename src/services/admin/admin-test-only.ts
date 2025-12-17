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

import { pool } from '../../db/postgres.js';
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
