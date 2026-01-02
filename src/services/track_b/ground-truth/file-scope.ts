/**
 * File Scope Definition
 * 
 * Track B: Story B.1 - Ground Truth Engine
 * TDD ID: TDD-TRACKB-B1
 * 
 * CRITICAL: Scope is implemented as an EXPLICIT ALLOWLIST.
 * We do NOT scan the entire repo and then exclude patterns.
 * We start with allowed paths and expand only those.
 */

import { glob } from 'glob';
import path from 'path';

// Scope version - increment when changing scope definition
export const SCOPE_VERSION = 'B1-v1';

// ALLOWLIST: Only these roots are included
export const ALLOWED_ROOTS = [
  'src/**',
  'spec/**',
  'scripts/**',
];

// ALLOWED_FILES: Individual files at repo root
export const ALLOWED_FILES = [
  'package.json',
  'package-lock.json',
  'tsconfig.json',
];

// EXCLUDE patterns (applied within allowlist only)
export const EXCLUDE_PATTERNS = [
  '**/node_modules/**',
  '**/.git/**',
  '**/dist/**',
  '**/build/**',
  '**/.next/**',
  '**/coverage/**',
  '**/.cache/**',
  '**/tmp/**',
  '**/docs/verification/**',  // Avoid evidence changing root
  '**/.DS_Store',
  '**/*.log',
];

/**
 * Get all files in scope using explicit allowlist approach.
 * 
 * @param repoRoot - Absolute path to repository root
 * @returns Sorted array of relative POSIX paths
 */
export async function getFilesInScope(repoRoot: string): Promise<string[]> {
  const allPaths: string[] = [];

  // Step 1: Glob each allowed root pattern
  for (const pattern of ALLOWED_ROOTS) {
    const matches = await glob(pattern, {
      cwd: repoRoot,
      ignore: EXCLUDE_PATTERNS,
      nodir: true,
      dot: false,  // Exclude dotfiles by default
    });
    allPaths.push(...matches);
  }

  // Step 2: Check individual allowed files at root
  for (const file of ALLOWED_FILES) {
    const matches = await glob(file, {
      cwd: repoRoot,
      nodir: true,
    });
    allPaths.push(...matches);
  }

  // Step 3: Deduplicate and sort for determinism
  const uniquePaths = [...new Set(allPaths)];
  
  // Normalize to POSIX (forward slashes) and sort lexicographically
  const normalizedPaths = uniquePaths.map(p => p.split(path.sep).join('/'));
  normalizedPaths.sort();

  return normalizedPaths;
}

/**
 * Get the current scope definition for documentation/evidence.
 */
export function getScopeDefinition(): { scope: string[]; excludes: string[] } {
  return {
    scope: [...ALLOWED_ROOTS, ...ALLOWED_FILES],
    excludes: EXCLUDE_PATTERNS,
  };
}

