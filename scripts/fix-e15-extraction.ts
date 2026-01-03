#!/usr/bin/env npx tsx
/**
 * E15 Module Remediation Script
 * Tier 2: Repair Script
 * 
 * One-time remediation script to fix E15 Module extraction.
 * G-API compliant: uses ops layer for all database operations.
 * 
 * @implements STORY-64.1, STORY-64.2
 * 
 * REQUIRES: --confirm-repair flag and PROJECT_ID env var
 */
import 'dotenv/config';
import { 
  initProject,
  extractAndPersistModules,
  verifyE15Semantics,
  extractAndPersistContainmentRelationships,
  syncToNeo4j,
  syncRelationshipsToNeo4j,
  closeConnections,
  deleteR04Relationships,
  deleteE15ByInstanceIds,
  deleteInvalidE15FromNeo4j,
  closeNeo4jDriver,
} from '../src/ops/track-a.js';
import { 
  requireConfirmRepair, 
  resolveProjectId, 
  createEvidence, 
  writeEvidenceMarkdown,
  type EvidenceArtifact 
} from './_lib/operator-guard.js';
import { captureStateSnapshot, formatSnapshot } from './_lib/state-snapshot.js';

const SCRIPT_NAME = 'scripts/fix-e15-extraction.ts';

function formatTimestamp(): string {
  return new Date().toISOString();
}

function log(message: string): void {
  console.log(`[${formatTimestamp()}] ${message}`);
}

function logSection(title: string): void {
  console.log('');
  console.log(`=== ${title} ===`);
}

