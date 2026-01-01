// src/api/v1/relationships.ts
// @implements STORY-64.5
//
// Programmatic API for single-hop relationship queries.
// This module owns ALL validation and parsing — HTTP layer is transport only.

import * as graphService from '../../services/graph/graph-service.js';
import {
  VALID_PROVENANCE_CATEGORIES,
  RELATIONSHIP_PROVENANCE,
  getProvenance,
  matchesProvenance,
  type ProvenanceCategory,
} from '../../services/graph/provenance.js';
import type { Relationship } from '../../schema/track-a/relationships.js';

// Re-export provenance utilities for API consumers and tests
export {
  VALID_PROVENANCE_CATEGORIES,
  RELATIONSHIP_PROVENANCE,
  getProvenance,
  matchesProvenance,
  type ProvenanceCategory,
};

/**
 * Custom error for validation failures.
 * HTTP layer maps this to 400 status.
 */
export class ValidationError extends Error {
  name = 'ValidationError' as const;

  constructor(message: string) {
    super(message);
  }
}

/**
 * Raw filter parameters (strings from HTTP query params).
 */
export interface RawFilters {
  minConfidence?: string;
  provenance?: string; // CSV of provenance categories
}

/**
 * Response type for getRelationshipsForEntity.
 */
export interface GetRelationshipsResponse {
  relationships: Relationship[];
}

/**
 * Get relationships adjacent to an entity with optional filtering.
 *
 * Validation rules:
 * - projectId: required, non-empty string
 * - entityId: required, non-empty string
 * - minConfidence: if provided, must be a number in [0, 1]
 * - provenance: if provided, must be comma-separated valid categories
 *
 * @param projectId - Project UUID (required)
 * @param entityId - Entity UUID to find adjacent relationships for
 * @param rawFilters - Raw string filters from HTTP query params
 * @returns Response containing array of matching relationships
 * @throws ValidationError if any validation fails
 */
export async function getRelationshipsForEntity(
  projectId: string,
  entityId: string,
  rawFilters: RawFilters = {}
): Promise<GetRelationshipsResponse> {
  // Validate projectId
  if (!projectId || typeof projectId !== 'string' || projectId.trim() === '') {
    throw new ValidationError('project_id is required');
  }

  // Validate entityId
  if (!entityId || typeof entityId !== 'string' || entityId.trim() === '') {
    throw new ValidationError('entity_id is required');
  }

  // Parse and validate minConfidence
  let minConfidence: number | undefined;
  if (rawFilters.minConfidence !== undefined && rawFilters.minConfidence !== '') {
    minConfidence = parseFloat(rawFilters.minConfidence);
    if (isNaN(minConfidence)) {
      throw new ValidationError('min_confidence must be a valid number');
    }
    if (minConfidence < 0 || minConfidence > 1) {
      throw new ValidationError('min_confidence must be between 0 and 1');
    }
  }

  // Parse and validate provenance
  let provenance: ProvenanceCategory[] | undefined;
  if (rawFilters.provenance !== undefined && rawFilters.provenance !== '') {
    const categories = rawFilters.provenance.split(',').map((s) => s.trim());
    provenance = [];
    for (const cat of categories) {
      if (!VALID_PROVENANCE_CATEGORIES.includes(cat as ProvenanceCategory)) {
        throw new ValidationError(
          `Invalid provenance category: "${cat}". ` +
          `Valid categories: ${VALID_PROVENANCE_CATEGORIES.join(', ')}`
        );
      }
      provenance.push(cat as ProvenanceCategory);
    }
  }

  // Delegate to graph service
  const relationships = await graphService.getRelationshipsForEntity(
    projectId.trim(),
    entityId.trim(),
    { minConfidence, provenance }
  );

  return { relationships };
}

