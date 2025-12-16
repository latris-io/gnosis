#!/usr/bin/env npx tsx
// scripts/sync-to-neo4j.ts
// @implements STORY-64.1
// A1 Neo4j Sync - syncs entities from PostgreSQL to Neo4j
// Multi-tenant safe: includes project_id in MERGE key
// Label-agnostic: does NOT add :Entity label (A2 validator uses MATCH (n))

import 'dotenv/config';
import { pool, getClient, setProjectContext, closePool } from '../src/db/postgres.js';
import { driver, getSession, closeDriver } from '../src/db/neo4j.js';
import type { Session } from 'neo4j-driver';

// ============================================================================
// Configuration
// ============================================================================

const PROJECT_ID = process.env.PROJECT_ID;
const BATCH_SIZE = 500;

// ============================================================================
// Types
// ============================================================================

interface EntityRow {
  entity_type: string;
  instance_id: string;
  name: string;
  project_id: string;
}

// ============================================================================
// Helpers
// ============================================================================

function formatTimestamp(): string {
  return new Date().toISOString();
}

function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
  console.log('=== Neo4j Sync ===');
  console.log(`Project: ${PROJECT_ID}`);
  console.log(`Timestamp: ${formatTimestamp()}`);
  console.log('');

  // Validate PROJECT_ID
  if (!PROJECT_ID) {
    console.error('\x1b[31m[ERROR]\x1b[0m PROJECT_ID environment variable is required');
    console.error('Usage: PROJECT_ID=<uuid> npm run sync:neo4j');
    process.exit(1);
  }

  let totalSynced = 0;
  let session: Session | null = null;

  try {
    // Query all entities from PostgreSQL for this project
    console.log('Querying entities from PostgreSQL...');
    
    const pgClient = await getClient();
    let entities: EntityRow[];
    
    try {
      await setProjectContext(pgClient, PROJECT_ID);
      
      const result = await pgClient.query<EntityRow>(`
        SELECT entity_type, instance_id, name, project_id
        FROM entities
        ORDER BY entity_type, instance_id
      `);
      
      entities = result.rows;
    } finally {
      pgClient.release();
    }

    console.log(`  Found ${entities.length} entities`);
    console.log('');

    if (entities.length === 0) {
      console.warn('\x1b[33m[WARN]\x1b[0m No entities found in PostgreSQL for this project');
      console.log('Run `npm run extract:a1` first to populate PostgreSQL');
      process.exit(0);
    }

    // Sync to Neo4j in batches
    console.log('Syncing entities from PostgreSQL to Neo4j...');
    
    session = getSession();
    const batches = chunk(entities, BATCH_SIZE);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`  Batch ${i + 1}/${batches.length}: ${batch.length} entities`);

      // Process batch using UNWIND for efficiency
      // CRITICAL: Include project_id in MERGE key for multi-tenant safety
      // Label-agnostic: no :Entity label (A2 validator removed label assumptions)
      await session.run(`
        UNWIND $entities AS entity
        MERGE (n {project_id: entity.project_id, instance_id: entity.instance_id})
        SET n.entity_type = entity.entity_type,
            n.name = entity.name
      `, {
        entities: batch.map(e => ({
          entity_type: e.entity_type,
          instance_id: e.instance_id,
          name: e.name,
          project_id: e.project_id,
        })),
      });

      totalSynced += batch.length;
    }

    console.log('');
    console.log('=== SUMMARY ===');
    console.log(`Total entities synced: ${totalSynced}`);
    console.log('');
    console.log('\x1b[32mNEO4J SYNC: SUCCESS\x1b[0m');

  } catch (error) {
    console.error('\x1b[31m[ERROR]\x1b[0m', error);
    process.exit(1);
  } finally {
    // Cleanup
    if (session) {
      await session.close();
    }
    await closeDriver();
    await closePool();
  }
}

// Run
main().catch((error) => {
  console.error('\x1b[31m[FATAL]\x1b[0m', error);
  process.exit(1);
});
