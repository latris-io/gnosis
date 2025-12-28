#!/usr/bin/env npx tsx
// Quick test to verify epoch fields are being added to ledger entries
import 'dotenv/config';
import { startEpoch, completeEpoch, getCurrentEpoch } from '../src/ledger/epoch-service.js';
import { getProjectLedger } from '../src/ledger/shadow-ledger.js';

const PROJECT_ID = process.env.PROJECT_ID;

if (!PROJECT_ID) {
  console.error('PROJECT_ID required');
  process.exit(1);
}

async function test() {
  console.log('1. Starting epoch...');
  const epoch = await startEpoch(PROJECT_ID);
  console.log('   Epoch ID:', epoch.epoch_id);
  console.log('   Repo SHA:', epoch.repo_sha);
  console.log('   BRD Hash:', epoch.brd_hash);
  
  console.log('\n2. Verifying getCurrentEpoch()...');
  const current = getCurrentEpoch();
  console.log('   Current epoch:', current?.epoch_id ?? 'NULL');
  
  console.log('\n3. Getting project ledger...');
  const ledger = getProjectLedger(PROJECT_ID);
  
  console.log('\n4. Logging test decision entry...');
  await ledger.logDecision({
    decision: 'TDD_COHERENCE_OK',
    marker_type: 'tdd',
    target_id: 'TEST-EPOCH-CHECK',
    source_entity_id: 'FILE-test-epoch.ts',
    source_file: 'test-epoch.ts',
    line_start: 1,
    line_end: 1,
    project_id: PROJECT_ID,
  });
  console.log('   Logged decision entry');
  
  console.log('\n5. Reading back last entry to verify V11 fields...');
  const entries = await ledger.getEntries();
  const lastEntry = entries[entries.length - 1];
  console.log('   Last entry:');
  console.log('   - epoch_id:', lastEntry.epoch_id ?? 'MISSING');
  console.log('   - repo_sha:', lastEntry.repo_sha ?? 'MISSING');
  console.log('   - runner_sha:', (lastEntry as any).runner_sha ?? 'MISSING');
  console.log('   - brd_hash:', (lastEntry as any).brd_hash ?? 'MISSING');
  console.log('   - kind:', lastEntry.kind ?? 'MISSING');
  
  const hasAllV11Fields = 
    lastEntry.epoch_id && 
    lastEntry.repo_sha && 
    (lastEntry as any).runner_sha && 
    (lastEntry as any).brd_hash;
  
  console.log('\n6. Completing epoch...');
  await completeEpoch();
  
  console.log('\n========================================');
  if (hasAllV11Fields) {
    console.log('✓ V11 FIELDS PRESENT - Epoch context is working!');
  } else {
    console.log('✗ V11 FIELDS MISSING - Epoch context NOT working');
    process.exit(1);
  }
}

test().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});

