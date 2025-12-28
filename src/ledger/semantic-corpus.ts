// src/ledger/semantic-corpus.ts
// @implements STORY-64.1
// @tdd TDD-A1-ENTITY-REGISTRY
//
// Semantic signals for Track C readiness
// Minimum 50 signals must be captured during A1 execution
//
// ═══════════════════════════════════════════════════════════════════════════
// TRACK C PROVENANCE
// ═══════════════════════════════════════════════════════════════════════════
//
// Each signal includes project_id and repo_sha for:
// - Project isolation: signals scoped to extraction project
// - Epoch binding: signals tied to specific repository state
// - Reproducibility: same (project_id, repo_sha) produces same signals
//
// ═══════════════════════════════════════════════════════════════════════════
// PROJECT ISOLATION
// ═══════════════════════════════════════════════════════════════════════════
//
// Per-project corpus isolation:
// - Default path: semantic-corpus/{project_id}/signals.jsonl
// - Each project gets its own corpus file
// - No cross-project pollution possible
// - Use getProjectCorpus(projectId) for project-scoped instance
//
// ═══════════════════════════════════════════════════════════════════════════

import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Semantic signal types for Track C learning.
 * These signals capture extraction validation outcomes.
 */
export type SignalType = 
  | 'CORRECT'                // Extraction matched expected result
  | 'INCORRECT'              // Extraction did not match expected result
  | 'PARTIAL'                // Extraction partially matched
  | 'ORPHAN_MARKER'          // Marker found with no corresponding entity
  | 'TDD_COHERENCE_MISMATCH' // @tdd marker points to non-E06 entity
  | 'AMBIGUOUS';             // Multiple interpretations possible

/**
 * A semantic signal captures an extraction validation outcome.
 * Used for Track C semantic learning readiness.
 * 
 * Track C provenance fields (project_id, repo_sha) are optional for
 * backward compatibility but SHOULD be provided for new signals.
 */
export interface SemanticSignal {
  timestamp: string;          // ISO 8601 timestamp
  type: SignalType;
  
  // Track C provenance (optional for backward compat, recommended for new signals)
  project_id?: string;        // Project UUID for isolation
  repo_sha?: string;          // Git SHA for epoch binding
  
  // Entity/marker identification
  entity_type?: string;       // E-code if applicable
  entity_id?: string;         // UUID if applicable
  instance_id?: string;       // Business key if applicable
  marker_type?: string;       // @implements, @satisfies, etc.
  target_id?: string;         // Target of marker
  source_entity_id?: string;  // Source of marker
  
  // Flexible payload
  context: Record<string, unknown>;   // Additional context
  evidence: Record<string, unknown>;  // Supporting evidence
}

/**
 * Semantic Corpus - collection of signals for Track C learning.
 * Per AC-64.1.18.
 */
export class SemanticCorpus {
  private readonly corpusPath: string;
  private initialized = false;

  constructor(corpusPath: string = 'semantic-corpus/signals.jsonl') {
    this.corpusPath = corpusPath;
  }

  /**
   * Initialize the corpus - ensure directory and file exist.
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    const dir = path.dirname(this.corpusPath);
    await fs.mkdir(dir, { recursive: true });

    try {
      await fs.access(this.corpusPath);
    } catch {
      await fs.writeFile(this.corpusPath, '');
    }

    this.initialized = true;
  }

  /**
   * Capture a semantic signal.
   * Idempotent: signals with same signal_instance_id are deduplicated.
   */
  async capture(signal: Omit<SemanticSignal, 'timestamp'>): Promise<void> {
    await this.initialize();

    // Extract signal_instance_id for deduplication
    const signalInstanceId = (signal as any).context?.signal_instance_id;
    
    // If signal has an instance_id, check for duplicates
    if (signalInstanceId) {
      const existing = await this.getSignals();
      const isDuplicate = existing.some(
        s => (s as any).context?.signal_instance_id === signalInstanceId
      );
      if (isDuplicate) {
        return; // Skip duplicate - idempotent
      }
    }

    const fullSignal: SemanticSignal = {
      ...signal,
      timestamp: new Date().toISOString(),
    };

    const line = JSON.stringify(fullSignal) + '\n';
    await fs.appendFile(this.corpusPath, line);
  }

