// src/extraction/parsers/brd-parser.ts
// @implements STORY-64.1
// @satisfies AC-64.1.1, AC-64.1.2, AC-64.1.3, AC-64.1.4
// @tdd TDD-A1-ENTITY-REGISTRY
// BRD Parser - extracts Epics, Stories, and Acceptance Criteria from BRD markdown

/**
 * Parsed Epic from BRD.
 * @contract SANITY-056 expects `id` to match /^EPIC-\d+$/
 */
export interface ParsedEpic {
  number: number;
  title: string;
  description: string;  // Per A1_ENTITY_REGISTRY.md line 155
  lineStart: number;
  lineEnd: number;
  id: string;           // Canonical format: "EPIC-{number}" e.g. "EPIC-64"
}

/**
 * Parsed Story from BRD.
 * @contract SANITY-057 expects `id` to match /^STORY-\d+\.\d+$/
 */
export interface ParsedStory {
  epicNumber: number;
  storyNumber: number;
  title: string;
  userStory: string;  // Per A1_ENTITY_REGISTRY.md line 172
  lineStart: number;
  lineEnd: number;
  id: string;         // Canonical format: "STORY-{epic}.{story}" e.g. "STORY-64.1"
}

/**
 * Parsed Acceptance Criterion from BRD.
 * @contract Canonical ID format: /^AC-\d+\.\d+\.\d+$/
 */
export interface ParsedAC {
  epicNumber: number;
  storyNumber: number;
  acNumber: number;
  description: string;
  lineStart: number;
  lineEnd: number;
  id: string;         // Canonical format: "AC-{epic}.{story}.{ac}" e.g. "AC-64.1.1"
}

/**
 * Parsed Constraint from BRD.
 * Provider constructs instance_id as CNST-{type}-{number}.
 * Per AC-64.1.4 - BRD V20.6.3 expected: 0 constraints.
 */
export interface ParsedConstraint {
  type: string;        // e.g., "SEC", "PERF", "DATA" (or "UNKNOWN" if not specified)
  number: number;      // Sequential within file (1, 2, 3...)
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
  constraints: ParsedConstraint[];
}

