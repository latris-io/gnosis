// @ts-nocheck
// Check AC extraction discrepancy
import 'dotenv/config';
import pg from 'pg';
import * as fs from 'fs';

const { Pool } = pg;

async function main() {
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL, 
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  console.log('=== AC Extraction Discrepancy Analysis ===\n');

  // Get Epic 64 stories and their line ranges
  const stories64 = await pool.query(`
    SELECT instance_id, line_start, line_end 
    FROM entities 
    WHERE entity_type = 'E02' AND instance_id LIKE 'STORY-64.%'
    ORDER BY line_start
  `);
  
  console.log('Epic 64 Stories in DB:');
  for (const row of stories64.rows) {
    console.log(`  ${row.instance_id}: lines ${row.line_start}-${row.line_end}`);
  }

  // Get Epic 64 ACs
  const acs64 = await pool.query(`
    SELECT instance_id, line_start 
    FROM entities 
    WHERE entity_type = 'E03' AND instance_id LIKE 'AC-64.%'
    ORDER BY line_start
  `);
  
  console.log(`\nEpic 64 ACs in DB: ${acs64.rows.length}`);
  
  // Check BRD for table ACs in Epic 64
  const brdContent = fs.readFileSync('docs/BRD_V20_6_4_COMPLETE.md', 'utf-8');
  const lines = brdContent.split('\n');
  
  const tableAcPattern = /^\|\s*AC-(\d+)\.(\d+)\.(\d+)\s*\|/;
  const tableAcs64: { line: number; id: string }[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(tableAcPattern);
    if (match && match[1] === '64') {
      tableAcs64.push({ line: i + 1, id: `AC-${match[1]}.${match[2]}.${match[3]}` });
    }
  }
  
  console.log(`\nTable ACs for Epic 64 in BRD: ${tableAcs64.length}`);
  
  // Find which table ACs are missing from DB
  const dbAcIds = new Set(acs64.rows.map(r => r.instance_id));
  const missingAcs = tableAcs64.filter(ac => !dbAcIds.has(ac.id));
  
  console.log(`\nMissing ACs (in BRD but not in DB): ${missingAcs.length}`);
  if (missingAcs.length > 0) {
    console.log('First 10 missing:');
    for (const ac of missingAcs.slice(0, 10)) {
      console.log(`  ${ac.id} @ line ${ac.line}`);
    }
  }
  
  // Check story context for missing ACs
  console.log('\n--- Story Context Analysis ---');
  const storyRanges = stories64.rows.map(r => ({
    id: r.instance_id,
    start: r.line_start,
    end: r.line_end
  }));
  
  for (const ac of missingAcs.slice(0, 5)) {
    const inStory = storyRanges.find(s => ac.line >= s.start && ac.line <= s.end);
    console.log(`${ac.id} @ line ${ac.line}: ${inStory ? `inside ${inStory.id}` : 'OUTSIDE story context!'}`);
  }

  await pool.end();
}

main().catch(console.error);

