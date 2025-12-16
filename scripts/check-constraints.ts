// Temporary script to check and fix DB constraints
import { pool } from '../src/db/postgres.js';

async function main() {
  const client = await pool.connect();
  try {
    // Check applied migrations
    const migrations = await client.query('SELECT name FROM migrations ORDER BY id');
    console.log('Applied migrations:');
    migrations.rows.forEach((r: { name: string }) => console.log(' ', r.name));
    
    const result = await client.query(`
      SELECT c.conname, pg_get_constraintdef(c.oid) as def
      FROM pg_constraint c
      JOIN pg_class t ON c.conrelid = t.oid
      WHERE t.relname = 'entities'
        AND c.contype IN ('u', 'p')
    `);
    console.log('\nConstraints on entities table:');
    result.rows.forEach((r: { conname: string; def: string }) => 
      console.log(`  ${r.conname}: ${r.def}`)
    );
    
    // Check if has upsert support
    const hasUpsertSupport = result.rows.some((r: { def: string }) =>
      r.def.includes('project_id') && r.def.includes('instance_id')
    );
    console.log('\nUpsert support (project_id, instance_id):', hasUpsertSupport);
    
    if (!hasUpsertSupport) {
      console.log('\n=== FIXING CONSTRAINT ===');
      
      // First, check if there's an old instance_id-only constraint
      const oldConstraint = result.rows.find((r: { def: string }) => 
        r.def.includes('instance_id') && !r.def.includes('project_id')
      );
      
      if (oldConstraint) {
        console.log(`Dropping old constraint: ${(oldConstraint as { conname: string }).conname}`);
        await client.query(`ALTER TABLE entities DROP CONSTRAINT IF EXISTS "${(oldConstraint as { conname: string }).conname}"`);
      }
      
      // Add the correct constraint
      console.log('Adding correct constraint: entities_project_instance_unique');
      await client.query(`
        ALTER TABLE entities 
        ADD CONSTRAINT entities_project_instance_unique 
        UNIQUE (project_id, instance_id)
      `);
      
      console.log('Constraint fixed!');
      
      // Verify
      const verify = await client.query(`
        SELECT pg_get_constraintdef(c.oid) as def
        FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        WHERE t.relname = 'entities'
          AND c.contype IN ('u', 'p')
      `);
      console.log('\nConstraints after fix:');
      verify.rows.forEach((r: { def: string }) => console.log(' ', r.def));
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
