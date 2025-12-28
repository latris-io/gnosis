// @ts-nocheck
// LEGACY_SCAN_OK: This script audits/validates legacy ledger or corpus files
// Extract remaining relationships (R03 and onwards)
import 'dotenv/config';
import * as fs from 'fs';
import pg from 'pg';

import {
  extractAndPersistContainmentRelationships,
  extractAndPersistTddRelationships,
  extractAndPersistGitRelationships,
  replaceAllRelationshipsInNeo4j,
} from '../../src/ops/track-a.js';

const { Pool } = pg;

async function main() {
  const projectId = '6df2f456-440d-4958-b475-d9808775ff69';
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL, 
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false } 
  });
  
  console.log('Extracting remaining relationships...\n');
  
  // Containment (R04, R05, R06, R07, R16)
  console.log('Containment (R04, R05, R06, R07, R16)...');
  try {
    const contain = await extractAndPersistContainmentRelationships(projectId);
    console.log('  R04:', contain.r04.persisted);
    console.log('  R05:', contain.r05.persisted);
    console.log('  R06:', contain.r06.persisted);
    console.log('  R07:', contain.r07.persisted);
    console.log('  R16:', contain.r16.persisted);
  } catch (e: any) {
    console.log('  Error:', e.message);
  }
  
  // TDD (R08, R09, R11, R14)
  console.log('\nTDD (R08, R09, R11, R14)...');
  try {
    const tdd = await extractAndPersistTddRelationships(projectId);
    console.log('  Persisted:', tdd.persisted);
  } catch (e: any) {
    console.log('  Error:', e.message);
  }
  
  // Git (R63, R67, R70)
  console.log('\nGit (R63, R67, R70)...');
  try {
    const git = await extractAndPersistGitRelationships(projectId);
    console.log('  R63:', git.r63.persisted);
    console.log('  R67:', git.r67.persisted);
    console.log('  R70:', git.r70.persisted);
  } catch (e: any) {
    console.log('  Error:', e.message);
  }
  
  // Neo4j rebuild
  console.log('\nNeo4j rebuild...');
  try {
    const neo = await replaceAllRelationshipsInNeo4j(projectId);
    console.log('  Synced:', neo.synced);
  } catch (e: any) {
    console.log('  Error:', e.message);
  }
  
  // Summary
  const e = await pool.query('SELECT COUNT(*)::int AS c FROM entities');
  const r = await pool.query('SELECT relationship_type, COUNT(*)::int AS c FROM relationships GROUP BY relationship_type ORDER BY relationship_type');
  const ledger = fs.readFileSync('shadow-ledger/ledger.jsonl', 'utf-8').split('\n').filter(l => l.trim()).length;
  
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('FINAL STATE');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('Entities:', e.rows[0].c);
  console.log('Relationships:');
  let relTotal = 0;
  for (const row of r.rows) {
    console.log('  ' + row.relationship_type + ': ' + row.c);
    relTotal += row.c;
  }
  console.log('  Total:', relTotal);
  console.log('Ledger:', ledger);
  
  const total = e.rows[0].c + relTotal;
  const coverage = (ledger / total * 100).toFixed(1);
  console.log('\nCoverage:', ledger + '/' + total + ' = ' + coverage + '%');
  
  await pool.end();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
