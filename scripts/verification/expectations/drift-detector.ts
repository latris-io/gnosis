/**
 * Drift Detector
 * 
 * Detects divergence between:
 * 1. Organ docs (EXIT.md) - SOLE AUTHORITY
 * 2. Expectations file (track-a-expectations.ts)
 * 3. Track A story specs (A1-A5*.md)
 * 
 * DEFAULT: UNKNOWN = FAIL
 * Primacy Enforcement: Track docs cannot claim scope beyond organ docs.
 * 
 * @implements STORY-64.1 (Verification infrastructure)
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import {
  ENTITY_EXPECTATIONS,
  RELATIONSHIP_EXPECTATIONS,
  POST_HGR1_RELATIONSHIPS,
  OUT_OF_SCOPE_RELATIONSHIPS,
  EntityTypeCode,
  RelationshipTypeCode,
} from './track-a-expectations';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface OrganScope {
  entities: string[];
  relationships: string[];
}

interface ParseError {
  error: string;
}

interface StoryScope {
  filename: string;
  entities: string[];
  activeRelationships: string[];
  deferredRelationships: string[];
  internalLinkages: string[];
  outOfScope: string[];
}

interface DriftReport {
  // Sources (read-only)
  organDocPath: string;            // SOLE AUTHORITY: EXIT.md
  expectationsFile: string;        // Must mirror organ docs exactly
  storySpecs: string[];            // Execution guidance only (not authoritative)
  
  // Results
  parseFailures: string[];         // Files that couldn't be parsed - HARD FAIL
  matches: boolean;
  
  // Primacy violations (any of these = HARD FAIL)
  primacyViolations: {
    expectationsExceedOrgan: string[];  // Items in expectations NOT in organ docs
    storiesExceedOrgan: string[];       // Items claimed by stories NOT in organ docs
  };
  
  // Coverage gaps (organ scope not fully represented)
  coverageGaps: {
    organNotInExpectations: string[];   // Organ-defined items missing from expectations
    organNotCoveredByStories: string[]; // Organ-defined items with no story coverage
  };
}

// -----------------------------------------------------------------------------
// Paths
// -----------------------------------------------------------------------------

const WORKSPACE_ROOT = process.cwd();
const EXIT_MD_PATH = path.join(WORKSPACE_ROOT, 'spec/track_a/EXIT.md');
const STORIES_GLOB = path.join(WORKSPACE_ROOT, 'spec/track_a/stories/A*.md');

// -----------------------------------------------------------------------------
// Organ Doc Parser (EXIT.md - THE AUTHORITY)
// -----------------------------------------------------------------------------

/**
 * Parse EXIT.md canonical tables.
 * This is the SOLE AUTHORITY for Track A scope.
 * 
 * Canonical count: 20 relationships (R08/R09/R11 internal, R24 Post-Track-A)
 */
function parseExitMd(content: string): OrganScope | ParseError {
  // Parse "## Entity Verification" or similar table: | E## | ... |
  const entityMatches = content.match(/\| E\d{2} \|/g);
  
  // Parse "## Relationship Verification" table: | R## | ... |
  const relMatches = content.match(/\| R\d{2} \|/g);
  
  if (!entityMatches) {
    return { error: 'Cannot parse EXIT.md: missing entity table (expected | E## | patterns)' };
  }
  
  if (!relMatches) {
    return { error: 'Cannot parse EXIT.md: missing relationship table (expected | R## | patterns)' };
  }
  
  const entities = [...new Set(entityMatches.map(m => m.match(/E\d{2}/)?.[0]).filter(Boolean))] as string[];
  const relationships = [...new Set(relMatches.map(m => m.match(/R\d{2}/)?.[0]).filter(Boolean))] as string[];
  
  // Filter out internal linkages and out-of-scope from relationship count
  const canonicalRelationships = relationships.filter(r => 
    !POST_HGR1_RELATIONSHIPS.includes(r as any) && 
    !OUT_OF_SCOPE_RELATIONSHIPS.includes(r as any)
  );
  
  // Validate: should be exactly 20 (R08/R09/R11 internal, R24 Post-Track-A)
  if (canonicalRelationships.length !== 20) {
    return { 
      error: `EXIT.md relationship count mismatch: expected 20, found ${canonicalRelationships.length}. ` +
             `Found: ${canonicalRelationships.join(', ')}`
    };
  }
  
  return {
    entities,
    relationships: canonicalRelationships,
  };
}

// -----------------------------------------------------------------------------
// Story Spec Parser
// -----------------------------------------------------------------------------

/**
 * Parse story spec machine-readable scope block (phase-aware).
 * 
 * Required patterns:
 * - <!-- @scope-entities: E01,E02,... -->
 * - <!-- @scope-relationships-active: R01,R02,... -->
 * - <!-- @scope-relationships-deferred: R18,R19,... -->
 * 
 * Optional patterns:
 * - <!-- @internal-linkages: R08,R09,R11 -->
 * - <!-- @out-of-scope: R24 -->
 */
