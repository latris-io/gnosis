// src/extraction/providers/tdd-frontmatter-provider.ts
// @implements STORY-64.1, STORY-64.2
// @tdd TDD-A1-ENTITY-REGISTRY
// @tdd TDD-A2-RELATIONSHIP-REGISTRY
// TDD Frontmatter Provider - Extracts E06 TechnicalDesign entities from story files
// Provider purity: NO imports from src/db/* or src/services/*

import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'yaml';

// ============================================================
// TYPES
// ============================================================

export interface FrontmatterEntry {
  value: string;
  line: number;
}

export interface ParsedFrontmatter {
  id: string;
  type: string;
  version: string;
  status: string;
  
  // Each entry includes its line number for evidence anchoring
  addresses: {
    stories: FrontmatterEntry[];
    acceptance_criteria: FrontmatterEntry[];
    schemas: FrontmatterEntry[];
  };
  implements: {
    files: FrontmatterEntry[];
  };
  
  // Block-level metadata
  meta: {
    source_file: string;
    block_start: number;  // Line of opening ---
    block_end: number;    // Line of closing ---
  };
}

export interface TDDEntity {
  entity_type: 'E06';
  instance_id: string;
  name: string;
  attributes: {
    version: string;
    status: string;
    addresses_stories: string[];
    addresses_acceptance_criteria: string[];
    addresses_schemas: string[];
    implements_files: string[];
  };
  source_file: string;
  line_start: number;
  line_end: number;
}

// ============================================================
// FRONTMATTER PARSING
// ============================================================

/**
 * Parse YAML frontmatter from a markdown file with line tracking
 */
export async function parseFrontmatter(filePath: string): Promise<ParsedFrontmatter | null> {
  const content = await fs.readFile(filePath, 'utf-8');
  const lines = content.split('\n');
  
  // Find frontmatter boundaries
  let blockStart = -1;
  let blockEnd = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      if (blockStart === -1) {
        blockStart = i;
      } else {
        blockEnd = i;
        break;
      }
    }
  }
  
  if (blockStart === -1 || blockEnd === -1) {
    return null; // No frontmatter found
  }
  
  // Extract frontmatter content
  const frontmatterLines = lines.slice(blockStart + 1, blockEnd);
  const frontmatterContent = frontmatterLines.join('\n');
  
  // Parse YAML
  let parsed: Record<string, unknown>;
  try {
    parsed = yaml.parse(frontmatterContent);
  } catch {
    return null; // Invalid YAML
  }
  
  // Extract tdd block
  const tdd = parsed.tdd as Record<string, unknown> | undefined;
  if (!tdd || typeof tdd !== 'object') {
    return null; // No tdd block
  }
  
  // Build parsed frontmatter with line tracking
  const result: ParsedFrontmatter = {
    id: String(tdd.id || ''),
    type: String(tdd.type || 'TechnicalDesign'),
    version: String(tdd.version || '1.0.0'),
    status: String(tdd.status || 'pending'),
    addresses: {
      stories: [],
      acceptance_criteria: [],
      schemas: [],
    },
    implements: {
      files: [],
    },
    meta: {
      source_file: filePath,
      block_start: blockStart + 1, // 1-indexed
      block_end: blockEnd + 1,     // 1-indexed
    },
  };
  
  // Track line numbers for each entry
  const addresses = tdd.addresses as Record<string, unknown[]> | undefined;
  if (addresses && typeof addresses === 'object') {
    if (Array.isArray(addresses.stories)) {
      result.addresses.stories = trackLines(addresses.stories, frontmatterLines, 'stories:', blockStart);
    }
    if (Array.isArray(addresses.acceptance_criteria)) {
      result.addresses.acceptance_criteria = trackLines(addresses.acceptance_criteria, frontmatterLines, 'acceptance_criteria:', blockStart);
    }
    if (Array.isArray(addresses.schemas)) {
      result.addresses.schemas = trackLines(addresses.schemas, frontmatterLines, 'schemas:', blockStart);
    }
  }
  
  const implements_ = tdd.implements as Record<string, unknown[]> | undefined;
  if (implements_ && typeof implements_ === 'object') {
    if (Array.isArray(implements_.files)) {
      result.implements.files = trackLines(implements_.files, frontmatterLines, 'files:', blockStart);
    }
  }
  
  return result;
}

