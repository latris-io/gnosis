// src/ledger/epoch-service.ts
// @implements STORY-64.1
//
// Epoch management for ledger/corpus isolation and replay semantics.
//
// ═══════════════════════════════════════════════════════════════════════════
// EPOCH SEMANTICS
// ═══════════════════════════════════════════════════════════════════════════
//
// An epoch represents a single extraction run with:
// - project_id: Which project this extraction is for
// - repo_sha: Git commit SHA at time of extraction
// - runner_sha: Git SHA of the Gnosis system itself
// - brd_hash: Hash of BRD content for reproducibility
// - started_at: When the epoch began
// - completed_at: When the epoch finished (null if in-progress or failed)
//
// Epoch guarantees:
// - An epoch is created and completed within one run
// - If a run crashes, the epoch remains incomplete (no completed_at)
// - Duplicate CREATE detection is scoped to the current epoch (in-memory Set)
// - Replay is defined as: same (project_id, repo_sha) produces same outputs
//
// ═══════════════════════════════════════════════════════════════════════════

import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { execSync } from 'child_process';

/**
 * Epoch context captured at the start of an extraction run.
 */
export interface EpochContext {
  epoch_id: string;           // Unique epoch identifier (UUID)
  project_id: string;         // Project UUID
  repo_sha: string;           // Git SHA of the repository
  runner_sha: string;         // Git SHA of Gnosis codebase
  brd_hash: string;           // SHA-256 of BRD content
  started_at: string;         // ISO 8601 timestamp
  completed_at: string | null; // ISO 8601 timestamp or null if incomplete
  status: 'running' | 'completed' | 'failed';
}

/**
 * Epoch metadata stored in epoch file.
 */
export interface EpochMetadata extends EpochContext {
  entities_created: number;
  entities_updated: number;
  relationships_created: number;
  relationships_updated: number;
  decisions_logged: number;
  signals_captured: number;
}

// Current active epoch (process-local)
let currentEpoch: EpochContext | null = null;

// Duplicate detection Set for current epoch
// Key format: ${kind}:${entity_type}:${instance_id}
const epochCreateSet = new Set<string>();

/**
 * Get the current Git SHA of the repository.
 */
