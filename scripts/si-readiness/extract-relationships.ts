// @ts-nocheck
// Extract relationships only (entities already done)
import 'dotenv/config';
import pg from 'pg';
import * as fs from 'fs';

import {
  extractAndPersistBrdRelationships,
  extractAndPersistContainmentRelationships,
  extractAndPersistTddRelationships,
  extractAndPersistGitRelationships,
  syncToNeo4j,
  replaceAllRelationshipsInNeo4j,
} from '../../src/ops/track-a.js';

const { Pool } = pg;

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║              RELATIONSHIP EXTRACTION                           ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const universeEnv = fs.readFileSync('.si-universe.env', 'utf-8');
  const projectId = universeEnv.match(/PROJECT_ID=(.+)/)?.[1] || process.env.PROJECT_ID;
  
  console.log(`Project ID: ${projectId}\n`);

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  // First sync entities to Neo4j (was aborted)
  console.log('Syncing entities to Neo4j...');
  const entitySync = await syncToNeo4j(projectId!);
  console.log(`  Synced: ${entitySync.synced}\n`);

  // 4.1: BRD Relationships
  console.log('4.1: Extracting BRD relationships (R01, R02, R03)...');
  const brdRelResult = await extractAndPersistBrdRelationships(projectId!);
  console.log(`  Persisted: ${brdRelResult.persisted}\n`);

  // 4.2: Containment
  console.log('4.2: Extracting containment relationships...');
  const containResult = await extractAndPersistContainmentRelationships(projectId!);
  console.log(`  R04: ${containResult.r04.persisted}`);
  console.log(`  R05: ${containResult.r05.persisted}`);
  console.log(`  R06: ${containResult.r06.persisted}`);
  console.log(`  R07: ${containResult.r07.persisted}`);
  console.log(`  R16: ${containResult.r16.persisted}`);
  console.log(`  Total: ${containResult.total.persisted}\n`);

  // 4.3: TDD Relationships
  console.log('4.3: Extracting TDD relationships...');
  const tddRelResult = await extractAndPersistTddRelationships(projectId!);
  console.log(`  Persisted: ${tddRelResult.persisted}\n`);

  // 4.4: Git Relationships
  console.log('4.4: Extracting Git relationships...');
  const gitRelResult = await extractAndPersistGitRelationships(projectId!);
  console.log(`  R63: ${gitRelResult.r63.persisted}`);
  console.log(`  R67: ${gitRelResult.r67.persisted}`);
  console.log(`  R70: ${gitRelResult.r70.persisted}`);
  console.log(`  Total: ${gitRelResult.total.persisted}\n`);

  // 5.1: Neo4j Rebuild
  console.log('5.1: Rebuilding Neo4j relationships...');
  const replaceResult = await replaceAllRelationshipsInNeo4j(projectId!);
  console.log(`  Deleted: ${replaceResult.deleted}`);
  console.log(`  Synced: ${replaceResult.synced}\n`);

  // Summary
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║                      COMPLETE                                  ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const entityCount = await pool.query('SELECT COUNT(*)::int AS count FROM entities');
  const relCount = await pool.query('SELECT COUNT(*)::int AS count FROM relationships');
  const ledgerLines = fs.readFileSync('shadow-ledger/ledger.jsonl', 'utf-8').split('\n').filter(l => l.trim()).length;
  const corpusLines = fs.readFileSync('semantic-corpus/signals.jsonl', 'utf-8').split('\n').filter(l => l.trim()).length;

  console.log('Final State:');
  console.log(`  Entities:      ${entityCount.rows[0].count}`);
  console.log(`  Relationships: ${relCount.rows[0].count}`);
  console.log(`  Ledger:        ${ledgerLines}`);
  console.log(`  Corpus:        ${corpusLines}`);

  const expectedMutations = entityCount.rows[0].count + relCount.rows[0].count;
  const coverage = (ledgerLines / expectedMutations * 100).toFixed(1);
  console.log(`\nLedger Coverage: ${ledgerLines}/${expectedMutations} = ${coverage}%`);

  if (parseFloat(coverage) >= 100) {
    console.log('\n✓ 100% LEDGER COVERAGE ACHIEVED');
  } else {
    console.log('\n⚠ LEDGER COVERAGE INCOMPLETE');
  }

  await pool.end();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
