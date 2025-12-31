/**
 * A4 Canonical Project Evidence Script
 * 
 * Runs the A4 pipeline on the canonical project and outputs relationship counts.
 * All queries use proper RLS context via set_project_id().
 * 
 * @implements STORY-64.4
 * @g-api-exception Direct DB access required for verification evidence output.
 *   This script is read-only and only queries counts for closeout evidence.
 *   The ops layer does not expose the granular count queries needed here.
 */
import 'dotenv/config';
import { runPipeline } from '../src/ops/pipeline.js';
import { closeConnections } from '../src/ops/track-a.js';
import { pool } from '../src/db/postgres.js';
import type { PipelineConfig } from '../src/pipeline/types.js';

const CANONICAL_PROJECT_ID = '6df2f456-440d-4958-b475-d9808775ff69';

async function main() {
  console.log('=== A4 Canonical Project Evidence ===');
  console.log(`Project ID: ${CANONICAL_PROJECT_ID}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('');

  // Run pipeline on canonical project
  console.log('[PIPELINE] Starting extraction...');
  const startTime = Date.now();
  
  const config: PipelineConfig = {
    project_id: CANONICAL_PROJECT_ID,
    repo_path: process.cwd(),
    incremental: false,
    fail_fast: false,
  };

  const result = await runPipeline(config);
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[PIPELINE] Completed in ${duration}s`);
  console.log(`[PIPELINE] Success: ${result.success}`);
  console.log('');

  // Log stage results
  console.log('[STAGES]');
  for (const stage of result.stages) {
    const status = stage.success ? '✓' : '✗';
    console.log(`  ${status} ${stage.stage}: entities=${stage.entities_created}, relationships=${stage.relationships_created}`);
    if (stage.errors.length > 0) {
      console.log(`    errors: ${stage.errors.slice(0, 2).join('; ')}`);
    }
    if (stage.warnings.length > 0) {
      console.log(`    warnings: ${stage.warnings.slice(0, 2).join('; ')}`);
    }
  }
  console.log('');

  // Query counts with RLS context
  const client = await pool.connect();
  try {
    // Set RLS context
    await client.query('SELECT set_project_id($1)', [CANONICAL_PROJECT_ID]);
    
    // Verify RLS context is set
    const settingCheck = await client.query("SELECT current_setting('app.project_id', true) as val");
    console.log(`[RLS] app.project_id = ${settingCheck.rows[0]?.val}`);
    console.log('');

    // Total entity count
    const entityCount = await client.query(`
      SELECT COUNT(*) as count FROM entities WHERE project_id = $1
    `, [CANONICAL_PROJECT_ID]);
    console.log(`[COUNTS] Total entities: ${entityCount.rows[0].count}`);

    // Total relationship count
    const relCount = await client.query(`
      SELECT COUNT(*) as count FROM relationships WHERE project_id = $1
    `, [CANONICAL_PROJECT_ID]);
    console.log(`[COUNTS] Total relationships: ${relCount.rows[0].count}`);
    console.log('');

    // R21, R22, R23, R26 counts (AST relationships)
    const astRelCounts = await client.query(`
      SELECT relationship_type, COUNT(*) as count 
      FROM relationships 
      WHERE project_id = $1 AND relationship_type IN ('R21', 'R22', 'R23', 'R26')
      GROUP BY relationship_type
      ORDER BY relationship_type
    `, [CANONICAL_PROJECT_ID]);

    const counts: Record<string, number> = { R21: 0, R22: 0, R23: 0, R26: 0 };
    for (const row of astRelCounts.rows) {
      counts[row.relationship_type] = parseInt(row.count);
    }

    console.log('[AST RELATIONSHIPS]');
    console.log(`  R21 (IMPORTS): ${counts.R21}`);
    console.log(`  R22 (CALLS): ${counts.R22}`);
    console.log(`  R23 (EXTENDS): ${counts.R23}`);
    console.log(`  R26 (DEPENDS_ON): ${counts.R26}`);
    console.log('');

    // R14 count (TDD relationship)
    const r14Count = await client.query(`
      SELECT COUNT(*) as count FROM relationships 
      WHERE project_id = $1 AND relationship_type = 'R14'
    `, [CANONICAL_PROJECT_ID]);
    console.log(`[TDD RELATIONSHIPS]`);
    console.log(`  R14 (IMPLEMENTED_BY): ${r14Count.rows[0].count}`);
    console.log('');

    // Git relationships
    const gitRelCounts = await client.query(`
      SELECT relationship_type, COUNT(*) as count 
      FROM relationships 
      WHERE project_id = $1 AND relationship_type IN ('R63', 'R67', 'R70')
      GROUP BY relationship_type
      ORDER BY relationship_type
    `, [CANONICAL_PROJECT_ID]);

    const gitCounts: Record<string, number> = { R63: 0, R67: 0, R70: 0 };
    for (const row of gitRelCounts.rows) {
      gitCounts[row.relationship_type] = parseInt(row.count);
    }

    console.log('[GIT RELATIONSHIPS]');
    console.log(`  R63 (INTRODUCED_IN): ${gitCounts.R63}`);
    console.log(`  R67 (MODIFIED_IN): ${gitCounts.R67}`);
    console.log(`  R70 (GROUPS): ${gitCounts.R70}`);
    console.log('');

    // Entity breakdown by type
    const entityBreakdown = await client.query(`
      SELECT entity_type, COUNT(*) as count 
      FROM entities 
      WHERE project_id = $1
      GROUP BY entity_type
      ORDER BY entity_type
    `, [CANONICAL_PROJECT_ID]);

    console.log('[ENTITY BREAKDOWN]');
    for (const row of entityBreakdown.rows) {
      console.log(`  ${row.entity_type}: ${row.count}`);
    }
    console.log('');

  } finally {
    client.release();
  }

  // Close connections (closeConnections handles pool.end internally)
  await closeConnections();

  console.log('=== Evidence Complete ===');
}

main().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
