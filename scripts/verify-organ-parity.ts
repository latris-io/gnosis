/**
 * Organ Document Parity Verification
 * 
 * Authority: GOVERNANCE_PHASED_PLAN.md §6
 * 
 * Checks:
 * - Header-EndMarker parity
 * - No forward version references
 * - Invariant counts (BRD, UTG, gates)
 * - Cross-reference consistency
 * 
 * Phase behavior:
 * - GOVERNANCE_PHASE=0: warnings only, exit 0
 * - GOVERNANCE_PHASE=1+: failures block, exit 1
 * 
 * RULE-NOAUTOFIX-001: This script ONLY reports issues.
 * It NEVER modifies organ documents.
 */

import { readFileSync, existsSync } from 'fs';
import { glob } from 'glob';
import { join } from 'path';

// --- Configuration ---

const PHASE = parseInt(process.env.GOVERNANCE_PHASE || '0', 10);
const ROOT = process.cwd();

// Current organ doc versions (source of truth)
const ORGAN_VERSIONS: Record<string, string> = {
  'BRD': '20.6.3',
  'UTG': '20.6.1',
  'VERIFICATION': '20.6.5',
  'ROADMAP': '20.6.4',
  'CURSOR': '20.8.5',
  'EP-D-002': '20.6.1',
};

// Invariant counts (canonical values from organ docs)
const INVARIANTS = {
  epics: 65,
  stories: 351,
  acceptanceCriteria: 2849,
  entities: 83,
  relationships: 114,
  gates: 21,
};

// Organ doc patterns
const ORGAN_PATTERNS = [
  'docs/BRD_*.md',
  'docs/UNIFIED_TRACEABILITY_GRAPH_SCHEMA_*.md',
  'docs/UNIFIED_VERIFICATION_SPECIFICATION_*.md',
  'docs/GNOSIS_TO_SOPHIA_MASTER_ROADMAP_*.md',
  'docs/CURSOR_IMPLEMENTATION_PLAN_*.md',
  'docs/integrations/EP-*.md',
];

// Story card patterns  
const STORY_PATTERNS = [
  'spec/track_a/stories/*.md',
];

// --- Types ---

interface CheckResult {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
  file?: string;
  details?: Record<string, unknown>;
}

// --- Utility Functions ---

function extractHeaderVersion(content: string): string | null {
  const match = content.match(/\*\*Version:\*\*\s*(\d+\.\d+\.\d+)/);
  return match ? match[1] : null;
}

function extractEndMarkerVersion(content: string): string | null {
  const match = content.match(/\*\*END OF .+ V(\d+\.\d+\.\d+)\*\*/);
  return match ? match[1] : null;
}

function extractVersionReferences(content: string): string[] {
  const pattern = /V(\d+\.\d+\.\d+)/g;
  const matches = content.matchAll(pattern);
  return [...matches].map(m => m[1]);
}

function getMaxVersion(): string {
  const versions = Object.values(ORGAN_VERSIONS);
  return versions.sort((a, b) => {
    const [aMaj, aMin, aPatch] = a.split('.').map(Number);
    const [bMaj, bMin, bPatch] = b.split('.').map(Number);
    if (aMaj !== bMaj) return bMaj - aMaj;
    if (aMin !== bMin) return bMin - aMin;
    return bPatch - aPatch;
  })[0];
}

function isForwardVersion(version: string): boolean {
  const maxVersion = getMaxVersion();
  const [vMaj, vMin] = version.split('.').map(Number);
  const [mMaj, mMin] = maxVersion.split('.').map(Number);
  
  if (vMaj > mMaj) return true;
  if (vMaj === mMaj && vMin > mMin) return true;
  return false;
}

// --- Check Functions ---

async function checkEndMarkerParity(): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  
  for (const pattern of ORGAN_PATTERNS) {
    const files = await glob(join(ROOT, pattern));
    for (const file of files) {
      const content = readFileSync(file, 'utf-8');
      const headerVersion = extractHeaderVersion(content);
      const endMarkerVersion = extractEndMarkerVersion(content);
      
      const relativePath = file.replace(ROOT + '/', '');
      
      if (!headerVersion) {
        results.push({
          name: 'endmarker-parity',
          status: PHASE === 0 ? 'warn' : 'fail',
          message: 'Could not extract header version',
          file: relativePath,
        });
        continue;
      }
      
      if (!endMarkerVersion) {
        results.push({
          name: 'endmarker-parity',
          status: PHASE === 0 ? 'warn' : 'fail',
          message: 'Could not extract end-marker version',
          file: relativePath,
        });
        continue;
      }
      
      if (headerVersion !== endMarkerVersion) {
        results.push({
          name: 'endmarker-parity',
          status: PHASE === 0 ? 'warn' : 'fail',
          message: `Header (${headerVersion}) != End-marker (${endMarkerVersion})`,
          file: relativePath,
          details: { headerVersion, endMarkerVersion },
        });
      } else {
        results.push({
          name: 'endmarker-parity',
          status: 'pass',
          message: `V${headerVersion}`,
          file: relativePath,
        });
      }
    }
  }
  
  return results;
}

