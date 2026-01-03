// src/track_b/http/types.ts
// Track B HTTP Layer - Shared Types
// Per CID-2026-01-03: HTTP handlers are thin wrappers, no DB imports

/**
 * Query parameters for entity enumeration endpoint.
 */
export interface EntityQueryParams {
  project_id?: string;
  entity_type?: string;
  limit?: string;
  offset?: string;
}

/**
 * Query parameters for relationship enumeration endpoint.
 */
export interface RelationshipQueryParams {
  project_id?: string;
  relationship_type?: string;
  limit?: string;
  offset?: string;
}

/**
 * Standard error response.
 */
export interface ErrorResponse {
  error: string;
}

