// src/extraction/providers/brd-provider.ts
// @implements STORY-64.1
// @satisfies AC-64.1.1, AC-64.1.2, AC-64.1.3, AC-64.1.4
// BRD Provider - extracts E01 Epic, E02 Story, E03 AcceptanceCriterion, E04 Constraint from BRD

import * as fs from 'fs/promises';
import * as path from 'path';
import type { ExtractionProvider, RepoSnapshot, ExtractionResult, ExtractedEntity } from '../types.js';
import { parseBRD, getExpectedCounts } from '../parsers/brd-parser.js';
import { captureCorrectSignal, captureIncorrectSignal } from '../../ledger/semantic-corpus.js';

/**
 * BRD Provider - extracts requirement entities from BRD markdown.
 * 
 * Entities extracted:
 * - E01 Epic: High-level feature groupings
 * - E02 Story: User stories within epics
 * - E03 AcceptanceCriterion: Acceptance criteria for stories
 * - E04 Constraint: Constraints (expected 0 in current BRD)
 */
export class BRDProvider implements ExtractionProvider {
  name = 'brd-provider';

  supports(fileType: string): boolean {
    return fileType === 'md' || fileType === 'brd';
  }

  async extract(snapshot: RepoSnapshot): Promise<ExtractionResult> {
    const brdPath = path.join(snapshot.root_path, 'docs/BRD_V20_6_3_COMPLETE.md');
    const relativePath = 'docs/BRD_V20_6_3_COMPLETE.md';
    const entities: ExtractedEntity[] = [];

    // Emit start signal
    await captureCorrectSignal('MILESTONE', 'brd-parse-start', {
      path: relativePath,
    });

    // Read BRD file (hard-fail if not found)
    let content: string;
    try {
      content = await fs.readFile(brdPath, 'utf8');
    } catch (error) {
      await captureIncorrectSignal('BRD', 'brd-file', `Failed to read BRD file: ${error}`, {
        path: brdPath,
      });
      throw new Error(`BRD FILE NOT FOUND: Cannot read ${brdPath}`);
    }

    // Parse BRD (hard-fail on count mismatch unless ALLOW_BRD_COUNT_DRIFT=1)
    const parsed = parseBRD(content, relativePath);

    // Convert E01 Epics - emit signal for EACH entity per .cursorrules Rule 5 (≥50 signals)
    // Attributes per A1_ENTITY_REGISTRY.md lines 153-156: number, description
    for (const epic of parsed.epics) {
      const instanceId = `EPIC-${epic.number}`;
      
      entities.push({
        entity_type: 'E01',
        instance_id: instanceId,
        name: `Epic ${epic.number}: ${epic.title}`,
        attributes: {
          number: epic.number,
          description: epic.description,  // Per A1_ENTITY_REGISTRY.md line 155
        },
        source_file: relativePath,
        line_start: epic.lineStart,
        line_end: epic.lineEnd,
      });

      // Signal per entity extraction
      await captureCorrectSignal('E01', instanceId, {
        title: epic.title,
      });
    }

    // Convert E02 Stories - emit signal for EACH entity
    // Attributes per A1_ENTITY_REGISTRY.md lines 169-173: epic_number, story_number, user_story
    for (const story of parsed.stories) {
      const instanceId = `STORY-${story.epicNumber}.${story.storyNumber}`;
      
      entities.push({
        entity_type: 'E02',
        instance_id: instanceId,
        name: `Story ${story.epicNumber}.${story.storyNumber}: ${story.title}`,
        attributes: {
          epic_number: story.epicNumber,    // Per A1_ENTITY_REGISTRY.md line 170
          story_number: story.storyNumber,  // Per A1_ENTITY_REGISTRY.md line 171
          user_story: story.userStory,      // Per A1_ENTITY_REGISTRY.md line 172
        },
        source_file: relativePath,
        line_start: story.lineStart,
        line_end: story.lineEnd,
      });

      // Signal per entity extraction
      await captureCorrectSignal('E02', instanceId, {
        title: story.title,
        epic: story.epicNumber,
      });
    }

    // Convert E03 AcceptanceCriteria - emit signal for EACH entity
    for (const ac of parsed.acceptanceCriteria) {
      const instanceId = `AC-${ac.epicNumber}.${ac.storyNumber}.${ac.acNumber}`;
      
      entities.push({
        entity_type: 'E03',
        instance_id: instanceId,
        name: instanceId,
        attributes: {
          story_id: `STORY-${ac.epicNumber}.${ac.storyNumber}`,
          number: ac.acNumber,
          description: ac.description,
        },
        source_file: relativePath,
        line_start: ac.lineStart,
        line_end: ac.lineEnd,
      });

      // Signal per entity extraction
      await captureCorrectSignal('E03', instanceId, {
        description: ac.description.substring(0, 100),
      });
    }

    // Convert E04 Constraints - per A1_ENTITY_REGISTRY.md AC-64.1.4
    // BRD V20.6.3 expected: 0 constraints
    for (const constraint of parsed.constraints) {
      // Provider constructs instance_id per ENTRY.md rule
      const typeUpper = (constraint.type || 'UNKNOWN').toUpperCase();
      const instanceId = `CNST-${typeUpper}-${constraint.number}`;
      
      entities.push({
        entity_type: 'E04',
        instance_id: instanceId,
        name: instanceId,
        attributes: {
          type: constraint.type,
          number: constraint.number,
          description: constraint.description,
        },
        source_file: relativePath,
        line_start: constraint.lineStart,
        line_end: constraint.lineEnd,
      });

      // Fire-and-forget signal (consistent with ast-provider pattern)
      captureCorrectSignal('E04', instanceId, {
        type: constraint.type,
      }).catch(() => {});
    }

    // Signal counts validated
    const expected = getExpectedCounts();
    await captureCorrectSignal('MILESTONE', 'brd-counts-validated', {
      epics: parsed.epics.length,
      stories: parsed.stories.length,
      acceptanceCriteria: parsed.acceptanceCriteria.length,
      expected_epics: expected.epics,
      expected_stories: expected.stories,
      expected_acs: expected.acceptanceCriteria,
    });

    // Signal parse complete
    await captureCorrectSignal('MILESTONE', 'brd-parse-complete', {
      total_entities: entities.length,
      e01_count: parsed.epics.length,
      e02_count: parsed.stories.length,
      e03_count: parsed.acceptanceCriteria.length,
      e04_count: parsed.constraints.length,
    });

    return { entities, relationships: [], evidence: [] };
  }

  /**
   * Get entity counts by type from a parse result.
   */
  getEntityCounts(entities: ExtractedEntity[]): Record<string, number> {
    const counts: Record<string, number> = {
      E01: 0,
      E02: 0,
      E03: 0,
      E04: 0,
    };

    for (const entity of entities) {
      if (entity.entity_type in counts) {
        counts[entity.entity_type]++;
      }
    }

    return counts;
  }
}

// Export singleton instance
export const brdProvider = new BRDProvider();
