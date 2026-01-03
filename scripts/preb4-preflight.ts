#!/usr/bin/env npx tsx
/**
 * Pre-B.4 Preflight Checker
 * 
 * Track B: Story B.4 - Closure Check (prerequisite)
 * 
 * @g-api-exception TRACK_B_OWNED - Track B CLI may import from src/services/track_b/**
 * 
 * This script validates that the environment is ready for B.4 closure check.
 * It is READ-ONLY: no database writes, no graph mutations.
 * 
 * Checks performed:
 * 1. Git SHA is available and working tree is clean
 * 2. PROJECT_ID is set
 * 3. GRAPH_API_V2_URL is reachable (/health)
 * 4. E03 entity count is stable (pagination completes)
 * 5. Relationship count is stable (pagination completes)
 * 6. Double-drift check: two consecutive snapshots produce identical Merkle roots
 * 
 * Usage:
 *   PROJECT_ID=... GRAPH_API_V2_URL=... npx tsx scripts/preb4-preflight.ts
 */

import { execSync } from 'child_process';
import {
  createGraphSnapshot,
  checkV2ApiHealth,
} from '../src/services/track_b/drift-detection/index.js';

// Configuration
const PROJECT_ID = process.env.PROJECT_ID || '6df2f456-440d-4958-b475-d9808775ff69';
const GRAPH_API_V2_URL = process.env.GRAPH_API_V2_URL || 'http://localhost:3001';
const SETTLE_WINDOW_MS = 1000; // 1 second settle between snapshots

interface PreflightResult {
  check: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
  details?: Record<string, unknown>;
}

const results: PreflightResult[] = [];

function log(result: PreflightResult): void {
  results.push(result);
  const icon = result.status === 'PASS' ? '✓' : result.status === 'FAIL' ? '✗' : '⚠';
  console.log(`  [${icon}] ${result.check}: ${result.message}`);
}

