// test/graph/provenance.test.ts
// Unit tests for provenance mapping (ORGAN-DERIVED from UTG Appendix B)

import { describe, it, expect } from 'vitest';
import {
  getProvenance,
  matchesProvenance,
  RELATIONSHIP_PROVENANCE,
  VALID_PROVENANCE_CATEGORIES,
  type ProvenanceCategory,
} from '../../src/api/v1/relationships.js';

describe('Provenance Mapping', () => {
  describe('VALID_PROVENANCE_CATEGORIES', () => {
    it('contains exactly 5 categories', () => {
      expect(VALID_PROVENANCE_CATEGORIES).toHaveLength(5);
      expect(VALID_PROVENANCE_CATEGORIES).toContain('explicit');
      expect(VALID_PROVENANCE_CATEGORIES).toContain('structural');
      expect(VALID_PROVENANCE_CATEGORIES).toContain('inferred');
      expect(VALID_PROVENANCE_CATEGORIES).toContain('hypothesized');
      expect(VALID_PROVENANCE_CATEGORIES).toContain('speculative');
    });
  });

  describe('RELATIONSHIP_PROVENANCE mapping', () => {
    it('contains R01-R112 (no R113/R114 — dormant)', () => {
      // Verify some key mappings from UTG Appendix B
      expect(RELATIONSHIP_PROVENANCE.R01).toBe('explicit');
      expect(RELATIONSHIP_PROVENANCE.R04).toBe('structural');
      expect(RELATIONSHIP_PROVENANCE.R13).toBe('inferred');
      expect(RELATIONSHIP_PROVENANCE.R73).toBe('hypothesized');
      expect(RELATIONSHIP_PROVENANCE.R112).toBe('structural');

      // R113/R114 should NOT be in mapping (DORMANT only)
      expect(RELATIONSHIP_PROVENANCE.R113).toBeUndefined();
      expect(RELATIONSHIP_PROVENANCE.R114).toBeUndefined();
    });

    it('maps Track A relationships correctly', () => {
      // Track A core relationships
      expect(RELATIONSHIP_PROVENANCE.R18).toBe('explicit'); // IMPLEMENTS
      expect(RELATIONSHIP_PROVENANCE.R19).toBe('explicit'); // SATISFIES
      expect(RELATIONSHIP_PROVENANCE.R21).toBe('structural'); // IMPORTS
      expect(RELATIONSHIP_PROVENANCE.R22).toBe('structural'); // CALLS
      expect(RELATIONSHIP_PROVENANCE.R36).toBe('explicit'); // TESTED_BY
      expect(RELATIONSHIP_PROVENANCE.R37).toBe('explicit'); // VERIFIED_BY
    });
  });

  describe('getProvenance', () => {
    it('returns correct category for known R-codes', () => {
      expect(getProvenance('R01')).toBe('explicit');
      expect(getProvenance('R04')).toBe('structural');
      expect(getProvenance('R28')).toBe('inferred');
      expect(getProvenance('R73')).toBe('hypothesized');
    });

    it('returns undefined for unknown R-codes', () => {
      expect(getProvenance('R999')).toBeUndefined();
      expect(getProvenance('R113')).toBeUndefined(); // DORMANT
      expect(getProvenance('R114')).toBeUndefined(); // DORMANT
      expect(getProvenance('INVALID')).toBeUndefined();
      expect(getProvenance('')).toBeUndefined();
    });
  });

  describe('matchesProvenance', () => {
    it('returns true when R-code category is in allowed list', () => {
      expect(matchesProvenance('R01', ['explicit'])).toBe(true);
      expect(matchesProvenance('R04', ['structural'])).toBe(true);
      expect(matchesProvenance('R01', ['explicit', 'structural'])).toBe(true);
    });

    it('returns false when R-code category is NOT in allowed list', () => {
      expect(matchesProvenance('R01', ['structural'])).toBe(false);
      expect(matchesProvenance('R04', ['explicit'])).toBe(false);
    });

    it('returns false for unknown R-codes (treats as excluded)', () => {
      expect(matchesProvenance('R113', ['explicit'])).toBe(false);
      expect(matchesProvenance('R114', ['structural'])).toBe(false);
      expect(matchesProvenance('UNKNOWN', ['explicit', 'structural'])).toBe(false);
    });

    it('returns false for empty allowed list', () => {
      expect(matchesProvenance('R01', [])).toBe(false);
    });
  });
});

