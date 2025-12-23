// @ts-nocheck
// Continue extraction from where genesis-extract was aborted
import 'dotenv/config';
import pg from 'pg';
import neo4j from 'neo4j-driver';
import * as fs from 'fs';

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
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const universeEnv = fs.readFileSync('.si-universe.env', 'utf-8');
  const projectId = universeEnv.match(/PROJECT_ID=(.+)/)?.[1] || process.env.PROJECT_ID;
  const canonicalSha = universeEnv.match(/CANONICAL_SHA=(.+)/)?.[1];
  
  console.log(`Project ID: ${projectId}`);
  console.log(`Canonical SHA: ${canonicalSha}\n`);

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
  });

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

  // 3.3: AST Entities (E08, E12, E13, E28, E29)
  console.log('\n3.3: Extracting AST entities (E12, E13, E28, E29)...');
  const astProvider = new ASTProvider();
  const astResult = await astProvider.extract(snapshot);
  const astPersist = await persistEntities(projectId!, astResult.entities);
  const astPersisted = astPersist.filter(r => r.operation !== 'NO-OP').length;
  console.log(`  Extracted: ${astResult.entities.length}, Persisted: ${astPersisted}`);

  // 3.4: Module Derivation (E15)
  console.log('\n3.4: Deriving E15 modules...');
  const moduleResult = await extractAndPersistModules(projectId!);
  console.log(`  Derived: ${moduleResult.derived}, Persisted: ${moduleResult.persisted}`);

  // 3.5: Git Entities (E49, E50)
  console.log('\n3.5: Extracting Git entities (E49, E50)...');
  const gitProvider = new GitProvider();
  const gitResult = await gitProvider.extract(snapshot);
  const gitPersist = await persistEntities(projectId!, gitResult.entities);
  const gitPersisted = gitPersist.filter(r => r.operation !== 'NO-OP').length;
  console.log(`  Extracted: ${gitResult.entities.length}, Persisted: ${gitPersisted}`);

  // 3.6: TDD Entities
  console.log('\n3.6: Extracting TDD entities...');
  const tddResult = await extractAndPersistTddEntities(projectId!);
  console.log(`  Extracted: ${tddResult.extracted}, Persisted: ${tddResult.persisted}`);

  // 3.7: Sync entities to Neo4j
  console.log('\n3.7: Syncing entities to Neo4j...');
  const entitySync = await syncToNeo4j(projectId!);
  console.log(`  Synced: ${entitySync.synced}`);

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 4: RELATIONSHIPS
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n┌────────────────────────────────────────────────────────────────┐');
  console.log('│ PHASE 4: RELATIONSHIPS                                        │');
  console.log('└────────────────────────────────────────────────────────────────┘\n');

  // 4.1: BRD Relationships
  console.log('4.1: Extracting BRD relationships (R01, R02, R03)...');
  const brdRelResult = await extractAndPersistBrdRelationships(projectId!);
  console.log(`  Extracted: ${brdRelResult.extracted}, Persisted: ${brdRelResult.persisted}`);

  // 4.2: Containment
  console.log('\n4.2: Extracting containment relationships...');
  const containResult = await extractAndPersistContainmentRelationships(projectId!);
  console.log(`  R04: ${containResult.r04.persisted}, R05: ${containResult.r05.persisted}`);
  console.log(`  R06: ${containResult.r06.persisted}, R07: ${containResult.r07.persisted}`);
  console.log(`  R16: ${containResult.r16.persisted}`);
  console.log(`  Total: ${containResult.total.persisted}`);

  // 4.3: TDD Relationships
  console.log('\n4.3: Extracting TDD relationships...');
  const tddRelResult = await extractAndPersistTddRelationships(projectId!);
  console.log(`  R08: ${tddRelResult.extracted.r08}, R09: ${tddRelResult.extracted.r09}`);
  console.log(`  R11: ${tddRelResult.extracted.r11}, R14: ${tddRelResult.extracted.r14}`);
  console.log(`  Total: ${tddRelResult.persisted}`);

  // 4.4: Git Relationships
  console.log('\n4.4: Extracting Git relationships...');
  const gitRelResult = await extractAndPersistGitRelationships(projectId!);
  console.log(`  R63: ${gitRelResult.r63.persisted}, R67: ${gitRelResult.r67.persisted}, R70: ${gitRelResult.r70.persisted}`);
  console.log(`  Total: ${gitRelResult.total.persisted}`);

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 5: NEO4J REBUILD
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n┌────────────────────────────────────────────────────────────────┐');
  console.log('│ PHASE 5: NEO4J REBUILD                                        │');
  console.log('└────────────────────────────────────────────────────────────────┘\n');

  console.log('5.1: Replace relationships in Neo4j...');
  const replaceResult = await replaceAllRelationshipsInNeo4j(projectId!);
  console.log(`  Deleted: ${replaceResult.deleted}, Synced: ${replaceResult.synced}`);

  // ═══════════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                    EXTRACTION COMPLETE                         ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const entityCount = await pool.query('SELECT COUNT(*)::int AS count FROM entities');
  const relCount = await pool.query('SELECT COUNT(*)::int AS count FROM relationships');
  const ledgerLines = fs.readFileSync('shadow-ledger/ledger.jsonl', 'utf-8').split('\n').filter(l => l.trim()).length;
  const corpusLines = fs.readFileSync('semantic-corpus/signals.jsonl', 'utf-8').split('\n').filter(l => l.trim()).length;

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

  await pool.end();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
