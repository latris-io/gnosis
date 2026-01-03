/**
 * B.3 Diff Computation
 * 
 * Track B: Story B.3 - Drift Detection
 * TDD ID: TDD-TRACKB-B3
 * 
 * Disk-to-disk comparison of graph snapshots.
 * Detects added, deleted, and mutated entities/relationships.
 * 
 * KEY DEFINITIONS:
 *   Entity key: instance_id
 *   Entity mutation: content_hash changed
 *   
 *   Relationship key: instance_id
 *   Relationship mutation: effectiveHash changed
 *     - effectiveHash = content_hash ?? structuralHash
 *     - structuralHash = SHA256(instance_id + '\n' + from + '\n' + to + '\n' + type)
 */

import { 
  GraphSnapshot, 
  EntityDigest, 
  RelationshipDigest, 
  DriftItem, 
  DriftDiff, 
  DriftSummary 
} from './types.js';
import { 
  computeRelationshipEffectiveHash,
  computeRelationshipStructuralHash 
} from './merkle.js';

/**
 * Compute the effective hash for an entity (for mutation comparison).
 * Uses content_hash if present, otherwise 'NULL'.
 */
function entityEffectiveHash(entity: EntityDigest): string {
  return entity.content_hash ?? 'NULL';
}

/**
 * Compute the effective hash for a relationship (for mutation comparison).
 * Uses content_hash if present, otherwise structural hash.
 * 
 * This ensures mutations are detected even when content_hash is null.
 */
function relationshipEffectiveHash(rel: RelationshipDigest): string {
  if (rel.content_hash) {
    return rel.content_hash;
  }
  // Fallback to structural hash when no content_hash
  return computeRelationshipStructuralHash(rel);
}

/**
 * Compute diff between two graph snapshots.
 * 
 * ALGORITHM:
 *   For entities:
 *     - Key = instance_id
 *     - Added: in current but not baseline
 *     - Deleted: in baseline but not current
 *     - Mutated: same key, different content_hash
 *   
 *   For relationships:
 *     - Key = instance_id
 *     - Added: in current but not baseline
 *     - Deleted: in baseline but not current
 *     - Mutated: same key, different effectiveHash
 *       (effectiveHash = content_hash ?? structuralHash)
 * 
 * @param baseline - Baseline snapshot (snapshot_a)
 * @param current - Current snapshot (snapshot_b)
 * @returns DriftDiff with summary and items
 */
export function computeDiff(baseline: GraphSnapshot, current: GraphSnapshot): DriftDiff {
  const items: DriftItem[] = [];
  
  // ===== ENTITY DIFF =====
  const baseEntMap = new Map(baseline.entities.map(e => [e.instance_id, e]));
  const currEntMap = new Map(current.entities.map(e => [e.instance_id, e]));
  
  // Added entities: in current but not baseline
  for (const [id, entity] of currEntMap) {
    if (!baseEntMap.has(id)) {
      items.push({
        category: 'entity',
        change_type: 'added',
        instance_id: id,
        entity_type: entity.entity_type,
      });
    }
  }
  
  // Deleted entities: in baseline but not current
  for (const [id, entity] of baseEntMap) {
    if (!currEntMap.has(id)) {
      items.push({
        category: 'entity',
        change_type: 'deleted',
        instance_id: id,
        entity_type: entity.entity_type,
      });
    }
  }
  
  // Mutated entities: same key, different content_hash
  for (const [id, currEntity] of currEntMap) {
    const baseEntity = baseEntMap.get(id);
    if (baseEntity) {
      const baseHash = entityEffectiveHash(baseEntity);
      const currHash = entityEffectiveHash(currEntity);
      
      if (baseHash !== currHash) {
        items.push({
          category: 'entity',
          change_type: 'mutated',
          instance_id: id,
          entity_type: currEntity.entity_type,
          old_hash: baseHash,
          new_hash: currHash,
        });
      }
    }
  }
  
  // ===== RELATIONSHIP DIFF =====
  const baseRelMap = new Map(baseline.relationships.map(r => [r.instance_id, r]));
  const currRelMap = new Map(current.relationships.map(r => [r.instance_id, r]));
  
  // Added relationships: in current but not baseline
  for (const [id, rel] of currRelMap) {
    if (!baseRelMap.has(id)) {
      items.push({
        category: 'relationship',
        change_type: 'added',
        instance_id: id,
        relationship_type: rel.relationship_type,
      });
    }
  }
  
  // Deleted relationships: in baseline but not current
  for (const [id, rel] of baseRelMap) {
    if (!currRelMap.has(id)) {
      items.push({
        category: 'relationship',
        change_type: 'deleted',
        instance_id: id,
        relationship_type: rel.relationship_type,
      });
    }
  }
  
  // Mutated relationships: same key, different effectiveHash
  // This detects mutations even when content_hash is null
  for (const [id, currRel] of currRelMap) {
    const baseRel = baseRelMap.get(id);
    if (baseRel) {
      const baseHash = relationshipEffectiveHash(baseRel);
      const currHash = relationshipEffectiveHash(currRel);
      
      if (baseHash !== currHash) {
        items.push({
          category: 'relationship',
          change_type: 'mutated',
          instance_id: id,
          relationship_type: currRel.relationship_type,
          old_hash: baseHash,
          new_hash: currHash,
        });
      }
    }
  }
  
  // ===== COMPUTE SUMMARY =====
  const summary: DriftSummary = {
    entities_added: items.filter(i => i.category === 'entity' && i.change_type === 'added').length,
    entities_deleted: items.filter(i => i.category === 'entity' && i.change_type === 'deleted').length,
    entities_mutated: items.filter(i => i.category === 'entity' && i.change_type === 'mutated').length,
    relationships_added: items.filter(i => i.category === 'relationship' && i.change_type === 'added').length,
    relationships_deleted: items.filter(i => i.category === 'relationship' && i.change_type === 'deleted').length,
    relationships_mutated: items.filter(i => i.category === 'relationship' && i.change_type === 'mutated').length,
    total_drift_items: items.length,
  };
  
  return {
    snapshot_a: baseline.id,
    snapshot_b: current.id,
    computed_at: new Date().toISOString(),
    summary,
    items,
  };
}

