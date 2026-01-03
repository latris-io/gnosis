// @ts-nocheck
// LEGACY_SCAN_OK: This script audits/validates legacy ledger or corpus files
// Verify corpus references for newly inserted E03 entities
import 'dotenv/config';
import * as fs from 'fs';
import pg from 'pg';

const { Pool } = pg;

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║              CORPUS VERIFICATION                               ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL, 
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  // Load missing E03 report
  const missingReport = JSON.parse(fs.readFileSync('si-readiness-results/missing-e03.json', 'utf-8'));
  const missingIds = new Set(missingReport.missing_acs.map((ac: any) => ac.instance_id));

  // Load corpus
  const corpusPath = 'semantic-corpus/signals.jsonl';
  const corpusContent = fs.readFileSync(corpusPath, 'utf-8');
  const signals = corpusContent.split('\n').filter(l => l.trim()).map(l => JSON.parse(l));

  console.log(`Corpus signals: ${signals.length}`);
  console.log(`Missing E03s (from backfill): ${missingIds.size}`);

  // Check if any corpus signals reference the missing E03s
  const signalsForMissing = signals.filter((s: any) => missingIds.has(s.instance_id));
  console.log(`\nCorpus signals referencing backfilled E03s: ${signalsForMissing.length}`);

  // Check if backfilled E03s are now in DB
  const dbResult = await pool.query('SELECT instance_id FROM entities WHERE entity_type = $1', ['E03']);
  const dbIds = new Set(dbResult.rows.map(r => r.instance_id));

  const backfilledAndInDb = [...missingIds].filter(id => dbIds.has(id));
  const backfilledButNotInDb = [...missingIds].filter(id => !dbIds.has(id));

  console.log(`\nBackfilled E03s now in DB: ${backfilledAndInDb.length}`);
  console.log(`Backfilled E03s missing from DB: ${backfilledButNotInDb.length}`);

  // Generate corpus delta report
  const report = {
    timestamp: new Date().toISOString(),
    corpus_signals_total: signals.length,
    backfilled_e03_count: missingIds.size,
    corpus_signals_for_backfilled: signalsForMissing.length,
    backfilled_in_db: backfilledAndInDb.length,
    backfilled_missing_from_db: backfilledButNotInDb.length,
    notes: [
      'Corpus was generated before backfill - new E03s may not have CORRECT signals',
      'This is acceptable - corpus keying uses instance_id, which is valid after backfill',
      'New E03 signals can be generated during next extraction run',
    ],
    pass: backfilledButNotInDb.length === 0,
  };

  fs.writeFileSync('si-readiness-results/corpus-delta.json', JSON.stringify(report, null, 2));
  console.log('\nReport saved: si-readiness-results/corpus-delta.json');

  if (report.pass) {
    console.log('\n✓ PASS: All backfilled E03s are in DB');
  } else {
    console.log('\n✗ FAIL: Some backfilled E03s are not in DB');
    console.log('  Missing:', backfilledButNotInDb.slice(0, 5));
  }

  await pool.end();
}

main().catch(console.error);

