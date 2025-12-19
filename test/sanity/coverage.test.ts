// @implements INFRASTRUCTURE
// SANITY tests: COVERAGE category (SANITY-030 to SANITY-033)
// Track A - coverage validation (records values, does not enforce thresholds)
// Authority: ENTRY.md:65, EXIT.md:121, A3_MARKER_EXTRACTION.md:44

import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { getEntityCounts, queryEntities, getAllEntities } from '../../src/api/v1/entities.js';
import type { EntityTypeCode } from '../../src/schema/track-a/entities.js';

// Get project ID from environment (set by extraction run)
const PROJECT_ID = process.env.PROJECT_ID;

// Marker patterns per ENTRY.md §Instance ID Patterns
const IMPLEMENTS_PATTERN = /@implements\s+(STORY-\d+\.\d+)/g;
const SATISFIES_PATTERN = /@satisfies\s+(AC-\d+\.\d+\.\d+)/g;

// Directories to scan for markers
const SCAN_DIRECTORIES = ['src', 'scripts', 'test'];
const SCAN_EXTENSIONS = '{ts,tsx,js,mjs,cjs}';
const EXCLUDE_PATTERNS = ['**/node_modules/**', '**/dist/**', '**/build/**'];

interface CoverageStats {
  storiesWithImplements: Set<string>;
  acsWithSatisfies: Set<string>;
  totalStories: number;
  totalACs: number;
}

/**
 * Extract coverage statistics from markers and entities.
 */
async function computeCoverageStats(): Promise<CoverageStats> {
  const stats: CoverageStats = {
    storiesWithImplements: new Set(),
    acsWithSatisfies: new Set(),
    totalStories: 0,
    totalACs: 0,
  };

  // Extract markers from codebase
  const repoRoot = process.cwd();

  for (const dir of SCAN_DIRECTORIES) {
    const dirPath = path.join(repoRoot, dir);
    if (!fs.existsSync(dirPath)) continue;

    const files = await glob(`${dir}/**/*.${SCAN_EXTENSIONS}`, {
      cwd: repoRoot,
      ignore: EXCLUDE_PATTERNS,
      absolute: true,
    });

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');

      // Find @implements markers
      IMPLEMENTS_PATTERN.lastIndex = 0;
      let match;
      while ((match = IMPLEMENTS_PATTERN.exec(content)) !== null) {
        stats.storiesWithImplements.add(match[1]);
      }

      // Find @satisfies markers
      SATISFIES_PATTERN.lastIndex = 0;
      while ((match = SATISFIES_PATTERN.exec(content)) !== null) {
        stats.acsWithSatisfies.add(match[1]);
      }
    }
  }

  // Get entity counts from API
  if (PROJECT_ID) {
    const counts = await getEntityCounts(PROJECT_ID);
    stats.totalStories = counts['E02' as EntityTypeCode] ?? 0;
    stats.totalACs = counts['E03' as EntityTypeCode] ?? 0;
  }

  return stats;
}

