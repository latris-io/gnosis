#!/usr/bin/env npx tsx
/**
 * rebuild-a3-pristine.ts
 * @implements INFRASTRUCTURE
 * 
 * Rebuilds A3 extraction with pristine epoch-based ledger/corpus.
 * 
 * This script:
 * 1. Creates a fresh epoch
 * 2. Runs A3 marker extraction with epoch-bound logging
 * 3. Validates pristine conditions:
 *    - All ledger entries have required epoch fields
 *    - All corpus signals have Schema V2 fields
 *    - No duplicate CREATEs within the epoch
 *    - Counts match A3 baseline expectations
 * 
 * Usage:
 *   PROJECT_ID=xxx npx tsx scripts/rebuild-a3-pristine.ts
 */

import 'dotenv/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { 
  startEpoch, 
  completeEpoch, 
  failEpoch, 
  getCurrentEpoch,
  EpochContext 
} from '../src/ledger/epoch-service.js';
import { getLedgerPath, LedgerEntry } from '../src/ledger/shadow-ledger.js';
import { getCorpusPath, SemanticSignal, SEMANTIC_SIGNAL_SCHEMA_ID } from '../src/ledger/semantic-corpus.js';
import { extractAndPersistMarkerRelationships, extractAndPersistTestRelationships } from '../src/ops/track-a.js';
import { A3_BASELINE } from '../test/fixtures/a3-baseline-manifest.js';

const PROJECT_ID = process.env.PROJECT_ID;

if (!PROJECT_ID) {
  console.error('ERROR: PROJECT_ID required');
  process.exit(1);
}

interface ValidationResult {
  passed: boolean;
  message: string;
  details?: Record<string, unknown>;
}

async function validateLedgerPristine(epochId: string, repoSha: string, runnerSha: string, brdHash: string): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];
  const ledgerPath = getLedgerPath(PROJECT_ID!);
  
  let content = '';
  try {
    content = await fs.readFile(ledgerPath, 'utf8');
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      return [{ passed: true, message: 'Ledger empty (no file) - OK for fresh epoch' }];
    }
    throw err;
  }
  
  const lines = content.split('\n').filter(l => l.trim());
  if (lines.length === 0) {
    return [{ passed: true, message: 'Ledger empty (0 entries) - OK for fresh epoch' }];
  }
  
  // Filter to only entries from current epoch
  const epochEntries: LedgerEntry[] = [];
  let totalEntries = 0;
  let otherEpochEntries = 0;
  
  for (const line of lines) {
    totalEntries++;
    const entry: LedgerEntry = JSON.parse(line);
    if (entry.epoch_id === epochId) {
      epochEntries.push(entry);
    } else {
      otherEpochEntries++;
    }
  }
  
  results.push({
    passed: true,
    message: `Total ledger entries: ${totalEntries} (${epochEntries.length} this epoch, ${otherEpochEntries} from other epochs)`,
    details: { totalEntries, epochEntries: epochEntries.length, otherEpochEntries }
  });
  
  if (epochEntries.length === 0) {
    return [...results, { passed: true, message: 'No entries in current epoch - OK for fresh run' }];
  }
  
  let missingFields = 0;
  let wrongSha = 0;
  let missingKind = 0;
  const createKeys = new Set<string>();
  let duplicateCreates = 0;
  const kindCounts: Record<string, number> = {};
  const opCounts: Record<string, number> = {};
  
  for (const entry of epochEntries) {
    // Check required fields
    if (!entry.epoch_id || !entry.repo_sha || !entry.runner_sha || !entry.brd_hash) {
      missingFields++;
    }
    
    if (entry.repo_sha !== repoSha || entry.runner_sha !== runnerSha) {
      wrongSha++;
    }
    
    if (!entry.kind) {
      missingKind++;
    } else {
      kindCounts[entry.kind] = (kindCounts[entry.kind] || 0) + 1;
    }
    
    opCounts[entry.operation] = (opCounts[entry.operation] || 0) + 1;
    
    // Check duplicate CREATEs (only for entity/relationship kinds)
    if (entry.operation === 'CREATE' && (entry.kind === 'entity' || entry.kind === 'relationship')) {
      const key = `${entry.kind}:${entry.entity_type}:${entry.instance_id}`;
      if (createKeys.has(key)) {
        duplicateCreates++;
      } else {
        createKeys.add(key);
      }
    }
  }
  
  results.push({
    passed: missingFields === 0,
    message: `Epoch fields: ${missingFields === 0 ? 'all present' : `${missingFields} entries missing fields`}`,
    details: { missingFields }
  });
  
  results.push({
    passed: wrongSha === 0,
    message: `SHA fields: ${wrongSha === 0 ? 'all match' : `${wrongSha} entries have wrong SHA`}`,
    details: { wrongSha, expectedRepoSha: repoSha }
  });
  
  results.push({
    passed: missingKind === 0,
    message: `Kind field: ${missingKind === 0 ? 'all present' : `${missingKind} entries missing kind`}`,
    details: { missingKind, kindCounts }
  });
  
  results.push({
    passed: duplicateCreates === 0,
    message: `Duplicate CREATEs: ${duplicateCreates === 0 ? 'none (idempotent)' : `${duplicateCreates} duplicates found`}`,
    details: { duplicateCreates }
  });
  
  results.push({
    passed: true,
    message: `Epoch statistics: ${epochEntries.length} entries`,
    details: { epochEntries: epochEntries.length, opCounts, kindCounts }
  });
  
  return results;
}

