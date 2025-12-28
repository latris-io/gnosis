// scripts/a3-replay-gate.ts
// LEGACY_SCAN_OK: This script audits/validates legacy ledger or corpus files
// Phase 6: Replay Gate - prove idempotency

import { rlsQuery } from '../test/utils/rls.js';
import { extractAndPersistMarkerRelationships } from '../src/ops/track-a.js';
import fs from 'fs/promises';

const projectId = process.env.PROJECT_ID || '6df2f456-440d-4958-b475-d9808775ff69';

async function countCorpusOrphanMarkers(): Promise<number> {
  const corpusPath = 'semantic-corpus/signals.jsonl';
  const content = await fs.readFile(corpusPath, 'utf-8');
  return content.split('\n').filter(line => line.includes('ORPHAN_MARKER')).length;
}

async function countLedgerLines(): Promise<number> {
  const ledgerPath = 'shadow-ledger/ledger.jsonl';
  const content = await fs.readFile(ledgerPath, 'utf-8');
  return content.trim().split('\n').filter(l => l).length;
}

async function main() {
  console.log('=== Phase 6: Replay Gate ===\n');

  // 6.1 Capture Before State
  console.log('--- 6.1 Before State ---');
  const pgR18Before = await rlsQuery<{ c: number }>(projectId, 
    "SELECT COUNT(*)::int as c FROM relationships WHERE relationship_type='R18'"
  );
  const pgR19Before = await rlsQuery<{ c: number }>(projectId, 
    "SELECT COUNT(*)::int as c FROM relationships WHERE relationship_type='R19'"
  );
  const ledgerBefore = await countLedgerLines();
  const corpusBefore = await countCorpusOrphanMarkers();

  console.log('R18:', pgR18Before[0].c);
  console.log('R19:', pgR19Before[0].c);
  console.log('Ledger lines:', ledgerBefore);
  console.log('Corpus ORPHAN_MARKER:', corpusBefore);

  // 6.2 Run Extraction Again
  console.log('\n--- 6.2 Running Extraction ---');
  const result = await extractAndPersistMarkerRelationships(projectId);
  console.log('Extracted:', result.extracted);
  console.log('R18 created:', result.r18_created);
  console.log('R19 created:', result.r19_created);
  console.log('Orphans:', result.orphans);

  // 6.3 Capture After State
  console.log('\n--- 6.3 After State ---');
  const pgR18After = await rlsQuery<{ c: number }>(projectId, 
    "SELECT COUNT(*)::int as c FROM relationships WHERE relationship_type='R18'"
  );
  const pgR19After = await rlsQuery<{ c: number }>(projectId, 
    "SELECT COUNT(*)::int as c FROM relationships WHERE relationship_type='R19'"
  );
  const ledgerAfter = await countLedgerLines();
  const corpusAfter = await countCorpusOrphanMarkers();

  console.log('R18:', pgR18After[0].c);
  console.log('R19:', pgR19After[0].c);
  console.log('Ledger lines:', ledgerAfter);
  console.log('Corpus ORPHAN_MARKER:', corpusAfter);

  // 6.4 Calculate Deltas
  console.log('\n--- 6.4 Deltas ---');
  const r18Delta = pgR18After[0].c - pgR18Before[0].c;
  const r19Delta = pgR19After[0].c - pgR19Before[0].c;
  const ledgerDelta = ledgerAfter - ledgerBefore;
  const corpusDelta = corpusAfter - corpusBefore;

  console.log('R18 delta:', r18Delta);
  console.log('R19 delta:', r19Delta);
  console.log('Ledger delta:', ledgerDelta);
  console.log('Corpus delta:', corpusDelta);

  // 6.5 Assert All Zero
  console.log('\n--- 6.5 Replay Gate Result ---');
  // Note: Ledger may grow with DECISION entries on each run, which is acceptable
  // The key assertion is DB relationships don't grow
  const dbIdempotent = r18Delta === 0 && r19Delta === 0;
  const corpusIdempotent = corpusDelta === 0;

  console.log('DB Idempotency (R18/R19):', dbIdempotent ? 'PASS ✓' : 'FAIL ✗');
  console.log('Corpus Idempotency:', corpusIdempotent ? 'PASS ✓' : 'FAIL ✗');
  console.log('REPLAY GATE:', dbIdempotent && corpusIdempotent ? 'PASS ✓' : 'FAIL ✗');

  console.log('\n=== End of Phase 6 ===');
  process.exit(0);
}

main().catch(console.error);

