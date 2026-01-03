#!/usr/bin/env npx tsx
// @ts-nocheck
/**
 * Neo4j Sync Repair Script
 * Tier 2: Maintenance / Repair
 * 
 * Syncs entities and relationships to Neo4j via replace-by-project.
 * 
 * REQUIRES: --confirm-repair flag and PROJECT_ID env var
 */
import 'dotenv/config';
import { syncToNeo4j, replaceAllRelationshipsInNeo4j, closeConnections } from '../../src/ops/track-a.js';
import { 
  requireConfirmRepair, 
  resolveProjectId, 
  createEvidence, 
  writeEvidenceMarkdown,
  type EvidenceArtifact 
} from '../_lib/operator-guard.js';
import { captureStateSnapshot, formatSnapshot } from '../_lib/state-snapshot.js';

const SCRIPT_NAME = 'scripts/repair/sync-neo4j.ts';

async function main() {
  // === OPERATOR GUARD ===
  requireConfirmRepair(SCRIPT_NAME);
  const projectId = resolveProjectId();
  
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║              NEO4J SYNC                                        ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  // Initialize evidence
  const evidence: EvidenceArtifact = createEvidence(SCRIPT_NAME, projectId);
  
  try {
    // Capture BEFORE state
    console.log('[SNAPSHOT] Capturing before state...');
    evidence.beforeCounts = await captureStateSnapshot(projectId);
    console.log(`  ${formatSnapshot(evidence.beforeCounts)}`);
    
    // Sync entities
    console.log('\nSyncing entities to Neo4j...');
    const entityResult = await syncToNeo4j(projectId);
    console.log(`  Synced: ${entityResult.synced}`);
    evidence.operations?.push(`Synced ${entityResult.synced} entities to Neo4j`);

    // Rebuild relationships
    console.log('\nRebuilding relationships in Neo4j (replace-by-project)...');
    const relResult = await replaceAllRelationshipsInNeo4j(projectId);
    const deleted = (relResult as any).deleted ?? 'N/A';
    console.log(`  Deleted: ${deleted}`);
    console.log(`  Synced: ${relResult.synced}`);
    evidence.operations?.push(`Deleted ${deleted} relationships from Neo4j`);
    evidence.operations?.push(`Synced ${relResult.synced} relationships to Neo4j`);

    // Capture AFTER state
    console.log('\n[SNAPSHOT] Capturing after state...');
    evidence.afterCounts = await captureStateSnapshot(projectId);
    console.log(`  ${formatSnapshot(evidence.afterCounts)}`);

    evidence.status = 'SUCCESS';
    console.log('\n✓ Neo4j sync complete');
    
  } catch (err) {
    evidence.status = 'FAILED';
    evidence.errors?.push(String(err));
    console.error('\n✗ Error:', err);
    throw err;
  } finally {
    // Always write evidence
    writeEvidenceMarkdown(evidence);
    await closeConnections();
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