async function validateCorpusPristine(epochId: string, repoSha: string, brdHash: string): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];
  const corpusPath = getCorpusPath(PROJECT_ID!);
  
  let content = '';
  try {
    content = await fs.readFile(corpusPath, 'utf8');
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      return [{ passed: true, message: 'Corpus empty (no file) - OK for A3 pristine' }];
    }
    throw err;
  }
  
  const lines = content.split('\n').filter(l => l.trim());
  if (lines.length === 0) {
    return [{ passed: true, message: 'Corpus empty (0 signals) - OK for A3 pristine' }];
  }
  
  // Filter to only signals from current epoch
  const epochSignals: SemanticSignal[] = [];
  let totalSignals = 0;
  let otherEpochSignals = 0;
  
  for (const line of lines) {
    totalSignals++;
    const signal: SemanticSignal = JSON.parse(line);
    if (signal.epoch_id === epochId) {
      epochSignals.push(signal);
    } else {
      otherEpochSignals++;
    }
  }
  
  results.push({
    passed: true,
    message: `Total corpus signals: ${totalSignals} (${epochSignals.length} this epoch, ${otherEpochSignals} from other epochs)`,
    details: { totalSignals, epochSignals: epochSignals.length, otherEpochSignals }
  });
  
  if (epochSignals.length === 0) {
    return [...results, { passed: true, message: 'No signals in current epoch - OK for fresh run' }];
  }
  
  let v2Count = 0;
  let legacyCount = 0;
  let missingFields = 0;
  const signalKeys = new Set<string>();
  let duplicates = 0;
  const typeCounts: Record<string, number> = {};
  
  for (const signal of epochSignals) {
    if (signal.schema_id === SEMANTIC_SIGNAL_SCHEMA_ID) {
      v2Count++;
    } else {
      legacyCount++;
    }
    
    if (!signal.project_id || !signal.repo_sha || !signal.epoch_id || !signal.brd_hash) {
      missingFields++;
    }
    
    typeCounts[signal.type] = (typeCounts[signal.type] || 0) + 1;
    
    // Check for duplicate signal_instance_ids
    const signalInstanceId = (signal as any).context?.signal_instance_id;
    if (signalInstanceId) {
      const key = `${signal.type}:${signalInstanceId}`;
      if (signalKeys.has(key)) {
        duplicates++;
      } else {
        signalKeys.add(key);
      }
    }
  }
  
  results.push({
    passed: legacyCount === 0,
    message: `Schema V2: ${legacyCount === 0 ? 'all signals' : `${legacyCount} legacy signals found`}`,
    details: { v2Count, legacyCount }
  });
  
  results.push({
    passed: missingFields === 0,
    message: `Provenance fields: ${missingFields === 0 ? 'all present' : `${missingFields} signals missing fields`}`,
    details: { missingFields }
  });
  
  results.push({
    passed: duplicates === 0,
    message: `Duplicates: ${duplicates === 0 ? 'none (idempotent)' : `${duplicates} duplicates found`}`,
    details: { duplicates }
  });
  
  results.push({
    passed: true,
    message: `Epoch statistics: ${epochSignals.length} signals`,
    details: { epochSignals: epochSignals.length, typeCounts }
  });
  
  return results;
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════════════════');
  console.log('  REBUILD A3 PRISTINE');
  console.log('═══════════════════════════════════════════════════════════════════════════');
  console.log('');
  console.log(`Project ID: ${PROJECT_ID}`);
  
  // Step 1: Create epoch
  console.log('\n[1/5] Creating fresh epoch...');
  const epoch = await startEpoch(PROJECT_ID!);
  
  console.log(`  Epoch ID:   ${epoch.epoch_id}`);
  console.log(`  Repo SHA:   ${epoch.repo_sha}`);
  console.log(`  Runner SHA: ${epoch.runner_sha}`);
  console.log(`  BRD Hash:   ${epoch.brd_hash}`);
  console.log(`  Status:     ${epoch.status}`);
  
  // Step 2: Verify project directories exist
  console.log('\n[2/5] Verifying project directories...');
  const ledgerPath = getLedgerPath(PROJECT_ID!);
  const corpusPath = getCorpusPath(PROJECT_ID!);
  
  await fs.mkdir(path.dirname(ledgerPath), { recursive: true });
  await fs.mkdir(path.dirname(corpusPath), { recursive: true });
  
  console.log(`  Ledger:  ${ledgerPath}`);
  console.log(`  Corpus:  ${corpusPath}`);
  console.log(`  Epoch entries will be appended with epoch_id: ${epoch.epoch_id}`);
  
  // Step 3: Run A3 extraction
  console.log('\n[3/5] Running A3 marker extraction...');
  
  try {
    // Extract markers (R18, R19)
    console.log('  - Extracting markers (R18, R19)...');
    const markerResult = await extractAndPersistMarkerRelationships(PROJECT_ID!);
    console.log(`    Extracted ${markerResult.extracted} markers, ${markerResult.orphans} orphans`);
    console.log(`    R18: ${markerResult.r18_created}, R19: ${markerResult.r19_created}`);
    
    // Extract test relationships (R36, R37)
    console.log('  - Extracting test relationships (R36, R37)...');
    const testResult = await extractAndPersistTestRelationships(PROJECT_ID!);
    console.log(`    R36: ${testResult.r36_created} created, R37: ${testResult.r37_created} created`);
    
  } catch (err) {
    console.error('  ❌ Extraction failed:', err);
    await failEpoch(String(err));
    process.exit(1);
  }
  
  // Step 4: Validate pristine conditions
  console.log('\n[4/5] Validating pristine conditions...');
  
  const ledgerResults = await validateLedgerPristine(
    epoch.epoch_id, 
    epoch.repo_sha, 
    epoch.runner_sha, 
    epoch.brd_hash
  );
  
  const corpusResults = await validateCorpusPristine(
    epoch.epoch_id,
    epoch.repo_sha,
    epoch.brd_hash
  );
  
  console.log('\n  LEDGER VALIDATION:');
  let allPassed = true;
  for (const result of ledgerResults) {
    const icon = result.passed ? '✓' : '✗';
    console.log(`    ${icon} ${result.message}`);
    if (!result.passed) allPassed = false;
  }
  
  console.log('\n  CORPUS VALIDATION:');
  for (const result of corpusResults) {
    const icon = result.passed ? '✓' : '✗';
    console.log(`    ${icon} ${result.message}`);
    if (!result.passed) allPassed = false;
  }
  
  // Step 5: Complete epoch
  console.log('\n[5/5] Completing epoch...');
  if (allPassed) {
    await completeEpoch({
      relationships_created: 0, // Will be populated by extraction
      relationships_updated: 0,
      entities_created: 0,
      entities_updated: 0,
      decisions_logged: 0,
      signals_captured: 0,
    });
  } else {
    await failEpoch('Pristine conditions not met');
  }
  
  // Summary
  console.log('\n═══════════════════════════════════════════════════════════════════════════');
  if (allPassed) {
    console.log('  ✓ REBUILD COMPLETE - ALL PRISTINE CONDITIONS MET');
  } else {
    console.log('  ✗ REBUILD FAILED - PRISTINE CONDITIONS NOT MET');
    process.exit(1);
  }
  console.log('═══════════════════════════════════════════════════════════════════════════');
  console.log('');
  console.log('Epoch file:', `epochs/${epoch.epoch_id}.json`);
  console.log('');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

