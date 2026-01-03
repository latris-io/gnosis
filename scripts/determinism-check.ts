// @ts-nocheck
// Determinism Micro-Check for A1-V2 and A2-V5
// Uses REAL extraction logic, not reconstructed parsers

import 'dotenv/config';
import pg from 'pg';
import path from 'path';
import { ASTProvider } from '../src/extraction/providers/ast-provider.js';
import { FilesystemProvider } from '../src/extraction/providers/filesystem-provider.js';
import { deriveR05, deriveR16 } from '../src/extraction/providers/containment-derivation-provider.js';
import type { RepoSnapshot } from '../src/extraction/types.js';

const { Pool } = pg;

const TEST_FILE = 'src/db/postgres.ts';

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  // Get project ID
  const projectResult = await pool.query(`SELECT id FROM projects LIMIT 1`);
  const projectId = projectResult.rows[0].id;

  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║        DETERMINISM MICRO-CHECK (REAL PROVIDERS)                ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log(`\nTest file: ${TEST_FILE}`);
  console.log(`Project ID: ${projectId}\n`);

  // ═══════════════════════════════════════════════════════════════════════════
  // A1-V2: Entity Determinism (using REAL ASTProvider)
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('┌────────────────────────────────────────────────────────────────┐');
  console.log('│ A1-V2: Entity Determinism (REAL ASTProvider.extract())         │');
  console.log('└────────────────────────────────────────────────────────────────┘\n');

  // Step 1: Capture current entity IDs from DB for this file
  console.log('Step 1: Capture current entity IDs from DB...');
  const currentEntities = await pool.query(`
    SELECT instance_id, entity_type, name
    FROM entities
    WHERE source_file LIKE $1
    ORDER BY instance_id;
  `, [`%/${TEST_FILE}%`]);

  console.log(`  Found ${currentEntities.rows.length} entities in DB for ${TEST_FILE}`);
  const dbEntityIds = new Set(currentEntities.rows.map(e => e.instance_id));

  // Step 2: Run REAL providers (FilesystemProvider for E11, ASTProvider for E12/E13)
  console.log('\nStep 2: Run REAL providers...');
  const projectRoot = process.cwd();
  
  const snapshot: RepoSnapshot = {
    project_id: projectId,
    root_path: projectRoot,
    commit_sha: 'determinism-check',
    timestamp: new Date(),
  };
  
  // FilesystemProvider extracts E11 (SourceFile)
  const fsProvider = new FilesystemProvider();
  const fsResult = await fsProvider.extract(snapshot);
  
  // ASTProvider extracts E12 (Function) and E13 (Class)
  const astProvider = new ASTProvider();
  const astResult = await astProvider.extract(snapshot);
  
  // Combine all extracted entities
  const allExtracted = [...fsResult.entities, ...astResult.entities];
  
  // Filter to just the test file
  const fullTestPath = path.resolve(projectRoot, TEST_FILE);
  const extractedForFile = allExtracted.filter(e => 
    e.source_file === fullTestPath || 
    e.instance_id.includes(TEST_FILE)
  );
  
  console.log(`  FilesystemProvider: ${fsResult.entities.length} entities (E11)`);
  console.log(`  ASTProvider: ${astResult.entities.length} entities (E12/E13)`);
  console.log(`  Filtered to ${TEST_FILE}: ${extractedForFile.length} entities`);
  
  const extractedEntityIds = new Set(extractedForFile.map(e => e.instance_id));

  // Step 3: Compare
  console.log('\nStep 3: Compare instance_ids...');
  
  const onlyInDb = [...dbEntityIds].filter(id => !extractedEntityIds.has(id));
  const onlyInExtraction = [...extractedEntityIds].filter(id => !dbEntityIds.has(id));
  
  let a1Pass = true;
  if (onlyInDb.length === 0 && onlyInExtraction.length === 0) {
    console.log('  ✓ All instance_ids match exactly');
    console.log('\n  Sample from REAL provider:');
    for (const e of extractedForFile.slice(0, 3)) {
      console.log(`    ${e.entity_type} ${e.name} → ${e.instance_id}`);
    }
  } else {
    a1Pass = false;
    console.log('  ✗ Mismatch detected');
    if (onlyInDb.length > 0) {
      console.log(`  Only in DB (${onlyInDb.length}):`);
      for (const id of onlyInDb) {
        console.log(`    ${id}`);
      }
    }
    if (onlyInExtraction.length > 0) {
      console.log(`  Only in extraction (${onlyInExtraction.length}):`);
      for (const id of onlyInExtraction) {
        console.log(`    ${id}`);
      }
    }
  }
  
  console.log(`\n  A1-V2: ${a1Pass ? 'PASS ✓' : 'FAIL ✗'}`);
  console.log(`  (Used real FilesystemProvider + ASTProvider codepaths)`);

  // ═══════════════════════════════════════════════════════════════════════════
  // A2-V5: Relationship Determinism (using REAL derivation functions)
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('\n┌────────────────────────────────────────────────────────────────┐');
  console.log('│ A2-V5: Relationship Determinism (REAL deriveR05/deriveR16)     │');
  console.log('└────────────────────────────────────────────────────────────────┘\n');

  // Step 1: Capture current relationship IDs from DB
  console.log('Step 1: Capture current relationship IDs from DB...');
  const currentRels = await pool.query(`
    SELECT instance_id, relationship_type
    FROM relationships
    WHERE source_file LIKE $1
      AND relationship_type IN ('R05','R16')
    ORDER BY instance_id;
  `, [`%/${TEST_FILE}%`]);

  console.log(`  Found ${currentRels.rows.length} relationships in DB`);
  const dbRelIds = new Set(currentRels.rows.map(r => r.instance_id));

  // Step 2: Re-derive relationships using REAL functions
  console.log('\nStep 2: Re-derive using REAL deriveR05/deriveR16...');
  
  // Get entities from DB for derivation context
  const sourceFiles = await pool.query(`
    SELECT instance_id, entity_type, name, attributes
    FROM entities
    WHERE entity_type = 'E11'
      AND source_file LIKE $1;
  `, [`%/${TEST_FILE}%`]);
  
  const functionsClasses = await pool.query(`
    SELECT instance_id, entity_type, name, source_file, attributes
    FROM entities
    WHERE entity_type IN ('E12', 'E13')
      AND source_file LIKE $1;
  `, [`%/${TEST_FILE}%`]);

  // Convert to EntityInput format (same as production)
  const fileInputs = sourceFiles.rows.map(r => ({
    entity_type: r.entity_type,
    instance_id: r.instance_id,
    name: r.name,
    attributes: r.attributes || {},
  }));

  const unitInputs = functionsClasses.rows.map(r => ({
    entity_type: r.entity_type,
    instance_id: r.instance_id,
    name: r.name,
    source_file: r.source_file,
    attributes: r.attributes || {},
  }));

  // Use REAL derivation functions
  const r05Rels = deriveR05(fileInputs, unitInputs);
  const r16Rels = deriveR16(unitInputs, fileInputs);
  const allDerivedRels = [...r05Rels, ...r16Rels];

  console.log(`  Derived ${allDerivedRels.length} relationships using real functions`);
  const derivedRelIds = new Set(allDerivedRels.map(r => r.instance_id));

  // Step 3: Compare
  console.log('\nStep 3: Compare instance_ids...');
  
  const relsOnlyInDb = [...dbRelIds].filter(id => !derivedRelIds.has(id));
  const relsOnlyInDerivation = [...derivedRelIds].filter(id => !dbRelIds.has(id));
  
  let a2Pass = true;
  if (relsOnlyInDb.length === 0 && relsOnlyInDerivation.length === 0) {
    console.log('  ✓ All instance_ids match exactly');
    console.log('\n  Sample from REAL derivation:');
    for (const r of allDerivedRels.slice(0, 3)) {
      console.log(`    ${r.relationship_type} → ${r.instance_id}`);
    }
  } else {
    a2Pass = false;
    console.log('  ✗ Mismatch detected');
    if (relsOnlyInDb.length > 0) {
      console.log(`  Only in DB (${relsOnlyInDb.length}):`);
      for (const id of relsOnlyInDb) {
        console.log(`    ${id}`);
      }
    }
    if (relsOnlyInDerivation.length > 0) {
      console.log(`  Only in derivation (${relsOnlyInDerivation.length}):`);
      for (const id of relsOnlyInDerivation) {
        console.log(`    ${id}`);
      }
    }
  }
  
  console.log(`\n  A2-V5: ${a2Pass ? 'PASS ✓' : 'FAIL ✗'}`);
  console.log(`  (Used real deriveR05/deriveR16 from containment-derivation-provider.ts)`);

  // ═══════════════════════════════════════════════════════════════════════════
  // Summary
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                         SUMMARY                                ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  console.log(`A1-V2 Entity Determinism:       ${a1Pass ? 'PASS ✓' : 'FAIL ✗'}`);
  console.log(`  Providers: FilesystemProvider (E11) + ASTProvider (E12/E13)`);
  console.log(`  Paths: src/extraction/providers/filesystem-provider.ts`);
  console.log(`         src/extraction/providers/ast-provider.ts`);
  
  console.log(`\nA2-V5 Relationship Determinism: ${a2Pass ? 'PASS ✓' : 'FAIL ✗'}`);
  console.log(`  Functions: deriveR05(), deriveR16()`);
  console.log(`  Path: src/extraction/providers/containment-derivation-provider.ts`);
  
  if (a1Pass && a2Pass) {
    console.log('\n✓ Determinism verified using REAL extraction codepaths');
    console.log('  Instance IDs are stable and reproducible');
  }

  await pool.end();
  process.exit(a1Pass && a2Pass ? 0 : 1);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

