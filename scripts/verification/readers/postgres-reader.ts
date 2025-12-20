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
// Entity Queries
// -----------------------------------------------------------------------------

/**
 * Get entity counts by type.
 * Returns counts for all entity types found in the database.
 */
export async function getEntityCounts(projectId?: string): Promise<EntityCount[]> {
  const pg = getPool();
  
  const query = projectId
    ? `SELECT entity_type, COUNT(*)::int as count 
       FROM entities 
       WHERE project_id = $1 
       GROUP BY entity_type 
       ORDER BY entity_type`
    : `SELECT entity_type, COUNT(*)::int as count 
       FROM entities 
       GROUP BY entity_type 
       ORDER BY entity_type`;
  
  const params = projectId ? [projectId] : [];
  const result = await pg.query(query, params);
  
  return result.rows.map(row => ({
    entity_type: row.entity_type,
    count: parseInt(row.count, 10),
  }));
}

/**
 * Get total entity count.
 */
export async function getTotalEntityCount(projectId?: string): Promise<number> {
  const pg = getPool();
  
  const query = projectId
    ? `SELECT COUNT(*)::int as count FROM entities WHERE project_id = $1`
    : `SELECT COUNT(*)::int as count FROM entities`;
  
  const params = projectId ? [projectId] : [];
  const result = await pg.query(query, params);
  
  return parseInt(result.rows[0]?.count || '0', 10);
}

/**
 * Get all entity IDs for a specific type.
 * Used for cross-store verification.
 */
export async function getEntityIds(entityType: string, projectId?: string): Promise<string[]> {
  const pg = getPool();
  
  const query = projectId
    ? `SELECT id FROM entities WHERE entity_type = $1 AND project_id = $2 ORDER BY id`
    : `SELECT id FROM entities WHERE entity_type = $1 ORDER BY id`;
  
  const params = projectId ? [entityType, projectId] : [entityType];
  const result = await pg.query(query, params);
  
  return result.rows.map(row => row.id);
}

/**
 * Get all instance_ids for a specific entity type.
 * Used for cross-store verification (Neo4j uses instance_id as identity).
 */
export async function getInstanceIds(entityType: string, projectId?: string): Promise<string[]> {
  const pg = getPool();
  
  const query = projectId
    ? `SELECT instance_id FROM entities WHERE entity_type = $1 AND project_id = $2 ORDER BY instance_id`
    : `SELECT instance_id FROM entities WHERE entity_type = $1 ORDER BY instance_id`;
  
  const params = projectId ? [entityType, projectId] : [entityType];
  const result = await pg.query(query, params);
  
  return result.rows.map(row => row.instance_id);
}

/**
 * Get all entity instances for a specific type.
 */
export async function getEntityInstances(entityType: string, projectId?: string): Promise<EntityInstance[]> {
  const pg = getPool();
  
  const query = projectId
    ? `SELECT id, entity_type, instance_id 
       FROM entities 
       WHERE entity_type = $1 AND project_id = $2 
       ORDER BY instance_id`
    : `SELECT id, entity_type, instance_id 
       FROM entities 
       WHERE entity_type = $1 
       ORDER BY instance_id`;
  
  const params = projectId ? [entityType, projectId] : [entityType];
  const result = await pg.query(query, params);
  
  return result.rows;
}

/**
 * Get all unique entity types present in the database.
 */
export async function getEntityTypes(projectId?: string): Promise<string[]> {
  const pg = getPool();
  
  const query = projectId
    ? `SELECT DISTINCT entity_type FROM entities WHERE project_id = $1 ORDER BY entity_type`
    : `SELECT DISTINCT entity_type FROM entities ORDER BY entity_type`;
  
  const params = projectId ? [projectId] : [];
  const result = await pg.query(query, params);
  
  return result.rows.map(row => row.entity_type);
}

// -----------------------------------------------------------------------------
// Relationship Queries
// -----------------------------------------------------------------------------

/**
 * Get relationship counts by type.
 * Returns counts for all relationship types found in the database.
 */
export async function getRelationshipCounts(projectId?: string): Promise<RelationshipCount[]> {
  const pg = getPool();
  
  const query = projectId
    ? `SELECT relationship_type, COUNT(*)::int as count 
       FROM relationships 
       WHERE project_id = $1 
       GROUP BY relationship_type 
       ORDER BY relationship_type`
    : `SELECT relationship_type, COUNT(*)::int as count 
       FROM relationships 
       GROUP BY relationship_type 
       ORDER BY relationship_type`;
  
  const params = projectId ? [projectId] : [];
  const result = await pg.query(query, params);
  
  return result.rows.map(row => ({
    relationship_type: row.relationship_type,
    count: parseInt(row.count, 10),
  }));
}

/**
 * Get total relationship count.
 */
export async function getTotalRelationshipCount(projectId?: string): Promise<number> {
  const pg = getPool();
  
  const query = projectId
    ? `SELECT COUNT(*)::int as count FROM relationships WHERE project_id = $1`
    : `SELECT COUNT(*)::int as count FROM relationships`;
  
  const params = projectId ? [projectId] : [];
  const result = await pg.query(query, params);
  
  return parseInt(result.rows[0]?.count || '0', 10);
}

