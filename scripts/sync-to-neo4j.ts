#!/usr/bin/env npx tsx
// scripts/sync-to-neo4j.ts
// @implements STORY-64.1
// A1 Neo4j Sync - syncs entities from PostgreSQL to Neo4j
// Uses ops layer for G-API compliance

import 'dotenv/config';
import { initProject, syncToNeo4j, closeConnections } from '../src/ops/track-a.js';

// ============================================================================
// Configuration
// ============================================================================

const PROJECT_ID = process.env.PROJECT_ID;
const PROJECT_SLUG = process.env.PROJECT_SLUG;

// ============================================================================
// Helpers
// ============================================================================

function formatTimestamp(): string {
  return new Date().toISOString();
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
  console.log('=== Neo4j Sync ===');
  console.log(`Timestamp: ${formatTimestamp()}`);
  console.log('');

  try {
    // Resolve project via ops layer
    const project = await initProject({
      projectId: PROJECT_ID,
      projectSlug: PROJECT_SLUG,
    });

    console.log(`Project: ${project.slug}`);
    console.log(`Project ID: ${project.id}`);
    console.log('');

    // Sync via ops layer
    console.log('Syncing entities from PostgreSQL to Neo4j...');
    const result = await syncToNeo4j(project.id);

    console.log('');
    console.log('=== SUMMARY ===');
    console.log(`Total entities synced: ${result.synced}`);
    console.log('');
    console.log('\x1b[32mNEO4J SYNC: SUCCESS\x1b[0m');

  } catch (error) {
    console.error('\x1b[31m[ERROR]\x1b[0m', error);
    process.exit(1);
  } finally {
    await closeConnections();
  }
}

// Run
main().catch((error) => {
  console.error('\x1b[31m[FATAL]\x1b[0m', error);
  process.exit(1);
});