function parseStoryScope(content: string, filename: string): StoryScope | ParseError {
  // More flexible regex that captures any content between the markers
  const entityMatch = content.match(/<!-- @scope-entities:\s*([^>]*?)\s*-->/);
  const activeMatch = content.match(/<!-- @scope-relationships-active:\s*([^>]*?)\s*-->/);
  const deferredMatch = content.match(/<!-- @scope-relationships-deferred:\s*([^>]*?)\s*-->/);
  const internalMatch = content.match(/<!-- @internal-linkages:\s*([^>]*?)\s*-->/);
  const outOfScopeMatch = content.match(/<!-- @out-of-scope:\s*([^>]*?)\s*-->/);
  
  if (!entityMatch || !activeMatch || !deferredMatch) {
    return { 
      error: `Cannot parse scope from ${filename}. ` +
             `Missing required @scope-entities, @scope-relationships-active, ` +
             `or @scope-relationships-deferred comment block.`
    };
  }
  
  const parseList = (match: RegExpMatchArray | null): string[] => {
    if (!match || !match[1]) return [];
    // Split by comma and filter out empty strings
    return match[1].split(',').map(s => s.trim()).filter(Boolean);
  };
  
  return {
    filename,
    entities: parseList(entityMatch),
    activeRelationships: parseList(activeMatch),
    deferredRelationships: parseList(deferredMatch),
    internalLinkages: parseList(internalMatch),
    outOfScope: parseList(outOfScopeMatch),
  };
}

// -----------------------------------------------------------------------------
// Expectations Parser
// -----------------------------------------------------------------------------

function getExpectationsScope(): { entities: string[]; relationships: string[] } {
  return {
    entities: ENTITY_EXPECTATIONS.map(e => e.code),
    relationships: RELATIONSHIP_EXPECTATIONS.map(r => r.code),
  };
}

// -----------------------------------------------------------------------------
// Drift Detection Logic
// -----------------------------------------------------------------------------

/**
 * Run drift detection.
 * 
 * ENFORCEMENT LOGIC:
 * 1. Parse organ docs (EXIT.md) → get AUTHORITATIVE scope
 * 2. Parse expectations file → must be SUBSET OR EQUAL to organ scope
 * 3. Parse story specs → claims must be SUBSET OR EQUAL to organ scope
 * 4. If any Track doc claims scope BEYOND organ docs → PRIMACY_VIOLATION → HARD FAIL
 * 5. If organ scope not fully covered by expectations → COVERAGE_GAP → HARD FAIL
 */
