// src/services/graph/graph-service.ts
// @implements STORY-64.5
// @satisfies AC-64.5.3
// @satisfies AC-64.5.4
//
// Single-hop relationship read service for Graph API V1.
// Composes relationshipService.getAll() and applies filters.
// Read-only — no write operations.

import * as relationshipService from '../relationships/relationship-service.js';
import { matchesProvenance, type ProvenanceCategory } from './provenance.js';
import type { Relationship } from '../../schema/track-a/relationships.js';

/**
 * Filters for getRelationshipsForEntity.
 */
export interface RelationshipFilters {
  /** Minimum confidence threshold (inclusive). AC-64.5.3 */
  minConfidence?: number;
  /** Allowed provenance categories. AC-64.5.4 */
  provenance?: ProvenanceCategory[];
}

/**
 * Get all relationships adjacent to an entity (single-hop).
 *
 * Implementation:
 * 1. Fetch all relationships for project via relationshipService.getAll()
 * 2. Filter by adjacency: from_entity_id === entityId OR to_entity_id === entityId
 * 3. Apply minConfidence filter (AC-64.5.3): confidence >= minConfidence
 * 4. Apply provenance filter (AC-64.5.4): matchesProvenance(relationship_type, allowed)
 *
 * @param projectId - Project UUID (required for RLS)
 * @param entityId - Entity UUID to find adjacent relationships for
 * @param filters - Optional filters for confidence and provenance
 * @returns Array of adjacent relationships matching all filters
 */
export async function getRelationshipsForEntity(
  projectId: string,
  entityId: string,
  filters: RelationshipFilters = {}
): Promise<Relationship[]> {
  // Fetch all relationships for project (RLS-scoped)
  const all = await relationshipService.getAll(projectId);

  return all.filter((r) => {
    // Adjacency filter: relationship must touch this entity
    if (r.from_entity_id !== entityId && r.to_entity_id !== entityId) {
      return false;
    }

    // Confidence filter (AC-64.5.3)
    // Schema guarantees confidence is non-null with default, so direct comparison is safe
    if (filters.minConfidence !== undefined && r.confidence < filters.minConfidence) {
      return false;
    }

    // Provenance filter (AC-64.5.4)
    // Use matchesProvenance which treats unknown R-codes as excluded
    if (filters.provenance?.length && !matchesProvenance(r.relationship_type, filters.provenance)) {
      return false;
    }

    return true;
  });
}