export function getRepoSha(): string {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

/**
 * Get the Git SHA of the Gnosis runner (this codebase).
 * In practice this is the same as repo_sha when running self-ingestion.
 */
export function getRunnerSha(): string {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

/**
 * Compute a deterministic hash of the BRD content.
 * Canonicalizes line endings and trailing whitespace before hashing.
 */
export async function computeBrdHash(brdPath: string = 'docs/BRD_V20_6_4_COMPLETE.md'): Promise<string> {
  try {
    const content = await fs.readFile(brdPath, 'utf8');
    // Canonicalize: normalize line endings, trim trailing whitespace per line
    const canonical = content
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map(line => line.trimEnd())
      .join('\n');
    // Return full SHA-256 hash (64 hex chars) with prefix for identification
    return `sha256:${crypto.createHash('sha256').update(canonical).digest('hex')}`;
  } catch {
    return 'brd-not-found';
  }
}

/**
 * Generate a unique epoch ID.
 */
function generateEpochId(): string {
  return crypto.randomUUID();
}

/**
 * Get the epochs directory path for a project.
 */
export function getEpochsDir(projectId: string): string {
  return `shadow-ledger/${projectId}/epochs`;
}

/**
 * Get the path to a specific epoch file.
 */
export function getEpochPath(projectId: string, epochId: string): string {
  return path.join(getEpochsDir(projectId), `${epochId}.json`);
}

/**
 * Start a new epoch for an extraction run.
 * 
 * @param projectId - The project UUID
 * @param brdPath - Optional path to BRD file for hash computation
 * @returns The epoch context
 */
export async function startEpoch(
  projectId: string,
  brdPath: string = 'docs/BRD_V20_6_4_COMPLETE.md'
): Promise<EpochContext> {
  if (currentEpoch) {
    throw new Error('An epoch is already in progress. Call completeEpoch() first.');
  }

  const epochId = generateEpochId();
  const repoSha = getRepoSha();
  const runnerSha = getRunnerSha();
  const brdHash = await computeBrdHash(brdPath);

  currentEpoch = {
    epoch_id: epochId,
    project_id: projectId,
    repo_sha: repoSha,
    runner_sha: runnerSha,
    brd_hash: brdHash,
    started_at: new Date().toISOString(),
    completed_at: null,
    status: 'running',
  };

  // Clear the duplicate detection set for this new epoch
  epochCreateSet.clear();

  // Ensure epochs directory exists
  const epochsDir = getEpochsDir(projectId);
  await fs.mkdir(epochsDir, { recursive: true });

  // Write initial epoch file
  const epochPath = getEpochPath(projectId, epochId);
  await fs.writeFile(epochPath, JSON.stringify(currentEpoch, null, 2));

  return currentEpoch;
}

/**
 * Compute actual counts from the ledger for the current epoch.
 * Streams the ledger file and counts entries matching the epoch_id.
 */
async function computeEpochCounts(projectId: string, epochId: string): Promise<{
  entities_created: number;
  entities_updated: number;
  relationships_created: number;
  relationships_updated: number;
  decisions_logged: number;
}> {
  const ledgerPath = `shadow-ledger/${projectId}/ledger.jsonl`;
  
  let content = '';
  try {
    content = await fs.readFile(ledgerPath, 'utf8');
  } catch {
    // Ledger doesn't exist yet - all zeros
    return {
      entities_created: 0,
      entities_updated: 0,
      relationships_created: 0,
      relationships_updated: 0,
      decisions_logged: 0,
    };
  }
  
  const counts = {
    entities_created: 0,
    entities_updated: 0,
    relationships_created: 0,
    relationships_updated: 0,
    decisions_logged: 0,
  };
  
  const lines = content.split('\n').filter(l => l.trim());
  for (const line of lines) {
    try {
      const entry = JSON.parse(line);
      if (entry.epoch_id !== epochId) continue;
      
      if (entry.operation === 'DECISION') {
        counts.decisions_logged++;
      } else if (entry.operation === 'CREATE') {
        if (entry.kind === 'entity') counts.entities_created++;
        else if (entry.kind === 'relationship') counts.relationships_created++;
      } else if (entry.operation === 'UPDATE') {
        if (entry.kind === 'entity') counts.entities_updated++;
        else if (entry.kind === 'relationship') counts.relationships_updated++;
      }
    } catch {
      // Skip malformed lines
    }
  }
  
  return counts;
}

/**
 * Compute signal count from the corpus for the current epoch.
 */
async function computeSignalCount(projectId: string, epochId: string): Promise<number> {
  const corpusPath = `semantic-corpus/${projectId}/signals.jsonl`;
  
  let content = '';
  try {
    content = await fs.readFile(corpusPath, 'utf8');
  } catch {
    return 0;
  }
  
  let count = 0;
  const lines = content.split('\n').filter(l => l.trim());
  for (const line of lines) {
    try {
      const signal = JSON.parse(line);
      if (signal.epoch_id === epochId) count++;
    } catch {
      // Skip malformed lines
    }
  }
  
  return count;
}

/**
 * Complete the current epoch.
 * Computes actual counts from ledger/corpus by filtering on epoch_id.
 * 
 * @returns The completed epoch metadata with computed counts
 */
export async function completeEpoch(): Promise<EpochMetadata> {
  if (!currentEpoch) {
    throw new Error('No epoch in progress. Call startEpoch() first.');
  }

  // Compute actual counts from ledger and corpus
  const ledgerCounts = await computeEpochCounts(currentEpoch.project_id, currentEpoch.epoch_id);
  const signalCount = await computeSignalCount(currentEpoch.project_id, currentEpoch.epoch_id);

  const metadata: EpochMetadata = {
    ...currentEpoch,
    completed_at: new Date().toISOString(),
    status: 'completed',
    entities_created: ledgerCounts.entities_created,
    entities_updated: ledgerCounts.entities_updated,
    relationships_created: ledgerCounts.relationships_created,
    relationships_updated: ledgerCounts.relationships_updated,
    decisions_logged: ledgerCounts.decisions_logged,
    signals_captured: signalCount,
  };

  // Write completed epoch file
  const epochPath = getEpochPath(currentEpoch.project_id, currentEpoch.epoch_id);
  await fs.writeFile(epochPath, JSON.stringify(metadata, null, 2));

  // Clear epoch state
  currentEpoch = null;
  epochCreateSet.clear();

  return metadata;
}

/**
 * Mark the current epoch as failed.
 * 
 * @param error - Optional error message
 */
export async function failEpoch(error?: string): Promise<void> {
  if (!currentEpoch) {
    return; // No epoch to fail
  }

  const failedEpoch = {
    ...currentEpoch,
    completed_at: new Date().toISOString(),
    status: 'failed' as const,
    error,
  };

  // Write failed epoch file
  const epochPath = getEpochPath(currentEpoch.project_id, currentEpoch.epoch_id);
  await fs.writeFile(epochPath, JSON.stringify(failedEpoch, null, 2));

  // Clear epoch state
  currentEpoch = null;
  epochCreateSet.clear();
}

/**
 * Get the current active epoch, if any.
 */
export function getCurrentEpoch(): EpochContext | null {
  return currentEpoch;
}

/**
 * Check if a CREATE operation would be a duplicate within the current epoch.
 * 
 * @param kind - The entry kind ('entity' | 'relationship')
 * @param entityType - The E-code or R-code
 * @param instanceId - The instance ID
 * @returns true if this is a duplicate CREATE, false otherwise
 */
export function isDuplicateCreate(kind: string, entityType: string, instanceId: string): boolean {
  const key = `${kind}:${entityType}:${instanceId}`;
  return epochCreateSet.has(key);
}

/**
 * Record a CREATE operation in the current epoch.
 * 
 * @param kind - The entry kind ('entity' | 'relationship')
 * @param entityType - The E-code or R-code
 * @param instanceId - The instance ID
 * @throws Error if this is a duplicate CREATE within the same epoch
 */
export function recordCreate(kind: string, entityType: string, instanceId: string): void {
  const key = `${kind}:${entityType}:${instanceId}`;
  if (epochCreateSet.has(key)) {
    throw new Error(`Duplicate CREATE in epoch: ${key}`);
  }
  epochCreateSet.add(key);
}

/**
 * List all epochs for a project.
 * 
 * @param projectId - The project UUID
 * @returns Array of epoch metadata, sorted by started_at descending
 */
export async function listEpochs(projectId: string): Promise<EpochMetadata[]> {
  const epochsDir = getEpochsDir(projectId);
  
  try {
    const files = await fs.readdir(epochsDir);
    const epochs: EpochMetadata[] = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const content = await fs.readFile(path.join(epochsDir, file), 'utf8');
        epochs.push(JSON.parse(content));
      }
    }
    
    // Sort by started_at descending (newest first)
    epochs.sort((a, b) => b.started_at.localeCompare(a.started_at));
    return epochs;
  } catch {
    return [];
  }
}

/**
 * Get the latest completed epoch for a project.
 * 
 * @param projectId - The project UUID
 * @returns The latest completed epoch, or null if none
 */
export async function getLatestEpoch(projectId: string): Promise<EpochMetadata | null> {
  const epochs = await listEpochs(projectId);
  return epochs.find(e => e.status === 'completed') ?? null;
}

/**
 * Clear epoch state (for testing).
 */
export function clearEpochState(): void {
  currentEpoch = null;
  epochCreateSet.clear();
}

