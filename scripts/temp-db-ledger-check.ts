import 'dotenv/config';
import { rlsQuery } from '../test/utils/rls.js';
import * as fs from 'fs';

const PROJECT_ID = '6df2f456-440d-4958-b475-d9808775ff69';
const LEDGER_FILE = 'shadow-ledger/6df2f456-440d-4958-b475-d9808775ff69/ledger.jsonl';

async function main() {
  // Get DB instance_ids
  const dbRows = await rlsQuery<{instance_id: string; relationship_type: string}>(PROJECT_ID, `
    SELECT instance_id, relationship_type FROM relationships
    WHERE relationship_type IN ('R18','R19','R36','R37')
  `);
  const dbSet = new Set(dbRows.map(r => r.instance_id));
  console.log('DB instance_ids:', dbSet.size);
  
  // Get Ledger CREATE instance_ids
  const ledgerContent = fs.readFileSync(LEDGER_FILE, 'utf8');
  const ledgerEntries = ledgerContent.split('\n').filter(l => l.trim()).map(l => JSON.parse(l));
  const ledgerCreateSet = new Set(
    ledgerEntries
      .filter(e => e.operation === 'CREATE' && e.kind === 'relationship' && ['R18','R19','R36','R37'].includes(e.entity_type))
      .map(e => e.instance_id)
  );
  console.log('Ledger CREATE instance_ids:', ledgerCreateSet.size);
  
  // Check DB ⊆ Ledger
  const missingFromLedger: string[] = [];
  for (const id of dbSet) {
    if (!ledgerCreateSet.has(id)) {
      missingFromLedger.push(id);
    }
  }
  
  console.log('\n=== DB_set ⊆ Ledger_set CHECK ===');
  if (missingFromLedger.length === 0) {
    console.log('✓ ALL DB relationships have ledger CREATE entries');
    console.log(`  DB has ${dbSet.size} instance_ids`);
    console.log(`  Ledger has ${ledgerCreateSet.size} distinct CREATE instance_ids`);
    console.log('  Coverage: 100%');
  } else {
    console.log('✗ MISSING from ledger:', missingFromLedger.length);
    missingFromLedger.slice(0, 5).forEach(id => console.log('  -', id));
  }
}

main().catch(console.error);
