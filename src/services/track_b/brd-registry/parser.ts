// src/services/track_b/brd-registry/parser.ts
// Track B-owned BRD Parser
// Intentionally decoupled from Track A internals (governance choice)
// Format-driven per docs/BRD_FORMAT_SPECIFICATION.md

import type { BrdIdentifier, BrdParseResult, ValidationResult } from './types.js';

// Regex patterns for BRD identifier extraction
// Format: "## Epic N:" or "### Epic N:" (2+ hashes)
const EPIC_HEADING_PATTERN = /^#{2,}\s+Epic\s+(\d+)\s*:/i;
// Format: "### Story N.M:" or "#### Story N.M:" (3+ hashes)
const STORY_HEADING_PATTERN = /^#{3,}\s+Story\s+(\d+)\.(\d+)\s*:/i;
// Format: "- ACN:" (bullet format, most common)
const BULLET_AC_PATTERN = /^\s*-\s*AC(\d+)\s*:/i;
// Format: "| AC-X.Y.Z | description |" (table format)
const TABLE_AC_PATTERN = /^\|\s*AC-(\d+)\.(\d+)\.(\d+)\s*\|/i;
// Version: "Version: 20.6.4" or "**Version:** 20.6.4"
const VERSION_PATTERN = /Version[:\*\s]+(\d+\.\d+\.\d+)/i;

/**
 * Parse BRD markdown content to extract identifiers.
 * 
 * This is a Track B-owned parser, intentionally decoupled from
 * Track A's src/extraction/parsers/brd-parser.ts.
 * 
 * @param content - Raw BRD markdown content
 * @param brdPath - Path to BRD file (for error messages)
 * @returns Parsed BRD result with version, identifiers, and any parse errors
 */
export function parseBrd(content: string, brdPath: string): BrdParseResult {
  const lines = content.split('\n');
  const epics: BrdIdentifier[] = [];
  const stories: BrdIdentifier[] = [];
  const acs: BrdIdentifier[] = [];
  const parse_errors: string[] = [];
  
  // Track seen IDs to detect duplicates
  const seenEpics = new Set<string>();
  const seenStories = new Set<string>();
  const seenAcs = new Set<string>();
  
  // Track current context for bullet ACs (they reference current story)
  let currentEpicNumber: number | null = null;
  let currentStoryNumber: number | null = null;
  let acCounterInStory = 0;
  
  // Extract version (usually in first 20 lines)
  let version = '';
  for (let i = 0; i < Math.min(20, lines.length); i++) {
    const versionMatch = lines[i].match(VERSION_PATTERN);
    if (versionMatch) {
      version = `V${versionMatch[1]}`;
      break;
    }
  }
  
  if (!version) {
    parse_errors.push(`No version found in first 20 lines of ${brdPath}`);
  }
  
  // Parse each line for identifiers
  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum];
    const lineNumber = lineNum + 1; // 1-indexed
    
    // Extract EPICs (format: "## Epic N:" or "### Epic N:")
    const epicMatch = line.match(EPIC_HEADING_PATTERN);
    if (epicMatch) {
      const epicNum = parseInt(epicMatch[1], 10);
      const id = `EPIC-${epicNum}`;
      
      if (seenEpics.has(id)) {
        parse_errors.push(`Duplicate Epic ID: ${id} at line ${lineNumber}`);
      } else {
        seenEpics.add(id);
        epics.push({ id, type: 'epic', line_number: lineNumber });
        currentEpicNumber = epicNum;
        currentStoryNumber = null;
        acCounterInStory = 0;
      }
      continue;
    }
    
    // Extract STORYs (format: "### Story N.M:" or "#### Story N.M:")
    const storyMatch = line.match(STORY_HEADING_PATTERN);
    if (storyMatch) {
      const epicNum = parseInt(storyMatch[1], 10);
      const storyNum = parseInt(storyMatch[2], 10);
      const id = `STORY-${epicNum}.${storyNum}`;
      
      if (seenStories.has(id)) {
        parse_errors.push(`Duplicate Story ID: ${id} at line ${lineNumber}`);
      } else {
        seenStories.add(id);
        stories.push({ id, type: 'story', line_number: lineNumber });
        currentEpicNumber = epicNum;
        currentStoryNumber = storyNum;
        acCounterInStory = 0;
      }
      continue;
    }
    
    // Extract ACs - Bullet format (most common): "- ACN:"
    const bulletAcMatch = line.match(BULLET_AC_PATTERN);
    if (bulletAcMatch && currentEpicNumber !== null && currentStoryNumber !== null) {
      acCounterInStory++;
      const id = `AC-${currentEpicNumber}.${currentStoryNumber}.${acCounterInStory}`;
      
      if (seenAcs.has(id)) {
        parse_errors.push(`Duplicate AC ID: ${id} at line ${lineNumber}`);
      } else {
        seenAcs.add(id);
        acs.push({ id, type: 'ac', line_number: lineNumber });
      }
      continue;
    }
    
    // Extract ACs - Table format: "| AC-X.Y.Z | description |"
    const tableAcMatch = line.match(TABLE_AC_PATTERN);
    if (tableAcMatch) {
      const epicNum = parseInt(tableAcMatch[1], 10);
      const storyNum = parseInt(tableAcMatch[2], 10);
      const acNum = parseInt(tableAcMatch[3], 10);
      const id = `AC-${epicNum}.${storyNum}.${acNum}`;
      
      if (seenAcs.has(id)) {
        parse_errors.push(`Duplicate AC ID: ${id} at line ${lineNumber}`);
      } else {
        seenAcs.add(id);
        acs.push({ id, type: 'ac', line_number: lineNumber });
      }
      continue;
    }
  }
  
  // Sort identifiers lexicographically for determinism
  epics.sort((a, b) => a.id.localeCompare(b.id));
  stories.sort((a, b) => a.id.localeCompare(b.id));
  acs.sort((a, b) => a.id.localeCompare(b.id));
  
  return {
    version,
    epics,
    stories,
    acs,
    parse_errors,
  };
}

/**
 * Validate parsing result for internal consistency.
 * 
 * @param result - Parsed BRD result
 * @returns Validation result with valid flag and any errors
 */
export function validateParsing(result: BrdParseResult): ValidationResult {
  const errors: string[] = [];
  
  // Check for version
  if (!result.version) {
    errors.push('No BRD version extracted');
  }
  
  // Check for empty results (suspicious)
  if (result.epics.length === 0) {
    errors.push('No epics found - parsing may have failed');
  }
  if (result.stories.length === 0) {
    errors.push('No stories found - parsing may have failed');
  }
  if (result.acs.length === 0) {
    errors.push('No acceptance criteria found - parsing may have failed');
  }
  
  // Check for parse errors that are fatal
  const fatalErrors = result.parse_errors.filter(e => 
    e.includes('Duplicate') && !e.includes('reference')
  );
  if (fatalErrors.length > 0) {
    errors.push(...fatalErrors);
  }
  
  // Internal consistency: story count should be reasonable relative to epic count
  if (result.epics.length > 0 && result.stories.length < result.epics.length) {
    errors.push(`Suspicious: fewer stories (${result.stories.length}) than epics (${result.epics.length})`);
  }
  
  // Internal consistency: AC count should be greater than story count
  if (result.stories.length > 0 && result.acs.length < result.stories.length) {
    errors.push(`Suspicious: fewer ACs (${result.acs.length}) than stories (${result.stories.length})`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

