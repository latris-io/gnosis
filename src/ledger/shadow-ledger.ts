// src/ledger/shadow-ledger.ts
// @implements STORY-64.1
// @implements STORY-64.3
// @tdd TDD-A1-ENTITY-REGISTRY
// @tdd TDD-A3-MARKER-EXTRACTION
//
// Append-only JSONL ledger for entity CREATE/UPDATE operations
// and DECISION entries for non-mutation outcomes (A3 marker extraction)
// NO emission on NO-OP (when content_hash unchanged)
//
// ═══════════════════════════════════════════════════════════════════════════
// REPLAY SEMANTICS (Formal Invariant)
// ═══════════════════════════════════════════════════════════════════════════
//
// Idempotent replay is achieved via INSTANCE_ID:
// - Each entity/relationship has a deterministic instance_id (business key)
// - instance_id = f(entity_type, source_content) - pure function
// - Re-running extraction on same snapshot produces same instance_id
// - Ledger entries are CREATE on first run, UPDATE on content_hash change
// - NO-OP (no ledger entry) when content_hash unchanged
//
// Replay guarantees:
// - Given (project_id, instance_id), ledger history is append-only
// - First entry for (project_id, instance_id) is always CREATE
// - Subsequent entries are UPDATE (content_hash changed)
// - DECISION entries are idempotent by (project_id, marker_target, source_entity)
//
// ═══════════════════════════════════════════════════════════════════════════
// PROJECT ISOLATION
// ═══════════════════════════════════════════════════════════════════════════
//
// Per-project ledger isolation:
// - Default path: shadow-ledger/{project_id}/ledger.jsonl
// - Each project gets its own ledger file
// - No cross-project pollution possible
// - Use getProjectLedger(projectId) to get project-scoped instance
//
// ═══════════════════════════════════════════════════════════════════════════

import * as fs from 'fs/promises';
import * as path from 'path';
import type { EvidenceAnchor } from '../extraction/types.js';

/**
 * Ledger entry operations - CREATE, UPDATE, or DECISION.
 * DELETE is not used in Track A (entities are never deleted, only updated).
 * NO-OP is not logged - if content_hash unchanged, no entry is created.
 * DECISION is for non-mutation outcomes (ORPHAN, TDD_COHERENCE_OK, TDD_COHERENCE_MISMATCH).
 */
export type LedgerOperation = 'CREATE' | 'UPDATE' | 'DECISION';

/**
 * Entry kind distinguishes entity vs relationship vs decision entries.
 * Added in Pre-A2 Hardening to support relationship logging.
 * Extended in A3 for decision logging.
 */
export type LedgerEntryKind = 'entity' | 'relationship' | 'decision';

/**
 * Decision types for DECISION entries.
 * Added in A3 for marker extraction decision logging.
 */
export type DecisionType = 'ORPHAN' | 'TDD_COHERENCE_OK' | 'TDD_COHERENCE_MISMATCH';

/**
 * A shadow ledger entry captures the provenance of an entity mutation.
 */
export interface LedgerEntry {
  timestamp: string;          // ISO 8601 timestamp
  operation: LedgerOperation;
  kind?: LedgerEntryKind;     // 'entity' | 'relationship' | 'decision'
  entity_type: string;        // E-code (E01, E02, etc.) or R-code for relationships
  entity_id: string;          // UUID of the entity or relationship
  instance_id: string;        // Business key (EPIC-1, STORY-1.1, R01:..., etc.)
  content_hash: string;       // SHA-256 hash of content
  evidence: EvidenceAnchor;
  project_id: string;
}

/**
 * A decision entry captures a non-mutation decision outcome.
 * Used for marker extraction decisions (ORPHAN, TDD coherence).
 * Added in A3 per plan: every marker emits a decision or mutation entry.
 */
export interface DecisionEntry {
  timestamp: string;           // ISO 8601 timestamp
  operation: 'DECISION';
  kind: 'decision';
  decision: DecisionType;      // ORPHAN, TDD_COHERENCE_OK, TDD_COHERENCE_MISMATCH
  marker_type: string;         // 'implements' | 'satisfies' | 'tdd'
  target_id: string;           // Target of marker (STORY-X.Y, AC-X.Y.Z, TDD-*)
  source_entity_id: string;    // Source entity instance_id
  source_file: string;         // Source file path
  line_start: number;          // File-absolute line start
  line_end: number;            // File-absolute line end
  reason?: string;             // Validation error message (for ORPHAN/MISMATCH)
  project_id: string;
}

/**
 * Shadow Ledger - append-only log of all entity mutations.
 * Per Verification Spec §8.1.3 and AC-64.1.16.
 */
export class ShadowLedger {
  private readonly ledgerPath: string;
  private initialized = false;

  constructor(ledgerPath: string = 'shadow-ledger/ledger.jsonl') {
    this.ledgerPath = ledgerPath;
  }

  /**
   * Initialize the ledger - ensure directory and file exist.
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    const dir = path.dirname(this.ledgerPath);
    await fs.mkdir(dir, { recursive: true });

    try {
      await fs.access(this.ledgerPath);
    } catch {
      await fs.writeFile(this.ledgerPath, '');
    }

    this.initialized = true;
  }

  /**
   * Append an entry to the ledger.
   * Only called on actual CREATE/UPDATE - never on NO-OP.
   */
  async append(entry: Omit<LedgerEntry, 'timestamp'>): Promise<void> {
    await this.initialize();

    const fullEntry: LedgerEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    };

