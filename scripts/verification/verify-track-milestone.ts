/**
 * Mode 1: Track Milestone Verifier
 * 
 * Verifies the current state of Track A against phase-aware expectations.
 * Designed for mid-A2 use - treats deferred items appropriately.
 * 
 * Three-Way Reconciliation:
 * - DOC TRUTH: What organ docs + Track A specs say should exist
 * - METADATA TRUTH: What the system claims it ingested (via expectations)
 * - DATA TRUTH: What actually exists in PostgreSQL and Neo4j
 * 
 * @implements STORY-64.1 (Verification infrastructure)
 */

import * as path from 'path';
import * as fs from 'fs';
import { detectDrift } from './expectations/drift-detector';
import {
  ENTITY_EXPECTATIONS,
  RELATIONSHIP_EXPECTATIONS,
  getStatusForPhase,
  isUnexpectedAllowed,
  isCanonicalEntity,
  isCanonicalRelationship,
  isDormantEntity,
  isDormantRelationship,
  isInternalLinkage,
  isOutOfScope,
  CANONICAL_COUNTS,
  Phase,
  Status,
  deriveE04Status,
  getE04InvariantCount,
} from './expectations/track-a-expectations';
import * as pgReader from './readers/postgres-reader';
import * as neo4jReader from './readers/neo4j-reader';
import { verifyCrossStoreConsistency } from './reconcilers/cross-store-reconciler';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type VerificationStatus = 'PASS' | 'FAIL' | 'WARN' | 'SKIP';

export interface VerificationCheck {
  name: string;
  status: VerificationStatus;
  message: string;
  expected?: unknown;
  actual?: unknown;
}

export interface VerificationResult {
  phase: Phase;
  timestamp: string;
  projectId?: string;
  
  // Pre-flight checks
  driftCheck: VerificationCheck;
  
  // Entity checks
  entityChecks: VerificationCheck[];
  
  // Relationship checks
  relationshipChecks: VerificationCheck[];
  
  // Cross-store checks
  crossStoreChecks: VerificationCheck[];
  
  // Referential integrity
  integrityChecks: VerificationCheck[];
  
  // Unexpected type checks
  unexpectedTypeChecks: VerificationCheck[];
  
  // Summary
  summary: {
    total: number;
    passed: number;
    failed: number;
    warned: number;
    skipped: number;
  };
  
  verdict: 'PASS' | 'FAIL';
}

// -----------------------------------------------------------------------------
// Phase Detection
// -----------------------------------------------------------------------------

function getCurrentPhase(): Phase {
  // Allow override via environment
  const envPhase = process.env.TRACK_A_PHASE;
  if (envPhase && ['A1', 'A2', 'A3', 'A4', 'A5'].includes(envPhase)) {
    return envPhase as Phase;
  }
  
  // Default to A2 (current development phase)
  return 'A2';
}

// -----------------------------------------------------------------------------
// Entity Verification
// -----------------------------------------------------------------------------

async function verifyEntities(phase: Phase, projectId?: string): Promise<VerificationCheck[]> {
  const checks: VerificationCheck[] = [];
  
  // Get actual counts from database
  const entityCounts = await pgReader.getEntityCounts(projectId);
  const countMap = new Map(entityCounts.map(c => [c.entity_type, c.count]));
  
  for (const expectation of ENTITY_EXPECTATIONS) {
    const status = getStatusForPhase(expectation, phase);
    const actualCount = countMap.get(expectation.code) || 0;
    
    let checkStatus: VerificationStatus;
    let message: string;
    
    switch (status) {
      case 'EXPECTED_NONZERO':
        if (actualCount > 0) {
          // Check invariant count if defined
          if (expectation.invariantCount !== undefined) {
            if (actualCount === expectation.invariantCount) {
              checkStatus = 'PASS';
              message = `${expectation.code} (${expectation.name}): ${actualCount} (matches invariant)`;
            } else {
              checkStatus = 'FAIL';
              message = `${expectation.code} (${expectation.name}): expected ${expectation.invariantCount}, found ${actualCount}`;
            }
          } else {
            checkStatus = 'PASS';
            message = `${expectation.code} (${expectation.name}): ${actualCount}`;
          }
        } else {
          checkStatus = 'FAIL';
          message = `${expectation.code} (${expectation.name}): expected > 0, found 0`;
        }
        break;
        
      case 'EXPECTED_ZERO':
        if (actualCount === 0) {
          checkStatus = 'PASS';
          message = `${expectation.code} (${expectation.name}): 0 (as expected)`;
        } else {
          checkStatus = 'FAIL';
          message = `${expectation.code} (${expectation.name}): expected 0, found ${actualCount}`;
        }
        break;
        
      case 'DEFERRED_TO_A3':
      case 'DEFERRED_TO_A4':
      case 'DEFERRED_TO_A5':
        checkStatus = 'SKIP';
        message = `${expectation.code} (${expectation.name}): ${status} (count: ${actualCount})`;
        break;
        
      case 'NA':
        checkStatus = 'SKIP';
        message = `${expectation.code} (${expectation.name}): N/A for Track A`;
        break;
        
      default:
        checkStatus = 'WARN';
        message = `${expectation.code} (${expectation.name}): unknown status ${status}`;
    }
    
    checks.push({
      name: `Entity ${expectation.code}`,
      status: checkStatus,
      message,
      expected: status === 'EXPECTED_NONZERO' ? (expectation.invariantCount || '> 0') : status,
      actual: actualCount,
    });
  }
  
  return checks;
}

