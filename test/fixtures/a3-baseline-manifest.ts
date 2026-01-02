// test/fixtures/a3-baseline-manifest.ts
// @implements STORY-64.3
//
// A3 Baseline Manifest - Frozen counts for deterministic verification.
// Tests MUST fail if actual counts differ from manifest.
//
// To regenerate:
// 1. Run: npm run a3:extract (or equivalent)
// 2. Run: npm run a3:evidence
// 3. Update counts below
// 4. Update SHA to current HEAD

/**
 * A3 Baseline Manifest
 * 
 * Frozen at a specific git SHA with exact expected counts.
 * Tests that verify counts MUST use these values.
 */
export const A3_BASELINE = {
  // Git SHA at which these counts were frozen
  sha: '5bb937dc9cc7e281e201eb2cf09974f7843a68ab',
  
  // When the manifest was frozen
  frozen_at: '2025-12-31',
  
  // Project ID for which counts are valid
  project_id: '6df2f456-440d-4958-b475-d9808775ff69',
  
  // A4 NOTE: Counts updated to include A4 pipeline modules with @implements STORY-64.4
  // and test files with @satisfies markers. This is expected growth, not drift.
  
  // Exact frozen counts - tests MUST assert equality
  counts: {
    // Marker extraction results
    total_markers_extracted: 133, // Total @implements + @satisfies + @tdd markers (A4 adds pipeline files)
    orphan_markers: 0,            // Markers with no valid target entity (0 after A1 refresh)
    
    // Relationship counts (from PostgreSQL)
    R18: 55,  // IMPLEMENTS relationships (A4/A5 adds pipeline, graph-service, traversal-service, http routes)
    R19: 46,  // SATISFIES relationships (A4/A5 adds entity-service, relationship-service, integration test, A5 API markers)
    R36: 1,   // TESTED_BY relationships (from describe('STORY-XX.YY'))
    R37: 6,   // VERIFIED_BY relationships (from it('AC-XX.YY.ZZ'), A4 adds pipeline tests)
  },
  
  // Semantic signal counts by type
  signals: {
    ORPHAN_MARKER: 0,        // True orphans (0 after A1 refresh)
    TDD_COHERENCE_MISMATCH: 0,  // TDD markers pointing to non-E06 entities
  },
} as const;

/**
 * Validate that current git SHA matches the manifest.
 * Used in tests to ensure reproducibility.
 */
export function validateManifestSha(currentSha: string): void {
  if (!currentSha.startsWith(A3_BASELINE.sha.substring(0, 7))) {
    console.warn(
      `WARNING: Current SHA (${currentSha.substring(0, 7)}) differs from manifest SHA (${A3_BASELINE.sha.substring(0, 7)}). ` +
      `Counts may not match. Regenerate manifest if extraction logic changed.`
    );
  }
}

/**
 * Get expected count for a relationship type.
 * Throws if type is not in manifest.
 */
export function getExpectedCount(
  type: 'R18' | 'R19' | 'R36' | 'R37'
): number {
  return A3_BASELINE.counts[type];
}

