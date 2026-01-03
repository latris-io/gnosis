/**
 * State Snapshot - Capture before/after counts for evidence
 * 
 * Uses read-only queries to capture entity and relationship counts
 * from PostgreSQL and Neo4j for evidence artifacts.
 * 
 * This is a scripts-only utility. It does NOT modify any state.
 */

import type { StateSnapshot } from './operator-guard.js';

/**
 * Capture state snapshot from PostgreSQL and Neo4j.
 * Returns counts even if one store is unreachable (records error).
 */
export async function captureStateSnapshot(projectId: string): Promise<StateSnapshot> {
  const snapshot: StateSnapshot = {};
  
  // Capture PostgreSQL counts
  try {
    snapshot.postgres = await capturePostgresCounts(projectId);
  } catch (err) {
    snapshot.postgres = {
      entities: -1,
      relationships: -1,
      error: String(err),
    };
  }
  
  // Capture Neo4j counts
  try {
    snapshot.neo4j = await captureNeo4jCounts(projectId);
  } catch (err) {
    snapshot.neo4j = {
      entities: -1,
      relationships: -1,
      error: String(err),
    };
  }
  
  return snapshot;
}

/**
 * Capture counts from PostgreSQL.
 */
async function capturePostgresCounts(projectId: string): Promise<{ entities: number; relationships: number; error?: string }> {
  // Dynamic import to avoid loading if not needed
  const pg = await import('pg');
  const { Pool } = pg.default;
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
  });
  
  try {
    // Set RLS context
    await pool.query(`SELECT set_config('app.current_project_id', $1, false)`, [projectId]);
    
    // Get entity count
    const entityResult = await pool.query(
      `SELECT COUNT(*) as count FROM entities WHERE project_id = $1`,
      [projectId]
    );
    const entities = parseInt(entityResult.rows[0].count, 10);
    
    // Get relationship count
    const relResult = await pool.query(
      `SELECT COUNT(*) as count FROM relationships WHERE project_id = $1`,
      [projectId]
    );
    const relationships = parseInt(relResult.rows[0].count, 10);
    
    return { entities, relationships };
  } finally {
    await pool.end();
  }
}

/**
 * Capture counts from Neo4j.
 */
async function captureNeo4jCounts(projectId: string): Promise<{ entities: number; relationships: number; error?: string }> {
  // Dynamic import to avoid loading if not needed
  const neo4jDriver = await import('neo4j-driver');
  const neo4j = neo4jDriver.default;
  
  const driver = neo4j.driver(
    process.env.NEO4J_URL!,
    neo4j.auth.basic(
      process.env.NEO4J_USER!,
      process.env.NEO4J_PASSWORD!
    )
  );
  
  const session = driver.session();
  
  try {
    // Get entity count
    const entityResult = await session.run(
      `MATCH (e:Entity {project_id: $projectId}) RETURN count(e) as count`,
      { projectId }
    );
    const entities = entityResult.records[0]?.get('count')?.toNumber() ?? 0;
    
    // Get relationship count
    const relResult = await session.run(
      `MATCH (:Entity {project_id: $projectId})-[r:RELATIONSHIP]->(:Entity {project_id: $projectId}) RETURN count(r) as count`,
      { projectId }
    );
    const relationships = relResult.records[0]?.get('count')?.toNumber() ?? 0;
    
    return { entities, relationships };
  } finally {
    await session.close();
    await driver.close();
  }
}

/**
 * Format snapshot for logging.
 */
export function formatSnapshot(snapshot: StateSnapshot): string {
  const parts: string[] = [];
  
  if (snapshot.postgres) {
    const pg = snapshot.postgres;
    if (pg.error) {
      parts.push(`PG: ERROR (${pg.error})`);
    } else {
      parts.push(`PG: ${pg.entities} entities, ${pg.relationships} relationships`);
    }
  }
  
  if (snapshot.neo4j) {
    const neo = snapshot.neo4j;
    if (neo.error) {
      parts.push(`Neo4j: ERROR (${neo.error})`);
    } else {
      parts.push(`Neo4j: ${neo.entities} entities, ${neo.relationships} relationships`);
    }
  }
  
  return parts.join(' | ');
}

