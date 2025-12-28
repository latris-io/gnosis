#!/usr/bin/env npx tsx
// scripts/a3-evidence.ts
// @implements STORY-64.3
//
// A3 Evidence Script - Deterministic evidence output for audit.
// Queries canonical sources (PostgreSQL, shadow ledger, semantic corpus).

import 'dotenv/config';
import { rlsQuery } from '../test/utils/rls.js';
import { shadowLedger, type LedgerEntry, type DecisionEntry } from '../src/ledger/shadow-ledger.js';
import { semanticCorpus } from '../src/ledger/semantic-corpus.js';
import { A3_BASELINE } from '../test/fixtures/a3-baseline-manifest.js';

const PROJECT_ID = process.env.PROJECT_ID || '6df2f456-440d-4958-b475-d9808775ff69';

interface RelationshipRow {
  relationship_type: string;
  instance_id: string;
  source_file: string;
  line_start: number;
  line_end: number;
}

async function main(): Promise<void> {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║                    A3 EVIDENCE REPORT                          ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log();
  console.log(`Project:    ${PROJECT_ID}`);
  console.log(`Timestamp:  ${new Date().toISOString()}`);
  console.log(`Manifest:   SHA ${A3_BASELINE.sha.substring(0, 7)} (frozen ${A3_BASELINE.frozen_at})`);
  console.log();

  // ─────────────────────────────────────────────────────────────────────────────
  // SECTION 1: Relationship Counts from PostgreSQL
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('┌─────────────────────────────────────────────────────────────────┐');
  console.log('│ 1. RELATIONSHIP COUNTS (PostgreSQL)                            │');
  console.log('└─────────────────────────────────────────────────────────────────┘');
  
  const relCounts = await rlsQuery<{ relationship_type: string; count: string }>(
    PROJECT_ID,
    `SELECT relationship_type, COUNT(*)::text as count
     FROM relationships
     WHERE relationship_type IN ('R18', 'R19', 'R36', 'R37')
     GROUP BY relationship_type
     ORDER BY relationship_type`
  );
  
  const countMap = new Map(relCounts.map(r => [r.relationship_type, parseInt(r.count)]));
  
  console.log();
  console.log('  Type  │ Actual │ Expected │ Match');
  console.log('  ──────┼────────┼──────────┼──────');
  
  for (const type of ['R18', 'R19', 'R36', 'R37'] as const) {
    const actual = countMap.get(type) || 0;
    const expected = A3_BASELINE.counts[type];
    const match = actual === expected ? '✓' : '✗';
    console.log(`  ${type}   │ ${String(actual).padStart(6)} │ ${String(expected).padStart(8)} │   ${match}`);
  }
  console.log();

  // ─────────────────────────────────────────────────────────────────────────────
  // SECTION 2: Sample Rows with Evidence Anchors
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('┌─────────────────────────────────────────────────────────────────┐');
  console.log('│ 2. SAMPLE ROWS WITH EVIDENCE ANCHORS                           │');
  console.log('└─────────────────────────────────────────────────────────────────┘');
  console.log();
  
  for (const type of ['R18', 'R19', 'R36', 'R37']) {
    const sample = await rlsQuery<RelationshipRow>(
      PROJECT_ID,
      `SELECT relationship_type, instance_id, source_file, line_start, line_end
       FROM relationships
       WHERE relationship_type = '${type}'
       LIMIT 1`
    );
    
    if (sample.length > 0) {
      const row = sample[0];
      const isAbsolute = row.source_file.startsWith('/') || /^[A-Z]:/.test(row.source_file);
      const pathStatus = isAbsolute ? '⚠️ ABSOLUTE' : '✓ relative';
      
      console.log(`  ${type}:`);
      console.log(`    instance_id: ${row.instance_id}`);
      console.log(`    source_file: ${row.source_file} (${pathStatus})`);
      console.log(`    line_start:  ${row.line_start}`);
      console.log(`    line_end:    ${row.line_end}`);
      console.log();
    } else {
      console.log(`  ${type}: (none)`);
      console.log();
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SECTION 3: Ledger CREATE Counts (via canonical interface)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('┌─────────────────────────────────────────────────────────────────┐');
  console.log('│ 3. LEDGER COUNTS (Shadow Ledger)                               │');
  console.log('└─────────────────────────────────────────────────────────────────┘');
  console.log();
  
  const ledgerEntries = await shadowLedger.getEntries();
  
  // Filter to current project
  const projectEntries = ledgerEntries.filter(
    e => e.project_id === PROJECT_ID
  );
  
  // Count CREATE operations by relationship type
  const createCounts: Record<string, number> = { R18: 0, R19: 0, R36: 0, R37: 0 };
  const updateCounts: Record<string, number> = { R18: 0, R19: 0, R36: 0, R37: 0 };
  const decisionCounts: Record<string, number> = { 
    ORPHAN: 0, 
    TDD_COHERENCE_OK: 0, 
    TDD_COHERENCE_MISMATCH: 0 
  };
  
  for (const entry of projectEntries) {
    const type = entry.entity_type;
    
    if (entry.operation === 'CREATE' && createCounts[type] !== undefined) {
      createCounts[type]++;
    } else if (entry.operation === 'UPDATE' && updateCounts[type] !== undefined) {
      updateCounts[type]++;
    } else if (entry.operation === 'DECISION') {
      const decision = (entry as unknown as DecisionEntry).decision;
      if (decisionCounts[decision] !== undefined) {
        decisionCounts[decision]++;
      }
    }
  }
  
  console.log('  Relationship CREATE counts:');
  console.log(`    R18: ${createCounts.R18}`);
  console.log(`    R19: ${createCounts.R19}`);
  console.log(`    R36: ${createCounts.R36}`);
  console.log(`    R37: ${createCounts.R37}`);
  console.log();
  console.log('  DECISION counts:');
  console.log(`    ORPHAN:                ${decisionCounts.ORPHAN}`);
  console.log(`    TDD_COHERENCE_OK:      ${decisionCounts.TDD_COHERENCE_OK}`);
  console.log(`    TDD_COHERENCE_MISMATCH: ${decisionCounts.TDD_COHERENCE_MISMATCH}`);
  console.log();

  // ─────────────────────────────────────────────────────────────────────────────
  // SECTION 4: Semantic Signal Counts (via canonical interface)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('┌─────────────────────────────────────────────────────────────────┐');
  console.log('│ 4. SEMANTIC SIGNAL COUNTS (Corpus)                             │');
  console.log('└─────────────────────────────────────────────────────────────────┘');
  console.log();
  
  const signalCounts = await semanticCorpus.getCountsByType();
  
  console.log('  Signal type              │ Count');
  console.log('  ─────────────────────────┼──────');
  console.log(`  CORRECT                  │ ${signalCounts.CORRECT}`);
  console.log(`  INCORRECT                │ ${signalCounts.INCORRECT}`);
  console.log(`  PARTIAL                  │ ${signalCounts.PARTIAL}`);
  console.log(`  ORPHAN_MARKER            │ ${signalCounts.ORPHAN_MARKER}`);
  console.log(`  TDD_COHERENCE_MISMATCH   │ ${signalCounts.TDD_COHERENCE_MISMATCH}`);
  console.log(`  AMBIGUOUS                │ ${signalCounts.AMBIGUOUS}`);
  console.log();

  // ─────────────────────────────────────────────────────────────────────────────
  // SECTION 5: Evidence Path Validation
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('┌─────────────────────────────────────────────────────────────────┐');
  console.log('│ 5. EVIDENCE PATH VALIDATION                                    │');
  console.log('└─────────────────────────────────────────────────────────────────┘');
  console.log();
  
  const allRels = await rlsQuery<{ relationship_type: string; source_file: string }>(
    PROJECT_ID,
    `SELECT relationship_type, source_file
     FROM relationships
     WHERE relationship_type IN ('R18', 'R19', 'R36', 'R37')`
  );
  
  const absolutePaths: string[] = [];
  for (const rel of allRels) {
    if (rel.source_file.startsWith('/') || /^[A-Z]:/.test(rel.source_file)) {
      absolutePaths.push(`${rel.relationship_type}: ${rel.source_file}`);
    }
  }
  
  if (absolutePaths.length === 0) {
    console.log('  ✓ All source_file paths are repo-relative');
  } else {
    console.log(`  ✗ Found ${absolutePaths.length} absolute paths:`);
    for (const p of absolutePaths.slice(0, 5)) {
      console.log(`    - ${p}`);
    }
    if (absolutePaths.length > 5) {
      console.log(`    ... and ${absolutePaths.length - 5} more`);
    }
  }
  console.log();

  // ─────────────────────────────────────────────────────────────────────────────
  // SECTION 6: Summary
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║                    EVIDENCE SUMMARY                            ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log();
  
  const r18Match = (countMap.get('R18') || 0) === A3_BASELINE.counts.R18;
  const r19Match = (countMap.get('R19') || 0) === A3_BASELINE.counts.R19;
  const r36Match = (countMap.get('R36') || 0) === A3_BASELINE.counts.R36;
  const r37Match = (countMap.get('R37') || 0) === A3_BASELINE.counts.R37;
  const pathsOk = absolutePaths.length === 0;
  
  console.log(`  R18 count matches manifest:  ${r18Match ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`  R19 count matches manifest:  ${r19Match ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`  R36 count matches manifest:  ${r36Match ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`  R37 count matches manifest:  ${r37Match ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`  All paths repo-relative:     ${pathsOk ? '✓ PASS' : '✗ FAIL'}`);
  console.log();
  
  const allPass = r18Match && r19Match && r36Match && r37Match && pathsOk;
  if (allPass) {
    console.log('  ════════════════════════════════════════════');
    console.log('  ✓ A3 EVIDENCE VALIDATION PASSED');
    console.log('  ════════════════════════════════════════════');
  } else {
    console.log('  ════════════════════════════════════════════');
    console.log('  ✗ A3 EVIDENCE VALIDATION FAILED');
    console.log('  ════════════════════════════════════════════');
  }
  console.log();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

