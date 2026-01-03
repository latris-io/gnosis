// src/services/track_b/brd-registry/registry.ts
// Track B BRD Registry - Build and Check operations

import * as fs from 'fs';
import * as path from 'path';
import type { BrdRegistry, CheckResult, Discrepancy } from './types.js';
import { BRD_PATH, REGISTRY_PATH, SCHEMA_VERSION, EXPECTED_BRD_VERSION } from './config.js';
import { parseBrd, validateParsing } from './parser.js';
import { computeBrdHash, computeContentHash } from './hasher.js';
import { appendLedgerEntry, createBuildEntry, createCheckEntry } from './ledger.js';

/**
 * Ensure registry directory exists.
 */
function ensureRegistryDir(): void {
  const dir = path.dirname(REGISTRY_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Load stored registry from disk.
 * 
 * @returns Stored registry or null if not found
 */
export function loadRegistry(): BrdRegistry | null {
  if (!fs.existsSync(REGISTRY_PATH)) {
    return null;
  }
  
  try {
    const content = fs.readFileSync(REGISTRY_PATH, 'utf-8');
    return JSON.parse(content) as BrdRegistry;
  } catch (error) {
    console.warn(`Failed to load registry: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

/**
 * Save registry to disk.
 * 
 * @param registry - Registry to save
 */
export function saveRegistry(registry: BrdRegistry): void {
  ensureRegistryDir();
  fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2) + '\n', 'utf-8');
}

/**
 * Build the BRD registry from the canonical BRD file.
 * 
 * First-run behavior: Creates registry file, gate passes if parsing + hashing succeeds.
 * Subsequent runs: Overwrites existing registry with fresh parse.
 * 
 * @param brdPath - Optional path to BRD file (defaults to config)
 * @returns Built registry
 */
export async function buildRegistry(brdPath: string = BRD_PATH): Promise<BrdRegistry> {
  // Read BRD content
  if (!fs.existsSync(brdPath)) {
    throw new Error(`BRD file not found: ${brdPath}`);
  }
  
  const content = fs.readFileSync(brdPath, 'utf-8');
  
  // Parse content
  const parseResult = parseBrd(content, brdPath);
  
  // Validate parsing
  const validation = validateParsing(parseResult);
  if (!validation.valid) {
    console.warn('Parse validation warnings:', validation.errors);
  }
  
  // Validate version matches expected
  if (parseResult.version !== EXPECTED_BRD_VERSION) {
    console.warn(`BRD version mismatch: expected ${EXPECTED_BRD_VERSION}, found ${parseResult.version}`);
  }
  
  // Compute hashes
  const contentHash = computeContentHash(content);
  const { hash: blobHash, source: blobSource } = computeBrdHash(brdPath);
  
  // Build registry object
  const registry: BrdRegistry = {
    schema_version: SCHEMA_VERSION,
    generated_at: new Date().toISOString(),
    brd_path: brdPath,
    brd_version: parseResult.version,
    brd_content_hash: contentHash,
    brd_blob_hash: blobHash,
    brd_blob_source: blobSource,
    counts: {
      epics: parseResult.epics.length,
      stories: parseResult.stories.length,
      acs: parseResult.acs.length,
    },
    identifiers: {
      epics: parseResult.epics.map(e => e.id),
      stories: parseResult.stories.map(s => s.id),
      acs: parseResult.acs.map(a => a.id),
    },
  };
  
  // Save registry
  saveRegistry(registry);
  
  // Log to ledger
  appendLedgerEntry(createBuildEntry(
    brdPath,
    parseResult.version,
    contentHash,
    registry.counts,
    `Built from ${brdPath}`
  ));
  
  return registry;
}

/**
 * Check current BRD against stored registry for drift.
 * 
 * @param brdPath - Optional path to BRD file (defaults to config)
 * @returns Check result with discrepancies
 */
export async function checkRegistry(brdPath: string = BRD_PATH): Promise<CheckResult> {
  // Load stored registry
  const stored = loadRegistry();
  
  // Read and parse current BRD
  if (!fs.existsSync(brdPath)) {
    throw new Error(`BRD file not found: ${brdPath}`);
  }
  
  const content = fs.readFileSync(brdPath, 'utf-8');
  const parseResult = parseBrd(content, brdPath);
  const contentHash = computeContentHash(content);
  const { hash: blobHash, source: blobSource } = computeBrdHash(brdPath);
  
  // Build current registry for comparison
  const current: BrdRegistry = {
    schema_version: SCHEMA_VERSION,
    generated_at: new Date().toISOString(),
    brd_path: brdPath,
    brd_version: parseResult.version,
    brd_content_hash: contentHash,
    brd_blob_hash: blobHash,
    brd_blob_source: blobSource,
    counts: {
      epics: parseResult.epics.length,
      stories: parseResult.stories.length,
      acs: parseResult.acs.length,
    },
    identifiers: {
      epics: parseResult.epics.map(e => e.id),
      stories: parseResult.stories.map(s => s.id),
      acs: parseResult.acs.map(a => a.id),
    },
  };
  
  const discrepancies: Discrepancy[] = [];
  
  // If no stored registry, this is first run - no drift possible
  if (!stored) {
    appendLedgerEntry(createCheckEntry(
      brdPath,
      parseResult.version,
      contentHash,
      current.counts,
      'First run - no baseline to compare'
    ));
    
    return {
      matches: true,
      discrepancies: [],
      current,
      stored: undefined,
    };
  }
  
  // Compare version
  if (current.brd_version !== stored.brd_version) {
    discrepancies.push({
      type: 'VERSION_MISMATCH',
      field: 'brd_version',
      expected: stored.brd_version,
      actual: current.brd_version,
      details: `BRD version changed from ${stored.brd_version} to ${current.brd_version}`,
    });
  }
  
  // Compare content hash
  if (current.brd_content_hash !== stored.brd_content_hash) {
    discrepancies.push({
      type: 'HASH_MISMATCH',
      field: 'brd_content_hash',
      expected: stored.brd_content_hash,
      actual: current.brd_content_hash,
      details: 'BRD content hash has changed',
    });
  }
  
  // Compare counts
  if (current.counts.epics !== stored.counts.epics) {
    discrepancies.push({
      type: 'COUNT_MISMATCH',
      field: 'counts.epics',
      expected: stored.counts.epics,
      actual: current.counts.epics,
      details: `Epic count changed from ${stored.counts.epics} to ${current.counts.epics}`,
    });
  }
  
  if (current.counts.stories !== stored.counts.stories) {
    discrepancies.push({
      type: 'COUNT_MISMATCH',
      field: 'counts.stories',
      expected: stored.counts.stories,
      actual: current.counts.stories,
      details: `Story count changed from ${stored.counts.stories} to ${current.counts.stories}`,
    });
  }
  
  if (current.counts.acs !== stored.counts.acs) {
    discrepancies.push({
      type: 'COUNT_MISMATCH',
      field: 'counts.acs',
      expected: stored.counts.acs,
      actual: current.counts.acs,
      details: `AC count changed from ${stored.counts.acs} to ${current.counts.acs}`,
    });
  }
  
  // Compare identifier sets (find added/removed)
  const storedEpicSet = new Set(stored.identifiers.epics);
  const currentEpicSet = new Set(current.identifiers.epics);
  
  for (const id of current.identifiers.epics) {
    if (!storedEpicSet.has(id)) {
      discrepancies.push({
        type: 'ID_MISMATCH',
        field: 'identifiers.epics',
        actual: id,
        details: `New epic added: ${id}`,
      });
    }
  }
  
  for (const id of stored.identifiers.epics) {
    if (!currentEpicSet.has(id)) {
      discrepancies.push({
        type: 'ID_MISMATCH',
        field: 'identifiers.epics',
        expected: id,
        details: `Epic removed: ${id}`,
      });
    }
  }
  
  // Log check
  appendLedgerEntry(createCheckEntry(
    brdPath,
    parseResult.version,
    contentHash,
    current.counts,
    discrepancies.length > 0 
      ? `${discrepancies.length} discrepancies found` 
      : 'No discrepancies'
  ));
  
  return {
    matches: discrepancies.length === 0,
    discrepancies,
    current,
    stored,
  };
}

