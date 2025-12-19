// src/services/connections/connection-service.ts
// @implements STORY-64.1
// @tdd TDD-A1-ENTITY-REGISTRY
// Connection lifecycle management - allowed to import db
// Single public function only - closes both Postgres and Neo4j

import { closePool } from '../../db/postgres.js';
import { closeDriver } from '../../db/neo4j.js';

/**
 * Close all database connections (Postgres and Neo4j).
 * Use this for graceful shutdown in scripts and tests.
 * 
 * NOTE: Do NOT export closePostgres/closeNeo4j separately (prevent creep)
 */
export async function closeConnections(): Promise<void> {
  await Promise.all([
    closePool(),
    closeDriver(),
  ]);
}
