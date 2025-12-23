// @ts-nocheck
// Script to perform replace-by-project relationship sync and verify parity
// Usage: PROJECT_ID=<uuid> npx tsx scripts/sync-relationships-replace.ts
// Or:    PROJECT_SLUG=<slug> npx tsx scripts/sync-relationships-replace.ts

import 'dotenv/config';
import {
  initProject,
  replaceAllRelationshipsInNeo4j,
  verifyNeo4jParity,
  closeConnections,
} from '../src/ops/track-a.js';

async function main() {
  try {
    // Get project ID from environment
    const { id: projectId } = await initProject({
      projectId: process.env.PROJECT_ID,
      projectSlug: process.env.PROJECT_SLUG || 'gnosis-default',
    });
    console.log(`Project ID: ${projectId}\n`);

    // Step 1: Show current state
    console.log('=== BEFORE SYNC ===\n');
    const beforeParity = await verifyNeo4jParity(projectId);
    console.log('Postgres:');
    console.log(`  Total: ${beforeParity.postgres.total}`);
    for (const [type, count] of Object.entries(beforeParity.postgres.byType).sort()) {
      console.log(`  ${type}: ${count}`);
    }
    console.log('\nNeo4j:');
    console.log(`  Total: ${beforeParity.neo4j.total}`);
    for (const [type, count] of Object.entries(beforeParity.neo4j.byType).sort()) {
      console.log(`  ${type}: ${count}`);
    }
    console.log(`\nConsistent: ${beforeParity.consistent}`);
    if (beforeParity.mismatches.length > 0) {
      console.log('Mismatches:');
      for (const m of beforeParity.mismatches) {
        console.log(`  ${m.type}: PG=${m.pg}, Neo4j=${m.neo4j}`);
      }
    }

    // Step 2: Run replace sync
    console.log('\n=== RUNNING REPLACE SYNC ===\n');
    const syncResult = await replaceAllRelationshipsInNeo4j(projectId);
    console.log(`Deleted from Neo4j: ${(syncResult as any).deleted ?? 'N/A'}`);
    console.log(`Synced from Postgres: ${syncResult.synced}`);
    console.log(`Skipped (missing endpoints): ${(syncResult as any).skipped ?? 'N/A'}`);

    // Step 3: Verify parity after sync
    console.log('\n=== AFTER SYNC ===\n');
    const afterParity = await verifyNeo4jParity(projectId);
    console.log('Postgres:');
    console.log(`  Total: ${afterParity.postgres.total}`);
    for (const [type, count] of Object.entries(afterParity.postgres.byType).sort()) {
      console.log(`  ${type}: ${count}`);
    }
    console.log('\nNeo4j:');
    console.log(`  Total: ${afterParity.neo4j.total}`);
    for (const [type, count] of Object.entries(afterParity.neo4j.byType).sort()) {
      console.log(`  ${type}: ${count}`);
    }
    console.log(`\nConsistent: ${afterParity.consistent}`);
    if (afterParity.mismatches.length > 0) {
      console.log('Mismatches:');
      for (const m of afterParity.mismatches) {
        console.log(`  ${m.type}: PG=${m.pg}, Neo4j=${m.neo4j}`);
      }
    }

    // Step 4: Summary
    console.log('\n=== PARITY CHECK SUMMARY ===\n');
    console.log(`R63 in Neo4j: ${afterParity.neo4j.byType['R63'] || 0} (expected: 29)`);
    console.log(`R16 in Neo4j: ${afterParity.neo4j.byType['R16'] || 0} (expected: 145)`);
    console.log(`Total PG: ${afterParity.postgres.total}`);
    console.log(`Total Neo4j: ${afterParity.neo4j.total}`);
    console.log(`Parity: ${afterParity.consistent ? 'PASS' : 'FAIL'}`);

  } finally {
    await closeConnections();
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
