// src/extraction/providers/brd-provider.ts
// @implements STORY-64.1
// @satisfies AC-64.1.1, AC-64.1.2, AC-64.1.3, AC-64.1.4
// BRD extraction provider - extracts E01 Epic, E02 Story, E03 AcceptanceCriterion, E04 Constraint

import * as fs from 'fs/promises';
import * as path from 'path';
import type { ExtractionProvider, RepoSnapshot, ExtractionResult, ExtractedEntity } from '../types.js';
import { parseBRD, getParseStats } from '../parsers/brd-parser.js';
import { createEvidenceAnchor } from '../evidence.js';
import { captureCorrectSignal, captureIncorrectSignal, capturePartialSignal } from '../../ledger/semantic-corpus.js';

// Expected counts from BRD V20.6.3 (per .cursorrules)
const EXPECTED_COUNTS = {
  epics: 65,
  stories: 351,
  acceptanceCriteria: 2901,
};

/**
 * BRD Provider - extracts entities from the Business Requirements Document.
 * 
 * Entities extracted:
 * - E01 Epic: from Epic headings and summary tables
 * - E02 Story: from Story headings
 * - E03 AcceptanceCriterion: from AC tables and lists
 * - E04 Constraint: from constraint tables
 */
export class BRDProvider implements ExtractionProvider {
  name = 'brd-provider';

  supports(fileType: string): boolean {
    return fileType === 'brd' || fileType === 'md';
  }

  async extract(snapshot: RepoSnapshot): Promise<ExtractionResult> {
    const brdPath = path.join(snapshot.root_path, 'docs', 'BRD_V20_6_3_COMPLETE.md');
    
    let content: string;
    try {
      content = await fs.readFile(brdPath, 'utf8');
    } catch (error) {
      // Capture semantic signal for extraction failure
      await captureIncorrectSignal('E01', 'BRD', 'BRD file not found', {
        path: brdPath,
        error: String(error),
      });
      return { entities: [], relationships: [], evidence: [] };
    }

    const parsed = parseBRD(content);
    const stats = getParseStats(parsed);
    const entities: ExtractedEntity[] = [];

    // Extract Epics (E01)
    for (const epic of parsed.epics) {
      const instanceId = `EPIC-${epic.number}`;
      entities.push({
        entity_type: 'E01',
        instance_id: instanceId,
        name: epic.title,
        attributes: {
          number: epic.number,
          description: epic.description,
        },
        source_file: brdPath,
        line_start: epic.lineStart,
        line_end: epic.lineEnd,
      });

      // Capture semantic signal for successful extraction
      await captureCorrectSignal('E01', instanceId, {
        title: epic.title,
      });
    }

    // Extract Stories (E02)
    for (const story of parsed.stories) {
      const instanceId = `STORY-${story.epicNumber}.${story.storyNumber}`;
      entities.push({
        entity_type: 'E02',
        instance_id: instanceId,
        name: story.title,
        attributes: {
          epic_number: story.epicNumber,
          story_number: story.storyNumber,
          user_story: story.userStory,
          epic_id: `EPIC-${story.epicNumber}`,
        },
        source_file: brdPath,
        line_start: story.lineStart,
        line_end: story.lineEnd,
      });

      await captureCorrectSignal('E02', instanceId, {
        title: story.title,
        epic: story.epicNumber,
      });
    }

    // Extract Acceptance Criteria (E03)
    for (const ac of parsed.acceptanceCriteria) {
      const instanceId = `AC-${ac.epicNumber}.${ac.storyNumber}.${ac.acNumber}`;
      entities.push({
        entity_type: 'E03',
        instance_id: instanceId,
        name: instanceId,
        attributes: {
          story_id: `STORY-${ac.epicNumber}.${ac.storyNumber}`,
          description: ac.description,
          priority: ac.priority,
          epic_number: ac.epicNumber,
          story_number: ac.storyNumber,
          ac_number: ac.acNumber,
        },
        source_file: brdPath,
        line_start: ac.lineStart,
        line_end: ac.lineEnd,
      });

      await captureCorrectSignal('E03', instanceId, {
        description: ac.description.substring(0, 100),
      });
    }

    // Extract Constraints (E04)
    for (const constraint of parsed.constraints) {
      entities.push({
        entity_type: 'E04',
        instance_id: constraint.id,
        name: constraint.id,
        attributes: {
          type: constraint.type,
          description: constraint.description,
        },
        source_file: brdPath,
        line_start: constraint.lineStart,
        line_end: constraint.lineEnd,
      });

      await captureCorrectSignal('E04', constraint.id, {
        type: constraint.type,
      });
    }

    // Validate counts and capture partial signals if mismatch
    if (stats.epicCount !== EXPECTED_COUNTS.epics) {
      await capturePartialSignal('E01', 'EPIC-COUNT', 
        (stats.epicCount / EXPECTED_COUNTS.epics) * 100, {
          expected: EXPECTED_COUNTS.epics,
          actual: stats.epicCount,
        });
    }

    if (stats.storyCount !== EXPECTED_COUNTS.stories) {
      await capturePartialSignal('E02', 'STORY-COUNT',
        (stats.storyCount / EXPECTED_COUNTS.stories) * 100, {
          expected: EXPECTED_COUNTS.stories,
          actual: stats.storyCount,
        });
    }

    if (stats.acCount !== EXPECTED_COUNTS.acceptanceCriteria) {
      await capturePartialSignal('E03', 'AC-COUNT',
        (stats.acCount / EXPECTED_COUNTS.acceptanceCriteria) * 100, {
          expected: EXPECTED_COUNTS.acceptanceCriteria,
          actual: stats.acCount,
        });
    }

    return { entities, relationships: [], evidence: [] };
  }
}

// Export singleton instance
export const brdProvider = new BRDProvider();
