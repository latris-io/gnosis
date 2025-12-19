// src/services/admin/admin-service.ts
// @implements STORY-64.1
// @tdd TDD-A1-ENTITY-REGISTRY
// Administrative database operations - allowed to import db
// For infrastructure scripts only, not for normal application flow

import { pool } from '../../db/postgres.js';

export interface ConstraintInfo {
  name: string;
  definition: string;
}

export interface MigrationInfo {
  name: string;
}

export interface ConstraintCheckResult {
  hasUpsertSupport: boolean;
  constraints: ConstraintInfo[];
  migrations: MigrationInfo[];
}

/**
 * Get database connection info with password redaction.
 */
export function getDbInfo(): { envVar: string; display: string } {
  const envVar = process.env.TEST_DATABASE_URL ? 'TEST_DATABASE_URL' : 'DATABASE_URL';
  const url = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || '';

  if (!url) {
    throw new Error('No database URL configured. Set DATABASE_URL or TEST_DATABASE_URL environment variable');
  }

  let display: string;
  try {
    const parsed = new URL(url);
    if (parsed.password) {
      parsed.password = '***';
    }
    display = parsed.toString();
  } catch {
    display = url.replace(/:([^:@]+)@/, ':***@');
  }

  return { envVar, display };
}

/**
 * Check entity table constraints.
 */
export async function checkConstraints(): Promise<ConstraintCheckResult> {
  const client = await pool.connect();
  try {
    // Check applied migrations
    const migrationsResult = await client.query<{ name: string }>('SELECT name FROM migrations ORDER BY id');
    const migrations = migrationsResult.rows.map(r => ({ name: r.name }));

    // Check constraints
    const constraintQuery = `
      SELECT c.conname as name, pg_get_constraintdef(c.oid) as definition
      FROM pg_constraint c
      JOIN pg_class t ON c.conrelid = t.oid
      WHERE t.relname = 'entities'
        AND c.contype IN ('u', 'p')
    `;
    const constraintsResult = await client.query<{ name: string; definition: string }>(constraintQuery);
    const constraints = constraintsResult.rows.map(r => ({ name: r.name, definition: r.definition }));

    // Check if upsert semantics are supported
    const hasUpsertSupport = constraints.some(c =>
      c.definition.includes('project_id') && c.definition.includes('instance_id')
    );

    return { hasUpsertSupport, constraints, migrations };
  } finally {
    client.release();
  }
}

/**
 * Fix missing upsert constraint.
 * DANGEROUS: Only call if you know what you're doing.
 */
export async function fixUpsertConstraint(): Promise<void> {
  const client = await pool.connect();
  try {
    // Check current constraints
    const constraintQuery = `
      SELECT c.conname as name, pg_get_constraintdef(c.oid) as definition
      FROM pg_constraint c
      JOIN pg_class t ON c.conrelid = t.oid
      WHERE t.relname = 'entities'
        AND c.contype IN ('u', 'p')
    `;
    const result = await client.query<{ name: string; definition: string }>(constraintQuery);

    // Drop old constraint if exists (UNIQUE instance_id only)
    const oldConstraint = result.rows.find(r =>
      r.definition.includes('instance_id') && !r.definition.includes('project_id')
    );
    if (oldConstraint) {
      await client.query(`ALTER TABLE entities DROP CONSTRAINT IF EXISTS "${oldConstraint.name}"`);
    }

    // Add correct constraint
    await client.query(`
      ALTER TABLE entities 
      ADD CONSTRAINT entities_project_instance_unique 
      UNIQUE (project_id, instance_id)
    `);
  } finally {
    client.release();
  }
}

/**
 * Close the database pool.
 */
export async function closeAdminPool(): Promise<void> {
  await pool.end();
}

// NOTE: Test-only destructive helpers (createTestProject, deleteProjectEntities, deleteProject)
// have been moved to admin-test-only.ts with NODE_ENV guard.

// ============================================================================
// Admin Delete Operations (for remediation scripts)
// ============================================================================

import { getClient, setProjectContext } from '../../db/postgres.js';
import { getSession, closeDriver } from '../../db/neo4j.js';

/**
 * Delete all R04 relationships for a project.
 * R04 is fully derivable - safe to delete and re-derive.
 * Admin operation for remediation scripts only.
 */
export async function deleteR04Relationships(projectId: string): Promise<number> {
  const client = await getClient();
  try {
    await setProjectContext(client, projectId);
    const result = await client.query(`
      DELETE FROM relationships 
      WHERE relationship_type = 'R04'
      RETURNING id
    `);
    return result.rowCount ?? 0;
  } finally {
    client.release();
  }
}

/**
 * Delete E15 entities by instance_id list.
 * Admin operation for remediation scripts only.
 */
export async function deleteE15ByInstanceIds(
  projectId: string, 
  instanceIds: string[]
): Promise<number> {
  if (instanceIds.length === 0) return 0;
  
  const client = await getClient();
  try {
    await setProjectContext(client, projectId);
    
    let totalDeleted = 0;
    const batchSize = 100;
    
    for (let i = 0; i < instanceIds.length; i += batchSize) {
      const batch = instanceIds.slice(i, i + batchSize);
      const placeholders = batch.map((_, idx) => `$${idx + 1}`).join(', ');
      
      const result = await client.query(`
        DELETE FROM entities 
        WHERE instance_id IN (${placeholders})
        AND entity_type = 'E15'
        RETURNING id
      `, batch);
      
      totalDeleted += result.rowCount ?? 0;
    }
    
    return totalDeleted;
  } finally {
    client.release();
  }
}

/**
 * Delete E15 nodes and incident edges in Neo4j.
 * Admin operation for remediation scripts only.
 */
export async function deleteInvalidE15FromNeo4j(
  projectId: string,
  instanceIds: string[]
): Promise<{ nodesDeleted: number; edgesDeleted: number }> {
  if (instanceIds.length === 0) {
    return { nodesDeleted: 0, edgesDeleted: 0 };
  }
  
  const session = getSession();
  try {
    let totalEdgesDeleted = 0;
    let totalNodesDeleted = 0;
    const batchSize = 50;
    
    // Delete incident edges first
    for (let i = 0; i < instanceIds.length; i += batchSize) {
      const batch = instanceIds.slice(i, i + batchSize);
      
      const edgeResult = await session.run(`
        MATCH (n:Entity {project_id: $projectId})
        WHERE n.instance_id IN $instanceIds
        MATCH (n)-[r]-()
        DELETE r
        RETURN count(r) as deleted
      `, { projectId, instanceIds: batch });
      
      totalEdgesDeleted += edgeResult.records[0]?.get('deleted')?.toNumber() ?? 0;
    }
    
    // Then delete nodes
    for (let i = 0; i < instanceIds.length; i += batchSize) {
      const batch = instanceIds.slice(i, i + batchSize);
      
      const nodeResult = await session.run(`
        MATCH (n:Entity {project_id: $projectId, entity_type: 'E15'})
        WHERE n.instance_id IN $instanceIds
        DELETE n
        RETURN count(n) as deleted
      `, { projectId, instanceIds: batch });
      
      totalNodesDeleted += nodeResult.records[0]?.get('deleted')?.toNumber() ?? 0;
    }
    
    return { nodesDeleted: totalNodesDeleted, edgesDeleted: totalEdgesDeleted };
  } finally {
    await session.close();
  }
}

/**
 * Close Neo4j driver.
 * For graceful shutdown in admin scripts.
 */
export async function closeNeo4jDriver(): Promise<void> {
  await closeDriver();
}
