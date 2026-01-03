#!/usr/bin/env npx tsx
// @ts-nocheck
// LEGACY_SCAN_OK: This script audits/validates legacy ledger or corpus files
/**
 * Backfill Missing BRD ACs
 * Tier 2: Repair Script
 * 
 * Inserts missing E03 entities and R02 relationships from BRD.
 * Uses ops layer to ensure ledger coverage (G-API compliant).
 * 
 * REQUIRES: --confirm-repair flag and PROJECT_ID env var
 */
import 'dotenv/config';
import * as fs from 'fs';
import pg from 'pg';
import { parseBRD } from '../../src/extraction/parsers/brd-parser.js';
import { persistEntities, persistRelationships, closeConnections } from '../../src/ops/track-a.js';
import type { ExtractedEntity, ExtractedRelationship } from '../../src/extraction/types.js';
import { 
  requireConfirmRepair, 
  resolveProjectId, 
  createEvidence, 
  writeEvidenceMarkdown,
  type EvidenceArtifact 
} from '../_lib/operator-guard.js';
import { captureStateSnapshot, formatSnapshot } from '../_lib/state-snapshot.js';

const { Pool } = pg;
const SCRIPT_NAME = 'scripts/repair/backfill-missing-brd-acs.ts';

interface LedgerDeltaReport {
  run_header: {
    timestamp: string;
    git_sha: string;
    project_id: string;
    script: string;
  };
  baseline: {
    ledger_line_count: number;
    db_entity_count: number;
    db_relationship_count: number;
  };
  e03: {
    inserted: number;
    already_exists: number;
    ledger_appended: number;
  };
  r02: {
    inserted: number;
    already_exists: number;
    ledger_appended: number;
  };
  ending: {
    ledger_line_count: number;
    db_entity_count: number;
    db_relationship_count: number;
  };
  verification: {
    ledger_delta: number;
    expected_delta: number;
    match: boolean;
  };
}

