#!/usr/bin/env npx tsx
// LEGACY_SCAN_OK: This script audits/validates legacy ledger or corpus files
// @implements STORY-64.6
// @satisfies AC-64.6.1
//
// Migration script: Move flat ledger to per-project structure
//
// Before: shadow-ledger/ledger.jsonl (mixed project_ids)
// After:  shadow-ledger/{project_id}/ledger.jsonl (per-project isolation)
//
// Also migrates semantic corpus to per-project structure.
//
// SAFE: Non-destructive - creates new structure, archives original

import 'dotenv/config';
import * as fs from 'fs/promises';
import * as path from 'path';

const CANONICAL_PROJECT_ID = '6df2f456-440d-4958-b475-d9808775ff69';

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

async function migrateLedger(): Promise<void> {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║        LEDGER MIGRATION TO PER-PROJECT STRUCTURE              ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const legacyPath = 'shadow-ledger/ledger.jsonl';
  const archivePath = 'shadow-ledger/archive/pre-migration-ledger.jsonl';
  
  if (!await fileExists(legacyPath)) {
    console.log('No legacy ledger found at', legacyPath);
    console.log('Nothing to migrate.\n');
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
    const projectId = entry.project_id || 'unknown';
    if (projectId === 'unknown') {
      unknownCount++;
    }
    
    if (!entriesByProject.has(projectId)) {
      entriesByProject.set(projectId, []);
    }
    entriesByProject.get(projectId)!.push(entry);
  }
  
  console.log('Entries by project_id:');
  for (const [projectId, projectEntries] of entriesByProject) {
    const isCanonical = projectId === CANONICAL_PROJECT_ID;
    console.log(`  ${projectId.substring(0, 8)}... : ${projectEntries.length} ${isCanonical ? '(canonical)' : ''}`);
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
  
  // Write per-project ledgers (canonical project only)
  const canonicalEntries = entriesByProject.get(CANONICAL_PROJECT_ID) || [];
  if (canonicalEntries.length > 0) {
    const projectDir = `shadow-ledger/${CANONICAL_PROJECT_ID}`;
    await fs.mkdir(projectDir, { recursive: true });
    
    const projectLedgerPath = `${projectDir}/ledger.jsonl`;
    const projectContent = canonicalEntries.map(e => JSON.stringify(e)).join('\n') + '\n';
    await fs.writeFile(projectLedgerPath, projectContent);
    
    console.log(`✓ Created ${projectLedgerPath}`);
    console.log(`  Entries: ${canonicalEntries.length} (canonical project only)`);
  }
  
  // Clear legacy file (keep empty for backward compat)
  await fs.writeFile(legacyPath, '');
  console.log(`✓ Cleared legacy ledger (archived backup exists)\n`);
  
  // Summary
  const droppedCount = entries.length - canonicalEntries.length;
  console.log('┌─────────────────────────────────────────────────────────────────┐');
  console.log('│ MIGRATION SUMMARY                                              │');
  console.log('└─────────────────────────────────────────────────────────────────┘');
  console.log(`  Total entries:     ${entries.length}`);
  console.log(`  Migrated:          ${canonicalEntries.length} (canonical project)`);
  console.log(`  Dropped:           ${droppedCount} (non-canonical/test pollution)`);
  console.log(`  Archive:           ${archivePath}`);
  console.log();
}

async function migrateCorpus(): Promise<void> {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║        CORPUS MIGRATION TO PER-PROJECT STRUCTURE              ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const legacyPath = 'semantic-corpus/signals.jsonl';
  const archivePath = 'semantic-corpus/archive/pre-migration-signals.jsonl';
  
  if (!await fileExists(legacyPath)) {
    console.log('No legacy corpus found at', legacyPath);
    console.log('Nothing to migrate.\n');
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
  
  // For corpus, we migrate ALL signals to canonical project
  // (corpus historically didn't have project_id)
  const projectDir = `semantic-corpus/${CANONICAL_PROJECT_ID}`;
  await fs.mkdir(projectDir, { recursive: true });
  
  // Add project_id to each signal for future Track C scoping
  const migratedSignals = signals.map(s => ({
    ...s,
    project_id: s.project_id || CANONICAL_PROJECT_ID,
  }));
  
  const projectCorpusPath = `${projectDir}/signals.jsonl`;
  const projectContent = migratedSignals.map(s => JSON.stringify(s)).join('\n') + '\n';
  await fs.writeFile(projectCorpusPath, projectContent);
  
  console.log(`✓ Created ${projectCorpusPath}`);
  console.log(`  Signals: ${migratedSignals.length}`);
  
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
  console.log('════════════════════════════════════════════════════════════════════');
  console.log('     LEDGER & CORPUS MIGRATION: PER-PROJECT ISOLATION');
  console.log('════════════════════════════════════════════════════════════════════\n');
  console.log(`Canonical Project ID: ${CANONICAL_PROJECT_ID}\n`);
  
  await migrateLedger();
  await migrateCorpus();
  
  console.log('════════════════════════════════════════════════════════════════════');
  console.log('                      MIGRATION COMPLETE');
  console.log('════════════════════════════════════════════════════════════════════\n');
  console.log('New structure:');
  console.log('  shadow-ledger/{project_id}/ledger.jsonl');
  console.log('  semantic-corpus/{project_id}/signals.jsonl\n');
  console.log('Archived backups:');
  console.log('  shadow-ledger/archive/pre-migration-ledger.jsonl');
  console.log('  semantic-corpus/archive/pre-migration-signals.jsonl\n');
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});

