// @ts-nocheck
// Detection script: identify missing E03 entities
// Compares BRDProvider output to DB state
import 'dotenv/config';
import * as fs from 'fs';
import pg from 'pg';
import { parseBRD } from '../../src/extraction/parsers/brd-parser.js';

const { Pool } = pg;

interface MissingAC {
  instance_id: string;
  epic_number: number;
  story_number: number;
  ac_number: number;
  description: string;
  line_start: number;
  line_end: number;
}

interface DetectionReport {
  timestamp: string;
  canonical_source: string;
  parser_e03_count: number;
  db_e03_count: number;
  missing_count: number;
  missing_by_epic: Record<number, number>;
  missing_by_story: Record<string, number>;
  missing_acs: MissingAC[];
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║              E03 MISSING DETECTION                             ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL, 
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  // Step 1: Parse BRD to get canonical E03 list
  console.log('Step 1: Parsing BRD...');
  const brdPath = 'docs/BRD_V20_6_4_COMPLETE.md';
  const content = fs.readFileSync(brdPath, 'utf-8');
  const parsed = parseBRD(content, brdPath);
  console.log(`  Parser E03 count: ${parsed.acceptanceCriteria.length}`);

  // Step 2: Get DB E03 list
  console.log('\nStep 2: Querying DB...');
  const dbResult = await pool.query('SELECT instance_id FROM entities WHERE entity_type = $1', ['E03']);
  const dbAcIds = new Set(dbResult.rows.map(r => r.instance_id));
  console.log(`  DB E03 count: ${dbAcIds.size}`);

  // Step 3: Compute missing
  console.log('\nStep 3: Computing missing...');
  const missing: MissingAC[] = [];
  const missingByEpic: Record<number, number> = {};
  const missingByStory: Record<string, number> = {};

  for (const ac of parsed.acceptanceCriteria) {
    if (!dbAcIds.has(ac.id)) {
      missing.push({
        instance_id: ac.id,
        epic_number: ac.epicNumber,
        story_number: ac.storyNumber,
        ac_number: ac.acNumber,
        description: ac.description,
        line_start: ac.lineStart,
        line_end: ac.lineEnd,
      });

      missingByEpic[ac.epicNumber] = (missingByEpic[ac.epicNumber] || 0) + 1;
      const storyKey = `STORY-${ac.epicNumber}.${ac.storyNumber}`;
      missingByStory[storyKey] = (missingByStory[storyKey] || 0) + 1;
    }
  }

  console.log(`  Missing count: ${missing.length}`);

  // Step 4: Generate report
  const report: DetectionReport = {
    timestamp: new Date().toISOString(),
    canonical_source: brdPath,
    parser_e03_count: parsed.acceptanceCriteria.length,
    db_e03_count: dbAcIds.size,
    missing_count: missing.length,
    missing_by_epic: missingByEpic,
    missing_by_story: missingByStory,
    missing_acs: missing,
  };

  // Step 5: Save report
  fs.mkdirSync('si-readiness-results', { recursive: true });
  const reportPath = 'si-readiness-results/missing-e03.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nReport saved: ${reportPath}`);

  // Summary
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log(`Parser E03: ${report.parser_e03_count}`);
  console.log(`DB E03:     ${report.db_e03_count}`);
  console.log(`Missing:    ${report.missing_count}`);
  console.log('\nMissing by Epic:');
  for (const [epic, count] of Object.entries(missingByEpic).sort((a, b) => Number(a[0]) - Number(b[0]))) {
    console.log(`  Epic ${epic}: ${count}`);
  }

  await pool.end();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