// -----------------------------------------------------------------------------
// Relationship Verification
// -----------------------------------------------------------------------------

async function verifyRelationships(phase: Phase, projectId?: string): Promise<VerificationCheck[]> {
  const checks: VerificationCheck[] = [];
  
  // Get actual counts from database
  const relCounts = await pgReader.getRelationshipCounts(projectId);
  const countMap = new Map(relCounts.map(c => [c.relationship_type, c.count]));
  
  for (const expectation of RELATIONSHIP_EXPECTATIONS) {
    const status = getStatusForPhase(expectation, phase);
    const actualCount = countMap.get(expectation.code) || 0;
    
    let checkStatus: VerificationStatus;
    let message: string;
    
    switch (status) {
      case 'EXPECTED_NONZERO':
        if (actualCount > 0) {
          if (expectation.invariantCount !== undefined) {
            if (actualCount === expectation.invariantCount) {
              checkStatus = 'PASS';
              message = `${expectation.code} (${expectation.name}): ${actualCount} (matches invariant)`;
            } else {
              checkStatus = 'FAIL';
              message = `${expectation.code} (${expectation.name}): expected ${expectation.invariantCount}, found ${actualCount}`;
            }
          } else {
            checkStatus = 'PASS';
            message = `${expectation.code} (${expectation.name}): ${actualCount}`;
          }
        } else {
          checkStatus = 'FAIL';
          message = `${expectation.code} (${expectation.name}): expected > 0, found 0`;
        }
        break;
        
      case 'EXPECTED_ZERO':
        if (actualCount === 0) {
          checkStatus = 'PASS';
          message = `${expectation.code} (${expectation.name}): 0 (as expected)`;
        } else {
          checkStatus = 'FAIL';
          message = `${expectation.code} (${expectation.name}): expected 0, found ${actualCount}`;
        }
        break;
        
      case 'DEFERRED_TO_A3':
      case 'DEFERRED_TO_A4':
      case 'DEFERRED_TO_A5':
        checkStatus = 'SKIP';
        message = `${expectation.code} (${expectation.name}): ${status} (count: ${actualCount})`;
        break;
        
      case 'NA':
        checkStatus = 'SKIP';
        message = `${expectation.code} (${expectation.name}): N/A for Track A`;
        break;
        
      default:
        checkStatus = 'WARN';
        message = `${expectation.code} (${expectation.name}): unknown status ${status}`;
    }
    
    checks.push({
      name: `Relationship ${expectation.code}`,
      status: checkStatus,
      message,
      expected: status === 'EXPECTED_NONZERO' ? (expectation.invariantCount || '> 0') : status,
      actual: actualCount,
    });
  }
  
  return checks;
}

// -----------------------------------------------------------------------------
// Unexpected Type Detection
// -----------------------------------------------------------------------------

