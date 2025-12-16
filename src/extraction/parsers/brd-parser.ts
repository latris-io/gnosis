// src/extraction/parsers/brd-parser.ts
// @implements STORY-64.1
// BRD markdown parser - extracts Epic, Story, AC, and Constraint entities

/**
 * Parsed Epic from BRD.
 */
export interface ParsedEpic {
  number: number;
  title: string;
  description: string;
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
  userStory: string;
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
  priority: string;
  lineStart: number;
  lineEnd: number;
}

/**
 * Parsed Constraint from BRD.
 */
export interface ParsedConstraint {
  id: string;
  type: string;
  description: string;
  lineStart: number;
  lineEnd: number;
}

/**
 * Result of parsing a BRD document.
 */
export interface BRDParseResult {
  epics: ParsedEpic[];
  stories: ParsedStory[];
  acceptanceCriteria: ParsedAC[];
  constraints: ParsedConstraint[];
}

/**
 * Parse a BRD markdown document.
 * 
 * Handles multiple formats:
 * - Epic headings: `## Epic 64:` or `### Epic 64:`
 * - Story headings: `### Story 64.1:` or `#### Story 64.1:`
 * - AC tables: `| AC-64.1.1 | Description | Priority |`
 * - AC lists: `- AC1: Description`
 */
