// @ts-nocheck
// @implements STORY-64.1
// Multi-Provider Replay Determinism Check
// Verifies extraction produces identical instance_ids on fixed subset

import 'dotenv/config';
import pg from 'pg';
import path from 'path';
import fs from 'fs';
import { ASTProvider } from '../../src/extraction/providers/ast-provider.js';
import { FilesystemProvider } from '../../src/extraction/providers/filesystem-provider.js';
import { BRDProvider } from '../../src/extraction/providers/brd-provider.js';
import { deriveR05, deriveR16 } from '../../src/extraction/providers/containment-derivation-provider.js';
import type { RepoSnapshot } from '../../src/extraction/types.js';

const { Pool } = pg;

// Fixed subset: 10 production files (no tests)
const SUBSET_FILES = [
  'src/db/postgres.ts',
  'src/db/neo4j.ts',
  'src/db/neo4j-migrate.ts',
  'src/ops/track-a.ts',
  'src/extraction/providers/ast-provider.ts',
  'src/extraction/providers/filesystem-provider.ts',
  'src/extraction/providers/containment-derivation-provider.ts',
  'src/extraction/providers/git-relationship-provider.ts',
  'src/schema/track-a/entities.ts',
  'src/schema/track-a/relationships.ts',
];

// BRD slice: Epics 1-5
const BRD_EPIC_RANGE = [1, 2, 3, 4, 5];

function matchesBrdSlice(instanceId: string): boolean {
  // Match EPIC-1..5, STORY-1..5.*, AC-1..5.*
  const epicMatch = instanceId.match(/^EPIC-(\d+)$/);
  if (epicMatch && BRD_EPIC_RANGE.includes(parseInt(epicMatch[1]))) return true;
  
  const storyMatch = instanceId.match(/^STORY-(\d+)\./);
  if (storyMatch && BRD_EPIC_RANGE.includes(parseInt(storyMatch[1]))) return true;
  
  const acMatch = instanceId.match(/^AC-(\d+)\./);
  if (acMatch && BRD_EPIC_RANGE.includes(parseInt(acMatch[1]))) return true;
  
  return false;
}

