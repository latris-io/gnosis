import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  const client = await pool.connect();
  
  // PROJECT 1: gnosis-default
  console.log('--- PROJECT: gnosis-default (6df2f456-440d-4958-b475-d9808775ff69) ---');
  await client.query("SELECT set_project_id('6df2f456-440d-4958-b475-d9808775ff69')");
  const e1 = await client.query('SELECT COUNT(*) AS entities FROM entities');
  const r1 = await client.query('SELECT COUNT(*) AS relationships FROM relationships');
  console.log('entities |', e1.rows[0].entities);
  console.log('relationships |', r1.rows[0].relationships);
  
  // PROJECT 2: gnosis-self
  console.log('\n--- PROJECT: gnosis-self (edd303d7-b86f-48a9-abd0-0e9be228f195) ---');
  await client.query("SELECT set_project_id('edd303d7-b86f-48a9-abd0-0e9be228f195')");
  const e2 = await client.query('SELECT COUNT(*) AS entities FROM entities');
  const r2 = await client.query('SELECT COUNT(*) AS relationships FROM relationships');
  console.log('entities |', e2.rows[0].entities);
  console.log('relationships |', r2.rows[0].relationships);

  client.release();
  await pool.end();
}

main().catch(console.error);
