// src/api/v2/relationships.ts
// Track B Graph API v2 - Relationship Enumeration
// Per CID-2026-01-03: READ-ONLY enumeration for B.3/B.4 graph snapshots

import { withReadOnlyClient, PoolClient } from './db.js';

/**
 * Relationship row returned from enumeration query.
 * Explicit columns only (no SELECT *).
 */
export interface RelationshipRow {
  id: string;
  instance_id: string;
  relationship_type: string;
  name: string;
  from_entity_id: string;
  to_entity_id: string;
  confidence: number;
  extracted_at: string;
}

/**
 * Pagination metadata.
 */
export interface PageInfo {
  limit: number;
  offset: number;
  returned: number;
  has_more: boolean;
}

/**
 * Relationship enumeration result.
 */
export interface RelationshipEnumerationResult {
  project_id: string;
  data: RelationshipRow[];
  page: PageInfo;
}

/**
 * Validation error for bad input.
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Max limit per request
const MAX_LIMIT = 1000;
const DEFAULT_LIMIT = 100;

/**
 * Validate UUID format.
 */
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Validate relationship type format (R00-R99).
 */
function isValidRelationshipType(str: string): boolean {
  return /^R[0-9]{2}$/.test(str);
}

/**
 * Enumerate relationships with optional type filter and pagination.
 * 
 * Uses limit+1 trick for has_more detection:
 * - Fetch limit + 1 rows
 * - Return only limit rows
 * - has_more = fetched > limit
 * 
 * @param projectId - Project UUID (required)
 * @param relationshipType - Optional filter by type code e.g. "R21"
 * @param limit - Max rows to return (1-1000, default 100)
 * @param offset - Rows to skip (>= 0, default 0)
 * @returns Enumeration result with pagination info
 * @throws ValidationError for invalid inputs
 */
export async function enumerateRelationships(
  projectId: string,
  relationshipType: string | undefined,
  limit: number = DEFAULT_LIMIT,
  offset: number = 0
): Promise<RelationshipEnumerationResult> {
  // Validation
  if (!projectId) {
    throw new ValidationError('project_id is required');
  }
  if (!isValidUUID(projectId)) {
    throw new ValidationError('project_id must be a valid UUID');
  }
  if (relationshipType !== undefined && !isValidRelationshipType(relationshipType)) {
    throw new ValidationError('relationship_type must match R[0-9]{2} (e.g., R01, R21)');
  }
  if (limit < 1 || limit > MAX_LIMIT) {
    throw new ValidationError(`limit must be between 1 and ${MAX_LIMIT}`);
  }
  if (offset < 0) {
    throw new ValidationError('offset must be >= 0');
  }

  return withReadOnlyClient(projectId, async (client: PoolClient) => {
    // Fetch limit + 1 for has_more detection
    const fetchLimit = limit + 1;
    
    let result;
    if (relationshipType) {
      // Filtered by type
      result = await client.query<RelationshipRow>(
        `SELECT id, instance_id, relationship_type, name,
                from_entity_id, to_entity_id, confidence, extracted_at
         FROM relationships
         WHERE relationship_type = $1
           AND project_id = $2
         ORDER BY instance_id, id
         LIMIT $3 OFFSET $4`,
        [relationshipType, projectId, fetchLimit, offset]
      );
    } else {
      // All relationships
      result = await client.query<RelationshipRow>(
        `SELECT id, instance_id, relationship_type, name,
                from_entity_id, to_entity_id, confidence, extracted_at
         FROM relationships
         WHERE project_id = $1
         ORDER BY instance_id, id
         LIMIT $2 OFFSET $3`,
        [projectId, fetchLimit, offset]
      );
    }

    const fetched = result.rows;
    const hasMore = fetched.length > limit;
    const data = hasMore ? fetched.slice(0, limit) : fetched;

    return {
      project_id: projectId,
      data,
      page: {
        limit,
        offset,
        returned: data.length,
        has_more: hasMore,
      },
    };
  });
}

