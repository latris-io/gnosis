// scripts/check-constraints.ts
// Safe-by-default DB schema checker
// Default: CHECK-ONLY mode (no mutations)
// Mutations require BOTH: --fix flag AND ALLOW_DB_FIX=1 env var

import { pool } from '../src/db/postgres.js';

// CLI and environment parsing
const FIX_MODE = process.argv.includes('--fix');
const ALLOW_FIX = process.env.ALLOW_DB_FIX === '1';

/**
 * Get database connection info with password redaction.
 * Fails fast if no DB URL is configured.
 */
function getDbInfo(): { envVar: string; url: string; display: string } {
  const envVar = process.env.TEST_DATABASE_URL ? 'TEST_DATABASE_URL' : 'DATABASE_URL';
  const url = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || '';

  // Fail fast if no DB URL
  if (!url) {
    console.error('[ERROR] No database URL configured');
    console.error('Set DATABASE_URL or TEST_DATABASE_URL environment variable');
    process.exit(1);
  }

  // Redact password using URL parsing (safer than regex)
  let display: string;
  try {
    const parsed = new URL(url);
    if (parsed.password) {
      parsed.password = '***';
    }
    display = parsed.toString();
  } catch {
    // Fallback to regex if URL parsing fails
    display = url.replace(/:([^:@]+)@/, ':***@');
  }

  return { envVar, url, display };
}

// Constraint check query (semantics-based, not name-based)
const CONSTRAINT_QUERY = `
  SELECT c.conname, pg_get_constraintdef(c.oid) as def
  FROM pg_constraint c
  JOIN pg_class t ON c.conrelid = t.oid
  WHERE t.relname = 'entities'
    AND c.contype IN ('u', 'p')
`;

async function main() {
  // Get DB info (fails fast if missing)
  const dbInfo = getDbInfo();

  // Print summary
  console.log('=== DB Schema Check ===');
  console.log(`Database: ${dbInfo.display}`);
  console.log(`Env var: ${dbInfo.envVar}`);
  console.log(`Mode: ${FIX_MODE ? 'FIX' : 'CHECK-ONLY'}`);
  if (FIX_MODE) {
    console.log(`ALLOW_DB_FIX: ${ALLOW_FIX ? 'yes' : 'no'}`);
    if (ALLOW_FIX) {
      console.log('[WARNING] This will mutate the DB schema if constraint is missing');
    }
  }

  const client = await pool.connect();
  try {
    // Check applied migrations
    const migrations = await client.query('SELECT name FROM migrations ORDER BY id');
    console.log('\nApplied migrations:');
    migrations.rows.forEach((r: { name: string }) => console.log(`  ${r.name}`));

    // Check constraints (semantics-based)
    const result = await client.query<{ conname: string; def: string }>(CONSTRAINT_QUERY);
    console.log('\nConstraints on entities table:');
    result.rows.forEach((r) => console.log(`  ${r.conname}: ${r.def}`));

    // Check if upsert semantics are supported (project_id, instance_id uniqueness)
    const hasUpsertSupport = result.rows.some((r) =>
      r.def.includes('project_id') && r.def.includes('instance_id')
    );
    console.log(`\nUpsert support (project_id, instance_id): ${hasUpsertSupport}`);

    if (!hasUpsertSupport) {
      console.error('\n[ERROR] Constraint missing or wrong: need UNIQUE (project_id, instance_id)');
      console.error('');
      console.error('To fix manually:');
      console.error(`  psql $${dbInfo.envVar} -f migrations/003_reset_schema_to_cursor_plan.sql`);
      console.error('');
      console.error('To auto-fix (dev only):');
      console.error('  ALLOW_DB_FIX=1 npx tsx scripts/check-constraints.ts --fix');
      console.error('');

      // Gate 1: Must have --fix flag
      if (!FIX_MODE) {
        process.exit(1);
      }

      // Gate 2: Must have ALLOW_DB_FIX=1
      if (!ALLOW_FIX) {
        console.error('[REFUSED] --fix requires ALLOW_DB_FIX=1 environment variable');
        process.exit(1);
      }

      // Both gates passed - proceed with fix
      console.log('=== FIXING CONSTRAINT (--fix + ALLOW_DB_FIX=1) ===');

      // Drop old constraint if exists (UNIQUE instance_id only)
      const oldConstraint = result.rows.find((r) =>
        r.def.includes('instance_id') && !r.def.includes('project_id')
      );
      if (oldConstraint) {
        console.log(`Dropping old constraint: ${oldConstraint.conname}`);
        await client.query(`ALTER TABLE entities DROP CONSTRAINT IF EXISTS "${oldConstraint.conname}"`);
      }

      // Add correct constraint
      console.log('Adding constraint: entities_project_instance_unique');
      await client.query(`
        ALTER TABLE entities 
        ADD CONSTRAINT entities_project_instance_unique 
        UNIQUE (project_id, instance_id)
      `);

      // Re-check after fix
      const verify = await client.query<{ conname: string; def: string }>(CONSTRAINT_QUERY);
      console.log('\nConstraints after fix:');
      verify.rows.forEach((r) => console.log(`  ${r.conname}: ${r.def}`));

      const stillMissing = !verify.rows.some((r) =>
        r.def.includes('project_id') && r.def.includes('instance_id')
      );
      if (stillMissing) {
        console.error('\n[ERROR] Fix failed - constraint still missing');
        process.exit(1);
      }

      console.log('\n[OK] Constraint fixed and verified');
    } else {
      console.log('\n[OK] Constraint exists: UNIQUE (project_id, instance_id)');
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('[ERROR]', err);
  process.exit(1);
});
