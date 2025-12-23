#!/usr/bin/env tsx
/**
 * Pre-A2 Phase 2 Verification Script
 * 
 * @deprecated This script is from pre-A2 Phase 2 and uses raw DB access.
 * It is marked as a G-API exception because:
 * 1. It's test-only (NODE_ENV=test guard)
 * 2. It does complex read-only SQL queries for verification
 * 3. A2 Phase 2 is now complete
 * 
 * TODO: Refactor to use ops entrypoints if still needed.
 * @g-api-exception LEGACY_VERIFICATION_SCRIPT
 * 
 * Verifies all A2 Phase 1 invariants before proceeding to Phase 2.
 * READ-ONLY: No extraction, no writes. Fails fast with clear errors.
 * 
 * Usage:
 *   NODE_ENV=test PROJECT_ID=$PROJECT_ID npx tsx scripts/pre-phase2-check.ts
 * 
 * @implements STORY-64.2
 */

// ─────────────────────────────────────────────────────────────────────────────
// ENVIRONMENT GUARDS (checked BEFORE any imports)
// ─────────────────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  console.error('═══════════════════════════════════════════════════════════');
  console.error('ERROR: NODE_ENV must be "test" to run this script.');
  console.error('');
  console.error('This script imports from admin-test-only.ts which is guarded');
  console.error('to prevent accidental execution in production environments.');
  console.error('');
  console.error('Run with:');
  console.error('  NODE_ENV=test PROJECT_ID=$PROJECT_ID npx tsx scripts/pre-phase2-check.ts');
  console.error('═══════════════════════════════════════════════════════════');
  process.exit(1);
}

if (!process.env.PROJECT_ID) {
  console.error('ERROR: PROJECT_ID environment variable required');
  process.exit(1);
}

