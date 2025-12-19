// src/extraction/evidence.ts
// @implements STORY-64.1
// @tdd TDD-A1-ENTITY-REGISTRY
// Centralized EvidenceAnchor creation - all providers MUST use this

import { execSync } from 'child_process';
import type { EvidenceAnchor } from './types.js';

// Extractor version for provenance tracking
const EXTRACTOR_VERSION = '1.0.0';

/**
 * Get current git commit SHA.
 * Returns 'unknown' if not in a git repo or git fails.
 */
function getCurrentCommitSha(): string {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

/**
 * Create an EvidenceAnchor for provenance tracking.
 * All providers MUST use this factory to ensure consistent evidence anchors.
 * 
 * @param sourceFile - Path to the source file
 * @param lineStart - Starting line number (1-indexed)
 * @param lineEnd - Ending line number (1-indexed)
 * @param commitSha - Optional commit SHA (defaults to current HEAD)
 * @returns EvidenceAnchor with all provenance fields populated
 */
export function createEvidenceAnchor(
  sourceFile: string,
  lineStart: number,
  lineEnd: number,
  commitSha?: string
): EvidenceAnchor {
  return {
    source_file: sourceFile,
    line_start: lineStart,
    line_end: lineEnd,
    commit_sha: commitSha ?? getCurrentCommitSha(),
    extraction_timestamp: new Date(),
    extractor_version: EXTRACTOR_VERSION,
  };
}

/**
 * Create an EvidenceAnchor for file-level entities (no specific line range).
 */
export function createFileEvidenceAnchor(
  sourceFile: string,
  commitSha?: string
): EvidenceAnchor {
  return createEvidenceAnchor(sourceFile, 1, 1, commitSha);
}

/**
 * Validate that an EvidenceAnchor has all required fields populated.
 * Returns true if valid, false otherwise.
 */
export function isValidEvidenceAnchor(anchor: EvidenceAnchor): boolean {
  return (
    typeof anchor.source_file === 'string' &&
    anchor.source_file.length > 0 &&
    typeof anchor.line_start === 'number' &&
    anchor.line_start > 0 &&
    typeof anchor.line_end === 'number' &&
    anchor.line_end >= anchor.line_start &&
    typeof anchor.commit_sha === 'string' &&
    anchor.commit_sha.length > 0 &&
    anchor.extraction_timestamp instanceof Date &&
    typeof anchor.extractor_version === 'string' &&
    anchor.extractor_version.length > 0
  );
}

/**
 * Get the current extractor version.
 */
export function getExtractorVersion(): string {
  return EXTRACTOR_VERSION;
}
