// src/services/admin/admin-service.ts
// @implements STORY-64.1
// Administrative database operations - allowed to import db
// For infrastructure scripts only, not for normal application flow

import { pool } from '../../db/postgres.js';

export interface ConstraintInfo {
  name: string;
  definition: string;
}

export interface MigrationInfo {
  name: string;
}

export interface ConstraintCheckResult {
  hasUpsertSupport: boolean;
  constraints: ConstraintInfo[];
  migrations: MigrationInfo[];
}

/**
 * Get database connection info with password redaction.
 */
export function getDbInfo(): { envVar: string; display: string } {
  const envVar = process.env.TEST_DATABASE_URL ? 'TEST_DATABASE_URL' : 'DATABASE_URL';
  const url = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || '';

  if (!url) {
    throw new Error('No database URL configured. Set DATABASE_URL or TEST_DATABASE_URL environment variable');
  }

  let display: string;
  try {
    const parsed = new URL(url);
    if (parsed.password) {
      parsed.password = '***';
    }
    display = parsed.toString();
  } catch {
    display = url.replace(/:([^:@]+)@/, ':***@');
  }

  return { envVar, display };
}

/**
 * Check entity table constraints.
 */
export async function checkConstraints(): Promise<ConstraintCheckResult> {
  const client = await pool.connect();
  try {
    // Check applied migrations
    const migrationsResult = await client.query<{ name: string }>('SELECT name FROM migrations ORDER BY id');
    const migrations = migrationsResult.rows.map(r => ({ name: r.name }));

    // Check constraints
    const constraintQuery = `
      SELECT c.conname as name, pg_get_constraintdef(c.oid) as definition
      FROM pg_constraint c
      JOIN pg_class t ON c.conrelid = t.oid
      WHERE t.relname = 'entities'
        AND c.contype IN ('u', 'p')
    `;
    const constraintsResult = await client.query<{ name: string; definition: string }>(constraintQuery);
    const constraints = constraintsResult.rows.map(r => ({ name: r.name, definition: r.definition }));

    // Check if upsert semantics are supported
    const hasUpsertSupport = constraints.some(c =>
      c.definition.includes('project_id') && c.definition.includes('instance_id')
    );

    return { hasUpsertSupport, constraints, migrations };
  } finally {
    client.release();
  }
}

/**
 * Fix missing upsert constraint.
 * DANGEROUS: Only call if you know what you're doing.
 */
export async function fixUpsertConstraint(): Promise<void> {
  const client = await pool.connect();
  try {
    // Check current constraints
    const constraintQuery = `
      SELECT c.conname as name, pg_get_constraintdef(c.oid) as definition
      FROM pg_constraint c
      JOIN pg_class t ON c.conrelid = t.oid
      WHERE t.relname = 'entities'
        AND c.contype IN ('u', 'p')
    `;
    const result = await client.query<{ name: string; definition: string }>(constraintQuery);

    // Drop old constraint if exists (UNIQUE instance_id only)
    const oldConstraint = result.rows.find(r =>
      r.definition.includes('instance_id') && !r.definition.includes('project_id')
    );
    if (oldConstraint) {
      await client.query(`ALTER TABLE entities DROP CONSTRAINT IF EXISTS "${oldConstraint.name}"`);
    }

    // Add correct constraint
    await client.query(`
      ALTER TABLE entities 
      ADD CONSTRAINT entities_project_instance_unique 
      UNIQUE (project_id, instance_id)
    `);
  } finally {
    client.release();
  }
}

/**
 * Close the database pool.
 */
export async function closeAdminPool(): Promise<void> {
  await pool.end();
}

// NOTE: Test-only destructive helpers (createTestProject, deleteProjectEntities, deleteProject)
// have been moved to admin-test-only.ts with NODE_ENV guard.
