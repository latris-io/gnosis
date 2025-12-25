// scripts/check-r18-r19-parity.ts
// Check R18/R19 parity between PostgreSQL and Neo4j

import { rlsQuery } from '../test/utils/rls.js';
import neo4j from 'neo4j-driver';

async function main() {
  const projectId = process.env.PROJECT_ID || '6df2f456-440d-4958-b475-d9808775ff69';
  
  // Get R18/R19 counts from PostgreSQL
  const pgR18 = await rlsQuery<{ c: number }>(projectId, 
    "SELECT COUNT(*)::int as c FROM relationships WHERE relationship_type='R18'"
  );
  const pgR19 = await rlsQuery<{ c: number }>(projectId, 
    "SELECT COUNT(*)::int as c FROM relationships WHERE relationship_type='R19'"
  );

  console.log('PostgreSQL R18:', pgR18[0].c);
  console.log('PostgreSQL R19:', pgR19[0].c);

  // Connect to Neo4j
  const driver = neo4j.driver(
    process.env.NEO4J_URL || 'bolt://localhost:7687',
    neo4j.auth.basic(process.env.NEO4J_USER || 'neo4j', process.env.NEO4J_PASSWORD || 'password')
  );
  const session = driver.session();

  try {
    // Get R18/R19 counts from Neo4j
    const neo4jR18 = await session.run(
      "MATCH ()-[r:RELATIONSHIP {project_id: $projectId, relationship_type: 'R18'}]->() RETURN count(r) as c",
      { projectId }
    );
    const neo4jR19 = await session.run(
      "MATCH ()-[r:RELATIONSHIP {project_id: $projectId, relationship_type: 'R19'}]->() RETURN count(r) as c",
      { projectId }
    );

    const neo18 = neo4jR18.records[0].get('c').toNumber();
    const neo19 = neo4jR19.records[0].get('c').toNumber();
    
    console.log('Neo4j R18:', neo18);
    console.log('Neo4j R19:', neo19);

    // Parity check
    const pg18 = pgR18[0].c;
    const pg19 = pgR19[0].c;

    console.log('');
    console.log('=== PARITY CHECK ===');
    console.log(`R18: PG=${pg18}, Neo4j=${neo18} => ${pg18 === neo18 ? 'MATCH ✓' : 'MISMATCH ✗'}`);
    console.log(`R19: PG=${pg19}, Neo4j=${neo19} => ${pg19 === neo19 ? 'MATCH ✓' : 'MISMATCH ✗'}`);
  } finally {
    await session.close();
    await driver.close();
  }
}

main().catch(console.error);

