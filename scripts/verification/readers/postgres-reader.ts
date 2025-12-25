/**
 * PostgreSQL Reader (Read-Only)
 * 
 * Provides read-only access to PostgreSQL for verification purposes.
 * 
 * CRITICAL: This is a VERIFICATION reader - it must NOT:
 * - Import from ingestion/extraction logic
 * - Modify any data
 * - Use the same query patterns as extraction providers
 * 
 * @implements STORY-64.1 (Verification infrastructure)
 */

import 'dotenv/config';
import { Pool } from 'pg';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface EntityCount {
  entity_type: string;
  count: number;
}

export interface RelationshipCount {
  relationship_type: string;
  count: number;
}

export interface EntityInstance {
  id: string;
  entity_type: string;
  instance_id: string;
}

export interface RelationshipInstance {
  id: string;
  relationship_type: string;
  instance_id: string;
  from_entity_id: string;
  to_entity_id: string;
}

export interface ReferentialIntegrityResult {
  valid: boolean;
  orphanRelationships: Array<{
    id: string;
    relationship_type: string;
    from_entity_id: string;
    to_entity_id: string;
    issue: 'missing_from' | 'missing_to';
  }>;
}

// -----------------------------------------------------------------------------
// PostgreSQL Connection
// -----------------------------------------------------------------------------

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/gnosis',
      ssl: {
        rejectUnauthorized: false, // Required for Render
      },
    });
  }
  return pool;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

// -----------------------------------------------------------------------------
// RLS Context Helper
// -----------------------------------------------------------------------------

/**
 * Execute a query with RLS context set for the given project.
 * CRITICAL: FORCE ROW LEVEL SECURITY requires context, not just WHERE clause.
 */
async function queryWithRLS<T>(
  projectId: string | undefined,
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const pg = getPool();
  const client = await pg.connect();
  
  try {
    if (projectId) {
      await client.query(`SET app.project_id = '${projectId}'`);
    } else {
      await client.query('RESET app.project_id');
    }
    
    const result = await client.query(sql, params);
    return result.rows as T[];
  } finally {
    client.release();
  }
}

// -----------------------------------------------------------------------------
// Entity Queries
// -----------------------------------------------------------------------------

/**
 * Get entity counts by type.
 * Returns counts for all entity types found in the database.
 */
export async function getEntityCounts(projectId?: string): Promise<EntityCount[]> {
  const query = `SELECT entity_type, COUNT(*)::int as count 
     FROM entities 
     GROUP BY entity_type 
     ORDER BY entity_type`;
  
  const rows = await queryWithRLS<{ entity_type: string; count: string }>(
    projectId,
    query
  );
  
  return rows.map(row => ({
    entity_type: row.entity_type,
    count: parseInt(row.count, 10),
  }));
}

/**
 * Get total entity count.
 */
export async function getTotalEntityCount(projectId?: string): Promise<number> {
  const rows = await queryWithRLS<{ count: string }>(
    projectId,
    `SELECT COUNT(*)::int as count FROM entities`
  );
  
  return parseInt(rows[0]?.count || '0', 10);
}

/**
 * Get all entity IDs for a specific type.
 * Used for cross-store verification.
 */
export async function getEntityIds(entityType: string, projectId?: string): Promise<string[]> {
  const rows = await queryWithRLS<{ id: string }>(
    projectId,
    `SELECT id FROM entities WHERE entity_type = $1 ORDER BY id`,
    [entityType]
  );
  
  return rows.map(row => row.id);
}

/**
 * Get all instance_ids for a specific entity type.
 * Used for cross-store verification (Neo4j uses instance_id as identity).
 */
export async function getInstanceIds(entityType: string, projectId?: string): Promise<string[]> {
  const rows = await queryWithRLS<{ instance_id: string }>(
    projectId,
    `SELECT instance_id FROM entities WHERE entity_type = $1 ORDER BY instance_id`,
    [entityType]
  );
  
  return rows.map(row => row.instance_id);
}

/**
 * Get all entity instances for a specific type.
 */
export async function getEntityInstances(entityType: string, projectId?: string): Promise<EntityInstance[]> {
  return queryWithRLS<EntityInstance>(
    projectId,
    `SELECT id, entity_type, instance_id 
       FROM entities 
       WHERE entity_type = $1 
       ORDER BY instance_id`,
    [entityType]
  );
}

/**
 * Get all unique entity types present in the database.
 */
export async function getEntityTypes(projectId?: string): Promise<string[]> {
  const rows = await queryWithRLS<{ entity_type: string }>(
    projectId,
    `SELECT DISTINCT entity_type FROM entities ORDER BY entity_type`
  );
  
  return rows.map(row => row.entity_type);
}

// -----------------------------------------------------------------------------
// Relationship Queries
// -----------------------------------------------------------------------------

/**
 * Get relationship counts by type.
 * Returns counts for all relationship types found in the database.
 */
