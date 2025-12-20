/**
 * Cross-Store Reconciler
 * 
 * Verifies consistency between PostgreSQL and Neo4j.
 * Goes beyond count matching to verify:
 * - ID set equality (same IDs in both stores)
 * - Type consistency (same entity_type for each ID)
 * 
 * @implements STORY-64.1 (Verification infrastructure)
 */

import * as pgReader from '../readers/postgres-reader';
import * as neo4jReader from '../readers/neo4j-reader';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface IdSetMismatch {
  entityType: string;
  onlyInPostgres: string[];
  onlyInNeo4j: string[];
}

export interface TypeMismatch {
  id: string;
  postgresType: string;
  neo4jType: string;
}

export interface CountMismatch {
  entityType: string;
  postgresCount: number;
  neo4jCount: number;
}

export interface CrossStoreResult {
  consistent: boolean;
  
  // Count mismatches (necessary but not sufficient)
  countMismatches: CountMismatch[];
  
  // ID set equality (catches sync gaps even when counts match)
  idSetMismatches: IdSetMismatch[];
  
  // Type consistency (same entity_type for each ID)
  typeMismatches: TypeMismatch[];
  
  // Summary
  summary: {
    totalEntityTypes: number;
    matchingTypes: number;
    totalEntities: {
      postgres: number;
      neo4j: number;
    };
  };
}

// -----------------------------------------------------------------------------
// Cross-Store Verification
// -----------------------------------------------------------------------------

/**
 * Verify cross-store consistency between PostgreSQL and Neo4j.
 * 
 * Three levels of verification:
 * 1. Count matching (quick check)
 * 2. ID set equality (catches sync gaps)
 * 3. Type consistency (catches type mismatches)
 */
export async function verifyCrossStoreConsistency(projectId?: string): Promise<CrossStoreResult> {
  const result: CrossStoreResult = {
    consistent: true,
    countMismatches: [],
    idSetMismatches: [],
    typeMismatches: [],
    summary: {
      totalEntityTypes: 0,
      matchingTypes: 0,
      totalEntities: { postgres: 0, neo4j: 0 },
    },
  };
  
  // Step 1: Get counts from both stores
  const pgCounts = await pgReader.getEntityCounts(projectId);
  const neo4jCounts = await neo4jReader.getNodeCounts(projectId);
  
  const pgCountMap = new Map(pgCounts.map(c => [c.entity_type, c.count]));
  const neo4jCountMap = new Map(neo4jCounts.map(c => [c.entity_type, c.count]));
  
  // Get all entity types from both stores
  const allTypes = new Set([...pgCountMap.keys(), ...neo4jCountMap.keys()]);
  result.summary.totalEntityTypes = allTypes.size;
  
  // Calculate totals
  for (const count of pgCounts) {
    result.summary.totalEntities.postgres += count.count;
  }
  for (const count of neo4jCounts) {
    result.summary.totalEntities.neo4j += count.count;
  }
  
  // Step 2: Check count mismatches
  for (const entityType of allTypes) {
    const pgCount = pgCountMap.get(entityType) || 0;
    const neo4jCount = neo4jCountMap.get(entityType) || 0;
    
    if (pgCount !== neo4jCount) {
      result.countMismatches.push({
        entityType,
        postgresCount: pgCount,
        neo4jCount: neo4jCount,
      });
      result.consistent = false;
    } else {
      result.summary.matchingTypes++;
    }
  }
  
  // Step 3: Check instance_id set equality for each type
  // Note: Neo4j uses instance_id as primary identity (not UUID), per EXIT.md
  for (const entityType of allTypes) {
    const pgInstanceIds = await pgReader.getInstanceIds(entityType, projectId);
    const neo4jInstanceIds = await neo4jReader.getInstanceIds(entityType, projectId);
    
    const pgIdSet = new Set(pgInstanceIds);
    const neo4jIdSet = new Set(neo4jInstanceIds);
    
    const onlyInPostgres = pgInstanceIds.filter(id => !neo4jIdSet.has(id));
    const onlyInNeo4j = neo4jInstanceIds.filter(id => !pgIdSet.has(id));
    
    if (onlyInPostgres.length > 0 || onlyInNeo4j.length > 0) {
      result.idSetMismatches.push({
        entityType,
        onlyInPostgres,
        onlyInNeo4j,
      });
      result.consistent = false;
    }
  }
  
  // Step 4: Check type consistency via instance_id (sample-based for performance)
  // Neo4j doesn't store UUID id, so we verify via instance_id -> entity_type mapping
  const sampleSize = 100; // Limit for performance
  
  for (const entityType of allTypes) {
    const pgInstances = await pgReader.getEntityInstances(entityType, projectId);
    const sampled = pgInstances.slice(0, sampleSize);
    
    if (sampled.length === 0) continue;
    
    // Build expected types map using instance_id
    const expectedTypes = new Map<string, string>();
    for (const instance of sampled) {
      expectedTypes.set(instance.instance_id, instance.entity_type);
    }
    
    // Verify types in Neo4j using instance_id
    const typeCheck = await neo4jReader.verifyNodeTypesByInstanceId(expectedTypes, projectId);
    
    if (!typeCheck.consistent) {
      for (const mismatch of typeCheck.mismatches) {
        result.typeMismatches.push({
          id: mismatch.instance_id,
          postgresType: mismatch.expected_type,
          neo4jType: mismatch.neo4j_type,
        });
      }
      result.consistent = false;
    }
  }
  
  return result;
}

