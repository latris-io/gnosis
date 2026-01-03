// @ts-nocheck
// LEGACY_SCAN_OK: This script audits/validates legacy ledger or corpus files
/**
 * Extract Relationships Script
 * Tier 2: LEGACY (superseded by scripts/run-a1-extraction.ts)
 * 
 * DEPRECATED: Use scripts/run-a1-extraction.ts instead.
 * REQUIRES: --confirm-repair flag and PROJECT_ID env var
 */
import 'dotenv/config';
import pg from 'pg';
import * as fs from 'fs';
import { 
  requireConfirmRepair, 
  createEvidence, 
  writeEvidenceMarkdown,
  type EvidenceArtifact 
} from '../_lib/operator-guard.js';
import { captureStateSnapshot, formatSnapshot } from '../_lib/state-snapshot.js';

const SCRIPT_NAME = 'scripts/si-readiness/extract-relationships.ts';
requireConfirmRepair(SCRIPT_NAME);

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
  console.log('║              ⚠️  DEPRECATED - Use run-a1-extraction.ts          ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const universeEnv = fs.readFileSync('.si-universe.env', 'utf-8');
  const projectId = universeEnv.match(/PROJECT_ID=(.+)/)?.[1] || process.env.PROJECT_ID;
  
  if (!projectId) {
    console.error('ERROR: PROJECT_ID required');
    process.exit(1);
  }
  
  // Initialize evidence artifact
  const evidence: EvidenceArtifact = createEvidence(SCRIPT_NAME, projectId);
  evidence.operations?.push('DEPRECATED: This script is superseded by run-a1-extraction.ts');
  
  console.log(`Project ID: ${projectId}\n`);
  
  // Capture BEFORE state
  console.log('[SNAPSHOT] Capturing before state...');
  try {
    evidence.beforeCounts = await captureStateSnapshot(projectId);
    console.log(`  ${formatSnapshot(evidence.beforeCounts)}`);
  } catch (err) {
    console.log('  Warning: Could not capture before snapshot');
  }
  console.log('');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  try {
    // First sync entities to Neo4j (was aborted)
    console.log('Syncing entities to Neo4j...');
    const entitySync = await syncToNeo4j(projectId!);
    console.log(`  Synced: ${entitySync.synced}\n`);
    evidence.operations?.push(`Entity sync to Neo4j=${entitySync.synced}`);

    // 4.1: BRD Relationships
    console.log('4.1: Extracting BRD relationships (R01, R02, R03)...');
    const brdRelResult = await extractAndPersistBrdRelationships(projectId!);
    console.log(`  Persisted: ${brdRelResult.persisted}\n`);
    evidence.operations?.push(`4.1: BRD rels persisted=${brdRelResult.persisted}`);

    // 4.2: Containment
    console.log('4.2: Extracting containment relationships...');
    const containResult = await extractAndPersistContainmentRelationships(projectId!);
    console.log(`  R04: ${containResult.r04.persisted}`);
    console.log(`  R05: ${containResult.r05.persisted}`);
    console.log(`  R06: ${containResult.r06.persisted}`);
    console.log(`  R07: ${containResult.r07.persisted}`);
    console.log(`  R16: ${containResult.r16.persisted}`);
    console.log(`  Total: ${containResult.total.persisted}\n`);
    evidence.operations?.push(`4.2: Containment rels total=${containResult.total.persisted}`);

    // 4.3: TDD Relationships
    console.log('4.3: Extracting TDD relationships...');
    const tddRelResult = await extractAndPersistTddRelationships(projectId!);
    console.log(`  Persisted: ${tddRelResult.persisted}\n`);
    evidence.operations?.push(`4.3: TDD rels persisted=${tddRelResult.persisted}`);

    // 4.4: Git Relationships
    console.log('4.4: Extracting Git relationships...');
    const gitRelResult = await extractAndPersistGitRelationships(projectId!);
    console.log(`  R63: ${gitRelResult.r63.persisted}`);
    console.log(`  R67: ${gitRelResult.r67.persisted}`);
    console.log(`  R70: ${gitRelResult.r70.persisted}`);
    console.log(`  Total: ${gitRelResult.total.persisted}\n`);
    evidence.operations?.push(`4.4: Git rels total=${gitRelResult.total.persisted}`);

    // 5.1: Neo4j Rebuild
    console.log('5.1: Rebuilding Neo4j relationships...');
    const replaceResult = await replaceAllRelationshipsInNeo4j(projectId!);
    console.log(`  Deleted: ${replaceResult.deleted}`);
    console.log(`  Synced: ${replaceResult.synced}\n`);
    evidence.operations?.push(`5.1: Neo4j rels deleted=${replaceResult.deleted}, synced=${replaceResult.synced}`);

    // Summary
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║                      COMPLETE                                  ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    const entityCount = await pool.query('SELECT COUNT(*)::int AS count FROM entities');
    const relCount = await pool.query('SELECT COUNT(*)::int AS count FROM relationships');
    
    let ledgerLines = 0;
    let corpusLines = 0;
    try {
      ledgerLines = fs.readFileSync('shadow-ledger/ledger.jsonl', 'utf-8').split('\n').filter(l => l.trim()).length;
    } catch {}
    try {
      corpusLines = fs.readFileSync('semantic-corpus/signals.jsonl', 'utf-8').split('\n').filter(l => l.trim()).length;
    } catch {}

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

    // Capture AFTER state
    console.log('\n[SNAPSHOT] Capturing after state...');
    try {
      evidence.afterCounts = await captureStateSnapshot(projectId);
      console.log(`  ${formatSnapshot(evidence.afterCounts)}`);
    } catch (err) {
      console.log('  Warning: Could not capture after snapshot');
    }

    evidence.status = 'SUCCESS';

  } catch (err) {
    evidence.status = 'FAILED';
    evidence.errors?.push(String(err));
    throw err;
  } finally {
    writeEvidenceMarkdown(evidence);
    await pool.end();
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
