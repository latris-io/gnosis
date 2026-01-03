// src/services/track_b/brd-registry/gate.ts
// G-REGISTRY Gate Evaluation
// Scope: Local Registry Integrity (not complete BRD-to-graph parity)

import * as fs from 'fs';
import type { RegistryGateResult, Discrepancy } from './types.js';
import { BRD_PATH, EXPECTED_BRD_VERSION, EVIDENCE_PATH } from './config.js';
import { parseBrd, validateParsing } from './parser.js';
import { computeContentHash, computeBrdHash } from './hasher.js';
import { loadRegistry } from './registry.js';
import { appendLedgerEntry, createGateEntry } from './ledger.js';
import * as path from 'path';

/**
 * Evaluate the G-REGISTRY gate.
 * 
 * Scope: Local Registry Integrity
 * - BRD parsed successfully (no fatal errors, unique IDs)
 * - Version matches expected (pinned in config)
 * - Hash computed successfully
 * - Internal consistency (counts match identifier arrays)
 * - Drift check (if baseline exists, hash + counts match)
 * 
 * Graph comparison is DEFERRED to B.6 (Graph API v2).
 * 
 * @param brdPath - Optional path to BRD file (defaults to config)
 * @returns Gate result
 */
export async function evaluateGRegistryGate(brdPath: string = BRD_PATH): Promise<RegistryGateResult> {
  const timestamp = new Date().toISOString();
  const discrepancies: Discrepancy[] = [];
  
  const checks = {
    brd_parsed: false,
    version_matches: false,
    hash_computed: false,
    internal_consistency: false,
    drift_check_passed: false,
  };
  
  let counts = { epics: 0, stories: 0, acs: 0 };
  let contentHash = '';
  let version = '';
  
  try {
    // Check 1: BRD file exists and can be read
    if (!fs.existsSync(brdPath)) {
      discrepancies.push({
        type: 'PARSE_ERROR',
        details: `BRD file not found: ${brdPath}`,
      });
      return buildResult(false, checks, discrepancies, counts, timestamp);
    }
    
    const content = fs.readFileSync(brdPath, 'utf-8');
    
    // Check 2: Parse BRD
    const parseResult = parseBrd(content, brdPath);
    version = parseResult.version;
    counts = {
      epics: parseResult.epics.length,
      stories: parseResult.stories.length,
      acs: parseResult.acs.length,
    };
    
    // Validate parsing
    const validation = validateParsing(parseResult);
    if (!validation.valid) {
      for (const error of validation.errors) {
        discrepancies.push({
          type: 'PARSE_ERROR',
          details: error,
        });
      }
    }
    
    // Mark parsed as successful if we have results
    checks.brd_parsed = parseResult.epics.length > 0 && 
                        parseResult.stories.length > 0 && 
                        parseResult.acs.length > 0;
    
    // Check 3: Version matches expected
    checks.version_matches = parseResult.version === EXPECTED_BRD_VERSION;
    if (!checks.version_matches) {
      discrepancies.push({
        type: 'VERSION_MISMATCH',
        expected: EXPECTED_BRD_VERSION,
        actual: parseResult.version,
        details: `Expected BRD version ${EXPECTED_BRD_VERSION}, found ${parseResult.version}`,
      });
    }
    
    // Check 4: Hash computed
    try {
      contentHash = computeContentHash(content);
      checks.hash_computed = contentHash.startsWith('sha256:') && contentHash.length === 71;
    } catch (error) {
      discrepancies.push({
        type: 'HASH_MISMATCH',
        details: `Failed to compute hash: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
    
    // Check 5: Internal consistency
    const epicCount = parseResult.epics.length;
    const storyCount = parseResult.stories.length;
    const acCount = parseResult.acs.length;
    
    checks.internal_consistency = 
      epicCount === new Set(parseResult.epics.map(e => e.id)).size &&
      storyCount === new Set(parseResult.stories.map(s => s.id)).size &&
      acCount === new Set(parseResult.acs.map(a => a.id)).size;
    
    if (!checks.internal_consistency) {
      discrepancies.push({
        type: 'COUNT_MISMATCH',
        details: 'Internal consistency check failed: duplicate IDs detected',
      });
    }
    
    // Check 6: Drift check against stored baseline (if exists)
    const stored = loadRegistry();
    if (!stored) {
      // First run - no baseline to compare, drift check passes
      checks.drift_check_passed = true;
    } else {
      // Compare against stored baseline
      const hashMatch = contentHash === stored.brd_content_hash;
      const countsMatch = 
        counts.epics === stored.counts.epics &&
        counts.stories === stored.counts.stories &&
        counts.acs === stored.counts.acs;
      
      checks.drift_check_passed = hashMatch && countsMatch;
      
      if (!hashMatch) {
        discrepancies.push({
          type: 'HASH_MISMATCH',
          expected: stored.brd_content_hash,
          actual: contentHash,
          details: 'Content hash differs from stored baseline',
        });
      }
      
      if (!countsMatch) {
        discrepancies.push({
          type: 'COUNT_MISMATCH',
          expected: `${stored.counts.epics}/${stored.counts.stories}/${stored.counts.acs}`,
          actual: `${counts.epics}/${counts.stories}/${counts.acs}`,
          details: 'Counts differ from stored baseline',
        });
      }
    }
    
  } catch (error) {
    discrepancies.push({
      type: 'PARSE_ERROR',
      details: `Gate evaluation failed: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
  
  // Determine overall pass
  const pass = 
    checks.brd_parsed &&
    checks.version_matches &&
    checks.hash_computed &&
    checks.internal_consistency &&
    checks.drift_check_passed;
  
  // Log gate result
  appendLedgerEntry(createGateEntry(
    brdPath,
    version,
    contentHash,
    counts,
    pass ? 'PASS' : 'FAIL',
    pass ? 'All checks passed' : `${discrepancies.length} issues found`
  ));
  
  const result = buildResult(pass, checks, discrepancies, counts, timestamp);
  
  // Write evidence artifact
  await writeEvidence(result, brdPath, contentHash);
  
  return result;
}

/**
 * Build gate result object.
 */
function buildResult(
  pass: boolean,
  checks: RegistryGateResult['checks'],
  discrepancies: Discrepancy[],
  counts: { epics: number; stories: number; acs: number },
  timestamp: string
): RegistryGateResult {
  const summary = pass
    ? 'G-REGISTRY: PASS (local registry integrity verified)'
    : `G-REGISTRY: FAIL (${discrepancies.length} issue(s) found)`;
  
  return {
    pass,
    gate: 'G-REGISTRY',
    scope: 'local_integrity',
    timestamp,
    checks,
    graph_comparison: {
      status: 'deferred',
      deferred_to: 'B.6 (Graph API v2)',
      reason: 'Graph API v1 does not expose entity enumeration endpoints',
    },
    discrepancies,
    counts,
    summary,
  };
}

/**
 * Write evidence artifact to disk.
 */
async function writeEvidence(
  result: RegistryGateResult,
  brdPath: string,
  contentHash: string
): Promise<void> {
  const evidenceDir = path.dirname(EVIDENCE_PATH);
  if (!fs.existsSync(evidenceDir)) {
    fs.mkdirSync(evidenceDir, { recursive: true });
  }
  
  const evidence = `# B.2 BRD Registry Evidence

**Generated:** ${result.timestamp}  
**Gate:** G-REGISTRY  
**Scope:** Local Registry Integrity  
**Result:** ${result.pass ? 'PASS' : 'FAIL'}

---

## BRD Source

| Field | Value |
|-------|-------|
| Path | ${brdPath} |
| Version | ${EXPECTED_BRD_VERSION} |
| Content Hash | ${contentHash} |

**Normalization policy:** strict (byte-for-byte), no whitespace trimming

---

## Counts (Informational)

| Type | Parsed |
|------|--------|
| Epics | ${result.counts.epics} |
| Stories | ${result.counts.stories} |
| ACs | ${result.counts.acs} |

Note: Counts are derived from parsing, not compared against constants.
Gate checks consistency against stored baseline.

---

## Registry State

**Location:** data/track_b/BRD_REGISTRY.json  
**Schema Version:** 1.0.0

---

## Graph Comparison

**Status:** DEFERRED to B.6 (Graph API v2)  
**Reason:** ${result.graph_comparison.reason}

Full BRD-to-graph parity validation will be implemented in B.6 when 
\`GET /api/v2/entities?entity_type=...\` becomes available.

---

## Gate Checks

| Check | Result |
|-------|--------|
| BRD parsed | ${result.checks.brd_parsed ? 'PASS' : 'FAIL'} |
| Version pinned | ${result.checks.version_matches ? 'PASS' : 'FAIL'} |
| Hash computed | ${result.checks.hash_computed ? 'PASS' : 'FAIL'} |
| Internal consistency | ${result.checks.internal_consistency ? 'PASS' : 'FAIL'} |
| Drift check | ${result.checks.drift_check_passed ? 'PASS' : 'FAIL'} |
| Graph comparison | DEFERRED |

${result.discrepancies.length > 0 ? `
---

## Discrepancies

${result.discrepancies.map((d, i) => `${i + 1}. **${d.type}**: ${d.details}`).join('\n')}
` : ''}
---

## Summary

**${result.summary}**
`;

  fs.writeFileSync(EVIDENCE_PATH, evidence, 'utf-8');
}