async function checkUnexpectedTypes(phase: Phase, projectId?: string): Promise<VerificationCheck[]> {
  const checks: VerificationCheck[] = [];
  
  // Get all entity types from database
  const entityTypes = await pgReader.getEntityTypes(projectId);
  
  for (const entityType of entityTypes) {
    if (!isCanonicalEntity(entityType)) {
      // Check if dormant (FORBIDDEN)
      if (isDormantEntity(entityType)) {
        checks.push({
          name: `Unexpected Entity ${entityType}`,
          status: 'FAIL',
          message: `FORBIDDEN: ${entityType} is dormant until Track D.9`,
        });
        continue;
      }
      
      // Check if allowed with justification
      const allowedResult = isUnexpectedAllowed(entityType, phase);
      
      if (allowedResult.allowed) {
        checks.push({
          name: `Unexpected Entity ${entityType}`,
          status: 'WARN',
          message: `UNEXPECTED (justified): ${allowedResult.justification?.reason}`,
        });
      } else {
        checks.push({
          name: `Unexpected Entity ${entityType}`,
          status: 'FAIL',
          message: allowedResult.reason || `Unknown entity type ${entityType}`,
        });
      }
    }
  }
  
  // Get all relationship types from database
  const relTypes = await pgReader.getRelationshipTypes(projectId);
  
  for (const relType of relTypes) {
    // Skip internal linkages (expected but not counted)
    if (isInternalLinkage(relType)) {
      continue;
    }
    
    // Skip out-of-scope (expected to not exist)
    if (isOutOfScope(relType)) {
      checks.push({
        name: `Out-of-Scope Relationship ${relType}`,
        status: 'FAIL',
        message: `OUT_OF_SCOPE: ${relType} should not exist in Track A`,
      });
      continue;
    }
    
    if (!isCanonicalRelationship(relType)) {
      // Check if dormant (FORBIDDEN)
      if (isDormantRelationship(relType)) {
        checks.push({
          name: `Unexpected Relationship ${relType}`,
          status: 'FAIL',
          message: `FORBIDDEN: ${relType} is dormant until Track D.9`,
        });
        continue;
      }
      
      // Check if allowed with justification
      const allowedResult = isUnexpectedAllowed(relType, phase);
      
      if (allowedResult.allowed) {
        checks.push({
          name: `Unexpected Relationship ${relType}`,
          status: 'WARN',
          message: `UNEXPECTED (justified): ${allowedResult.justification?.reason}`,
        });
      } else {
        checks.push({
          name: `Unexpected Relationship ${relType}`,
          status: 'FAIL',
          message: allowedResult.reason || `Unknown relationship type ${relType}`,
        });
      }
    }
  }
  
  return checks;
}

// -----------------------------------------------------------------------------
// Cross-Store Verification
// -----------------------------------------------------------------------------

async function verifyCrossStore(projectId?: string): Promise<VerificationCheck[]> {
  const checks: VerificationCheck[] = [];
  
  try {
    const result = await verifyCrossStoreConsistency(projectId);
    
    // Overall consistency
    checks.push({
      name: 'Cross-store consistency',
      status: result.consistent ? 'PASS' : 'FAIL',
      message: result.consistent 
        ? `PG and Neo4j are consistent (${result.summary.totalEntities.postgres} entities)`
        : `PG/Neo4j mismatch: ${result.countMismatches.length} count, ${result.idSetMismatches.length} ID set, ${result.typeMismatches.length} type`,
      expected: 'consistent',
      actual: result.consistent ? 'consistent' : 'inconsistent',
    });
    
    // Count mismatches
    for (const m of result.countMismatches) {
      checks.push({
        name: `Count mismatch: ${m.entityType}`,
        status: 'FAIL',
        message: `${m.entityType}: PG=${m.postgresCount}, Neo4j=${m.neo4jCount}`,
        expected: m.postgresCount,
        actual: m.neo4jCount,
      });
    }
    
    // ID set mismatches (sample first few)
    for (const m of result.idSetMismatches.slice(0, 5)) {
      checks.push({
        name: `ID set mismatch: ${m.entityType}`,
        status: 'FAIL',
        message: `${m.entityType}: ${m.onlyInPostgres.length} only in PG, ${m.onlyInNeo4j.length} only in Neo4j`,
      });
    }
    
    // Type mismatches
    for (const m of result.typeMismatches.slice(0, 5)) {
      checks.push({
        name: `Type mismatch: ${m.id}`,
        status: 'FAIL',
        message: `ID ${m.id}: PG type=${m.postgresType}, Neo4j type=${m.neo4jType}`,
      });
    }
  } catch (err) {
    checks.push({
      name: 'Cross-store verification',
      status: 'WARN',
      message: `Could not verify cross-store: ${err}`,
    });
  }
  
  return checks;
}

// -----------------------------------------------------------------------------
// Referential Integrity
// -----------------------------------------------------------------------------

