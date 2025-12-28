// src/extraction/evidence-path.ts
// @implements STORY-64.3
// @satisfies AC-64.3.1
//
// Evidence path normalizer - ensures all source_file paths are repo-relative.
// Used across all extraction providers to ensure portable evidence anchors.

import * as path from 'path';

/**
 * Normalize a source file path to be repo-relative.
 * 
 * Rules:
 * 1. If path is already relative, return as-is
 * 2. If path is absolute and within repoRoot, make relative
 * 3. If path is absolute and OUTSIDE repoRoot, throw error (evidence corruption)
 * 
 * @param sourcePath - The source file path to normalize
 * @param repoRoot - The repository root directory (defaults to process.cwd())
 * @returns Normalized repo-relative path
 * @throws Error if path is absolute but outside repo root
 */
export function normalizeEvidencePath(
  sourcePath: string,
  repoRoot: string = process.cwd()
): string {
  // Empty paths pass through (will be caught by validation later)
  if (!sourcePath) {
    return sourcePath;
  }

  // Already relative - return as-is
  if (!path.isAbsolute(sourcePath)) {
    return sourcePath;
  }

  // Absolute path - normalize to repo-relative
  const normalizedRepo = path.normalize(repoRoot);
  const normalizedSource = path.normalize(sourcePath);

  // Check if path is within repo root
  if (!normalizedSource.startsWith(normalizedRepo)) {
    throw new Error(
      `Evidence path corruption: absolute path '${sourcePath}' is outside repo root '${repoRoot}'`
    );
  }

  // Make relative to repo root
  const relativePath = path.relative(repoRoot, normalizedSource);
  
  return relativePath;
}

/**
 * Validate that a path is repo-relative (not absolute).
 * Does not throw - returns validation result.
 * 
 * @param sourcePath - Path to validate
 * @returns true if valid (relative), false if invalid (absolute)
 */
export function isValidEvidencePath(sourcePath: string): boolean {
  if (!sourcePath) return true; // Empty is handled elsewhere
  return !path.isAbsolute(sourcePath);
}

/**
 * Assert that a path is repo-relative.
 * Throws if path is absolute.
 * 
 * @param sourcePath - Path to assert
 * @param context - Context for error message (e.g., relationship type)
 * @throws Error if path is absolute
 */
export function assertValidEvidencePath(
  sourcePath: string,
  context: string = 'evidence'
): void {
  if (path.isAbsolute(sourcePath)) {
    throw new Error(
      `Invalid ${context} path: '${sourcePath}' is absolute. Must be repo-relative.`
    );
  }
}

