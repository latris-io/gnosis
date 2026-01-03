// @implements INFRASTRUCTURE
// SANITY test suite runner - main entry point
// Supports filtering by category and individual test

export type SanityCategory = 'ONTOLOGY' | 'INTEGRITY' | 'MARKER' | 'COVERAGE' | 'EXTRACTION' | 'BRD';

export interface SanityTestResult {
  id: string;
  category: SanityCategory;
  passed: boolean;
  message: string;
  duration: number;
}

/**
 * SANITY test categories and their ID ranges.
 * Per Verification Spec V20.6.4 §Part II
 */
export const SANITY_CATEGORIES: Record<SanityCategory, { start: number; end: number; description: string }> = {
  ONTOLOGY: { start: 1, end: 5, description: 'Entity types, relationships, ID formats' },
  INTEGRITY: { start: 10, end: 16, description: 'DB schema, FK, duplicates, hashes, graph connected, canonical docs' },
  MARKER: { start: 20, end: 24, description: 'Marker parsing (Track A)' },
  COVERAGE: { start: 30, end: 33, description: 'Coverage validation (Track A)' },
  EXTRACTION: { start: 40, end: 44, description: 'Extraction validation (Track A)' },
  BRD: { start: 55, end: 57, description: 'BRD counts and ID validation' },
};

/**
 * Get category for a SANITY test ID.
 */
export function getCategoryForTest(testId: number): SanityCategory | null {
  for (const [category, range] of Object.entries(SANITY_CATEGORIES)) {
    if (testId >= range.start && testId <= range.end) {
      return category as SanityCategory;
    }
  }
  return null;
}

/**
 * Format SANITY test ID with leading zeros.
 * e.g., 1 -> "SANITY-001"
 */
export function formatTestId(testId: number): string {
  return `SANITY-${testId.toString().padStart(3, '0')}`;
}

// Note: Actual test implementations are in category-specific files:
// - test/sanity/ontology.test.ts (SANITY-001 to SANITY-005)
// - test/sanity/integrity.test.ts (SANITY-010 to SANITY-016)
// - test/sanity/markers.test.ts (SANITY-020 to SANITY-023, SANITY-034) - Track A
// - test/sanity/coverage.test.ts (SANITY-030 to SANITY-033) - Track A
// - test/sanity/extraction.test.ts (SANITY-040 to SANITY-044) - Track A
// - test/sanity/brd.test.ts (SANITY-055 to SANITY-057)


