// src/extraction/providers/marker-provider.ts
// @implements STORY-64.3
// @satisfies AC-64.3.1
// @satisfies AC-64.3.2
// @satisfies AC-64.3.8
// @tdd TDD-A3-MARKER-EXTRACTION
//
// Marker extraction provider - extracts @implements, @satisfies, @tdd markers from comments.
// Per A3 plan: NO imports from db or services. Emits RawMarker[] with file-absolute positions.
//
// Scan scope (governed):
// - src/**/*.{ts,tsx} ONLY (matches filesystemProvider E11 scope)
// - scripts/** EXCLUDED (no E11 entities → would always produce orphans)
// - test/**/*.ts EXCLUDED by default

import { Project, SourceFile, SyntaxKind, Node, CommentRange } from 'ts-morph';
import type { RepoSnapshot, ExtractionResult } from '../types.js';
import type { RawMarker, MarkerType } from '../../markers/types.js';

/**
 * Marker patterns (canonical per A3 spec).
 * Global flags for multiple matches per comment.
 */
const IMPLEMENTS_PATTERN = /@implements\s+(STORY-\d+\.\d+)/g;
const SATISFIES_PATTERN = /@satisfies\s+(AC-\d+\.\d+\.\d+)/g;
const TDD_PATTERN = /@tdd\s+(TDD-[A-Za-z0-9-]+)/g;

/**
 * Default scan roots (governed).
 * MUST match filesystemProvider E11 scope to avoid systematic orphans.
 * scripts/** excluded: no E11 entities exist for those files.
 * test/** excluded: test markers are R36/R37 (A4), not R18/R19.
 */
function getScanGlobs(rootPath: string): string[] {
  return [
    `${rootPath}/src/**/*.{ts,tsx}`,
  ];
}

/**
 * MarkerProvider extracts @implements, @satisfies, @tdd markers from source code comments.
 * 
 * Per A3 architecture:
 * - NO imports from db or services
 * - Computes file-absolute line_start/line_end
 * - Extracts from: single-line //, block /* *\/, JSDoc /** *\/, leading comment ranges
 */
export class MarkerProvider {
  readonly name = 'marker-provider';

  /**
   * Check if provider supports a file type.
   */
  supports(fileType: string): boolean {
    return ['ts', 'tsx', 'js', 'jsx'].includes(fileType);
  }

  /**
   * Extract markers from repository snapshot.
   * Returns RawMarker[] without validation (validation is separate layer).
   */
  async extract(snapshot: RepoSnapshot): Promise<RawMarker[]> {
    const project = new Project({ skipAddingFilesFromTsConfig: true });
    const globs = getScanGlobs(snapshot.root_path);
    
    for (const glob of globs) {
      project.addSourceFilesAtPaths(glob);
    }

    const markers: RawMarker[] = [];

    for (const sourceFile of project.getSourceFiles()) {
      const fileMarkers = this.extractFromFile(sourceFile, snapshot.root_path);
      markers.push(...fileMarkers);
    }

    return markers;
  }

