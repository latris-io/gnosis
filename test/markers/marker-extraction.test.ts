// test/markers/marker-extraction.test.ts
// @implements STORY-64.3
// Tests for marker extraction (A3)
// Covers VERIFY-MARKER-* and VERIFY-R18/R19 verification tests

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { MarkerProvider } from '../../src/extraction/providers/marker-provider.js';
import type { RepoSnapshot } from '../../src/extraction/types.js';

describe('Marker Extraction (A3)', () => {
  let tempDir: string;
  let snapshot: RepoSnapshot;
  let provider: MarkerProvider;

  beforeAll(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'marker-test-'));
    // Create src directory structure
    await fs.mkdir(path.join(tempDir, 'src'), { recursive: true });
    await fs.mkdir(path.join(tempDir, 'scripts'), { recursive: true });

    snapshot = {
      id: 'test-snapshot',
      root_path: tempDir,
      timestamp: new Date(),
    };

    provider = new MarkerProvider();
  });

  afterAll(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  // VERIFY-MARKER-01: @implements extraction
  describe('VERIFY-MARKER-01: @implements extraction', () => {
    it('extracts @implements markers from single-line comments', async () => {
      const content = `
// @implements STORY-64.3
export function testFunction() {}
`;
      await fs.writeFile(path.join(tempDir, 'src', 'test1.ts'), content);

      const markers = await provider.extract(snapshot);
      const implementsMarkers = markers.filter(m => m.type === 'implements');

      expect(implementsMarkers.length).toBeGreaterThanOrEqual(1);
      const marker = implementsMarkers.find(m => m.target_id === 'STORY-64.3');
      expect(marker).toBeDefined();
      expect(marker!.type).toBe('implements');
      expect(marker!.target_id).toBe('STORY-64.3');
    });

    it('extracts @implements markers from JSDoc comments', async () => {
      const content = `
/**
 * @implements STORY-64.1
 */
export function documentedFunction() {}
`;
      await fs.writeFile(path.join(tempDir, 'src', 'test2.ts'), content);

      const markers = await provider.extract(snapshot);
      const marker = markers.find(m => m.target_id === 'STORY-64.1');

      expect(marker).toBeDefined();
      expect(marker!.type).toBe('implements');
    });

    it('extracts @implements markers from block comments', async () => {
      const content = `
/* @implements STORY-64.2 */
export function blockCommentFunction() {}
`;
      await fs.writeFile(path.join(tempDir, 'src', 'test3.ts'), content);

      const markers = await provider.extract(snapshot);
      const marker = markers.find(m => m.target_id === 'STORY-64.2');

      expect(marker).toBeDefined();
      expect(marker!.type).toBe('implements');
    });
  });

  // VERIFY-MARKER-02: @satisfies extraction
  describe('VERIFY-MARKER-02: @satisfies extraction', () => {
    it('extracts @satisfies markers', async () => {
      const content = `
// @satisfies AC-64.3.1
export function satisfyingFunction() {}
`;
      await fs.writeFile(path.join(tempDir, 'src', 'test4.ts'), content);

      const markers = await provider.extract(snapshot);
      const satisfiesMarkers = markers.filter(m => m.type === 'satisfies');

      expect(satisfiesMarkers.length).toBeGreaterThanOrEqual(1);
      const marker = satisfiesMarkers.find(m => m.target_id === 'AC-64.3.1');
      expect(marker).toBeDefined();
      expect(marker!.type).toBe('satisfies');
      expect(marker!.target_id).toBe('AC-64.3.1');
    });

    it('extracts multiple @satisfies markers', async () => {
      const content = `
/**
 * @satisfies AC-64.3.2
 * @satisfies AC-64.3.3
 */
export function multiSatisfiesFunction() {}
`;
      await fs.writeFile(path.join(tempDir, 'src', 'test5.ts'), content);

      const markers = await provider.extract(snapshot);
      const ac2 = markers.find(m => m.target_id === 'AC-64.3.2');
      const ac3 = markers.find(m => m.target_id === 'AC-64.3.3');

      expect(ac2).toBeDefined();
      expect(ac3).toBeDefined();
    });
  });

  // VERIFY-MARKER-03: Link to source entities
  describe('VERIFY-MARKER-03: source entity linking', () => {
    it('links function markers to FUNC- entities', async () => {
      const content = `
/**
 * @implements STORY-64.4
 */
export function namedFunction() {}
`;
      await fs.writeFile(path.join(tempDir, 'src', 'test6.ts'), content);

      const markers = await provider.extract(snapshot);
      const marker = markers.find(m => m.target_id === 'STORY-64.4');

      expect(marker).toBeDefined();
      expect(marker!.source_entity_id).toMatch(/^FUNC-/);
      expect(marker!.source_entity_id).toContain('namedFunction');
    });

    it('links class markers to CLASS- entities', async () => {
      const content = `
/**
 * @implements STORY-64.5
 */
export class TestClass {}
`;
      await fs.writeFile(path.join(tempDir, 'src', 'test7.ts'), content);

      const markers = await provider.extract(snapshot);
      const marker = markers.find(m => m.target_id === 'STORY-64.5');

      expect(marker).toBeDefined();
      expect(marker!.source_entity_id).toMatch(/^CLASS-/);
      expect(marker!.source_entity_id).toContain('TestClass');
    });

    it('links file-level markers to FILE- entities', async () => {
      const content = `// @implements STORY-64.6
// This is a file-level marker

export const value = 1;
`;
      await fs.writeFile(path.join(tempDir, 'src', 'test8.ts'), content);

      const markers = await provider.extract(snapshot);
      const marker = markers.find(m => m.target_id === 'STORY-64.6');

      expect(marker).toBeDefined();
      expect(marker!.source_entity_id).toMatch(/^FILE-/);
    });
  });

  // VERIFY-MARKER-06: Multiline support
  describe('VERIFY-MARKER-06: multiline comment support', () => {
    it('extracts markers from multiline JSDoc', async () => {
      const content = `
/**
 * This is a multiline JSDoc comment.
 * It has multiple lines.
 * @implements STORY-64.7
 * @satisfies AC-64.7.1
 * More description here.
 */
export function multilineDocFunction() {}
`;
      await fs.writeFile(path.join(tempDir, 'src', 'test9.ts'), content);

      const markers = await provider.extract(snapshot);
      const story = markers.find(m => m.target_id === 'STORY-64.7');
      const ac = markers.find(m => m.target_id === 'AC-64.7.1');

      expect(story).toBeDefined();
      expect(ac).toBeDefined();
    });
  });

  // VERIFY-MARKER-07: @tdd extraction
  describe('VERIFY-MARKER-07: @tdd extraction', () => {
    it('extracts @tdd markers', async () => {
      const content = `
// @tdd TDD-A3-MARKER-EXTRACTION
export function tddMarkedFunction() {}
`;
      await fs.writeFile(path.join(tempDir, 'src', 'test10.ts'), content);

      const markers = await provider.extract(snapshot);
      const tddMarkers = markers.filter(m => m.type === 'tdd');

      expect(tddMarkers.length).toBeGreaterThanOrEqual(1);
      const marker = tddMarkers.find(m => m.target_id === 'TDD-A3-MARKER-EXTRACTION');
      expect(marker).toBeDefined();
      expect(marker!.type).toBe('tdd');
    });
  });

  // Evidence anchoring tests
  describe('Evidence anchoring (file-absolute positions)', () => {
    it('computes file-absolute line_start and line_end', async () => {
      const content = `// Line 1
// Line 2
// Line 3
// @implements STORY-64.8
export function lineTestFunction() {}
`;
      await fs.writeFile(path.join(tempDir, 'src', 'test11.ts'), content);

      const markers = await provider.extract(snapshot);
      const marker = markers.find(m => m.target_id === 'STORY-64.8');

      expect(marker).toBeDefined();
      expect(marker!.line_start).toBe(4); // File-absolute line (1-indexed)
      expect(marker!.line_end).toBeGreaterThanOrEqual(marker!.line_start);
    });

    it('includes source_file in markers', async () => {
      const content = `// @implements STORY-64.9
export function sourceFileTest() {}
`;
      await fs.writeFile(path.join(tempDir, 'src', 'test12.ts'), content);

      const markers = await provider.extract(snapshot);
      const marker = markers.find(m => m.target_id === 'STORY-64.9');

      expect(marker).toBeDefined();
      expect(marker!.source_file).toBeDefined();
      expect(marker!.source_file).toContain('test12.ts');
    });
  });

  // Scan scope tests
  describe('Scan scope (governed)', () => {
    it('scans src/** files', async () => {
      const content = `// @implements STORY-64.10
export const srcFile = true;
`;
      // Create directory first, then write file
      await fs.mkdir(path.join(tempDir, 'src', 'nested'), { recursive: true });
      await fs.writeFile(path.join(tempDir, 'src', 'nested', 'deep.ts'), content);

      const markers = await provider.extract(snapshot);
      const marker = markers.find(m => m.target_id === 'STORY-64.10');

      expect(marker).toBeDefined();
    });

    it('scans scripts/** files', async () => {
      const content = `// @implements STORY-64.11
export const scriptFile = true;
`;
      await fs.writeFile(path.join(tempDir, 'scripts', 'script.ts'), content);

      const markers = await provider.extract(snapshot);
      const marker = markers.find(m => m.target_id === 'STORY-64.11');

      expect(marker).toBeDefined();
    });
  });

  // Invalid marker patterns (should NOT match)
  describe('Invalid marker patterns (negative tests)', () => {
    it('does not extract markers with wrong case', async () => {
      const content = `
// @implements story-64.1
// @satisfies ac-64.1.1
export function wrongCaseFunction() {}
`;
      await fs.writeFile(path.join(tempDir, 'src', 'negative1.ts'), content);

      const markers = await provider.extract(snapshot);
      const wrongCase = markers.filter(m => 
        m.target_id === 'story-64.1' || m.target_id === 'ac-64.1.1'
      );

      expect(wrongCase.length).toBe(0);
    });

    it('does not extract markers missing prefix', async () => {
      const content = `
// @implements 64.1
// @satisfies 64.1.1
export function noPrefixFunction() {}
`;
      await fs.writeFile(path.join(tempDir, 'src', 'negative2.ts'), content);

      const markers = await provider.extract(snapshot);
      const noPrefix = markers.filter(m => 
        m.target_id === '64.1' || m.target_id === '64.1.1'
      );

      expect(noPrefix.length).toBe(0);
    });
  });

  // Class method marker tests
  describe('Class method markers', () => {
    it('links method markers to FUNC- entities with class prefix', async () => {
      const content = `
export class MyClass {
  /**
   * @implements STORY-64.12
   */
  myMethod() {}
}
`;
      await fs.writeFile(path.join(tempDir, 'src', 'classMethod.ts'), content);

      const markers = await provider.extract(snapshot);
      const marker = markers.find(m => m.target_id === 'STORY-64.12');

      expect(marker).toBeDefined();
      expect(marker!.source_entity_id).toMatch(/^FUNC-/);
      expect(marker!.source_entity_id).toContain('MyClass.myMethod');
    });
  });

  // Arrow function marker tests
  describe('Arrow function markers', () => {
    it('links arrow function markers to FUNC- entities', async () => {
      const content = `
/**
 * @implements STORY-64.13
 */
export const arrowFunc = () => {};
`;
      await fs.writeFile(path.join(tempDir, 'src', 'arrow.ts'), content);

      const markers = await provider.extract(snapshot);
      const marker = markers.find(m => m.target_id === 'STORY-64.13');

      expect(marker).toBeDefined();
      expect(marker!.source_entity_id).toMatch(/^FUNC-/);
      expect(marker!.source_entity_id).toContain('arrowFunc');
    });
  });
});