async function checkForwardVersionRefs(): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  const allPatterns = [...ORGAN_PATTERNS, ...STORY_PATTERNS];
  
  for (const pattern of allPatterns) {
    const files = await glob(join(ROOT, pattern));
    for (const file of files) {
      const content = readFileSync(file, 'utf-8');
      const versions = extractVersionReferences(content);
      const forwardRefs = versions.filter(isForwardVersion);
      
      const relativePath = file.replace(ROOT + '/', '');
      
      if (forwardRefs.length > 0) {
        const uniqueForward = [...new Set(forwardRefs)];
        results.push({
          name: 'no-forward-refs',
          status: PHASE === 0 ? 'warn' : 'fail',
          message: `Forward version references: ${uniqueForward.join(', ')}`,
          file: relativePath,
          details: { forwardRefs: uniqueForward },
        });
      }
    }
  }
  
  // If no issues found, report pass
  if (results.length === 0) {
    results.push({
      name: 'no-forward-refs',
      status: 'pass',
      message: 'No forward version references found',
    });
  }
  
  return results;
}

async function checkStoryCardVersions(): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  
  // Check for V20.7.0 references specifically (known drift issue)
  const pattern = /V20\.7\.0/g;
  
  for (const storyPattern of STORY_PATTERNS) {
    const files = await glob(join(ROOT, storyPattern));
    for (const file of files) {
      const content = readFileSync(file, 'utf-8');
      const matches = content.match(pattern);
      
      const relativePath = file.replace(ROOT + '/', '');
      
      if (matches && matches.length > 0) {
        results.push({
          name: 'story-version-refs',
          status: PHASE === 0 ? 'warn' : 'fail',
          message: `Contains ${matches.length} references to non-existent V20.7.0`,
          file: relativePath,
          details: { count: matches.length },
        });
      }
    }
  }
  
  if (results.length === 0) {
    results.push({
      name: 'story-version-refs',
      status: 'pass',
      message: 'No V20.7.0 references in story cards',
    });
  }
  
  return results;
}