  /**
   * Extract markers from a single source file.
   */
  private extractFromFile(sourceFile: SourceFile, rootPath: string): RawMarker[] {
    const markers: RawMarker[] = [];
    const filePath = sourceFile.getFilePath();
    
    // Compute relative path for instance_id (FILE-path format)
    const relativePath = filePath.startsWith(rootPath) 
      ? filePath.slice(rootPath.length + 1) 
      : filePath;
    const fileEntityId = `FILE-${relativePath}`;

    // 1. Extract from file-level leading comments (single-line // comments at top of file)
    // File-level comments are leading comments on the first statement that are NOT JSDoc
    // JSDoc comments (/** */) will be captured when we process functions/classes
    const firstStatement = sourceFile.getStatements()[0];
    if (firstStatement) {
      const fileComments = this.getLeadingComments(firstStatement, sourceFile);
      for (const comment of fileComments) {
        // Only treat as file-level if it's a single-line comment (not JSDoc)
        // JSDoc comments start with /** and will be captured with function/class
        if (comment.text.startsWith('//') && !comment.text.startsWith('/**')) {
          markers.push(...this.parseMarkersFromComment(
            comment.text,
            comment.pos,
            fileEntityId,
            relativePath,
            sourceFile
          ));
        }
      }
    }

    // 2. Extract from function declarations and expressions
    for (const func of sourceFile.getFunctions()) {
      const funcName = func.getName() || '<anonymous>';
      const funcEntityId = `FUNC-${relativePath}:${funcName}`;
      
      // JSDoc comments
      for (const jsDoc of func.getJsDocs()) {
        const jsDocText = jsDoc.getText();
        const jsDocPos = jsDoc.getStart();
        markers.push(...this.parseMarkersFromComment(
          jsDocText,
          jsDocPos,
          funcEntityId,
          relativePath,
          sourceFile
        ));
      }

      // Leading comments (non-JSDoc only - JSDoc already captured above)
      const leadingComments = this.getLeadingComments(func, sourceFile);
      for (const comment of leadingComments) {
        // Skip JSDoc comments (already captured via getJsDocs)
        if (!comment.text.startsWith('/**')) {
          markers.push(...this.parseMarkersFromComment(
            comment.text,
            comment.pos,
            funcEntityId,
            relativePath,
            sourceFile
          ));
        }
      }
    }

    // 3. Extract from class declarations
    for (const cls of sourceFile.getClasses()) {
      const className = cls.getName() || '<anonymous>';
      const classEntityId = `CLASS-${relativePath}:${className}`;

      // JSDoc comments
      for (const jsDoc of cls.getJsDocs()) {
        const jsDocText = jsDoc.getText();
        const jsDocPos = jsDoc.getStart();
        markers.push(...this.parseMarkersFromComment(
          jsDocText,
          jsDocPos,
          classEntityId,
          relativePath,
          sourceFile
        ));
      }

      // Leading comments (non-JSDoc only - JSDoc already captured above)
      const leadingComments = this.getLeadingComments(cls, sourceFile);
      for (const comment of leadingComments) {
        // Skip JSDoc comments (already captured via getJsDocs)
        if (!comment.text.startsWith('/**')) {
          markers.push(...this.parseMarkersFromComment(
            comment.text,
            comment.pos,
            classEntityId,
            relativePath,
            sourceFile
          ));
        }
      }

      // Class methods
      for (const method of cls.getMethods()) {
        const methodName = method.getName();
        const methodEntityId = `FUNC-${relativePath}:${className}.${methodName}`;

        for (const jsDoc of method.getJsDocs()) {
          const jsDocText = jsDoc.getText();
          const jsDocPos = jsDoc.getStart();
          markers.push(...this.parseMarkersFromComment(
            jsDocText,
            jsDocPos,
            methodEntityId,
            relativePath,
            sourceFile
          ));
        }

        // Method leading comments (non-JSDoc only)
        const methodComments = this.getLeadingComments(method, sourceFile);
        for (const comment of methodComments) {
          if (!comment.text.startsWith('/**')) {
            markers.push(...this.parseMarkersFromComment(
              comment.text,
              comment.pos,
              methodEntityId,
              relativePath,
              sourceFile
            ));
          }
        }
      }
    }

    // 4. Extract from arrow functions and variable declarations with comments
    for (const varDecl of sourceFile.getVariableDeclarations()) {
      const varName = varDecl.getName();
      const initializer = varDecl.getInitializer();
      
      // Check if it's an arrow function
      if (initializer?.getKind() === SyntaxKind.ArrowFunction) {
        const funcEntityId = `FUNC-${relativePath}:${varName}`;
        
        // Get comments from the variable statement
        const varStatement = varDecl.getVariableStatement();
        if (varStatement) {
          for (const jsDoc of varStatement.getJsDocs()) {
            const jsDocText = jsDoc.getText();
            const jsDocPos = jsDoc.getStart();
            markers.push(...this.parseMarkersFromComment(
              jsDocText,
              jsDocPos,
              funcEntityId,
              relativePath,
              sourceFile
            ));
          }

          // Arrow function leading comments (non-JSDoc only)
          const leadingComments = this.getLeadingComments(varStatement, sourceFile);
          for (const comment of leadingComments) {
            if (!comment.text.startsWith('/**')) {
              markers.push(...this.parseMarkersFromComment(
                comment.text,
                comment.pos,
                funcEntityId,
                relativePath,
                sourceFile
              ));
            }
          }
        }
      }
    }

    return markers;
  }

