// @ts-nocheck
// LEGACY_SCAN_OK: This script audits/validates legacy ledger or corpus files
/**
 * Continue Extraction Script
 * Tier 2: LEGACY (superseded by scripts/run-a1-extraction.ts)
 * 
 * Continues extraction from where genesis-extract was aborted.
 * 
 * DEPRECATED: Use scripts/run-a1-extraction.ts instead.
 * REQUIRES: --confirm-repair flag and PROJECT_ID env var
 */
import 'dotenv/config';
import pg from 'pg';
import neo4j from 'neo4j-driver';
import * as fs from 'fs';
import { 
  requireConfirmRepair, 
  createEvidence, 
  writeEvidenceMarkdown,
  type EvidenceArtifact 
} from '../_lib/operator-guard.js';
import { captureStateSnapshot, formatSnapshot } from '../_lib/state-snapshot.js';

const SCRIPT_NAME = 'scripts/si-readiness/continue-extract.ts';

// === OPERATOR GUARD ===
requireConfirmRepair(SCRIPT_NAME);

// Import ops layer
import {
  persistEntities,
  extractAndPersistModules,
  extractAndPersistBrdRelationships,
  extractAndPersistContainmentRelationships,
  extractAndPersistTddEntities,
  extractAndPersistTddRelationships,
  extractAndPersistGitRelationships,
  syncToNeo4j,
  replaceAllRelationshipsInNeo4j,
} from '../../src/ops/track-a.js';

import { FilesystemProvider } from '../../src/extraction/providers/filesystem-provider.js';
import { ASTProvider } from '../../src/extraction/providers/ast-provider.js';
import { GitProvider } from '../../src/extraction/providers/git-provider.js';

