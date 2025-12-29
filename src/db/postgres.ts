// @implements INFRASTRUCTURE
// PostgreSQL connection module
import { Pool, PoolClient } from 'pg';
import { config } from '../config/env.js';

/**
 * PostgreSQL connection pool.
 * Uses DATABASE_URL from environment.
 */
export const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: {
    rejectUnauthorized: false, // Required for Render
  },
  // Idle timeout: close connections after 30s of inactivity to prevent hanging tests
  idleTimeoutMillis: 30000,
  // Connection timeout: 10s to connect
  connectionTimeoutMillis: 10000,
  // Allow pool to close when no connections are active
  allowExitOnIdle: true,
});

/**
 * Test database connection.
 * @returns true if connection successful
 * @throws Error if connection fails
 */
export async function testConnection(): Promise<boolean> {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
    return true;
  } finally {
    client.release();
  }
}

/**
 * Get a client from the pool.
 * Remember to release the client when done.
 */
export async function getClient(): Promise<PoolClient> {
  return pool.connect();
}

/**
 * Set the project context for RLS.
 * Must be called before any queries that depend on project isolation.
 */
export async function setProjectContext(client: PoolClient, projectId: string): Promise<void> {
  await client.query('SELECT set_project_id($1)', [projectId]);
}

/**
 * Close the pool.
 * Call this when shutting down the application.
 */
export async function closePool(): Promise<void> {
  await pool.end();
}