  /**
   * Get leading comments for a node.
   * Returns comment text and position for each comment.
   */
  private getLeadingComments(node: Node, sourceFile: SourceFile): Array<{ text: string; pos: number }> {
    const comments: Array<{ text: string; pos: number }> = [];
    const commentRanges = node.getLeadingCommentRanges();
    const fullText = sourceFile.getFullText();

    for (const range of commentRanges) {
      const text = fullText.slice(range.getPos(), range.getEnd());
      comments.push({ text, pos: range.getPos() });
    }

    return comments;
  }

  /**
   * Parse markers from a comment text.
   * Computes file-absolute line_start/line_end from source position.
   */
  private parseMarkersFromComment(
    commentText: string,
    commentPos: number,
    sourceEntityId: string,
    relativePath: string,
    sourceFile: SourceFile
  ): RawMarker[] {
    const markers: RawMarker[] = [];

    // Reset regex lastIndex before each use
    IMPLEMENTS_PATTERN.lastIndex = 0;
    SATISFIES_PATTERN.lastIndex = 0;
    TDD_PATTERN.lastIndex = 0;

    // Extract @implements markers
    let match;
    while ((match = IMPLEMENTS_PATTERN.exec(commentText)) !== null) {
      const markerPos = commentPos + match.index;
      const markerEndPos = markerPos + match[0].length;
      
      // File-absolute line numbers (1-indexed)
      const startLine = sourceFile.getLineAndColumnAtPos(markerPos).line;
      const endLine = sourceFile.getLineAndColumnAtPos(markerEndPos).line;

      markers.push({
        type: 'implements',
        target_id: match[1],
        source_entity_id: sourceEntityId,
        source_file: relativePath,
        line_start: startLine,
        line_end: endLine,
        raw_text: match[0],
      });
    }

    // Extract @satisfies markers
    SATISFIES_PATTERN.lastIndex = 0;
    while ((match = SATISFIES_PATTERN.exec(commentText)) !== null) {
      const markerPos = commentPos + match.index;
      const markerEndPos = markerPos + match[0].length;
      
      const startLine = sourceFile.getLineAndColumnAtPos(markerPos).line;
      const endLine = sourceFile.getLineAndColumnAtPos(markerEndPos).line;

      markers.push({
        type: 'satisfies',
        target_id: match[1],
        source_entity_id: sourceEntityId,
        source_file: relativePath,
        line_start: startLine,
        line_end: endLine,
        raw_text: match[0],
      });
    }

    // Extract @tdd markers
    TDD_PATTERN.lastIndex = 0;
    while ((match = TDD_PATTERN.exec(commentText)) !== null) {
      const markerPos = commentPos + match.index;
      const markerEndPos = markerPos + match[0].length;
      
      const startLine = sourceFile.getLineAndColumnAtPos(markerPos).line;
      const endLine = sourceFile.getLineAndColumnAtPos(markerEndPos).line;

      markers.push({
        type: 'tdd',
        target_id: match[1],
        source_entity_id: sourceEntityId,
        source_file: relativePath,
        line_start: startLine,
        line_end: endLine,
        raw_text: match[0],
      });
    }

    return markers;
  }
}

/**
 * Singleton instance for convenience.
 */
export const markerProvider = new MarkerProvider();

