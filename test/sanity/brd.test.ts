// test/sanity/brd.test.ts
// @implements INFRASTRUCTURE
// BRD validation tests (SANITY-055 to SANITY-057)
// Authority: ENTRY.md:67, EXIT.md:123, SANITY_SUITE.md:455-476

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import { parseBRD } from '../../src/extraction/parsers/brd-parser.js';

const BRD_PATH = 'docs/BRD_V20_6_4_COMPLETE.md';

describe('BRD Tests (Track A)', () => {
  // SANITY-055: BRD Registry Populated
  describe('SANITY-055: BRD Registry Populated', () => {
    it('BRD counts match expected (65/397/3147)', () => {
      const content = fs.readFileSync(BRD_PATH, 'utf8');
      const result = parseBRD(content, BRD_PATH);
      
      expect(result.epics.length, 'Epic count mismatch').toBe(65);
      expect(result.stories.length, 'Story count mismatch').toBe(397);
      expect(result.acceptanceCriteria.length, 'AC count mismatch').toBe(3147);
    });
  });

  // SANITY-056: Epic IDs Valid
  // Per SANITY_SUITE.md: validates epic.id matches /^EPIC-\d+$/
  describe('SANITY-056: Epic IDs Valid', () => {
    it('all epic IDs match /^EPIC-\\d+$/', () => {
      const content = fs.readFileSync(BRD_PATH, 'utf8');
      const result = parseBRD(content, BRD_PATH);
      
      // Count validation is in SANITY-055; here we validate ID format only
      for (const epic of result.epics) {
        expect(epic.id).toMatch(/^EPIC-\d+$/);
      }
    });
  });

  // SANITY-057: Story IDs Reference Valid Epics
  // Per SANITY_SUITE.md: validates story.id format and epic reference
  describe('SANITY-057: Story IDs Reference Valid Epics', () => {
    it('all story IDs reference existing epics', () => {
      const content = fs.readFileSync(BRD_PATH, 'utf8');
      const result = parseBRD(content, BRD_PATH);
      const epicNumbers = new Set(result.epics.map(e => parseInt(e.id.split('-')[1])));
      
      // Count validation is in SANITY-055; here we validate ID format + epic reference
      for (const story of result.stories) {
        expect(story.id).toMatch(/^STORY-\d+\.\d+$/);
        const storyEpic = parseInt(story.id.split('-')[1].split('.')[0]);
        expect(epicNumbers.has(storyEpic)).toBe(true);
      }
    });
  });
});


