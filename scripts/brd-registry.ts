#!/usr/bin/env npx tsx
/**
 * BRD Registry CLI
 * Track B-owned BRD registry management
 * 
 * @g-api-exception TRACK_B_OWNED
 * 
 * Commands:
 *   build  - Create/update registry from BRD
 *   check  - Check for drift against stored baseline
 *   gate   - Evaluate G-REGISTRY gate
 * 
 * Usage:
 *   npx tsx scripts/brd-registry.ts build
 *   npx tsx scripts/brd-registry.ts check
 *   npx tsx scripts/brd-registry.ts gate
 */

import {
  buildRegistry,
  checkRegistry,
  evaluateGRegistryGate,
  EXPECTED_BRD_VERSION,
  BRD_PATH,
  REGISTRY_PATH,
  EVIDENCE_PATH,
} from '../src/services/track_b/brd-registry/index.js';

async function main() {
  const command = process.argv[2];
  
  if (!command || !['build', 'check', 'gate'].includes(command)) {
    console.log(`
BRD Registry CLI

Commands:
  build  - Create/update registry from BRD
  check  - Check for drift against stored baseline
  gate   - Evaluate G-REGISTRY gate

Usage:
  npx tsx scripts/brd-registry.ts build
  npx tsx scripts/brd-registry.ts check
  npx tsx scripts/brd-registry.ts gate

Configuration:
  Expected BRD version: ${EXPECTED_BRD_VERSION}
  BRD path: ${BRD_PATH}
  Registry path: ${REGISTRY_PATH}
  Evidence path: ${EVIDENCE_PATH}
`);
    process.exit(command ? 1 : 0);
  }
  
  console.log(`\n=== BRD Registry: ${command.toUpperCase()} ===\n`);
  console.log(`BRD Path: ${BRD_PATH}`);
  console.log(`Expected Version: ${EXPECTED_BRD_VERSION}`);
  console.log('');
  
  try {
    switch (command) {
      case 'build': {
        console.log('Building registry from BRD...');
        const registry = await buildRegistry();
        
        console.log('\n--- Registry Built ---');
        console.log(`Version: ${registry.brd_version}`);
        console.log(`Content Hash: ${registry.brd_content_hash}`);
        console.log(`Blob Hash: ${registry.brd_blob_hash} (${registry.brd_blob_source})`);
        console.log(`Counts: ${registry.counts.epics} epics, ${registry.counts.stories} stories, ${registry.counts.acs} ACs`);
        console.log(`\nRegistry saved to: ${REGISTRY_PATH}`);
        break;
      }
      
      case 'check': {
        console.log('Checking registry for drift...');
        const result = await checkRegistry();
        
        console.log('\n--- Check Result ---');
        console.log(`Matches baseline: ${result.matches ? 'YES' : 'NO'}`);
        
        if (!result.stored) {
          console.log('Note: No stored baseline found (first run)');
        }
        
        if (result.discrepancies.length > 0) {
          console.log(`\nDiscrepancies found: ${result.discrepancies.length}`);
          for (const d of result.discrepancies) {
            console.log(`  - [${d.type}] ${d.details}`);
          }
        } else {
          console.log('No discrepancies found.');
        }
        
        console.log(`\nCurrent counts: ${result.current.counts.epics}/${result.current.counts.stories}/${result.current.counts.acs}`);
        break;
      }
      
      case 'gate': {
        console.log('Evaluating G-REGISTRY gate...');
        const result = await evaluateGRegistryGate();
        
        console.log('\n--- Gate Result ---');
        console.log(`Gate: ${result.gate}`);
        console.log(`Scope: ${result.scope}`);
        console.log(`Result: ${result.pass ? 'PASS ✓' : 'FAIL ✗'}`);
        
        console.log('\nChecks:');
        console.log(`  BRD parsed: ${result.checks.brd_parsed ? '✓' : '✗'}`);
        console.log(`  Version matches: ${result.checks.version_matches ? '✓' : '✗'}`);
        console.log(`  Hash computed: ${result.checks.hash_computed ? '✓' : '✗'}`);
        console.log(`  Internal consistency: ${result.checks.internal_consistency ? '✓' : '✗'}`);
        console.log(`  Drift check: ${result.checks.drift_check_passed ? '✓' : '✗'}`);
        console.log(`  Graph comparison: DEFERRED (${result.graph_comparison.deferred_to})`);
        
        console.log(`\nCounts: ${result.counts.epics}/${result.counts.stories}/${result.counts.acs}`);
        
        if (result.discrepancies.length > 0) {
          console.log(`\nDiscrepancies: ${result.discrepancies.length}`);
          for (const d of result.discrepancies) {
            console.log(`  - [${d.type}] ${d.details}`);
          }
        }
        
        console.log(`\n${result.summary}`);
        console.log(`\nEvidence written to: ${EVIDENCE_PATH}`);
        
        // Exit with appropriate code
        process.exit(result.pass ? 0 : 1);
      }
    }
    
    console.log('\n=== Done ===\n');
    
  } catch (error) {
    console.error('\nError:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();

