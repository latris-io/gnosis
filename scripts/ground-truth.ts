#!/usr/bin/env npx tsx
/**
 * Ground Truth CLI Script - Track B: Story B.1
 * @g-api-exception TRACK_B_OWNED
 * 
 * Track B-owned services (src/services/track_b/**) are consumed by this script.
 * No Track A locked surfaces are involved. This is intentional and stable.
 * 
 * TDD ID: TDD-TRACKB-B1
 * Commands: set-baseline, check
 * Usage: npx tsx scripts/ground-truth.ts [set-baseline|check]
 * Environment: PROJECT_ID (required for check), GRAPH_API_URL (optional)
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Import from Track B ground-truth services (allowed surface per @g-api-exception above)
import {
  GroundTruthBaseline,
  HealthReport,
  createBaseline,
  checkHealth,
  evaluateGHealth,
  logGroundTruthOperation,
  getScopeDefinition,
  getLedgerFilePath,
} from '../src/services/track_b/ground-truth/index.js';

// Paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

const BASELINE_PATH = path.join(REPO_ROOT, 'docs/verification/track_b/GROUND_TRUTH_BASELINE.json');
const EVIDENCE_PATH = path.join(REPO_ROOT, 'docs/verification/track_b/B1_GROUND_TRUTH_EVIDENCE.md');

/**
 * Load baseline from file.
 */
async function loadBaseline(): Promise<GroundTruthBaseline> {
  const content = await fs.promises.readFile(BASELINE_PATH, 'utf-8');
  return JSON.parse(content) as GroundTruthBaseline;
}

/**
 * Save baseline to file.
 */
async function saveBaseline(baseline: GroundTruthBaseline): Promise<void> {
  const dir = path.dirname(BASELINE_PATH);
  await fs.promises.mkdir(dir, { recursive: true });
  await fs.promises.writeFile(BASELINE_PATH, JSON.stringify(baseline, null, 2));
}

/**
 * Evidence data structure for generating the markdown report.
 */
interface EvidenceData {
  timestamp: string;
  projectId: string | undefined;
  scopeDef: { scope: string[]; excludes: string[] };
  baselineRoot: string | null;
  computedRoot: string | null;
  score: number | null;
  gHealthPass: boolean | null;
  report: HealthReport | null;
  error: string | null;
}

/**
 * Generate evidence markdown file.
 * This function MUST produce valid output even when health check fails.
 */
function generateEvidenceMarkdown(data: EvidenceData): string {
  const { timestamp, projectId, scopeDef, baselineRoot, computedRoot, score, gHealthPass, report, error } = data;
  
  const graphCoverageStatus = report?.graph_coverage_status ?? 'DEFERRED_TO_B6';
  
  let content = `# B.1 Ground Truth Evidence

**Generated:** ${timestamp}  
**Project ID:** ${projectId || 'N/A'}

---

## Health Score

| Metric | Value |
|--------|-------|
| **Score** | ${score !== null ? score : 'N/A (computation failed)'} |
| **G-HEALTH Pass** | ${gHealthPass === true ? '✅ PASS' : gHealthPass === false ? '❌ FAIL' : '⚠️ UNKNOWN (computation failed)'} |

`;

  // Error section (if any)
  if (error) {
    content += `---

## ⚠️ Error During Health Check

\`\`\`
${error}
\`\`\`

**Note:** G-HEALTH is marked as FAIL when health computation cannot complete.

`;
  }

  content += `---

## Merkle Root Comparison

| Field | Value |
|-------|-------|
| Expected Root | ${baselineRoot ? `\`${baselineRoot}\`` : 'N/A'} |
| Computed Root | ${computedRoot ? `\`${computedRoot}\`` : 'N/A (not computed)'} |
| Match | ${baselineRoot && computedRoot ? (baselineRoot === computedRoot ? '✅' : '❌') : '⚠️ Unable to compare'} |

---

## File Counts

| Metric | Count |
|--------|-------|
| Expected files | ${report?.file_count.expected ?? 'N/A'} |
| Actual files | ${report?.file_count.actual ?? 'N/A'} |

---

## Baseline vs Disk

