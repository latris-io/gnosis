#!/usr/bin/env npx tsx
// scripts/sync-relationships-to-neo4j.ts
// One-off script to sync all relationships to Neo4j

import 'dotenv/config';
import { replaceRelationshipsInNeo4j } from '../src/services/sync/sync-service.js';

async function main() {
  const projectId = process.env.PROJECT_ID;
  if (!projectId) {
    throw new Error('PROJECT_ID required');
  }

  console.log('=== SYNC RELATIONSHIPS TO NEO4J ===');
  console.log('Project:', projectId);

  // replaceRelationshipsInNeo4j handles RLS context internally using setProjectContext()
  const result = await replaceRelationshipsInNeo4j(projectId);
  console.log('Deleted:', result.deleted, 'Synced:', result.synced, 'Skipped:', result.skipped);
  
  console.log('Done.');
}

main().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});

