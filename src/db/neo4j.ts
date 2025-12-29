// @implements INFRASTRUCTURE
// Neo4j driver connection module
import neo4j, { Driver, Session, QueryResult } from 'neo4j-driver';
import { config } from '../config/env.js';

/**
 * Neo4j driver instance.
 * Uses NEO4J_URL, NEO4J_USER, NEO4J_PASSWORD from environment.
 * 
 * Configuration addresses transient SSL errors with Neo4j Aura:
 * - maxConnectionPoolSize: Limit concurrent connections to prevent pool exhaustion
 * - connectionAcquisitionTimeout: Wait longer for available connections
 * - connectionTimeout: Allow more time for SSL handshake
 * - maxTransactionRetryTime: Retry transient failures automatically
 */
export const driver: Driver = neo4j.driver(
  config.neo4jUrl,
  neo4j.auth.basic(config.neo4jUser, config.neo4jPassword),
  {
    maxConnectionPoolSize: 50,
    connectionAcquisitionTimeout: 60000, // 60s to acquire connection
    connectionTimeout: 30000,            // 30s for connection/SSL handshake
    maxTransactionRetryTime: 30000,      // 30s retry for transient errors
  }
);

/**
 * Get a new session from the driver.
 * Remember to close the session when done.
 */
export function getSession(): Session {
  return driver.session();
}

/**
 * Retry helper for transient Neo4j errors (SSL handshake, connection issues).
 * Uses exponential backoff: 100ms, 200ms, 400ms, 800ms, 1600ms
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 5,
  baseDelayMs = 100
): Promise<T> {
  let lastError: Error | undefined;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      const isRetriable = 
        (error as { retriable?: boolean }).retriable === true ||
        (error as { code?: string }).code === 'SessionExpired' ||
        (error as { code?: string }).code === 'ServiceUnavailable' ||
        lastError.message?.includes('SSL') ||
        lastError.message?.includes('ECONNRESET');
      
      if (!isRetriable || attempt === maxRetries - 1) {
        throw error;
      }
      
      const delay = baseDelayMs * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

/**
 * Test database connection with retry for transient errors.
 * @returns true if connection successful
 * @throws Error if connection fails after retries
 */
export async function testConnection(): Promise<boolean> {
  return withRetry(async () => {
    const session = getSession();
    try {
      await session.run('RETURN 1');
      return true;
    } finally {
      await session.close();
    }
  });
}

/**
 * Run a Cypher query with automatic retry for transient errors.
 * Use this for critical operations that must succeed.
 */
export async function runWithRetry<T>(
  cypher: string,
  params: Record<string, unknown> = {}
): Promise<T[]> {
  return withRetry(async () => {
    const session = getSession();
    try {
      const result = await session.run(cypher, params);
      return result.records.map(r => r.toObject() as T);
    } finally {
      await session.close();
    }
  });
}

/**
 * Execute a session operation with automatic retry for transient errors.
 * This wraps the entire session lifecycle with retry logic.
 * Use this for sync operations that need resilience against transient Neo4j errors.
 * 
 * @param operation - Function that receives a session and returns a promise
 * @returns The result of the operation
 */
export async function withSessionRetry<T>(
  operation: (session: Session) => Promise<T>
): Promise<T> {
  return withRetry(async () => {
    const session = getSession();
    try {
      return await operation(session);
    } finally {
      await session.close();
    }
  });
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


