// test/sanity/marker-governance.test.ts
// @implements SANITY-053
// @implements SANITY-054
/**
 * Marker Governance Tests (Tier B - Authoritative DB-backed)
 * 
 * Scope: src/** and scripts/** only (not test/**)
 * Format: Canonical markers at line-start only
 * 
 * Authority: Verification Spec V20.6.6 Part XVII
 */
import { describe, test, expect } from 'vitest';
import { execSync } from 'child_process';
import { rlsQuery } from '../utils/rls.js';
import 'dotenv/config';

const PROJECT_ID = process.env.PROJECT_ID;

// Scan scope: src/ and scripts/ only (not test/ - policy decision)
const SCAN_DIRS = 'src/ scripts/';

describe('GOVERNANCE Tests', () => {
  describe('SANITY-053: AC Marker Integrity', () => {
    test('All @satisfies AC-* markers in src/scripts resolve to E03 entities', async () => {
      if (!PROJECT_ID) {
        throw new Error('[SANITY-053] PROJECT_ID required');
      }

      // Get valid ACs from database
      const dbAcs = await rlsQuery<{ instance_id: string }>(PROJECT_ID, `
        SELECT instance_id FROM entities WHERE entity_type = 'E03'
      `);
      const validAcs = new Set(dbAcs.map(r => r.instance_id));
      console.log(`[SANITY-053] Valid ACs in DB: ${validAcs.size}`);
      
      // Scan for canonical @satisfies AC-* markers using grep
      // Match canonical format at line-start only to avoid prose mentions
      let markers: string[] = [];
      try {
        const output = execSync(
          `grep -rn "^\\s*//\\s*@satisfies\\s\\+AC-" ${SCAN_DIRS} 2>/dev/null || true`,
          { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
        );
        // Extract AC-X.Y.Z from matches
        const acPattern = /AC-\d+\.\d+\.\d+/g;
        for (const line of output.split('\n').filter(Boolean)) {
          const matches = line.match(acPattern);
          if (matches) markers.push(...matches);
        }
      } catch {
        markers = [];
      }

      const uniqueMarkers = [...new Set(markers)];
      console.log(`[SANITY-053] AC markers found: ${uniqueMarkers.length}`);
      
      if (uniqueMarkers.length === 0) {
        console.log('[SANITY-053] No AC markers to validate');
        return;
      }

      const phantoms = uniqueMarkers.filter(ac => !validAcs.has(ac));

      expect(phantoms.length, 
        `Phantom AC markers: ${phantoms.join(', ')}. ` +
        `Fix: Remove @satisfies for ACs not in BRD.`
      ).toBe(0);

      console.log(`[SANITY-053] PASSED: All ${uniqueMarkers.length} ACs resolve to E03`);
    });
  });

  describe('SANITY-054: Story Marker Integrity', () => {
    test('All @implements STORY-* markers in src/scripts resolve to E02 entities', async () => {
      if (!PROJECT_ID) {
        throw new Error('[SANITY-054] PROJECT_ID required');
      }

      const dbStories = await rlsQuery<{ instance_id: string }>(PROJECT_ID, `
        SELECT instance_id FROM entities WHERE entity_type = 'E02'
      `);
      const validStories = new Set(dbStories.map(r => r.instance_id));
      console.log(`[SANITY-054] Valid Stories in DB: ${validStories.size}`);
      
      let markers: string[] = [];
      try {
        const output = execSync(
          `grep -rn "^\\s*//\\s*@implements\\s\\+STORY-" ${SCAN_DIRS} 2>/dev/null || true`,
          { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
        );
        const storyPattern = /STORY-\d+\.\d+/g;
        for (const line of output.split('\n').filter(Boolean)) {
          const matches = line.match(storyPattern);
          if (matches) markers.push(...matches);
        }
      } catch {
        markers = [];
      }

      const uniqueMarkers = [...new Set(markers)];
      console.log(`[SANITY-054] Story markers found: ${uniqueMarkers.length}`);

      if (uniqueMarkers.length === 0) {
        console.log('[SANITY-054] No Story markers to validate');
        return;
      }

      const phantoms = uniqueMarkers.filter(s => !validStories.has(s));

      expect(phantoms.length,
        `Phantom Story markers: ${phantoms.join(', ')}`
      ).toBe(0);

      console.log(`[SANITY-054] PASSED: All ${uniqueMarkers.length} Stories resolve to E02`);
    });
  });
});


