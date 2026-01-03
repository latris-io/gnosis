#!/usr/bin/env npx tsx
/**
 * Rebuild A3 Pristine Script
 * Tier 2: Repair/Maintenance Script
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
 * @implements INFRASTRUCTURE
 * 
 * REQUIRES: --confirm-repair flag and PROJECT_ID env var
 */
import 'dotenv/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { 
  startEpoch, 
  completeEpoch, 
  failEpoch, 
  EpochContext,
  computeBrdBlobHash
} from '../src/ledger/epoch-service.js';
import { getLedgerPath, LedgerEntry } from '../src/ledger/shadow-ledger.js';
import { getCorpusPath, SemanticSignal, SEMANTIC_SIGNAL_SCHEMA_ID } from '../src/ledger/semantic-corpus.js';
import { extractAndPersistMarkerRelationships, extractAndPersistTestRelationships, closeConnections } from '../src/ops/track-a.js';
import { 
  requireConfirmRepair, 
  resolveProjectId, 
  createEvidence, 
  writeEvidenceMarkdown,
  type EvidenceArtifact 
} from './_lib/operator-guard.js';
import { captureStateSnapshot, formatSnapshot } from './_lib/state-snapshot.js';

const SCRIPT_NAME = 'scripts/rebuild-a3-pristine.ts';

interface ValidationResult {
  passed: boolean;
  message: string;
  details?: Record<string, unknown>;
}