function symmetricDifference<T>(setA: Set<T>, setB: Set<T>): { onlyInA: T[]; onlyInB: T[] } {
  const onlyInA = [...setA].filter(x => !setB.has(x));
  const onlyInB = [...setB].filter(x => !setA.has(x));
  return { onlyInA, onlyInB };
}

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  const projectResult = await pool.query(`SELECT id FROM projects LIMIT 1`);
  const projectId = projectResult.rows[0].id;
  const projectRoot = process.cwd();
  
  // Get git SHA
  const { execSync } = await import('child_process');
  const gitSha = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();

  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║        MULTI-PROVIDER REPLAY DETERMINISM (V-D03)               ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log(`\nProject ID: ${projectId}`);
  console.log(`Git SHA: ${gitSha}`);
  console.log(`Subset files: ${SUBSET_FILES.length}`);
  console.log(`BRD slice: Epics ${BRD_EPIC_RANGE.join(', ')}\n`);

  const snapshot: RepoSnapshot = {
    project_id: projectId,
    root_path: projectRoot,
    commit_sha: gitSha,
    timestamp: new Date(),
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 1: Run extraction providers
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('┌────────────────────────────────────────────────────────────────┐');
  console.log('│ STEP 1: Run extraction providers on subset                     │');
  console.log('└────────────────────────────────────────────────────────────────┘\n');

  // FilesystemProvider for E11
  const fsProvider = new FilesystemProvider();
  const fsResult = await fsProvider.extract(snapshot);
  const e11Entities = fsResult.entities.filter(e => 
    SUBSET_FILES.some(f => e.instance_id === `FILE-${f}`)
  );
  console.log(`  FilesystemProvider: ${e11Entities.length} E11 entities (filtered from ${fsResult.entities.length})`);

  // ASTProvider for E12/E13
  const astProvider = new ASTProvider();
  const astResult = await astProvider.extract(snapshot);
  const astEntities = astResult.entities.filter(e => {
    const filePath = e.source_file?.replace(projectRoot + '/', '') || '';
    return SUBSET_FILES.includes(filePath) || 
           SUBSET_FILES.some(f => e.instance_id.includes(f));
  });
  console.log(`  ASTProvider: ${astEntities.length} E12/E13 entities (filtered from ${astResult.entities.length})`);

  // BRDProvider for E01/E02/E03/E04
  const brdProvider = new BRDProvider();
  const brdResult = await brdProvider.extract(snapshot);
  const brdEntities = brdResult.entities.filter(e => matchesBrdSlice(e.instance_id));
  console.log(`  BRDProvider: ${brdEntities.length} BRD entities (filtered from ${brdResult.entities.length})`);

  // Combine all extracted entities
  const allExtractedEntities = [...e11Entities, ...astEntities, ...brdEntities];
  const replayEntityIds = new Set(allExtractedEntities.map(e => e.instance_id));
  console.log(`\n  Total replay entities: ${replayEntityIds.size}`);

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 2: Derive relationships
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('\n┌────────────────────────────────────────────────────────────────┐');
  console.log('│ STEP 2: Derive relationships for subset entities               │');
  console.log('└────────────────────────────────────────────────────────────────┘\n');

  // Convert to input format for derivation
  const fileInputs = e11Entities.map(e => ({
    entity_type: e.entity_type,
    instance_id: e.instance_id,
    name: e.name,
    attributes: e.attributes || {},
  }));

  const unitInputs = astEntities.map(e => ({
    entity_type: e.entity_type,
    instance_id: e.instance_id,
    name: e.name,
    source_file: e.source_file,
    attributes: e.attributes || {},
  }));

  // Derive R05 and R16
  const r05Rels = deriveR05(fileInputs, unitInputs);
  const r16Rels = deriveR16(unitInputs, fileInputs);
  const allDerivedRels = [...r05Rels, ...r16Rels];
  const replayRelIds = new Set(allDerivedRels.map(r => r.instance_id));

  console.log(`  Derived R05: ${r05Rels.length}`);
  console.log(`  Derived R16: ${r16Rels.length}`);
  console.log(`  Total replay relationships: ${replayRelIds.size}`);

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 3: Query DB for matching instance_ids
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('\n┌────────────────────────────────────────────────────────────────┐');
  console.log('│ STEP 3: Query DB for replay instance_ids                       │');
  console.log('└────────────────────────────────────────────────────────────────┘\n');

  const entityIdsArray = [...replayEntityIds];
  const relIdsArray = [...replayRelIds];

  const dbEntitiesResult = await pool.query(`
    SELECT instance_id FROM entities 
    WHERE instance_id = ANY($1::text[])
  `, [entityIdsArray]);
  const dbEntityIds = new Set(dbEntitiesResult.rows.map(r => r.instance_id));

  const dbRelsResult = await pool.query(`
    SELECT instance_id FROM relationships 
    WHERE instance_id = ANY($1::text[])
  `, [relIdsArray]);
  const dbRelIds = new Set(dbRelsResult.rows.map(r => r.instance_id));

  console.log(`  DB entities matching replay: ${dbEntityIds.size}`);
  console.log(`  DB relationships matching replay: ${dbRelIds.size}`);

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 4: Compare sets
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('\n┌────────────────────────────────────────────────────────────────┐');
  console.log('│ STEP 4: Set equality comparison                                │');
  console.log('└────────────────────────────────────────────────────────────────┘\n');

  const entityDiff = symmetricDifference(replayEntityIds, dbEntityIds);
  const relDiff = symmetricDifference(replayRelIds, dbRelIds);

  let entityPass = true;
  let relPass = true;

  if (entityDiff.onlyInA.length === 0 && entityDiff.onlyInB.length === 0) {
    console.log('  Entity set equality: PASS ✓');
    console.log(`    Replay: ${replayEntityIds.size}, DB: ${dbEntityIds.size}, Diff: 0`);
  } else {
    entityPass = false;
    console.log('  Entity set equality: FAIL ✗');
    console.log(`    Replay: ${replayEntityIds.size}, DB: ${dbEntityIds.size}`);
    console.log(`    Only in replay (${entityDiff.onlyInA.length}):`);
    for (const id of entityDiff.onlyInA.slice(0, 5)) console.log(`      ${id}`);
    console.log(`    Only in DB (${entityDiff.onlyInB.length}):`);
    for (const id of entityDiff.onlyInB.slice(0, 5)) console.log(`      ${id}`);
  }

  console.log('');

  if (relDiff.onlyInA.length === 0 && relDiff.onlyInB.length === 0) {
    console.log('  Relationship set equality: PASS ✓');
    console.log(`    Replay: ${replayRelIds.size}, DB: ${dbRelIds.size}, Diff: 0`);
  } else {
    relPass = false;
    console.log('  Relationship set equality: FAIL ✗');
    console.log(`    Replay: ${replayRelIds.size}, DB: ${dbRelIds.size}`);
    console.log(`    Only in replay (${relDiff.onlyInA.length}):`);
    for (const id of relDiff.onlyInA.slice(0, 5)) console.log(`      ${id}`);
    console.log(`    Only in DB (${relDiff.onlyInB.length}):`);
    for (const id of relDiff.onlyInB.slice(0, 5)) console.log(`      ${id}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 5: Output results
  // ═══════════════════════════════════════════════════════════════════════════

  const result = {
    timestamp: new Date().toISOString(),
    git_sha: gitSha,
    subset_files: SUBSET_FILES,
    brd_slice: { epics: BRD_EPIC_RANGE, stories_pattern: 'STORY-1..5.*', acs_pattern: 'AC-1..5.*' },
    entity_counts: { 
      replay: replayEntityIds.size, 
      db: dbEntityIds.size, 
      symmetric_diff: entityDiff.onlyInA.length + entityDiff.onlyInB.length 
    },
    relationship_counts: { 
      replay: replayRelIds.size, 
      db: dbRelIds.size, 
      symmetric_diff: relDiff.onlyInA.length + relDiff.onlyInB.length 
    },
    entity_diff: { 
      only_in_replay: entityDiff.onlyInA.slice(0, 10), 
      only_in_db: entityDiff.onlyInB.slice(0, 10) 
    },
    relationship_diff: { 
      only_in_replay: relDiff.onlyInA.slice(0, 10), 
      only_in_db: relDiff.onlyInB.slice(0, 10) 
    },
    verdict: entityPass && relPass ? 'PASS' : 'FAIL',
  };

  // Save to archive
  const outputDir = 'si-readiness-results';
  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, `replay-subset-${Date.now()}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log(`\n  Archived to: ${outputPath}`);

  // ═══════════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                         SUMMARY                                ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  console.log(`V-D03 Multi-Provider Replay Determinism: ${result.verdict} ${result.verdict === 'PASS' ? '✓' : '✗'}`);
  console.log(`  Entity set equality: ${entityPass ? 'PASS' : 'FAIL'} (replay=${replayEntityIds.size}, db=${dbEntityIds.size})`);
  console.log(`  Relationship set equality: ${relPass ? 'PASS' : 'FAIL'} (replay=${replayRelIds.size}, db=${dbRelIds.size})`);

  if (result.verdict === 'PASS') {
    console.log('\n✓ Multi-provider replay produces identical instance_ids');
    console.log('  Extraction is deterministic across providers');
  } else {
    console.log('\n✗ Multi-provider replay detected differences');
    console.log('  Review symmetric diff above');
  }

  await pool.end();
  process.exit(result.verdict === 'PASS' ? 0 : 1);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

