/**
 * Merkle Root Computation (B.1.2)
 * 
 * Track B: Story B.1 - Ground Truth Engine
 * TDD ID: TDD-TRACKB-B1
 * 
 * Deterministic Merkle tree construction for file manifests.
 * 
 * LEAF HASH FORMULA (documented for reproducibility):
 *   Leaf = SHA256(path + '\n' + sha256)
 * 
 * TREE CONSTRUCTION:
 *   1. Sort files by path (already done by manifest)
 *   2. Compute leaf hash for each file
 *   3. Build tree pairwise: parent = SHA256(left + right)
 *   4. If odd number of nodes, duplicate last node
 *   5. Repeat until single root remains
 */

import * as crypto from 'crypto';
import { FileManifest } from './types.js';

/**
 * Compute SHA-256 hash of a string, returning hex.
 */
function sha256(data: string): string {
  return crypto.createHash('sha256').update(data, 'utf-8').digest('hex');
}

/**
 * Compute leaf hash for a file.
 * Formula: SHA256(path + '\n' + sha256)
 */
function computeLeafHash(file: FileManifest): string {
  return sha256(`${file.path}\n${file.sha256}`);
}

/**
 * Combine two hashes into a parent hash.
 * Formula: SHA256(left + right)
 */
function combineHashes(left: string, right: string): string {
  return sha256(left + right);
}

/**
 * Compute the Merkle root for a list of file manifests.
 * 
 * The files MUST be sorted by path for determinism.
 * If the list is empty, returns a hash of empty string.
 * 
 * @param files - Sorted array of file manifests
 * @returns Hex SHA-256 Merkle root
 */
export function computeMerkleRoot(files: FileManifest[]): string {
  // Empty case: hash of empty string
  if (files.length === 0) {
    return sha256('');
  }
  
  // Single file case
  if (files.length === 1) {
    return computeLeafHash(files[0]);
  }
  
  // Compute all leaf hashes
  let level: string[] = files.map(computeLeafHash);
  
  // Build tree bottom-up
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
 * Verify that a Merkle root matches expected value.
 */
export function verifyMerkleRoot(files: FileManifest[], expectedRoot: string): boolean {
  const computedRoot = computeMerkleRoot(files);
  return computedRoot === expectedRoot;
}

