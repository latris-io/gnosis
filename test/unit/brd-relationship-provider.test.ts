// test/unit/brd-relationship-provider.test.ts
// Unit tests for pure BRD relationship provider (no DB dependencies)
// @implements STORY-64.2

import { describe, it, expect } from 'vitest';
import { deriveBrdRelationships } from '../../src/extraction/providers/brd-relationship-provider.js';

// Valid evidence for entities that don't need to fail
const validEvidence = {
  source_file: 'docs/BRD.md',
  line_start: 100,
  line_end: 110,
};

describe('deriveBrdRelationships evidence validation', () => {
  describe('R01 (Story evidence)', () => {
    it('throws on missing source_file', () => {
      const entities = [
        { entity_type: 'E01', instance_id: 'EPIC-1', ...validEvidence },
        { entity_type: 'E02', instance_id: 'STORY-1.1', source_file: '', line_start: 10, line_end: 20 },
      ];
      expect(() => deriveBrdRelationships(entities)).toThrow(
        '[A2][R01] Missing source_file for E02 STORY-1.1'
      );
    });

    it('throws on null source_file', () => {
      const entities = [
        { entity_type: 'E01', instance_id: 'EPIC-1', ...validEvidence },
        { entity_type: 'E02', instance_id: 'STORY-1.1', source_file: null as any, line_start: 10, line_end: 20 },
      ];
      expect(() => deriveBrdRelationships(entities)).toThrow(
        '[A2][R01] Missing source_file for E02 STORY-1.1'
      );
    });
  });

  describe('R02 (AC evidence)', () => {
    it('throws on line_start = 0', () => {
      const entities = [
        { entity_type: 'E01', instance_id: 'EPIC-1', ...validEvidence },
        { entity_type: 'E02', instance_id: 'STORY-1.1', ...validEvidence },
        { entity_type: 'E03', instance_id: 'AC-1.1.1', source_file: 'docs/BRD.md', line_start: 0, line_end: 20 },
      ];
      expect(() => deriveBrdRelationships(entities)).toThrow(
        '[A2][R02] Invalid line_start for E03 AC-1.1.1: 0'
      );
    });

    it('throws on negative line_start', () => {
      const entities = [
        { entity_type: 'E01', instance_id: 'EPIC-1', ...validEvidence },
        { entity_type: 'E02', instance_id: 'STORY-1.1', ...validEvidence },
        { entity_type: 'E03', instance_id: 'AC-1.1.1', source_file: 'docs/BRD.md', line_start: -5, line_end: 20 },
      ];
      expect(() => deriveBrdRelationships(entities)).toThrow(
        '[A2][R02] Invalid line_start for E03 AC-1.1.1: -5'
      );
    });

    it('throws on line_end < line_start', () => {
      const entities = [
        { entity_type: 'E01', instance_id: 'EPIC-1', ...validEvidence },
        { entity_type: 'E02', instance_id: 'STORY-1.1', ...validEvidence },
        { entity_type: 'E03', instance_id: 'AC-1.1.1', source_file: 'docs/BRD.md', line_start: 50, line_end: 40 },
      ];
      expect(() => deriveBrdRelationships(entities)).toThrow(
        '[A2][R02] Invalid line_end for E03 AC-1.1.1: 40 (line_start=50)'
      );
    });
  });

  describe('valid evidence passes', () => {
    it('derives relationships when all evidence is valid', () => {
      const entities = [
        { entity_type: 'E01', instance_id: 'EPIC-1', ...validEvidence },
        { entity_type: 'E02', instance_id: 'STORY-1.1', ...validEvidence },
        { entity_type: 'E03', instance_id: 'AC-1.1.1', ...validEvidence },
      ];
      const rels = deriveBrdRelationships(entities);
      expect(rels).toHaveLength(2); // 1 R01 + 1 R02
      expect(rels[0].relationship_type).toBe('R01');
      expect(rels[0].instance_id).toBe('R01:EPIC-1:STORY-1.1');
      expect(rels[1].relationship_type).toBe('R02');
      expect(rels[1].instance_id).toBe('R02:STORY-1.1:AC-1.1.1');
    });
  });
});
