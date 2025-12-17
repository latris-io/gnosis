// src/extraction/providers/git-provider.ts
// @implements STORY-64.1
// @satisfies AC-64.1.14, AC-64.1.15
// Git extraction provider - extracts from git history
// E49 ReleaseVersion, E50 Commit

import { execSync } from 'child_process';
import type { ExtractionProvider, RepoSnapshot, ExtractionResult, ExtractedEntity } from '../types.js';
import { captureCorrectSignal, captureIncorrectSignal } from '../../ledger/semantic-corpus.js';

/**
 * Git Provider - extracts entities from git history.
 * 
 * Entities extracted:
 * - E49 ReleaseVersion: from git tags
 * - E50 Commit: from git log
 */
export class GitProvider implements ExtractionProvider {
  name = 'git-provider';

  supports(fileType: string): boolean {
    return fileType === 'git';
  }

  async extract(snapshot: RepoSnapshot): Promise<ExtractionResult> {
    const rootPath = snapshot.root_path;
    const entities: ExtractedEntity[] = [];

    // E49: Extract ReleaseVersion from git tags
    const releaseEntities = await this.extractReleaseVersions(rootPath);
    entities.push(...releaseEntities);

    // E50: Extract Commits from git log
    const commitEntities = await this.extractCommits(rootPath, snapshot.commit_sha);
    entities.push(...commitEntities);

    return { entities, relationships: [], evidence: [] };
  }

  /**
   * Extract ReleaseVersion entities (E49) from git tags.
   */
  private async extractReleaseVersions(rootPath: string): Promise<ExtractedEntity[]> {
    const entities: ExtractedEntity[] = [];

    try {
      // Get all tags with their commit SHA and date
      const stdout = execSync(
        'git tag -l --format="%(refname:short)|%(objectname:short)|%(creatordate:iso-strict)"',
        { cwd: rootPath, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
      );

      for (const line of stdout.split('\n').filter(Boolean)) {
        const parts = line.split('|');
        if (parts.length < 2) continue;

        const tagName = parts[0];
        const commitSha = parts[1];
        const dateStr = parts[2] || '';

        // Generate instance_id: REL-{tagName}
        const instanceId = `REL-${tagName.replace(/[^a-zA-Z0-9.-]/g, '-')}`;

        entities.push({
          entity_type: 'E49',
          instance_id: instanceId,
          name: tagName,
          attributes: {
            tag_name: tagName,
            commit_sha: commitSha,
            created_at: dateStr || undefined,
            is_semver: this.isSemver(tagName),
          },
          // Git entities use synthetic .git anchor per AMB-5 resolution
          source_file: '.git',
          line_start: 1,
          line_end: 1,
        });

        await captureCorrectSignal('E49', instanceId, {
          tag: tagName,
        });
      }
    } catch (error) {
      await captureIncorrectSignal('E49', 'GIT-TAGS', 'Failed to extract git tags', {
        error: String(error),
      });
    }

    return entities;
  }

  /**
   * Extract Commit entities (E50) from git log.
   */
  private async extractCommits(rootPath: string, upperBound?: string): Promise<ExtractedEntity[]> {
    const entities: ExtractedEntity[] = [];
    const ref = upperBound || 'HEAD';

    try {
      // Get commit history with SHA, author, date, and message
      // Limit to last 1000 commits to avoid overwhelming extraction
      const stdout = execSync(
        `git log --format="%H|%an|%ae|%aI|%s" -n 1000 ${ref}`,
        { cwd: rootPath, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
      );

      for (const line of stdout.split('\n').filter(Boolean)) {
        const parts = line.split('|');
        if (parts.length < 5) continue;

        const sha = parts[0];
        const authorName = parts[1];
        const authorEmail = parts[2];
        const dateStr = parts[3];
        const message = parts.slice(4).join('|'); // Message might contain |

        // Use first 12 characters of SHA for instance_id
        const shortSha = sha.substring(0, 12);
        const instanceId = `COMMIT-${shortSha}`;

        // Extract story reference from commit message if present
        const storyMatch = message.match(/STORY-(\d+\.\d+)/);
        const storyRef = storyMatch ? `STORY-${storyMatch[1]}` : undefined;

        entities.push({
          entity_type: 'E50',
          instance_id: instanceId,
          name: message.substring(0, 72) + (message.length > 72 ? '...' : ''),
          attributes: {
            sha,
            short_sha: shortSha,
            author_name: authorName,
            author_email: authorEmail,
            committed_at: dateStr,
            message,
            story_ref: storyRef,
          },
          // Git entities use synthetic .git anchor per AMB-5 resolution
          source_file: '.git',
          line_start: 1,
          line_end: 1,
        });

        await captureCorrectSignal('E50', instanceId, {
          sha: shortSha,
          has_story_ref: !!storyRef,
        });
      }
    } catch (error) {
      await captureIncorrectSignal('E50', 'GIT-LOG', 'Failed to extract git commits', {
        error: String(error),
      });
    }

    return entities;
  }

  /**
   * Check if a tag name follows semver format.
   */
  private isSemver(tagName: string): boolean {
    // Match semver patterns like v1.0.0, 1.0.0, v1.0.0-beta, etc.
    return /^v?\d+\.\d+\.\d+(-[\w.]+)?$/i.test(tagName);
  }

  /**
   * Get commits for a specific story reference.
   */
  async getCommitsForStory(rootPath: string, storyId: string): Promise<ExtractedEntity[]> {
    const allCommits = await this.extractCommits(rootPath);
    return allCommits.filter(e => {
      const attrs = e.attributes as { story_ref?: string };
      return attrs.story_ref === storyId;
    });
  }
}

// Export singleton instance
export const gitProvider = new GitProvider();