// Dynamic imports after environment checks pass
async function run() {
  const { getClient, setProjectContext, closePool } = await import('../src/db/postgres.js');
  const { countNeo4jNodes, countNeo4jRelationships } = await import('../src/services/admin/admin-test-only.js');
  const { closeDriver } = await import('../src/db/neo4j.js');
  
  const PROJECT_ID = process.env.PROJECT_ID!;

  // Track failures
  let allPassed = true;
  const failures: Array<{
    name: string;
    expected: string;
    actual: string;
    samples?: Array<{ instance_id: string; type: string }>;
  }> = [];

  interface CheckOptions {
    expected: string;
    actual: string;
    samples?: Array<{ instance_id: string; type: string }>;
  }

  function check(name: string, passed: boolean, opts: CheckOptions): void {
    if (passed) {
      console.log(`  ✓ ${name}`);
    } else {
      console.log(`  ✗ ${name}`);
      console.log(`    → expected: ${opts.expected}`);
      console.log(`    → actual:   ${opts.actual}`);
      if (opts.samples && opts.samples.length > 0) {
        console.log(`    → offending rows (first ${opts.samples.length}):`);
        for (const s of opts.samples) {
          console.log(`       - ${s.instance_id} (${s.type})`);
        }
      }
      allPassed = false;
      failures.push({ name, ...opts });
    }
  }

  /**
   * Fetch up to 3 offending rows for a given query condition.
   */
  async function getOffendingRows(
    client: any,
    condition: string
  ): Promise<Array<{ instance_id: string; type: string }>> {
    const result = await client.query(`
      SELECT r.instance_id, r.relationship_type AS type
      FROM relationships r
      LEFT JOIN entities ef ON ef.id = r.from_entity_id
      LEFT JOIN entities et ON et.id = r.to_entity_id
      WHERE ${condition}
      LIMIT 3
    `);
    return result.rows.map((row: any) => ({
      instance_id: row.instance_id,
      type: row.type,
    }));
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log('       PRE-A2 PHASE 2 VERIFICATION');
  console.log('═══════════════════════════════════════════════════════════\n');

  const client = await getClient();
  try {
    await setProjectContext(client, PROJECT_ID);

    // ─────────────────────────────────────────────────────────────────────────
    // 1) RELATIONSHIP COUNTS
    // ─────────────────────────────────────────────────────────────────────────
    console.log('1) Relationship Counts\n');

    const relCounts = await client.query(`
      SELECT relationship_type, COUNT(*)::int AS n
      FROM relationships
      WHERE relationship_type IN ('R01','R02','R03')
      GROUP BY relationship_type ORDER BY relationship_type
    `);
    const r01 = relCounts.rows.find((r: any) => r.relationship_type === 'R01')?.n ?? 0;
    const r02 = relCounts.rows.find((r: any) => r.relationship_type === 'R02')?.n ?? 0;
    const r03 = relCounts.rows.find((r: any) => r.relationship_type === 'R03')?.n ?? 0;
    const total = r01 + r02 + r03;

    check('R01 (HAS_STORY) = 351', r01 === 351, { expected: '351', actual: String(r01) });
    check('R02 (HAS_AC) = 2849', r02 === 2849, { expected: '2849', actual: String(r02) });
    check('R03 (HAS_CONSTRAINT) = 0', r03 === 0, { expected: '0', actual: String(r03) });
    check('Total (R01+R02+R03) = 3200', total === 3200, { expected: '3200', actual: String(total) });

    // ─────────────────────────────────────────────────────────────────────────
    // 2) REFERENTIAL INTEGRITY
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n2) Referential Integrity\n');

    const orphans = await client.query(`
      SELECT COUNT(*)::int AS n FROM relationships r
      LEFT JOIN entities ef ON ef.id = r.from_entity_id
      LEFT JOIN entities et ON et.id = r.to_entity_id
      WHERE ef.id IS NULL OR et.id IS NULL
    `);
    const orphanCount = orphans.rows[0].n;
    let orphanSamples: Array<{ instance_id: string; type: string }> = [];
    if (orphanCount > 0) {
      orphanSamples = await getOffendingRows(client, 'ef.id IS NULL OR et.id IS NULL');
    }
    check('No orphan relationships', orphanCount === 0, {
      expected: '0 orphans',
      actual: `${orphanCount} orphans`,
      samples: orphanSamples,
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 3) TYPE CORRECTNESS
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n3) Relationship Type Correctness\n');

    const badR01 = await client.query(`
      SELECT COUNT(*)::int AS n FROM relationships r
      JOIN entities ef ON ef.id = r.from_entity_id
      JOIN entities et ON et.id = r.to_entity_id
      WHERE r.relationship_type='R01'
        AND NOT (ef.entity_type='E01' AND et.entity_type='E02')
    `);
    const badR01Count = badR01.rows[0].n;
    let badR01Samples: Array<{ instance_id: string; type: string }> = [];
    if (badR01Count > 0) {
      badR01Samples = await getOffendingRows(
        client,
        "r.relationship_type='R01' AND NOT (ef.entity_type='E01' AND et.entity_type='E02')"
      );
    }
    check('R01 always E01→E02', badR01Count === 0, {
      expected: '0 violations',
      actual: `${badR01Count} violations`,
      samples: badR01Samples,
    });

    const badR02 = await client.query(`
      SELECT COUNT(*)::int AS n FROM relationships r
      JOIN entities ef ON ef.id = r.from_entity_id
      JOIN entities et ON et.id = r.to_entity_id
      WHERE r.relationship_type='R02'
        AND NOT (ef.entity_type='E02' AND et.entity_type='E03')
    `);
    const badR02Count = badR02.rows[0].n;
    let badR02Samples: Array<{ instance_id: string; type: string }> = [];
    if (badR02Count > 0) {
      badR02Samples = await getOffendingRows(
        client,
        "r.relationship_type='R02' AND NOT (ef.entity_type='E02' AND et.entity_type='E03')"
      );
    }
    check('R02 always E02→E03', badR02Count === 0, {
      expected: '0 violations',
      actual: `${badR02Count} violations`,
      samples: badR02Samples,
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 4) EVIDENCE ANCHORS
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n4) Evidence Anchors\n');

    const badEvidence = await client.query(`
      SELECT
        COUNT(*) FILTER (WHERE source_file IS NULL OR source_file='')::int AS empty_sf,
        COUNT(*) FILTER (WHERE line_start IS NULL OR line_start < 1)::int AS bad_ls,
        COUNT(*) FILTER (WHERE line_end IS NULL OR line_end < line_start)::int AS bad_le
      FROM relationships
      WHERE relationship_type IN ('R01','R02','R03')
    `);

    const emptySf = badEvidence.rows[0].empty_sf;
    let emptySfSamples: Array<{ instance_id: string; type: string }> = [];
    if (emptySf > 0) {
      emptySfSamples = await getOffendingRows(
        client,
        "r.relationship_type IN ('R01','R02','R03') AND (r.source_file IS NULL OR r.source_file='')"
      );
    }
    check('No empty source_file', emptySf === 0, {
      expected: '0 empty',
      actual: `${emptySf} empty`,
      samples: emptySfSamples,
    });

    const badLs = badEvidence.rows[0].bad_ls;
    let badLsSamples: Array<{ instance_id: string; type: string }> = [];
    if (badLs > 0) {
      badLsSamples = await getOffendingRows(
        client,
        "r.relationship_type IN ('R01','R02','R03') AND (r.line_start IS NULL OR r.line_start < 1)"
      );
    }
    check('No bad line_start (must be >= 1)', badLs === 0, {
      expected: '0 invalid',
      actual: `${badLs} invalid`,
      samples: badLsSamples,
    });

    const badLe = badEvidence.rows[0].bad_le;
    let badLeSamples: Array<{ instance_id: string; type: string }> = [];
    if (badLe > 0) {
      badLeSamples = await getOffendingRows(
        client,
        "r.relationship_type IN ('R01','R02','R03') AND (r.line_end IS NULL OR r.line_end < r.line_start)"
      );
    }
    check('No bad line_end (must be >= line_start)', badLe === 0, {
      expected: '0 invalid',
      actual: `${badLe} invalid`,
      samples: badLeSamples,
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 5) DUPLICATE DETECTION
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n5) Duplicate Detection\n');

    const dupRels = await client.query(`
      SELECT instance_id, relationship_type AS type, COUNT(*)::int AS n
      FROM relationships
      GROUP BY instance_id, relationship_type HAVING COUNT(*) > 1
      LIMIT 3
    `);
    const dupSamples = dupRels.rows.map((row: any) => ({
      instance_id: `${row.instance_id} (x${row.n})`,
      type: row.type,
    }));
    check('No duplicate relationship instance_ids', dupRels.rows.length === 0, {
      expected: '0 duplicates',
      actual: `${dupRels.rows.length} duplicates`,
      samples: dupSamples,
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 6) NEO4J COUNTS
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n6) Neo4j Counts\n');

    const neo4jNodes = await countNeo4jNodes(PROJECT_ID);
    const neo4jRels = await countNeo4jRelationships(PROJECT_ID);

    check('Neo4j entity nodes = 3516', neo4jNodes === 3516, {
      expected: '3516',
      actual: String(neo4jNodes),
    });
    check('Neo4j relationships = 3200', neo4jRels === 3200, {
      expected: '3200',
      actual: String(neo4jRels),
    });

  } finally {
    client.release();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════════════');
  if (allPassed) {
    console.log('✅ ALL CHECKS PASSED — READY FOR A2 PHASE 2');
  } else {
    console.log(`❌ ${failures.length} CHECK(S) FAILED — FIX BEFORE PHASE 2`);
    console.log('');
    for (const f of failures) {
      console.log(`   • ${f.name}`);
      console.log(`     expected: ${f.expected}, actual: ${f.actual}`);
    }
  }
  console.log('═══════════════════════════════════════════════════════════\n');

  // Cleanup connections
  await closePool();
  await closeDriver();

  process.exit(allPassed ? 0 : 1);
}

run().catch(err => {
  console.error('Script error:', err);
  process.exit(1);
});