describe('COVERAGE (Track A)', () => {
  let stats: CoverageStats;

  beforeAll(async () => {
    stats = await computeCoverageStats();
    if (!PROJECT_ID) {
      console.warn('[SANITY-03x] PROJECT_ID not set - coverage tests will use marker-only assertions');
    }
  });

  // SANITY-030: Requirements coverage recorded
  // Authority: ENTRY.md:65 "All SANITY-030 to 033 tests pass (Markers)"
  it('SANITY-030: Requirements Coverage (Track A)', async () => {
    const storiesWithMarkers = stats.storiesWithImplements.size;
    
    // Track A records value, does not enforce threshold
    if (PROJECT_ID && stats.totalStories > 0) {
      const coverage = (storiesWithMarkers / stats.totalStories) * 100;
      console.log(`[SANITY-030] Requirements coverage: ${coverage.toFixed(1)}% (${storiesWithMarkers}/${stats.totalStories} stories with @implements)`);
    } else {
      console.log(`[SANITY-030] Requirements coverage: ${storiesWithMarkers} stories with @implements markers`);
    }

    // At least some stories should have @implements markers
    expect(storiesWithMarkers).toBeGreaterThan(0);
  });

  // SANITY-031: Test coverage recorded
  // Authority: ENTRY.md:65 "All SANITY-030 to 033 tests pass (Markers)"
  it('SANITY-031: Test Coverage (Track A)', async () => {
    if (!PROJECT_ID) {
      // Fallback: verify test files exist
      const repoRoot = process.cwd();
      const testFiles = await glob('test/**/*.test.ts', {
        cwd: repoRoot,
        ignore: EXCLUDE_PATTERNS,
        absolute: true,
      });
      expect(testFiles.length).toBeGreaterThan(0);
      console.log(`[SANITY-031] Test coverage: ${testFiles.length} test files found`);
      return;
    }

    // Count test entities
    const counts = await getEntityCounts(PROJECT_ID);
    const testCases = counts['E29' as EntityTypeCode] ?? 0;
    const testSuites = counts['E28' as EntityTypeCode] ?? 0;
    const testFiles = counts['E27' as EntityTypeCode] ?? 0;

    console.log(`[SANITY-031] Test coverage: ${testCases} test cases, ${testSuites} suites, ${testFiles} files`);

    // Some tests should exist
    expect(testCases).toBeGreaterThan(0);
  });

  // SANITY-032: Implementation coverage recorded
  // Authority: ENTRY.md:65 "All SANITY-030 to 033 tests pass (Markers)"
  it('SANITY-032: Implementation Coverage (Track A)', async () => {
    const acsWithMarkers = stats.acsWithSatisfies.size;

    // Track A records value, does not enforce threshold
    if (PROJECT_ID && stats.totalACs > 0) {
      const coverage = (acsWithMarkers / stats.totalACs) * 100;
      console.log(`[SANITY-032] Implementation coverage: ${coverage.toFixed(1)}% (${acsWithMarkers}/${stats.totalACs} ACs with @satisfies)`);
    } else {
      console.log(`[SANITY-032] Implementation coverage: ${acsWithMarkers} ACs with @satisfies markers`);
    }

    // Some ACs should have @satisfies markers (at least 1)
    expect(acsWithMarkers).toBeGreaterThanOrEqual(1);
  });

  // SANITY-033: Traceability coverage recorded (end-to-end paths)
  // Authority: ENTRY.md:65 "All SANITY-030 to 033 tests pass (Markers)"
  it('SANITY-033: Traceability Coverage (Track A)', async () => {
    if (!PROJECT_ID) {
      // Fallback: verify markers create traceability chain
      const hasImplements = stats.storiesWithImplements.size > 0;
      const hasSatisfies = stats.acsWithSatisfies.size > 0;
      
      console.log(`[SANITY-033] Traceability: @implements=${hasImplements}, @satisfies=${hasSatisfies}`);
      expect(hasImplements || hasSatisfies).toBe(true);
      return;
    }

    // Check for basic traceability path components
    const counts = await getEntityCounts(PROJECT_ID);
    
    const hasEpics = (counts['E01' as EntityTypeCode] ?? 0) > 0;
    const hasStories = (counts['E02' as EntityTypeCode] ?? 0) > 0;
    const hasACs = (counts['E03' as EntityTypeCode] ?? 0) > 0;
    const hasFunctions = (counts['E12' as EntityTypeCode] ?? 0) > 0;
    const hasTestCases = (counts['E29' as EntityTypeCode] ?? 0) > 0;

    // All path components must exist for traceability
    const pathExists = hasEpics && hasStories && hasACs && hasFunctions && hasTestCases;
    
    console.log(`[SANITY-033] Traceability path components: Epic=${hasEpics}, Story=${hasStories}, AC=${hasACs}, Function=${hasFunctions}, TestCase=${hasTestCases}`);
    
    // At least have the basic requirements path
    expect(hasEpics && hasStories && hasACs).toBe(true);
    
    // Record full path status
    if (pathExists) {
      console.log(`[SANITY-033] Full traceability path (Epic→Story→AC→Function→TestCase) exists`);
    }
  });
});

