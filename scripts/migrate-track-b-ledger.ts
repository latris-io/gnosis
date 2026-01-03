#!/usr/bin/env npx tsx
/**
 * Track B Ledger Migration
 * MIGRATION_ONLY: This script intentionally references ledger paths for migration.
 * 
 * One-time migration of B.1/B.2 ledger entries to canonical stream.
 * 
 * IDEMPOTENCY GUARANTEES:
 * 1. Refuses if .archived files exist (completed migration)
 * 2. Refuses if MIGRATION_MARKER exists in canonical ledger (partial or complete)
 * 
 * This handles:
 * - Clean first run
 * - Re-run after complete migration
 * - Re-run after partial failure (appended but didn't archive)
 */

import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ID = process.env.PROJECT_ID || '6df2f456-440d-4958-b475-d9808775ff69';
const CANONICAL_LEDGER = path.join('shadow-ledger', PROJECT_ID, 'ledger.jsonl');

const B1_LEDGER = 'docs/verification/track_b/ground-truth-ledger.jsonl';
const B2_LEDGER = 'docs/verification/track_b/brd-registry-ledger.jsonl';

function readJsonl(filePath: string): Record<string, unknown>[] {
  if (!fs.existsSync(filePath)) return [];
  return fs.readFileSync(filePath, 'utf-8')
    .split('\n')
    .filter(Boolean)
    .map(line => JSON.parse(line));
}

function appendJsonl(filePath: string, entries: Record<string, unknown>[]): void {
  if (entries.length === 0) return;
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const lines = entries.map(e => JSON.stringify(e)).join('\n');
  fs.appendFileSync(filePath, lines + '\n');
}

function hasMigrationMarker(): boolean {
  if (!fs.existsSync(CANONICAL_LEDGER)) return false;
  const entries = readJsonl(CANONICAL_LEDGER);
  return entries.some(e => 
    e.track === 'B' && 
    e.story === 'MIGRATION' && 
    e.action === 'MIGRATED_B1_B2'
  );
}

async function migrate() {
  console.log('=== Track B Ledger Migration ===');
  console.log(`Project ID: ${PROJECT_ID}`);
  console.log(`Canonical ledger: ${CANONICAL_LEDGER}\n`);
  
  // IDEMPOTENCY CHECK 1: .archived files exist (clean completion)
  if (fs.existsSync(B1_LEDGER + '.archived') || fs.existsSync(B2_LEDGER + '.archived')) {
    console.log('✓ Migration already complete (.archived files exist).');
    console.log('  To re-migrate, delete .archived files first.');
    process.exit(0);
  }
  
  // IDEMPOTENCY CHECK 2: MIGRATION_MARKER in canonical ledger (partial or complete)
  if (hasMigrationMarker()) {
    console.log('✓ Migration marker found in canonical ledger.');
    console.log('  This indicates a previous (possibly partial) migration.');
    console.log('  To re-migrate from scratch:');
    console.log('    1. Remove MIGRATED_B1_B2 entries from canonical ledger');
    console.log('    2. Restore source ledger files if needed');
    process.exit(0);
  }
  
  // Read source ledgers
  const b1Entries = readJsonl(B1_LEDGER);
  const b2Entries = readJsonl(B2_LEDGER);
  
  console.log(`B.1 entries: ${b1Entries.length}`);
  console.log(`B.2 entries: ${b2Entries.length}`);
  
  if (b1Entries.length === 0 && b2Entries.length === 0) {
    console.log('No entries to migrate.');
    process.exit(0);
  }
  
  // Add track/story/project_id fields
  const migratedB1 = b1Entries.map(e => ({
    ...e,
    track: 'B',
    story: 'B.1',
    project_id: PROJECT_ID,
  }));
  
  const migratedB2 = b2Entries.map(e => ({
    ...e,
    track: 'B',
    story: 'B.2',
    project_id: PROJECT_ID,
  }));
  
  // Create migration marker
  const migrationMarker = {
    track: 'B',
    story: 'MIGRATION',
    action: 'MIGRATED_B1_B2',
    timestamp: new Date().toISOString(),
    project_id: PROJECT_ID,
    source_files: [B1_LEDGER, B2_LEDGER],
    b1_count: b1Entries.length,
    b2_count: b2Entries.length,
  };
  
  // Append to canonical ledger (entries + marker)
  const allEntries = [
    ...migratedB1,
    ...migratedB2,
    migrationMarker,
  ];
  
  appendJsonl(CANONICAL_LEDGER, allEntries);
  console.log(`\nAppended ${migratedB1.length + migratedB2.length} entries + marker to canonical ledger`);
  
  // Archive originals (only after successful append)
  if (fs.existsSync(B1_LEDGER)) {
    fs.renameSync(B1_LEDGER, B1_LEDGER + '.archived');
    console.log(`Archived: ${B1_LEDGER}`);
  }
  if (fs.existsSync(B2_LEDGER)) {
    fs.renameSync(B2_LEDGER, B2_LEDGER + '.archived');
    console.log(`Archived: ${B2_LEDGER}`);
  }
  
  console.log('\n=== Migration Complete ===');
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});