    const line = JSON.stringify(fullEntry) + '\n';
    await fs.appendFile(this.ledgerPath, line);
  }

  /**
   * Log a CREATE operation.
   */
  async logCreate(
    entityType: string,
    entityId: string,
    instanceId: string,
    contentHash: string,
    evidence: EvidenceAnchor,
    projectId: string
  ): Promise<void> {
    await this.append({
      operation: 'CREATE',
      entity_type: entityType,
      entity_id: entityId,
      instance_id: instanceId,
      content_hash: contentHash,
      evidence,
      project_id: projectId,
    });
  }

  /**
   * Log an UPDATE operation.
   */
  async logUpdate(
    entityType: string,
    entityId: string,
    instanceId: string,
    contentHash: string,
    evidence: EvidenceAnchor,
    projectId: string
  ): Promise<void> {
    await this.append({
      operation: 'UPDATE',
      entity_type: entityType,
      entity_id: entityId,
      instance_id: instanceId,
      content_hash: contentHash,
      evidence,
      project_id: projectId,
    });
  }

  /**
   * Log a relationship CREATE operation.
   * Added in Pre-A2 Hardening for relationship tracking.
   */
  async logRelationshipCreate(
    relationshipType: string,
    relationshipId: string,
    instanceId: string,
    contentHash: string,
    evidence: EvidenceAnchor,
    projectId: string
  ): Promise<void> {
    await this.append({
      operation: 'CREATE',
      kind: 'relationship',
      entity_type: relationshipType, // R-code
      entity_id: relationshipId,
      instance_id: instanceId,
      content_hash: contentHash,
      evidence,
      project_id: projectId,
    });
  }

  /**
   * Log a relationship UPDATE operation.
   * Added in Pre-A2 Hardening for relationship tracking.
   */
  async logRelationshipUpdate(
    relationshipType: string,
    relationshipId: string,
    instanceId: string,
    contentHash: string,
    evidence: EvidenceAnchor,
    projectId: string
  ): Promise<void> {
    await this.append({
      operation: 'UPDATE',
      kind: 'relationship',
      entity_type: relationshipType, // R-code
      entity_id: relationshipId,
      instance_id: instanceId,
      content_hash: contentHash,
      evidence,
      project_id: projectId,
    });
  }

  /**
   * Log a DECISION entry for non-mutation outcomes.
   * Added in A3 for marker extraction decision logging.
   * 
   * Per A3 plan: every marker processed emits exactly one of:
   * - CREATE/UPDATE (mutation)
   * - DECISION (ORPHAN, TDD_COHERENCE_OK, TDD_COHERENCE_MISMATCH)
   * - No entry for NO-OP (relationship unchanged)
   */
  async logDecision(entry: Omit<DecisionEntry, 'timestamp' | 'operation' | 'kind'>): Promise<void> {
    await this.initialize();

    const fullEntry: DecisionEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
      operation: 'DECISION',
      kind: 'decision',
    };

    const line = JSON.stringify(fullEntry) + '\n';
    await fs.appendFile(this.ledgerPath, line);
  }

  /**
   * Get all entries from the ledger.
   */
  async getEntries(): Promise<LedgerEntry[]> {
    await this.initialize();

    const content = await fs.readFile(this.ledgerPath, 'utf8');
    return content
      .split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line) as LedgerEntry);
  }

  /**
   * Get entries for a specific entity.
   */
  async getEntriesForEntity(instanceId: string): Promise<LedgerEntry[]> {
    const entries = await this.getEntries();
    return entries.filter(e => e.instance_id === instanceId);
  }

  /**
   * Get entries by operation type.
   */
  async getEntriesByOperation(operation: LedgerOperation): Promise<LedgerEntry[]> {
    const entries = await this.getEntries();
    return entries.filter(e => e.operation === operation);
  }

  /**
   * Get total entry count.
   */
  async getCount(): Promise<number> {
    const entries = await this.getEntries();
    return entries.length;
  }

  /**
   * Get the ledger file path.
   */
  getPath(): string {
    return this.ledgerPath;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Project-Scoped Ledger Factory
// ═══════════════════════════════════════════════════════════════════════════

// Cache of project-scoped ledgers
const projectLedgers = new Map<string, ShadowLedger>();

/**
 * Get a project-scoped shadow ledger instance.
 * 
 * Each project gets its own ledger file at:
 *   shadow-ledger/{project_id}/ledger.jsonl
 * 
 * This ensures complete isolation between projects.
 * 
 * @param projectId - The project UUID
 * @returns ShadowLedger instance scoped to the project
 */
export function getProjectLedger(projectId: string): ShadowLedger {
  if (!projectId) {
    throw new Error('projectId is required for getProjectLedger');
  }
  
  let ledger = projectLedgers.get(projectId);
  if (!ledger) {
    const ledgerPath = `shadow-ledger/${projectId}/ledger.jsonl`;
    ledger = new ShadowLedger(ledgerPath);
    projectLedgers.set(projectId, ledger);
  }
  return ledger;
}

/**
 * Clear the project ledger cache.
 * Useful for testing.
 */
export function clearProjectLedgerCache(): void {
  projectLedgers.clear();
}

// Legacy singleton instance (uses flat structure)
// DEPRECATED: Use getProjectLedger(projectId) for new code
export const shadowLedger = new ShadowLedger();

