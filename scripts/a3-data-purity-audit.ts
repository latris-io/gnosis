// scripts/a3-data-purity-audit.ts
// LEGACY_SCAN_OK: This script audits/validates legacy ledger or corpus files
// Phase 5: Data Purity Audit for A3 Validation
// Note: Uses metaQuery for cross-project queries (G-API compliant)

import { rlsQuery } from '../test/utils/rls.js';
import { metaQuery } from '../test/utils/db-meta.js';
import fs from 'fs/promises';

const projectId = process.env.PROJECT_ID || '6df2f456-440d-4958-b475-d9808775ff69';

async function main() {
  console.log('=== Phase 5: Data Purity Audit ===\n');

  // 5.1 Project Isolation (uses metaQuery for cross-project visibility)
  console.log('--- 5.1 Project Isolation ---');
  const otherEntities = await metaQuery<{ c: number }>(
    "SELECT COUNT(*)::int as c FROM entities WHERE project_id != $1",
    [projectId]
  );
  const otherRels = await metaQuery<{ c: number }>(
    "SELECT COUNT(*)::int as c FROM relationships WHERE project_id != $1",
    [projectId]
  );
  
  console.log('Entities in other projects:', otherEntities[0]?.c || 0);
  console.log('Relationships in other projects:', otherRels[0]?.c || 0);
  console.log('ISOLATION:', (otherEntities[0]?.c || 0) === 0 && (otherRels[0]?.c || 0) === 0 ? 'PASS ✓' : 'FAIL ✗');

  // 5.2 E11 Path Hygiene
  console.log('\n--- 5.2 E11 Path Hygiene ---');
  const e11Pollution = await rlsQuery<{ instance_id: string; source_file: string }>(projectId, `
    SELECT instance_id, source_file FROM entities 
    WHERE entity_type = 'E11'
      AND (source_file LIKE '%/tmp/%' 
           OR source_file LIKE '%fixture%'
           OR source_file LIKE '%mock%')
  `);
  console.log('E11 pollution paths found:', e11Pollution.length);
  if (e11Pollution.length > 0) {
    e11Pollution.forEach(e => console.log('  -', e.instance_id, e.source_file));
  }
  console.log('E11 HYGIENE:', e11Pollution.length === 0 ? 'PASS ✓' : 'FAIL ✗');

  // 5.3 R18/R19 Path Hygiene
  console.log('\n--- 5.3 R18/R19 Path Hygiene ---');
  const relPollution = await rlsQuery<{ instance_id: string; source_file: string }>(projectId, `
    SELECT instance_id, source_file FROM relationships 
    WHERE relationship_type IN ('R18','R19')
      AND (source_file LIKE '%/tmp/%' 
           OR source_file LIKE '%fixture%'
           OR source_file NOT LIKE 'src/%')
  `);
  console.log('R18/R19 pollution paths found:', relPollution.length);
  if (relPollution.length > 0) {
    relPollution.slice(0, 10).forEach(r => console.log('  -', r.instance_id, r.source_file));
    if (relPollution.length > 10) console.log('  ... and', relPollution.length - 10, 'more');
  }
  console.log('R18/R19 HYGIENE:', relPollution.length === 0 ? 'PASS ✓' : 'FAIL ✗');

  // 5.4 Ledger Integrity
  console.log('\n--- 5.4 Ledger Integrity ---');
  const ledgerPath = 'shadow-ledger/ledger.jsonl';
  try {
    const ledgerContent = await fs.readFile(ledgerPath, 'utf-8');
    const lines = ledgerContent.trim().split('\n').filter(l => l);
    
    let noopCount = 0;
    let missingProjectId = 0;
    let r18Creates = 0;
    let r19Creates = 0;
    let orphanDecisions = 0;
    let tddOkDecisions = 0;
    let tddMismatchDecisions = 0;
    
    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        if (entry.operation === 'NO-OP') noopCount++;
        if (!entry.project_id) missingProjectId++;
        if (entry.relationship_type === 'R18' && entry.operation === 'CREATE') r18Creates++;
        if (entry.relationship_type === 'R19' && entry.operation === 'CREATE') r19Creates++;
        if (entry.decision === 'ORPHAN') orphanDecisions++;
        if (entry.decision === 'TDD_COHERENCE_OK') tddOkDecisions++;
        if (entry.decision === 'TDD_COHERENCE_MISMATCH') tddMismatchDecisions++;
      } catch (e) {
        // Skip unparseable lines
      }
    }
    
    console.log('Total ledger entries:', lines.length);
    console.log('NO-OP entries (must be 0):', noopCount);
    console.log('Missing project_id (must be 0):', missingProjectId);
    console.log('R18 CREATE entries:', r18Creates);
    console.log('R19 CREATE entries:', r19Creates);
    console.log('ORPHAN decisions:', orphanDecisions);
    console.log('TDD_COHERENCE_OK decisions:', tddOkDecisions);
    console.log('TDD_COHERENCE_MISMATCH decisions:', tddMismatchDecisions);
    console.log('LEDGER INTEGRITY:', noopCount === 0 && missingProjectId === 0 ? 'PASS ✓' : 'FAIL ✗');
  } catch (e) {
    console.log('ERROR: Could not read ledger file:', e);
  }

  // 5.5 Corpus Integrity
  console.log('\n--- 5.5 Corpus Integrity ---');
  const corpusPath = 'semantic-corpus/signals.jsonl';
  try {
    const corpusContent = await fs.readFile(corpusPath, 'utf-8');
    const lines = corpusContent.trim().split('\n').filter(l => l);
    
    let orphanCount = 0;
    const signalIds = new Set<string>();
    let invalidPatterns = 0;
    
    for (const line of lines) {
      try {
        const signal = JSON.parse(line);
        if (signal.type === 'ORPHAN_MARKER') {
          orphanCount++;
          const id = signal.context?.signal_instance_id;
          if (id) {
            signalIds.add(id);
            // Check pattern: {type}:{target}:{source}:{file}:{line_start}:{line_end}
            if (!/^[a-z]+:.+:.+:.+:\d+:\d+$/.test(id)) {
              invalidPatterns++;
            }
          }
        }
      } catch (e) {
        // Skip unparseable lines
      }
    }
    
    console.log('Total corpus entries:', lines.length);
    console.log('ORPHAN_MARKER signals:', orphanCount);
    console.log('Distinct signal_instance_id:', signalIds.size);
    console.log('Invalid signal_id patterns:', invalidPatterns);
    console.log('DEDUPE VALID:', orphanCount === signalIds.size ? 'YES ✓' : 'NO ✗');
    console.log('PATTERN VALID:', invalidPatterns === 0 ? 'YES ✓' : 'NO ✗');
    console.log('CORPUS INTEGRITY:', orphanCount === signalIds.size && invalidPatterns === 0 ? 'PASS ✓' : 'FAIL ✗');
  } catch (e) {
    console.log('ERROR: Could not read corpus file:', e);
  }

  console.log('\n=== End of Phase 5 ===');
  process.exit(0);
}

main().catch(console.error);

