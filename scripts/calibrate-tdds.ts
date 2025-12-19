#!/usr/bin/env npx tsx
// scripts/calibrate-tdds.ts
// @implements STORY-64.2
// TDD Calibration Script - Mandatory CI Check
//
// Validates (6 checks):
// 1. E02_STORY_REFS: All addresses.stories[] resolve to E02 entities
// 2. E03_AC_REFS: All addresses.acceptance_criteria[] resolve to E03 entities
// 3. E08_SCHEMA_REFS: All addresses.schemas[] resolve to E08 entities (or seeds them)
// 4. E11_FILE_REFS: All implements.files[] resolve to E11 entities (using DERIVED instance_id)
// 5. TDD_MARKER_MATCH: implements.files[] ↔ @tdd markers match
// 6. TDD_STORY_COHERENCE: files in implements[] must have @implements STORY-* for this TDD's stories
//
// Exit: 0 if all pass, 1 if any fail

import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { rlsQuery } from '../test/utils/rls.js';
import { discoverTDDs, parseFrontmatter, ParsedFrontmatter } from '../src/extraction/providers/tdd-frontmatter-provider.js';
import { computeExpectedCounts } from '../src/extraction/providers/tdd-relationship-provider.js';
import { persistEntities } from '../src/ops/track-a.js';
import { shadowLedger } from '../src/ledger/shadow-ledger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SPEC_DIR = path.join(ROOT, 'spec');

// ============================================================
// CONFIGURATION
// ============================================================

interface CalibrationConfig {
  projectId: string;
  seedE08: boolean;      // Whether to seed missing E08 entities
  strictMarkers: boolean; // Whether @tdd marker mismatches are errors vs warnings
}

function getConfig(): CalibrationConfig {
  const projectId = process.env.PROJECT_ID;
  if (!projectId) {
    console.error('ERROR: PROJECT_ID environment variable is required');
    process.exit(1);
  }
  
  return {
    projectId,
    seedE08: process.env.SEED_E08 === 'true',
    strictMarkers: process.env.STRICT_MARKERS === 'true',
  };
}

// ============================================================
// VALIDATION CHECKS
// ============================================================

interface ValidationResult {
  check: string;
  passed: boolean;
  warnings: string[];
  errors: string[];
}

async function validateE02References(
  projectId: string,
  frontmatter: ParsedFrontmatter
): Promise<ValidationResult> {
  const result: ValidationResult = {
    check: 'E02_STORY_REFS',
    passed: true,
    warnings: [],
    errors: [],
  };
  
  for (const entry of frontmatter.addresses.stories) {
    const rows = await rlsQuery(projectId, `
      SELECT instance_id FROM entities 
      WHERE entity_type = 'E02' AND instance_id = $1
    `, [entry.value]);
    
    if (rows.length === 0) {
      result.passed = false;
      result.errors.push(`Story ${entry.value} not found in E02 entities`);
    }
  }
  
  return result;
}

async function validateE03References(
  projectId: string,
  frontmatter: ParsedFrontmatter
): Promise<ValidationResult> {
  const result: ValidationResult = {
    check: 'E03_AC_REFS',
    passed: true,
    warnings: [],
    errors: [],
  };
  
  for (const entry of frontmatter.addresses.acceptance_criteria) {
    const rows = await rlsQuery(projectId, `
      SELECT instance_id FROM entities 
      WHERE entity_type = 'E03' AND instance_id = $1
    `, [entry.value]);
    
    if (rows.length === 0) {
      result.passed = false;
      result.errors.push(`AC ${entry.value} not found in E03 entities`);
    }
  }
  
  return result;
}

async function validateE08References(
  projectId: string,
  frontmatter: ParsedFrontmatter,
  seedEnabled: boolean
): Promise<ValidationResult> {
  const result: ValidationResult = {
    check: 'E08_SCHEMA_REFS',
    passed: true,
    warnings: [],
    errors: [],
  };
  
  for (const entry of frontmatter.addresses.schemas) {
    const rows = await rlsQuery(projectId, `
      SELECT instance_id FROM entities 
      WHERE entity_type = 'E08' AND instance_id = $1
    `, [entry.value]);
    
    if (rows.length === 0) {
      if (seedEnabled) {
        // Seed the E08 entity
        try {
          const seedEntity = {
            entity_type: 'E08' as const,
            instance_id: entry.value,
            name: entry.value.replace('SCHEMA-', ''),
            attributes: {
              seeded_from: 'tdd-frontmatter',
              requires_implementation: true,
              provisional: true,
            },
            source_file: frontmatter.meta.source_file,
            line_start: entry.line,
            line_end: entry.line,
          };
          
          await persistEntities(projectId, [seedEntity]);
          
          // Log to shadow ledger
          await shadowLedger.append({
            operation: 'E08_SEED',
            entity_type: 'E08',
            entity_id: 'seeded',
            instance_id: entry.value,
            project_id: projectId,
            content_hash: 'seeded',
            evidence: {
              source_file: frontmatter.meta.source_file,
              line_start: entry.line,
              line_end: entry.line,
              commit_sha: 'n/a',
              extraction_timestamp: new Date().toISOString(),
              extractor_version: '1.0.0',
            },
          });
          
          result.warnings.push(`Schema ${entry.value} seeded (provisional)`);
        } catch (err) {
          result.passed = false;
          result.errors.push(`Failed to seed schema ${entry.value}: ${err}`);
        }
      } else {
        result.passed = false;
        result.errors.push(`Schema ${entry.value} not found in E08 entities (enable SEED_E08=true to auto-seed)`);
      }
    }
  }
  
  return result;
}

