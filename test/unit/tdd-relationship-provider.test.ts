// test/unit/tdd-relationship-provider.test.ts
// @implements STORY-64.2
// Unit tests for TDD relationship derivation

import { describe, it, expect } from 'vitest';
import {
  deriveTDDRelationships,
  computeExpectedCounts,
  flattenRelationships,
  TDDRelationship,
} from '../../src/extraction/providers/tdd-relationship-provider.js';
import { ParsedFrontmatter } from '../../src/extraction/providers/tdd-frontmatter-provider.js';

describe('TDD Relationship Provider', () => {
  const mockFrontmatter: ParsedFrontmatter = {
    id: 'TDD-TEST-001',
    type: 'TechnicalDesign',
    version: '1.0.0',
    status: 'implemented',
    addresses: {
      stories: [
        { value: 'STORY-1.1', line: 5 },
        { value: 'STORY-1.2', line: 6 },
      ],
      acceptance_criteria: [
        { value: 'AC-1.1.1', line: 8 },
        { value: 'AC-1.1.2', line: 9 },
        { value: 'AC-1.2.1', line: 10 },
      ],
      schemas: [
        { value: 'SCHEMA-Test', line: 12 },
        { value: 'SCHEMA-Other', line: 13 },
      ],
    },
    implements: {
      files: [
        { value: 'src/file1.ts', line: 16 },
        { value: 'src/file2.ts', line: 17 },
      ],
    },
    meta: {
      source_file: '/path/to/test.md',
      block_start: 1,
      block_end: 20,
    },
  };
  
  describe('deriveTDDRelationships', () => {
    it('derives R08 relationships (Story → TDD)', async () => {
      const result = await deriveTDDRelationships(mockFrontmatter);
      
      expect(result.r08).toHaveLength(2);
      
      const r08_1 = result.r08[0];
      expect(r08_1.relationship_type).toBe('R08');
      expect(r08_1.instance_id).toBe('R08:STORY-1.1:TDD-TEST-001');
      expect(r08_1.from_instance_id).toBe('STORY-1.1');
      expect(r08_1.to_instance_id).toBe('TDD-TEST-001');
      expect(r08_1.line_start).toBe(5);
      expect(r08_1.confidence).toBe(1.0);
      expect(r08_1.attributes.derived_from).toBe('tdd-frontmatter');
    });
    
    it('derives R09 relationships (AC → TDD)', async () => {
      const result = await deriveTDDRelationships(mockFrontmatter);
      
      expect(result.r09).toHaveLength(3);
      
      const r09_1 = result.r09[0];
      expect(r09_1.relationship_type).toBe('R09');
      expect(r09_1.instance_id).toBe('R09:AC-1.1.1:TDD-TEST-001');
      expect(r09_1.from_instance_id).toBe('AC-1.1.1');
      expect(r09_1.to_instance_id).toBe('TDD-TEST-001');
    });
    
    it('derives R11 relationships (Story → Schema) as cross-product', async () => {
      const result = await deriveTDDRelationships(mockFrontmatter);
      
      // 2 stories × 2 schemas = 4 R11 relationships
      expect(result.r11).toHaveLength(4);
      
      const instanceIds = result.r11.map(r => r.instance_id).sort();
      expect(instanceIds).toEqual([
        'R11:STORY-1.1:SCHEMA-Other',
        'R11:STORY-1.1:SCHEMA-Test',
        'R11:STORY-1.2:SCHEMA-Other',
        'R11:STORY-1.2:SCHEMA-Test',
      ]);
    });
    
    it('derives R14 relationships (TDD → SourceFile) with fallback instance_id', async () => {
      const result = await deriveTDDRelationships(mockFrontmatter);
      
      expect(result.r14).toHaveLength(2);
      
      const r14_1 = result.r14[0];
      expect(r14_1.relationship_type).toBe('R14');
      expect(r14_1.instance_id).toBe('R14:TDD-TEST-001:FILE-src/file1.ts');
      expect(r14_1.from_instance_id).toBe('TDD-TEST-001');
      expect(r14_1.to_instance_id).toBe('FILE-src/file1.ts');
      expect(r14_1.attributes.original_path).toBe('src/file1.ts');
    });
    
    it('uses E11 resolver when provided', async () => {
      const resolver = async (filePath: string): Promise<string | null> => {
        if (filePath === 'src/file1.ts') {
          return 'FILE-resolved-file1';
        }
        return null; // file2.ts not resolved
      };
      
      const result = await deriveTDDRelationships(mockFrontmatter, resolver);
      
      // Only file1 should resolve
      expect(result.r14).toHaveLength(1);
      expect(result.r14[0].to_instance_id).toBe('FILE-resolved-file1');
    });
    
    it('includes proper evidence anchors', async () => {
      const result = await deriveTDDRelationships(mockFrontmatter);
      
      // Check R08 evidence
      const r08 = result.r08[0];
      expect(r08.source_file).toBe('/path/to/test.md');
      expect(r08.line_start).toBe(5);
      expect(r08.line_end).toBe(5);
      
      // Check R09 evidence
      const r09 = result.r09[0];
      expect(r09.line_start).toBe(8);
      
      // Check R11 evidence (line of schema entry)
      const r11 = result.r11[0];
      expect(r11.line_start).toBe(12);
      
      // Check R14 evidence
      const r14 = result.r14[0];
      expect(r14.line_start).toBe(16);
    });
  });
  
  describe('computeExpectedCounts', () => {
    it('computes correct counts', () => {
      const counts = computeExpectedCounts(mockFrontmatter);
      
      expect(counts.r08).toBe(2);  // 2 stories
      expect(counts.r09).toBe(3);  // 3 ACs
      expect(counts.r11).toBe(4);  // 2 stories × 2 schemas
      expect(counts.r14).toBe(2);  // 2 files
    });
    
    it('handles empty arrays', () => {
      const emptyFrontmatter: ParsedFrontmatter = {
        id: 'TDD-EMPTY',
        type: 'TechnicalDesign',
        version: '1.0.0',
        status: 'pending',
        addresses: {
          stories: [{ value: 'STORY-1.1', line: 5 }],
          acceptance_criteria: [],
          schemas: [],
        },
        implements: {
          files: [],
        },
        meta: {
          source_file: '/path/to/empty.md',
          block_start: 1,
          block_end: 10,
        },
      };
      
      const counts = computeExpectedCounts(emptyFrontmatter);
      
      expect(counts.r08).toBe(1);
      expect(counts.r09).toBe(0);
      expect(counts.r11).toBe(0); // No schemas means no R11 edges
      expect(counts.r14).toBe(0);
    });
  });
  
  describe('flattenRelationships', () => {
    it('flattens all relationship types into single array', async () => {
      const derived = await deriveTDDRelationships(mockFrontmatter);
      const flat = flattenRelationships(derived);
      
      // 2 R08 + 3 R09 + 4 R11 + 2 R14 = 11 total
      expect(flat).toHaveLength(11);
      
      const types = flat.map(r => r.relationship_type);
      expect(types.filter(t => t === 'R08')).toHaveLength(2);
      expect(types.filter(t => t === 'R09')).toHaveLength(3);
      expect(types.filter(t => t === 'R11')).toHaveLength(4);
      expect(types.filter(t => t === 'R14')).toHaveLength(2);
    });
  });
  
  describe('relationship naming', () => {
    it('generates descriptive names for all relationship types', async () => {
      const result = await deriveTDDRelationships(mockFrontmatter);
      
      expect(result.r08[0].name).toBe('STORY-1.1 DESIGNED_IN TDD-TEST-001');
      expect(result.r09[0].name).toBe('AC-1.1.1 SPECIFIED_IN TDD-TEST-001');
      expect(result.r11[0].name).toContain('DEFINES_SCHEMA');
      expect(result.r14[0].name).toContain('IMPLEMENTED_BY');
    });
  });
});


