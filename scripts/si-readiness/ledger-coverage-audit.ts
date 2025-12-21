// @ts-nocheck
// @implements STORY-64.1
// Ledger Coverage Audit
// Verifies 100% shadow ledger coverage for all Track A mutations

import 'dotenv/config';
import * as fs from 'fs';
import pg from 'pg';

const { Pool } = pg;

interface LedgerEntry {
  timestamp: string;
  operation: 'CREATE' | 'UPDATE';
  kind: 'entity' | 'relationship';
  entity_type: string;
  entity_id: string;
  instance_id: string;
  content_hash: string;
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║              LEDGER COVERAGE AUDIT                             ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL, 
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false } 
  });

  // Load ledger entries
  const ledgerPath = 'shadow-ledger/ledger.jsonl';
  const ledgerContent = fs.readFileSync(ledgerPath, 'utf-8');
  const ledgerEntries: LedgerEntry[] = ledgerContent
    .split('\n')
    .filter(line => line.trim())
    .map(line => JSON.parse(line));

  console.log('Ledger Statistics:');
  console.log(`  Total entries: ${ledgerEntries.length}`);
  
  // Group by kind and operation
  const byKind: Record<string, number> = {};
  const byOperation: Record<string, number> = {};
  const entityIds = new Set<string>();
  const relIds = new Set<string>();

  for (const entry of ledgerEntries) {
    // kind is undefined for entities (backwards compat), 'relationship' for relationships
    const kind = entry.kind || 'entity';
    byKind[kind] = (byKind[kind] || 0) + 1;
    byOperation[entry.operation] = (byOperation[entry.operation] || 0) + 1;
    if (kind === 'entity') {
      entityIds.add(entry.instance_id);
    } else {
      relIds.add(entry.instance_id);
    }
  }

  console.log('\n  By kind:');
  for (const [kind, count] of Object.entries(byKind)) {
    console.log(`    ${kind}: ${count}`);
  }
  console.log('\n  By operation:');
  for (const [op, count] of Object.entries(byOperation)) {
    console.log(`    ${op}: ${count}`);
  }

  // Compare to database
  console.log('\n─────────────────────────────────────────────────────────────────');
  console.log('Database Comparison:');

  const dbEntities = await pool.query('SELECT instance_id FROM entities');
  const dbRelations = await pool.query('SELECT instance_id FROM relationships');

  const dbEntityIds = new Set(dbEntities.rows.map(r => r.instance_id));
  const dbRelIds = new Set(dbRelations.rows.map(r => r.instance_id));

  console.log(`\n  Entities in DB: ${dbEntityIds.size}`);
  console.log(`  Entities in ledger: ${entityIds.size}`);

  const missingFromLedgerEntities = [...dbEntityIds].filter(id => !entityIds.has(id));
  const extraInLedgerEntities = [...entityIds].filter(id => !dbEntityIds.has(id));

  console.log(`  Missing from ledger: ${missingFromLedgerEntities.length}`);
  console.log(`  Extra in ledger (deleted?): ${extraInLedgerEntities.length}`);

  console.log(`\n  Relationships in DB: ${dbRelIds.size}`);
  console.log(`  Relationships in ledger: ${relIds.size}`);

  const missingFromLedgerRels = [...dbRelIds].filter(id => !relIds.has(id));
  const extraInLedgerRels = [...relIds].filter(id => !dbRelIds.has(id));

  console.log(`  Missing from ledger: ${missingFromLedgerRels.length}`);
  console.log(`  Extra in ledger (deleted?): ${extraInLedgerRels.length}`);

  // Verdict
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('VERDICT');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const totalDB = dbEntityIds.size + dbRelIds.size;
  const totalLedger = entityIds.size + relIds.size;
  const totalMissing = missingFromLedgerEntities.length + missingFromLedgerRels.length;

  console.log(`Total mutations in DB: ${totalDB}`);
  console.log(`Unique instances in ledger: ${totalLedger}`);
  console.log(`Missing from ledger: ${totalMissing}`);

  const coveragePercent = ((totalDB - totalMissing) / totalDB * 100).toFixed(1);
  console.log(`\nCoverage: ${coveragePercent}%`);

  if (totalMissing === 0) {
    console.log('\n✓ PASS: 100% ledger coverage achieved');
    console.log('  Every entity and relationship in DB has a corresponding ledger entry.');
  } else {
    console.log('\n✗ FAIL: Missing ledger entries');
    if (missingFromLedgerEntities.length > 0) {
      console.log('\n  Missing entity instance_ids (first 10):');
      for (const id of missingFromLedgerEntities.slice(0, 10)) {
        console.log(`    - ${id}`);
      }
    }
    if (missingFromLedgerRels.length > 0) {
      console.log('\n  Missing relationship instance_ids (first 10):');
      for (const id of missingFromLedgerRels.slice(0, 10)) {
        console.log(`    - ${id}`);
      }
    }
  }

  // Write result
  fs.mkdirSync('si-readiness-results', { recursive: true });
  const result = {
    timestamp: new Date().toISOString(),
    ledger_entries: ledgerEntries.length,
    db_entities: dbEntityIds.size,
    db_relationships: dbRelIds.size,
    ledger_entities: entityIds.size,
    ledger_relationships: relIds.size,
    missing_entities: missingFromLedgerEntities.length,
    missing_relationships: missingFromLedgerRels.length,
    coverage_percent: parseFloat(coveragePercent),
    pass: totalMissing === 0
  };
  fs.writeFileSync('si-readiness-results/ledger-audit-result.json', JSON.stringify(result, null, 2));
  console.log('\nResult written to: si-readiness-results/ledger-audit-result.json');

  await pool.end();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