  /**
   * Get all signals from the corpus.
   */
  async getSignals(type?: SignalType): Promise<SemanticSignal[]> {
    await this.initialize();

    const content = await fs.readFile(this.corpusPath, 'utf8');
    const signals = content
      .split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line) as SemanticSignal);

    if (type) {
      return signals.filter(s => s.type === type);
    }
    return signals;
  }

  /**
   * Get total signal count.
   */
  async getCount(): Promise<number> {
    const signals = await this.getSignals();
    return signals.length;
  }

  /**
   * Get signal counts by type.
   */
  async getCountsByType(): Promise<Record<SignalType, number>> {
    const signals = await this.getSignals();
    const counts: Record<SignalType, number> = {
      CORRECT: 0,
      INCORRECT: 0,
      PARTIAL: 0,
      ORPHAN_MARKER: 0,
      TDD_COHERENCE_MISMATCH: 0,
      AMBIGUOUS: 0,
    };

    for (const signal of signals) {
      counts[signal.type]++;
    }

    return counts;
  }

  /**
   * Check if minimum signal count is met (50 for A1).
   */
  async meetsMinimum(minimum: number = 50): Promise<boolean> {
    const count = await this.getCount();
    return count >= minimum;
  }

  /**
   * Get the corpus file path.
   */
  getPath(): string {
    return this.corpusPath;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Project-Scoped Corpus Factory
// ═══════════════════════════════════════════════════════════════════════════

// Cache of project-scoped corpuses
const projectCorpuses = new Map<string, SemanticCorpus>();

/**
 * Get a project-scoped semantic corpus instance.
 * 
 * Each project gets its own corpus file at:
 *   semantic-corpus/{project_id}/signals.jsonl
 * 
 * This ensures complete isolation between projects.
 * 
 * @param projectId - The project UUID
 * @returns SemanticCorpus instance scoped to the project
 */
export function getProjectCorpus(projectId: string): SemanticCorpus {
  if (!projectId) {
    throw new Error('projectId is required for getProjectCorpus');
  }
  
  let corpus = projectCorpuses.get(projectId);
  if (!corpus) {
    const corpusPath = `semantic-corpus/${projectId}/signals.jsonl`;
    corpus = new SemanticCorpus(corpusPath);
    projectCorpuses.set(projectId, corpus);
  }
  return corpus;
}

/**
 * Clear the project corpus cache.
 * Useful for testing.
 */
export function clearProjectCorpusCache(): void {
  projectCorpuses.clear();
}

// Legacy singleton instance (uses flat structure)
// DEPRECATED: Use getProjectCorpus(projectId) for new code
export const semanticCorpus = new SemanticCorpus();

/**
 * Helper function to capture a semantic signal.
 * Used throughout extraction for Track C readiness.
 * 
 * NOTE: For project-scoped signals, prefer getProjectCorpus(projectId).capture()
 * or use captureSemanticSignalWithProvenance() for automatic provenance.
 */
export async function captureSemanticSignal(
  signal: Omit<SemanticSignal, 'timestamp'>
): Promise<void> {
  await semanticCorpus.capture(signal);
}

/**
 * Capture a semantic signal with full Track C provenance.
 * Writes to project-scoped corpus with project_id and repo_sha.
 * 
 * @param projectId - The project UUID
 * @param repoSha - The current git commit SHA
 * @param signal - The signal payload (without timestamp/project_id/repo_sha)
 */
export async function captureSemanticSignalWithProvenance(
  projectId: string,
  repoSha: string,
  signal: Omit<SemanticSignal, 'timestamp' | 'project_id' | 'repo_sha'>
): Promise<void> {
  const corpus = getProjectCorpus(projectId);
  await corpus.capture({
    ...signal,
    project_id: projectId,
    repo_sha: repoSha,
  });
}

/**
 * Capture a CORRECT signal for successful extraction.
 */
export async function captureCorrectSignal(
  entityType: string,
  instanceId: string,
  context: Record<string, unknown> = {}
): Promise<void> {
  await captureSemanticSignal({
    type: 'CORRECT',
    entity_type: entityType,
    instance_id: instanceId,
    context,
    evidence: { extraction_successful: true },
  });
}

/**
 * Capture an INCORRECT signal for failed extraction.
 */
export async function captureIncorrectSignal(
  entityType: string,
  instanceId: string,
  reason: string,
  context: Record<string, unknown> = {}
): Promise<void> {
  await captureSemanticSignal({
    type: 'INCORRECT',
    entity_type: entityType,
    instance_id: instanceId,
    context: { ...context, reason },
    evidence: { extraction_successful: false },
  });
}

/**
 * Capture a PARTIAL signal for partially successful extraction.
 */
export async function capturePartialSignal(
  entityType: string,
  instanceId: string,
  matchPercentage: number,
  context: Record<string, unknown> = {}
): Promise<void> {
  await captureSemanticSignal({
    type: 'PARTIAL',
    entity_type: entityType,
    instance_id: instanceId,
    context: { ...context, match_percentage: matchPercentage },
    evidence: { partial_match: true },
  });
}

/**
 * Capture an ORPHAN_MARKER signal for markers without entities.
 */
export async function captureOrphanMarkerSignal(
  markerType: string,
  targetId: string,
  sourceFile: string,
  lineNumber: number
): Promise<void> {
  await captureSemanticSignal({
    type: 'ORPHAN_MARKER',
    marker_type: markerType,
    target_id: targetId,
    context: { source_file: sourceFile, line_number: lineNumber },
    evidence: { orphan: true },
  });
}

/**
 * Capture an AMBIGUOUS signal for unclear extraction cases.
 */
export async function captureAmbiguousSignal(
  entityType: string,
  instanceId: string,
  alternatives: string[],
  context: Record<string, unknown> = {}
): Promise<void> {
  await captureSemanticSignal({
    type: 'AMBIGUOUS',
    entity_type: entityType,
    instance_id: instanceId,
    context: { ...context, alternatives },
    evidence: { ambiguous: true },
  });
}
