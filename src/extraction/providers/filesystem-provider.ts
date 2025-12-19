// src/extraction/providers/filesystem-provider.ts
// @implements STORY-64.1
// @satisfies AC-64.1.5, AC-64.1.7
// Filesystem discovery provider - discovers files but does NOT parse AST
// E06 TechnicalDesign, E11 SourceFile, E27 TestFile

import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';
import type { ExtractionProvider, RepoSnapshot, ExtractionResult, ExtractedEntity } from '../types.js';
import { createFileEvidenceAnchor } from '../evidence.js';
import { captureCorrectSignal, captureIncorrectSignal } from '../../ledger/semantic-corpus.js';

/**
 * Filesystem Provider - discovers files from the repository.
 * 
 * Entities discovered:
 * - E06 TechnicalDesign: ADR files in docs/ directory
 * - E11 SourceFile: TypeScript files in src/ directory
 * - E27 TestFile: Test files in test/ directory (*.test.ts pattern)
 * 
 * Note: Does NOT parse AST. AST parsing is done by ast-provider.
 */
export class FilesystemProvider implements ExtractionProvider {
  name = 'filesystem-provider';

  supports(fileType: string): boolean {
    return ['ts', 'tsx', 'js', 'jsx', 'md'].includes(fileType);
  }

  async extract(snapshot: RepoSnapshot): Promise<ExtractionResult> {
    const rootPath = snapshot.root_path;
    const entities: ExtractedEntity[] = [];

    // E06: Discover TechnicalDesign entities (ADR files)
    const adrEntities = await this.discoverADRFiles(rootPath);
    entities.push(...adrEntities);

    // E11: Discover SourceFile entities
    const sourceFileEntities = await this.discoverSourceFiles(rootPath);
    entities.push(...sourceFileEntities);

    // E27: Discover TestFile entities
    const testFileEntities = await this.discoverTestFiles(rootPath);
    entities.push(...testFileEntities);

    return { entities, relationships: [], evidence: [] };
  }

  /**
   * Discover ADR (Architecture Decision Record) files for E06 TechnicalDesign.
   */
  private async discoverADRFiles(rootPath: string): Promise<ExtractedEntity[]> {
    const entities: ExtractedEntity[] = [];

    // Look for ADR files in common locations
    const adrPatterns = [
      'docs/adr/**/*.md',
      'docs/ADR/**/*.md',
      'adr/**/*.md',
      'docs/**/ADR-*.md',
      'docs/**/adr-*.md',
    ];

    for (const pattern of adrPatterns) {
      try {
        const files = await glob(pattern, { cwd: rootPath, nodir: true });
        
        for (const file of files) {
          const fullPath = path.join(rootPath, file);
          const stats = await fs.stat(fullPath);
          const fileName = path.basename(file, '.md');
          
          // Generate instance_id: TDD-{filename}
          const instanceId = `TDD-${fileName.replace(/[^a-zA-Z0-9-_]/g, '-')}`;

          entities.push({
            entity_type: 'E06',
            instance_id: instanceId,
            name: fileName,
            attributes: {
              file_path: file,
              file_name: fileName,
              size_bytes: stats.size,
              modified_at: stats.mtime.toISOString(),
            },
            source_file: fullPath,
            line_start: 1,
            line_end: 1,
          });

          await captureCorrectSignal('E06', instanceId, {
            file: file,
          });
        }
      } catch {
        // Pattern didn't match, continue
      }
    }

    // Also check for spec files that might be technical designs
    try {
      const specFiles = await glob('docs/**/*SPEC*.md', { cwd: rootPath, nodir: true });
      for (const file of specFiles) {
        const fullPath = path.join(rootPath, file);
        const stats = await fs.stat(fullPath);
        const fileName = path.basename(file, '.md');
        const instanceId = `TDD-${fileName.replace(/[^a-zA-Z0-9-_]/g, '-')}`;

        // Skip if already added
        if (entities.some(e => e.instance_id === instanceId)) continue;

        entities.push({
          entity_type: 'E06',
          instance_id: instanceId,
          name: fileName,
          attributes: {
            file_path: file,
            file_name: fileName,
            size_bytes: stats.size,
            modified_at: stats.mtime.toISOString(),
          },
          source_file: fullPath,
          line_start: 1,
          line_end: 1,
        });

        await captureCorrectSignal('E06', instanceId, { file });
      }
    } catch {
      // No spec files found
    }

    return entities;
  }

  /**
   * Discover source files for E11 SourceFile.
   */
  private async discoverSourceFiles(rootPath: string): Promise<ExtractedEntity[]> {
    const entities: ExtractedEntity[] = [];

    try {
      const files = await glob('src/**/*.ts', { cwd: rootPath, nodir: true });

      for (const file of files) {
        const fullPath = path.join(rootPath, file);
        const stats = await fs.stat(fullPath);
        
        // Generate instance_id: FILE-{relative_path}
        const instanceId = `FILE-${file}`;

        entities.push({
          entity_type: 'E11',
          instance_id: instanceId,
          name: path.basename(file),
          attributes: {
            file_path: file,
            extension: path.extname(file),
            size_bytes: stats.size,
            modified_at: stats.mtime.toISOString(),
          },
          source_file: fullPath,
          line_start: 1,
          line_end: 1,
        });

        await captureCorrectSignal('E11', instanceId, {
          file: file,
        });
      }
    } catch (error) {
      await captureIncorrectSignal('E11', 'SOURCE-FILES', 'Failed to discover source files', {
        error: String(error),
      });
    }

    return entities;
  }

  /**
   * Discover test files for E27 TestFile.
   */
  private async discoverTestFiles(rootPath: string): Promise<ExtractedEntity[]> {
    const entities: ExtractedEntity[] = [];

    try {
      // Use *.test.ts pattern to exclude support files like index.ts, setup.ts
      const files = await glob('test/**/*.test.ts', { cwd: rootPath, nodir: true });

      for (const file of files) {
        const fullPath = path.join(rootPath, file);
        const stats = await fs.stat(fullPath);
        
        // Generate instance_id: TSTF-{relative_path}
        const instanceId = `TSTF-${file}`;

        entities.push({
          entity_type: 'E27',
          instance_id: instanceId,
          name: path.basename(file),
          attributes: {
            file_path: file,
            extension: path.extname(file),
            size_bytes: stats.size,
            modified_at: stats.mtime.toISOString(),
          },
          source_file: fullPath,
          line_start: 1,
          line_end: 1,
        });

        await captureCorrectSignal('E27', instanceId, {
          file: file,
        });
      }
    } catch (error) {
      await captureIncorrectSignal('E27', 'TEST-FILES', 'Failed to discover test files', {
        error: String(error),
      });
    }

    return entities;
  }

  /**
   * Get list of discovered test file paths for ast-provider to parse.
   */
  async getTestFilePaths(rootPath: string): Promise<string[]> {
    try {
      const files = await glob('test/**/*.test.ts', { cwd: rootPath, nodir: true });
      return files.map(f => path.join(rootPath, f));
    } catch {
      return [];
    }
  }
}

// Export singleton instance
export const filesystemProvider = new FilesystemProvider();
