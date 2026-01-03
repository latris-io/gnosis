/**
 * B.3 Merkle Root Computation
 * 
 * Track B: Story B.3 - Drift Detection
 * TDD ID: TDD-TRACKB-B3
 * 
 * Deterministic Merkle tree construction for entity and relationship digests.
 * Same algorithm as B.1, adapted for graph snapshot data.
 * 
 * ENTITY LEAF HASH FORMULA:
 *   SHA256(instance_id + '\n' + (content_hash ?? 'NULL'))
 * 
 * RELATIONSHIP LEAF HASH FORMULA:
 *   If content_hash present: SHA256(instance_id + '\n' + content_hash)
 *   Else (fallback): SHA256(instance_id + '\n' + from_entity_id + '\n' + to_entity_id + '\n' + relationship_type)
 * 
 * TREE CONSTRUCTION:
 *   1. Sort by instance_id (deterministic ordering)
 *   2. Compute leaf hash for each item
 *   3. Build tree pairwise: parent = SHA256(left + right)
 *   4. If odd number of nodes, duplicate last node
 *   5. Repeat until single root remains
 */

import * as crypto from 'crypto';
import { EntityDigest, RelationshipDigest } from './types.js';

/**
 * Compute SHA-256 hash of a string, returning hex.
 */
function sha256(data: string): string {
  return crypto.createHash('sha256').update(data, 'utf-8').digest('hex');
}

/**
 * Compute leaf hash for an entity digest.
 * Formula: SHA256(instance_id + '\n' + (content_hash ?? 'NULL'))
 */
export function computeEntityLeafHash(entity: EntityDigest): string {
  const hashPart = entity.content_hash ?? 'NULL';
  return sha256(`${entity.instance_id}\n${hashPart}`);
}

/**
 * Compute structural hash for a relationship (fallback when no content_hash).
 * Formula: SHA256(instance_id + '\n' + from_entity_id + '\n' + to_entity_id + '\n' + relationship_type)
 */
export function computeRelationshipStructuralHash(rel: RelationshipDigest): string {
  return sha256(`${rel.instance_id}\n${rel.from_entity_id}\n${rel.to_entity_id}\n${rel.relationship_type}`);
}

/**
 * Compute effective hash for a relationship (for mutation detection).
 * Uses content_hash if present, otherwise falls back to structural hash.
 */
export function computeRelationshipEffectiveHash(rel: RelationshipDigest): string {
  if (rel.content_hash) {
    return sha256(`${rel.instance_id}\n${rel.content_hash}`);
  }
  return computeRelationshipStructuralHash(rel);
}

/**
 * Compute leaf hash for a relationship digest.
 * Uses content_hash if present, otherwise structural fields.
 */
export function computeRelationshipLeafHash(rel: RelationshipDigest): string {
  return computeRelationshipEffectiveHash(rel);
}

/**
 * Combine two hashes into a parent hash.
 * Formula: SHA256(left + right)
 */
function combineHashes(left: string, right: string): string {
  return sha256(left + right);
}

/**
 * Build Merkle tree from leaf hashes.
 * Returns the root hash.
 */
function buildMerkleTree(leafHashes: string[]): string {
  // Empty case: hash of empty string
  if (leafHashes.length === 0) {
    return sha256('');
  }
  
  // Single item case
  if (leafHashes.length === 1) {
    return leafHashes[0];
  }
  
  // Build tree bottom-up
  let level = [...leafHashes];
  
  while (level.length > 1) {
    const nextLevel: string[] = [];
    
    for (let i = 0; i < level.length; i += 2) {
      const left = level[i];
      // If odd number of nodes, duplicate the last one
      const right = level[i + 1] ?? level[i];
      nextLevel.push(combineHashes(left, right));
    }
    
    level = nextLevel;
  }
  
  return level[0];
}

/**
 * Compute Merkle root for entity digests.
 * 
 * @param entities - Array of entity digests (will be sorted by instance_id)
 * @returns SHA-256 hex Merkle root
 */
export function computeEntityMerkleRoot(entities: EntityDigest[]): string {
  // Sort by instance_id for determinism
  const sorted = [...entities].sort((a, b) => a.instance_id.localeCompare(b.instance_id));
  
  // Compute leaf hashes
  const leafHashes = sorted.map(computeEntityLeafHash);
  
  // Build tree
  return buildMerkleTree(leafHashes);
}

/**
 * Compute Merkle root for relationship digests.
 * 
 * @param relationships - Array of relationship digests (will be sorted by instance_id)
 * @returns SHA-256 hex Merkle root
 */
export function computeRelationshipMerkleRoot(relationships: RelationshipDigest[]): string {
  // Sort by instance_id for determinism
  const sorted = [...relationships].sort((a, b) => a.instance_id.localeCompare(b.instance_id));
  
  // Compute leaf hashes
  const leafHashes = sorted.map(computeRelationshipLeafHash);
  
  // Build tree
  return buildMerkleTree(leafHashes);
}

