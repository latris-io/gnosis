#!/usr/bin/env npx tsx
// Quick test script to verify R36/R37 extraction
// Run: npx tsx scripts/test-r36-r37.ts

import 'dotenv/config';
import { extractAndPersistTestRelationships } from '../src/ops/track-a.js';
import { rlsQuery } from '../test/utils/rls.js';
import { astProvider } from '../src/extraction/providers/ast-provider.js';
import { batchCreateEntities } from '../src/api/v1/entities.js';
import type { RepoSnapshot } from '../src/extraction/types.js';

async function main() {
  const projectId = process.env.PROJECT_ID;
  if (!projectId) {
    console.error('PROJECT_ID required');
    process.exit(1);
  }

  console.log('=== R36/R37 Extraction Test ===\n');
  console.log(`Project: ${projectId}\n`);

  // Step 0: Re-extract E28/E29 entities to pick up modified test file
  console.log('--- Step 0: Re-extract entities from test files ---');
  const snapshot: RepoSnapshot = {
    id: 'r36-r37-test-' + Date.now(),
    root_path: process.cwd(),
    timestamp: new Date(),
  };
  
  const astResult = await astProvider.extract(snapshot);
  const e28s = astResult.entities.filter(e => e.entity_type === 'E28');
  const e29s = astResult.entities.filter(e => e.entity_type === 'E29');
  console.log(`Extracted: ${e28s.length} E28, ${e29s.length} E29`);
  
  // Show any with STORY-/AC- pattern
  const matchE28 = e28s.filter(e => /STORY-\d+\.\d+/.test(e.name));
  const matchE29 = e29s.filter(e => /AC-\d+\.\d+\.\d+/.test(e.name));
  console.log(`Pattern matches: ${matchE28.length} E28 with STORY-, ${matchE29.length} E29 with AC-`);
  
  if (matchE28.length > 0 || matchE29.length > 0) {
    console.log('Found matching patterns:');
    matchE28.forEach(e => console.log(`  E28: ${e.name}`));
    matchE29.forEach(e => console.log(`  E29: ${e.name}`));
    
    // Persist the entities to database (upsert)
    console.log('\nPersisting extracted entities...');
    const allEntities = [...e28s, ...e29s];
    await batchCreateEntities(projectId, allEntities);
    console.log(`Persisted ${allEntities.length} entities`);
  } else {
    console.log('⚠️ No STORY-/AC- patterns found in extracted entities');
  }

  // Check E28/E29 counts first
  console.log('--- Entity Counts (pre-requisites) ---');
  const e28 = await rlsQuery(projectId, `
    SELECT COUNT(*) as count FROM entities WHERE entity_type = 'E28'
  `);
  const e29 = await rlsQuery(projectId, `
    SELECT COUNT(*) as count FROM entities WHERE entity_type = 'E29'
  `);
  const e02 = await rlsQuery(projectId, `
    SELECT COUNT(*) as count FROM entities WHERE entity_type = 'E02'
  `);
  const e03 = await rlsQuery(projectId, `
    SELECT COUNT(*) as count FROM entities WHERE entity_type = 'E03'
  `);
  console.log(`E28 TestSuite: ${e28[0].count}`);
  console.log(`E29 TestCase: ${e29[0].count}`);
  console.log(`E02 Story: ${e02[0].count}`);
  console.log(`E03 AC: ${e03[0].count}`);

  // Check for matching patterns in E28/E29 entities
  console.log('\n--- Pattern Matching Check ---');
  const matchingSuites = await rlsQuery(projectId, `
    SELECT instance_id, name FROM entities 
    WHERE entity_type = 'E28' AND name LIKE '%STORY-%'
    LIMIT 5
  `);
  const matchingCases = await rlsQuery(projectId, `
    SELECT instance_id, name FROM entities 
    WHERE entity_type = 'E29' AND name LIKE '%AC-%'
    LIMIT 5
  `);
  console.log(`E28 suites with STORY- pattern: ${matchingSuites.length}`);
  matchingSuites.forEach((s: any) => console.log(`  - ${s.name}`));
  console.log(`E29 cases with AC- pattern: ${matchingCases.length}`);
  matchingCases.forEach((s: any) => console.log(`  - ${s.name}`));

  // Run extraction
  console.log('Running extraction...');
  const result = await extractAndPersistTestRelationships(projectId);
  console.log('Extraction result:', result);

  // Query counts
  console.log('\n--- Database Counts ---');
  const r36 = await rlsQuery(projectId, `
    SELECT COUNT(*) as count FROM relationships WHERE relationship_type = 'R36'
  `);
  const r37 = await rlsQuery(projectId, `
    SELECT COUNT(*) as count FROM relationships WHERE relationship_type = 'R37'
  `);

  console.log(`R36 (TESTED_BY): ${r36[0].count}`);
  console.log(`R37 (VERIFIED_BY): ${r37[0].count}`);

  // Show some samples if they exist
  if (parseInt(r36[0].count) > 0) {
    console.log('\n--- R36 Samples ---');
    const samples = await rlsQuery(projectId, `
      SELECT r.instance_id, r.name
      FROM relationships r WHERE r.relationship_type = 'R36' LIMIT 3
    `);
    samples.forEach((s: any) => console.log(`  ${s.instance_id}`));
  }

  if (parseInt(r37[0].count) > 0) {
    console.log('\n--- R37 Samples ---');
    const samples = await rlsQuery(projectId, `
      SELECT r.instance_id, r.name
      FROM relationships r WHERE r.relationship_type = 'R37' LIMIT 3
    `);
    samples.forEach((s: any) => console.log(`  ${s.instance_id}`));
  }

  // Summary
  console.log('\n=== Summary ===');
  const total = parseInt(r36[0].count) + parseInt(r37[0].count);
  if (total > 0) {
    console.log(`✓ R36/R37 extraction WORKS - ${total} relationships found`);
  } else {
    console.log('✗ R36/R37 count is 0 - no patterns matched');
  }

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

