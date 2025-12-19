// @implements INFRASTRUCTURE
// Neo4j driver connection module
import neo4j, { Driver, Session } from 'neo4j-driver';
import { config } from '../config/env.js';

/**
 * Neo4j driver instance.
 * Uses NEO4J_URL, NEO4J_USER, NEO4J_PASSWORD from environment.
 */
export const driver: Driver = neo4j.driver(
  config.neo4jUrl,
  neo4j.auth.basic(config.neo4jUser, config.neo4jPassword)
);

/**
 * Get a new session from the driver.
 * Remember to close the session when done.
 */
export function getSession(): Session {
  return driver.session();
}

/**
 * Test database connection.
 * @returns true if connection successful
 * @throws Error if connection fails
 */
export async function testConnection(): Promise<boolean> {
  const session = getSession();
  try {
    await session.run('RETURN 1');
    return true;
  } finally {
    await session.close();
  }
}

/**
 * Close the driver.
 * Call this when shutting down the application.
 */
export async function closeDriver(): Promise<void> {
  await driver.close();
}

// Module-level memoization flag for constraint initialization
let constraintsInitialized = false;

/**
 * Ensure required constraints exist.
 * Per A5_GRAPH_API_V1.md and EXIT.md Upsert Rule (Locked).
 * Creates uniqueness constraint on (project_id, instance_id) for :Entity nodes.
 */
export async function ensureConstraints(): Promise<void> {
  const session = getSession();
  try {
    await session.run(`
      CREATE CONSTRAINT entity_project_instance_unique IF NOT EXISTS
      FOR (n:Entity) REQUIRE (n.project_id, n.instance_id) IS UNIQUE
    `);
  } finally {
    await session.close();
  }
}

/**
 * Memoized constraint initialization - runs once per process.
 * Call this from sync operations to avoid repeated constraint checks.
 * Only sets flag to true AFTER successful execution.
 */
export async function ensureConstraintsOnce(): Promise<void> {
  if (constraintsInitialized) return;
  await ensureConstraints();
  constraintsInitialized = true;  // Only after success
}

