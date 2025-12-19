// scripts/check-constraints.ts
// Safe-by-default DB schema checker
// Default: CHECK-ONLY mode (no mutations)
// Mutations require BOTH: --fix flag AND ALLOW_DB_FIX=1 env var

import { getDbInfo, checkConstraints, fixUpsertConstraint, closeAdminPool } from '../src/ops/track-a.js';

// CLI and environment parsing
const FIX_MODE = process.argv.includes('--fix');
const ALLOW_FIX = process.env.ALLOW_DB_FIX === '1';

async function main() {
  // Get DB info (fails fast if missing)
  let dbInfo: { envVar: string; display: string };
  try {
    dbInfo = getDbInfo();
  } catch (error) {
    console.error('[ERROR]', error instanceof Error ? error.message : error);
    process.exit(1);
  }

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

  try {
    // Check constraints via ops layer
    const result = await checkConstraints();

    // Print migrations
    console.log('\nApplied migrations:');
    result.migrations.forEach(m => console.log(`  ${m.name}`));

    // Print constraints
    console.log('\nConstraints on entities table:');
    result.constraints.forEach(c => console.log(`  ${c.name}: ${c.definition}`));

    // Check upsert support
    console.log(`\nUpsert support (project_id, instance_id): ${result.hasUpsertSupport}`);

    if (!result.hasUpsertSupport) {
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
      await fixUpsertConstraint();

      // Re-check after fix
      const verify = await checkConstraints();
      console.log('\nConstraints after fix:');
      verify.constraints.forEach(c => console.log(`  ${c.name}: ${c.definition}`));

      if (!verify.hasUpsertSupport) {
        console.error('\n[ERROR] Fix failed - constraint still missing');
        process.exit(1);
      }

      console.log('\n[OK] Constraint fixed and verified');
    } else {
      console.log('\n[OK] Constraint exists: UNIQUE (project_id, instance_id)');
    }
  } finally {
    await closeAdminPool();
  }
}

main().catch((err) => {
  console.error('[ERROR]', err);
  process.exit(1);
});

