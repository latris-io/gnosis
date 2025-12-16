#!/usr/bin/env npx tsx
// scripts/run-a1-extraction.ts
// @implements STORY-64.1
// @satisfies AC-64.1.1, AC-64.1.2, AC-64.1.3, AC-64.1.4, AC-64.1.5, AC-64.1.6, AC-64.1.7, AC-64.1.8
// A1 Entity Extraction Runner - orchestrates all A1 providers and persists to PostgreSQL
// NOTE: Shadow ledger writes are handled by entityService.batchUpsert() - DO NOT double-log

import 'dotenv/config';
import { brdProvider } from '../src/extraction/providers/brd-provider.js';
import { filesystemProvider } from '../src/extraction/providers/filesystem-provider.js';
import { astProvider } from '../src/extraction/providers/ast-provider.js';
import { gitProvider } from '../src/extraction/providers/git-provider.js';
import { changesetProvider } from '../src/extraction/providers/changeset-provider.js';
import { batchUpsert, type UpsertResult } from '../src/services/entities/entity-service.js';
import { semanticCorpus, captureCorrectSignal, captureIncorrectSignal } from '../src/ledger/semantic-corpus.js';
import type { RepoSnapshot, ExtractionProvider, ExtractedEntity } from '../src/extraction/types.js';
import type { EntityTypeCode } from '../src/schema/track-a/entities.js';

// ============================================================================
// Configuration
// ============================================================================

const PROJECT_ID = process.env.PROJECT_ID;
const REPO_ROOT = process.env.REPO_ROOT || process.cwd();
const MIN_SIGNALS = 50;

// Provider execution order per plan
const providers: ExtractionProvider[] = [
  brdProvider,         // E01, E02, E03, E04
  filesystemProvider,  // E06, E11, E27
  astProvider,         // E08, E12, E13, E15, E28, E29
  gitProvider,         // E49, E50
  changesetProvider,   // E52
];

// ============================================================================
// Helpers
// ============================================================================

function formatTimestamp(): string {
  return new Date().toISOString();
}

function countByEntityType(entities: ExtractedEntity[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const entity of entities) {
    counts[entity.entity_type] = (counts[entity.entity_type] || 0) + 1;
  }
  return counts;
}

function formatEntityCounts(counts: Record<string, number>): string {
  return Object.entries(counts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([type, count]) => `${type}:${count}`)
    .join(', ');
}

