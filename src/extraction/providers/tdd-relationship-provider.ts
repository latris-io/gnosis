// src/extraction/providers/tdd-relationship-provider.ts
// @implements STORY-64.2
// @tdd TDD-A2-RELATIONSHIP-REGISTRY
// TDD Relationship Provider - Derives R08, R09, R11, R14 from TDD frontmatter
// Provider purity: NO imports from src/db/* or src/services/*

import * as path from 'path';
import { ParsedFrontmatter, parseFrontmatter, FrontmatterEntry } from './tdd-frontmatter-provider.js';

// ============================================================
// TYPES
// ============================================================

export interface TDDRelationship {
  relationship_type: 'R08' | 'R09' | 'R11' | 'R14';
  instance_id: string;
  name: string;
  from_instance_id: string;
  to_instance_id: string;
  source_file: string;
  line_start: number;
  line_end: number;
  confidence: number;
  attributes: Record<string, unknown>;
}

export interface DerivedRelationships {
  r08: TDDRelationship[];  // Story → TDD
  r09: TDDRelationship[];  // AC → TDD
  r11: TDDRelationship[];  // Story → Schema
  r14: TDDRelationship[];  // TDD → SourceFile
}

export interface E11InstanceResolver {
  (filePath: string): Promise<string | null>;
}

// ============================================================
// RELATIONSHIP DERIVATION
// ============================================================

/**
 * Derive all TDD Bridge relationships from parsed frontmatter
 * 
 * @param frontmatter - Parsed TDD frontmatter
 * @param resolveE11 - Function to resolve file paths to E11 instance_ids
 */
export async function deriveTDDRelationships(
  frontmatter: ParsedFrontmatter,
  resolveE11?: E11InstanceResolver
): Promise<DerivedRelationships> {
  const tddId = frontmatter.id;
  const sourceFile = frontmatter.meta.source_file;
  
  const result: DerivedRelationships = {
    r08: [],
    r09: [],
    r11: [],
    r14: [],
  };
  
  // R08: Story → TDD (DESIGNED_IN)
  for (const storyEntry of frontmatter.addresses.stories) {
    result.r08.push({
      relationship_type: 'R08',
      instance_id: `R08:${storyEntry.value}:${tddId}`,
      name: `${storyEntry.value} DESIGNED_IN ${tddId}`,
      from_instance_id: storyEntry.value,
      to_instance_id: tddId,
      source_file: sourceFile,
      line_start: storyEntry.line,
      line_end: storyEntry.line,
      confidence: 1.0,
      attributes: {
        derived_from: 'tdd-frontmatter',
        addresses_section: 'stories',
      },
    });
  }
  
  // R09: AC → TDD (SPECIFIED_IN)
  for (const acEntry of frontmatter.addresses.acceptance_criteria) {
    result.r09.push({
      relationship_type: 'R09',
      instance_id: `R09:${acEntry.value}:${tddId}`,
      name: `${acEntry.value} SPECIFIED_IN ${tddId}`,
      from_instance_id: acEntry.value,
      to_instance_id: tddId,
      source_file: sourceFile,
      line_start: acEntry.line,
      line_end: acEntry.line,
      confidence: 1.0,
      attributes: {
        derived_from: 'tdd-frontmatter',
        addresses_section: 'acceptance_criteria',
      },
    });
  }
  
  // R11: Story → Schema (DEFINES_SCHEMA)
  // Each story gets an R11 edge to EACH schema (many-to-many)
  for (const storyEntry of frontmatter.addresses.stories) {
    for (const schemaEntry of frontmatter.addresses.schemas) {
      result.r11.push({
        relationship_type: 'R11',
        instance_id: `R11:${storyEntry.value}:${schemaEntry.value}`,
        name: `${storyEntry.value} DEFINES_SCHEMA ${schemaEntry.value}`,
        from_instance_id: storyEntry.value,
        to_instance_id: schemaEntry.value,
        source_file: sourceFile,
        line_start: schemaEntry.line,
        line_end: schemaEntry.line,
        confidence: 1.0,
        attributes: {
          derived_from: 'tdd-frontmatter',
          addresses_section: 'schemas',
        },
      });
    }
  }
  
  // R14: TDD → SourceFile (IMPLEMENTED_BY)
  for (const fileEntry of frontmatter.implements.files) {
    // Resolve file path to E11 instance_id
    let toInstanceId: string;
    
    if (resolveE11) {
      const resolved = await resolveE11(fileEntry.value);
      if (!resolved) {
        // Skip files that don't resolve to E11 entities
        continue;
      }
      toInstanceId = resolved;
    } else {
      // Fallback: assume FILE- prefix
      toInstanceId = `FILE-${fileEntry.value}`;
    }
    
    result.r14.push({
      relationship_type: 'R14',
      instance_id: `R14:${tddId}:${toInstanceId}`,
      name: `${tddId} IMPLEMENTED_BY ${toInstanceId}`,
      from_instance_id: tddId,
      to_instance_id: toInstanceId,
      source_file: sourceFile,
      line_start: fileEntry.line,
      line_end: fileEntry.line,
      confidence: 1.0,
      attributes: {
        derived_from: 'tdd-frontmatter',
        implements_section: 'files',
        original_path: fileEntry.value,
      },
    });
  }
  
  return result;
}

/**
 * Derive relationships from a story file path
 */
export async function deriveRelationshipsFromFile(
  filePath: string,
  resolveE11?: E11InstanceResolver
): Promise<DerivedRelationships | null> {
  const frontmatter = await parseFrontmatter(filePath);
  
  if (!frontmatter || !frontmatter.id) {
    return null;
  }
  
  return deriveTDDRelationships(frontmatter, resolveE11);
}

/**
 * Compute expected relationship counts from frontmatter
 * Used for calibration and validation
 */
export function computeExpectedCounts(frontmatter: ParsedFrontmatter): {
  r08: number;
  r09: number;
  r11: number;
  r14: number;
} {
  const storyCount = frontmatter.addresses.stories.length;
  const acCount = frontmatter.addresses.acceptance_criteria.length;
  const schemaCount = frontmatter.addresses.schemas.length;
  const fileCount = frontmatter.implements.files.length;
  
  return {
    r08: storyCount,                    // One R08 per story
    r09: acCount,                       // One R09 per AC
    r11: storyCount * schemaCount,      // Cross-product: each story × each schema
    r14: fileCount,                     // One R14 per file
  };
}

/**
 * Flatten all derived relationships into a single array
 */
export function flattenRelationships(derived: DerivedRelationships): TDDRelationship[] {
  return [
    ...derived.r08,
    ...derived.r09,
    ...derived.r11,
    ...derived.r14,
  ];
}


