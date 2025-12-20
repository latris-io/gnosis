// @ts-nocheck
// Script to perform replace-by-project relationship sync and verify parity
// Usage: npx tsx scripts/sync-relationships-replace.ts

import 'dotenv/config';
import { replaceRelationshipsInNeo4j, verifyRelationshipParity } from '../src/services/sync/sync-service.js';
import { pool } from '../src/db/postgres.js';
import { driver } from '../src/db/neo4j.js';

async function main() {
  try {
    // Get project ID
    const projectResult = await pool.query(`
      SELECT id FROM projects LIMIT 1
    `);
    
    if (projectResult.rows.length === 0) {
      console.error('No project found');
      process.exit(1);
    }
    
    const projectId = projectResult.rows[0].id;
    console.log(`Project ID: ${projectId}\n`);

    // Step 1: Show current state
    console.log('=== BEFORE SYNC ===\n');
    const beforeParity = await verifyRelationshipParity(projectId);
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
    const syncResult = await replaceRelationshipsInNeo4j(projectId);
    console.log(`Deleted from Neo4j: ${syncResult.deleted}`);
    console.log(`Synced from Postgres: ${syncResult.synced}`);
    console.log(`Skipped (missing endpoints): ${syncResult.skipped}`);

    // Step 3: Verify parity after sync
    console.log('\n=== AFTER SYNC ===\n');
    const afterParity = await verifyRelationshipParity(projectId);
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
    await pool.end();
    await driver.close();
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