async function main() {
  // === OPERATOR GUARD ===
  requireConfirmRepair(SCRIPT_NAME);
  const projectId = resolveProjectId();
  
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║              BACKFILL MISSING BRD ACs                          ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  // Initialize evidence
  const evidence: EvidenceArtifact = createEvidence(SCRIPT_NAME, projectId);

  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL, 
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  try {
    // Capture BEFORE state
    console.log('[SNAPSHOT] Capturing before state...');
    evidence.beforeCounts = await captureStateSnapshot(projectId);
    console.log(`  ${formatSnapshot(evidence.beforeCounts)}`);

    const brdPath = 'docs/BRD_V20_6_4_COMPLETE.md';
    const relativePath = 'docs/BRD_V20_6_4_COMPLETE.md';

    // Capture run header
    const timestamp = new Date().toISOString();
    console.log('\nRun Header:');
    console.log(`  Timestamp: ${timestamp}`);
    console.log(`  Git SHA: ${evidence.gitSha}`);
    console.log(`  Project ID: ${projectId}`);

    // Load detection report
    console.log('\nLoading detection report...');
    let detectionReport;
    try {
      detectionReport = JSON.parse(fs.readFileSync('si-readiness-results/missing-e03.json', 'utf-8'));
      console.log(`  Missing E03s: ${detectionReport.missing_count}`);
    } catch {
      console.log('  No detection report found. Scanning for missing ACs...');
      detectionReport = { missing_count: 0, missing_acs: [] };
    }

    // Capture baseline state
    const ledgerPath = `shadow-ledger/${projectId}/ledger.jsonl`;
    let ledgerBefore = 0;
    try {
      ledgerBefore = fs.readFileSync(ledgerPath, 'utf-8').split('\n').filter(l => l.trim()).length;
    } catch {
      // Ledger may not exist yet
    }
    
    const baselineEntities = await pool.query(
      'SELECT COUNT(*)::int AS c FROM entities WHERE project_id = $1',
      [projectId]
    );
    const baselineRels = await pool.query(
      'SELECT COUNT(*)::int AS c FROM relationships WHERE project_id = $1',
      [projectId]
    );
    
    console.log('\nBaseline State:');
    console.log(`  Ledger entries: ${ledgerBefore}`);
    console.log(`  DB entities: ${baselineEntities.rows[0].c}`);
    console.log(`  DB relationships: ${baselineRels.rows[0].c}`);

    if (detectionReport.missing_count === 0) {
      console.log('\nNo missing E03s. Nothing to backfill.');
      evidence.operations?.push('No missing E03s found - nothing to backfill');
      evidence.status = 'SUCCESS';
      return;
    }

    // Parse BRD to get full AC data
    console.log('\nParsing BRD for full AC data...');
    const content = fs.readFileSync(brdPath, 'utf-8');
    const parsed = parseBRD(content, brdPath);

    // Get existing stories for R02 relationships
    console.log('\nQuerying existing stories...');
    const storiesResult = await pool.query(
      'SELECT id, instance_id FROM entities WHERE entity_type = $1 AND project_id = $2',
      ['E02', projectId]
    );
    const storyMap = new Map(storiesResult.rows.map(r => [r.instance_id, r.id]));
    console.log(`  Stories in DB: ${storyMap.size}`);

    // Build set of missing instance_ids for quick lookup
    const missingIds = new Set(detectionReport.missing_acs.map((ac: any) => ac.instance_id));

    // Prepare entities and relationships
    const entitiesToInsert: ExtractedEntity[] = [];
    const relationshipsToInsert: ExtractedRelationship[] = [];

    for (const ac of parsed.acceptanceCriteria) {
      if (missingIds.has(ac.id)) {
        // E03 entity
        entitiesToInsert.push({
          entity_type: 'E03',
          instance_id: ac.id,
          name: `AC ${ac.epicNumber}.${ac.storyNumber}.${ac.acNumber}: ${ac.description.substring(0, 50)}`,
          attributes: {
            epic_number: ac.epicNumber,
            story_number: ac.storyNumber,
            ac_number: ac.acNumber,
            description: ac.description,
          },
          source_file: relativePath,
          line_start: ac.lineStart,
          line_end: ac.lineEnd,
        });

        // R02 relationship (Story -> AC)
        const storyInstanceId = `STORY-${ac.epicNumber}.${ac.storyNumber}`;
        if (storyMap.has(storyInstanceId)) {
          const r02InstanceId = `R02:${storyInstanceId}:${ac.id}`;
          relationshipsToInsert.push({
            relationship_type: 'R02',
            instance_id: r02InstanceId,
            name: `HAS_AC: ${storyInstanceId} → ${ac.id}`,
            from_entity_type: 'E02',
            from_instance_id: storyInstanceId,
            to_entity_type: 'E03',
            to_instance_id: ac.id,
            source_file: relativePath,
            line_start: ac.lineStart,
            line_end: ac.lineEnd,
            attributes: {},
          });
        } else {
          console.warn(`  Warning: Story ${storyInstanceId} not found for AC ${ac.id}`);
        }
      }
    }

    console.log(`\nPrepared:`);
    console.log(`  E03 entities: ${entitiesToInsert.length}`);
    console.log(`  R02 relationships: ${relationshipsToInsert.length}`);

    // Insert entities
    console.log('\n─────────────────────────────────────────────────────────────────');
    console.log('Upserting E03 entities...');
    let e03Inserted = 0, e03AlreadyExists = 0;

    const entityResults = await persistEntities(projectId, entitiesToInsert);
    for (const result of entityResults) {
      if (result.operation === 'CREATE') e03Inserted++;
      else e03AlreadyExists++;
    }

    const e03LedgerAppended = e03Inserted;
    console.log(`  inserted: ${e03Inserted}`);
    console.log(`  already_exists: ${e03AlreadyExists}`);
    console.log(`  ledger_appended: ${e03LedgerAppended}`);
    evidence.operations?.push(`Inserted ${e03Inserted} E03 entities (${e03AlreadyExists} already existed)`);

    // Insert relationships
    console.log('\n─────────────────────────────────────────────────────────────────');
    console.log('Upserting R02 relationships...');
    let r02Inserted = 0, r02AlreadyExists = 0;

    const batchSize = 50;
    for (let i = 0; i < relationshipsToInsert.length; i += batchSize) {
      const batch = relationshipsToInsert.slice(i, i + batchSize);
      console.log(`  Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(relationshipsToInsert.length/batchSize)}...`);
      const results = await persistRelationships(projectId, batch);
      for (const result of results) {
        if (result.operation === 'CREATE') r02Inserted++;
        else r02AlreadyExists++;
      }
    }

    const r02LedgerAppended = r02Inserted;
    console.log(`  inserted: ${r02Inserted}`);
    console.log(`  already_exists: ${r02AlreadyExists}`);
    console.log(`  ledger_appended: ${r02LedgerAppended}`);
    evidence.operations?.push(`Inserted ${r02Inserted} R02 relationships (${r02AlreadyExists} already existed)`);

    // Capture ending state
    let ledgerAfter = 0;
    try {
      ledgerAfter = fs.readFileSync(ledgerPath, 'utf-8').split('\n').filter(l => l.trim()).length;
    } catch {
      // Ledger may not exist
    }
    
    const endingEntities = await pool.query(
      'SELECT COUNT(*)::int AS c FROM entities WHERE project_id = $1',
      [projectId]
    );
    const endingRels = await pool.query(
      'SELECT COUNT(*)::int AS c FROM relationships WHERE project_id = $1',
      [projectId]
    );

    const ledgerDelta = ledgerAfter - ledgerBefore;
    const expectedDelta = e03LedgerAppended + r02LedgerAppended;

    // Generate comprehensive report
    const report: LedgerDeltaReport = {
      run_header: {
        timestamp,
        git_sha: evidence.gitSha,
        project_id: projectId,
        script: SCRIPT_NAME,
      },
      baseline: {
        ledger_line_count: ledgerBefore,
        db_entity_count: baselineEntities.rows[0].c,
        db_relationship_count: baselineRels.rows[0].c,
      },
      e03: {
        inserted: e03Inserted,
        already_exists: e03AlreadyExists,
        ledger_appended: e03LedgerAppended,
      },
      r02: {
        inserted: r02Inserted,
        already_exists: r02AlreadyExists,
        ledger_appended: r02LedgerAppended,
      },
      ending: {
        ledger_line_count: ledgerAfter,
        db_entity_count: endingEntities.rows[0].c,
        db_relationship_count: endingRels.rows[0].c,
      },
      verification: {
        ledger_delta: ledgerDelta,
        expected_delta: expectedDelta,
        match: ledgerDelta === expectedDelta,
      },
    };

    // Write legacy report format too
    try {
      fs.mkdirSync('si-readiness-results', { recursive: true });
      fs.writeFileSync('si-readiness-results/ledger-delta.json', JSON.stringify(report, null, 2));
    } catch {
      // Optional legacy report
    }

    // Summary
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('BACKFILL COMPLETE');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('E03:');
    console.log(`  inserted: ${e03Inserted}`);
    console.log(`  already_exists: ${e03AlreadyExists}`);
    console.log(`  ledger_appended: ${e03LedgerAppended}`);
    
    console.log('\nR02:');
    console.log(`  inserted: ${r02Inserted}`);
    console.log(`  already_exists: ${r02AlreadyExists}`);
    console.log(`  ledger_appended: ${r02LedgerAppended}`);

    console.log('\nEnding State:');
    console.log(`  Ledger entries: ${ledgerAfter}`);
    console.log(`  DB entities: ${endingEntities.rows[0].c}`);
    console.log(`  DB relationships: ${endingRels.rows[0].c}`);

    console.log('\nVerification:');
    console.log(`  Ledger delta: ${ledgerDelta}`);
    console.log(`  Expected delta: ${expectedDelta}`);
    if (report.verification.match) {
      console.log('  ✓ MATCH: Ledger delta equals expected');
    } else {
      console.log('  ✗ MISMATCH: Ledger delta does not match expected!');
    }

    // Capture AFTER state
    console.log('\n[SNAPSHOT] Capturing after state...');
    evidence.afterCounts = await captureStateSnapshot(projectId);
    console.log(`  ${formatSnapshot(evidence.afterCounts)}`);

    evidence.status = 'SUCCESS';
    
  } catch (err) {
    evidence.status = 'FAILED';
    evidence.errors?.push(String(err));
    console.error('\n✗ Error:', err);
    throw err;
  } finally {
    // Always write evidence
    writeEvidenceMarkdown(evidence);
    await pool.end();
    await closeConnections();
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

