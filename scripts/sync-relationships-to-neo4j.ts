#!/usr/bin/env npx tsx
/**
 * Neo4j Relationship Sync
 * Tier 2: Maintenance Script
 * 
 * Syncs all entities and relationships to Neo4j.
 * 
 * REQUIRES: --confirm-repair flag and PROJECT_ID env var
 */
import 'dotenv/config';
import { replaceAllRelationshipsInNeo4j, syncToNeo4j, closeConnections } from '../src/ops/track-a.js';
import { 
  requireConfirmRepair, 
  resolveProjectId, 
  createEvidence, 
  writeEvidenceMarkdown,
  type EvidenceArtifact 
} from './_lib/operator-guard.js';
import { captureStateSnapshot, formatSnapshot } from './_lib/state-snapshot.js';

const SCRIPT_NAME = 'scripts/sync-relationships-to-neo4j.ts';

async function main() {
  // === OPERATOR GUARD ===
  requireConfirmRepair(SCRIPT_NAME);
  const projectId = resolveProjectId();

  console.log('=== SYNC TO NEO4J ===');
  console.log('Project:', projectId);
  console.log('');

  // Initialize evidence
  const evidence: EvidenceArtifact = createEvidence(SCRIPT_NAME, projectId);

  try {
    // Capture BEFORE state
    console.log('[SNAPSHOT] Capturing before state...');
    evidence.beforeCounts = await captureStateSnapshot(projectId);
    console.log(`  ${formatSnapshot(evidence.beforeCounts)}`);

    // First sync entities
    console.log('\nSyncing entities...');
    const entityResult = await syncToNeo4j(projectId);
    console.log('Entities synced:', entityResult.synced);
    evidence.operations?.push(`Synced ${entityResult.synced} entities to Neo4j`);

    // Then sync relationships
    console.log('\nSyncing relationships...');
    const relResult = await replaceAllRelationshipsInNeo4j(projectId);
    const deleted = (relResult as any).deleted ?? 0;
    const skipped = (relResult as any).skipped ?? 0;
    console.log('Deleted:', deleted, 'Synced:', relResult.synced, 'Skipped:', skipped);
    evidence.operations?.push(`Deleted ${deleted} relationships from Neo4j`);
    evidence.operations?.push(`Synced ${relResult.synced} relationships to Neo4j`);
    if (skipped > 0) {
      evidence.operations?.push(`Skipped ${skipped} relationships (missing endpoints)`);
    }

    // Capture AFTER state
    console.log('\n[SNAPSHOT] Capturing after state...');
    evidence.afterCounts = await captureStateSnapshot(projectId);
    console.log(`  ${formatSnapshot(evidence.afterCounts)}`);

    evidence.status = 'SUCCESS';
    console.log('\nDone.');
    
  } catch (err) {
    evidence.status = 'FAILED';
    evidence.errors?.push(String(err));
    console.error('Error:', err);
    throw err;
  } finally {
    writeEvidenceMarkdown(evidence);
    await closeConnections();
  }
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
