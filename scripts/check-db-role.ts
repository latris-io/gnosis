import pg from 'pg';
async function main() {
  const pool = new pg.Pool({ 
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT current_user, rolsuper, rolbypassrls FROM pg_roles WHERE rolname = current_user');
    console.log('current_user:', result.rows[0].current_user);
    console.log('rolsuper:', result.rows[0].rolsuper);
    console.log('rolbypassrls:', result.rows[0].rolbypassrls);
  } finally {
    client.release();
    await pool.end();
  }
}
main().catch(console.error);
