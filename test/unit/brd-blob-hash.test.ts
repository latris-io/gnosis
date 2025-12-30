// test/unit/brd-blob-hash.test.ts
// @implements STORY-64.1
// Tests for canonical BRD blob hash computation
// Ensures epoch brd_blob_hash matches baseline BRD_HASH

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  computeBrdBlobHash,
  computeBrdBlobHashWithSource,
  startEpoch, 
  completeEpoch, 
  clearEpochState,
  getCurrentEpoch
} from '../../src/ledger/epoch-service.js';
import * as fs from 'fs';
import * as path from 'path';

// Baseline values from .si-universe.env at hgr-1-baseline
const HGR1_REPO_SHA = 'd6c2c9e2171eb2c3019f1b2cd2a3eba96e1e33ab';
const BASELINE_BRD_HASH = 'bc1c78269d7b5192ddad9c06c1aa49c29abcf4a60cdaa039157a22b5c8c77977';

describe('BRD Blob Hash', () => {
  describe('computeBrdBlobHash', () => {
    it('matches baseline BRD_HASH for hgr-1-baseline repo_sha', () => {
      // Compute BRD blob hash at the exact commit from baseline
      const blobHash = computeBrdBlobHash(HGR1_REPO_SHA);
      
      // Should match the hash recorded in .si-universe.env
      expect(blobHash).toBe(`sha256:${BASELINE_BRD_HASH}`);
    });

    it('produces consistent sha256 format', () => {
      const hash = computeBrdBlobHash('HEAD');
      expect(hash).toMatch(/^sha256:[a-f0-9]{64}$/);
    });

    it('returns hash with fallback for invalid SHA', () => {
      const hash = computeBrdBlobHash('0000000000000000000000000000000000000000');
      // Falls back to filesystem, so should still get a valid hash
      expect(hash).toMatch(/^sha256:[a-f0-9]{64}$/);
    });
  });

  describe('computeBrdBlobHashWithSource', () => {
    it('returns git_blob source for valid SHA', () => {
      const result = computeBrdBlobHashWithSource(HGR1_REPO_SHA);
      expect(result.source).toBe('git_blob');
      expect(result.hash).toBe(`sha256:${BASELINE_BRD_HASH}`);
    });

    it('returns filesystem_fallback source for invalid SHA', () => {
      const result = computeBrdBlobHashWithSource('0000000000000000000000000000000000000000');
      expect(result.source).toBe('filesystem_fallback');
      expect(result.hash).toMatch(/^sha256:[a-f0-9]{64}$/);
    });
  });

  describe('Epoch brd_blob_hash', () => {
    const TEST_PROJECT_ID = 'test-brd-hash-project';
    const epochsDir = `shadow-ledger/${TEST_PROJECT_ID}/epochs`;

    beforeEach(async () => {
      clearEpochState();
      // Clean up test epochs directory
      if (fs.existsSync(epochsDir)) {
        const files = fs.readdirSync(epochsDir);
        for (const file of files) {
          fs.unlinkSync(path.join(epochsDir, file));
        }
      }
    });

    afterEach(async () => {
      clearEpochState();
      // Clean up test epochs directory
      if (fs.existsSync(epochsDir)) {
        const files = fs.readdirSync(epochsDir);
        for (const file of files) {
          fs.unlinkSync(path.join(epochsDir, file));
        }
        fs.rmdirSync(epochsDir);
        fs.rmdirSync(`shadow-ledger/${TEST_PROJECT_ID}`);
      }
    });

    it('new epoch includes brd_blob_hash and source fields', async () => {
      const epoch = await startEpoch(TEST_PROJECT_ID);
      
      // Epoch must have brd_blob_hash
      expect(epoch.brd_blob_hash).toBeDefined();
      expect(epoch.brd_blob_hash).toMatch(/^sha256:[a-f0-9]{64}$/);
      
      // Must have brd_blob_hash_source for provenance
      expect(epoch.brd_blob_hash_source).toBeDefined();
      expect(['git_blob', 'filesystem_fallback', 'error']).toContain(epoch.brd_blob_hash_source);
      
      // Also still has legacy brd_hash
      expect(epoch.brd_hash).toBeDefined();
      
      await completeEpoch();
    });

    it('brd_blob_hash matches computeBrdBlobHash(repo_sha)', async () => {
      const epoch = await startEpoch(TEST_PROJECT_ID);
      
      // Compute expected hash from the same repo_sha
      const expectedHash = computeBrdBlobHash(epoch.repo_sha);
      
      // Must match
      expect(epoch.brd_blob_hash).toBe(expectedHash);
      
      await completeEpoch();
    });

    it('brd_blob_hash and source are written to epoch metadata file', async () => {
      const epoch = await startEpoch(TEST_PROJECT_ID);
      const epochId = epoch.epoch_id;
      
      await completeEpoch();
      
      // Read the epoch file
      const epochPath = path.join(epochsDir, `${epochId}.json`);
      const epochData = JSON.parse(fs.readFileSync(epochPath, 'utf8'));
      
      // Must have brd_blob_hash in the written file
      expect(epochData.brd_blob_hash).toBeDefined();
      expect(epochData.brd_blob_hash).toMatch(/^sha256:[a-f0-9]{64}$/);
      
      // Must have brd_blob_hash_source for provenance audit
      expect(epochData.brd_blob_hash_source).toBeDefined();
      expect(['git_blob', 'filesystem_fallback', 'error']).toContain(epochData.brd_blob_hash_source);
    });
  });
});

