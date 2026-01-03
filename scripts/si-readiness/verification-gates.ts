// @ts-nocheck
// @implements STORY-64.1
// Verification Gates
// Final pass/fail checks for SI-readiness

import 'dotenv/config';
import pg from 'pg';
import neo4j from 'neo4j-driver';
import * as fs from 'fs';

const { Pool } = pg;

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║              VERIFICATION GATES                                ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL, 
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
  });
  
  const driver = neo4j.driver(
    process.env.NEO4J_URL!,
    neo4j.auth.basic(process.env.NEO4J_USER!, process.env.NEO4J_PASSWORD!)
  );
  
  const projectId = '6df2f456-440d-4958-b475-d9808775ff69';
  const results: Record<string, { pass: boolean; details: string }> = {};

  // Gate 1: Entity Counts
  console.log('Gate 1: Entity Counts');
  const entities = await pool.query('SELECT entity_type, COUNT(*)::int AS c FROM entities GROUP BY entity_type ORDER BY entity_type');
  for (const row of entities.rows) {
    console.log(`  ${row.entity_type}: ${row.c}`);
  }
  const entityTotal = entities.rows.reduce((s, r) => s + r.c, 0);
  console.log(`  Total: ${entityTotal}`);
  const entityPass = entityTotal > 3000;
  results['Entity Counts'] = { pass: entityPass, details: `${entityTotal} entities` };
  console.log(`  PASS: ${entityPass}\n`);

  // Gate 2: Relationship Counts
  console.log('Gate 2: Relationship Counts');
  const rels = await pool.query('SELECT relationship_type, COUNT(*)::int AS c FROM relationships GROUP BY relationship_type ORDER BY relationship_type');
  for (const row of rels.rows) {
    console.log(`  ${row.relationship_type}: ${row.c}`);
  }
  const relTotal = rels.rows.reduce((s, r) => s + r.c, 0);
  console.log(`  Total: ${relTotal}`);
  const relPass = relTotal > 3000;
  results['Relationship Counts'] = { pass: relPass, details: `${relTotal} relationships` };
  console.log(`  PASS: ${relPass}\n`);

  // Gate 3: Neo4j Parity
  console.log('Gate 3: Neo4j Parity');
  const session = driver.session();
  try {
    const neo4jCount = await session.run(
      'MATCH ()-[r:RELATIONSHIP]->() WHERE r.project_id = $projectId RETURN count(r) AS c',
      { projectId }
    );
    const neo4jTotal = neo4jCount.records[0].get('c').toNumber();
    console.log(`  PostgreSQL: ${relTotal}`);
    console.log(`  Neo4j: ${neo4jTotal}`);
    const parityPass = neo4jTotal === relTotal;
    results['Neo4j Parity'] = { pass: parityPass, details: `PG=${relTotal}, Neo4j=${neo4jTotal}` };
    console.log(`  PASS: ${parityPass}\n`);
  } finally {
    await session.close();
  }

  // Gate 4: No Null Instance IDs
  console.log('Gate 4: No Null Instance IDs');
  const nullE = await pool.query('SELECT COUNT(*)::int AS c FROM entities WHERE instance_id IS NULL');
  const nullR = await pool.query('SELECT COUNT(*)::int AS c FROM relationships WHERE instance_id IS NULL');
  console.log(`  Null entity instance_ids: ${nullE.rows[0].c}`);
  console.log(`  Null relationship instance_ids: ${nullR.rows[0].c}`);
  const nullPass = nullE.rows[0].c === 0 && nullR.rows[0].c === 0;
  results['No Null Instance IDs'] = { pass: nullPass, details: `E=${nullE.rows[0].c}, R=${nullR.rows[0].c}` };
  console.log(`  PASS: ${nullPass}\n`);

  // Gate 5: No Duplicate Instance IDs
  console.log('Gate 5: No Duplicate Instance IDs');
  const dupE = await pool.query('SELECT instance_id, COUNT(*)::int AS c FROM entities GROUP BY instance_id HAVING COUNT(*) > 1');
  const dupR = await pool.query('SELECT instance_id, COUNT(*)::int AS c FROM relationships GROUP BY instance_id HAVING COUNT(*) > 1');
  console.log(`  Duplicate entity instance_ids: ${dupE.rows.length}`);
  console.log(`  Duplicate relationship instance_ids: ${dupR.rows.length}`);
  const dupPass = dupE.rows.length === 0 && dupR.rows.length === 0;
  results['No Duplicate Instance IDs'] = { pass: dupPass, details: `E=${dupE.rows.length}, R=${dupR.rows.length}` };
  console.log(`  PASS: ${dupPass}\n`);

  // Gate 6: Ledger Coverage
  console.log('Gate 6: Ledger Coverage');
  const ledgerAudit = JSON.parse(fs.readFileSync('si-readiness-results/ledger-audit-result.json', 'utf-8'));
  console.log(`  Coverage: ${ledgerAudit.coverage_percent}%`);
  console.log(`  Missing: ${ledgerAudit.missing_entities + ledgerAudit.missing_relationships}`);
  const ledgerPass = ledgerAudit.pass;
  results['Ledger Coverage'] = { pass: ledgerPass, details: `${ledgerAudit.coverage_percent}% coverage` };
  console.log(`  PASS: ${ledgerPass}\n`);

  // Gate 7: Corpus Keying
  console.log('Gate 7: Corpus Keying');
  const corpusAudit = JSON.parse(fs.readFileSync('si-readiness-results/corpus-audit-result.json', 'utf-8'));
  console.log(`  Valid references: ${corpusAudit.keying_validation.valid_refs}/${corpusAudit.keying_validation.sample_size}`);
  console.log(`  Has contrast classes: ${corpusAudit.contrast_classes.has_contrast}`);
  const corpusPass = corpusAudit.pass;
  results['Corpus Keying'] = { pass: corpusPass, details: `${corpusAudit.keying_validation.valid_refs} valid refs` };
  console.log(`  PASS: ${corpusPass}\n`);

  // Summary
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════\n');

  let allPass = true;
  for (const [gate, result] of Object.entries(results)) {
    const status = result.pass ? '✓ PASS' : '✗ FAIL';
    console.log(`  ${status}: ${gate} (${result.details})`);
    if (!result.pass) allPass = false;
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  if (allPass) {
    console.log('✓ ALL GATES PASS - SAFE TO PROCEED TO A3');
  } else {
    console.log('✗ SOME GATES FAILED - NOT SAFE TO PROCEED');
  }
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Write result
  fs.writeFileSync('si-readiness-results/verification-gates-result.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    project_id: projectId,
    gates: results,
    all_pass: allPass
  }, null, 2));

  await pool.end();
  await driver.close();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

