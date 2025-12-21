// @ts-nocheck
// Backfill script: insert missing E03 entities and R02 relationships
// Uses entity-service and relationship-service to ensure ledger coverage
import 'dotenv/config';
import * as fs from 'fs';
import pg from 'pg';
import { parseBRD } from '../../src/extraction/parsers/brd-parser.js';
import { upsert as upsertEntity, batchUpsert as batchUpsertEntities } from '../../src/services/entities/entity-service.js';
import { batchUpsert as batchUpsertRelationships } from '../../src/services/relationships/relationship-service.js';
import type { ExtractedEntity, ExtractedRelationship } from '../../src/extraction/types.js';

const { Pool } = pg;

interface LedgerDelta {
  timestamp: string;
  e03_inserted: number;
  e03_updated: number;
  e03_noop: number;
  r02_inserted: number;
  r02_updated: number;
  r02_noop: number;
  ledger_entries_before: number;
  ledger_entries_after: number;
  ledger_delta: number;
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║              BACKFILL MISSING BRD ACs                          ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL, 
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  const projectId = '6df2f456-440d-4958-b475-d9808775ff69';
  const brdPath = 'docs/BRD_V20_6_3_COMPLETE.md';
  const relativePath = 'docs/BRD_V20_6_3_COMPLETE.md';

  // Load detection report
  console.log('Loading detection report...');
  const report = JSON.parse(fs.readFileSync('si-readiness-results/missing-e03.json', 'utf-8'));
  console.log(`  Missing E03s: ${report.missing_count}`);

  if (report.missing_count === 0) {
    console.log('\nNo missing E03s. Nothing to backfill.');
    await pool.end();
    return;
  }

  // Get ledger count before
  const ledgerBefore = fs.readFileSync('shadow-ledger/ledger.jsonl', 'utf-8')
    .split('\n').filter(l => l.trim()).length;
  console.log(`  Ledger entries before: ${ledgerBefore}`);

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
  const missingIds = new Set(report.missing_acs.map((ac: any) => ac.instance_id));

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
  console.log('Inserting E03 entities...');
  let e03Inserted = 0, e03Updated = 0, e03Noop = 0;

  const entityResults = await batchUpsertEntities(projectId, entitiesToInsert);
  for (const result of entityResults) {
    if (result.operation === 'CREATE') e03Inserted++;
    else if (result.operation === 'UPDATE') e03Updated++;
    else e03Noop++;
  }

  console.log(`  Inserted: ${e03Inserted}`);
  console.log(`  Updated: ${e03Updated}`);
  console.log(`  No-op: ${e03Noop}`);

  // Insert relationships
  console.log('\n─────────────────────────────────────────────────────────────────');
  console.log('Inserting R02 relationships...');
  let r02Inserted = 0, r02Updated = 0, r02Noop = 0;

  // Process in batches of 50 (no Neo4j sync - will do that separately)
  const batchSize = 50;
  for (let i = 0; i < relationshipsToInsert.length; i += batchSize) {
    const batch = relationshipsToInsert.slice(i, i + batchSize);
    console.log(`  Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(relationshipsToInsert.length/batchSize)}...`);
    const results = await batchUpsertRelationships(projectId, batch);
    for (const result of results) {
      if (result.operation === 'CREATE') r02Inserted++;
      else if (result.operation === 'UPDATE') r02Updated++;
      else r02Noop++;
    }
  }

  console.log(`  Inserted: ${r02Inserted}`);
  console.log(`  Updated: ${r02Updated}`);
  console.log(`  No-op: ${r02Noop}`);

  // Get ledger count after
  const ledgerAfter = fs.readFileSync('shadow-ledger/ledger.jsonl', 'utf-8')
    .split('\n').filter(l => l.trim()).length;

  // Generate ledger delta report
  const ledgerDelta: LedgerDelta = {
    timestamp: new Date().toISOString(),
    e03_inserted: e03Inserted,
    e03_updated: e03Updated,
    e03_noop: e03Noop,
    r02_inserted: r02Inserted,
    r02_updated: r02Updated,
    r02_noop: r02Noop,
    ledger_entries_before: ledgerBefore,
    ledger_entries_after: ledgerAfter,
    ledger_delta: ledgerAfter - ledgerBefore,
  };

  fs.writeFileSync('si-readiness-results/ledger-delta.json', JSON.stringify(ledgerDelta, null, 2));

  // Summary
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('BACKFILL COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log(`E03: ${e03Inserted} inserted, ${e03Updated} updated, ${e03Noop} no-op`);
  console.log(`R02: ${r02Inserted} inserted, ${r02Updated} updated, ${r02Noop} no-op`);
  console.log(`Ledger delta: ${ledgerDelta.ledger_delta} entries`);
  console.log(`Expected delta: ${e03Inserted + e03Updated + r02Inserted + r02Updated}`);

  // Verify counts
  const e03Count = await pool.query('SELECT COUNT(*)::int AS c FROM entities WHERE entity_type = $1', ['E03']);
  const r02Count = await pool.query('SELECT COUNT(*)::int AS c FROM relationships WHERE relationship_type = $1', ['R02']);

  console.log(`\nFinal counts:`);
  console.log(`  E03 in DB: ${e03Count.rows[0].c} (expected: 2849)`);
  console.log(`  R02 in DB: ${r02Count.rows[0].c}`);

  if (e03Count.rows[0].c === 2849) {
    console.log('\n✓ E03 count matches canonical 2849');
  } else {
    console.log('\n✗ E03 count mismatch!');
  }

  await pool.end();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
