// @implements STORY-64.1
// SANITY-046: E15 Module semantic validation
// Track A - E15 entities must be directory-based (backed by E11 corpus)
// Authority: e15_correction_r04-r07 plan Phase 5

import { describe, it, expect } from 'vitest';
import { rlsQuery } from '../utils/rls.js';
import 'dotenv/config';

// Get project ID from environment
const PROJECT_ID = process.env.PROJECT_ID;

describe('E15 SEMANTICS (Track A)', () => {
  // SANITY-046: E15 entities are directory-based (backed by E11 corpus)
  // Semantics Rule: MOD-<dir> is valid iff there exists at least one E11 with instance_id prefix FILE-<dir>/
  it('SANITY-046: E15 Entities Directory-Based (Track A)', async () => {
    if (!PROJECT_ID) {
      throw new Error('[SANITY-046] PROJECT_ID required - cannot skip E15 semantic validation');
    }

    // Query all E15 Module entities
    const e15Entities = await rlsQuery<{
      instance_id: string;
      name: string;
      attributes: Record<string, unknown>;
    }>(
      PROJECT_ID,
      `SELECT instance_id, name, attributes FROM entities WHERE entity_type = 'E15'`
    );

    // If no E15 entities exist, this is a phase-valid pass (pre-module extraction)
    if (e15Entities.length === 0) {
      console.log('[SANITY-046] No E15 entities to validate (pre-module extraction, valid)');
      return;
    }

    // Query all E11 SourceFile entities to build validation set
    const e11Entities = await rlsQuery<{
      instance_id: string;
    }>(
      PROJECT_ID,
      `SELECT instance_id FROM entities WHERE entity_type = 'E11'`
    );

    // Build set of valid directory prefixes from E11 files
    const validDirPrefixes = new Set<string>();
    for (const file of e11Entities) {
      // Extract directory from FILE-<path>
      if (file.instance_id.startsWith('FILE-')) {
        const filePath = file.instance_id.slice(5);
        const lastSlash = filePath.lastIndexOf('/');
        if (lastSlash > 0) {
          const dir = filePath.substring(0, lastSlash);
          validDirPrefixes.add(dir);
        }
      }
    }

    // Validate each E15 module
    const invalid: string[] = [];
    const missingDerivedFrom: string[] = [];

    for (const module of e15Entities) {
      // Check MOD- prefix
      if (!module.instance_id.startsWith('MOD-')) {
        invalid.push(`${module.instance_id} (missing MOD- prefix)`);
        continue;
      }

      const moduleDir = module.instance_id.slice(4); // Remove 'MOD-' prefix

      // Check semantic validity: MOD-<dir> valid iff FILE-<dir>/... exists
      if (!validDirPrefixes.has(moduleDir)) {
        invalid.push(`${module.instance_id} (no backing E11 files)`);
      }

      // Check derived_from attribute (optional but expected after remediation)
      if (module.attributes?.derived_from !== 'directory-structure') {
        missingDerivedFrom.push(module.instance_id);
      }
    }

    // Report invalid modules
    if (invalid.length > 0) {
      console.warn(`[SANITY-046] Invalid E15 modules: ${invalid.slice(0, 10).join(', ')}${invalid.length > 10 ? '...' : ''}`);
      throw new Error(`[SANITY-046] ${invalid.length} E15 modules failed semantic validation: ${invalid.slice(0, 5).join(', ')}${invalid.length > 5 ? '...' : ''}`);
    }

    // Warn about missing derived_from (not a hard failure)
    if (missingDerivedFrom.length > 0) {
      console.warn(`[SANITY-046] E15 modules without derived_from='directory-structure': ${missingDerivedFrom.length}`);
    }

    console.log(`[SANITY-046] Validated ${e15Entities.length} E15 modules (all directory-based)`);
    expect(invalid.length).toBe(0);
  });

  // Additional check: All E11 files with non-root parent directories have matching modules
  it('SANITY-046b: E11 Files Have Matching Modules (Track A)', async () => {
    if (!PROJECT_ID) {
      throw new Error('[SANITY-046b] PROJECT_ID required');
    }

    // Query all E15 Module instance_ids
    const e15Entities = await rlsQuery<{ instance_id: string }>(
      PROJECT_ID,
      `SELECT instance_id FROM entities WHERE entity_type = 'E15'`
    );

    // If no E15 entities exist, skip this check
    if (e15Entities.length === 0) {
      console.log('[SANITY-046b] No E15 entities to check against (pre-module extraction, skipped)');
      return;
    }

    const existingModules = new Set(e15Entities.map(e => e.instance_id));

    // Query all E11 SourceFile entities
    const e11Entities = await rlsQuery<{ instance_id: string }>(
      PROJECT_ID,
      `SELECT instance_id FROM entities WHERE entity_type = 'E11'`
    );

    // Find E11 files that should have modules but don't
    const filesWithoutModules: string[] = [];

    for (const file of e11Entities) {
      if (!file.instance_id.startsWith('FILE-')) continue;

      const filePath = file.instance_id.slice(5);
      const lastSlash = filePath.lastIndexOf('/');

      // Skip root-level files (dirname is '.' or empty)
      if (lastSlash <= 0) continue;

      const dir = filePath.substring(0, lastSlash);
      const expectedModuleId = `MOD-${dir}`;

      if (!existingModules.has(expectedModuleId)) {
        filesWithoutModules.push(file.instance_id);
      }
    }

    if (filesWithoutModules.length > 0) {
      console.warn(`[SANITY-046b] E11 files without matching modules: ${filesWithoutModules.slice(0, 10).join(', ')}${filesWithoutModules.length > 10 ? '...' : ''}`);
      throw new Error(`[SANITY-046b] ${filesWithoutModules.length} E11 files missing modules: ${filesWithoutModules.slice(0, 5).join(', ')}${filesWithoutModules.length > 5 ? '...' : ''}`);
    }

    console.log(`[SANITY-046b] All ${e11Entities.length} E11 files have matching modules`);
    expect(filesWithoutModules.length).toBe(0);
  });
});
