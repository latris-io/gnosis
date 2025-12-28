// @ts-nocheck
// LEGACY_SCAN_OK: This script audits/validates legacy ledger or corpus files
// @implements STORY-64.1
// @implements STORY-64.2
// Genesis Extraction Script
// Re-runs full Track A extraction via service layer to achieve 100% ledger coverage

import 'dotenv/config';
import pg from 'pg';
import neo4j from 'neo4j-driver';
import * as fs from 'fs';
import * as path from 'path';

// Import extraction providers
import { BRDProvider } from '../../src/extraction/providers/brd-provider.js';
import { FilesystemProvider } from '../../src/extraction/providers/filesystem-provider.js';
import { ASTProvider } from '../../src/extraction/providers/ast-provider.js';
import { GitProvider } from '../../src/extraction/providers/git-provider.js';

// Import ops layer (uses service layer internally, logs to ledger)
import {
  persistEntities,
  persistRelationshipsAndSync,
  extractAndPersistModules,
  extractAndPersistBrdRelationships,
  extractAndPersistContainmentRelationships,
  extractAndPersistTddEntities,
  extractAndPersistTddRelationships,
  extractAndPersistGitRelationships,
  syncToNeo4j,
  replaceAllRelationshipsInNeo4j,
} from '../../src/ops/track-a.js';

import type { RepoSnapshot } from '../../src/extraction/types.js';

const { Pool } = pg;

interface ExtractionResult {
  phase: string;
  entities?: number;
  relationships?: number;
  persisted?: number;
  synced?: number;
  duration: number;
}

