// src/extraction/parsers/brd-parser.ts
// @implements STORY-64.1
// @satisfies AC-64.1.1, AC-64.1.2, AC-64.1.3, AC-64.1.4
// BRD Parser - extracts Epics, Stories, and Acceptance Criteria from BRD markdown

/**
 * Parsed Epic from BRD.
 */
export interface ParsedEpic {
  number: number;
  title: string;
  lineStart: number;
  lineEnd: number;
}

/**
 * Parsed Story from BRD.
 */
export interface ParsedStory {
  epicNumber: number;
  storyNumber: number;
  title: string;
  lineStart: number;
  lineEnd: number;
}

/**
 * Parsed Acceptance Criterion from BRD.
 */
export interface ParsedAC {
  epicNumber: number;
  storyNumber: number;
  acNumber: number;
  description: string;
  lineStart: number;
  lineEnd: number;
}

/**
 * Result of parsing the BRD document.
 */
export interface BRDParseResult {
  epics: ParsedEpic[];
  stories: ParsedStory[];
  acceptanceCriteria: ParsedAC[];
}

// Canonical counts for BRD V20.6.3
const EXPECTED_COUNTS = {
  epics: 65,
  stories: 351,
  acceptanceCriteria: 2849,
};

// Regex patterns (whitespace-tolerant)
// Epic: 2+ hashes (## or ###)
const EPIC_PATTERN = /^#{2,}\s+Epic\s+(\d+)\s*:(.*)$/i;
// Story: 3+ hashes (### or ####)
const STORY_PATTERN = /^#{3,}\s+Story\s+(\d+)\.(\d+)\s*:(.*)$/i;
// Bullet AC: - ACN: description
const BULLET_AC_PATTERN = /^\s*-\s*AC(\d+)\s*:(.*)$/i;
// Table AC: | AC-X.Y.Z | description |
const TABLE_AC_PATTERN = /^\|\s*AC-(\d+)\.(\d+)\.(\d+)\s*\|(.*)$/i;

/**
 * Parse BRD markdown content to extract Epics, Stories, and ACs.
 * 
 * @param content - The BRD markdown content
 * @param sourcePath - The relative path to the BRD file (for error messages)
 * @returns Parsed BRD result with epics, stories, and acceptance criteria
 * @throws Error if parsing fails or counts don't match (unless ALLOW_BRD_COUNT_DRIFT=1)
 */
export function parseBRD(content: string, sourcePath: string): BRDParseResult {
  const lines = content.split('\n');
  
  const epics: ParsedEpic[] = [];
  const stories: ParsedStory[] = [];
  const acceptanceCriteria: ParsedAC[] = [];
  
  // Track context for bullet ACs
  let currentEpicNumber: number | null = null;
  let currentStoryNumber: number | null = null;
  let currentStoryLineStart: number | null = null;
  
  // Track epic line endings
  const epicLineEnds: Map<number, number> = new Map();
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1; // 1-indexed
    
    // Check for Epic
    const epicMatch = line.match(EPIC_PATTERN);
    if (epicMatch) {
      const epicNum = parseInt(epicMatch[1], 10);
      const title = epicMatch[2].trim();
      
      // Close previous story if any
      if (currentStoryLineStart !== null && stories.length > 0) {
        stories[stories.length - 1].lineEnd = lineNumber - 1;
      }
      
      // Close previous epic if any
      if (currentEpicNumber !== null) {
        epicLineEnds.set(currentEpicNumber, lineNumber - 1);
      }
      
      epics.push({
        number: epicNum,
        title,
        lineStart: lineNumber,
        lineEnd: lineNumber, // Will be updated when next epic starts or EOF
      });
      
      currentEpicNumber = epicNum;
      currentStoryNumber = null;
      currentStoryLineStart = null;
      continue;
    }
    
    // Check for Story
    const storyMatch = line.match(STORY_PATTERN);
    if (storyMatch) {
      const epicNum = parseInt(storyMatch[1], 10);
      const storyNum = parseInt(storyMatch[2], 10);
      const title = storyMatch[3].trim();
      
      // Close previous story if any
      if (currentStoryLineStart !== null && stories.length > 0) {
        stories[stories.length - 1].lineEnd = lineNumber - 1;
      }
      
      stories.push({
        epicNumber: epicNum,
        storyNumber: storyNum,
        title,
        lineStart: lineNumber,
        lineEnd: lineNumber, // Will be updated when next story/epic starts or EOF
      });
      
      currentEpicNumber = epicNum;
      currentStoryNumber = storyNum;
      currentStoryLineStart = lineNumber;
      continue;
    }
    
    // Check for Table AC (explicit numbering)
    const tableAcMatch = line.match(TABLE_AC_PATTERN);
    if (tableAcMatch) {
      const epicNum = parseInt(tableAcMatch[1], 10);
      const storyNum = parseInt(tableAcMatch[2], 10);
      const acNum = parseInt(tableAcMatch[3], 10);
      const description = tableAcMatch[4].trim();
      
      // Clean up description - remove trailing pipe and content after
      const cleanDesc = description.split('|')[0].trim();
      
      acceptanceCriteria.push({
        epicNumber: epicNum,
        storyNumber: storyNum,
        acNumber: acNum,
        description: cleanDesc,
        lineStart: lineNumber,
        lineEnd: lineNumber,
      });
      continue;
    }
    
    // Check for Bullet AC (context-dependent)
    const bulletAcMatch = line.match(BULLET_AC_PATTERN);
    if (bulletAcMatch) {
      const acNum = parseInt(bulletAcMatch[1], 10);
      const description = bulletAcMatch[2].trim();
      
      // CRITICAL: Bullet ACs are only valid inside a story context
      if (currentEpicNumber === null || currentStoryNumber === null) {
        throw new Error(
          `PARSE DRIFT: Bullet AC found outside story context at ${sourcePath}:${lineNumber}\n` +
          `Line: "${line}"\n` +
          `No story context established. This indicates BRD format drift.`
        );
      }
      
      acceptanceCriteria.push({
        epicNumber: currentEpicNumber,
        storyNumber: currentStoryNumber,
        acNumber: acNum,
        description,
        lineStart: lineNumber,
        lineEnd: lineNumber,
      });
      continue;
    }
  }
  
  // Close final story
  if (stories.length > 0 && currentStoryLineStart !== null) {
    stories[stories.length - 1].lineEnd = lines.length;
  }
  
  // Close final epic
  if (epics.length > 0) {
    epics[epics.length - 1].lineEnd = lines.length;
  }
  
  // Update epic line ends for non-final epics
  for (const [epicNum, lineEnd] of epicLineEnds) {
    const epic = epics.find(e => e.number === epicNum);
    if (epic) {
      epic.lineEnd = lineEnd;
    }
  }
  
  // Validate we parsed something
  if (epics.length === 0) {
    throw new Error(`BRD PARSE ERROR: No epics found in ${sourcePath}`);
  }
  if (stories.length === 0) {
    throw new Error(`BRD PARSE ERROR: No stories found in ${sourcePath}`);
  }
  
  // Detect table AC format drift (hyphen-less rows like "| AC65.1.1 |" instead of "| AC-65.1.1 |")
  // This check runs BEFORE count validation for better error messages
  detectTableACFormatDrift(content, sourcePath);
  
  // Validate counts
  const result: BRDParseResult = { epics, stories, acceptanceCriteria };
  validateCounts(result, sourcePath);
  
  return result;
}