/**
 * Quick count-only verification.
 * Faster than full verification, but less thorough.
 */
export async function verifyCountsOnly(projectId?: string): Promise<{
  consistent: boolean;
  postgres: number;
  neo4j: number;
  mismatches: CountMismatch[];
}> {
  const pgCounts = await pgReader.getEntityCounts(projectId);
  const neo4jCounts = await neo4jReader.getNodeCounts(projectId);
  
  const pgCountMap = new Map(pgCounts.map(c => [c.entity_type, c.count]));
  const neo4jCountMap = new Map(neo4jCounts.map(c => [c.entity_type, c.count]));
  
  const allTypes = new Set([...pgCountMap.keys(), ...neo4jCountMap.keys()]);
  const mismatches: CountMismatch[] = [];
  
  let pgTotal = 0;
  let neo4jTotal = 0;
  
  for (const entityType of allTypes) {
    const pgCount = pgCountMap.get(entityType) || 0;
    const neo4jCount = neo4jCountMap.get(entityType) || 0;
    
    pgTotal += pgCount;
    neo4jTotal += neo4jCount;
    
    if (pgCount !== neo4jCount) {
      mismatches.push({
        entityType,
        postgresCount: pgCount,
        neo4jCount: neo4jCount,
      });
    }
  }
  
  return {
    consistent: mismatches.length === 0,
    postgres: pgTotal,
    neo4j: neo4jTotal,
    mismatches,
  };
}

/**
 * Verify ID set equality for a specific entity type.
 */
export async function verifyIdSetForType(
  entityType: string,
  projectId?: string
): Promise<IdSetMismatch | null> {
  const pgIds = await pgReader.getEntityIds(entityType, projectId);
  const neo4jIds = await neo4jReader.getNodeIds(entityType, projectId);
  
  const pgIdSet = new Set(pgIds);
  const neo4jIdSet = new Set(neo4jIds);
  
  const onlyInPostgres = pgIds.filter(id => !neo4jIdSet.has(id));
  const onlyInNeo4j = neo4jIds.filter(id => !pgIdSet.has(id));
  
  if (onlyInPostgres.length === 0 && onlyInNeo4j.length === 0) {
    return null; // No mismatch
  }
  
  return {
    entityType,
    onlyInPostgres,
    onlyInNeo4j,
  };
}

