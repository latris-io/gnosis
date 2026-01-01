// src/api/v1/traversal.ts
// @implements STORY-64.5
//
// Programmatic API for multi-hop graph traversal.
// This module owns ALL validation and parsing — HTTP layer is transport only.

import * as traversalService from '../../services/graph/traversal-service.js';
import {
  VALID_PROVENANCE_CATEGORIES,
  type ProvenanceCategory,
} from '../../services/graph/provenance.js';
import type { TraversalResult } from '../../services/graph/traversal-service.js';
import { ValidationError } from './relationships.js';

// Re-export for convenience
export { ValidationError };
export type { TraversalResult };

/**
 * Request body for traverse endpoint.
 */
export interface TraverseRequest {
  project_id: string;
  start_id: string;
  max_depth: number;
  min_confidence?: number;
  provenance?: string[];
}

/**
 * Perform bounded BFS traversal from a starting entity.
 *
 * Validation rules:
 * - project_id: required, non-empty string
 * - start_id: required, non-empty string
 * - max_depth: required, must be number in [1, 10] (SAFETY CONSTRAINT)
 * - min_confidence: if provided, must be number in [0, 1]
 * - provenance: if provided, must be array of valid categories
 *
 * @param request - Traversal request parameters
 * @returns TraversalResult containing discovered nodes and edges
 * @throws ValidationError if any validation fails
 */
export async function traverse(request: TraverseRequest): Promise<TraversalResult> {
  // Validate project_id
  if (!request.project_id || typeof request.project_id !== 'string' || request.project_id.trim() === '') {
    throw new ValidationError('project_id is required');
  }

  // Validate start_id
  if (!request.start_id || typeof request.start_id !== 'string' || request.start_id.trim() === '') {
    throw new ValidationError('start_id is required');
  }

  // Validate max_depth
  if (request.max_depth === undefined || request.max_depth === null) {
    throw new ValidationError('max_depth is required');
  }
  if (typeof request.max_depth !== 'number' || !Number.isInteger(request.max_depth)) {
    throw new ValidationError('max_depth must be an integer');
  }
  // SAFETY CONSTRAINT: max_depth 1..10
  if (request.max_depth < 1 || request.max_depth > 10) {
    throw new ValidationError('max_depth must be between 1 and 10');
  }

  // Validate min_confidence if provided
  let minConfidence: number | undefined;
  if (request.min_confidence !== undefined && request.min_confidence !== null) {
    if (typeof request.min_confidence !== 'number') {
      throw new ValidationError('min_confidence must be a number');
    }
    if (request.min_confidence < 0 || request.min_confidence > 1) {
      throw new ValidationError('min_confidence must be between 0 and 1');
    }
    minConfidence = request.min_confidence;
  }

  // Validate provenance if provided
  let provenance: ProvenanceCategory[] | undefined;
  if (request.provenance !== undefined && request.provenance !== null) {
    if (!Array.isArray(request.provenance)) {
      throw new ValidationError('provenance must be an array');
    }
    provenance = [];
    for (const cat of request.provenance) {
      if (typeof cat !== 'string') {
        throw new ValidationError('provenance array must contain strings');
      }
      if (!VALID_PROVENANCE_CATEGORIES.includes(cat as ProvenanceCategory)) {
        throw new ValidationError(
          `Invalid provenance category: "${cat}". ` +
          `Valid categories: ${VALID_PROVENANCE_CATEGORIES.join(', ')}`
        );
      }
      provenance.push(cat as ProvenanceCategory);
    }
  }

  // Delegate to traversal service
  return traversalService.traverse(
    request.project_id.trim(),
    request.start_id.trim(),
    {
      maxDepth: request.max_depth,
      minConfidence,
      provenance,
    }
  );
}