async function main() {
  const startTime = Date.now();
  const results: ExtractionResult[] = [];

  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║         GENESIS EXTRACTION (100% LEDGER COVERAGE)              ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  // Load universe state
  const universeEnv = fs.readFileSync('.si-universe.env', 'utf-8');
  const projectId = universeEnv.match(/PROJECT_ID=(.+)/)?.[1] || process.env.PROJECT_ID;
  const canonicalSha = universeEnv.match(/CANONICAL_SHA=(.+)/)?.[1];
  
  console.log(`Project ID: ${projectId}`);
  console.log(`Canonical SHA: ${canonicalSha}`);
  console.log('');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  const driver = neo4j.driver(
    process.env.NEO4J_URL!,
    neo4j.auth.basic(process.env.NEO4J_USER!, process.env.NEO4J_PASSWORD!)
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 2: CLEAR STATE
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('┌────────────────────────────────────────────────────────────────┐');
  console.log('│ PHASE 2: CLEAR STATE                                          │');
  console.log('└────────────────────────────────────────────────────────────────┘\n');

  // Clear ledger
  console.log('Clearing shadow ledger...');
  fs.writeFileSync('shadow-ledger/ledger.jsonl', '');
  console.log('  ✓ Ledger cleared (0 bytes)\n');

  // Clear corpus
  console.log('Clearing semantic corpus...');
  fs.writeFileSync('semantic-corpus/signals.jsonl', '');
  console.log('  ✓ Corpus cleared (0 bytes)\n');

  // Truncate DB tables
  console.log('Truncating database tables...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('TRUNCATE relationships CASCADE');
    await client.query('TRUNCATE entities CASCADE');
    await client.query('COMMIT');
    console.log('  ✓ Tables truncated\n');
  } finally {
    client.release();
  }

  // Clear Neo4j
  console.log('Clearing Neo4j...');
  const session = driver.session();
  try {
    await session.run('MATCH (n:Entity {project_id: $projectId}) DETACH DELETE n', { projectId });
    console.log('  ✓ Neo4j entities cleared\n');
  } finally {
    await session.close();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 3: RE-EXTRACT ENTITIES
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('┌────────────────────────────────────────────────────────────────┐');
  console.log('│ PHASE 3: RE-EXTRACT ENTITIES                                  │');
  console.log('└────────────────────────────────────────────────────────────────┘\n');

  const projectRoot = process.cwd();
  const snapshot: RepoSnapshot = {
    project_id: projectId!,
    root_path: projectRoot,
    commit_sha: canonicalSha!,
    timestamp: new Date(),
  };

  // 3.1: BRD Entities (E01, E02, E03, E04)
  console.log('3.1: Extracting BRD entities...');
  let phaseStart = Date.now();
  const brdProvider = new BRDProvider();
  const brdResult = await brdProvider.extract(snapshot);
  const brdPersist = await persistEntities(projectId!, brdResult.entities);
  const brdPersisted = brdPersist.filter(r => r.operation !== 'NO-OP').length;
  console.log(`  Extracted: ${brdResult.entities.length}`);
  console.log(`  Persisted: ${brdPersisted}`);
  results.push({ phase: 'BRD Entities', entities: brdResult.entities.length, persisted: brdPersisted, duration: Date.now() - phaseStart });

  // 3.2: Source Entities (E06, E11, E27)
  console.log('\n3.2: Extracting source entities...');
  phaseStart = Date.now();
  const fsProvider = new FilesystemProvider();
  const fsResult = await fsProvider.extract(snapshot);
  const fsPersist = await persistEntities(projectId!, fsResult.entities);
  const fsPersisted = fsPersist.filter(r => r.operation !== 'NO-OP').length;
  console.log(`  Extracted: ${fsResult.entities.length}`);
  console.log(`  Persisted: ${fsPersisted}`);
  results.push({ phase: 'Source Entities', entities: fsResult.entities.length, persisted: fsPersisted, duration: Date.now() - phaseStart });

  // 3.3: AST Entities (E08, E12, E13, E28, E29)
  console.log('\n3.3: Extracting AST entities...');
  phaseStart = Date.now();
  const astProvider = new ASTProvider();
  const astResult = await astProvider.extract(snapshot);
  const astPersist = await persistEntities(projectId!, astResult.entities);
  const astPersisted = astPersist.filter(r => r.operation !== 'NO-OP').length;
  console.log(`  Extracted: ${astResult.entities.length}`);
  console.log(`  Persisted: ${astPersisted}`);
  results.push({ phase: 'AST Entities', entities: astResult.entities.length, persisted: astPersisted, duration: Date.now() - phaseStart });

  // 3.4: Module Derivation (E15)
  console.log('\n3.4: Deriving E15 modules...');
  phaseStart = Date.now();
  const moduleResult = await extractAndPersistModules(projectId!);
  console.log(`  Derived: ${moduleResult.derived}`);
  console.log(`  Persisted: ${moduleResult.persisted}`);
  results.push({ phase: 'Modules', entities: moduleResult.derived, persisted: moduleResult.persisted, duration: Date.now() - phaseStart });

  // 3.5: Git Entities (E49, E50)
  console.log('\n3.5: Extracting Git entities...');
  phaseStart = Date.now();
  const gitProvider = new GitProvider();
  const gitResult = await gitProvider.extract(snapshot);
  const gitPersist = await persistEntities(projectId!, gitResult.entities);
  const gitPersisted = gitPersist.filter(r => r.operation !== 'NO-OP').length;
  console.log(`  Extracted: ${gitResult.entities.length}`);
  console.log(`  Persisted: ${gitPersisted}`);
  results.push({ phase: 'Git Entities', entities: gitResult.entities.length, persisted: gitPersisted, duration: Date.now() - phaseStart });

  // 3.6: TDD Entities (E06 from spec/)
  console.log('\n3.6: Extracting TDD entities...');
  phaseStart = Date.now();
  const tddResult = await extractAndPersistTddEntities(projectId!);
  console.log(`  Extracted: ${tddResult.extracted}`);
  console.log(`  Persisted: ${tddResult.persisted}`);
  results.push({ phase: 'TDD Entities', entities: tddResult.extracted, persisted: tddResult.persisted, duration: Date.now() - phaseStart });

  // Sync entities to Neo4j
  console.log('\n3.7: Syncing entities to Neo4j...');
  phaseStart = Date.now();
  const entitySync = await syncToNeo4j(projectId!);
  console.log(`  Synced: ${entitySync.synced}`);
  results.push({ phase: 'Entity Sync', synced: entitySync.synced, duration: Date.now() - phaseStart });

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 4: RE-EXTRACT RELATIONSHIPS
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('\n┌────────────────────────────────────────────────────────────────┐');
  console.log('│ PHASE 4: RE-EXTRACT RELATIONSHIPS                             │');
  console.log('└────────────────────────────────────────────────────────────────┘\n');

  // 4.1: BRD Relationships (R01, R02, R03)
  console.log('4.1: Extracting BRD relationships...');
  phaseStart = Date.now();
  const brdRelResult = await extractAndPersistBrdRelationships(projectId!);
  console.log(`  Extracted: ${brdRelResult.extracted}`);
  console.log(`  Persisted: ${brdRelResult.persisted}`);
  results.push({ phase: 'BRD Relationships', relationships: brdRelResult.extracted, persisted: brdRelResult.persisted, duration: Date.now() - phaseStart });

  // 4.2: Containment Relationships (R04, R05, R06, R07, R16)
  console.log('\n4.2: Extracting containment relationships...');
  phaseStart = Date.now();
  const containResult = await extractAndPersistContainmentRelationships(projectId!);
  console.log(`  R04: ${containResult.r04.extracted} extracted, ${containResult.r04.persisted} persisted`);
  console.log(`  R05: ${containResult.r05.extracted} extracted, ${containResult.r05.persisted} persisted`);
  console.log(`  R06: ${containResult.r06.extracted} extracted, ${containResult.r06.persisted} persisted`);
  console.log(`  R07: ${containResult.r07.extracted} extracted, ${containResult.r07.persisted} persisted`);
  console.log(`  R16: ${containResult.r16.extracted} extracted, ${containResult.r16.persisted} persisted`);
  console.log(`  Total: ${containResult.total.extracted} extracted, ${containResult.total.persisted} persisted`);
  results.push({ phase: 'Containment Rels', relationships: containResult.total.extracted, persisted: containResult.total.persisted, duration: Date.now() - phaseStart });

  // 4.3: TDD Relationships (R08, R09, R11, R14)
  console.log('\n4.3: Extracting TDD relationships...');
  phaseStart = Date.now();
  const tddRelResult = await extractAndPersistTddRelationships(projectId!);
  console.log(`  R08: ${tddRelResult.extracted.r08}`);
  console.log(`  R09: ${tddRelResult.extracted.r09}`);
  console.log(`  R11: ${tddRelResult.extracted.r11}`);
  console.log(`  R14: ${tddRelResult.extracted.r14}`);
  console.log(`  Total: ${tddRelResult.extracted.total} extracted, ${tddRelResult.persisted} persisted`);
  results.push({ phase: 'TDD Relationships', relationships: tddRelResult.extracted.total, persisted: tddRelResult.persisted, duration: Date.now() - phaseStart });

  // 4.4: Git Relationships (R63, R67, R70)
  console.log('\n4.4: Extracting Git relationships...');
  phaseStart = Date.now();
  const gitRelResult = await extractAndPersistGitRelationships(projectId!);
  console.log(`  R63: ${gitRelResult.r63.extracted} extracted, ${gitRelResult.r63.persisted} persisted`);
  console.log(`  R67: ${gitRelResult.r67.extracted} extracted, ${gitRelResult.r67.persisted} persisted`);
  console.log(`  R70: ${gitRelResult.r70.extracted} extracted, ${gitRelResult.r70.persisted} persisted`);
  console.log(`  Total: ${gitRelResult.total.extracted} extracted, ${gitRelResult.total.persisted} persisted`);
  results.push({ phase: 'Git Relationships', relationships: gitRelResult.total.extracted, persisted: gitRelResult.total.persisted, duration: Date.now() - phaseStart });

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 5: NEO4J REBUILD
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('\n┌────────────────────────────────────────────────────────────────┐');
  console.log('│ PHASE 5: NEO4J REBUILD                                        │');
  console.log('└────────────────────────────────────────────────────────────────┘\n');

  console.log('5.1: Replace relationships in Neo4j...');
  phaseStart = Date.now();
  const replaceResult = await replaceAllRelationshipsInNeo4j(projectId!);
  console.log(`  Deleted: ${replaceResult.deleted}`);
  console.log(`  Synced: ${replaceResult.synced}`);
  results.push({ phase: 'Neo4j Rebuild', synced: replaceResult.synced, duration: Date.now() - phaseStart });

  // ═══════════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                    EXTRACTION COMPLETE                         ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  // Count final state
  const entityCount = await pool.query('SELECT COUNT(*)::int AS count FROM entities');
  const relCount = await pool.query('SELECT COUNT(*)::int AS count FROM relationships');
  const ledgerLines = fs.readFileSync('shadow-ledger/ledger.jsonl', 'utf-8').split('\n').filter(l => l.trim()).length;
  const corpusLines = fs.readFileSync('semantic-corpus/signals.jsonl', 'utf-8').split('\n').filter(l => l.trim()).length;

  console.log('Final State:');
  console.log(`  Entities in DB:     ${entityCount.rows[0].count}`);
  console.log(`  Relationships in DB: ${relCount.rows[0].count}`);
  console.log(`  Ledger entries:     ${ledgerLines}`);
  console.log(`  Corpus signals:     ${corpusLines}`);
  console.log(`\nTotal duration: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);

  // Write results to JSON
  const resultPath = 'si-readiness-results/genesis-extract-result.json';
  fs.mkdirSync('si-readiness-results', { recursive: true });
  fs.writeFileSync(resultPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    canonical_sha: canonicalSha,
    project_id: projectId,
    final_state: {
      entities: entityCount.rows[0].count,
      relationships: relCount.rows[0].count,
      ledger_entries: ledgerLines,
      corpus_signals: corpusLines,
    },
    phases: results,
    duration_seconds: (Date.now() - startTime) / 1000,
  }, null, 2));
  console.log(`\nResults written to: ${resultPath}`);

  await pool.end();
  await driver.close();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
