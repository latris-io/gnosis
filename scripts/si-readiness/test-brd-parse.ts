// @ts-nocheck
// Test BRD parsing in isolation
import 'dotenv/config';
import * as fs from 'fs';
import pg from 'pg';
import { parseBRD, getExpectedCounts } from '../../src/extraction/parsers/brd-parser.js';

const { Pool } = pg;

async function main() {
  console.log('=== BRD Parser Test ===\n');
  
  console.log('ALLOW_BRD_COUNT_DRIFT:', process.env.ALLOW_BRD_COUNT_DRIFT || 'not set');
  console.log('Expected counts:', getExpectedCounts());
  console.log('');
  
  const brdPath = 'docs/BRD_V20_6_4_COMPLETE.md';
  const content = fs.readFileSync(brdPath, 'utf-8');
  
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL, 
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
  });
  
  try {
    const result = parseBRD(content, brdPath);
    console.log('Parse SUCCEEDED');
    console.log('  Epics:', result.epics.length);
    console.log('  Stories:', result.stories.length);
    console.log('  ACs:', result.acceptanceCriteria.length);
    console.log('  Constraints:', result.constraints.length);
    
    // Get DB ACs
    const dbAcs = await pool.query('SELECT instance_id FROM entities WHERE entity_type = $1', ['E03']);
    const dbAcIds = new Set(dbAcs.rows.map((r: any) => r.instance_id));
    
    // Find missing
    const parserAcIds = result.acceptanceCriteria.map(ac => ac.id);
    const missing = parserAcIds.filter(id => !dbAcIds.has(id));
    
    console.log('\nParser ACs:', parserAcIds.length);
    console.log('DB ACs:', dbAcIds.size);
    console.log('Missing from DB:', missing.length);
    
    if (missing.length > 0) {
      console.log('\nFirst 20 missing:');
      for (const id of missing.slice(0, 20)) {
        console.log('  ' + id);
      }
      
      // Group by epic
      const byEpic: Record<string, number> = {};
      for (const id of missing) {
        const epic = id.split('.')[0]; // AC-X
        byEpic[epic] = (byEpic[epic] || 0) + 1;
      }
      console.log('\nMissing by epic prefix:');
      for (const [epic, count] of Object.entries(byEpic).sort()) {
        console.log('  ' + epic + ': ' + count);
      }
    }
    
  } catch (error: any) {
    console.log('Parse FAILED');
    console.log('Error:', error.message);
  }
  
  await pool.end();
}

main().catch(console.error);