async function deriveE11InstanceId(
  projectId: string, 
  filePath: string
): Promise<string | null> {
  // Query the database to find how this path is stored
  const rows = await rlsQuery(projectId, `
    SELECT instance_id FROM entities 
    WHERE entity_type = 'E11' 
    AND (
      instance_id = $1 OR
      instance_id = 'FILE-' || $1 OR
      source_file = $1
    )
    LIMIT 1
  `, [filePath]);
  
  if (rows.length > 0) {
    return rows[0].instance_id;
  }
  
  return null;
}

async function validateE11References(
  projectId: string,
  frontmatter: ParsedFrontmatter
): Promise<ValidationResult> {
  const result: ValidationResult = {
    check: 'E11_FILE_REFS',
    passed: true,
    warnings: [],
    errors: [],
  };
  
  for (const entry of frontmatter.implements.files) {
    const instanceId = await deriveE11InstanceId(projectId, entry.value);
    
    if (!instanceId) {
      result.passed = false;
      result.errors.push(`File ${entry.value} not found in E11 entities`);
    }
  }
  
  return result;
}

async function validateTDDMarkers(
  projectId: string,
  frontmatter: ParsedFrontmatter,
  strictMode: boolean
): Promise<ValidationResult> {
  const result: ValidationResult = {
    check: 'TDD_MARKER_MATCH',
    passed: true,
    warnings: [],
    errors: [],
  };
  
  const tddId = frontmatter.id;
  const TDD_PATTERN = /@tdd\s+(TDD-[\w-]+)/g;
  
  for (const entry of frontmatter.implements.files) {
    const filePath = path.join(ROOT, entry.value);
    
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const matches = [...content.matchAll(TDD_PATTERN)];
      const hasTddMarker = matches.some(m => m[1] === tddId);
      
      if (!hasTddMarker) {
        const message = `File ${entry.value} missing @tdd ${tddId} marker`;
        if (strictMode) {
          result.passed = false;
          result.errors.push(message);
        } else {
          result.warnings.push(message);
        }
      }
    } catch {
      result.warnings.push(`Could not read file ${entry.value}`);
    }
  }
  
  return result;
}

async function validateStoryCoherence(
  frontmatter: ParsedFrontmatter
): Promise<ValidationResult> {
  const result: ValidationResult = {
    check: 'TDD_STORY_COHERENCE',
    passed: true,
    warnings: [],
    errors: [],
  };
  
  // Get the stories this TDD addresses
  const tddStories = new Set(frontmatter.addresses.stories.map(s => s.value));
  if (tddStories.size === 0) {
    result.warnings.push('TDD has no stories in addresses.stories[]');
    return result;
  }
  
  // Pattern matches @implements followed by one or more comma-separated STORY-* references
  // Captures the entire list after @implements
  const IMPLEMENTS_LINE_PATTERN = /@implements\s+([^\n]+)/g;
  const STORY_PATTERN = /STORY-[\d.]+/g;
  
  for (const entry of frontmatter.implements.files) {
    const filePath = path.join(ROOT, entry.value);
    
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Find all @implements lines and extract all STORY-* references from them
      const lineMatches = [...content.matchAll(IMPLEMENTS_LINE_PATTERN)];
      const fileStories: string[] = [];
      
      for (const lineMatch of lineMatches) {
        const storiesInLine = lineMatch[1].match(STORY_PATTERN) || [];
        fileStories.push(...storiesInLine);
      }
      
      // Check if at least one of the file's @implements STORY markers
      // matches a story this TDD addresses
      const hasMatchingStory = fileStories.some(s => tddStories.has(s));
      
      if (!hasMatchingStory) {
        result.passed = false;
        result.errors.push(
          `File ${entry.value} is in implements.files[] but has no @implements marker ` +
          `matching TDD stories [${[...tddStories].join(', ')}]. ` +
          `Found markers: [${fileStories.join(', ') || 'none'}]`
        );
      }
    } catch {
      result.warnings.push(`Could not read file ${entry.value}`);
    }
  }
  
  return result;
}

