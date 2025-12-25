/**
 * Unit tests for organ document parity parsers.
 * 
 * These tests verify that the canonical block parsing in verify-organ-parity.ts
 * correctly extracts statistics from organ documents.
 * 
 * @implements GOVERNANCE_PHASED_PLAN.md §6
 */

import { describe, it, expect } from 'vitest';

// Import parsers from the script
// Note: We're testing the parsing logic, not the full verification flow
import { parseBrdStats, parseUtgStats, parseGateCount } from '../../scripts/verify-organ-parity';

describe('Organ Parity Parsers', () => {
  
  describe('parseBrdStats', () => {
    it('should parse canonical BRD statistics table', () => {
      const fixture = `
| Metric | Count | Verification |
|--------|-------|--------------|
| **Total Epics** | 65 | Enumerated in Appendix E |
| **Total Stories** | 351 | Enumerated in Appendix A |
| **Total Acceptance Criteria** | 2,849 | Enumerated in Appendix B |
`;
      const result = parseBrdStats(fixture);
      expect(result).toEqual({
        epics: 65,
        stories: 397,
        acs: 2849,
      });
    });
    
    it('should ignore non-canonical tables (version history)', () => {
      const fixture = `
| Metric | V9.3 (Stated) | V10.0 (Verified) |
|--------|---------------|------------------|
| **Total Epics** | 64 | 64 |
| **Total Stories** | 344 | **347** |
| **Total Acceptance Criteria** | 2,843 | **2,873** |
`;
      // Should return null because no "Enumerated" marker
      const result = parseBrdStats(fixture);
      expect(result).toBeNull();
    });
    
    it('should return null for missing statistics', () => {
      const fixture = `# Some other content without stats table`;
      const result = parseBrdStats(fixture);
      expect(result).toBeNull();
    });
  });
  
  describe('parseUtgStats', () => {
    it('should parse UTG summary sentence', () => {
      const fixture = `
This specification defines 83 entities (67 base + 16 extensions) across 14 layers, connected by 114 relationships (100 base + 14 extensions) across 21 categories.
`;
      const result = parseUtgStats(fixture);
      expect(result).toEqual({
        entities: 83,
        relationships: 114,
      });
    });
    
    it('should parse UTG statistics block as fallback', () => {
      const fixture = `
- **Entities:** 67 (base) + 16 (extensions) = 83
- **Relationships:** 100 (base) + 14 (extensions) = 114
`;
      const result = parseUtgStats(fixture);
      expect(result).toEqual({
        entities: 83,
        relationships: 114,
      });
    });
    
    it('should return null for missing statistics', () => {
      const fixture = `# UTG Schema without stats`;
      const result = parseUtgStats(fixture);
      expect(result).toBeNull();
    });
  });
  
  describe('parseGateCount', () => {
    it('should parse gate count from table', () => {
      const fixture = `
| Gates Specified | 21 (20 active + 1 dormant) |
`;
      const result = parseGateCount(fixture);
      expect(result).toBe(21);
    });
    
    it('should parse gate count from scope line', () => {
      const fixture = `
**Scope:** Complete verification for Gnosis → Sophia (67 Base Entities + Extensions, 114 Relationships, 21 Gates, 4 Tracks)
`;
      const result = parseGateCount(fixture);
      expect(result).toBe(21);
    });
    
    it('should return null for missing gate count', () => {
      const fixture = `# Verification spec without gates`;
      const result = parseGateCount(fixture);
      expect(result).toBeNull();
    });
  });
  
});

