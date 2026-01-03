/**
 * B.3 Graph Snapshot Creation
 * 
 * Track B: Story B.3 - Drift Detection
 * TDD ID: TDD-TRACKB-B3
 * 
 * Creates complete graph snapshots via HTTP Graph API v2 enumeration.
 * NO direct database access. All reads via HTTP.
 * 
 * Filename convention: SNAPSHOT-<label>-<commit_sha_7>-<timestamp>.json
 * This prevents accidental overwrites even if same label is reused.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { GraphSnapshot } from './types.js';
import { enumerateAllEntities, enumerateAllRelationships } from './http-client.js';
import { computeEntityMerkleRoot, computeRelationshipMerkleRoot } from './merkle.js';

// Default snapshot storage directory
const SNAPSHOT_DIR = 'data/track_b/drift-detection';

/**
 * Get current git commit SHA.
 */
function getCommitSha(): string {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
  } catch {
    return 'unknown';
  }
}

/**
 * Generate snapshot ID with label, commit SHA, and timestamp.
 * Format: SNAPSHOT-<label>-<commit_sha_7>-<timestamp>
 */
function generateSnapshotId(label: string, commitSha: string, createdAt: string): string {
  const sha7 = commitSha.slice(0, 7);
  // Replace colons in timestamp for filesystem compatibility
  const safeTimestamp = createdAt.replace(/:/g, '-').replace(/\./g, '-');
  return `SNAPSHOT-${label}-${sha7}-${safeTimestamp}`;
}

/**
 * Generate snapshot filename.
 */
function generateSnapshotFilename(snapshotId: string): string {
  return `${snapshotId}.json`;
}

/**
 * Create a complete graph snapshot.
 * 
 * Enumerates all entities (per type) and all relationships via HTTP,
 * computes Merkle roots, and returns the snapshot.
 * 
 * @param baseUrl - Graph API v2 base URL (e.g., http://localhost:3001)
 * @param projectId - Project UUID
 * @param label - User-provided label for this snapshot
 * @returns Complete GraphSnapshot
 */
export async function createGraphSnapshot(
  baseUrl: string,
  projectId: string,
  label: string
): Promise<GraphSnapshot> {
  const commitSha = getCommitSha();
  const createdAt = new Date().toISOString();
  const id = generateSnapshotId(label, commitSha, createdAt);
  
  console.log(`[B.3] Creating snapshot: ${id}`);
  console.log(`[B.3] Enumerating entities from ${baseUrl}...`);
  
  // Enumerate all entities (loops types AND paginates within each)
  const entities = await enumerateAllEntities(baseUrl, projectId);
  console.log(`[B.3] Enumerated ${entities.length} entities`);
  
  // Enumerate all relationships (paginates full set)
  console.log(`[B.3] Enumerating relationships...`);
  const relationships = await enumerateAllRelationships(baseUrl, projectId);
  console.log(`[B.3] Enumerated ${relationships.length} relationships`);
  
  // Compute Merkle roots
  console.log(`[B.3] Computing Merkle roots...`);
  const entityMerkleRoot = computeEntityMerkleRoot(entities);
  const relationshipMerkleRoot = computeRelationshipMerkleRoot(relationships);
  
  const snapshot: GraphSnapshot = {
    id,
    label,
    created_at: createdAt,
    project_id: projectId,
    commit_sha: commitSha,
    entity_count: entities.length,
    relationship_count: relationships.length,
    entity_merkle_root: entityMerkleRoot,
    relationship_merkle_root: relationshipMerkleRoot,
    entities,
    relationships,
  };
  
  console.log(`[B.3] Snapshot created: ${id}`);
  console.log(`[B.3]   Entity Merkle root: ${entityMerkleRoot.slice(0, 16)}...`);
  console.log(`[B.3]   Relationship Merkle root: ${relationshipMerkleRoot.slice(0, 16)}...`);
  
  return snapshot;
}

/**
 * Save a snapshot to disk.
 * 
 * @param repoRoot - Repository root path
 * @param snapshot - GraphSnapshot to save
 * @returns Full path to saved file
 */
export async function saveSnapshot(repoRoot: string, snapshot: GraphSnapshot): Promise<string> {
  const dir = path.join(repoRoot, SNAPSHOT_DIR);
  await fs.promises.mkdir(dir, { recursive: true });
  
  const filename = generateSnapshotFilename(snapshot.id);
  const filepath = path.join(dir, filename);
  
  await fs.promises.writeFile(filepath, JSON.stringify(snapshot, null, 2), 'utf-8');
  console.log(`[B.3] Snapshot saved: ${filepath}`);
  
  return filepath;
}

/**
 * Load a snapshot from disk by ID.
 * 
 * @param repoRoot - Repository root path
 * @param snapshotId - Snapshot ID (or filename without .json)
 * @returns GraphSnapshot or null if not found
 */
export async function loadSnapshot(repoRoot: string, snapshotId: string): Promise<GraphSnapshot | null> {
  const dir = path.join(repoRoot, SNAPSHOT_DIR);
  const filename = snapshotId.endsWith('.json') ? snapshotId : `${snapshotId}.json`;
  const filepath = path.join(dir, filename);
  
  try {
    const content = await fs.promises.readFile(filepath, 'utf-8');
    return JSON.parse(content) as GraphSnapshot;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

/**
 * Find the latest snapshot by created_at timestamp.
 * 
 * DETERMINISTIC: Uses created_at inside snapshot JSON, NOT filesystem mtime.
 * 
 * @param repoRoot - Repository root path
 * @returns Latest GraphSnapshot or null if no snapshots exist
 */
export async function findLatestSnapshot(repoRoot: string): Promise<GraphSnapshot | null> {
  const dir = path.join(repoRoot, SNAPSHOT_DIR);
  
  let files: string[];
  try {
    files = await fs.promises.readdir(dir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw error;
  }
  
  const snapshotFiles = files.filter(f => f.startsWith('SNAPSHOT-') && f.endsWith('.json'));
  
  if (snapshotFiles.length === 0) {
    return null;
  }
  
  let latest: GraphSnapshot | null = null;
  let latestTime = '';
  
  for (const file of snapshotFiles) {
    const filepath = path.join(dir, file);
    const content = await fs.promises.readFile(filepath, 'utf-8');
    const snap: GraphSnapshot = JSON.parse(content);
    
    // Compare by created_at (ISO-8601 strings sort correctly)
    if (snap.created_at > latestTime) {
      latestTime = snap.created_at;
      latest = snap;
    }
  }
  
  return latest;
}

/**
 * List all snapshot IDs in storage.
 * 
 * @param repoRoot - Repository root path
 * @returns Array of snapshot IDs (sorted by created_at)
 */
export async function listSnapshots(repoRoot: string): Promise<string[]> {
  const dir = path.join(repoRoot, SNAPSHOT_DIR);
  
  let files: string[];
  try {
    files = await fs.promises.readdir(dir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
  
  const snapshotFiles = files.filter(f => f.startsWith('SNAPSHOT-') && f.endsWith('.json'));
  
  // Load all to sort by created_at
  const snapshots: Array<{ id: string; created_at: string }> = [];
  
  for (const file of snapshotFiles) {
    const filepath = path.join(dir, file);
    const content = await fs.promises.readFile(filepath, 'utf-8');
    const snap: GraphSnapshot = JSON.parse(content);
    snapshots.push({ id: snap.id, created_at: snap.created_at });
  }
  
  // Sort by created_at ascending
  snapshots.sort((a, b) => a.created_at.localeCompare(b.created_at));
  
  return snapshots.map(s => s.id);
}

