// test/utils/rls.ts
// RLS-aware database access helper for tests
// ONLY this file and db-meta.ts may import from src/db/*

import type { PoolClient } from 'pg';
import { getClient, setProjectContext } from '../../src/db/postgres.js';

/**
 * Execute a callback with an RLS-enabled client for the specified project.
 * VERIFIES that RLS context is actually set (prevents silent bypass).
 * 
 * @param projectId - The project UUID to set as RLS context
 * @param fn - Callback receiving the configured client
 * @returns Result of the callback
 */
export async function withRlsClient<T>(
  projectId: string,
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  if (!projectId) throw new Error('[withRlsClient] projectId is required');

  const client = await getClient();
  try {
    await setProjectContext(client, projectId);

    // VERIFY context is actually set (prevents silent RLS bypass)
    const check = await client.query(
      "SELECT current_setting('app.project_id', true) AS project_id"
    );
    if (check.rows?.[0]?.project_id !== projectId) {
      throw new Error(
        `[withRlsClient] RLS context mismatch. Expected ${projectId}, got ${check.rows?.[0]?.project_id}`
      );
    }

    return await fn(client);
  } finally {
    client.release();
  }
}

/**
 * Execute an RLS-filtered query for the specified project.
 * Convenience wrapper around withRlsClient.
 * 
 * @param projectId - The project UUID to set as RLS context
 * @param sql - SQL query string
 * @param params - Query parameters (optional)
 * @returns Array of result rows
 */
export async function rlsQuery<T = any>(
  projectId: string,
  sql: string,
  params: any[] = []
): Promise<T[]> {
  return withRlsClient(projectId, async (client) => {
    const result = await client.query(sql, params);
    return result.rows as T[];
  });
}
