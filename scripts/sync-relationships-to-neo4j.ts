#!/usr/bin/env npx tsx
// scripts/sync-relationships-to-neo4j.ts
// One-off script to sync all relationships to Neo4j

import 'dotenv/config';
import { serviceReplaceRelationships } from '../src/ops/track-a.js';

async function main() {
  const projectId = process.env.PROJECT_ID;
  if (!projectId) {
    throw new Error('PROJECT_ID required');
  }

  console.log('=== SYNC RELATIONSHIPS TO NEO4J ===');
  console.log('Project:', projectId);

  // Uses ops layer (G-API compliant) - handles RLS context internally
  const result = await serviceReplaceRelationships(projectId);
  console.log('Deleted:', result.deleted, 'Synced:', result.synced, 'Skipped:', result.skipped);
  
  console.log('Done.');
}

main().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});