// ============================================================
// CALIBRATION OUTPUT
// ============================================================

interface CalibrationSummary {
  tddId: string;
  expectedCounts: {
    r08: number;
    r09: number;
    r11: number;
    r14: number;
  };
  validationResults: ValidationResult[];
  allPassed: boolean;
  hasWarnings: boolean;
}

async function calibrateTDD(
  config: CalibrationConfig,
  frontmatter: ParsedFrontmatter
): Promise<CalibrationSummary> {
  const expectedCounts = computeExpectedCounts(frontmatter);
  
  const validationResults = await Promise.all([
    validateE02References(config.projectId, frontmatter),
    validateE03References(config.projectId, frontmatter),
    validateE08References(config.projectId, frontmatter, config.seedE08),
    validateE11References(config.projectId, frontmatter),
    validateTDDMarkers(config.projectId, frontmatter, config.strictMarkers),
    validateStoryCoherence(frontmatter),
  ]);
  
  const allPassed = validationResults.every(r => r.passed);
  const hasWarnings = validationResults.some(r => r.warnings.length > 0);
  
  return {
    tddId: frontmatter.id,
    expectedCounts,
    validationResults,
    allPassed,
    hasWarnings,
  };
}

// ============================================================
// MAIN
// ============================================================

async function main(): Promise<void> {
  console.log('=== TDD Calibration Script ===\n');
  
  const config = getConfig();
  console.log(`Project ID: ${config.projectId}`);
  console.log(`Seed E08: ${config.seedE08}`);
  console.log(`Strict Markers: ${config.strictMarkers}\n`);
  
  // Discover TDDs from story files
  const storiesDir = path.join(SPEC_DIR, 'track_a', 'stories');
  const files = await fs.readdir(storiesDir);
  
  const summaries: CalibrationSummary[] = [];
  let totalR08 = 0;
  let totalR09 = 0;
  let totalR11 = 0;
  let totalR14 = 0;
  
  for (const file of files) {
    if (!file.endsWith('.md')) continue;
    
    const filePath = path.join(storiesDir, file);
    const frontmatter = await parseFrontmatter(filePath);
    
    if (!frontmatter || !frontmatter.id) {
      console.log(`  SKIP: ${file} (no TDD frontmatter)`);
      continue;
    }
    
    console.log(`\n--- ${frontmatter.id} (${file}) ---`);
    
    const summary = await calibrateTDD(config, frontmatter);
    summaries.push(summary);
    
    // Print validation results
    for (const result of summary.validationResults) {
      const status = result.passed ? '✓' : '✗';
      console.log(`  ${status} ${result.check}`);
      
      for (const error of result.errors) {
        console.log(`    ERROR: ${error}`);
      }
      for (const warning of result.warnings) {
        console.log(`    WARN: ${warning}`);
      }
    }
    
    // Print expected counts
    console.log(`  Expected counts:`);
    console.log(`    R08 (Story→TDD): ${summary.expectedCounts.r08}`);
    console.log(`    R09 (AC→TDD): ${summary.expectedCounts.r09}`);
    console.log(`    R11 (Story→Schema): ${summary.expectedCounts.r11}`);
    console.log(`    R14 (TDD→File): ${summary.expectedCounts.r14}`);
    
    totalR08 += summary.expectedCounts.r08;
    totalR09 += summary.expectedCounts.r09;
    totalR11 += summary.expectedCounts.r11;
    totalR14 += summary.expectedCounts.r14;
  }
  
  // Print summary
  console.log('\n=== CALIBRATION SUMMARY ===\n');
  console.log(`TDDs processed: ${summaries.length}`);
  console.log(`Total expected R08: ${totalR08}`);
  console.log(`Total expected R09: ${totalR09}`);
  console.log(`Total expected R11: ${totalR11}`);
  console.log(`Total expected R14: ${totalR14}`);
  console.log(`Total TDD Bridge relationships: ${totalR08 + totalR09 + totalR11 + totalR14}`);
  
  const allPassed = summaries.every(s => s.allPassed);
  const hasWarnings = summaries.some(s => s.hasWarnings);
  
  console.log('');
  if (allPassed) {
    console.log('✓ All checks passed');
    if (hasWarnings) {
      console.log('⚠ Warnings present (review recommended)');
    }
    process.exit(0);
  } else {
    console.log('✗ Some checks failed');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});

