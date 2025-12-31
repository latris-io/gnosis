// src/pipeline/incremental.ts
// @implements STORY-64.4
// @tdd TDD-A4-STRUCTURAL-ANALYSIS
// NOTE: Infrastructure modules do not carry @satisfies markers.
// Only ast-relationship-provider.ts carries @satisfies AC-64.4.1/2/3.
//
// Track A Incremental Extraction:
// - Detects changed files via git diff
// - Re-extracts entities from added/modified files
// - Does NOT delete entities from graph (preserved for history/audit)
// - Surfaces deleted paths as integrity findings

import { execSync } from 'child_process';
import type { ChangeSet, PipelineSnapshot } from './types.js';
import type { ExtractedEntity } from '../extraction/types.js';

export interface GitFileChange {
  path: string;
  status: 'added' | 'modified' | 'deleted';
}

/**
 * Incremental extractor for changed files only.
 * 
 * Track A semantics:
 * - Additions: new files → new entities
 * - Modifications: changed files → re-extracted entities (upsert)
 * - Deletions: NOT deleted from graph; tracked in ChangeSet.deleted_paths
 *   and surfaced as integrity findings
 */
export class IncrementalExtractor {
  /**
   * Detect changed files between two commits.
   */
  getChangedFiles(
    fromSha: string,
    toSha: string,
    repoPath: string
  ): GitFileChange[] {
    try {
      const output = execSync(
        `git diff --name-status ${fromSha} ${toSha}`,
        { cwd: repoPath, encoding: 'utf8' }
      );
      
      return output
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          const [status, ...pathParts] = line.split('\t');
          const path = pathParts.join('\t');
          return {
            path,
            status: status === 'A' ? 'added' : status === 'D' ? 'deleted' : 'modified',
          };
        });
    } catch (error) {
      // If git diff fails (e.g., invalid SHAs), return empty
      console.warn(`git diff failed: ${error}`);
      return [];
    }
  }

  /**
   * Extract changes between two snapshots.
   * 
   * Note: This method identifies what files changed, but actual entity
   * extraction is delegated to the appropriate providers through the
   * orchestrator. This class just identifies the ChangeSet.
   */
  async extractChanges(
    previousSnapshot: PipelineSnapshot,
    currentSnapshot: PipelineSnapshot
  ): Promise<ChangeSet> {
    const fromSha = previousSnapshot.commit_sha || 'HEAD~1';
    const toSha = currentSnapshot.commit_sha || 'HEAD';
    
    const changedFiles = this.getChangedFiles(
      fromSha,
      toSha,
      currentSnapshot.root_path
    );
    
    const additions: ExtractedEntity[] = [];
    const modifications: ExtractedEntity[] = [];
    const deleted_paths: string[] = [];
    
    for (const file of changedFiles) {
      switch (file.status) {
        case 'added':
          // New files will be extracted by providers
          // Mark for addition tracking (entities extracted by providers)
          break;
          
        case 'modified':
          // Modified files will be re-extracted by providers
          // Mark for modification tracking (entities upserted by providers)
          break;
          
        case 'deleted':
          // Track A does NOT delete entities from graph
          // Record deleted paths for integrity finding
          deleted_paths.push(file.path);
          break;
      }
    }
    
    return { additions, modifications, deleted_paths };
  }

  /**
   * Filter files to only those that changed.
   * Used to limit provider extraction scope in incremental mode.
   */
  getChangedFilePaths(
    previousSnapshot: PipelineSnapshot,
    currentSnapshot: PipelineSnapshot
  ): { added: string[]; modified: string[]; deleted: string[] } {
    const fromSha = previousSnapshot.commit_sha || 'HEAD~1';
    const toSha = currentSnapshot.commit_sha || 'HEAD';
    
    const changedFiles = this.getChangedFiles(
      fromSha,
      toSha,
      currentSnapshot.root_path
    );
    
    const added: string[] = [];
    const modified: string[] = [];
    const deleted: string[] = [];
    
    for (const file of changedFiles) {
      switch (file.status) {
        case 'added':
          added.push(file.path);
          break;
        case 'modified':
          modified.push(file.path);
          break;
        case 'deleted':
          deleted.push(file.path);
          break;
      }
    }
    
    return { added, modified, deleted };
  }

  /**
   * Check if a file was changed and should be processed.
   */
  shouldProcessFile(
    filePath: string,
    changedPaths: { added: string[]; modified: string[] }
  ): boolean {
    return changedPaths.added.includes(filePath) ||
      changedPaths.modified.includes(filePath);
  }
}

/**
 * Convenience function to create an incremental extractor.
 */
export function createIncrementalExtractor(): IncrementalExtractor {
  return new IncrementalExtractor();
}