/**
 * Detect table AC format drift (hyphen-less rows).
 * Hard-fails unless ALLOW_BRD_FORMAT_DRIFT=1 is set.
 * 
 * Expected format: `| AC-X.Y.Z |` (with hyphen)
 * Drift format: `| ACX.Y.Z |` (without hyphen)
 */
function detectTableACFormatDrift(content: string, sourcePath: string): void {
  const allowFormatDrift = process.env.ALLOW_BRD_FORMAT_DRIFT === '1';
  
  // Match table rows with AC followed by digits.digits.digits WITHOUT a hyphen
  // Negative lookbehind (?<!-) ensures we don't match "AC-" 
  // Pattern: | AC123.456.789 | (no hyphen after AC)
  const hyphenLessPattern = /^\|\s*AC(\d+\.\d+\.\d+)/gm;
  const matches = content.match(hyphenLessPattern);
  
  if (matches && matches.length > 0) {
    const message = 
      `TABLE AC FORMAT DRIFT: Found ${matches.length} table row(s) using 'AC' without hyphen in ${sourcePath}.\n` +
      `  Expected format: '| AC-X.Y.Z |'\n` +
      `  Found format: '| ACX.Y.Z |'\n` +
      `  Examples: ${matches.slice(0, 3).map(m => m.trim()).join(', ')}${matches.length > 3 ? '...' : ''}\n` +
      `  Normalize BRD format or set ALLOW_BRD_FORMAT_DRIFT=1 to proceed.`;
    
    if (allowFormatDrift) {
      console.warn('\x1b[33m[WARN]\x1b[0m ' + message.split('\n')[0]);
      console.warn(`\x1b[33m[WARN]\x1b[0m Proceeding due to ALLOW_BRD_FORMAT_DRIFT=1 - these ACs will NOT be extracted`);
      return;
    }
    
    throw new Error(message);
  }
}

/**
 * Validate parsed counts against expected values.
 * Hard-fails unless ALLOW_BRD_COUNT_DRIFT=1 is set.
 */
function validateCounts(result: BRDParseResult, sourcePath: string): void {
  const allowDrift = process.env.ALLOW_BRD_COUNT_DRIFT === '1';
  
  const epicCount = result.epics.length;
  const storyCount = result.stories.length;
  const acCount = result.acceptanceCriteria.length;
  
  const epicMatch = epicCount === EXPECTED_COUNTS.epics;
  const storyMatch = storyCount === EXPECTED_COUNTS.stories;
  const acMatch = acCount === EXPECTED_COUNTS.acceptanceCriteria;
  
  if (epicMatch && storyMatch && acMatch) {
    return; // All counts match
  }
  
  const message = 
    `BRD COUNT MISMATCH in ${sourcePath}:\n` +
    `  Epics: expected ${EXPECTED_COUNTS.epics}, got ${epicCount} ${epicMatch ? '✓' : '✗'}\n` +
    `  Stories: expected ${EXPECTED_COUNTS.stories}, got ${storyCount} ${storyMatch ? '✓' : '✗'}\n` +
    `  ACs: expected ${EXPECTED_COUNTS.acceptanceCriteria}, got ${acCount} ${acMatch ? '✓' : '✗'}`;
  
  if (allowDrift) {
    console.warn('\x1b[33m[WARN]\x1b[0m BRD count drift detected - extraction proceeding due to ALLOW_BRD_COUNT_DRIFT=1');
    console.warn(`\x1b[33m[WARN]\x1b[0m Expected: ${EXPECTED_COUNTS.epics}/${EXPECTED_COUNTS.stories}/${EXPECTED_COUNTS.acceptanceCriteria}, Got: ${epicCount}/${storyCount}/${acCount}`);
    return;
  }
  
  throw new Error(message);
}

/**
 * Get expected counts for validation.
 */
export function getExpectedCounts(): typeof EXPECTED_COUNTS {
  return { ...EXPECTED_COUNTS };
}
