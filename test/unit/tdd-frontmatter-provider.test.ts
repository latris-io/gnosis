// test/unit/tdd-frontmatter-provider.test.ts
// @implements STORY-64.1
// Unit tests for TDD frontmatter parsing

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import {
  parseFrontmatter,
  extractTDDEntity,
  discoverTDDs,
} from '../../src/extraction/providers/tdd-frontmatter-provider.js';

describe('TDD Frontmatter Provider', () => {
  let tempDir: string;
  
  beforeAll(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'tdd-test-'));
  });
  
  afterAll(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });
  
  describe('parseFrontmatter', () => {
    it('parses valid TDD frontmatter', async () => {
      const content = `---
tdd:
  id: TDD-TEST-001
  type: TechnicalDesign
  version: "1.0.0"
  status: implemented
  addresses:
    stories:
      - STORY-1.1
      - STORY-1.2
    acceptance_criteria:
      - AC-1.1.1
      - AC-1.1.2
    schemas:
      - SCHEMA-Test
  implements:
    files:
      - src/test/file1.ts
      - src/test/file2.ts
---

# Test Document
`;
      
      const filePath = path.join(tempDir, 'test1.md');
      await fs.writeFile(filePath, content);
      
      const result = await parseFrontmatter(filePath);
      
      expect(result).not.toBeNull();
      expect(result!.id).toBe('TDD-TEST-001');
      expect(result!.type).toBe('TechnicalDesign');
      expect(result!.version).toBe('1.0.0');
      expect(result!.status).toBe('implemented');
      
      expect(result!.addresses.stories).toHaveLength(2);
      expect(result!.addresses.stories[0].value).toBe('STORY-1.1');
      expect(result!.addresses.stories[1].value).toBe('STORY-1.2');
      
      expect(result!.addresses.acceptance_criteria).toHaveLength(2);
      expect(result!.addresses.acceptance_criteria[0].value).toBe('AC-1.1.1');
      
      expect(result!.addresses.schemas).toHaveLength(1);
      expect(result!.addresses.schemas[0].value).toBe('SCHEMA-Test');
      
      expect(result!.implements.files).toHaveLength(2);
      expect(result!.implements.files[0].value).toBe('src/test/file1.ts');
    });
    
    it('returns null for file without frontmatter', async () => {
      const content = `# Test Document

Just some content without frontmatter.
`;
      
      const filePath = path.join(tempDir, 'test2.md');
      await fs.writeFile(filePath, content);
      
      const result = await parseFrontmatter(filePath);
      
      expect(result).toBeNull();
    });
    
    it('returns null for frontmatter without tdd block', async () => {
      const content = `---
title: Test
author: Someone
---

# Test Document
`;
      
      const filePath = path.join(tempDir, 'test3.md');
      await fs.writeFile(filePath, content);
      
      const result = await parseFrontmatter(filePath);
      
      expect(result).toBeNull();
    });
    
    it('tracks line numbers for entries', async () => {
      const content = `---
tdd:
  id: TDD-LINES
  type: TechnicalDesign
  version: "1.0.0"
  status: pending
  addresses:
    stories:
      - STORY-2.1
    acceptance_criteria:
      - AC-2.1.1
    schemas: []
  implements:
    files:
      - src/file.ts
---

# Document
`;
      
      const filePath = path.join(tempDir, 'test4.md');
      await fs.writeFile(filePath, content);
      
      const result = await parseFrontmatter(filePath);
      
      expect(result).not.toBeNull();
      expect(result!.meta.block_start).toBe(1); // First line after ---
      expect(result!.meta.block_end).toBeGreaterThan(result!.meta.block_start);
      expect(result!.meta.source_file).toBe(filePath);
    });
    
    it('handles empty arrays', async () => {
      const content = `---
tdd:
  id: TDD-EMPTY
  type: TechnicalDesign
  version: "1.0.0"
  status: pending
  addresses:
    stories:
      - STORY-3.1
    acceptance_criteria: []
    schemas: []
  implements:
    files: []
---

# Empty Arrays
`;
      
      const filePath = path.join(tempDir, 'test5.md');
      await fs.writeFile(filePath, content);
      
      const result = await parseFrontmatter(filePath);
      
      expect(result).not.toBeNull();
      expect(result!.addresses.acceptance_criteria).toHaveLength(0);
      expect(result!.addresses.schemas).toHaveLength(0);
      expect(result!.implements.files).toHaveLength(0);
    });
  });
  
  describe('extractTDDEntity', () => {
    it('extracts E06 entity from parsed frontmatter', async () => {
      const content = `---
tdd:
  id: TDD-ENTITY-TEST
  type: TechnicalDesign
  version: "2.0.0"
  status: implemented
  addresses:
    stories:
      - STORY-4.1
    acceptance_criteria:
      - AC-4.1.1
      - AC-4.1.2
    schemas:
      - SCHEMA-Entity
  implements:
    files:
      - src/entity.ts
---

# Entity Test
`;
      
      const filePath = path.join(tempDir, 'entity.md');
      await fs.writeFile(filePath, content);
      
      const frontmatter = await parseFrontmatter(filePath);
      expect(frontmatter).not.toBeNull();
      
      const entity = extractTDDEntity(frontmatter!);
      
      expect(entity.entity_type).toBe('E06');
      expect(entity.instance_id).toBe('TDD-ENTITY-TEST');
      expect(entity.name).toBe('ENTITY TEST');
      expect(entity.attributes.version).toBe('2.0.0');
      expect(entity.attributes.status).toBe('implemented');
      expect(entity.attributes.addresses_stories).toEqual(['STORY-4.1']);
      expect(entity.attributes.addresses_acceptance_criteria).toEqual(['AC-4.1.1', 'AC-4.1.2']);
      expect(entity.attributes.addresses_schemas).toEqual(['SCHEMA-Entity']);
      expect(entity.attributes.implements_files).toEqual(['src/entity.ts']);
      expect(entity.source_file).toBe(filePath);
    });
  });
  
  describe('discoverTDDs', () => {
    it('discovers TDD entities from spec directory', async () => {
      // Create a mock stories directory structure
      const storiesDir = path.join(tempDir, 'track_a', 'stories');
      await fs.mkdir(storiesDir, { recursive: true });
      
      // Create mock story files
      const story1 = `---
tdd:
  id: TDD-DISCOVER-1
  type: TechnicalDesign
  version: "1.0.0"
  status: implemented
  addresses:
    stories:
      - STORY-5.1
    acceptance_criteria: []
    schemas: []
  implements:
    files: []
---

# Story 1
`;
      
      const story2 = `---
tdd:
  id: TDD-DISCOVER-2
  type: TechnicalDesign
  version: "1.0.0"
  status: pending
  addresses:
    stories:
      - STORY-5.2
    acceptance_criteria: []
    schemas: []
  implements:
    files: []
---

# Story 2
`;
      
      const nonTdd = `# Non-TDD File

No frontmatter here.
`;
      
      await fs.writeFile(path.join(storiesDir, 'A1_STORY1.md'), story1);
      await fs.writeFile(path.join(storiesDir, 'A2_STORY2.md'), story2);
      await fs.writeFile(path.join(storiesDir, 'README.md'), nonTdd);
      
      const entities = await discoverTDDs(tempDir);
      
      expect(entities).toHaveLength(2);
      expect(entities.map(e => e.instance_id).sort()).toEqual([
        'TDD-DISCOVER-1',
        'TDD-DISCOVER-2',
      ]);
    });
    
    it('returns empty array for non-existent directory', async () => {
      const entities = await discoverTDDs('/nonexistent/path');
      expect(entities).toHaveLength(0);
    });
  });
});

