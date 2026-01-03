#!/usr/bin/env npx tsx
/**
 * Neo4j Entity Sync
 * Tier 2: Maintenance Script
 * 
 * Syncs entities from PostgreSQL to Neo4j.
 * Uses ops layer for G-API compliance.
 * 
 * @implements STORY-64.1
 * 
 * REQUIRES: --confirm-repair flag and PROJECT_ID env var
 */
import 'dotenv/config';
import { initProject, syncToNeo4j, closeConnections } from '../src/ops/track-a.js';
import { 
  requireConfirmRepair, 
  resolveProjectId, 
  createEvidence, 
  writeEvidenceMarkdown,
  type EvidenceArtifact 
} from './_lib/operator-guard.js';
import { captureStateSnapshot, formatSnapshot } from './_lib/state-snapshot.js';

const SCRIPT_NAME = 'scripts/sync-to-neo4j.ts';

async function main(): Promise<void> {
  // === OPERATOR GUARD ===
  requireConfirmRepair(SCRIPT_NAME);
  const projectId = resolveProjectId();

  console.log('=== Neo4j Sync ===');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('');

  // Initialize evidence
  const evidence: EvidenceArtifact = createEvidence(SCRIPT_NAME, projectId);

  try {
    // Resolve project via ops layer
    const project = await initProject({
      projectId,
    });

    console.log(`Project: ${project.slug}`);
    console.log(`Project ID: ${project.id}`);
    console.log('');

    // Capture BEFORE state
    console.log('[SNAPSHOT] Capturing before state...');
    evidence.beforeCounts = await captureStateSnapshot(project.id);
    console.log(`  ${formatSnapshot(evidence.beforeCounts)}`);

    // Sync via ops layer
    console.log('\nSyncing entities from PostgreSQL to Neo4j...');
    const result = await syncToNeo4j(project.id);

    console.log('');
    console.log('=== SUMMARY ===');
    console.log(`Total entities synced: ${result.synced}`);
    evidence.operations?.push(`Synced ${result.synced} entities to Neo4j`);

    // Capture AFTER state
    console.log('\n[SNAPSHOT] Capturing after state...');
    evidence.afterCounts = await captureStateSnapshot(project.id);
    console.log(`  ${formatSnapshot(evidence.afterCounts)}`);

    evidence.status = 'SUCCESS';
    console.log('');
    console.log('\x1b[32mNEO4J SYNC: SUCCESS\x1b[0m');

  } catch (error) {
    evidence.status = 'FAILED';
    evidence.errors?.push(String(error));
    console.error('\x1b[31m[ERROR]\x1b[0m', error);
    throw error;
  } finally {
    writeEvidenceMarkdown(evidence);
    await closeConnections();
  }
}

main().catch((error) => {
  console.error('\x1b[31m[FATAL]\x1b[0m', error);
  process.exit(1);
});