// Canonical counts for BRD V20.6.4
const EXPECTED_COUNTS = {
  epics: 65,
  stories: 397,
  acceptanceCriteria: 3147,
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

// CNST-formatted constraint detection - explicit entity definitions only
// Only extract constraints with explicit CNST-{TYPE}-{N} identifiers
// Acceptable formats:
//   ### Constraint CNST-SEC-1: Description
//   ### CNST-ARCH-2: Architectural limitation
//   **CNST-PERF-3:** Performance constraint
// Per AC-64.1.4 - BRD V20.6.3 expected: 0 CNST-formatted constraints
// Section headings like "## Constraints" are NOT entity definitions
const CONSTRAINT_ENTITY_PATTERN = /^#{2,}\s+(?:Constraint\s+)?(CNST-[A-Z]+-\d+)\s*:\s*(.+)$/i;
const CONSTRAINT_INLINE_CNST_PATTERN = /^\*\*(CNST-[A-Z]+-\d+)\*\*\s*:\s*(.*)$/i;

/**
 * Parse a CNST ID into type and number components.
 * @param cnstId - e.g., "CNST-SEC-1" or "CNST-ARCH-2"
 * @returns { type: string, number: number } - e.g., { type: "SEC", number: 1 }
 */
function parseCnstId(cnstId: string): { type: string; number: number } {
  const match = cnstId.match(/^CNST-([A-Z]+)-(\d+)$/i);
  if (!match) {
    return { type: 'UNKNOWN', number: 0 };
  }
  return {
    type: match[1].toUpperCase(),
    number: parseInt(match[2], 10),
  };
}

// User story triad patterns (anchored at start of line to avoid false positives)
// Must match: "**As a** ...", "**As an** ...", "**I want** ...", "**So that** ..."
// Must NOT match: "**Asynchronous**", "**Aspect**", or mid-line occurrences
const USER_STORY_AS_PATTERN = /^\*\*As (a|an)\*\*/i;
const USER_STORY_I_WANT_PATTERN = /^\*\*I want\*\*/i;
const USER_STORY_SO_THAT_PATTERN = /^\*\*So that\*\*/i;
// Plain text fallbacks (some BRDs use unbolded format)
const USER_STORY_AS_PLAIN = /^As (a|an)\s+/i;
const USER_STORY_I_WANT_PLAIN = /^I want\s+/i;
const USER_STORY_SO_THAT_PLAIN = /^So that\s+/i;

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
  const constraints: ParsedConstraint[] = [];
  
  // Track context for bullet ACs
  let currentEpicNumber: number | null = null;
  let currentStoryNumber: number | null = null;
  let currentStoryLineStart: number | null = null;
  
  // Track epic line endings and description extraction
  const epicLineEnds: Map<number, number> = new Map();
  const epicDescriptions: Map<number, string[]> = new Map();
  const storyUserStories: Map<string, string[]> = new Map();
  
  // Helper to get story key
  const storyKey = (epicNum: number, storyNum: number) => `${epicNum}.${storyNum}`;
  
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
        description: '',  // Will be populated after parsing
        lineStart: lineNumber,
        lineEnd: lineNumber, // Will be updated when next epic starts or EOF
        id: `EPIC-${epicNum}`,
      });
      
      epicDescriptions.set(epicNum, []);
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
        userStory: '',  // Will be populated after parsing
        lineStart: lineNumber,
        lineEnd: lineNumber, // Will be updated when next story/epic starts or EOF
        id: `STORY-${epicNum}.${storyNum}`,
      });
      
      storyUserStories.set(storyKey(epicNum, storyNum), []);
      currentEpicNumber = epicNum;
      currentStoryNumber = storyNum;
      currentStoryLineStart = lineNumber;
      continue;
    }
    
    // Collect epic description (text before first story, not a heading)
    if (currentEpicNumber !== null && currentStoryNumber === null) {
      const trimmed = line.trim();
      if (
        trimmed &&
        !trimmed.startsWith('#') &&
        !trimmed.startsWith('|') &&
        !BULLET_AC_PATTERN.test(trimmed)
      ) {
        const descLines = epicDescriptions.get(currentEpicNumber);
        if (descLines) {
          descLines.push(trimmed);
        }
      }
    }
    
    // Collect user story (As a / I want / So that patterns)
    // Uses anchored patterns to avoid false positives like "**Asynchronous**"
    if (currentEpicNumber !== null && currentStoryNumber !== null) {
      const trimmed = line.trim();
      const isUserStoryLine = 
        USER_STORY_AS_PATTERN.test(trimmed) ||
        USER_STORY_I_WANT_PATTERN.test(trimmed) ||
        USER_STORY_SO_THAT_PATTERN.test(trimmed) ||
        USER_STORY_AS_PLAIN.test(trimmed) ||
        USER_STORY_I_WANT_PLAIN.test(trimmed) ||
        USER_STORY_SO_THAT_PLAIN.test(trimmed);
      
      if (isUserStoryLine) {
        const key = storyKey(currentEpicNumber, currentStoryNumber);
        const userStoryLines = storyUserStories.get(key);
        if (userStoryLines) {
          userStoryLines.push(trimmed);
        }
      }
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
        id: `AC-${epicNum}.${storyNum}.${acNum}`,
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
        id: `AC-${currentEpicNumber}.${currentStoryNumber}.${acNum}`,
      });
      continue;
    }
    
    // Check for CNST-formatted constraint heading (### Constraint CNST-SEC-1: ... or ### CNST-ARCH-2: ...)
    const constraintEntityMatch = line.match(CONSTRAINT_ENTITY_PATTERN);
    if (constraintEntityMatch) {
      const cnstId = constraintEntityMatch[1].toUpperCase(); // e.g., CNST-SEC-1
      const { type, number } = parseCnstId(cnstId);
      constraints.push({
        type,
        number,
        description: constraintEntityMatch[2].trim(),
        lineStart: lineNumber,
        lineEnd: lineNumber,
      });
      continue;
    }
    
    // Check for inline CNST definition (**CNST-PERF-3:** ...)
    const constraintInlineMatch = line.match(CONSTRAINT_INLINE_CNST_PATTERN);
    if (constraintInlineMatch) {
      const cnstId = constraintInlineMatch[1].toUpperCase(); // e.g., CNST-PERF-3
      const { type, number } = parseCnstId(cnstId);
      constraints.push({
        type,
        number,
        description: constraintInlineMatch[2].trim(),
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
  
  // Populate epic descriptions from collected lines
  for (const epic of epics) {
    const descLines = epicDescriptions.get(epic.number);
    epic.description = descLines ? descLines.join('\n').trim() : '';
  }
  
  // Populate story userStory from collected lines
  for (const story of stories) {
    const key = storyKey(story.epicNumber, story.storyNumber);
    const userStoryLines = storyUserStories.get(key);
    story.userStory = userStoryLines ? userStoryLines.join('\n').trim() : '';
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
  const result: BRDParseResult = { epics, stories, acceptanceCriteria, constraints };
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
