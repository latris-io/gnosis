// @ts-nocheck
import 'dotenv/config';
import pg from 'pg';
import * as fs from 'fs';

const { Pool } = pg;

async function main() {
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL, 
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  const e03 = await pool.query('SELECT COUNT(*)::int AS c FROM entities WHERE entity_type = $1', ['E03']);
  const r02 = await pool.query('SELECT COUNT(*)::int AS c FROM relationships WHERE relationship_type = $1', ['R02']);
  const ledger = fs.readFileSync('shadow-ledger/ledger.jsonl', 'utf-8').split('\n').filter(l => l.trim()).length;

  console.log('E03:', e03.rows[0].c, '(expected: 2849)');
  console.log('R02:', r02.rows[0].c);
  console.log('Ledger:', ledger);

  await pool.end();
}

main().catch(console.error);
