/**
 * scripts/pristine-gate-neo4j.ts
 * Pristine Gate Neo4j verification - Cross-store parity check
 * 
 * Verifies that Neo4j counts match PostgreSQL (the source of truth).
 * The invariant is PARITY, not specific hardcoded numbers.
 * 
 * Direct DB access required for low-level verification queries.
 * @g-api-exception AUDIT_SCRIPT
 */
import { getSession, closeDriver } from '../src/db/neo4j.js';
import { pool, setProjectContext, getClient } from '../src/db/postgres.js';

const PROJECT_ID = process.env.PROJECT_ID || '6df2f456-440d-4958-b475-d9808775ff69';

interface StoreCounts {
  entities: number;
  relationships: number;
}

async function getPostgresCounts(): Promise<StoreCounts> {
  const client = await getClient();
  try {
    await setProjectContext(client, PROJECT_ID);
    
    const entityResult = await client.query('SELECT COUNT(*)::int as count FROM entities');
    const relResult = await client.query('SELECT COUNT(*)::int as count FROM relationships');
    
    return {
      entities: entityResult.rows[0].count,
      relationships: relResult.rows[0].count,
    };
  } finally {
    client.release();
  }
}

async function getNeo4jCounts(session: ReturnType<typeof getSession>): Promise<StoreCounts> {
  const nodesResult = await session.run(`
    MATCH (e:Entity {project_id: $projectId})
    RETURN count(*) AS total
  `, { projectId: PROJECT_ID });
  
  const edgesResult = await session.run(`
    MATCH (:Entity {project_id: $projectId})-[r:RELATIONSHIP]->(:Entity {project_id: $projectId})
    RETURN count(*) AS total
  `, { projectId: PROJECT_ID });
  
  return {
    entities: nodesResult.records[0]?.get('total')?.toNumber() ?? 0,
    relationships: edgesResult.records[0]?.get('total')?.toNumber() ?? 0,
  };
}

async function main() {
  const session = getSession();
  let allPassed = true;
  
  try {
    // Get counts from both stores
    console.log('=== CROSS-STORE PARITY CHECK ===\n');
    console.log(`Project ID: ${PROJECT_ID}\n`);
    
    const pgCounts = await getPostgresCounts();
    const neo4jCounts = await getNeo4jCounts(session);
    
    console.log('=== 5A) TOTAL COUNTS ===');
    console.log(`PostgreSQL entities:     ${pgCounts.entities}`);
    console.log(`Neo4j nodes:             ${neo4jCounts.entities}`);
    console.log(`PostgreSQL relationships: ${pgCounts.relationships}`);
    console.log(`Neo4j edges:             ${neo4jCounts.relationships}`);
    
    console.log('\n=== 5B) PARITY CHECK ===');
    const entityParity = pgCounts.entities === neo4jCounts.entities;
    const relParity = pgCounts.relationships === neo4jCounts.relationships;
    
    console.log(`Entity parity (PG = Neo4j): ${entityParity ? 'PASS ✓' : 'FAIL ✗'}`);
    console.log(`Relationship parity (PG = Neo4j): ${relParity ? 'PASS ✓' : 'FAIL ✗'}`);
    
    if (!entityParity || !relParity) {
      allPassed = false;
      console.log('\n⚠️  PARITY MISMATCH DETECTED');
      if (!entityParity) {
        console.log(`   Entity delta: ${pgCounts.entities - neo4jCounts.entities}`);
      }
      if (!relParity) {
        console.log(`   Relationship delta: ${pgCounts.relationships - neo4jCounts.relationships}`);
      }
    }
    
    // Entity breakdown by type
    console.log('\n=== 5C) NODES BY TYPE ===');
    const nodesResult = await session.run(`
      MATCH (e:Entity {project_id: $projectId})
      RETURN e.entity_type AS entity_type, count(*) AS n
      ORDER BY entity_type
    `, { projectId: PROJECT_ID });
    nodesResult.records.forEach(r => {
      console.log(`  ${r.get('entity_type')}: ${r.get('n').toNumber()}`);
    });
    
    // Relationship breakdown by type
    console.log('\n=== 5D) EDGES BY TYPE ===');
    const edgesResult = await session.run(`
      MATCH (:Entity {project_id: $projectId})-[r:RELATIONSHIP]->(:Entity {project_id: $projectId})
      RETURN r.relationship_type AS relationship_type, count(*) AS n
      ORDER BY relationship_type
    `, { projectId: PROJECT_ID });
    edgesResult.records.forEach(r => {
      console.log(`  ${r.get('relationship_type')}: ${r.get('n').toNumber()}`);
    });
    
    // Key relationship types check
    console.log('\n=== 5E) KEY RELATIONSHIP TYPES ===');
    const keyTypes = ['R01', 'R02', 'R04', 'R05', 'R06', 'R07', 'R16', 'R18', 'R19', 'R36', 'R37'];
    for (const relType of keyTypes) {
      const result = await session.run(`
        MATCH (:Entity {project_id: $projectId})-[r:RELATIONSHIP {relationship_type: $relType}]->(:Entity {project_id: $projectId})
        RETURN count(*) AS n
      `, { projectId: PROJECT_ID, relType });
      const count = result.records[0]?.get('n')?.toNumber() ?? 0;
      const status = count > 0 ? '✓' : '✗';
      console.log(`  ${relType}: ${count} ${status}`);
      if (count === 0) {
        allPassed = false;
      }
    }
    
    // Final summary
    console.log('\n=== SUMMARY ===');
    if (allPassed) {
      console.log('✅ PRISTINE GATE NEO4J: PASS');
    } else {
      console.log('❌ PRISTINE GATE NEO4J: FAIL');
    }
    
  } finally {
    await session.close();
    await closeDriver();
    await pool.end();
    process.exit(allPassed ? 0 : 1);
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
