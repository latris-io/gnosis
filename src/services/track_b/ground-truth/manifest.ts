/**
 * Manifest Generation (B.1.1)
 * 
 * Track B: Story B.1 - Ground Truth Engine
 * TDD ID: TDD-TRACKB-B1
 * 
 * Generates a deterministic manifest of all files in scope with SHA-256 hashes.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { FileManifest, GroundTruthManifest } from './types.js';
import { getFilesInScope, getScopeDefinition, SCOPE_VERSION } from './file-scope.js';
import { computeMerkleRoot } from './merkle.js';

/**
 * Compute SHA-256 hash of a file.
 */
async function computeFileHash(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    
    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

/**
 * Get file stats (size, mtime).
 */
async function getFileStats(filePath: string): Promise<{ size: number; mtime: string }> {
  const stats = await fs.promises.stat(filePath);
  return {
    size: stats.size,
    mtime: stats.mtime.toISOString(),
  };
}

/**
 * Generate a complete ground truth manifest for the repository.
 * 
 * @param repoRoot - Absolute path to repository root
 * @returns Complete manifest with all files, hashes, and Merkle root
 */
export async function generateManifest(repoRoot: string): Promise<GroundTruthManifest> {
  // Get all files in scope (already sorted)
  const filePaths = await getFilesInScope(repoRoot);
  
  // Build file manifests
  const files: FileManifest[] = [];
  
  for (const relativePath of filePaths) {
    const absolutePath = path.join(repoRoot, relativePath);
    
    try {
      const [sha256, stats] = await Promise.all([
        computeFileHash(absolutePath),
        getFileStats(absolutePath),
      ]);
      
      files.push({
        path: relativePath,
        sha256,
        size: stats.size,
        mtime: stats.mtime,
      });
    } catch (error) {
      // Skip files that can't be read (e.g., permission issues)
      console.warn(`Warning: Could not read file ${relativePath}:`, error);
    }
  }
  
  // Compute Merkle root
  const merkleRoot = computeMerkleRoot(files);
  
  // Get scope definition
  const scopeDef = getScopeDefinition();
  
  return {
    generated_at: new Date().toISOString(),
    merkle_root: merkleRoot,
    file_count: files.length,
    scope: scopeDef.scope,
    excludes: scopeDef.excludes,
    files,
  };
}

/**
 * Load a manifest from a JSON file.
 */
export async function loadManifest(filePath: string): Promise<GroundTruthManifest> {
  const content = await fs.promises.readFile(filePath, 'utf-8');
  return JSON.parse(content) as GroundTruthManifest;
}

/**
 * Save a manifest to a JSON file.
 */
export async function saveManifest(manifest: GroundTruthManifest, filePath: string): Promise<void> {
  const dir = path.dirname(filePath);
  await fs.promises.mkdir(dir, { recursive: true });
  await fs.promises.writeFile(filePath, JSON.stringify(manifest, null, 2));
}