/**
 * Get all relationship IDs for a specific type.
 * Used for cross-store verification.
 */
export async function getRelationshipIds(relationshipType: string, projectId?: string): Promise<string[]> {
  const pg = getPool();
  
  const query = projectId
    ? `SELECT id FROM relationships WHERE relationship_type = $1 AND project_id = $2 ORDER BY id`
    : `SELECT id FROM relationships WHERE relationship_type = $1 ORDER BY id`;
  
  const params = projectId ? [relationshipType, projectId] : [relationshipType];
  const result = await pg.query(query, params);
  
  return result.rows.map(row => row.id);
}

/**
 * Get all relationship instances for a specific type.
 */
export async function getRelationshipInstances(relationshipType: string, projectId?: string): Promise<RelationshipInstance[]> {
  const pg = getPool();
  
  const query = projectId
    ? `SELECT id, relationship_type, instance_id, from_entity_id, to_entity_id 
       FROM relationships 
       WHERE relationship_type = $1 AND project_id = $2 
       ORDER BY instance_id`
    : `SELECT id, relationship_type, instance_id, from_entity_id, to_entity_id 
       FROM relationships 
       WHERE relationship_type = $1 
       ORDER BY instance_id`;
  
  const params = projectId ? [relationshipType, projectId] : [relationshipType];
  const result = await pg.query(query, params);
  
  return result.rows;
}

/**
 * Get all unique relationship types present in the database.
 */
export async function getRelationshipTypes(projectId?: string): Promise<string[]> {
  const pg = getPool();
  
  const query = projectId
    ? `SELECT DISTINCT relationship_type FROM relationships WHERE project_id = $1 ORDER BY relationship_type`
    : `SELECT DISTINCT relationship_type FROM relationships ORDER BY relationship_type`;
  
  const params = projectId ? [projectId] : [];
  const result = await pg.query(query, params);
  
  return result.rows.map(row => row.relationship_type);
}

// -----------------------------------------------------------------------------
// Referential Integrity
// -----------------------------------------------------------------------------

/**
 * Check referential integrity of relationships.
 * Verifies that all from_entity_id and to_entity_id references exist.
 */
export async function checkReferentialIntegrity(projectId?: string): Promise<ReferentialIntegrityResult> {
  const pg = getPool();
  
  // Check for orphan from_entity_id references
  const fromQuery = projectId
    ? `SELECT r.id, r.relationship_type, r.from_entity_id, r.to_entity_id
       FROM relationships r
       LEFT JOIN entities e ON r.from_entity_id = e.id
       WHERE r.project_id = $1 AND e.id IS NULL`
    : `SELECT r.id, r.relationship_type, r.from_entity_id, r.to_entity_id
       FROM relationships r
       LEFT JOIN entities e ON r.from_entity_id = e.id
       WHERE e.id IS NULL`;
  
  const fromParams = projectId ? [projectId] : [];
  const fromResult = await pg.query(fromQuery, fromParams);
  
  // Check for orphan to_entity_id references
  const toQuery = projectId
    ? `SELECT r.id, r.relationship_type, r.from_entity_id, r.to_entity_id
       FROM relationships r
       LEFT JOIN entities e ON r.to_entity_id = e.id
       WHERE r.project_id = $1 AND e.id IS NULL`
    : `SELECT r.id, r.relationship_type, r.from_entity_id, r.to_entity_id
       FROM relationships r
       LEFT JOIN entities e ON r.to_entity_id = e.id
       WHERE e.id IS NULL`;
  
  const toParams = projectId ? [projectId] : [];
  const toResult = await pg.query(toQuery, toParams);
  
  const orphans = [
    ...fromResult.rows.map(row => ({ ...row, issue: 'missing_from' as const })),
    ...toResult.rows.map(row => ({ ...row, issue: 'missing_to' as const })),
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
  const pg = getPool();
  
  const query = projectId
    ? `SELECT entity_type, instance_id FROM entities WHERE project_id = $1 ORDER BY entity_type, instance_id`
    : `SELECT entity_type, instance_id FROM entities ORDER BY entity_type, instance_id`;
  
  const params = projectId ? [projectId] : [];
  const result = await pg.query(query, params);
  
  const byType = new Map<string, Set<string>>();
  
  for (const row of result.rows) {
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
  const pg = getPool();
  
  const query = projectId
    ? `SELECT relationship_type, instance_id FROM relationships WHERE project_id = $1 ORDER BY relationship_type, instance_id`
    : `SELECT relationship_type, instance_id FROM relationships ORDER BY relationship_type, instance_id`;
  
  const params = projectId ? [projectId] : [];
  const result = await pg.query(query, params);
  
  const byType = new Map<string, Set<string>>();
  
  for (const row of result.rows) {
    if (!byType.has(row.relationship_type)) {
      byType.set(row.relationship_type, new Set());
    }
    byType.get(row.relationship_type)!.add(row.instance_id);
  }
  
  return byType;
}
