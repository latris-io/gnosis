// @ts-nocheck
// Ledger Completeness Gate
// Verifies the invariant: COUNT(entities) + COUNT(relationships) == unique ledger entries
// Plus type-level coverage checks for Track B readiness
import 'dotenv/config';
import * as fs from 'fs';
import pg from 'pg';

const { Pool } = pg;

interface TypeCoverage {
  type: string;
  db_count: number;
  ledger_count: number;
  missing: number;
  coverage_pct: number;
  pass: boolean;
}

interface CompletenessReport {
  timestamp: string;
  // Core invariant
  invariant: {
    db_entities: number;
    db_relationships: number;
    db_total: number;
    ledger_unique_entities: number;
    ledger_unique_relationships: number;
    ledger_total: number;
    entities_missing: number;
    relationships_missing: number;
    total_missing: number;
    pass: boolean;
  };
  // Type-level coverage (for Track B)
  entity_type_coverage: TypeCoverage[];
  relationship_type_coverage: TypeCoverage[];
  // Summary
  all_types_pass: boolean;
  verdict: 'PASS' | 'FAIL';
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║              LEDGER COMPLETENESS GATE                          ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL, 
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  // Load ledger
  const ledgerContent = fs.readFileSync('shadow-ledger/ledger.jsonl', 'utf-8');
  const ledgerLines = ledgerContent.split('\n').filter(l => l.trim());
  
  // Parse ledger entries and extract unique instance_ids by kind
  // Note: Ledger uses entity_type for BOTH entities and relationships
  const entityLedger = new Map<string, { entity_type: string }>();
  const relLedger = new Map<string, { relationship_type: string }>();
  
  for (const line of ledgerLines) {
    const entry = JSON.parse(line);
    if (entry.kind === 'relationship') {
      // For relationships, entity_type contains the R-code (e.g., "R02")
      relLedger.set(entry.instance_id, { relationship_type: entry.entity_type });
    } else {
      // kind undefined or 'entity' = entity
      entityLedger.set(entry.instance_id, { entity_type: entry.entity_type });
    }
  }

  console.log('Ledger Analysis:');
  console.log(`  Total lines: ${ledgerLines.length}`);
  console.log(`  Unique entities: ${entityLedger.size}`);
  console.log(`  Unique relationships: ${relLedger.size}`);

  // Get DB counts
  const dbEntities = await pool.query('SELECT instance_id, entity_type FROM entities');
  const dbRels = await pool.query('SELECT instance_id, relationship_type FROM relationships');

  console.log('\nDatabase State:');
  console.log(`  Entities: ${dbEntities.rows.length}`);
  console.log(`  Relationships: ${dbRels.rows.length}`);

  // Check core invariant: every DB record has a ledger entry
  const entitiesMissing: string[] = [];
  const relsMissing: string[] = [];

  for (const row of dbEntities.rows) {
    if (!entityLedger.has(row.instance_id)) {
      entitiesMissing.push(row.instance_id);
    }
  }

  for (const row of dbRels.rows) {
    if (!relLedger.has(row.instance_id)) {
      relsMissing.push(row.instance_id);
    }
  }

  const invariantPass = entitiesMissing.length === 0 && relsMissing.length === 0;

  console.log('\n─────────────────────────────────────────────────────────────────');
  console.log('Core Invariant: DB → Ledger Coverage');
  console.log('─────────────────────────────────────────────────────────────────');
  console.log(`  Entities missing from ledger: ${entitiesMissing.length}`);
  console.log(`  Relationships missing from ledger: ${relsMissing.length}`);
  console.log(`  Status: ${invariantPass ? '✓ PASS' : '✗ FAIL'}`);

  // Type-level coverage (for Track B)
  console.log('\n─────────────────────────────────────────────────────────────────');
  console.log('Entity Type Coverage');
  console.log('─────────────────────────────────────────────────────────────────');

  const entityTypeCoverage: TypeCoverage[] = [];
  const entityTypeDb = new Map<string, Set<string>>();
  const entityTypeLedger = new Map<string, Set<string>>();

  for (const row of dbEntities.rows) {
    if (!entityTypeDb.has(row.entity_type)) entityTypeDb.set(row.entity_type, new Set());
    entityTypeDb.get(row.entity_type)!.add(row.instance_id);
  }

  for (const [id, data] of entityLedger) {
    if (!entityTypeLedger.has(data.entity_type)) entityTypeLedger.set(data.entity_type, new Set());
    entityTypeLedger.get(data.entity_type)!.add(id);
  }

