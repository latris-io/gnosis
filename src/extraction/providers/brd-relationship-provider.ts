// src/extraction/providers/brd-relationship-provider.ts
// @implements STORY-64.2
// @satisfies AC-64.2.1, AC-64.2.2, AC-64.2.3

import type { ExtractedRelationship } from '../types.js';
import { RELATIONSHIP_TYPE_NAMES } from '../../schema/track-a/relationships.js';

/**
 * Input entity shape for BRD relationship derivation.
 * Provider expects snake_case fields; ops layer normalizes before calling.
 */
interface BrdEntity {
  entity_type: string;
  instance_id: string;
  source_file: string;
  line_start: number;
  line_end: number;
}

/**
 * Derive epic instance_id from story instance_id.
 * LOCKED semantics: STORY-64.1 → EPIC-64
 */
function getEpicFromStory(storyInstanceId: string): string {
  const match = storyInstanceId.match(/^STORY-(\d+)\./);
  if (!match) throw new Error(`Invalid story instance_id: ${storyInstanceId}`);
  return `EPIC-${match[1]}`;
}

/**
 * Derive story instance_id from AC instance_id.
 * LOCKED semantics: AC-64.1.1 → STORY-64.1
 */
function getStoryFromAc(acInstanceId: string): string {
  const match = acInstanceId.match(/^AC-(\d+\.\d+)\./);
  if (!match) throw new Error(`Invalid AC instance_id: ${acInstanceId}`);
  return `STORY-${match[1]}`;
}

/**
 * Validate evidence fields for relationship derivation.
 * Fails fast with explicit error message including relationship code and entity info.
 * 
 * @param e - Entity providing evidence for the relationship
 * @param relCode - Relationship type code (R01 or R02)
 * @throws Error if any evidence field is invalid
 */
function requireEvidence(e: BrdEntity, relCode: 'R01' | 'R02'): void {
  if (!e.source_file || typeof e.source_file !== 'string') {
    throw new Error(
      `[A2][${relCode}] Missing source_file for ${e.entity_type} ${e.instance_id}`
    );
  }
  if (!Number.isInteger(e.line_start) || e.line_start <= 0) {
    throw new Error(
      `[A2][${relCode}] Invalid line_start for ${e.entity_type} ${e.instance_id}: ${e.line_start}`
    );
  }
  if (!Number.isInteger(e.line_end) || e.line_end < e.line_start) {
    throw new Error(
      `[A2][${relCode}] Invalid line_end for ${e.entity_type} ${e.instance_id}: ${e.line_end} (line_start=${e.line_start})`
    );
  }
}

/**
 * Derive BRD hierarchy relationships from existing entities.
 * 
 * Pure function - no DB/service imports.
 * Evidence inherited from TO entity (Story for R01, AC for R02).
 * Hard fails on invalid instance_id patterns or missing parent entities.
 * 
 * @param entities - Array of BRD entities (E01 Epic, E02 Story, E03 AC)
 * @returns Array of extracted relationships (R01, R02, R03)
 */
export function deriveBrdRelationships(entities: BrdEntity[]): ExtractedRelationship[] {
  const relationships: ExtractedRelationship[] = [];
  
  const epics = entities.filter(e => e.entity_type === 'E01');
  const stories = entities.filter(e => e.entity_type === 'E02');
  const acs = entities.filter(e => e.entity_type === 'E03');
  // Note: E04 (Constraint) filtered in ops but not used here — R03 emits 0 relationships
  
  const epicSet = new Set(epics.map(e => e.instance_id));
  const storySet = new Set(stories.map(e => e.instance_id));
  
  // R01: Epic HAS_STORY Story
  for (const story of stories) {
    requireEvidence(story, 'R01');
    const epicId = getEpicFromStory(story.instance_id);
    if (!epicSet.has(epicId)) {
      throw new Error(`R01: Epic ${epicId} not found for story ${story.instance_id}`);
    }
    relationships.push({
      relationship_type: 'R01',
      instance_id: `R01:${epicId}:${story.instance_id}`,
      name: RELATIONSHIP_TYPE_NAMES['R01'],
      from_instance_id: epicId,
      to_instance_id: story.instance_id,
      // confidence omitted (optional field; DB accepts null or has default)
      source_file: story.source_file,
      line_start: story.line_start,
      line_end: story.line_end,
    });
  }
  
  // R02: Story HAS_AC AC
  for (const ac of acs) {
    requireEvidence(ac, 'R02');
    const storyId = getStoryFromAc(ac.instance_id);
    if (!storySet.has(storyId)) {
      throw new Error(`R02: Story ${storyId} not found for AC ${ac.instance_id}`);
    }
    relationships.push({
      relationship_type: 'R02',
      instance_id: `R02:${storyId}:${ac.instance_id}`,
      name: RELATIONSHIP_TYPE_NAMES['R02'],
      from_instance_id: storyId,
      to_instance_id: ac.instance_id,
      // confidence omitted (optional field; DB accepts null or has default)
      source_file: ac.source_file,
      line_start: ac.line_start,
      line_end: ac.line_end,
    });
  }
  
  // R03: AC HAS_CONSTRAINT Constraint (expected 0)
  // Would derive from constraint.parent_ac_id if constraints existed
  
  return relationships;
}