/**
 * Track line numbers for array entries in YAML
 */
function trackLines(
  values: unknown[],
  frontmatterLines: string[],
  sectionMarker: string,
  blockStart: number
): FrontmatterEntry[] {
  const entries: FrontmatterEntry[] = [];
  
  // Find the section start
  let sectionStart = -1;
  for (let i = 0; i < frontmatterLines.length; i++) {
    if (frontmatterLines[i].trim().startsWith(sectionMarker)) {
      sectionStart = i;
      break;
    }
  }
  
  if (sectionStart === -1) {
    // Section not found, use fallback line numbers
    return values.map((v, idx) => ({
      value: String(v),
      line: blockStart + 2 + idx, // Approximate
    }));
  }
  
  // Match values to their lines
  let valueIdx = 0;
  for (let i = sectionStart + 1; i < frontmatterLines.length && valueIdx < values.length; i++) {
    const line = frontmatterLines[i];
    const trimmed = line.trim();
    
    // Stop at next section
    if (trimmed && !trimmed.startsWith('-') && !trimmed.startsWith('#')) {
      if (!line.startsWith(' ') && !line.startsWith('\t')) {
        break;
      }
    }
    
    // Match list item
    if (trimmed.startsWith('- ')) {
      const value = trimmed.slice(2).trim();
      if (value === String(values[valueIdx])) {
        entries.push({
          value: String(values[valueIdx]),
          line: blockStart + 2 + i, // 1-indexed, +1 for first ---, +1 for 0-index
        });
        valueIdx++;
      }
    }
  }
  
  // Fallback for any unmatched values
  while (valueIdx < values.length) {
    entries.push({
      value: String(values[valueIdx]),
      line: blockStart + 2,
    });
    valueIdx++;
  }
  
  return entries;
}

// ============================================================
// ENTITY EXTRACTION
// ============================================================

/**
 * Extract E06 TechnicalDesign entity from parsed frontmatter
 */
export function extractTDDEntity(frontmatter: ParsedFrontmatter): TDDEntity {
  return {
    entity_type: 'E06',
    instance_id: frontmatter.id,
    name: frontmatter.id.replace('TDD-', '').replace(/-/g, ' '),
    attributes: {
      version: frontmatter.version,
      status: frontmatter.status,
      addresses_stories: frontmatter.addresses.stories.map(e => e.value),
      addresses_acceptance_criteria: frontmatter.addresses.acceptance_criteria.map(e => e.value),
      addresses_schemas: frontmatter.addresses.schemas.map(e => e.value),
      implements_files: frontmatter.implements.files.map(e => e.value),
    },
    source_file: frontmatter.meta.source_file,
    line_start: frontmatter.meta.block_start,
    line_end: frontmatter.meta.block_end,
  };
}

/**
 * Discover all Track A story files and extract TDD entities
 */
export async function discoverTDDs(specDir: string): Promise<TDDEntity[]> {
  const storiesDir = path.join(specDir, 'track_a', 'stories');
  
  let files: string[];
  try {
    files = await fs.readdir(storiesDir);
  } catch {
    return []; // Directory doesn't exist
  }
  
  const entities: TDDEntity[] = [];
  
  for (const file of files) {
    if (!file.endsWith('.md')) continue;
    
    const filePath = path.join(storiesDir, file);
    const frontmatter = await parseFrontmatter(filePath);
    
    if (frontmatter && frontmatter.id) {
      entities.push(extractTDDEntity(frontmatter));
    }
  }
  
  return entities;
}

/**
 * Get all TDD IDs from Track A story files
 */
export async function getTDDIds(specDir: string): Promise<string[]> {
  const entities = await discoverTDDs(specDir);
  return entities.map(e => e.instance_id);
}
