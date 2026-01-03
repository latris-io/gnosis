// src/api/v2/entities.ts
// Track B Graph API v2 - Entity Enumeration
// Per CID-2026-01-03: READ-ONLY enumeration for B.3/B.4 graph snapshots

import { withReadOnlyClient, PoolClient } from './db.js';

/**
 * Entity row returned from enumeration query.
 * Explicit columns only (no SELECT *).
 */
export interface EntityRow {
  id: string;
  instance_id: string;
  entity_type: string;
  name: string;
  content_hash: string | null;
  source_file: string | null;
  line_start: number | null;
  line_end: number | null;
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
 * Entity enumeration result.
 */
export interface EntityEnumerationResult {
  project_id: string;
  data: EntityRow[];
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
 * Validate entity type format (E01-E99).
 */
function isValidEntityType(str: string): boolean {
  return /^E[0-9]{2}$/.test(str);
}

/**
 * Enumerate entities of a specific type with pagination.
 * 
 * Uses limit+1 trick for has_more detection:
 * - Fetch limit + 1 rows
 * - Return only limit rows
 * - has_more = fetched > limit
 * 
 * @param projectId - Project UUID (required)
 * @param entityType - Entity type code e.g. "E11" (required)
 * @param limit - Max rows to return (1-1000, default 100)
 * @param offset - Rows to skip (>= 0, default 0)
 * @returns Enumeration result with pagination info
 * @throws ValidationError for invalid inputs
 */
export async function enumerateEntities(
  projectId: string,
  entityType: string,
  limit: number = DEFAULT_LIMIT,
  offset: number = 0
): Promise<EntityEnumerationResult> {
  // Validation
  if (!projectId) {
    throw new ValidationError('project_id is required');
  }
  if (!isValidUUID(projectId)) {
    throw new ValidationError('project_id must be a valid UUID');
  }
  if (!entityType) {
    throw new ValidationError('entity_type is required');
  }
  if (!isValidEntityType(entityType)) {
    throw new ValidationError('entity_type must match E[0-9]{2} (e.g., E01, E11)');
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
    
    const result = await client.query<EntityRow>(
      `SELECT id, instance_id, entity_type, name, content_hash,
              source_file, line_start, line_end, extracted_at
       FROM entities
       WHERE entity_type = $1
         AND project_id = $2
       ORDER BY instance_id, id
       LIMIT $3 OFFSET $4`,
      [entityType, projectId, fetchLimit, offset]
    );

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

