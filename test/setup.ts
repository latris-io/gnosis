// @implements INFRASTRUCTURE
// Test setup file - loads environment and initializes connections
import 'dotenv/config';

// Import database modules to ensure connections are available
// These will be lazily initialized when tests actually use them
export { pool, testConnection as testPostgres, closePool } from '../src/db/postgres.js';
export { driver, getSession, testConnection as testNeo4j, closeDriver } from '../src/db/neo4j.js';
export { config } from '../src/config/env.js';

// Global test utilities
export const TEST_PROJECT_ID = '00000000-0000-0000-0000-000000000001';

/**
 * Log message with timestamp for test debugging.
 */
export function testLog(message: string): void {
  console.log(`[TEST ${new Date().toISOString()}] ${message}`);
}
