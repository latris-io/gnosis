/**
 * A4 Cross-Store Parity Proof
 * @g-api-exception Direct DB access required for verification evidence output.
 */
import 'dotenv/config';
import { pool } from '../src/db/postgres.js';
import { getSession, closeDriver } from '../src/db/neo4j.js';

const PROJECT_ID = '6df2f456-440d-4958-b475-d9808775ff69';
const TIMEOUT_MS = 60000; // 60 second timeout

async function main() {
  // Set a hard timeout to prevent hangs
  const timeout = setTimeout(() => {
    console.error('TIMEOUT: Script exceeded 60 seconds');
    process.exit(1);
  }, TIMEOUT_MS);

  let client;
  let session;
  
  try {
    console.log('=== Cross-Store Parity Proof ===');
    console.log('Project ID:', PROJECT_ID);
    console.log('');

    client = await pool.connect();
    await client.query('SELECT set_project_id($1)', [PROJECT_ID]);

    console.log('[POSTGRESQL - Entity Counts]');
    const pgEntities = await client.query(
      `SELECT entity_type, COUNT(*)::int as count FROM entities WHERE project_id = $1 GROUP BY entity_type ORDER BY entity_type`,
      [PROJECT_ID]
    );
    let pgTotal = 0;
    for (const row of pgEntities.rows) {
      console.log(`  ${row.entity_type}: ${row.count}`);
      pgTotal += row.count;
    }
    console.log(`  TOTAL: ${pgTotal}`);
    console.log('');

    console.log('[POSTGRESQL - Relationship Counts]');
    const pgRels = await client.query(
      `SELECT relationship_type, COUNT(*)::int as count FROM relationships WHERE project_id = $1 GROUP BY relationship_type ORDER BY relationship_type`,
      [PROJECT_ID]
    );
    let pgRelTotal = 0;
    for (const row of pgRels.rows) {
      console.log(`  ${row.relationship_type}: ${row.count}`);
      pgRelTotal += row.count;
    }
    console.log(`  TOTAL: ${pgRelTotal}`);
    console.log('');
    client.release();
    client = undefined;

    session = getSession();
    console.log('[NEO4J - Entity Counts]');
    const neo4jEntities = await session.run(
      'MATCH (n:Entity {project_id: $projectId}) RETURN n.entity_type as type, count(n) as count ORDER BY type',
      { projectId: PROJECT_ID }
    );
    let neo4jTotal = 0;
    for (const record of neo4jEntities.records) {
      const count = record.get('count').toNumber();
      console.log(`  ${record.get('type')}: ${count}`);
      neo4jTotal += count;
    }
    console.log(`  TOTAL: ${neo4jTotal}`);
    console.log('');

    console.log('[NEO4J - Relationship Counts]');
    const neo4jRels = await session.run(
      'MATCH (:Entity {project_id: $projectId})-[r:RELATIONSHIP]->(:Entity {project_id: $projectId}) RETURN r.relationship_type as type, count(r) as count ORDER BY type',
      { projectId: PROJECT_ID }
    );
    let neo4jRelTotal = 0;
    for (const record of neo4jRels.records) {
      const count = record.get('count').toNumber();
      console.log(`  ${record.get('type')}: ${count}`);
      neo4jRelTotal += count;
    }
    console.log(`  TOTAL: ${neo4jRelTotal}`);
    console.log('');

    await session.close();
    session = undefined;

    console.log('[PARITY CHECK]');
    console.log(`  Entities: PG=${pgTotal}, Neo4j=${neo4jTotal} → ${pgTotal === neo4jTotal ? 'MATCH' : 'MISMATCH'}`);
    console.log(`  Relationships: PG=${pgRelTotal}, Neo4j=${neo4jRelTotal} → ${pgRelTotal === neo4jRelTotal ? 'MATCH' : 'MISMATCH'}`);

  } finally {
    clearTimeout(timeout);
    if (client) client.release();
    if (session) await session.close();
    await pool.end();
    await closeDriver();
  }
}

main().catch(e => { console.error(e); process.exit(1); });

