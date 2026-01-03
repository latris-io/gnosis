/**
 * Neo4j Reader (Read-Only)
 * 
 * Provides read-only access to Neo4j for verification purposes.
 * 
 * CRITICAL: This is a VERIFICATION reader - it must NOT:
 * - Import from ingestion/extraction logic
 * - Modify any data
 * - Use the same query patterns as sync services
 * 
 * @implements STORY-64.1 (Verification infrastructure)
 */

import 'dotenv/config';
import neo4j, { Driver, Session } from 'neo4j-driver';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface NodeCount {
  entity_type: string;
  count: number;
}

export interface RelationshipCount {
  relationship_type: string;
  count: number;
}

export interface NodeInstance {
  id: string;
  entity_type: string;
  instance_id: string;
}

export interface RelInstance {
  id: string;
  relationship_type: string;
  from_id: string;
  to_id: string;
}

export interface TypeConsistencyResult {
  consistent: boolean;
  mismatches: Array<{
    id: string;
    neo4j_type: string;
    expected_type: string;
  }>;
}

// -----------------------------------------------------------------------------
// Neo4j Connection
// -----------------------------------------------------------------------------

let driver: Driver | null = null;

function getDriver(): Driver {
  if (!driver) {
    const url = process.env.NEO4J_URL || 'bolt://localhost:7687';
    const user = process.env.NEO4J_USER || 'neo4j';
    const password = process.env.NEO4J_PASSWORD || 'password';
    
    driver = neo4j.driver(url, neo4j.auth.basic(user, password));
  }
  return driver;
}

function getSession(): Session {
  return getDriver().session();
}

export async function closeDriver(): Promise<void> {
  if (driver) {
    await driver.close();
    driver = null;
  }
}

// -----------------------------------------------------------------------------
// Entity/Node Queries
// -----------------------------------------------------------------------------

/**
 * Get node counts by entity_type label.
 * Returns counts for all entity types found in the database.
 */
export async function getNodeCounts(projectId?: string): Promise<NodeCount[]> {
  const session = getSession();
  
  try {
    const query = projectId
      ? `MATCH (n:Entity {project_id: $projectId})
         RETURN n.entity_type AS entity_type, COUNT(n) AS count
         ORDER BY entity_type`
      : `MATCH (n:Entity)
         RETURN n.entity_type AS entity_type, COUNT(n) AS count
         ORDER BY entity_type`;
    
    const params = projectId ? { projectId } : {};
    const result = await session.run(query, params);
    
    return result.records.map(record => ({
      entity_type: record.get('entity_type'),
      count: record.get('count').toNumber(),
    }));
  } finally {
    await session.close();
  }
}

/**
 * Get total node count.
 */
export async function getTotalNodeCount(projectId?: string): Promise<number> {
  const session = getSession();
  
  try {
    const query = projectId
      ? `MATCH (n:Entity {project_id: $projectId}) RETURN COUNT(n) AS count`
      : `MATCH (n:Entity) RETURN COUNT(n) AS count`;
    
    const params = projectId ? { projectId } : {};
    const result = await session.run(query, params);
    
    return result.records[0]?.get('count').toNumber() || 0;
  } finally {
    await session.close();
  }
}

/**
 * Get all node IDs for a specific entity type.
 * Used for cross-store verification.
 */
export async function getNodeIds(entityType: string, projectId?: string): Promise<string[]> {
  const session = getSession();
  
  try {
    const query = projectId
      ? `MATCH (n:Entity {entity_type: $entityType, project_id: $projectId})
         RETURN n.id AS id
         ORDER BY id`
      : `MATCH (n:Entity {entity_type: $entityType})
         RETURN n.id AS id
         ORDER BY id`;
    
    const params = projectId ? { entityType, projectId } : { entityType };
    const result = await session.run(query, params);
    
    return result.records.map(record => record.get('id'));
  } finally {
    await session.close();
  }
}

/**
 * Get all instance_ids for a specific entity type.
 * Used for cross-store verification (Neo4j identity = instance_id).
 */
export async function getInstanceIds(entityType: string, projectId?: string): Promise<string[]> {
  const session = getSession();
  
  try {
    const query = projectId
      ? `MATCH (n:Entity {entity_type: $entityType, project_id: $projectId})
         RETURN n.instance_id AS instance_id
         ORDER BY instance_id`
      : `MATCH (n:Entity {entity_type: $entityType})
         RETURN n.instance_id AS instance_id
         ORDER BY instance_id`;
    
    const params = projectId ? { entityType, projectId } : { entityType };
    const result = await session.run(query, params);
    
    return result.records.map(record => record.get('instance_id'));
  } finally {
    await session.close();
  }
}

/**
 * Get all node instances for a specific entity type.
 */
