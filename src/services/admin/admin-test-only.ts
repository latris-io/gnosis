// src/services/admin/admin-test-only.ts
// @implements INFRASTRUCTURE
// Test-only destructive helpers - guarded by NODE_ENV

// Hard runtime guard - throws immediately in non-test environments
if (process.env.NODE_ENV !== 'test') {
  throw new Error(
    'admin-test-only.ts can only be loaded when NODE_ENV=test. ' +
    'This module contains destructive operations not permitted in production.'
  );
}

import { pool } from '../../db/postgres.js';

/**
 * Create a test project.
 * For test setup only.
 */
export async function createTestProject(projectId: string, name: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      INSERT INTO projects (id, name)
      VALUES ($1, $2)
      ON CONFLICT (id) DO NOTHING
    `, [projectId, name]);
  } finally {
    client.release();
  }
}

/**
 * Delete entities for a project.
 * For test cleanup only.
 */
export async function deleteProjectEntities(projectId: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('DELETE FROM entities WHERE project_id = $1', [projectId]);
  } finally {
    client.release();
  }
}

/**
 * Delete a project.
 * For test cleanup only.
 */
export async function deleteProject(projectId: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('DELETE FROM projects WHERE id = $1', [projectId]);
  } finally {
    client.release();
  }
}
