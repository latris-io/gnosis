import 'dotenv/config';
import { rlsQuery } from '../test/utils/rls.js';
import neo4j from 'neo4j-driver';

const PROJECT_ID = '6df2f456-440d-4958-b475-d9808775ff69';

async function main() {
  console.log('=== 2a) R18/R19/R36/R37 counts from PostgreSQL ===');
  const pgCounts = await rlsQuery<{relationship_type: string; count: string}>(PROJECT_ID, `
    SELECT relationship_type, COUNT(*)::text as count
    FROM relationships
    WHERE relationship_type IN ('R18','R19','R36','R37')
    GROUP BY relationship_type ORDER BY relationship_type
  `);
  console.log('PostgreSQL counts:');
  for (const r of pgCounts) {
    console.log(`  ${r.relationship_type}: ${r.count}`);
  }
  
  console.log('\n=== 2b) R18/R19/R36/R37 counts from Neo4j ===');
  const driver = neo4j.driver(
    process.env.NEO4J_URI!,
    neo4j.auth.basic(process.env.NEO4J_USER!, process.env.NEO4J_PASSWORD!)
  );
  const session = driver.session();
  try {
    const result = await session.run(`
      MATCH ()-[r:RELATIONSHIP {project_id: $projectId}]->()
      WHERE r.relationship_type IN ['R18','R19','R36','R37']
      RETURN r.relationship_type AS type, COUNT(r) AS count
      ORDER BY type
    `, { projectId: PROJECT_ID });
    console.log('Neo4j counts:');
    for (const rec of result.records) {
      console.log(`  ${rec.get('type')}: ${rec.get('count').toNumber()}`);
    }
  } finally {
    await session.close();
    await driver.close();
  }
  
  console.log('\n=== 2c) PARITY CHECK ===');
  const pgMap = new Map(pgCounts.map(r => [r.relationship_type, parseInt(r.count)]));
  
  const session2 = neo4j.driver(
    process.env.NEO4J_URI!,
    neo4j.auth.basic(process.env.NEO4J_USER!, process.env.NEO4J_PASSWORD!)
  ).session();
  const result2 = await session2.run(`
    MATCH ()-[r:RELATIONSHIP {project_id: $projectId}]->()
    WHERE r.relationship_type IN ['R18','R19','R36','R37']
    RETURN r.relationship_type AS type, COUNT(r) AS count
  `, { projectId: PROJECT_ID });
  await session2.close();
  
  const neo4jMap = new Map(result2.records.map(r => [r.get('type'), r.get('count').toNumber()]));
  
  for (const type of ['R18', 'R19', 'R36', 'R37']) {
    const pg = pgMap.get(type) || 0;
    const n4j = neo4jMap.get(type) || 0;
    const match = pg === n4j ? '✓' : '✗';
    console.log(`  ${type}: PG=${pg}, Neo4j=${n4j} ${match}`);
  }
}

main().catch(console.error);