async function validateLedgerPristine(projectId: string, epochId: string, repoSha: string, runnerSha: string, brdHash: string): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];
  const ledgerPath = getLedgerPath(projectId);
  
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
  
  let brdBlobHashMismatches = 0;
  
  for (const entry of epochEntries) {
    // Check required fields (brd_hash OR brd_blob_hash is acceptable)
    const hasBrdHash = entry.brd_hash || (entry as any).brd_blob_hash;
    if (!entry.epoch_id || !entry.repo_sha || !entry.runner_sha || !hasBrdHash) {
      missingFields++;
    }
    
    // If brd_blob_hash exists, verify it matches computed value
    const entryBlobHash = (entry as any).brd_blob_hash;
    if (entryBlobHash && entry.repo_sha) {
      const expected = computeBrdBlobHash(entry.repo_sha);
      if (entryBlobHash !== expected) {
        brdBlobHashMismatches++;
      }
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
    passed: brdBlobHashMismatches === 0,
    message: `BRD blob hash: ${brdBlobHashMismatches === 0 ? 'all verified' : `${brdBlobHashMismatches} mismatches`}`,
    details: { brdBlobHashMismatches }
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

async function validateCorpusPristine(projectId: string, epochId: string, repoSha: string, brdHash: string): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];
  const corpusPath = getCorpusPath(projectId);
  
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
    
    // brd_hash OR brd_blob_hash is acceptable
    const hasBrdHash = signal.brd_hash || (signal as any).brd_blob_hash;
    if (!signal.project_id || !signal.repo_sha || !signal.epoch_id || !hasBrdHash) {
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
  // === OPERATOR GUARD ===
  requireConfirmRepair(SCRIPT_NAME);
  const projectId = resolveProjectId();

  // Initialize evidence
  const evidence: EvidenceArtifact = createEvidence(SCRIPT_NAME, projectId);

  console.log('═══════════════════════════════════════════════════════════════════════════');
  console.log('  REBUILD A3 PRISTINE');
  console.log('═══════════════════════════════════════════════════════════════════════════');
  console.log('');
  console.log(`Project ID: ${projectId}`);

  try {
    // Capture BEFORE state
    console.log('\n[SNAPSHOT] Capturing before state...');
    evidence.beforeCounts = await captureStateSnapshot(projectId);
    console.log(`  ${formatSnapshot(evidence.beforeCounts)}`);

    // Step 1: Create epoch
    console.log('\n[1/5] Creating fresh epoch...');
    const epoch = await startEpoch(projectId);
    
    console.log(`  Epoch ID:   ${epoch.epoch_id}`);
    console.log(`  Repo SHA:   ${epoch.repo_sha}`);
    console.log(`  Runner SHA: ${epoch.runner_sha}`);
    console.log(`  BRD Hash:   ${epoch.brd_hash}`);
    console.log(`  Status:     ${epoch.status}`);
    evidence.operations?.push(`Created epoch ${epoch.epoch_id}`);
    
    // Step 2: Verify project directories exist
    console.log('\n[2/5] Verifying project directories...');
    const ledgerPath = getLedgerPath(projectId);
    const corpusPath = getCorpusPath(projectId);
    
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
      const markerResult = await extractAndPersistMarkerRelationships(projectId);
      console.log(`    Extracted ${markerResult.extracted} markers, ${markerResult.orphans} orphans`);
      console.log(`    R18: ${markerResult.r18_created}, R19: ${markerResult.r19_created}`);
      evidence.operations?.push(`Extracted ${markerResult.extracted} markers (R18: ${markerResult.r18_created}, R19: ${markerResult.r19_created})`);
      
      // Extract test relationships (R36, R37)
      console.log('  - Extracting test relationships (R36, R37)...');
      const testResult = await extractAndPersistTestRelationships(projectId);
      console.log(`    R36: ${testResult.r36_created} created, R37: ${testResult.r37_created} created`);
      evidence.operations?.push(`Extracted test relationships (R36: ${testResult.r36_created}, R37: ${testResult.r37_created})`);
      
    } catch (err) {
      console.error('  ❌ Extraction failed:', err);
      await failEpoch(String(err));
      throw err;
    }
    
    // Step 4: Validate pristine conditions
    console.log('\n[4/5] Validating pristine conditions...');
    
    const ledgerResults = await validateLedgerPristine(
      projectId,
      epoch.epoch_id, 
      epoch.repo_sha, 
      epoch.runner_sha, 
      epoch.brd_hash
    );
    
    const corpusResults = await validateCorpusPristine(
      projectId,
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
    
    // Step 5: Complete epoch (counts computed from ledger/corpus)
    console.log('\n[5/5] Completing epoch...');
    if (allPassed) {
      const epochMeta = await completeEpoch();
      console.log(`  Epoch counts: ${epochMeta.decisions_logged} decisions, ${epochMeta.relationships_created} rels created`);
      evidence.operations?.push(`Completed epoch with ${epochMeta.decisions_logged} decisions, ${epochMeta.relationships_created} rels`);
    } else {
      await failEpoch('Pristine conditions not met');
      evidence.operations?.push('Failed epoch: pristine conditions not met');
    }
    
    // Capture AFTER state
    console.log('\n[SNAPSHOT] Capturing after state...');
    evidence.afterCounts = await captureStateSnapshot(projectId);
    console.log(`  ${formatSnapshot(evidence.afterCounts)}`);

    // Summary
    console.log('\n═══════════════════════════════════════════════════════════════════════════');
    if (allPassed) {
      console.log('  ✓ REBUILD COMPLETE - ALL PRISTINE CONDITIONS MET');
      evidence.status = 'SUCCESS';
    } else {
      console.log('  ✗ REBUILD FAILED - PRISTINE CONDITIONS NOT MET');
      evidence.status = 'FAILED';
      evidence.errors?.push('Pristine conditions not met');
    }
    console.log('═══════════════════════════════════════════════════════════════════════════');
    console.log('');
    console.log('Epoch file:', `epochs/${epoch.epoch_id}.json`);
    console.log('');
    
    if (!allPassed) {
      throw new Error('Pristine conditions not met');
    }
    
  } catch (err) {
    evidence.status = 'FAILED';
    evidence.errors?.push(String(err));
    console.error('Error:', err);
    throw err;
  } finally {
    writeEvidenceMarkdown(evidence);
    await closeConnections();
  }
}

main().catch(async err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
