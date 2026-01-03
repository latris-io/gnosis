#!/usr/bin/env npx tsx
// @ts-nocheck
/**
 * Relationship Replace Sync
 * Tier 2: Maintenance Script
 * 
 * Performs replace-by-project relationship sync and verifies parity.
 * 
 * REQUIRES: --confirm-repair flag and PROJECT_ID env var
 */
import 'dotenv/config';
import {
  initProject,
  replaceAllRelationshipsInNeo4j,
  verifyNeo4jParity,
  closeConnections,
} from '../src/ops/track-a.js';
import { 
  requireConfirmRepair, 
  resolveProjectId, 
  createEvidence, 
  writeEvidenceMarkdown,
  type EvidenceArtifact 
} from './_lib/operator-guard.js';
import { captureStateSnapshot, formatSnapshot } from './_lib/state-snapshot.js';

const SCRIPT_NAME = 'scripts/sync-relationships-replace.ts';

async function main() {
  // === OPERATOR GUARD ===
  requireConfirmRepair(SCRIPT_NAME);
  const envProjectId = resolveProjectId();

  // Initialize evidence
  const evidence: EvidenceArtifact = createEvidence(SCRIPT_NAME, envProjectId);

  try {
    // Get project ID from environment
    const { id: projectId } = await initProject({
      projectId: envProjectId,
    });
    console.log(`Project ID: ${projectId}\n`);

    // Capture BEFORE state
    console.log('[SNAPSHOT] Capturing before state...');
    evidence.beforeCounts = await captureStateSnapshot(projectId);
    console.log(`  ${formatSnapshot(evidence.beforeCounts)}`);

    // Step 1: Show current state
    console.log('\n=== BEFORE SYNC ===\n');
    const beforeParity = await verifyNeo4jParity(projectId);
    console.log('Postgres:');
    console.log(`  Total: ${beforeParity.postgres.total}`);
    for (const [type, count] of Object.entries(beforeParity.postgres.byType).sort()) {
      console.log(`  ${type}: ${count}`);
    }
    console.log('\nNeo4j:');
    console.log(`  Total: ${beforeParity.neo4j.total}`);
    for (const [type, count] of Object.entries(beforeParity.neo4j.byType).sort()) {
      console.log(`  ${type}: ${count}`);
    }
    console.log(`\nConsistent: ${beforeParity.consistent}`);
    if (beforeParity.mismatches.length > 0) {
      console.log('Mismatches:');
      for (const m of beforeParity.mismatches) {
        console.log(`  ${m.type}: PG=${m.pg}, Neo4j=${m.neo4j}`);
      }
    }

    // Step 2: Run replace sync
    console.log('\n=== RUNNING REPLACE SYNC ===\n');
    const syncResult = await replaceAllRelationshipsInNeo4j(projectId);
    const deleted = (syncResult as any).deleted ?? 'N/A';
    const skipped = (syncResult as any).skipped ?? 'N/A';
    console.log(`Deleted from Neo4j: ${deleted}`);
    console.log(`Synced from Postgres: ${syncResult.synced}`);
    console.log(`Skipped (missing endpoints): ${skipped}`);
    evidence.operations?.push(`Deleted ${deleted} relationships from Neo4j`);
    evidence.operations?.push(`Synced ${syncResult.synced} relationships to Neo4j`);
    if (typeof skipped === 'number' && skipped > 0) {
      evidence.operations?.push(`Skipped ${skipped} relationships (missing endpoints)`);
    }

    // Step 3: Verify parity after sync
    console.log('\n=== AFTER SYNC ===\n');
    const afterParity = await verifyNeo4jParity(projectId);
    console.log('Postgres:');
    console.log(`  Total: ${afterParity.postgres.total}`);
    for (const [type, count] of Object.entries(afterParity.postgres.byType).sort()) {
      console.log(`  ${type}: ${count}`);
    }
    console.log('\nNeo4j:');
    console.log(`  Total: ${afterParity.neo4j.total}`);
    for (const [type, count] of Object.entries(afterParity.neo4j.byType).sort()) {
      console.log(`  ${type}: ${count}`);
    }
    console.log(`\nConsistent: ${afterParity.consistent}`);
    if (afterParity.mismatches.length > 0) {
      console.log('Mismatches:');
      for (const m of afterParity.mismatches) {
        console.log(`  ${m.type}: PG=${m.pg}, Neo4j=${m.neo4j}`);
      }
    }

    // Step 4: Summary
    console.log('\n=== PARITY CHECK SUMMARY ===\n');
    console.log(`Total PG: ${afterParity.postgres.total}`);
    console.log(`Total Neo4j: ${afterParity.neo4j.total}`);
    console.log(`Parity: ${afterParity.consistent ? 'PASS' : 'FAIL'}`);

    // Capture AFTER state
    console.log('\n[SNAPSHOT] Capturing after state...');
    evidence.afterCounts = await captureStateSnapshot(projectId);
    console.log(`  ${formatSnapshot(evidence.afterCounts)}`);

    evidence.status = 'SUCCESS';

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

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

