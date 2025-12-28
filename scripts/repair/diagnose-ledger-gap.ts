// @ts-nocheck
// LEGACY_SCAN_OK: This script audits/validates legacy ledger or corpus files
// Forensic analysis: identify E03 ledger gap
import 'dotenv/config';
import * as fs from 'fs';
import pg from 'pg';

const { Pool } = pg;

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║              LEDGER GAP FORENSICS                              ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL, 
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  // Load missing E03 report (the 137 that were backfilled)
  const missingReport = JSON.parse(fs.readFileSync('si-readiness-results/missing-e03.json', 'utf-8'));
  const backfilledIds = new Set(missingReport.missing_acs.map((ac: any) => ac.instance_id));
  console.log(`Backfilled E03 instance_ids: ${backfilledIds.size}`);

  // Load ledger and extract E03 CREATE entries
  const ledgerContent = fs.readFileSync('shadow-ledger/ledger.jsonl', 'utf-8');
  const ledgerLines = ledgerContent.split('\n').filter(l => l.trim());
  console.log(`Total ledger entries: ${ledgerLines.length}`);

  const e03Ledger = new Map<string, any>();
  for (const line of ledgerLines) {
    const entry = JSON.parse(line);
    // Entity entries have kind: undefined (backward compat) and entity_type
    if (entry.entity_type === 'E03') {
      e03Ledger.set(entry.instance_id, entry);
    }
  }
  console.log(`E03 entries in ledger: ${e03Ledger.size}`);

  // Check which backfilled E03s have ledger entries
  const backfilledWithLedger: string[] = [];
  const backfilledWithoutLedger: string[] = [];

  for (const id of backfilledIds) {
    if (e03Ledger.has(id)) {
      backfilledWithLedger.push(id);
    } else {
      backfilledWithoutLedger.push(id);
    }
  }

  console.log(`\nBackfilled E03s with ledger entry: ${backfilledWithLedger.length}`);
  console.log(`Backfilled E03s WITHOUT ledger entry: ${backfilledWithoutLedger.length}`);

  // Verify backfilled E03s are in DB
  const dbResult = await pool.query(
    `SELECT instance_id FROM entities 
     WHERE entity_type = 'E03' AND instance_id = ANY($1)`,
    [[...backfilledIds]]
  );
  console.log(`\nBackfilled E03s in DB: ${dbResult.rows.length}`);

  // Check DB for ALL E03s
  const allE03 = await pool.query('SELECT COUNT(*)::int AS c FROM entities WHERE entity_type = $1', ['E03']);
  console.log(`Total E03s in DB: ${allE03.rows[0].c}`);

  // Generate forensic report
  const report = {
    timestamp: new Date().toISOString(),
    backfilled_count: backfilledIds.size,
    backfilled_with_ledger: backfilledWithLedger.length,
    backfilled_without_ledger: backfilledWithoutLedger.length,
    total_e03_in_ledger: e03Ledger.size,
    total_e03_in_db: allE03.rows[0].c,
    ledger_gap: backfilledWithoutLedger.length,
    gap_instance_ids: backfilledWithoutLedger,
  };

  fs.writeFileSync('si-readiness-results/ledger-gap-forensics.json', JSON.stringify(report, null, 2));

  // Summary
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('FORENSIC SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════\n');

  if (backfilledWithoutLedger.length === 0) {
    console.log('✓ NO LEDGER GAP: All backfilled E03s have ledger entries');
  } else {
    console.log(`✗ LEDGER GAP CONFIRMED: ${backfilledWithoutLedger.length} E03s missing from ledger`);
    console.log('\nFirst 10 missing:');
    for (const id of backfilledWithoutLedger.slice(0, 10)) {
      console.log(`  ${id}`);
    }
  }

  console.log('\nReport saved: si-readiness-results/ledger-gap-forensics.json');

  await pool.end();
}

main().catch(console.error);
