#!/usr/bin/env npx tsx
// scripts/sync-relationships-to-neo4j.ts
// One-off script to sync all relationships to Neo4j

import 'dotenv/config';
import { replaceRelationshipsInNeo4j } from '../src/services/sync/sync-service.js';
import { pool } from '../src/db/postgres.js';

async function main() {
  const projectId = process.env.PROJECT_ID;
  if (!projectId) {
    throw new Error('PROJECT_ID required');
  }

  console.log('=== SYNC RELATIONSHIPS TO NEO4J ===');
  console.log('Project:', projectId);

  // SET doesn't support parameterized queries - must use string interpolation
  await pool.query(`SET app.project_id = '${projectId}'`);
  
  const { rows } = await pool.query(
    'SELECT * FROM relationships WHERE project_id = $1',
    [projectId]
  );
  
  console.log('Syncing', rows.length, 'relationships to Neo4j...');
  const result = await replaceRelationshipsInNeo4j(projectId, rows);
  console.log('Synced:', result.synced, 'Skipped:', result.skipped);
  
  await pool.end();
  console.log('Done.');
}

main().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});