const { Pool } = pg;

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║        CONTINUE EXTRACTION (From Phase 3.2)                    ║');
  console.log('║        ⚠️  DEPRECATED - Use run-a1-extraction.ts instead       ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const universeEnv = fs.readFileSync('.si-universe.env', 'utf-8');
  const projectId = universeEnv.match(/PROJECT_ID=(.+)/)?.[1] || process.env.PROJECT_ID;
  const canonicalSha = universeEnv.match(/CANONICAL_SHA=(.+)/)?.[1];
  
  if (!projectId) {
    console.error('ERROR: PROJECT_ID required');
    process.exit(1);
  }
  
  // Initialize evidence artifact
  const evidence: EvidenceArtifact = createEvidence(SCRIPT_NAME, projectId);
  evidence.operations?.push('DEPRECATED: This script is superseded by run-a1-extraction.ts');
  
  console.log(`Project ID: ${projectId}`);
  console.log(`Canonical SHA: ${canonicalSha}\n`);
  
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
    const snapshot = {
      project_id: projectId!,
      root_path: process.cwd(),
      commit_sha: canonicalSha!,
      timestamp: new Date(),
    };

    // 3.2: Source Entities (E06, E11, E27)
    console.log('3.2: Extracting source entities (E11, E27)...');
    const fsProvider = new FilesystemProvider();
    const fsResult = await fsProvider.extract(snapshot);
    const fsPersist = await persistEntities(projectId!, fsResult.entities);
    const fsPersisted = fsPersist.filter(r => r.operation !== 'NO-OP').length;
    console.log(`  Extracted: ${fsResult.entities.length}, Persisted: ${fsPersisted}`);
    evidence.operations?.push(`3.2: E11/E27 extracted=${fsResult.entities.length}, persisted=${fsPersisted}`);

    // 3.3: AST Entities (E08, E12, E13, E28, E29)
    console.log('\n3.3: Extracting AST entities (E12, E13, E28, E29)...');
    const astProvider = new ASTProvider();
    const astResult = await astProvider.extract(snapshot);
    const astPersist = await persistEntities(projectId!, astResult.entities);
    const astPersisted = astPersist.filter(r => r.operation !== 'NO-OP').length;
    console.log(`  Extracted: ${astResult.entities.length}, Persisted: ${astPersisted}`);
    evidence.operations?.push(`3.3: AST entities extracted=${astResult.entities.length}, persisted=${astPersisted}`);

    // 3.4: Module Derivation (E15)
    console.log('\n3.4: Deriving E15 modules...');
    const moduleResult = await extractAndPersistModules(projectId!);
    console.log(`  Derived: ${moduleResult.derived}, Persisted: ${moduleResult.persisted}`);
    evidence.operations?.push(`3.4: E15 derived=${moduleResult.derived}, persisted=${moduleResult.persisted}`);

    // 3.5: Git Entities (E49, E50)
    console.log('\n3.5: Extracting Git entities (E49, E50)...');
    const gitProvider = new GitProvider();
    const gitResult = await gitProvider.extract(snapshot);
    const gitPersist = await persistEntities(projectId!, gitResult.entities);
    const gitPersisted = gitPersist.filter(r => r.operation !== 'NO-OP').length;
    console.log(`  Extracted: ${gitResult.entities.length}, Persisted: ${gitPersisted}`);
    evidence.operations?.push(`3.5: Git entities extracted=${gitResult.entities.length}, persisted=${gitPersisted}`);

    // 3.6: TDD Entities
    console.log('\n3.6: Extracting TDD entities...');
    const tddResult = await extractAndPersistTddEntities(projectId!);
    console.log(`  Extracted: ${tddResult.extracted}, Persisted: ${tddResult.persisted}`);
    evidence.operations?.push(`3.6: TDD entities extracted=${tddResult.extracted}, persisted=${tddResult.persisted}`);

    // 3.7: Sync entities to Neo4j
    console.log('\n3.7: Syncing entities to Neo4j...');
    const entitySync = await syncToNeo4j(projectId!);
    console.log(`  Synced: ${entitySync.synced}`);
    evidence.operations?.push(`3.7: Neo4j entity sync=${entitySync.synced}`);

    // PHASE 4: RELATIONSHIPS
    console.log('\n┌────────────────────────────────────────────────────────────────┐');
    console.log('│ PHASE 4: RELATIONSHIPS                                        │');
    console.log('└────────────────────────────────────────────────────────────────┘\n');

    // 4.1: BRD Relationships
    console.log('4.1: Extracting BRD relationships (R01, R02, R03)...');
    const brdRelResult = await extractAndPersistBrdRelationships(projectId!);
    console.log(`  Extracted: ${brdRelResult.extracted}, Persisted: ${brdRelResult.persisted}`);
    evidence.operations?.push(`4.1: BRD rels extracted=${brdRelResult.extracted}, persisted=${brdRelResult.persisted}`);

    // 4.2: Containment
    console.log('\n4.2: Extracting containment relationships...');
    const containResult = await extractAndPersistContainmentRelationships(projectId!);
    console.log(`  R04: ${containResult.r04.persisted}, R05: ${containResult.r05.persisted}`);
    console.log(`  R06: ${containResult.r06.persisted}, R07: ${containResult.r07.persisted}`);
    console.log(`  R16: ${containResult.r16.persisted}`);
    console.log(`  Total: ${containResult.total.persisted}`);
    evidence.operations?.push(`4.2: Containment total=${containResult.total.persisted}`);

    // 4.3: TDD Relationships
    console.log('\n4.3: Extracting TDD relationships...');
    const tddRelResult = await extractAndPersistTddRelationships(projectId!);
    console.log(`  R08: ${tddRelResult.extracted.r08}, R09: ${tddRelResult.extracted.r09}`);
    console.log(`  R11: ${tddRelResult.extracted.r11}, R14: ${tddRelResult.extracted.r14}`);
    console.log(`  Total: ${tddRelResult.persisted}`);
    evidence.operations?.push(`4.3: TDD rels total=${tddRelResult.persisted}`);

    // 4.4: Git Relationships
    console.log('\n4.4: Extracting Git relationships...');
    const gitRelResult = await extractAndPersistGitRelationships(projectId!);
    console.log(`  R63: ${gitRelResult.r63.persisted}, R67: ${gitRelResult.r67.persisted}, R70: ${gitRelResult.r70.persisted}`);
    console.log(`  Total: ${gitRelResult.total.persisted}`);
    evidence.operations?.push(`4.4: Git rels total=${gitRelResult.total.persisted}`);

    // PHASE 5: NEO4J REBUILD
    console.log('\n┌────────────────────────────────────────────────────────────────┐');
    console.log('│ PHASE 5: NEO4J REBUILD                                        │');
    console.log('└────────────────────────────────────────────────────────────────┘\n');

    console.log('5.1: Replace relationships in Neo4j...');
    const replaceResult = await replaceAllRelationshipsInNeo4j(projectId!);
    console.log(`  Deleted: ${replaceResult.deleted}, Synced: ${replaceResult.synced}`);
    evidence.operations?.push(`5.1: Neo4j rels deleted=${replaceResult.deleted}, synced=${replaceResult.synced}`);

    // SUMMARY
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║                    EXTRACTION COMPLETE                         ║');
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
    console.log(`  Entities in DB:      ${entityCount.rows[0].count}`);
    console.log(`  Relationships in DB: ${relCount.rows[0].count}`);
    console.log(`  Ledger entries:      ${ledgerLines}`);
    console.log(`  Corpus signals:      ${corpusLines}`);

    const expectedMutations = entityCount.rows[0].count + relCount.rows[0].count;
    const coverageRatio = (ledgerLines / expectedMutations * 100).toFixed(1);
    console.log(`\nLedger Coverage: ${ledgerLines}/${expectedMutations} = ${coverageRatio}%`);

    fs.mkdirSync('si-readiness-results', { recursive: true });
    fs.writeFileSync('si-readiness-results/genesis-extract-result.json', JSON.stringify({
      timestamp: new Date().toISOString(),
      canonical_sha: canonicalSha,
      project_id: projectId,
      final_state: {
        entities: entityCount.rows[0].count,
        relationships: relCount.rows[0].count,
        ledger_entries: ledgerLines,
        corpus_signals: corpusLines,
        coverage_ratio: parseFloat(coverageRatio),
      },
    }, null, 2));

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
