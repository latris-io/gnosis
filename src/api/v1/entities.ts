// src/api/v1/entities.ts
// @implements STORY-64.1
// Entity API - project-scoped operations only
// Delegates to entity service - NO direct DB imports

import * as entityService from '../../services/entities/entity-service.js';
import type { Entity, EntityTypeCode } from '../../schema/track-a/entities.js';
import type { ExtractedEntity, EvidenceAnchor } from '../../extraction/types.js';

/**
 * Create or update an entity.
 * Delegates to entity service for upsert with content_hash detection.
 * 
 * @param projectId - Project UUID for isolation
 * @param extracted - Extracted entity data
 * @param evidence - Optional evidence anchor
 * @returns The created/updated entity, or null if NO-OP
 */
export async function createEntity(
  projectId: string,
  extracted: ExtractedEntity,
  evidence?: EvidenceAnchor
): Promise<{ entity: Entity | null; operation: 'CREATE' | 'UPDATE' | 'NO-OP' }> {
  return entityService.upsert(projectId, extracted, evidence);
}

/**
 * Get entity by UUID.
 * 
 * @param projectId - Project UUID for isolation
 * @param id - Entity UUID
 */
export async function getEntity(
  projectId: string,
  id: string
): Promise<Entity | null> {
  return entityService.getById(projectId, id);
}

/**
 * Get entity by instance_id (business key).
 * 
 * @param projectId - Project UUID for isolation
 * @param instanceId - Entity instance_id (e.g., "STORY-64.1")
 */
export async function getEntityByInstanceId(
  projectId: string,
  instanceId: string
): Promise<Entity | null> {
  return entityService.getByInstanceId(projectId, instanceId);
}

/**
 * Query entities by type.
 * 
 * @param projectId - Project UUID for isolation
 * @param entityType - Entity type code (E01, E02, etc.)
 */
export async function queryEntities(
  projectId: string,
  entityType: EntityTypeCode
): Promise<Entity[]> {
  return entityService.queryByType(projectId, entityType);
}

/**
 * Get all entities for a project.
 * 
 * @param projectId - Project UUID for isolation
 */
export async function getAllEntities(projectId: string): Promise<Entity[]> {
  return entityService.getAll(projectId);
}

/**
 * Get entity counts by type.
 * 
 * @param projectId - Project UUID for isolation
 */
export async function getEntityCounts(
  projectId: string
): Promise<Record<EntityTypeCode, number>> {
  return entityService.countByType(projectId);
}

/**
 * Batch create/update entities.
 * 
 * @param projectId - Project UUID for isolation
 * @param entities - Array of extracted entities
 */
export async function batchCreateEntities(
  projectId: string,
  entities: ExtractedEntity[]
): Promise<{ entity: Entity | null; operation: 'CREATE' | 'UPDATE' | 'NO-OP' }[]> {
  return entityService.batchUpsert(projectId, entities);
}