export async function getNodeInstances(entityType: string, projectId?: string): Promise<NodeInstance[]> {
  const session = getSession();
  
  try {
    const query = projectId
      ? `MATCH (n:Entity {entity_type: $entityType, project_id: $projectId})
         RETURN n.id AS id, n.entity_type AS entity_type, n.instance_id AS instance_id
         ORDER BY instance_id`
      : `MATCH (n:Entity {entity_type: $entityType})
         RETURN n.id AS id, n.entity_type AS entity_type, n.instance_id AS instance_id
         ORDER BY instance_id`;
    
    const params = projectId ? { entityType, projectId } : { entityType };
    const result = await session.run(query, params);
    
    return result.records.map(record => ({
      id: record.get('id'),
      entity_type: record.get('entity_type'),
      instance_id: record.get('instance_id'),
    }));
  } finally {
    await session.close();
  }
}

/**
 * Get all unique entity types present in Neo4j.
 */
export async function getNodeTypes(projectId?: string): Promise<string[]> {
  const session = getSession();
  
  try {
    const query = projectId
      ? `MATCH (n:Entity {project_id: $projectId})
         RETURN DISTINCT n.entity_type AS entity_type
         ORDER BY entity_type`
      : `MATCH (n:Entity)
         RETURN DISTINCT n.entity_type AS entity_type
         ORDER BY entity_type`;
    
    const params = projectId ? { projectId } : {};
    const result = await session.run(query, params);
    
    return result.records.map(record => record.get('entity_type'));
  } finally {
    await session.close();
  }
}

// -----------------------------------------------------------------------------
// Relationship Queries
// -----------------------------------------------------------------------------

/**
 * Get relationship counts by type.
 * Returns counts for all relationship types found in the database.
 */
export async function getRelationshipCounts(projectId?: string): Promise<RelationshipCount[]> {
  const session = getSession();
  
  try {
    const query = projectId
      ? `MATCH (a:Entity {project_id: $projectId})-[r]->(b:Entity)
         RETURN type(r) AS relationship_type, COUNT(r) AS count
         ORDER BY relationship_type`
      : `MATCH (a:Entity)-[r]->(b:Entity)
         RETURN type(r) AS relationship_type, COUNT(r) AS count
         ORDER BY relationship_type`;
    
    const params = projectId ? { projectId } : {};
    const result = await session.run(query, params);
    
    return result.records.map(record => ({
      relationship_type: record.get('relationship_type'),
      count: record.get('count').toNumber(),
    }));
  } finally {
    await session.close();
  }
}

/**
 * Get total relationship count.
 */
export async function getTotalRelationshipCount(projectId?: string): Promise<number> {
  const session = getSession();
  
  try {
    const query = projectId
      ? `MATCH (a:Entity {project_id: $projectId})-[r]->(b:Entity)
         RETURN COUNT(r) AS count`
      : `MATCH (a:Entity)-[r]->(b:Entity)
         RETURN COUNT(r) AS count`;
    
    const params = projectId ? { projectId } : {};
    const result = await session.run(query, params);
    
    return result.records[0]?.get('count').toNumber() || 0;
  } finally {
    await session.close();
  }
}

/**
 * Get all unique relationship types present in Neo4j.
 */
export async function getRelationshipTypes(projectId?: string): Promise<string[]> {
  const session = getSession();
  
  try {
    const query = projectId
      ? `MATCH (a:Entity {project_id: $projectId})-[r]->(b:Entity)
         RETURN DISTINCT type(r) AS relationship_type
         ORDER BY relationship_type`
      : `MATCH (a:Entity)-[r]->(b:Entity)
         RETURN DISTINCT type(r) AS relationship_type
         ORDER BY relationship_type`;
    
    const params = projectId ? { projectId } : {};
    const result = await session.run(query, params);
    
    return result.records.map(record => record.get('relationship_type'));
  } finally {
    await session.close();
  }
}

// -----------------------------------------------------------------------------
// Type Verification
// -----------------------------------------------------------------------------

/**
 * Verify that all nodes have the expected entity_type.
 * Used to detect type mismatches between stores.
 * 
 * @param expectedTypes Map of id -> expected entity_type (from PostgreSQL)
 */