export function parseBRD(content: string): BRDParseResult {
  const lines = content.split('\n');
  const result: BRDParseResult = {
    epics: [],
    stories: [],
    acceptanceCriteria: [],
    constraints: [],
  };

  // Track current context for AC parsing
  let currentEpic: number | null = null;
  let currentStory: { epic: number; story: number } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1; // 1-indexed

    // Parse Epic headings: ## Epic 64: Title or ### Epic 64: Title
    const epicMatch = line.match(/^#{2,3}\s+Epic\s+(\d+):\s*(.+?)(?:\s*\(.*\))?$/);
    if (epicMatch) {
      const epicNumber = parseInt(epicMatch[1], 10);
      const title = epicMatch[2].trim();
      
      // Find epic description (lines until next heading or ---)
      let description = '';
      let endLine = lineNum;
      for (let j = i + 1; j < lines.length; j++) {
        const nextLine = lines[j];
        if (nextLine.startsWith('#') || nextLine.startsWith('---')) {
          endLine = j;
          break;
        }
        if (nextLine.trim() && !nextLine.startsWith('**')) {
          description += nextLine + '\n';
        }
        endLine = j + 1;
      }

      result.epics.push({
        number: epicNumber,
        title,
        description: description.trim(),
        lineStart: lineNum,
        lineEnd: endLine,
      });

      currentEpic = epicNumber;
      continue;
    }

    // Parse Story headings: ### Story 64.1: Title or #### Story 64.1:
    const storyMatch = line.match(/^#{3,4}\s+Story\s+(\d+)\.(\d+):\s*(.+)$/);
    if (storyMatch) {
      const epicNumber = parseInt(storyMatch[1], 10);
      const storyNumber = parseInt(storyMatch[2], 10);
      const title = storyMatch[3].trim();

      // Extract user story (As a/I want/So that)
      let userStory = '';
      let endLine = lineNum;
      for (let j = i + 1; j < lines.length && j < i + 10; j++) {
        const nextLine = lines[j];
        if (nextLine.includes('**As a**') || nextLine.includes('**As**') ||
            nextLine.includes('**I want**') || nextLine.includes('**So that**')) {
          userStory += nextLine + '\n';
          endLine = j + 1;
        }
        if (nextLine.startsWith('#') || nextLine.startsWith('---')) {
          break;
        }
      }

      // Find story end (next story or epic heading)
      for (let j = i + 1; j < lines.length; j++) {
        const nextLine = lines[j];
        if (nextLine.match(/^#{2,4}\s+(Story|Epic)/)) {
          endLine = j;
          break;
        }
        endLine = j + 1;
      }

      result.stories.push({
        epicNumber,
        storyNumber,
        title,
        userStory: userStory.trim(),
        lineStart: lineNum,
        lineEnd: endLine,
      });

      currentEpic = epicNumber;
      currentStory = { epic: epicNumber, story: storyNumber };
      continue;
    }

    // Parse AC table rows: 
    // Format 1: | AC-64.1.1 | Description | Priority |
    // Format 2: | AC-65.1.1 | Criterion | Verification |
    const acTableMatch = line.match(/^\|\s*AC-?(\d+)\.(\d+)\.(\d+)\s*\|\s*(.+?)\s*\|/);
    if (acTableMatch) {
      const epicNumber = parseInt(acTableMatch[1], 10);
      const storyNumber = parseInt(acTableMatch[2], 10);
      const acNumber = parseInt(acTableMatch[3], 10);
      const description = acTableMatch[4].trim();
      
      // Extract priority if present (look for P0, P1, P2 pattern in remaining columns)
      const priorityMatch = line.match(/\|\s*(P[0-2])\s*\|/);
      const priority = priorityMatch ? priorityMatch[1] : 'P0';

      result.acceptanceCriteria.push({
        epicNumber,
        storyNumber,
        acNumber,
        description,
        priority,
        lineStart: lineNum,
        lineEnd: lineNum,
      });
      continue;
    }

    // Parse AC list items: - AC1: Description (uses current story context)
    const acListMatch = line.match(/^-\s*AC(\d+):\s*(.+)$/);
    if (acListMatch && currentStory) {
      const acNumber = parseInt(acListMatch[1], 10);
      const description = acListMatch[2].trim();

      result.acceptanceCriteria.push({
        epicNumber: currentStory.epic,
        storyNumber: currentStory.story,
        acNumber,
        description,
        priority: 'P0',
        lineStart: lineNum,
        lineEnd: lineNum,
      });
      continue;
    }

    // Parse constraints from tables: | CNST-SEC-001 | Description |
    const constraintMatch = line.match(/^\|\s*(CNST-\w+-\d+)\s*\|\s*(.+?)\s*\|/);
    if (constraintMatch) {
      const id = constraintMatch[1];
      const description = constraintMatch[2].trim();
      const typeMatch = id.match(/CNST-(\w+)-/);
      const type = typeMatch ? typeMatch[1] : 'UNKNOWN';

      result.constraints.push({
        id,
        type,
        description,
        lineStart: lineNum,
        lineEnd: lineNum,
      });
      continue;
    }
  }

  // Parse epics from summary tables: | 64 | Unified Traceability Graph | 15 | 123 |
  const epicTablePattern = /^\|\s*(\d+)\s*\|\s*([^|]+)\s*\|\s*(\d+)\s*\|\s*(\d+|✅|⚠️|Complete|Partial)/;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    const match = line.match(epicTablePattern);
    if (match) {
      const epicNumber = parseInt(match[1], 10);
      const title = match[2].trim();

      // Check if we already have this epic from heading parsing
      const existingEpic = result.epics.find(e => e.number === epicNumber);
      if (!existingEpic) {
        result.epics.push({
          number: epicNumber,
          title,
          description: '',
          lineStart: lineNum,
          lineEnd: lineNum,
        });
      }
    }
  }

  // Sort results for consistency
  result.epics.sort((a, b) => a.number - b.number);
  result.stories.sort((a, b) => {
    if (a.epicNumber !== b.epicNumber) return a.epicNumber - b.epicNumber;
    return a.storyNumber - b.storyNumber;
  });
  result.acceptanceCriteria.sort((a, b) => {
    if (a.epicNumber !== b.epicNumber) return a.epicNumber - b.epicNumber;
    if (a.storyNumber !== b.storyNumber) return a.storyNumber - b.storyNumber;
    return a.acNumber - b.acNumber;
  });

  return result;
}

/**
 * Get statistics from a parse result.
 */
export function getParseStats(result: BRDParseResult): {
  epicCount: number;
  storyCount: number;
  acCount: number;
  constraintCount: number;
} {
  return {
    epicCount: result.epics.length,
    storyCount: result.stories.length,
    acCount: result.acceptanceCriteria.length,
    constraintCount: result.constraints.length,
  };
}