// -----------------------------------------------------------------------------
// Relationship Cross-Store Verification
// -----------------------------------------------------------------------------

/**
 * Verify relationship counts between stores.
 */
export async function verifyRelationshipCounts(projectId?: string): Promise<{
  consistent: boolean;
  postgres: number;
  neo4j: number;
  mismatches: Array<{
    relationshipType: string;
    postgresCount: number;
    neo4jCount: number;
  }>;
}> {
  const pgCounts = await pgReader.getRelationshipCounts(projectId);
  const neo4jCounts = await neo4jReader.getRelationshipCounts(projectId);
  
  const pgCountMap = new Map(pgCounts.map(c => [c.relationship_type, c.count]));
  const neo4jCountMap = new Map(neo4jCounts.map(c => [c.relationship_type, c.count]));
  
  const allTypes = new Set([...pgCountMap.keys(), ...neo4jCountMap.keys()]);
  const mismatches: Array<{
    relationshipType: string;
    postgresCount: number;
    neo4jCount: number;
  }> = [];
  
  let pgTotal = 0;
  let neo4jTotal = 0;
  
  for (const relType of allTypes) {
    const pgCount = pgCountMap.get(relType) || 0;
    const neo4jCount = neo4jCountMap.get(relType) || 0;
    
    pgTotal += pgCount;
    neo4jTotal += neo4jCount;
    
    if (pgCount !== neo4jCount) {
      mismatches.push({
        relationshipType: relType,
        postgresCount: pgCount,
        neo4jCount: neo4jCount,
      });
    }
  }
  
  return {
    consistent: mismatches.length === 0,
    postgres: pgTotal,
    neo4j: neo4jTotal,
    mismatches,
  };
}

// -----------------------------------------------------------------------------
// CLI Entry Point
// -----------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('=== Cross-Store Reconciler ===\n');
  
  const projectId = process.env.PROJECT_ID;
  
  console.log('Verifying cross-store consistency...\n');
  
  const result = await verifyCrossStoreConsistency(projectId);
  
  console.log('Summary:');
  console.log(`  Entity types: ${result.summary.totalEntityTypes}`);
  console.log(`  Matching types: ${result.summary.matchingTypes}`);
  console.log(`  PostgreSQL entities: ${result.summary.totalEntities.postgres}`);
  console.log(`  Neo4j entities: ${result.summary.totalEntities.neo4j}`);
  console.log();
  
  if (result.countMismatches.length > 0) {
    console.error('❌ Count mismatches:');
    for (const m of result.countMismatches) {
      console.error(`   ${m.entityType}: PG=${m.postgresCount}, Neo4j=${m.neo4jCount}`);
    }
    console.log();
  }
  
  if (result.idSetMismatches.length > 0) {
    console.error('❌ ID set mismatches:');
    for (const m of result.idSetMismatches) {
      console.error(`   ${m.entityType}:`);
      if (m.onlyInPostgres.length > 0) {
        console.error(`     Only in PostgreSQL: ${m.onlyInPostgres.length} IDs`);
      }
      if (m.onlyInNeo4j.length > 0) {
        console.error(`     Only in Neo4j: ${m.onlyInNeo4j.length} IDs`);
      }
    }
    console.log();
  }
  
  if (result.typeMismatches.length > 0) {
    console.error('❌ Type mismatches:');
    for (const m of result.typeMismatches) {
      console.error(`   ${m.id}: PG=${m.postgresType}, Neo4j=${m.neo4jType}`);
    }
    console.log();
  }
  
  if (result.consistent) {
    console.log('✅ Cross-store verification PASSED');
    process.exit(0);
  } else {
    console.error('❌ Cross-store verification FAILED');
    process.exit(1);
  }
}

// Run if executed directly (ES module compatible)
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  main()
    .catch(err => {
      console.error('Cross-store reconciler error:', err);
      process.exit(1);
    })
    .finally(async () => {
      await pgReader.closePool();
      await neo4jReader.closeDriver();
    });
}