  for (const [type, dbIds] of [...entityTypeDb.entries()].sort()) {
    const ledgerIds = entityTypeLedger.get(type) || new Set();
    const missing = [...dbIds].filter(id => !ledgerIds.has(id)).length;
    const coverage = dbIds.size > 0 ? ((dbIds.size - missing) / dbIds.size) * 100 : 100;
    const pass = missing === 0;
    
    entityTypeCoverage.push({
      type,
      db_count: dbIds.size,
      ledger_count: ledgerIds.size,
      missing,
      coverage_pct: Math.round(coverage * 10) / 10,
      pass,
    });

    const status = pass ? '✓' : '✗';
    console.log(`  ${type}: ${dbIds.size} in DB, ${missing} missing ${status}`);
  }

  console.log('\n─────────────────────────────────────────────────────────────────');
  console.log('Relationship Type Coverage');
  console.log('─────────────────────────────────────────────────────────────────');

  const relTypeCoverage: TypeCoverage[] = [];
  const relTypeDb = new Map<string, Set<string>>();
  const relTypeLedger = new Map<string, Set<string>>();

  for (const row of dbRels.rows) {
    if (!relTypeDb.has(row.relationship_type)) relTypeDb.set(row.relationship_type, new Set());
    relTypeDb.get(row.relationship_type)!.add(row.instance_id);
  }

  for (const [id, data] of relLedger) {
    if (!relTypeLedger.has(data.relationship_type)) relTypeLedger.set(data.relationship_type, new Set());
    relTypeLedger.get(data.relationship_type)!.add(id);
  }

  for (const [type, dbIds] of [...relTypeDb.entries()].sort()) {
    const ledgerIds = relTypeLedger.get(type) || new Set();
    const missing = [...dbIds].filter(id => !ledgerIds.has(id)).length;
    const coverage = dbIds.size > 0 ? ((dbIds.size - missing) / dbIds.size) * 100 : 100;
    const pass = missing === 0;
    
    relTypeCoverage.push({
      type,
      db_count: dbIds.size,
      ledger_count: ledgerIds.size,
      missing,
      coverage_pct: Math.round(coverage * 10) / 10,
      pass,
    });

    const status = pass ? '✓' : '✗';
    console.log(`  ${type}: ${dbIds.size} in DB, ${missing} missing ${status}`);
  }

  const allTypesPass = 
    entityTypeCoverage.every(t => t.pass) && 
    relTypeCoverage.every(t => t.pass);

  const verdict = invariantPass && allTypesPass ? 'PASS' : 'FAIL';

  // Generate report
  const report: CompletenessReport = {
    timestamp: new Date().toISOString(),
    invariant: {
      db_entities: dbEntities.rows.length,
      db_relationships: dbRels.rows.length,
      db_total: dbEntities.rows.length + dbRels.rows.length,
      ledger_unique_entities: entityLedger.size,
      ledger_unique_relationships: relLedger.size,
      ledger_total: entityLedger.size + relLedger.size,
      entities_missing: entitiesMissing.length,
      relationships_missing: relsMissing.length,
      total_missing: entitiesMissing.length + relsMissing.length,
      pass: invariantPass,
    },
    entity_type_coverage: entityTypeCoverage,
    relationship_type_coverage: relTypeCoverage,
    all_types_pass: allTypesPass,
    verdict,
  };

  fs.mkdirSync('si-readiness-results', { recursive: true });
  fs.writeFileSync('si-readiness-results/ledger-completeness.json', JSON.stringify(report, null, 2));

  // Summary
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('VERDICT');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log(`Core Invariant: ${invariantPass ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`  DB total: ${report.invariant.db_total}`);
  console.log(`  Ledger total: ${report.invariant.ledger_total}`);
  console.log(`  Missing: ${report.invariant.total_missing}`);

  console.log(`\nType-Level Coverage: ${allTypesPass ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`  Entity types: ${entityTypeCoverage.filter(t => t.pass).length}/${entityTypeCoverage.length} pass`);
  console.log(`  Relationship types: ${relTypeCoverage.filter(t => t.pass).length}/${relTypeCoverage.length} pass`);

  console.log(`\n${verdict === 'PASS' ? '✓' : '✗'} FINAL VERDICT: ${verdict}`);
  console.log('\nReport saved: si-readiness-results/ledger-completeness.json');

  await pool.end();
  
  // Exit with appropriate code
  process.exit(verdict === 'PASS' ? 0 : 1);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