export async function verifyNodeTypes(
  expectedTypes: Map<string, string>,
  projectId?: string
): Promise<TypeConsistencyResult> {
  const session = getSession();
  
  try {
    const ids = Array.from(expectedTypes.keys());
    
    const query = projectId
      ? `MATCH (n:Entity {project_id: $projectId})
         WHERE n.id IN $ids
         RETURN n.id AS id, n.entity_type AS entity_type`
      : `MATCH (n:Entity)
         WHERE n.id IN $ids
         RETURN n.id AS id, n.entity_type AS entity_type`;
    
    const params = projectId ? { projectId, ids } : { ids };
    const result = await session.run(query, params);
    
    const mismatches: Array<{ id: string; neo4j_type: string; expected_type: string }> = [];
    
    for (const record of result.records) {
      const id = record.get('id');
      const neo4jType = record.get('entity_type');
      const expectedType = expectedTypes.get(id);
      
      if (expectedType && neo4jType !== expectedType) {
        mismatches.push({
          id,
          neo4j_type: neo4jType,
          expected_type: expectedType,
        });
      }
    }
    
    return {
      consistent: mismatches.length === 0,
      mismatches,
    };
  } finally {
    await session.close();
  }
}

export interface TypeConsistencyByInstanceIdResult {
  consistent: boolean;
  mismatches: Array<{
    instance_id: string;
    neo4j_type: string;
    expected_type: string;
  }>;
}

/**
 * Verify that all nodes have the expected entity_type by instance_id.
 * Used for cross-store verification (Neo4j identity = instance_id).
 * 
 * @param expectedTypes Map of instance_id -> expected entity_type (from PostgreSQL)
 */
export async function verifyNodeTypesByInstanceId(
  expectedTypes: Map<string, string>,
  projectId?: string
): Promise<TypeConsistencyByInstanceIdResult> {
  const session = getSession();
  
  try {
    const instanceIds = Array.from(expectedTypes.keys());
    
    const query = projectId
      ? `MATCH (n:Entity {project_id: $projectId})
         WHERE n.instance_id IN $instanceIds
         RETURN n.instance_id AS instance_id, n.entity_type AS entity_type`
      : `MATCH (n:Entity)
         WHERE n.instance_id IN $instanceIds
         RETURN n.instance_id AS instance_id, n.entity_type AS entity_type`;
    
    const params = projectId ? { projectId, instanceIds } : { instanceIds };
    const result = await session.run(query, params);
    
    const mismatches: Array<{ instance_id: string; neo4j_type: string; expected_type: string }> = [];
    
    for (const record of result.records) {
      const instanceId = record.get('instance_id');
      const neo4jType = record.get('entity_type');
      const expectedType = expectedTypes.get(instanceId);
      
      if (expectedType && neo4jType !== expectedType) {
        mismatches.push({
          instance_id: instanceId,
          neo4j_type: neo4jType,
          expected_type: expectedType,
        });
      }
    }
    
    return {
      consistent: mismatches.length === 0,
      mismatches,
    };
  } finally {
    await session.close();
  }
}

// -----------------------------------------------------------------------------
// Instance ID Verification
// -----------------------------------------------------------------------------

/**
 * Get all instance IDs for nodes, grouped by entity type.
 */
export async function getAllNodeInstanceIds(projectId?: string): Promise<Map<string, Set<string>>> {
  const session = getSession();
  
  try {
    const query = projectId
      ? `MATCH (n:Entity {project_id: $projectId})
         RETURN n.entity_type AS entity_type, n.instance_id AS instance_id
         ORDER BY entity_type, instance_id`
      : `MATCH (n:Entity)
         RETURN n.entity_type AS entity_type, n.instance_id AS instance_id
         ORDER BY entity_type, instance_id`;
    
    const params = projectId ? { projectId } : {};
    const result = await session.run(query, params);
    
    const byType = new Map<string, Set<string>>();
    
    for (const record of result.records) {
      const entityType = record.get('entity_type');
      const instanceId = record.get('instance_id');
      
      if (!byType.has(entityType)) {
        byType.set(entityType, new Set());
      }
      byType.get(entityType)!.add(instanceId);
    }
    
    return byType;
  } finally {
    await session.close();
  }
}

/**
 * Get all IDs for nodes, grouped by entity type.
 */
export async function getAllNodeIds(projectId?: string): Promise<Map<string, Set<string>>> {
  const session = getSession();
  
  try {
    const query = projectId
      ? `MATCH (n:Entity {project_id: $projectId})
         RETURN n.entity_type AS entity_type, n.id AS id
         ORDER BY entity_type, id`
      : `MATCH (n:Entity)
         RETURN n.entity_type AS entity_type, n.id AS id
         ORDER BY entity_type, id`;
    
    const params = projectId ? { projectId } : {};
    const result = await session.run(query, params);
    
    const byType = new Map<string, Set<string>>();
    
    for (const record of result.records) {
      const entityType = record.get('entity_type');
      const id = record.get('id');
      
      if (!byType.has(entityType)) {
        byType.set(entityType, new Set());
      }
      byType.get(entityType)!.add(id);
    }
    
    return byType;
  } finally {
    await session.close();
  }
}