export async function detectDrift(): Promise<DriftReport> {
  const report: DriftReport = {
    organDocPath: EXIT_MD_PATH,
    expectationsFile: 'track-a-expectations.ts',
    storySpecs: [],
    parseFailures: [],
    matches: true,
    primacyViolations: {
      expectationsExceedOrgan: [],
      storiesExceedOrgan: [],
    },
    coverageGaps: {
      organNotInExpectations: [],
      organNotCoveredByStories: [],
    },
  };
  
  // Step 1: Parse organ docs (EXIT.md)
  let organScope: OrganScope;
  
  try {
    const exitContent = fs.readFileSync(EXIT_MD_PATH, 'utf-8');
    const parseResult = parseExitMd(exitContent);
    
    if ('error' in parseResult) {
      report.parseFailures.push(`EXIT.md: ${parseResult.error}`);
      report.matches = false;
      return report;
    }
    
    organScope = parseResult;
  } catch (err) {
    report.parseFailures.push(`EXIT.md: Could not read file - ${err}`);
    report.matches = false;
    return report;
  }
  
  // Step 2: Get expectations scope
  const expectationsScope = getExpectationsScope();
  
  // Step 3: Parse story specs
  const storyFiles = fs.readdirSync(path.join(WORKSPACE_ROOT, 'spec/track_a/stories'))
    .filter(f => f.startsWith('A') && f.endsWith('.md'));
  
  const storyScopes: StoryScope[] = [];
  
  for (const file of storyFiles) {
    const filePath = path.join(WORKSPACE_ROOT, 'spec/track_a/stories', file);
    report.storySpecs.push(file);
    
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const parseResult = parseStoryScope(content, file);
      
      if ('error' in parseResult) {
        report.parseFailures.push(parseResult.error);
        report.matches = false;
        continue;
      }
      
      storyScopes.push(parseResult);
    } catch (err) {
      report.parseFailures.push(`${file}: Could not read file - ${err}`);
      report.matches = false;
    }
  }
  
  // Step 4: Check primacy violations (expectations exceed organ)
  for (const entity of expectationsScope.entities) {
    if (!organScope.entities.includes(entity)) {
      report.primacyViolations.expectationsExceedOrgan.push(`Entity ${entity}`);
      report.matches = false;
    }
  }
  
  for (const rel of expectationsScope.relationships) {
    if (!organScope.relationships.includes(rel)) {
      report.primacyViolations.expectationsExceedOrgan.push(`Relationship ${rel}`);
      report.matches = false;
    }
  }
  
  // Step 5: Check primacy violations (stories exceed organ)
  for (const story of storyScopes) {
    // Check entities
    for (const entity of story.entities) {
      if (!organScope.entities.includes(entity)) {
        report.primacyViolations.storiesExceedOrgan.push(`${story.filename}: Entity ${entity}`);
        report.matches = false;
      }
    }
    
    // Check relationships (active + deferred should not exceed organ scope)
    const allRels = [...story.activeRelationships, ...story.deferredRelationships];
    for (const rel of allRels) {
      if (!organScope.relationships.includes(rel) && 
          !POST_HGR1_RELATIONSHIPS.includes(rel as any) &&
          !OUT_OF_SCOPE_RELATIONSHIPS.includes(rel as any)) {
        report.primacyViolations.storiesExceedOrgan.push(`${story.filename}: Relationship ${rel}`);
        report.matches = false;
      }
    }
  }
  
  // Step 6: Check coverage gaps (organ not in expectations)
  for (const entity of organScope.entities) {
    if (!expectationsScope.entities.includes(entity)) {
      report.coverageGaps.organNotInExpectations.push(`Entity ${entity}`);
      report.matches = false;
    }
  }
  
  for (const rel of organScope.relationships) {
    if (!expectationsScope.relationships.includes(rel)) {
      report.coverageGaps.organNotInExpectations.push(`Relationship ${rel}`);
      report.matches = false;
    }
  }
  
  // Step 7: Check coverage gaps (organ not covered by stories)
  const allStoryCoverage = {
    entities: new Set<string>(),
    relationships: new Set<string>(),
  };
  
  for (const story of storyScopes) {
    story.entities.forEach(e => allStoryCoverage.entities.add(e));
    story.activeRelationships.forEach(r => allStoryCoverage.relationships.add(r));
    story.deferredRelationships.forEach(r => allStoryCoverage.relationships.add(r));
  }
  
  for (const entity of organScope.entities) {
    if (!allStoryCoverage.entities.has(entity)) {
      report.coverageGaps.organNotCoveredByStories.push(`Entity ${entity}`);
      report.matches = false;
    }
  }
  
  for (const rel of organScope.relationships) {
    if (!allStoryCoverage.relationships.has(rel)) {
      report.coverageGaps.organNotCoveredByStories.push(`Relationship ${rel}`);
      report.matches = false;
    }
  }
  
  return report;
}

// -----------------------------------------------------------------------------
// CLI Entry Point
// -----------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('=== Drift Detector ===');
  console.log('Checking expectation alignment with organ docs...\n');
  
  const report = await detectDrift();
  
  // Report parse failures
  if (report.parseFailures.length > 0) {
    console.error('❌ PARSE FAILURES (HARD FAIL):');
    for (const failure of report.parseFailures) {
      console.error(`   - ${failure}`);
    }
    console.log();
  }
  
  // Report primacy violations
  if (report.primacyViolations.expectationsExceedOrgan.length > 0) {
    console.error('❌ PRIMACY VIOLATION: Expectations exceed organ scope:');
    for (const item of report.primacyViolations.expectationsExceedOrgan) {
      console.error(`   - ${item}`);
    }
    console.log();
  }
  
  if (report.primacyViolations.storiesExceedOrgan.length > 0) {
    console.error('❌ PRIMACY VIOLATION: Stories exceed organ scope:');
    for (const item of report.primacyViolations.storiesExceedOrgan) {
      console.error(`   - ${item}`);
    }
    console.log();
  }
  
  // Report coverage gaps
  if (report.coverageGaps.organNotInExpectations.length > 0) {
    console.error('❌ COVERAGE GAP: Organ items missing from expectations:');
    for (const item of report.coverageGaps.organNotInExpectations) {
      console.error(`   - ${item}`);
    }
    console.log();
  }
  
  if (report.coverageGaps.organNotCoveredByStories.length > 0) {
    console.error('❌ COVERAGE GAP: Organ items not covered by stories:');
    for (const item of report.coverageGaps.organNotCoveredByStories) {
      console.error(`   - ${item}`);
    }
    console.log();
  }
  
  // Summary
  if (report.matches) {
    console.log('✅ Drift detection PASSED');
    console.log(`   - Organ doc: ${report.organDocPath}`);
    console.log(`   - Expectations: ${report.expectationsFile}`);
    console.log(`   - Stories: ${report.storySpecs.join(', ')}`);
    process.exit(0);
  } else {
    console.error('❌ Drift detection FAILED');
    console.error('   Expectations must match organ docs exactly.');
    console.error('   Track docs cannot exceed organ scope (primacy enforcement).');
    process.exit(1);
  }
}

// Run if executed directly (ES module compatible)
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  main().catch(err => {
    console.error('Drift detector error:', err);
    process.exit(1);
  });
}

export { parseExitMd, parseStoryScope, DriftReport };