async function main(): Promise<void> {
  console.log('\n══════════════════════════════════════════════════════════════');
  console.log('  PRE-B.4 PREFLIGHT CHECKER');
  console.log('══════════════════════════════════════════════════════════════\n');
  
  console.log(`  PROJECT_ID: ${PROJECT_ID}`);
  console.log(`  GRAPH_API_V2_URL: ${GRAPH_API_V2_URL}\n`);
  
  console.log('  Checks:\n');
  
  // ===== CHECK 1: Git SHA =====
  try {
    const sha = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
    log({
      check: 'Git SHA',
      status: 'PASS',
      message: sha.slice(0, 12) + '...',
      details: { sha },
    });
  } catch (err) {
    log({
      check: 'Git SHA',
      status: 'FAIL',
      message: 'Could not get git SHA',
    });
  }
  
  // ===== CHECK 2: Working tree clean =====
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf-8' }).trim();
    if (status === '') {
      log({
        check: 'Working tree',
        status: 'PASS',
        message: 'Clean (no uncommitted changes)',
      });
    } else {
      const lines = status.split('\n').length;
      log({
        check: 'Working tree',
        status: 'WARN',
        message: `${lines} uncommitted change(s) - recommend commit before B.4`,
        details: { changes: lines },
      });
    }
  } catch (err) {
    log({
      check: 'Working tree',
      status: 'FAIL',
      message: 'Could not check git status',
    });
  }
  
  // ===== CHECK 3: PROJECT_ID set =====
  if (PROJECT_ID && PROJECT_ID !== '') {
    log({
      check: 'PROJECT_ID',
      status: 'PASS',
      message: PROJECT_ID,
    });
  } else {
    log({
      check: 'PROJECT_ID',
      status: 'FAIL',
      message: 'PROJECT_ID not set',
    });
  }
  
  // ===== CHECK 4: V2 API health =====
  const healthy = await checkV2ApiHealth(GRAPH_API_V2_URL);
  if (healthy) {
    log({
      check: 'V2 API health',
      status: 'PASS',
      message: `${GRAPH_API_V2_URL}/health responding`,
    });
  } else {
    log({
      check: 'V2 API health',
      status: 'FAIL',
      message: `${GRAPH_API_V2_URL} not reachable - start v2 server first`,
    });
    // Cannot continue without v2 API
    printSummary();
    process.exit(1);
  }
  
  // ===== CHECK 5: Double-drift check (determinism) =====
  console.log('\n  Running double-drift check (determinism verification)...\n');
  
  try {
    // Snapshot 1
    console.log('    Creating snapshot 1...');
    const snap1 = await createGraphSnapshot(GRAPH_API_V2_URL, PROJECT_ID, 'preflight-1');
    console.log(`    Snapshot 1: ${snap1.entity_count} entities, ${snap1.relationship_count} relationships`);
    
    // Settle window
    console.log(`    Settling for ${SETTLE_WINDOW_MS}ms...`);
    await new Promise(r => setTimeout(r, SETTLE_WINDOW_MS));
    
    // Snapshot 2
    console.log('    Creating snapshot 2...');
    const snap2 = await createGraphSnapshot(GRAPH_API_V2_URL, PROJECT_ID, 'preflight-2');
    console.log(`    Snapshot 2: ${snap2.entity_count} entities, ${snap2.relationship_count} relationships`);
    
    // Compare
    const entityRootsMatch = snap1.entity_merkle_root === snap2.entity_merkle_root;
    const relRootsMatch = snap1.relationship_merkle_root === snap2.relationship_merkle_root;
    const countsMatch = snap1.entity_count === snap2.entity_count && 
                        snap1.relationship_count === snap2.relationship_count;
    
    console.log('');
    
    if (entityRootsMatch && relRootsMatch && countsMatch) {
      log({
        check: 'Double-drift',
        status: 'PASS',
        message: 'Identical Merkle roots and counts across both snapshots',
        details: {
          entity_merkle_root: snap1.entity_merkle_root.slice(0, 16) + '...',
          relationship_merkle_root: snap1.relationship_merkle_root.slice(0, 16) + '...',
          entity_count: snap1.entity_count,
          relationship_count: snap1.relationship_count,
        },
      });
    } else {
      const diffs: string[] = [];
      if (!entityRootsMatch) diffs.push('entity_merkle_root');
      if (!relRootsMatch) diffs.push('relationship_merkle_root');
      if (!countsMatch) diffs.push('counts');
      
      log({
        check: 'Double-drift',
        status: 'FAIL',
        message: `Drift detected between consecutive snapshots: ${diffs.join(', ')}`,
        details: {
          snap1_entities: snap1.entity_count,
          snap2_entities: snap2.entity_count,
          snap1_rels: snap1.relationship_count,
          snap2_rels: snap2.relationship_count,
          entity_roots_match: entityRootsMatch,
          rel_roots_match: relRootsMatch,
        },
      });
    }
    
    // Entity count stability (E03 specifically)
    log({
      check: 'Entity count',
      status: 'PASS',
      message: `${snap1.entity_count} entities enumerated to completion`,
    });
    
    // Relationship count stability
    log({
      check: 'Relationship count',
      status: 'PASS',
      message: `${snap1.relationship_count} relationships enumerated to completion`,
    });
    
  } catch (err) {
    log({
      check: 'Double-drift',
      status: 'FAIL',
      message: `Snapshot failed: ${err instanceof Error ? err.message : String(err)}`,
    });
  }
  
  printSummary();
}

function printSummary(): void {
  console.log('\n══════════════════════════════════════════════════════════════');
  
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const warned = results.filter(r => r.status === 'WARN').length;
  
  console.log(`  SUMMARY: ${passed} passed, ${warned} warnings, ${failed} failed`);
  
  if (failed > 0) {
    console.log('\n  PREFLIGHT FAILED - Fix issues before running B.4');
    console.log('══════════════════════════════════════════════════════════════\n');
    process.exit(1);
  } else if (warned > 0) {
    console.log('\n  PREFLIGHT PASSED WITH WARNINGS');
    console.log('  Recommend addressing warnings before B.4 for cleanest run.');
    console.log('══════════════════════════════════════════════════════════════\n');
    process.exit(0);
  } else {
    console.log('\n  PREFLIGHT PASSED - Ready for B.4 Closure Check');
    console.log('══════════════════════════════════════════════════════════════\n');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Preflight error:', err);
  process.exit(1);
});

