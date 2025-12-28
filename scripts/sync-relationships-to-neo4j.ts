#!/usr/bin/env npx tsx
// scripts/sync-relationships-to-neo4j.ts
// One-off script to sync all relationships to Neo4j

import 'dotenv/config';
import { replaceAllRelationshipsInNeo4j, syncToNeo4j, closeConnections } from '../src/ops/track-a.js';

async function main() {
  const projectId = process.env.PROJECT_ID;
  if (!projectId) {
    throw new Error('PROJECT_ID required');
  }

  console.log('=== SYNC TO NEO4J ===');
  console.log('Project:', projectId);

  // First sync entities
  console.log('Syncing entities...');
  const entityResult = await syncToNeo4j(projectId);
  console.log('Entities synced:', entityResult.synced);

  // Then sync relationships
  console.log('Syncing relationships...');
  const relResult = await replaceAllRelationshipsInNeo4j(projectId);
  console.log('Deleted:', relResult.deleted, 'Synced:', relResult.synced, 'Skipped:', relResult.skipped);
  
  await closeConnections();
  console.log('Done.');
}

main().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});

