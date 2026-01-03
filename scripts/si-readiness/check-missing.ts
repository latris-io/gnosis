// @ts-nocheck
import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  console.log('=== Checking DB for entities flagged as missing in replay ===\n');

  const r1 = await pool.query("SELECT instance_id FROM entities WHERE instance_id = 'FILE-src/extraction/providers/git-relationship-provider.ts'");
  console.log('git-relationship-provider.ts in DB:', r1.rows.length > 0 ? 'YES' : 'NO');

  const r2 = await pool.query("SELECT instance_id FROM entities WHERE entity_type = 'E11' AND instance_id LIKE '%git%'");
  console.log('E11 files containing "git":', r2.rows.length);
  for (const row of r2.rows) console.log('  ', row.instance_id);

  const r3 = await pool.query("SELECT instance_id FROM entities WHERE instance_id LIKE 'FUNC-src/ops/track-a.ts:%'");
  console.log('\nFunctions from track-a.ts:', r3.rows.length);
  for (const row of r3.rows) console.log('  ', row.instance_id);

  // Check if the missing functions exist anywhere
  const missing = [
    'FUNC-src/ops/track-a.ts:applyTddRelationshipInvariants',
    'FUNC-src/ops/track-a.ts:extractAndPersistTddEntities',
    'FUNC-src/ops/track-a.ts:extractAndPersistTddRelationships',
    'FUNC-src/ops/track-a.ts:extractAndPersistGitRelationships',
  ];

  console.log('\n=== Checking specific missing functions ===');
  for (const id of missing) {
    const r = await pool.query("SELECT instance_id FROM entities WHERE instance_id = $1", [id]);
    console.log(`  ${id}: ${r.rows.length > 0 ? 'EXISTS' : 'MISSING'}`);
  }

  await pool.end();
}

main().catch(console.error);

