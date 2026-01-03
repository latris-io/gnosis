// src/api/v2/db.ts
// Track B Graph API v2 - Read-Only Database Access
// Per CID-2026-01-03: B.6.1 enumeration endpoints are permitted READ-ONLY direct database access
//
// Hardening requirements (all enforced here):
// 1. SET TRANSACTION READ ONLY
// 2. SELECT set_project_id($1) for RLS
// 3. Explicit columns (no SELECT *)
// 4. Explicit project_id filter in WHERE (belt+suspenders)
// 5. Pagination required (limit max 1000)
// 6. Module-level pool (single instance)

import { Pool, PoolClient } from 'pg';

// Module-level pool (single instance per process)
// Matches repo-standard config from src/db/postgres.ts
const v2Pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Render
  },
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  allowExitOnIdle: true,
});

/**
 * Execute a read-only operation with proper RLS context.
 * 
 * @param projectId - Project UUID for RLS scoping
 * @param fn - Function to execute with the client
 * @returns Result of the function
 * @throws On database errors (caller should handle)
 */
export async function withReadOnlyClient<T>(
  projectId: string,
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await v2Pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SET TRANSACTION READ ONLY');
    await client.query('SELECT set_project_id($1)', [projectId]);
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Gracefully close the v2 pool.
 * Call this on process shutdown if needed.
 */
export async function closeV2Pool(): Promise<void> {
  await v2Pool.end();
}

// Re-export PoolClient type for consumers
export type { PoolClient };