| Category | Count |
|----------|-------|
| Missing paths | ${report?.missing_paths.length ?? 0} |
| Extra paths | ${report?.extra_paths.length ?? 0} |
| Hash mismatched | ${report?.mismatched.length ?? 0} |

---

## Graph Coverage

**Status:** ${graphCoverageStatus === 'DEFERRED_TO_B6' ? '⏳ DEFERRED TO B.6 (Graph API v2)' : '✅ CHECKED'}

${graphCoverageStatus === 'DEFERRED_TO_B6' ? `
**Why deferred:**
- Graph API v1 does not expose an entity listing endpoint
- Track B cannot modify Track A locked surfaces (\`src/http/**\`)
- Full graph coverage validation will be added in B.6 (Graph API v2)

**B.1 validates:**
- Merkle root integrity (baseline ↔ disk)
- File count consistency
- Scope version compatibility

**B.6 will add:**
- \`/api/v2/entities\` endpoint for E11 listing
- Full disk ↔ graph comparison
` : `
| Category | Count |
|----------|-------|
| On disk, not in graph | ${report?.graph_missing_paths.length ?? 0} |
| In graph, not on disk | ${report?.graph_extra_paths.length ?? 0} |
`}

---

## Scope Definition

**Scope version:** B1-v1

**Included patterns:**
${scopeDef.scope.map(p => `- \`${p}\``).join('\n')}

**Excluded patterns:**
${scopeDef.excludes.map(p => `- \`${p}\``).join('\n')}

---

## Ledger

Operations logged to: \`${getLedgerFilePath()}\`

---

## Commands Run

\`\`\`bash
# Set baseline
npx tsx scripts/ground-truth.ts set-baseline

# Check health
PROJECT_ID=${projectId || '<project-id>'} npx tsx scripts/ground-truth.ts check
\`\`\`
`;

  return content;
}

/**
 * Write evidence file (always, regardless of success/failure).
 */
async function writeEvidence(data: EvidenceData): Promise<void> {
  const evidenceDir = path.dirname(EVIDENCE_PATH);
  await fs.promises.mkdir(evidenceDir, { recursive: true });
  const content = generateEvidenceMarkdown(data);
  await fs.promises.writeFile(EVIDENCE_PATH, content);
  console.log(`   Evidence written: ${EVIDENCE_PATH}`);
}

/**
 * Command: set-baseline
 */
async function cmdSetBaseline(): Promise<void> {
  console.log('🔧 Setting ground truth baseline...');
  console.log(`   Repo root: ${REPO_ROOT}`);
  
  // Create baseline
  const baseline = await createBaseline(REPO_ROOT);
  
  console.log(`   Files in scope: ${baseline.file_count}`);
  console.log(`   Merkle root: ${baseline.merkle_root}`);
  console.log(`   Scope version: ${baseline.scope_version}`);
  
  // Save baseline
  await saveBaseline(baseline);
  console.log(`   Baseline saved: ${BASELINE_PATH}`);
  
  // Log to ledger
  await logGroundTruthOperation(REPO_ROOT, {
    action: 'SET_BASELINE',
    merkle_root: baseline.merkle_root,
    file_count: baseline.file_count,
    scope: baseline.scope,
    excludes: baseline.excludes,
    actor: 'scripts/ground-truth.ts',
    notes: 'Initial baseline set',
  });
  console.log(`   Logged to: ${getLedgerFilePath()}`);
  
  console.log('✅ Baseline set successfully');
}

/**
 * Command: check
 * 
 * IMPORTANT: Evidence file is ALWAYS written, even on failure.
 * This is required by B.1 Definition of Done.
 * 
 * NOTE: Graph coverage validation is DEFERRED to B.6 (Graph API v2).
 * B.1 validates baseline ↔ disk integrity only.
 */