export async function getRelationshipCounts(projectId?: string): Promise<RelationshipCount[]> {
  const rows = await queryWithRLS<{ relationship_type: string; count: string }>(
    projectId,
    `SELECT relationship_type, COUNT(*)::int as count 
       FROM relationships 
       GROUP BY relationship_type 
       ORDER BY relationship_type`
  );
  
  return rows.map(row => ({
    relationship_type: row.relationship_type,
    count: parseInt(row.count, 10),
  }));
}

/**
 * Get total relationship count.
 */
export async function getTotalRelationshipCount(projectId?: string): Promise<number> {
  const rows = await queryWithRLS<{ count: string }>(
    projectId,
    `SELECT COUNT(*)::int as count FROM relationships`
  );
  
  return parseInt(rows[0]?.count || '0', 10);
}

/**
 * Get all relationship IDs for a specific type.
 * Used for cross-store verification.
 */
export async function getRelationshipIds(relationshipType: string, projectId?: string): Promise<string[]> {
  const rows = await queryWithRLS<{ id: string }>(
    projectId,
    `SELECT id FROM relationships WHERE relationship_type = $1 ORDER BY id`,
    [relationshipType]
  );
  
  return rows.map(row => row.id);
}

/**
 * Get all relationship instances for a specific type.
 */
export async function getRelationshipInstances(relationshipType: string, projectId?: string): Promise<RelationshipInstance[]> {
  return queryWithRLS<RelationshipInstance>(
    projectId,
    `SELECT id, relationship_type, instance_id, from_entity_id, to_entity_id 
       FROM relationships 
       WHERE relationship_type = $1 
       ORDER BY instance_id`,
    [relationshipType]
  );
}

/**
 * Get all unique relationship types present in the database.
 */
export async function getRelationshipTypes(projectId?: string): Promise<string[]> {
  const rows = await queryWithRLS<{ relationship_type: string }>(
    projectId,
    `SELECT DISTINCT relationship_type FROM relationships ORDER BY relationship_type`
  );
  
  return rows.map(row => row.relationship_type);
}

// -----------------------------------------------------------------------------
// Referential Integrity
// -----------------------------------------------------------------------------

/**
 * Check referential integrity of relationships.
 * Verifies that all from_entity_id and to_entity_id references exist.
 */
export async function checkReferentialIntegrity(projectId?: string): Promise<ReferentialIntegrityResult> {
  // Check for orphan from_entity_id references
  const fromOrphans = await queryWithRLS<{ id: string; relationship_type: string; from_entity_id: string; to_entity_id: string }>(
    projectId,
    `SELECT r.id, r.relationship_type, r.from_entity_id, r.to_entity_id
       FROM relationships r
       LEFT JOIN entities e ON r.from_entity_id = e.id
       WHERE e.id IS NULL`
  );
  
  // Check for orphan to_entity_id references
  const toOrphans = await queryWithRLS<{ id: string; relationship_type: string; from_entity_id: string; to_entity_id: string }>(
    projectId,
    `SELECT r.id, r.relationship_type, r.from_entity_id, r.to_entity_id
       FROM relationships r
       LEFT JOIN entities e ON r.to_entity_id = e.id
       WHERE e.id IS NULL`
  );
  
  const orphans = [
    ...fromOrphans.map(row => ({ ...row, issue: 'missing_from' as const })),
    ...toOrphans.map(row => ({ ...row, issue: 'missing_to' as const })),
  ];
  
  return {
    valid: orphans.length === 0,
    orphanRelationships: orphans,
  };
}

// -----------------------------------------------------------------------------
// Instance ID Verification
// -----------------------------------------------------------------------------

/**
 * Get all instance IDs for entities, grouped by type.
 */
export async function getAllEntityInstanceIds(projectId?: string): Promise<Map<string, Set<string>>> {
  const rows = await queryWithRLS<{ entity_type: string; instance_id: string }>(
    projectId,
    `SELECT entity_type, instance_id FROM entities ORDER BY entity_type, instance_id`
  );
  
  const byType = new Map<string, Set<string>>();
  
  for (const row of rows) {
    if (!byType.has(row.entity_type)) {
      byType.set(row.entity_type, new Set());
    }
    byType.get(row.entity_type)!.add(row.instance_id);
  }
  
  return byType;
}

/**
 * Get all instance IDs for relationships, grouped by type.
 */
export async function getAllRelationshipInstanceIds(projectId?: string): Promise<Map<string, Set<string>>> {
  const rows = await queryWithRLS<{ relationship_type: string; instance_id: string }>(
    projectId,
    `SELECT relationship_type, instance_id FROM relationships ORDER BY relationship_type, instance_id`
  );
  
  const byType = new Map<string, Set<string>>();
  
  for (const row of rows) {
    if (!byType.has(row.relationship_type)) {
      byType.set(row.relationship_type, new Set());
    }
    byType.get(row.relationship_type)!.add(row.instance_id);
  }
  
  return byType;
}