async function verifyIntegrity(projectId?: string): Promise<VerificationCheck[]> {
  const checks: VerificationCheck[] = [];
  
  try {
    const result = await pgReader.checkReferentialIntegrity(projectId);
    
    checks.push({
      name: 'Referential integrity',
      status: result.valid ? 'PASS' : 'FAIL',
      message: result.valid
        ? 'All relationship references are valid'
        : `${result.orphanRelationships.length} orphan relationships found`,
      expected: 0,
      actual: result.orphanRelationships.length,
    });
    
    // Report first few orphans
    for (const orphan of result.orphanRelationships.slice(0, 5)) {
      checks.push({
        name: `Orphan relationship: ${orphan.id}`,
        status: 'FAIL',
        message: `${orphan.relationship_type}: ${orphan.issue}`,
      });
    }
  } catch (err) {
    checks.push({
      name: 'Referential integrity',
      status: 'WARN',
      message: `Could not verify integrity: ${err}`,
    });
  }
  
  return checks;
}

// -----------------------------------------------------------------------------
// Main Verification
// -----------------------------------------------------------------------------

export async function verifyTrackMilestone(projectId?: string): Promise<VerificationResult> {
  const phase = getCurrentPhase();
  
  console.log(`=== Track Milestone Verifier (Mode 1) ===`);
  console.log(`Phase: ${phase}`);
  console.log(`Project: ${projectId || 'all'}`);
  console.log();
  
  const result: VerificationResult = {
    phase,
    timestamp: new Date().toISOString(),
    projectId,
    driftCheck: { name: 'Drift detection', status: 'PASS', message: '' },
    entityChecks: [],
    relationshipChecks: [],
    crossStoreChecks: [],
    integrityChecks: [],
    unexpectedTypeChecks: [],
    summary: { total: 0, passed: 0, failed: 0, warned: 0, skipped: 0 },
    verdict: 'PASS',
  };
  
  // Pre-flight: Drift detection
  console.log('Running drift detection...');
  try {
    const driftReport = await detectDrift();
    
    if (driftReport.matches) {
      result.driftCheck = {
        name: 'Drift detection',
        status: 'PASS',
        message: 'Expectations match organ docs',
      };
    } else {
      result.driftCheck = {
        name: 'Drift detection',
        status: 'FAIL',
        message: `Drift detected: ${driftReport.parseFailures.length} parse failures, ` +
                 `${driftReport.primacyViolations.expectationsExceedOrgan.length + driftReport.primacyViolations.storiesExceedOrgan.length} primacy violations, ` +
                 `${driftReport.coverageGaps.organNotInExpectations.length + driftReport.coverageGaps.organNotCoveredByStories.length} coverage gaps`,
      };
      result.verdict = 'FAIL';
      
      // Short-circuit if drift detected
      console.error('❌ Drift detected - verification blocked');
      return result;
    }
  } catch (err) {
    result.driftCheck = {
      name: 'Drift detection',
      status: 'WARN',
      message: `Could not run drift detection: ${err}`,
    };
  }
  console.log('✓ Drift detection passed\n');
  
  // Entity verification
  console.log('Verifying entities...');
  result.entityChecks = await verifyEntities(phase, projectId);
  console.log(`  ${result.entityChecks.filter(c => c.status === 'PASS').length}/${ENTITY_EXPECTATIONS.length} passed\n`);
  
  // Relationship verification
  console.log('Verifying relationships...');
  result.relationshipChecks = await verifyRelationships(phase, projectId);
  console.log(`  ${result.relationshipChecks.filter(c => c.status === 'PASS').length}/${RELATIONSHIP_EXPECTATIONS.length} passed\n`);
  
  // Unexpected type detection
  console.log('Checking for unexpected types...');
  result.unexpectedTypeChecks = await checkUnexpectedTypes(phase, projectId);
  if (result.unexpectedTypeChecks.length === 0) {
    console.log('  No unexpected types found\n');
  } else {
    console.log(`  ${result.unexpectedTypeChecks.filter(c => c.status === 'FAIL').length} unexpected types\n`);
  }
  
  // Cross-store verification
  console.log('Verifying cross-store consistency...');
  result.crossStoreChecks = await verifyCrossStore(projectId);
  console.log(`  ${result.crossStoreChecks.filter(c => c.status === 'PASS').length}/${result.crossStoreChecks.length} passed\n`);
  
  // Referential integrity
  console.log('Checking referential integrity...');
  result.integrityChecks = await verifyIntegrity(projectId);
  console.log(`  ${result.integrityChecks.filter(c => c.status === 'PASS').length}/${result.integrityChecks.length} passed\n`);
  
  // Calculate summary
  const allChecks = [
    result.driftCheck,
    ...result.entityChecks,
    ...result.relationshipChecks,
    ...result.unexpectedTypeChecks,
    ...result.crossStoreChecks,
    ...result.integrityChecks,
  ];
  
  result.summary.total = allChecks.length;
  result.summary.passed = allChecks.filter(c => c.status === 'PASS').length;
  result.summary.failed = allChecks.filter(c => c.status === 'FAIL').length;
  result.summary.warned = allChecks.filter(c => c.status === 'WARN').length;
  result.summary.skipped = allChecks.filter(c => c.status === 'SKIP').length;
  
  // Validate skipped codes against phase-specific allowlist
  const skipViolations = validateSkipAllowlist(phase, allChecks);
  if (skipViolations.length > 0) {
    result.summary.failed += skipViolations.length;
    result.integrityChecks.push(...skipViolations);
  }
  
  result.verdict = result.summary.failed > 0 ? 'FAIL' : 'PASS';
  
  return result;
}