async function checkInvariantCounts(): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  
  // Actually parse and count BRD entities
  const brdFiles = await glob(join(ROOT, 'docs/BRD_*.md'));
  if (brdFiles.length === 0) {
    results.push({
      name: 'brd-counts',
      status: PHASE === 0 ? 'warn' : 'fail',
      message: 'BRD file not found',
    });
  } else {
    const brdContent = readFileSync(brdFiles[0], 'utf-8');
    
    // Count epics: ### Epic N: pattern
    const epicMatches = brdContent.match(/^### Epic \d+:/gm) || [];
    const epicCount = epicMatches.length;
    
    // Count stories: #### Story N.M: pattern  
    const storyMatches = brdContent.match(/^#### Story \d+\.\d+:/gm) || [];
    const storyCount = storyMatches.length;
    
    // Count ACs: - ACN: (list style) or | AC-X.Y.Z | (table style)
    const listAcMatches = brdContent.match(/^- AC\d+:/gm) || [];
    const tableAcMatches = brdContent.match(/\| AC-\d+\.\d+\.\d+ \|/g) || [];
    const acCount = listAcMatches.length + tableAcMatches.length;
    
    const epicPass = epicCount === INVARIANTS.epics;
    const storyPass = storyCount === INVARIANTS.stories;
    const acPass = acCount === INVARIANTS.acceptanceCriteria;
    
    if (epicPass && storyPass && acPass) {
      results.push({
        name: 'brd-counts',
        status: 'pass',
        message: `${epicCount}/${storyCount}/${acCount} (matches expected)`,
        details: { epics: epicCount, stories: storyCount, acs: acCount },
      });
    } else {
      results.push({
        name: 'brd-counts',
        status: PHASE === 0 ? 'warn' : 'fail',
        message: `Mismatch: got ${epicCount}/${storyCount}/${acCount}, expected ${INVARIANTS.epics}/${INVARIANTS.stories}/${INVARIANTS.acceptanceCriteria}`,
        details: { 
          actual: { epics: epicCount, stories: storyCount, acs: acCount },
          expected: { epics: INVARIANTS.epics, stories: INVARIANTS.stories, acs: INVARIANTS.acceptanceCriteria },
        },
      });
    }
  }
  
  // UTG entity/relationship counts - parse from UTG Schema
  const utgFiles = await glob(join(ROOT, 'docs/UNIFIED_TRACEABILITY_GRAPH_SCHEMA_*.md'));
  if (utgFiles.length === 0) {
    results.push({
      name: 'utg-counts',
      status: PHASE === 0 ? 'warn' : 'fail',
      message: 'UTG Schema file not found',
    });
  } else {
    const utgContent = readFileSync(utgFiles[0], 'utf-8');
    
    // Count entities: | E## | pattern in entity tables
    const entityMatches = utgContent.match(/\| E\d+ \|/g) || [];
    const entityCount = new Set(entityMatches).size; // Unique entities
    
    // Count relationships: | R## | or | R### | pattern
    const relMatches = utgContent.match(/\| R\d+ \|/g) || [];
    const relCount = new Set(relMatches).size; // Unique relationships
    
    const entityPass = entityCount === INVARIANTS.entities;
    const relPass = relCount === INVARIANTS.relationships;
    
    if (entityPass && relPass) {
      results.push({
        name: 'utg-counts',
        status: 'pass',
        message: `${entityCount} entities, ${relCount} relationships (matches expected)`,
        details: { entities: entityCount, relationships: relCount },
      });
    } else {
      results.push({
        name: 'utg-counts',
        status: PHASE === 0 ? 'warn' : 'fail',
        message: `Mismatch: got ${entityCount}/${relCount}, expected ${INVARIANTS.entities}/${INVARIANTS.relationships}`,
        details: {
          actual: { entities: entityCount, relationships: relCount },
          expected: { entities: INVARIANTS.entities, relationships: INVARIANTS.relationships },
        },
      });
    }
  }
  
  // Gate count - parse from Verification Spec
  const verFiles = await glob(join(ROOT, 'docs/UNIFIED_VERIFICATION_SPECIFICATION_*.md'));
  if (verFiles.length === 0) {
    results.push({
      name: 'gate-count',
      status: PHASE === 0 ? 'warn' : 'fail',
      message: 'Verification Spec file not found',
    });
  } else {
    const verContent = readFileSync(verFiles[0], 'utf-8');
    
    // Count gates: | G-XXXX | pattern
    const gateMatches = verContent.match(/\| G-[A-Z]+ \|/g) || [];
    const gateCount = new Set(gateMatches).size; // Unique gates
    
    if (gateCount === INVARIANTS.gates) {
      results.push({
        name: 'gate-count',
        status: 'pass',
        message: `${gateCount} gates (matches expected)`,
        details: { gates: gateCount },
      });
    } else {
      results.push({
        name: 'gate-count',
        status: PHASE === 0 ? 'warn' : 'fail',
        message: `Mismatch: got ${gateCount}, expected ${INVARIANTS.gates}`,
        details: { actual: gateCount, expected: INVARIANTS.gates },
      });
    }
  }
  
  return results;
}

// --- Main ---

async function main() {
  console.log(`\n[PHASE ${PHASE}] Organ Parity Verification`);
  console.log('='.repeat(45));
  console.log('');
  
  const allResults: CheckResult[] = [];
  
  // Run all checks
  console.log('Checking end-marker parity...');
  allResults.push(...await checkEndMarkerParity());
  
  console.log('Checking for forward version references...');
  allResults.push(...await checkForwardVersionRefs());
  
  console.log('Checking story card version references...');
  allResults.push(...await checkStoryCardVersions());
  
  console.log('Checking invariant counts...');
  allResults.push(...await checkInvariantCounts());
  
  console.log('');
  console.log('Results:');
  console.log('-'.repeat(45));
  
  // Group by status
  const passes = allResults.filter(r => r.status === 'pass');
  const warns = allResults.filter(r => r.status === 'warn');
  const fails = allResults.filter(r => r.status === 'fail');
  
  // Print failures first
  for (const result of fails) {
    console.log(`\nFAIL: ${result.name}`);
    if (result.file) console.log(`  File: ${result.file}`);
    console.log(`  ${result.message}`);
    if (result.details) {
      console.log(`  Details: ${JSON.stringify(result.details)}`);
    }
  }
  
  // Print warnings
  for (const result of warns) {
    console.log(`\nWARN: ${result.name}`);
    if (result.file) console.log(`  File: ${result.file}`);
    console.log(`  ${result.message}`);
    if (result.details) {
      console.log(`  Details: ${JSON.stringify(result.details)}`);
    }
  }
  
  // Print passes (summary only)
  console.log(`\nPASS: ${passes.length} checks passed`);
  for (const result of passes) {
    console.log(`  - ${result.name}: ${result.message}`);
  }
  
  // Summary
  console.log('');
  console.log('='.repeat(45));
  console.log(`Summary: ${passes.length} pass, ${warns.length} warn, ${fails.length} fail`);
  
  if (PHASE === 0) {
    console.log(`Exit: 0 (Phase 0 = warnings only)`);
    if (warns.length > 0) {
      console.log(`\nNote: ${warns.length} warnings detected. These will become failures in Phase 1+.`);
    }
    process.exit(0);
  } else {
    if (fails.length > 0) {
      console.log(`Exit: 1 (Phase ${PHASE} = failures block)`);
      process.exit(1);
    } else {
      console.log(`Exit: 0 (all checks passed)`);
      process.exit(0);
    }
  }
}

main().catch(err => {
  console.error('Error running parity verification:', err);
  process.exit(1);
});
