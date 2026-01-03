// @ts-nocheck
// LEGACY_SCAN_OK: This script audits/validates legacy ledger or corpus files
/**
 * Finish Extraction Script
 * Tier 2: LEGACY (superseded by scripts/run-a1-extraction.ts)
 * 
 * DEPRECATED: Use scripts/run-a1-extraction.ts instead.
 * REQUIRES: --confirm-repair flag and PROJECT_ID env var
 */
import 'dotenv/config';
import * as fs from 'fs';
import pg from 'pg';
import { requireConfirmRepair, resolveProjectId } from '../_lib/operator-guard.js';

import {
  extractAndPersistBrdRelationships,
  extractAndPersistContainmentRelationships,
  extractAndPersistTddRelationships,
  extractAndPersistGitRelationships,
  replaceAllRelationshipsInNeo4j,
} from '../../src/ops/track-a.js';

const SCRIPT_NAME = 'scripts/si-readiness/finish-extract.ts';
requireConfirmRepair(SCRIPT_NAME);

const { Pool } = pg;

async function main() {
  const projectId = resolveProjectId();
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL, 
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false } 
  });
  
  console.log('Starting remaining extractions...');
  console.log('Project ID:', projectId);
  console.log('');
  
  // Continue BRD (may be partially done)
  console.log('BRD relationships...');
  const brd = await extractAndPersistBrdRelationships(projectId);
  console.log('  Persisted:', brd.persisted);
  
  // Containment
  console.log('Containment relationships...');
  const contain = await extractAndPersistContainmentRelationships(projectId);
  console.log('  R04:', contain.r04.persisted);
  console.log('  R05:', contain.r05.persisted);
  console.log('  R06:', contain.r06.persisted);
  console.log('  R07:', contain.r07.persisted);
  console.log('  R16:', contain.r16.persisted);
  console.log('  Total:', contain.total.persisted);
  
  // TDD
  console.log('TDD relationships...');
  const tdd = await extractAndPersistTddRelationships(projectId);
  console.log('  Persisted:', tdd.persisted);
  
  // Git
  console.log('Git relationships...');
  const git = await extractAndPersistGitRelationships(projectId);
  console.log('  R63:', git.r63.persisted);
  console.log('  R67:', git.r67.persisted);
  console.log('  R70:', git.r70.persisted);
  console.log('  Total:', git.total.persisted);
  
  // Neo4j rebuild
  console.log('Neo4j rebuild...');
  const neo = await replaceAllRelationshipsInNeo4j(projectId);
  console.log('  Deleted:', neo.deleted);
  console.log('  Synced:', neo.synced);
  
  // Summary
  const e = await pool.query('SELECT COUNT(*)::int AS c FROM entities');
  const r = await pool.query('SELECT COUNT(*)::int AS c FROM relationships');
  const ledger = fs.readFileSync('shadow-ledger/ledger.jsonl', 'utf-8').split('\n').filter(l => l.trim()).length;
  const corpus = fs.readFileSync('semantic-corpus/signals.jsonl', 'utf-8').split('\n').filter(l => l.trim()).length;
  
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                      FINAL STATE                               ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  console.log('  Entities:      ', e.rows[0].c);
  console.log('  Relationships: ', r.rows[0].c);
  console.log('  Ledger:        ', ledger);
  console.log('  Corpus:        ', corpus);
  
  const total = e.rows[0].c + r.rows[0].c;
  const coverage = (ledger / total * 100).toFixed(1);
  console.log('\n  Ledger Coverage:', ledger + '/' + total + ' = ' + coverage + '%');
  
  if (parseFloat(coverage) >= 100) {
    console.log('\n✓ 100% LEDGER COVERAGE ACHIEVED');
  } else {
    console.log('\n⚠ LEDGER COVERAGE: ' + coverage + '%');
  }
  
  // Write result
  fs.mkdirSync('si-readiness-results', { recursive: true });
  fs.writeFileSync('si-readiness-results/final-state.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    project_id: projectId,
    entities: e.rows[0].c,
    relationships: r.rows[0].c,
    ledger_entries: ledger,
    corpus_signals: corpus,
    coverage_percent: parseFloat(coverage),
    pass: parseFloat(coverage) >= 100
  }, null, 2));
  
  await pool.end();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

