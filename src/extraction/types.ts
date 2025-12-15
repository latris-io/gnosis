// src/extraction/types.ts
// @implements INFRASTRUCTURE
// Per Track A ENTRY.md Constraint A.1

import type { EntityTypeCode } from '../schema/track-a/entities.js';
import type { RelationshipTypeCode } from '../schema/track-a/relationships.js';

/**
 * Represents a snapshot of a repository at a specific point in time.
 * Used as input to extraction providers.
 */
export interface RepoSnapshot {
  id: string;
  root_path: string;
  commit_sha?: string;
  timestamp: Date;
}

/**
 * Interface for extraction providers.
 * Each provider extracts entities and relationships from a specific source type.
 */
export interface ExtractionProvider {
  name: string;
  extract(snapshot: RepoSnapshot): Promise<ExtractionResult>;
  supports(fileType: string): boolean;
}

/**
 * Result of an extraction operation.
 */
export interface ExtractionResult {
  entities: ExtractedEntity[];
  relationships: ExtractedRelationship[];
  evidence: EvidenceAnchor[];
}

/**
 * An entity as extracted from source, before persistence.
 * Uses instance_id (stable business key) rather than UUID.
 */
export interface ExtractedEntity {
  entity_type: EntityTypeCode;
  instance_id: string;
  name: string;
  attributes: Record<string, unknown>;
  source_file: string;
  line_start: number;
  line_end: number;
}

/**
 * A relationship as extracted from source, before persistence.
 * Uses instance_id references (not UUIDs).
 * UUIDs are resolved during persistence after entity upsert.
 */
export interface ExtractedRelationship {
  relationship_type: RelationshipTypeCode;
  instance_id: string;
  name: string;
  from_instance_id: string;  // e.g., "EPIC-64" (resolved to UUID during persistence)
  to_instance_id: string;    // e.g., "STORY-64.1" (resolved to UUID during persistence)
  confidence?: number;
}

/**
 * Provenance anchor for an extracted entity or relationship.
 * Captures the source location and extraction context.
 */
export interface EvidenceAnchor {
  source_file: string;
  line_start: number;
  line_end: number;
  commit_sha: string;
  extraction_timestamp: Date;
  extractor_version: string;
}
