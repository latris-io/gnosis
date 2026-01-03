// src/extraction/providers/git-relationship-provider.ts
// @implements STORY-64.2
// @tdd TDD-A2-RELATIONSHIP-REGISTRY
// Git relationship provider - derives R63 and R67 from git history
// R63: INTRODUCED_IN (Story → ReleaseVersion)
// R67: MODIFIED_IN (SourceFile → Commit)

import { execSync } from 'child_process';
import type { ExtractedRelationship } from '../types.js';

/**
 * Input type for E11 SourceFile entities
 */
export interface SourceFileInput {
  instance_id: string;  // FILE-<path>
  source_file: string;
}

/**
 * Input type for E50 Commit entities
 */
export interface CommitInput {
  instance_id: string;  // COMMIT-<short-sha>
  sha: string;
}


/**
 * Derive R67: SourceFile MODIFIED_IN Commit
 * 
 * Links E11 SourceFile entities to E50 Commit entities that modified them.
 * Uses git log to find commits that touched each file.
 * 
 * @param sourceFiles E11 SourceFile entities
 * @param commits E50 Commit entities (for lookup)
 * @param rootPath Repository root path
 * @param maxCommitsPerFile Limit commits per file (default: 100)
 */
export function deriveR67(
  sourceFiles: SourceFileInput[],
  commits: CommitInput[],
  rootPath: string,
  maxCommitsPerFile: number = 100
): ExtractedRelationship[] {
  const relationships: ExtractedRelationship[] = [];
  
  // Build commit lookup by short SHA
  const commitBySha = new Map<string, CommitInput>();
  for (const commit of commits) {
    // Extract short SHA from instance_id (COMMIT-<12-char-sha>)
    if (commit.instance_id.startsWith('COMMIT-')) {
      const shortSha = commit.instance_id.slice(7);
      commitBySha.set(shortSha, commit);
    }
    // Also index by full SHA if available
    if (commit.sha) {
      commitBySha.set(commit.sha.substring(0, 12), commit);
    }
  }
  
  for (const file of sourceFiles) {
    // Extract file path from instance_id (FILE-<path>)
    if (!file.instance_id.startsWith('FILE-')) {
      continue;
    }
    const filePath = file.instance_id.slice(5);
    
    try {
      // Get commits that modified this file
      const stdout = execSync(
        `git log --format="%H" -n ${maxCommitsPerFile} --follow -- "${filePath}"`,
        { cwd: rootPath, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
      );
      
      const commitShas = stdout.split('\n').filter(Boolean);
      
      for (const sha of commitShas) {
        const shortSha = sha.substring(0, 12);
        const commit = commitBySha.get(shortSha);
        
        if (!commit) {
          // Commit not in our entity set (might be filtered or beyond limit)
          continue;
        }
        
        const relationshipInstanceId = `R67:${file.instance_id}:${commit.instance_id}`;
        
        relationships.push({
          relationship_type: 'R67',
          instance_id: relationshipInstanceId,
          name: 'MODIFIED_IN',
          from_instance_id: file.instance_id,
          to_instance_id: commit.instance_id,
          confidence: 1.0,
          // Evidence from .git (synthetic per AMB-5)
          source_file: '.git',
          line_start: 1,
          line_end: 1,
        });
      }
    } catch {
      // File might not exist in git history (new file, deleted, etc.)
      continue;
    }
  }
  
  return relationships;
}

/**
 * Derive R63: SourceFile INTRODUCED_IN Commit (Track A canon)
 * 
 * Links E11 SourceFile entities to the E50 Commit that first introduced them.
 * Per Track A ENTRY.md: "R63 INTRODUCED_IN is a Track A-scoped deviation from global canon."
 * 
 * Algorithm:
 * - Use `git log --diff-filter=A --follow -- <file>` to find the commit that added the file
 * 
 * @param sourceFiles E11 SourceFile entities
 * @param commits E50 Commit entities (for lookup)
 * @param rootPath Repository root path
 */
export function deriveR63(
  sourceFiles: SourceFileInput[],
  commits: CommitInput[],
  rootPath: string
): ExtractedRelationship[] {
  const relationships: ExtractedRelationship[] = [];
  
  // Build commit lookup by short SHA
  const commitBySha = new Map<string, CommitInput>();
  for (const commit of commits) {
    if (commit.instance_id.startsWith('COMMIT-')) {
      const shortSha = commit.instance_id.slice(7);
      commitBySha.set(shortSha, commit);
    }
    if (commit.sha) {
      commitBySha.set(commit.sha.substring(0, 12), commit);
    }
  }
  
  for (const file of sourceFiles) {
    if (!file.instance_id.startsWith('FILE-')) {
      continue;
    }
    const filePath = file.instance_id.slice(5);
    
    try {
      // Find the commit that added this file (--diff-filter=A = added files only)
      const stdout = execSync(
        `git log --diff-filter=A --format="%H" --follow -- "${filePath}"`,
        { cwd: rootPath, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
      );
      
      // Get the last line (oldest commit that added the file)
      const commitShas = stdout.split('\n').filter(Boolean);
      if (commitShas.length === 0) {
        continue;
      }
      
      // The last commit in the list is the one that first introduced the file
      const introducingSha = commitShas[commitShas.length - 1];
      const shortSha = introducingSha.substring(0, 12);
      const commit = commitBySha.get(shortSha);
      
      if (!commit) {
        // Commit not in our entity set
        continue;
      }
      
      const relationshipInstanceId = `R63:${file.instance_id}:${commit.instance_id}`;
      
      relationships.push({
        relationship_type: 'R63',
        instance_id: relationshipInstanceId,
        name: 'INTRODUCED_IN',
        from_instance_id: file.instance_id,
        to_instance_id: commit.instance_id,
        confidence: 1.0,
        // Evidence from .git (synthetic per AMB-5)
        source_file: '.git',
        line_start: 1,
        line_end: 1,
      });
    } catch {
      // File might not exist in git history
      continue;
    }
  }
  
  return relationships;
}

/**
 * Git Relationship Provider class.
 */
export class GitRelationshipProvider {
  name = 'git-relationship-provider';
  
  /**
   * Derive R63: SourceFile INTRODUCED_IN Commit (Track A canon)
   */
  deriveR63(
    sourceFiles: SourceFileInput[],
    commits: CommitInput[],
    rootPath: string
  ): ExtractedRelationship[] {
    return deriveR63(sourceFiles, commits, rootPath);
  }
  
  /**
   * Derive R67: SourceFile MODIFIED_IN Commit
   */
  deriveR67(
    sourceFiles: SourceFileInput[],
    commits: CommitInput[],
    rootPath: string
  ): ExtractedRelationship[] {
    return deriveR67(sourceFiles, commits, rootPath);
  }
}

// Export singleton instance
export const gitRelationshipProvider = new GitRelationshipProvider();


