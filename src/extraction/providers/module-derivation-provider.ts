// src/extraction/providers/module-derivation-provider.ts
// @implements STORY-64.1
// @tdd TDD-A1-ENTITY-REGISTRY
// Derives E15 Module entities from E11 SourceFile directory structure
// Provider purity: NO imports from src/db/*

import * as path from 'path';
import type { ExtractedEntity } from '../types.js';

/**
 * Input type for E11 SourceFile entities used in derivation.
 * These come from the database or from extraction results.
 */
export interface SourceFileInput {
  instance_id: string;     // e.g., 'FILE-src/services/entity-service.ts'
  source_file: string;     // Full path for evidence
  line_start: number;
  line_end: number;
}

/**
 * Validation result for module semantics.
 */
export interface ModuleValidationResult {
  valid: ExtractedEntity[];
  invalid: ExtractedEntity[];
}

/**
 * Normalize a directory path:
 * - Use Unix separators (/)
 * - No leading ./
 * - No trailing /
 */
function normalizePath(dirPath: string): string {
  // Convert backslashes to forward slashes
  let normalized = dirPath.replace(/\\/g, '/');
  // Remove leading ./
  while (normalized.startsWith('./')) {
    normalized = normalized.slice(2);
  }
  // Remove trailing /
  while (normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }
  return normalized;
}

/**
 * Extract directory from a FILE-prefixed instance_id.
 * Returns null for root-level files (dirname is '.' or empty).
 */
function getDirectoryFromFileInstanceId(instanceId: string): string | null {
  // Extract path from FILE-<path>
  if (!instanceId.startsWith('FILE-')) {
    return null;
  }
  const filePath = instanceId.slice(5); // Remove 'FILE-' prefix
  const dirPath = path.posix.dirname(filePath);
  
  // Skip root-level files
  if (dirPath === '.' || dirPath === '' || dirPath === '/') {
    return null;
  }
  
  return normalizePath(dirPath);
}

/**
 * Derive E15 Module entities from E11 SourceFile entities.
 * 
 * Semantics:
 * - E15 modules are derived from unique parent directories of E11 files
 * - Skips root-level files (dirname is '.' or empty)
 * - Witness file: lexicographically smallest instance_id in that directory
 * - Evidence anchoring comes from the witness file
 * 
 * Note: E15 has no native location; witness anchoring is a deterministic
 * pointer, not semantically meaningful.
 */
export function deriveModulesFromFiles(sourceFiles: SourceFileInput[]): ExtractedEntity[] {
  // Group files by directory
  const dirToFiles = new Map<string, SourceFileInput[]>();
  
  for (const file of sourceFiles) {
    const dir = getDirectoryFromFileInstanceId(file.instance_id);
    if (dir === null) {
      // Skip root-level files
      continue;
    }
    
    if (!dirToFiles.has(dir)) {
      dirToFiles.set(dir, []);
    }
    dirToFiles.get(dir)!.push(file);
  }
  
  const modules: ExtractedEntity[] = [];
  
  // Create module for each unique directory
  for (const [dir, files] of dirToFiles) {
    // Sort files by instance_id to get deterministic witness
    const sortedFiles = [...files].sort((a, b) => 
      a.instance_id.localeCompare(b.instance_id)
    );
    
    // Witness file is the lexicographically smallest instance_id
    const witness = sortedFiles[0];
    
    const moduleInstanceId = `MOD-${dir}`;
    
    modules.push({
      entity_type: 'E15',
      instance_id: moduleInstanceId,
      name: dir,
      attributes: {
        derived_from: 'directory-structure',
        path: dir,
        file_count: files.length,
      },
      // Evidence from witness file (deterministic, best-available)
      source_file: witness.source_file,
      line_start: witness.line_start,
      line_end: witness.line_end,
    });
  }
  
  return modules;
}

/**
 * Validate E15 module semantics against E11 file corpus.
 * 
 * Semantics Rule (single source-of-truth check):
 * MOD-<dir> is valid iff there exists at least one E11 with instance_id prefix FILE-<dir>/
 * 
 * This rule eliminates npm packages (no backing E11 files) without
 * hardcoding package names or debating edge cases.
 */
export function validateModuleSemantics(
  modules: ExtractedEntity[],
  e11Files: SourceFileInput[]
): ModuleValidationResult {
  const valid: ExtractedEntity[] = [];
  const invalid: ExtractedEntity[] = [];
  
  // Build set of valid directory prefixes from E11 files
  const validPrefixes = new Set<string>();
  for (const file of e11Files) {
    const dir = getDirectoryFromFileInstanceId(file.instance_id);
    if (dir !== null) {
      validPrefixes.add(dir);
    }
  }
  
  for (const module of modules) {
    // Extract directory from MOD-<dir>
    if (!module.instance_id.startsWith('MOD-')) {
      invalid.push(module);
      continue;
    }
    
    const moduleDir = module.instance_id.slice(4); // Remove 'MOD-' prefix
    
    // Check if any E11 file has this directory as prefix
    // MOD-<dir> is valid iff there exists FILE-<dir>/...
    const hasBackingFile = validPrefixes.has(moduleDir);
    
    if (hasBackingFile) {
      valid.push(module);
    } else {
      invalid.push(module);
    }
  }
  
  return { valid, invalid };
}

/**
 * Derivation provider class following existing patterns.
 * Note: This provider does NOT implement ExtractionProvider interface
 * because it derives from existing entities, not from RepoSnapshot.
 */
export class ModuleDerivationProvider {
  name = 'module-derivation-provider';
  
  /**
   * Derive E15 modules from E11 source files.
   */
  deriveModules(sourceFiles: SourceFileInput[]): ExtractedEntity[] {
    return deriveModulesFromFiles(sourceFiles);
  }
  
  /**
   * Validate modules against E11 corpus.
   */
  validateSemantics(
    modules: ExtractedEntity[],
    e11Files: SourceFileInput[]
  ): ModuleValidationResult {
    return validateModuleSemantics(modules, e11Files);
  }
}

// Export singleton instance
export const moduleDerivationProvider = new ModuleDerivationProvider();
