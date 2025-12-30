// scripts/pristine-gate-postgres.ts
// Pristine Gate Postgres verification
import { pool, setProjectContext, getClient } from '../src/db/postgres.js';

const PROJECT_ID = '6df2f456-440d-4958-b475-d9808775ff69';

async function main() {
  const client = await getClient();
  try {
    await setProjectContext(client, PROJECT_ID);
    
    console.log('=== 3A) BRD REGISTRY COUNTS ===');
    const brdResult = await client.query(`
      SELECT
        SUM(CASE WHEN entity_type='E01' THEN 1 ELSE 0 END)::int AS epics,
        SUM(CASE WHEN entity_type='E02' THEN 1 ELSE 0 END)::int AS stories,
        SUM(CASE WHEN entity_type='E03' THEN 1 ELSE 0 END)::int AS acs
      FROM entities
    `);
    const { epics, stories, acs } = brdResult.rows[0];
    console.log(`epics=${epics}, stories=${stories}, acs=${acs}`);
    console.log(`Expected: epics=65, stories=397, acs=3147`);
    console.log(`Match: ${epics === 65 && stories === 397 && acs === 3147 ? 'PASS' : 'FAIL'}`);
    
    console.log('\n=== 3B) CORE STRUCTURAL ENTITIES ===');
    const structResult = await client.query(`
      SELECT entity_type, COUNT(*)::int AS n
      FROM entities
      WHERE entity_type IN ('E11','E12','E27','E28','E29','E50')
      GROUP BY entity_type
      ORDER BY entity_type
    `);
    structResult.rows.forEach(r => console.log(`  ${r.entity_type}: ${r.n}`));
    
    console.log('\n=== 3C) CORE RELATIONSHIPS (MUST BE >0) ===');
    const coreRelsResult = await client.query(`
      SELECT relationship_type, COUNT(*)::int AS n
      FROM relationships
      WHERE relationship_type IN ('R01','R02','R04','R05','R06','R07','R16','R18','R19','R36','R37')
      GROUP BY relationship_type
      ORDER BY relationship_type
    `);
    coreRelsResult.rows.forEach(r => console.log(`  ${r.relationship_type}: ${r.n}`));
    
    console.log('\n=== 3D) ALLOWED-TO-BE-ZERO (REPORT ONLY) ===');
    const zeroOkResult = await client.query(`
      SELECT 'E04' AS type, COUNT(*)::int AS n FROM entities WHERE entity_type='E04'
      UNION ALL
      SELECT 'R03' AS type, COUNT(*)::int AS n FROM relationships WHERE relationship_type='R03'
      UNION ALL
      SELECT 'E49' AS type, COUNT(*)::int AS n FROM entities WHERE entity_type='E49'
      UNION ALL
      SELECT 'E52' AS type, COUNT(*)::int AS n FROM entities WHERE entity_type='E52'
    `);
    zeroOkResult.rows.forEach(r => console.log(`  ${r.type}: ${r.n}`));
    
    console.log('\n=== 3E) EVIDENCE ANCHOR INTEGRITY ===');
    const badEntitiesResult = await client.query(`
      SELECT COUNT(*)::int AS bad_entities
      FROM entities
      WHERE source_file IS NULL OR source_file='' OR line_start<=0 OR line_end<line_start OR extracted_at IS NULL
    `);
    console.log(`bad_entities: ${badEntitiesResult.rows[0].bad_entities}`);
    
    const badRelsResult = await client.query(`
      SELECT COUNT(*)::int AS bad_relationships
      FROM relationships
      WHERE source_file IS NULL OR source_file='' OR line_start<=0 OR line_end<line_start OR extracted_at IS NULL
    `);
    console.log(`bad_relationships: ${badRelsResult.rows[0].bad_relationships}`);
    
    console.log('\n=== POSTGRES TOTALS ===');
    const totalEntities = await client.query(`SELECT COUNT(*)::int AS total FROM entities`);
    const totalRels = await client.query(`SELECT COUNT(*)::int AS total FROM relationships`);
    console.log(`Total entities: ${totalEntities.rows[0].total}`);
    console.log(`Total relationships: ${totalRels.rows[0].total}`);
    
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});

