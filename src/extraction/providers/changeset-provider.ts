// src/extraction/providers/changeset-provider.ts
// @implements STORY-64.1
// @tdd TDD-A1-ENTITY-REGISTRY
// ChangeSet derivation provider - groups commits by story reference
// E52 ChangeSet (derived, not directly extracted)

import { execSync } from 'child_process';
import type { ExtractionProvider, RepoSnapshot, ExtractionResult, ExtractedEntity } from '../types.js';
import { captureCorrectSignal, captureIncorrectSignal } from '../../ledger/semantic-corpus.js';

/**
 * ChangeSet Provider - derives ChangeSet entities from commit groupings.
 * 
 * Entities derived:
 * - E52 ChangeSet: groups commits by story reference (STORY-X.Y in commit message)
 * 
 * Note: E52 is DERIVED, not directly extracted. ChangeSets group commits
 * that reference the same story. R70 GROUPS relationships are created in A2.
 */
export class ChangeSetProvider implements ExtractionProvider {
  name = 'changeset-provider';

  supports(fileType: string): boolean {
    return fileType === 'git';
  }

  async extract(snapshot: RepoSnapshot): Promise<ExtractionResult> {
    const rootPath = snapshot.root_path;
    const entities: ExtractedEntity[] = [];
    const ref = snapshot.commit_sha || 'HEAD';

    try {
      // Get commit history with SHA and message
      const stdout = execSync(
        `git log --format="%H|%s" -n 1000 ${ref}`,
        { cwd: rootPath, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
      );

      // Group commits by story reference
      const commitsByStory = new Map<string, string[]>();

      for (const line of stdout.split('\n').filter(Boolean)) {
        const pipeIndex = line.indexOf('|');
        if (pipeIndex === -1) continue;

        const sha = line.slice(0, pipeIndex);
        const message = line.slice(pipeIndex + 1);

        // Extract story reference from commit message
        const storyMatch = message.match(/STORY-(\d+\.\d+)/);
        if (storyMatch) {
          const storyId = storyMatch[1];
          if (!commitsByStory.has(storyId)) {
            commitsByStory.set(storyId, []);
          }
          commitsByStory.get(storyId)!.push(sha);
        }
      }

      // Create ChangeSet entity for each story grouping
      // Sort keys for deterministic output
      const sortedStoryIds = Array.from(commitsByStory.keys()).sort((a, b) => {
        const [aEpic, aStory] = a.split('.').map(Number);
        const [bEpic, bStory] = b.split('.').map(Number);
        if (aEpic !== bEpic) return aEpic - bEpic;
        return aStory - bStory;
      });

      for (const storyId of sortedStoryIds) {
        const commits = commitsByStory.get(storyId)!;
        const instanceId = `CHGSET-STORY-${storyId}`;

        entities.push({
          entity_type: 'E52',
          instance_id: instanceId,
          name: `ChangeSet for STORY-${storyId}`,
          attributes: {
            story_id: `STORY-${storyId}`,
            commit_count: commits.length,
            commit_shas: commits.sort(),
            first_commit: commits[commits.length - 1]?.substring(0, 12),
            last_commit: commits[0]?.substring(0, 12),
          },
          source_file: '.git',
          line_start: 1,
          line_end: 1,
        });

        await captureCorrectSignal('E52', instanceId, {
          story_id: storyId,
          commit_count: commits.length,
        });
      }
    } catch (error) {
      await captureIncorrectSignal('E52', 'CHANGESET', 'Failed to derive changesets', {
        error: String(error),
      });
    }

    return { entities, relationships: [], evidence: [] };
  }

  /**
   * Get ChangeSet for a specific story.
   */
  async getChangeSetForStory(rootPath: string, storyId: string): Promise<ExtractedEntity | null> {
    const snapshot: RepoSnapshot = {
      id: 'temp',
      root_path: rootPath,
      timestamp: new Date(),
    };

    const result = await this.extract(snapshot);
    return result.entities.find(e => {
      const attrs = e.attributes as { story_id?: string };
      return attrs.story_id === `STORY-${storyId}`;
    }) || null;
  }

  /**
   * Get all stories that have commits.
   */
  async getStoriesWithCommits(rootPath: string): Promise<string[]> {
    const snapshot: RepoSnapshot = {
      id: 'temp',
      root_path: rootPath,
      timestamp: new Date(),
    };

    const result = await this.extract(snapshot);
    return result.entities.map(e => {
      const attrs = e.attributes as { story_id?: string };
      return attrs.story_id || '';
    }).filter(Boolean);
  }
}

// Export singleton instance
export const changesetProvider = new ChangeSetProvider();
