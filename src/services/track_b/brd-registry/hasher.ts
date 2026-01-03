// src/services/track_b/brd-registry/hasher.ts
// Track B-owned content hasher
// Same algorithm as Track A but independently implemented (governance choice)

import * as crypto from 'crypto';
import * as fs from 'fs';
import { execSync } from 'child_process';

/**
 * Normalize content for deterministic hashing.
 * 
 * @param content - Raw file content
 * @returns Normalized content
 */
export function normalizeContent(content: string): string {
  // Remove BOM if present
  let normalized = content.replace(/^\uFEFF/, '');
  
  // Normalize line endings to \n
  normalized = normalized.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Trim trailing whitespace per line
  normalized = normalized
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n');
  
  return normalized;
}

/**
 * Compute SHA256 hash of content.
 * 
 * @param content - Content to hash (will be normalized first)
 * @returns Hash in format "sha256:{hex}"
 */
export function computeContentHash(content: string): string {
  const normalized = normalizeContent(content);
  const hash = crypto.createHash('sha256').update(normalized, 'utf8').digest('hex');
  return `sha256:${hash}`;
}

/**
 * Compute BRD hash with source tracking.
 * Attempts git blob hash first, falls back to filesystem.
 * 
 * @param brdPath - Path to BRD file
 * @returns Hash and source information
 */
export function computeBrdHash(brdPath: string): { hash: string; source: 'git_blob' | 'filesystem_fallback' } {
  // Try git blob hash first
  try {
    const result = execSync(`git ls-tree HEAD "${brdPath}"`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    
    // Format: "100644 blob <sha> <path>"
    const match = result.match(/blob\s+([a-f0-9]{40})/);
    if (match) {
      return {
        hash: `sha256:${match[1]}`,
        source: 'git_blob',
      };
    }
  } catch {
    // Git command failed, fall back to filesystem
  }
  
  // Fallback: read file and compute hash
  try {
    const content = fs.readFileSync(brdPath, 'utf-8');
    return {
      hash: computeContentHash(content),
      source: 'filesystem_fallback',
    };
  } catch (error) {
    throw new Error(`Failed to compute BRD hash: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Compute hash of file from disk.
 * 
 * @param filePath - Path to file
 * @returns Hash in format "sha256:{hex}"
 */
export function computeFileHash(filePath: string): string {
  const content = fs.readFileSync(filePath, 'utf-8');
  return computeContentHash(content);
}

