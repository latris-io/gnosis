#!/usr/bin/env npx tsx
// LEGACY_SCAN_OK: This script audits/validates legacy ledger or corpus files
/**
 * Ledger & Corpus Migration Script
 * Tier 2: Migration Script (filesystem-only)
 * 
 * Migration script: Move flat ledger to per-project structure.
 * 
 * Before: shadow-ledger/ledger.jsonl (mixed project_ids)
 * After:  shadow-ledger/{project_id}/ledger.jsonl (per-project isolation)
 * 
 * Also migrates semantic corpus to per-project structure.
 * 
 * SAFE: Non-destructive - creates new structure, archives original.
 * 
 * @implements STORY-64.6
 * @satisfies AC-64.6.1
 * 
 * REQUIRES: PROJECT_ID env var (but no --confirm-repair since filesystem-only)
 */
import 'dotenv/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { 
  resolveProjectId, 
  createEvidence, 
  writeEvidenceMarkdown,
  type EvidenceArtifact 
} from './_lib/operator-guard.js';

const SCRIPT_NAME = 'scripts/migrate-ledger-to-project-scope.ts';

interface LedgerEntry {
  project_id?: string;
  [key: string]: unknown;
}

interface CorpusSignal {
  project_id?: string;
  [key: string]: unknown;
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function migrateLedger(projectId: string, evidence: EvidenceArtifact): Promise<void> {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║        LEDGER MIGRATION TO PER-PROJECT STRUCTURE              ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const legacyPath = 'shadow-ledger/ledger.jsonl';
  const archivePath = 'shadow-ledger/archive/pre-migration-ledger.jsonl';
  
  if (!await fileExists(legacyPath)) {
    console.log('No legacy ledger found at', legacyPath);
    console.log('Nothing to migrate.\n');
    evidence.operations?.push('Ledger: No legacy ledger to migrate');
    return;
  }
  
  // Read legacy ledger
  const content = await fs.readFile(legacyPath, 'utf8');
  const entries = content
    .split('\n')
    .filter(line => line.trim())
    .map(line => JSON.parse(line) as LedgerEntry);
  
  console.log(`Found ${entries.length} total entries in legacy ledger\n`);
  
  // Group entries by project_id
  const entriesByProject = new Map<string, LedgerEntry[]>();
  let unknownCount = 0;
  
  for (const entry of entries) {
    const entryProjectId = entry.project_id || 'unknown';
    if (entryProjectId === 'unknown') {
      unknownCount++;
    }
    
    if (!entriesByProject.has(entryProjectId)) {
      entriesByProject.set(entryProjectId, []);
    }
    entriesByProject.get(entryProjectId)!.push(entry);
  }
  
  console.log('Entries by project_id:');
  for (const [entryProjectId, projectEntries] of entriesByProject) {
    const isTarget = entryProjectId === projectId;
    console.log(`  ${entryProjectId.substring(0, 8)}... : ${projectEntries.length} ${isTarget ? '(target)' : ''}`);
  }
  console.log();
  
  if (unknownCount > 0) {
    console.log(`⚠️  ${unknownCount} entries have no project_id (will be skipped)`);
  }
  
  // Create archive directory
  await fs.mkdir(path.dirname(archivePath), { recursive: true });
  
  // Archive the original
  await fs.copyFile(legacyPath, archivePath);
  console.log(`✓ Archived original to ${archivePath}\n`);
  evidence.operations?.push(`Ledger: Archived to ${archivePath}`);
  
  // Write per-project ledgers (target project only)
  const targetEntries = entriesByProject.get(projectId) || [];
  if (targetEntries.length > 0) {
    const projectDir = `shadow-ledger/${projectId}`;
    await fs.mkdir(projectDir, { recursive: true });
    
    const projectLedgerPath = `${projectDir}/ledger.jsonl`;
    const projectContent = targetEntries.map(e => JSON.stringify(e)).join('\n') + '\n';
    await fs.writeFile(projectLedgerPath, projectContent);
    
    console.log(`✓ Created ${projectLedgerPath}`);
    console.log(`  Entries: ${targetEntries.length} (target project only)`);
    evidence.operations?.push(`Ledger: Migrated ${targetEntries.length} entries to ${projectLedgerPath}`);
  }
  
  // Clear legacy file (keep empty for backward compat)
  await fs.writeFile(legacyPath, '');
  console.log(`✓ Cleared legacy ledger (archived backup exists)\n`);
  
  // Summary
  const droppedCount = entries.length - targetEntries.length;
  console.log('┌─────────────────────────────────────────────────────────────────┐');
  console.log('│ MIGRATION SUMMARY                                              │');
  console.log('└─────────────────────────────────────────────────────────────────┘');
  console.log(`  Total entries:     ${entries.length}`);
  console.log(`  Migrated:          ${targetEntries.length} (target project)`);
  console.log(`  Dropped:           ${droppedCount} (non-target/test pollution)`);
  console.log(`  Archive:           ${archivePath}`);
  console.log();
}

async function migrateCorpus(projectId: string, evidence: EvidenceArtifact): Promise<void> {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║        CORPUS MIGRATION TO PER-PROJECT STRUCTURE              ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const legacyPath = 'semantic-corpus/signals.jsonl';
  const archivePath = 'semantic-corpus/archive/pre-migration-signals.jsonl';
  
  if (!await fileExists(legacyPath)) {
    console.log('No legacy corpus found at', legacyPath);
    console.log('Nothing to migrate.\n');
    evidence.operations?.push('Corpus: No legacy corpus to migrate');
    return;
  }
  
  // Read legacy corpus
  const content = await fs.readFile(legacyPath, 'utf8');
  const signals = content
    .split('\n')
    .filter(line => line.trim())
    .map(line => JSON.parse(line) as CorpusSignal);
  
  console.log(`Found ${signals.length} total signals in legacy corpus\n`);
  
  // Create archive directory
  await fs.mkdir(path.dirname(archivePath), { recursive: true });
  
  // Archive the original
  await fs.copyFile(legacyPath, archivePath);
  console.log(`✓ Archived original to ${archivePath}\n`);
  evidence.operations?.push(`Corpus: Archived to ${archivePath}`);
  
  // For corpus, we migrate ALL signals to target project
  // (corpus historically didn't have project_id)
  const projectDir = `semantic-corpus/${projectId}`;
  await fs.mkdir(projectDir, { recursive: true });
  
  // Add project_id to each signal for future Track C scoping
  const migratedSignals = signals.map(s => ({
    ...s,
    project_id: s.project_id || projectId,
  }));
  
  const projectCorpusPath = `${projectDir}/signals.jsonl`;
  const projectContent = migratedSignals.map(s => JSON.stringify(s)).join('\n') + '\n';
  await fs.writeFile(projectCorpusPath, projectContent);
  
  console.log(`✓ Created ${projectCorpusPath}`);
  console.log(`  Signals: ${migratedSignals.length}`);
  evidence.operations?.push(`Corpus: Migrated ${migratedSignals.length} signals to ${projectCorpusPath}`);
  
  // Clear legacy file
  await fs.writeFile(legacyPath, '');
  console.log(`✓ Cleared legacy corpus (archived backup exists)\n`);
  
  console.log('┌─────────────────────────────────────────────────────────────────┐');
  console.log('│ MIGRATION SUMMARY                                              │');
  console.log('└─────────────────────────────────────────────────────────────────┘');
  console.log(`  Total signals:     ${signals.length}`);
  console.log(`  Migrated:          ${migratedSignals.length}`);
  console.log(`  Archive:           ${archivePath}`);
  console.log();
}

async function main(): Promise<void> {
  // Resolve project ID (but no --confirm-repair needed for filesystem-only)
  const projectId = resolveProjectId();
  
  // Initialize evidence
  const evidence: EvidenceArtifact = createEvidence(SCRIPT_NAME, projectId);
  
  console.log('════════════════════════════════════════════════════════════════════');
  console.log('     LEDGER & CORPUS MIGRATION: PER-PROJECT ISOLATION');
  console.log('════════════════════════════════════════════════════════════════════\n');
  console.log(`Target Project ID: ${projectId}\n`);
  
  try {
    await migrateLedger(projectId, evidence);
    await migrateCorpus(projectId, evidence);
    
    console.log('════════════════════════════════════════════════════════════════════');
    console.log('                      MIGRATION COMPLETE');
    console.log('════════════════════════════════════════════════════════════════════\n');
    console.log('New structure:');
    console.log('  shadow-ledger/{project_id}/ledger.jsonl');
    console.log('  semantic-corpus/{project_id}/signals.jsonl\n');
    console.log('Archived backups:');
    console.log('  shadow-ledger/archive/pre-migration-ledger.jsonl');
    console.log('  semantic-corpus/archive/pre-migration-signals.jsonl\n');
    
    evidence.status = 'SUCCESS';
    
  } catch (err) {
    evidence.status = 'FAILED';
    evidence.errors?.push(String(err));
    throw err;
  } finally {
    writeEvidenceMarkdown(evidence);
  }
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
