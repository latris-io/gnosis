#!/usr/bin/env npx tsx
// scripts/extract-test-relationships.ts
// Run R36/R37 extraction from test structure

import { extractAndPersistTestRelationships, closeConnections } from '../src/ops/track-a.js';
import 'dotenv/config';

async function main() {
  const projectId = process.env.PROJECT_ID;
  if (!projectId) {
    throw new Error('PROJECT_ID environment variable is required');
  }

  console.log(`Extracting R36/R37 test relationships for project: ${projectId}`);
  
  try {
    const result = await extractAndPersistTestRelationships(projectId);
    console.log('\nR36/R37 Extraction Result:');
    console.log(`  R36 created: ${result.r36_created}`);
    console.log(`  R37 created: ${result.r37_created}`);
    console.log(`  R36 updated: ${result.r36_updated}`);
    console.log(`  R37 updated: ${result.r37_updated}`);
    console.log(`\n✓ Test relationship extraction complete`);
  } finally {
    await closeConnections();
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

