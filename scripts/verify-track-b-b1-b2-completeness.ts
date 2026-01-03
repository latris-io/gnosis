#!/usr/bin/env npx tsx
/**
 * B1+B2 Completeness Report Verifier
 * @g-api-exception VERIFICATION_SCRIPT
 * 
 * Generates a comprehensive verification report proving B.1 and B.2 are complete
 * and stable before proceeding to B.3 (Drift Detection).
 * 
 * Usage: PROJECT_ID=... npx tsx scripts/verify-track-b-b1-b2-completeness.ts
 * 
 * READ-ONLY: Requires read-only access to services for graph parity checks.
 * Does NOT write to Postgres/Neo4j, modify Track A, or change B.1/B.2 behavior.
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { execSync } from 'child_process';

// Track B services (read-only access for verification)
import { loadRegistry } from '../src/services/track_b/brd-registry/registry.js';
import { parseBrd, validateParsing } from '../src/services/track_b/brd-registry/parser.js';
import { computeContentHash } from '../src/services/track_b/brd-registry/hasher.js';
import { BRD_PATH, EXPECTED_BRD_VERSION, REGISTRY_PATH } from '../src/services/track_b/brd-registry/config.js';

// Entity/Relationship services for graph parity check (read-only)
import * as entityService from '../src/services/entities/entity-service.js';
import * as relationshipService from '../src/services/relationships/relationship-service.js';

// Neo4j session for parity check
import { getSession } from '../src/db/neo4j.js';

// Connection management
import { closeConnections } from '../src/ops/track-a.js';

// ============================================================
// CONFIGURATION
// ============================================================

const PROJECT_ID = process.env.PROJECT_ID;
if (!PROJECT_ID) {
  console.error('ERROR: PROJECT_ID environment variable required');
  console.error('Usage: PROJECT_ID=... npx tsx scripts/verify-track-b-b1-b2-completeness.ts');
  process.exit(1);
}

const REPORT_DATE = process.env.REPORT_DATE || new Date().toISOString().split('T')[0];

// Artifact paths to verify
const ARTIFACTS = {
  BASELINE: 'docs/verification/track_b/GROUND_TRUTH_BASELINE.json',
  B1_EVIDENCE: 'docs/verification/track_b/B1_GROUND_TRUTH_EVIDENCE.md',
  // Canonical ledger per CID-2026-01-03 (was: docs/verification/track_b/ground-truth-ledger.jsonl)
  CANONICAL_LEDGER: `shadow-ledger/${PROJECT_ID}/ledger.jsonl`,
  BRD_REGISTRY: 'data/track_b/BRD_REGISTRY.json',
  B2_EVIDENCE: 'docs/verification/track_b/B2_BRD_REGISTRY_EVIDENCE.md',
  EXTRACTION_PROVENANCE: 'docs/verification/track_b/EXTRACTION_PROVENANCE.md',
};

// Expected R14 targets for TDD-TRACKB-B1
const EXPECTED_R14_TARGETS = [
  'FILE-src/services/track_b/ground-truth/file-scope.ts',
  'FILE-src/services/track_b/ground-truth/health.ts',
  'FILE-src/services/track_b/ground-truth/index.ts',
  'FILE-src/services/track_b/ground-truth/ledger.ts',
  'FILE-src/services/track_b/ground-truth/manifest.ts',
  'FILE-src/services/track_b/ground-truth/merkle.ts',
  'FILE-src/services/track_b/ground-truth/types.ts',
];

// ============================================================
// TYPES
// ============================================================

type CheckStatus = 'PASS' | 'FAIL' | 'WARN' | 'SKIP';

interface CheckResult {
  name: string;
  status: CheckStatus;
  metric: string;
  notes: string;
}

interface ArtifactHash {
  path: string;
  exists: boolean;
  sha256: string | null;
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function sha256File(filePath: string): string | null {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

function getGitInfo(): { sha: string; branch: string; clean: boolean; dirtyFiles: string[] } {
  try {
    const sha = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
    const status = execSync('git status --porcelain', { encoding: 'utf-8' }).trim();
    const dirtyFiles = status.length > 0 ? status.split('\n').filter(l => l.length > 0) : [];
    return { sha, branch, clean: dirtyFiles.length === 0, dirtyFiles };
  } catch {
    return { sha: 'unknown', branch: 'unknown', clean: false, dirtyFiles: [] };
  }
}

function getNodeVersions(): { node: string; npm: string } {
  try {
    const node = execSync('node --version', { encoding: 'utf-8' }).trim();
    const npm = execSync('npm --version', { encoding: 'utf-8' }).trim();
    return { node, npm };
  } catch {
    return { node: 'unknown', npm: 'unknown' };
  }
}

function readLastLines(filePath: string, count: number): string[] {
  if (!fs.existsSync(filePath)) return [];
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.trim().split('\n').filter(l => l.length > 0);
    return lines.slice(-count);
  } catch {
    return [];
  }
}

// ============================================================
// CHECK FUNCTIONS
// ============================================================

function checkArtifactHashes(): { hashes: ArtifactHash[]; allPresent: boolean } {
  const hashes: ArtifactHash[] = [];
  let allPresent = true;

  for (const [name, artifactPath] of Object.entries(ARTIFACTS)) {
    const exists = fs.existsSync(artifactPath);
    const sha256 = sha256File(artifactPath);
    hashes.push({ path: artifactPath, exists, sha256 });
    if (!exists) allPresent = false;
  }

  return { hashes, allPresent };
}

function checkB1BaselineRoot(): CheckResult {
  const baselinePath = ARTIFACTS.BASELINE;
  const evidencePath = ARTIFACTS.B1_EVIDENCE;
  
  // Check baseline file exists
  if (!fs.existsSync(baselinePath)) {
    return {
      name: 'B.1 Baseline Root',
      status: 'FAIL',
      metric: 'N/A',
      notes: 'GROUND_TRUTH_BASELINE.json not found',
    };
  }

  // Check evidence file exists
  if (!fs.existsSync(evidencePath)) {
    return {
      name: 'B.1 Baseline Root',
      status: 'FAIL',
      metric: 'N/A',
      notes: 'B1_GROUND_TRUTH_EVIDENCE.md not found',
    };
  }

  try {
    const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf-8'));
    const evidence = fs.readFileSync(evidencePath, 'utf-8');
    
    const baselineRoot = baseline.merkle_root;
    const fileCount = baseline.file_count;
    
    if (!baselineRoot || typeof baselineRoot !== 'string') {
      return {
        name: 'B.1 Baseline Root',
        status: 'FAIL',
        metric: 'N/A',
        notes: 'Invalid baseline: missing merkle_root',
      };
    }

    // Parse evidence file for expected/computed roots and score
    const scoreMatch = evidence.match(/\*\*Score\*\*\s*\|\s*(\d+)/);
    const expectedMatch = evidence.match(/Expected Root\s*\|\s*`([a-f0-9]+)`/);
    const computedMatch = evidence.match(/Computed Root\s*\|\s*`([a-f0-9]+)`/);
    const matchStatus = evidence.match(/\|\s*Match\s*\|\s*(✅|❌)/);

    const score = scoreMatch ? parseInt(scoreMatch[1], 10) : null;
    const expectedRoot = expectedMatch ? expectedMatch[1] : null;
    const computedRoot = computedMatch ? computedMatch[1] : null;
    const rootsMatch = matchStatus ? matchStatus[1] === '✅' : null;

    const issues: string[] = [];

    // Validate score == 100
    if (score === null) {
      issues.push('score not found in evidence');
    } else if (score !== 100) {
      issues.push(`score=${score} (expected 100)`);
    }

    // Validate expected == computed
    if (!expectedRoot || !computedRoot) {
      issues.push('roots not found in evidence');
    } else if (expectedRoot !== computedRoot) {
      issues.push('expected != computed');
    }

    // Validate match indicator
    if (rootsMatch === false) {
      issues.push('match indicator shows mismatch');
    }

    // Validate baseline matches evidence
    if (expectedRoot && baselineRoot !== expectedRoot) {
      issues.push('baseline.json root differs from evidence expected');
    }

    if (issues.length > 0) {
      return {
        name: 'B.1 Baseline Root',
        status: 'FAIL',
        metric: `root=${baselineRoot.substring(0, 16)}..., score=${score ?? 'N/A'}`,
        notes: issues.join('; '),
      };
    }

    return {
      name: 'B.1 Baseline Root',
      status: 'PASS',
      metric: `root=${baselineRoot.substring(0, 16)}..., score=100, files=${fileCount}`,
      notes: 'Baseline valid, evidence confirms expected==computed, score=100',
    };
  } catch (error) {
    return {
      name: 'B.1 Baseline Root',
      status: 'FAIL',
      metric: 'N/A',
      notes: `Parse error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

async function checkB2RegistryDrift(): Promise<CheckResult> {
  // Load stored registry (read-only)
  const stored = loadRegistry();
  
  if (!stored) {
    return {
      name: 'B.2 Registry Drift',
      status: 'FAIL',
      metric: 'N/A',
      notes: 'BRD_REGISTRY.json not found',
    };
  }

  // Read and parse current BRD (read-only, no ledger write)
  if (!fs.existsSync(BRD_PATH)) {
    return {
      name: 'B.2 Registry Drift',
      status: 'FAIL',
      metric: 'N/A',
      notes: `BRD file not found: ${BRD_PATH}`,
    };
  }

  const content = fs.readFileSync(BRD_PATH, 'utf-8');
  const parseResult = parseBrd(content, BRD_PATH);
  const currentHash = computeContentHash(content);

  const discrepancies: string[] = [];

  // Version check
  if (parseResult.version !== EXPECTED_BRD_VERSION) {
    discrepancies.push(`version mismatch: ${parseResult.version} != ${EXPECTED_BRD_VERSION}`);
  }

  // Hash check
  if (currentHash !== stored.brd_content_hash) {
    discrepancies.push(`hash mismatch`);
  }

  // Count checks
  if (parseResult.epics.length !== stored.counts.epics) {
    discrepancies.push(`epic count: ${parseResult.epics.length} != ${stored.counts.epics}`);
  }
  if (parseResult.stories.length !== stored.counts.stories) {
    discrepancies.push(`story count: ${parseResult.stories.length} != ${stored.counts.stories}`);
  }
  if (parseResult.acs.length !== stored.counts.acs) {
    discrepancies.push(`AC count: ${parseResult.acs.length} != ${stored.counts.acs}`);
  }

  if (discrepancies.length > 0) {
    return {
      name: 'B.2 Registry Drift',
      status: 'FAIL',
      metric: `${discrepancies.length} issues`,
      notes: discrepancies.join('; '),
    };
  }

  return {
    name: 'B.2 Registry Drift',
    status: 'PASS',
    metric: `v=${stored.brd_version}, ${stored.counts.epics}/${stored.counts.stories}/${stored.counts.acs}`,
    notes: 'No drift detected',
  };
}

async function checkGraphSliceParity(): Promise<{ result: CheckResult; details: string }> {
  const tddInstanceId = 'TDD-TRACKB-B1';
  let details = '';

  try {
    // Query PostgreSQL
    const pgEntity = await entityService.getByInstanceId(PROJECT_ID!, tddInstanceId);
    
    if (!pgEntity) {
      return {
        result: {
          name: 'Graph Slice Parity (TDD-TRACKB-B1)',
          status: 'FAIL',
          metric: 'N/A',
          notes: `E06 ${tddInstanceId} not found in PostgreSQL`,
        },
        details: `PostgreSQL: Entity not found\nNeo4j: Not checked`,
      };
    }

    // Query PostgreSQL relationships
    const pgRels = await relationshipService.queryByType(PROJECT_ID!, 'R14');
    const pgR14FromB1 = pgRels.filter(r => r.from_entity_id === pgEntity.id);
    
    // Look up target entity instance_ids
    const pgTargets: string[] = [];
    for (const rel of pgR14FromB1) {
      const targetEntity = await entityService.getById(PROJECT_ID!, rel.to_entity_id);
      if (targetEntity) {
        pgTargets.push(targetEntity.instance_id);
      }
    }
    pgTargets.sort();

    details += `PostgreSQL:\n`;
    details += `  - E06 found: ${tddInstanceId} (id: ${pgEntity.id})\n`;
    details += `  - R14 count: ${pgR14FromB1.length}\n`;
    details += `  - Targets: ${pgTargets.join(', ')}\n`;

    // Query Neo4j
    let session: ReturnType<typeof getSession> | null = null;
    let neo4jR14Count = 0;
    let neo4jTargets: string[] = [];
    let neo4jE06Found = false;

    try {
      session = getSession();
      
      // Check E06 exists
      const e06Result = await session.run(`
        MATCH (n:Entity {project_id: $projectId, instance_id: $instanceId})
        RETURN n.name as name
      `, { projectId: PROJECT_ID, instanceId: tddInstanceId });
      neo4jE06Found = e06Result.records.length > 0;

      // Get R14 relationships
      const r14Result = await session.run(`
        MATCH (from:Entity {instance_id: $fromId})-[r:RELATIONSHIP {project_id: $projectId, relationship_type: 'R14'}]->(to:Entity)
        RETURN to.instance_id as toId
      `, { projectId: PROJECT_ID, fromId: tddInstanceId });
      
      neo4jR14Count = r14Result.records.length;
      neo4jTargets = r14Result.records.map(r => r.get('toId')).sort();
    } finally {
      if (session) await session.close();
    }

    details += `\nNeo4j:\n`;
    details += `  - E06 found: ${neo4jE06Found}\n`;
    details += `  - R14 count: ${neo4jR14Count}\n`;
    details += `  - Targets: ${neo4jTargets.join(', ')}\n`;

    // Compare
    const parityIssues: string[] = [];

    if (!neo4jE06Found) {
      parityIssues.push('E06 missing in Neo4j');
    }

    if (pgR14FromB1.length !== neo4jR14Count) {
      parityIssues.push(`R14 count mismatch: PG=${pgR14FromB1.length}, Neo4j=${neo4jR14Count}`);
    }

    if (pgR14FromB1.length !== EXPECTED_R14_TARGETS.length) {
      parityIssues.push(`R14 count != expected (${EXPECTED_R14_TARGETS.length})`);
    }

    // Check target match
    const expectedSet = new Set(EXPECTED_R14_TARGETS);
    const pgSet = new Set(pgTargets);
    const neo4jSet = new Set(neo4jTargets);

    const missingInPg = EXPECTED_R14_TARGETS.filter(t => !pgSet.has(t));
    const missingInNeo4j = EXPECTED_R14_TARGETS.filter(t => !neo4jSet.has(t));

    if (missingInPg.length > 0) {
      parityIssues.push(`Missing in PG: ${missingInPg.length}`);
    }
    if (missingInNeo4j.length > 0) {
      parityIssues.push(`Missing in Neo4j: ${missingInNeo4j.length}`);
    }

    details += `\nExpected R14 targets: ${EXPECTED_R14_TARGETS.length}\n`;

    if (parityIssues.length > 0) {
      return {
        result: {
          name: 'Graph Slice Parity (TDD-TRACKB-B1)',
          status: 'FAIL',
          metric: `PG=${pgR14FromB1.length}, Neo4j=${neo4jR14Count}`,
          notes: parityIssues.join('; '),
        },
        details,
      };
    }

    return {
      result: {
        name: 'Graph Slice Parity (TDD-TRACKB-B1)',
        status: 'PASS',
        metric: `E06=✓, R14=${pgR14FromB1.length}/7, PG=Neo4j`,
        notes: 'Full parity confirmed',
      },
      details,
    };

  } catch (error) {
    return {
      result: {
        name: 'Graph Slice Parity (TDD-TRACKB-B1)',
        status: 'FAIL',
        metric: 'Error',
        notes: error instanceof Error ? error.message : String(error),
      },
      details: `Error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

function checkExtractionProvenance(): CheckResult {
  const provenancePath = ARTIFACTS.EXTRACTION_PROVENANCE;
  
  if (!fs.existsSync(provenancePath)) {
    return {
      name: 'Extraction Provenance',
      status: 'FAIL',
      metric: 'N/A',
      notes: 'EXTRACTION_PROVENANCE.md not found',
    };
  }

  const content = fs.readFileSync(provenancePath, 'utf-8');
  
  // Extract commit SHA from provenance (format: | **Commit SHA** | `sha` |)
  const shaMatch = content.match(/\*\*Commit SHA\*\*\s*\|\s*`([a-f0-9]+)`/i);
  const provenanceSha = shaMatch ? shaMatch[1] : null;
  
  const gitInfo = getGitInfo();

  if (!provenanceSha) {
    return {
      name: 'Extraction Provenance',
      status: 'WARN',
      metric: 'SHA not found',
      notes: 'Could not parse commit SHA from provenance file',
    };
  }

  // Compare (allow prefix match for abbreviated SHAs)
  const matches = gitInfo.sha.startsWith(provenanceSha) || provenanceSha.startsWith(gitInfo.sha);

  if (!matches) {
    return {
      name: 'Extraction Provenance',
      status: 'WARN',
      metric: `provenance=${provenanceSha.substring(0, 12)}...`,
      notes: `SHA mismatch: HEAD=${gitInfo.sha.substring(0, 12)}...`,
    };
  }

  return {
    name: 'Extraction Provenance',
    status: 'PASS',
    metric: `SHA=${provenanceSha.substring(0, 12)}...`,
    notes: 'SHA matches current HEAD',
  };
}

function checkLedgerTails(): { b1Entries: string[]; b2Entries: string[]; valid: boolean; issues: string[] } {
  // Read from canonical ledger and filter by story
  const allLines = readLastLines(ARTIFACTS.CANONICAL_LEDGER, 100);
  const issues: string[] = [];

  // Filter to B.1 and B.2 entries
  const b1Lines: string[] = [];
  const b2Lines: string[] = [];
  
  for (const line of allLines) {
    try {
      const entry = JSON.parse(line);
      if (entry.track === 'B' && entry.story === 'B.1') {
        b1Lines.push(line);
        if (!entry.ts && !entry.timestamp) issues.push('B1 ledger: missing ts/timestamp');
        if (!entry.action) issues.push('B1 ledger: missing action');
      } else if (entry.track === 'B' && entry.story === 'B.2') {
        b2Lines.push(line);
        if (!entry.ts && !entry.timestamp) issues.push('B2 ledger: missing ts/timestamp');
        if (!entry.action) issues.push('B2 ledger: missing action');
      }
    } catch {
      // Ignore parse errors for non-Track-B entries
    }
  }

  // Take last 5 of each
  const b1Last5 = b1Lines.slice(-5);
  const b2Last5 = b2Lines.slice(-5);

  return {
    b1Entries: b1Last5,
    b2Entries: b2Last5,
    valid: issues.length === 0,
    issues,
  };
}

// ============================================================
// REPORT GENERATION
// ============================================================

function generateReport(
  results: CheckResult[],
  artifactHashes: ArtifactHash[],
  graphParityDetails: string,
  ledgerData: { b1Entries: string[]; b2Entries: string[] },
  gitInfo: { sha: string; branch: string; clean: boolean; dirtyFiles: string[] },
  nodeVersions: { node: string; npm: string }
): string {
  const timestamp = new Date().toISOString();
  const overallPass = results.every(r => r.status === 'PASS' || r.status === 'WARN');

  let report = `# B1+B2 Completeness Report

**Generated:** ${timestamp}  
**Report Date:** ${REPORT_DATE}  
**Project ID:** ${PROJECT_ID}  
**Git SHA:** ${gitInfo.sha}  
**Branch:** ${gitInfo.branch}  
**Working Tree:** ${gitInfo.clean ? 'Clean' : `Dirty (${gitInfo.dirtyFiles.length} files)`}  
**Node:** ${nodeVersions.node}  
**npm:** ${nodeVersions.npm}
${!gitInfo.clean && gitInfo.dirtyFiles.length > 0 ? `
### Uncommitted Changes

\`\`\`
${gitInfo.dirtyFiles.slice(0, 20).join('\n')}${gitInfo.dirtyFiles.length > 20 ? `\n... and ${gitInfo.dirtyFiles.length - 20} more` : ''}
\`\`\`
` : ''}
---

## Overall Status: ${overallPass ? '✅ PASS' : '❌ FAIL'}

---

## Summary

| Check | Status | Metric | Notes |
|-------|--------|--------|-------|
${results.map(r => `| ${r.name} | ${r.status} | ${r.metric} | ${r.notes} |`).join('\n')}

---

## A) Artifact Hashes

| Artifact | Exists | SHA256 |
|----------|--------|--------|
${artifactHashes.map(h => `| ${h.path} | ${h.exists ? '✓' : '✗'} | ${h.sha256 ? h.sha256.substring(0, 16) + '...' : 'N/A'} |`).join('\n')}

---

## B) B.1 Baseline Root Match

${results.find(r => r.name === 'B.1 Baseline Root')?.notes || 'No data'}

Baseline file: \`${ARTIFACTS.BASELINE}\`

---

## C) B.2 Registry Drift Check

${results.find(r => r.name === 'B.2 Registry Drift')?.notes || 'No data'}

- **Expected Version:** ${EXPECTED_BRD_VERSION}
- **Registry Path:** ${REGISTRY_PATH}
- **BRD Path:** ${BRD_PATH}

---

## D) Graph Slice Parity (TDD-TRACKB-B1)

**Method:** Direct PostgreSQL + Neo4j queries via entity/relationship services

\`\`\`
${graphParityDetails}
\`\`\`

---

## E) Extraction Provenance

${results.find(r => r.name === 'Extraction Provenance')?.notes || 'No data'}

Provenance file: \`${ARTIFACTS.EXTRACTION_PROVENANCE}\`

---

## F) Ledger Tail (Last 5 Entries)

### Ground Truth Ledger (B.1)

\`\`\`json
${ledgerData.b1Entries.join('\n')}
\`\`\`

### BRD Registry Ledger (B.2)

\`\`\`json
${ledgerData.b2Entries.join('\n')}
\`\`\`

---

## Verification Method Notes

- **Artifact hashes:** SHA256 computed via Node.js crypto module
- **B.1 baseline:** Parsed from GROUND_TRUTH_BASELINE.json + validated against B1 evidence (expected==computed, score=100)
- **B.2 registry:** Compared using Track B BRD registry services (no ledger writes)
- **Graph parity:** Direct queries to PostgreSQL (entity-service, relationship-service) and Neo4j session
- **Provenance:** Regex extraction of Commit SHA from markdown

---

## Scripts Boundary Compliance

This script uses \`@g-api-exception VERIFICATION_SCRIPT\` because it requires read-only access 
to entity/relationship services for graph parity verification. All access is strictly read-only; 
no data mutations occur.

### Locked Surface Usage

⚠️ **Note:** This script imports \`getSession\` from \`src/db/neo4j.js\` (a locked Track A surface) 
for Neo4j parity checks. This is permitted under the verification exception because:

1. Access is strictly **read-only** (no writes)
2. The script is skipped by \`verify:scripts-boundary\` via \`@g-api-exception\`
3. No ops-layer wrapper exists for entity/relationship instance_id lookups in Neo4j

If a future ops-layer query helper becomes available, this direct import should be replaced.

`;

  return report;
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log('B1+B2 Completeness Report Verifier');
  console.log('===================================');
  console.log(`Project ID: ${PROJECT_ID}`);
  console.log(`Report Date: ${REPORT_DATE}`);
  console.log('');

  const results: CheckResult[] = [];

  // Gather environment info
  const gitInfo = getGitInfo();
  const nodeVersions = getNodeVersions();

  console.log(`Git SHA: ${gitInfo.sha}`);
  console.log(`Git Branch: ${gitInfo.branch}`);
  console.log(`Working Tree: ${gitInfo.clean ? 'Clean' : 'Dirty'}`);
  console.log('');

  // Check 1: Artifact hashes
  console.log('Checking artifact hashes...');
  const { hashes, allPresent } = checkArtifactHashes();
  results.push({
    name: 'Artifact Presence',
    status: allPresent ? 'PASS' : 'FAIL',
    metric: `${hashes.filter(h => h.exists).length}/${hashes.length} present`,
    notes: allPresent ? 'All artifacts found' : 'Some artifacts missing',
  });

  // Check 2: B.1 Baseline Root
  console.log('Checking B.1 baseline root...');
  results.push(checkB1BaselineRoot());

  // Check 3: B.2 Registry Drift
  console.log('Checking B.2 registry drift...');
  results.push(await checkB2RegistryDrift());

  // Check 4: Graph Slice Parity
  console.log('Checking graph slice parity (TDD-TRACKB-B1)...');
  const { result: parityResult, details: parityDetails } = await checkGraphSliceParity();
  results.push(parityResult);

  // Check 5: Extraction Provenance
  console.log('Checking extraction provenance...');
  results.push(checkExtractionProvenance());

  // Check 6: Ledger Tails
  console.log('Checking ledger tails...');
  const ledgerData = checkLedgerTails();
  results.push({
    name: 'Ledger Validity',
    status: ledgerData.valid ? 'PASS' : 'FAIL',
    metric: `B1=${ledgerData.b1Entries.length}, B2=${ledgerData.b2Entries.length}`,
    notes: ledgerData.valid ? 'All entries valid JSON' : ledgerData.issues.join('; '),
  });

  // Check 7: Working Tree Status
  results.push({
    name: 'Working Tree Clean',
    status: gitInfo.clean ? 'PASS' : 'WARN',
    metric: gitInfo.clean ? 'clean' : 'dirty',
    notes: gitInfo.clean ? 'No uncommitted changes' : 'Uncommitted changes present - closure runs should be clean',
  });

  // Generate report
  console.log('');
  console.log('Generating report...');
  const report = generateReport(results, hashes, parityDetails, ledgerData, gitInfo, nodeVersions);

  // Write report
  const reportPath = `docs/verification/track_b/B1_B2_COMPLETENESS_REPORT_${REPORT_DATE}.md`;
  const reportDir = path.dirname(reportPath);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  fs.writeFileSync(reportPath, report, 'utf-8');
  console.log(`Report written to: ${reportPath}`);

  // Print summary
  console.log('');
  console.log('Summary:');
  for (const r of results) {
    const icon = r.status === 'PASS' ? '✓' : r.status === 'WARN' ? '⚠' : '✗';
    console.log(`  ${icon} ${r.name}: ${r.status} (${r.metric})`);
  }

  const overallPass = results.every(r => r.status === 'PASS' || r.status === 'WARN');
  console.log('');
  console.log(`Overall: ${overallPass ? 'PASS ✓' : 'FAIL ✗'}`);

  // Close connections
  await closeConnections();

  process.exit(overallPass ? 0 : 1);
}

main().catch(async error => {
  console.error('FATAL:', error);
  await closeConnections();
  process.exit(1);
});