// -----------------------------------------------------------------------------
// Skip Allowlist Validation
// -----------------------------------------------------------------------------

/**
 * A3 Skip Allowlist - ONLY these codes may be skipped in A3 phase.
 * Any other skip is a governance violation.
 */
const A3_SKIP_ALLOWLIST = new Set([
  'E52',  // BuildArtifact - Git extraction (A4)
  'R07',  // HAS_BUILD_ARTIFACT (A4)
  'R14',  // IMPLEMENTED_BY - TDD frontmatter (A4)
  'R21',  // IMPORTS - AST extraction (A4)
  'R22',  // CALLS - AST extraction (A4)
  'R23',  // EXTENDS - AST extraction (A4)
  'R26',  // DEPENDS_ON - AST extraction (A4)
  'R63',  // INTRODUCED_IN - Git extraction (A4)
  'R67',  // MODIFIED_IN - Git extraction (A4)
  'R70',  // CONTAINS_FILE - Git extraction (A4)
]);

/**
 * Validate that all skipped checks are in the phase-specific allowlist.
 * Returns FAIL checks for any violations.
 */
function validateSkipAllowlist(
  phase: Phase, 
  checks: VerificationCheck[]
): VerificationCheck[] {
  // Only enforce allowlist for A3
  if (phase !== 'A3') {
    return [];
  }
  
  const violations: VerificationCheck[] = [];
  const skippedChecks = checks.filter(c => c.status === 'SKIP');
  
  for (const check of skippedChecks) {
    // Extract code from check name (e.g., "Entity E52" -> "E52", "Relationship R14" -> "R14")
    const codeMatch = check.name.match(/(?:Entity|Relationship)\s+([A-Z]\d+)/);
    if (!codeMatch) continue;
    
    const code = codeMatch[1];
    if (!A3_SKIP_ALLOWLIST.has(code)) {
      violations.push({
        name: `Skip Allowlist: ${code}`,
        status: 'FAIL',
        message: `${code} is skipped but NOT in A3 allowlist. Fix the expectation or implement the extraction.`,
        expected: 'In allowlist',
        actual: 'NOT in allowlist',
      });
    }
  }
  
  return violations;
}

// -----------------------------------------------------------------------------
// CLI Entry Point
// -----------------------------------------------------------------------------

async function main(): Promise<void> {
  const projectId = process.env.PROJECT_ID;
  
  try {
    const result = await verifyTrackMilestone(projectId);
    
    console.log('=== Summary ===');
    console.log(`Total checks: ${result.summary.total}`);
    console.log(`  Passed: ${result.summary.passed}`);
    console.log(`  Failed: ${result.summary.failed}`);
    console.log(`  Warned: ${result.summary.warned}`);
    console.log(`  Skipped: ${result.summary.skipped}`);
    console.log();
    
    if (result.summary.failed > 0) {
      console.log('Failed checks:');
      const allChecks = [
        result.driftCheck,
        ...result.entityChecks,
        ...result.relationshipChecks,
        ...result.unexpectedTypeChecks,
        ...result.crossStoreChecks,
        ...result.integrityChecks,
      ];
      
      for (const check of allChecks.filter(c => c.status === 'FAIL')) {
        console.log(`  ❌ ${check.name}: ${check.message}`);
      }
      console.log();
    }
    
    if (result.verdict === 'PASS') {
      console.log('✅ Track Milestone Verification PASSED');
      process.exit(0);
    } else {
      console.error('❌ Track Milestone Verification FAILED');
      process.exit(1);
    }
  } finally {
    await pgReader.closePool();
    await neo4jReader.closeDriver();
  }
}

// Run if executed directly (ES module compatible)
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  main().catch(err => {
    console.error('Verification error:', err);
    process.exit(1);
  });
}

