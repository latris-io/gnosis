// test/utils/db-meta.ts
// Database-wide query helper for tests (no RLS filtering)
// ONLY this file and rls.ts may import from src/db/*
// ONLY test/sanity/integrity.test.ts may import this module

import { getClient } from '../../src/db/postgres.js';

/**
 * Execute a database-wide query (no RLS filtering).
 * ASSERTS that RLS context is NOT set - fails if app.project_id is set.
 * 
 * Use for:
 * - Metadata queries (information_schema, pg_*, etc.)
 * - Structural invariant checks (orphan detection, duplicate checks)
 * - Database-wide counts and aggregations
 * 
 * If RLS context is unexpectedly set, throws an error directing to use rlsQuery() instead.
 * 
 * @param sql - SQL query string
 * @param params - Query parameters (optional)
 * @returns Array of result rows
 */
export async function metaQuery<T = any>(
  sql: string,
  params: any[] = []
): Promise<T[]> {
  const client = await getClient();
  try {
    // ASSERT: RLS context must NOT be set (this is intentionally db-wide)
    const check = await client.query(
      "SELECT current_setting('app.project_id', true) AS project_id"
    );
    const currentContext = check.rows?.[0]?.project_id;
    if (currentContext) {
      throw new Error(
        `[metaQuery] RLS context unexpectedly set: ${currentContext}. ` +
        `Use rlsQuery() for project-scoped queries.`
      );
    }

    const result = await client.query(sql, params);
    return result.rows as T[];
  } finally {
    client.release();
  }
}
