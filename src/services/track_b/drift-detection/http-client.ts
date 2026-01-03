/**
 * B.3 HTTP Client for Graph API v2 Enumeration
 * 
 * Track B: Story B.3 - Drift Detection
 * TDD ID: TDD-TRACKB-B3
 * 
 * All graph reads are HTTP calls to GRAPH_API_V2_URL.
 * NO direct database access. NO imports from src/db/**.
 * 
 * Includes retry/backoff for resilience (B.3 is a gate).
 */

import { EntityDigest, RelationshipDigest } from './types.js';
import { ENTITY_TYPE_CODES } from '../../../schema/track-a/entities.js';

// Retry configuration
const RETRY_STATUS_CODES = [502, 503, 504];
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

// Pagination configuration
const DEFAULT_LIMIT = 1000;

/**
 * V2 API pagination response structure.
 */
interface EnumerationPage<T> {
  project_id: string;
  data: T[];
  page: {
    limit: number;
    offset: number;
    returned: number;
    has_more: boolean;
  };
}

/**
 * Raw entity row from v2 API.
 */
interface EntityRow {
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
 * Raw relationship row from v2 API.
 */
interface RelationshipRow {
  id: string;
  instance_id: string;
  relationship_type: string;
  name: string;
  from_entity_id: string;
  to_entity_id: string;
  content_hash?: string | null;
  confidence: number | null;
  extracted_at: string;
}

/**
 * Fetch with retry/backoff for resilience.
 * Retries on 502, 503, 504 with exponential backoff.
 */
async function fetchWithRetry(url: string): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const resp = await fetch(url);
      
      // Don't retry on client errors or success
      if (!RETRY_STATUS_CODES.includes(resp.status)) {
        return resp;
      }
      
      lastError = new Error(`HTTP ${resp.status} ${resp.statusText}`);
    } catch (err) {
      lastError = err as Error;
    }
    
    // Wait before retrying (exponential backoff)
    if (attempt < MAX_RETRIES) {
      await new Promise(r => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)));
    }
  }
  
  throw lastError ?? new Error('Fetch failed after retries');
}

/**
 * Enumerate all entities across all types from Graph API v2.
 * 
 * PAGINATION STRATEGY (EXPLICIT):
 * - Loop over ALL entity types (ENTITY_TYPE_CODES)
 * - For each type, paginate until has_more=false
 * - This ensures complete enumeration even for large graphs
 * 
 * @param baseUrl - Graph API v2 base URL (e.g., http://localhost:3001)
 * @param projectId - Project UUID
 * @returns All entity digests with entity_type included
 */
export async function enumerateAllEntities(
  baseUrl: string,
  projectId: string
): Promise<EntityDigest[]> {
  const results: EntityDigest[] = [];
  
  // Loop over ALL entity types
  for (const entityType of ENTITY_TYPE_CODES) {
    let offset = 0;
    
    // Paginate within this type until has_more=false
    while (true) {
      const url = `${baseUrl}/api/v2/entities?` +
        `project_id=${encodeURIComponent(projectId)}&` +
        `entity_type=${encodeURIComponent(entityType)}&` +
        `limit=${DEFAULT_LIMIT}&offset=${offset}`;
      
      const resp = await fetchWithRetry(url);
      
      if (!resp.ok) {
        throw new Error(`Entity enumeration failed: ${resp.status} ${resp.statusText}`);
      }
      
      const page = (await resp.json()) as EnumerationPage<EntityRow>;
      
      // Map to EntityDigest WITH entity_type
      for (const row of page.data) {
        results.push({
          instance_id: row.instance_id,
          entity_type: entityType, // Always include type for reporting
          content_hash: row.content_hash,
        });
      }
      
      // Stop when no more pages
      if (!page.page.has_more) break;
      offset += DEFAULT_LIMIT;
    }
  }
  
  return results;
}

/**
 * Enumerate all relationships from Graph API v2.
 * 
 * PAGINATION STRATEGY (EXPLICIT):
 * - Paginate the FULL relationship set (no type filter)
 * - Continue until has_more=false
 * - This ensures complete enumeration
 * 
 * @param baseUrl - Graph API v2 base URL (e.g., http://localhost:3001)
 * @param projectId - Project UUID
 * @returns All relationship digests with content_hash if present
 */
export async function enumerateAllRelationships(
  baseUrl: string,
  projectId: string
): Promise<RelationshipDigest[]> {
  const results: RelationshipDigest[] = [];
  let offset = 0;
  
  // Paginate full relationship set until has_more=false
  while (true) {
    const url = `${baseUrl}/api/v2/relationships?` +
      `project_id=${encodeURIComponent(projectId)}&` +
      `limit=${DEFAULT_LIMIT}&offset=${offset}`;
    
    const resp = await fetchWithRetry(url);
    
    if (!resp.ok) {
      throw new Error(`Relationship enumeration failed: ${resp.status} ${resp.statusText}`);
    }
    
    const page = (await resp.json()) as EnumerationPage<RelationshipRow>;
    
    // Map to RelationshipDigest with content_hash for mutation detection
    for (const row of page.data) {
      results.push({
        instance_id: row.instance_id,
        relationship_type: row.relationship_type,
        from_entity_id: row.from_entity_id,
        to_entity_id: row.to_entity_id,
        content_hash: row.content_hash ?? null, // Include for mutation detection
        confidence: row.confidence,
      });
    }
    
    // Stop when no more pages
    if (!page.page.has_more) break;
    offset += DEFAULT_LIMIT;
  }
  
  return results;
}

/**
 * Check if v2 API is reachable.
 */
export async function checkV2ApiHealth(baseUrl: string): Promise<boolean> {
  try {
    const resp = await fetch(`${baseUrl}/health`);
    return resp.ok;
  } catch {
    return false;
  }
}