async function cmdCheck(): Promise<void> {
  const projectId = process.env.PROJECT_ID;
  const timestamp = new Date().toISOString();
  const scopeDef = getScopeDefinition();
  
  // Initialize evidence data with defaults
  const evidenceData: EvidenceData = {
    timestamp,
    projectId,
    scopeDef,
    baselineRoot: null,
    computedRoot: null,
    score: null,
    gHealthPass: null,
    report: null,
    error: null,
  };
  
  let exitCode = 0;
  
  try {
    if (!projectId) {
      throw new Error('PROJECT_ID environment variable is required for health check');
    }
    
    console.log('🔍 Running ground truth health check...');
    console.log(`   Repo root: ${REPO_ROOT}`);
    console.log(`   Project ID: ${projectId}`);
    
    // Load baseline
    let baseline: GroundTruthBaseline;
    try {
      baseline = await loadBaseline();
      console.log(`   Baseline loaded: ${BASELINE_PATH}`);
      evidenceData.baselineRoot = baseline.merkle_root;
    } catch (loadError) {
      throw new Error(`Could not load baseline from ${BASELINE_PATH}. Run set-baseline first.`);
    }
    
    // Run health check
    const report = await checkHealth(REPO_ROOT, baseline, projectId);
    evidenceData.report = report;
    evidenceData.computedRoot = report.computed_root;
    evidenceData.score = report.score;
    
    // Evaluate G-HEALTH
    const gHealth = evaluateGHealth(report);
    evidenceData.gHealthPass = gHealth.pass;
    
    console.log('');
    console.log('📊 Health Report:');
    console.log(`   Score: ${report.score}`);
    console.log(`   Expected root: ${report.expected_root}`);
    console.log(`   Computed root: ${report.computed_root}`);
    console.log(`   Roots match: ${report.expected_root === report.computed_root ? '✅' : '❌'}`);
    console.log(`   Files: ${report.file_count.actual} (expected: ${report.file_count.expected})`);
    console.log(`   Missing paths: ${report.missing_paths.length}`);
    console.log(`   Extra paths: ${report.extra_paths.length}`);
    console.log(`   Mismatched hashes: ${report.mismatched.length}`);
    console.log(`   Graph coverage: ${report.graph_coverage_status === 'DEFERRED_TO_B6' ? 'Deferred to B.6' : 'Checked'}`);
    console.log('');
    console.log(`   G-HEALTH: ${gHealth.pass ? '✅ PASS' : '❌ FAIL'}`);
    
    // Log to ledger
    await logGroundTruthOperation(REPO_ROOT, {
      action: 'HEALTH_CHECK',
      merkle_root: report.computed_root,
      file_count: report.file_count.actual,
      scope: baseline.scope,
      excludes: baseline.excludes,
      actor: 'scripts/ground-truth.ts',
      notes: `Score: ${report.score}, G-HEALTH: ${gHealth.pass ? 'PASS' : 'FAIL'}`,
    });
    console.log(`   Logged to: ${getLedgerFilePath()}`);
    
    if (!gHealth.pass) {
      exitCode = 1;
    }
    
  } catch (error) {
    // Capture error for evidence
    const errorMessage = error instanceof Error ? error.message : String(error);
    evidenceData.error = errorMessage;
    evidenceData.gHealthPass = false;  // Failure to compute = G-HEALTH FAIL
    evidenceData.score = 0;
    
    console.error('');
    console.error('❌ Error during health check:', errorMessage);
    exitCode = 1;
    
  } finally {
    // ALWAYS write evidence file, regardless of success or failure
    try {
      await writeEvidence(evidenceData);
    } catch (writeError) {
      console.error('❌ Failed to write evidence file:', writeError);
    }
  }
  
  // Final status
  console.log('');
  if (exitCode === 0) {
    console.log('✅ Health check passed');
  } else {
    console.log('❌ Health check failed');
  }
  
  process.exit(exitCode);
}

/**
 * Main entry point.
 */
async function main(): Promise<void> {
  const command = process.argv[2];
  
  switch (command) {
    case 'set-baseline':
      await cmdSetBaseline();
      break;
    case 'check':
      await cmdCheck();
      break;
    default:
      console.log('Ground Truth CLI');
      console.log('');
      console.log('Usage:');
      console.log('  npx tsx scripts/ground-truth.ts set-baseline');
      console.log('  PROJECT_ID=<uuid> npx tsx scripts/ground-truth.ts check');
      console.log('');
      console.log('Commands:');
      console.log('  set-baseline  Generate manifest, compute Merkle root, save baseline');
      console.log('  check         Compare current state to baseline, validate graph coverage');
      process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