async function main(): Promise<void> {
  // === OPERATOR GUARD ===
  requireConfirmRepair(SCRIPT_NAME);
  const projectId = resolveProjectId();

  console.log('=== E15 REMEDIATION SCRIPT ===');
  console.log(`Timestamp: ${formatTimestamp()}`);
  console.log(`Project ID: ${projectId}`);
  console.log('');
  
  // Initialize evidence
  const evidence: EvidenceArtifact = createEvidence(SCRIPT_NAME, projectId);
  
  try {
    // Capture BEFORE state
    console.log('[SNAPSHOT] Capturing before state...');
    evidence.beforeCounts = await captureStateSnapshot(projectId);
    console.log(`  ${formatSnapshot(evidence.beforeCounts)}`);

    // Resolve project
    const project = await initProject({ projectId });
    log(`Project resolved: ${project.slug}`);
    
    // Step 1: Audit E15 semantics
    logSection('STEP 1: Audit E15 Semantics');
    const semanticsResult = await verifyE15Semantics(projectId);
    log(`Valid E15 modules: ${semanticsResult.valid}`);
    log(`Invalid E15 modules: ${semanticsResult.invalid}`);
    if (semanticsResult.invalidModules.length > 0) {
      log(`Invalid modules: ${semanticsResult.invalidModules.slice(0, 10).join(', ')}${semanticsResult.invalidModules.length > 10 ? '...' : ''}`);
    }
    evidence.operations?.push(`Audited E15 semantics: ${semanticsResult.valid} valid, ${semanticsResult.invalid} invalid`);
    
    // Step 2: Delete R04 (MUST happen before deleting E15 to avoid FK/RI issues)
    logSection('STEP 2: Delete R04 Relationships');
    const r04Deleted = await deleteR04Relationships(projectId);
    log(`Deleted ${r04Deleted} R04 relationships from Postgres`);
    evidence.operations?.push(`Deleted ${r04Deleted} R04 relationships from Postgres`);
    
    // Step 3: Delete invalid E15 in Postgres
    logSection('STEP 3: Delete Invalid E15 (Postgres)');
    if (semanticsResult.invalidModules.length === 0) {
      log('No invalid E15 entities to delete');
    } else {
      const e15PgDeleted = await deleteE15ByInstanceIds(projectId, semanticsResult.invalidModules);
      log(`Deleted ${e15PgDeleted} invalid E15 entities from Postgres`);
      evidence.operations?.push(`Deleted ${e15PgDeleted} invalid E15 entities from Postgres`);
    }
    
    // Step 4: Delete invalid E15 nodes and incident edges in Neo4j
    logSection('STEP 4: Delete Invalid E15 (Neo4j)');
    if (semanticsResult.invalidModules.length === 0) {
      log('No invalid E15 entities to delete from Neo4j');
    } else {
      const neo4jResult = await deleteInvalidE15FromNeo4j(projectId, semanticsResult.invalidModules);
      log(`Deleted ${neo4jResult.nodesDeleted} E15 nodes from Neo4j`);
      log(`Deleted ${neo4jResult.edgesDeleted} incident edges from Neo4j`);
      evidence.operations?.push(`Deleted ${neo4jResult.nodesDeleted} E15 nodes from Neo4j`);
      evidence.operations?.push(`Deleted ${neo4jResult.edgesDeleted} incident edges from Neo4j`);
    }
    
    // Step 5: Re-derive and persist E15 modules
    logSection('STEP 5: Re-derive E15 Modules');
    const e15Result = await extractAndPersistModules(projectId);
    log(`Derived ${e15Result.derived} E15 modules`);
    log(`Persisted ${e15Result.persisted} E15 entities`);
    evidence.operations?.push(`Derived ${e15Result.derived} E15 modules, persisted ${e15Result.persisted}`);
    
    // Step 6: Re-derive R04 relationships (via containment extraction)
    logSection('STEP 6: Re-derive R04 Relationships');
    const containmentResult = await extractAndPersistContainmentRelationships(projectId);
    log(`Derived ${containmentResult.r04.extracted} R04 relationships`);
    log(`Persisted ${containmentResult.r04.persisted} R04 relationships`);
    evidence.operations?.push(`Derived ${containmentResult.r04.extracted} R04 relationships, persisted ${containmentResult.r04.persisted}`);
    
    // Step 7: Re-sync to Neo4j
    logSection('STEP 7: Re-sync to Neo4j');
    log('Re-syncing entities to Neo4j...');
    const entitySync = await syncToNeo4j(projectId);
    log(`Synced ${entitySync.synced} entities`);
    evidence.operations?.push(`Synced ${entitySync.synced} entities to Neo4j`);
    
    log('Re-syncing relationships to Neo4j...');
    const relSync = await syncRelationshipsToNeo4j(projectId);
    log(`Synced ${relSync.synced} relationships (${relSync.skipped} skipped)`);
    evidence.operations?.push(`Synced ${relSync.synced} relationships to Neo4j (${relSync.skipped} skipped)`);
    
    // Capture AFTER state
    console.log('\n[SNAPSHOT] Capturing after state...');
    evidence.afterCounts = await captureStateSnapshot(projectId);
    console.log(`  ${formatSnapshot(evidence.afterCounts)}`);

    // Final summary
    logSection('SUMMARY');
    console.log('');
    console.log('Audit:');
    console.log(`  Valid E15 (before): ${semanticsResult.valid}`);
    console.log(`  Invalid E15 (before): ${semanticsResult.invalid}`);
    console.log('');
    console.log('Deletions:');
    console.log(`  R04 deleted (Postgres): ${r04Deleted}`);
    console.log(`  E15 deleted (Postgres): ${semanticsResult.invalidModules.length > 0 ? 'see above' : '0'}`);
    console.log('');
    console.log('Derivation:');
    console.log(`  E15 derived: ${e15Result.derived}`);
    console.log(`  E15 persisted: ${e15Result.persisted}`);
    console.log(`  R04 derived: ${containmentResult.r04.extracted}`);
    console.log(`  R04 persisted: ${containmentResult.r04.persisted}`);
    console.log('');
    console.log('Neo4j Sync:');
    console.log(`  Entities synced: ${entitySync.synced}`);
    console.log(`  Relationships synced: ${relSync.synced}`);
    console.log('');
    
    evidence.status = 'SUCCESS';
    console.log('\x1b[32mE15 REMEDIATION: SUCCESS\x1b[0m');
    
  } catch (error) {
    evidence.status = 'FAILED';
    evidence.errors?.push(String(error));
    console.error('\x1b[31m[ERROR]\x1b[0m', error);
    throw error;
  } finally {
    writeEvidenceMarkdown(evidence);
    await closeConnections();
    await closeNeo4jDriver();
  }
}

main().catch((error) => {
  console.error('\x1b[31m[FATAL]\x1b[0m', error);
  process.exit(1);
});