function summarizeUpsertResults(results: UpsertResult[]): { created: number; updated: number; noOp: number } {
  let created = 0;
  let updated = 0;
  let noOp = 0;

  for (const result of results) {
    switch (result.operation) {
      case 'CREATE':
        created++;
        break;
      case 'UPDATE':
        updated++;
        break;
      case 'NO-OP':
        noOp++;
        break;
    }
  }

  return { created, updated, noOp };
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
  console.log('=== A1 Entity Extraction ===');
  console.log(`Project: ${PROJECT_ID}`);
  console.log(`Timestamp: ${formatTimestamp()}`);
  console.log(`Repo Root: ${REPO_ROOT}`);
  console.log('');

  // Validate PROJECT_ID
  if (!PROJECT_ID) {
    console.error('\x1b[31m[ERROR]\x1b[0m PROJECT_ID environment variable is required');
    console.error('Usage: PROJECT_ID=<uuid> npm run extract:a1');
    process.exit(1);
  }

  // Create RepoSnapshot
  const snapshot: RepoSnapshot = {
    id: `snapshot-${Date.now()}`,
    root_path: REPO_ROOT,
    timestamp: new Date(),
  };

  // Collect all entities
  const allEntities: ExtractedEntity[] = [];
  let signalCount = 0;

  console.log('Running providers:');

  // Run each provider in order
  for (const provider of providers) {
    try {
      const startTime = Date.now();
      const result = await provider.extract(snapshot);
      const duration = Date.now() - startTime;

      const counts = countByEntityType(result.entities);
      const totalFromProvider = result.entities.length;
      
      console.log(`  \x1b[32m[OK]\x1b[0m ${provider.name}: ${totalFromProvider} entities (${formatEntityCounts(counts)}) [${duration}ms]`);
      
      allEntities.push(...result.entities);

      // Emit provider completion signal
      await captureCorrectSignal('MILESTONE', `provider-complete:${provider.name}`, {
        entity_count: totalFromProvider,
        counts,
        duration_ms: duration,
      });
      signalCount++;

      // Emit per entity-type summary signals
      for (const [entityType, count] of Object.entries(counts)) {
        await captureCorrectSignal('SUMMARY', `entity-type-${entityType}`, {
          provider: provider.name,
          count,
        });
        signalCount++;
      }
    } catch (error) {
      console.log(`  \x1b[31m[FAIL]\x1b[0m ${provider.name}: ${error}`);
      await captureIncorrectSignal('PROVIDER', provider.name, `Provider failed: ${error}`, {
        error: String(error),
      });
      signalCount++;
      
      // Hard fail on provider error
      process.exit(1);
    }
  }

  console.log('');
  console.log(`Persisting ${allEntities.length} entities to PostgreSQL...`);
  console.log('  (This may take several minutes for remote databases)');

  // Emit persistence start signal
  await captureCorrectSignal('MILESTONE', 'persistence-start', {
    entity_count: allEntities.length,
    project_id: PROJECT_ID,
  });
  signalCount++;

  // Persist to PostgreSQL via batchUpsert with progress
  // NOTE: batchUpsert internally logs to shadow ledger - DO NOT double-log
  let upsertResults: UpsertResult[];
  const startTime = Date.now();
  const progressInterval = 500; // entities per progress update
  let lastProgress = 0;
  
  try {
    upsertResults = [];
    for (let i = 0; i < allEntities.length; i++) {
      const result = await (await import('../src/services/entities/entity-service.js')).upsert(PROJECT_ID, allEntities[i]);
      upsertResults.push(result);
      
      // Progress output every N entities
      if (i - lastProgress >= progressInterval || i === allEntities.length - 1) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const pct = ((i + 1) / allEntities.length * 100).toFixed(1);
        const rate = ((i + 1) / (Date.now() - startTime) * 1000).toFixed(1);
        process.stdout.write(`\r  Progress: ${i + 1}/${allEntities.length} (${pct}%) - ${elapsed}s elapsed, ${rate} entities/sec`);
        lastProgress = i;
      }
    }
    console.log(''); // newline after progress
  } catch (error) {
    console.log(''); // newline after progress
    console.error(`\x1b[31m[ERROR]\x1b[0m Failed to persist entities: ${error}`);
    await captureIncorrectSignal('PERSISTENCE', 'batch-upsert', `Persistence failed: ${error}`, {
      error: String(error),
    });
    process.exit(1);
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  const { created, updated, noOp } = summarizeUpsertResults(upsertResults);
  console.log(`  Completed in ${totalTime}s`);
  console.log(`  Created: ${created}`);
  console.log(`  Updated: ${updated}`);
  console.log(`  No-Op: ${noOp}`);

  // Emit persistence complete signal
  await captureCorrectSignal('MILESTONE', 'persistence-complete', {
    created,
    updated,
    no_op: noOp,
    total: upsertResults.length,
  });
  signalCount++;

  // Calculate final counts
  const finalCounts = countByEntityType(allEntities);
  
  // Emit final success signal
  await captureCorrectSignal('MILESTONE', 'extraction-success', {
    total_entities: allEntities.length,
    persisted: created + updated,
    counts: finalCounts,
  });
  signalCount++;

  // Get actual signal count from corpus
  const actualSignalCount = await semanticCorpus.getCount();

  console.log('');
  console.log('=== SUMMARY ===');
  console.log(`Total entities extracted: ${allEntities.length}`);
  console.log(`Total entities persisted: ${created + updated} (${noOp} unchanged)`);
  console.log(`Semantic signals captured: ${actualSignalCount} (target: >= ${MIN_SIGNALS})`);
  console.log('');
  console.log('Entity breakdown:');
  for (const [type, count] of Object.entries(finalCounts).sort(([a], [b]) => a.localeCompare(b))) {
    console.log(`  ${type}: ${count}`);
  }

  // Verify minimum signals
  if (actualSignalCount < MIN_SIGNALS) {
    console.warn(`\x1b[33m[WARN]\x1b[0m Signal count (${actualSignalCount}) below minimum (${MIN_SIGNALS})`);
  }

  console.log('');
  console.log('\x1b[32mA1 EXTRACTION: SUCCESS\x1b[0m');
}

// Run
main().catch((error) => {
  console.error('\x1b[31m[FATAL]\x1b[0m', error);
  process.exit(1);
});
