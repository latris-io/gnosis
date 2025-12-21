// @ts-nocheck
// @implements STORY-64.1
// Semantic Corpus Audit
// Validates corpus keying and signal diversity

import 'dotenv/config';
import * as fs from 'fs';
import pg from 'pg';

const { Pool } = pg;

interface SemanticSignal {
  timestamp: string;
  type: 'CORRECT' | 'INCORRECT' | 'PARTIAL' | 'ORPHAN_MARKER' | 'AMBIGUOUS';
  entity_type: string;
  instance_id: string;
  context: string;
  evidence: {
    source_file: string;
    line_start: number;
    line_end: number;
  };
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║              SEMANTIC CORPUS AUDIT                             ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL, 
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false } 
  });

  // Load corpus
  const corpusPath = 'semantic-corpus/signals.jsonl';
  const corpusContent = fs.readFileSync(corpusPath, 'utf-8');
  const signals: SemanticSignal[] = corpusContent
    .split('\n')
    .filter(line => line.trim())
    .map(line => JSON.parse(line));

  console.log('Corpus Statistics:');
  console.log(`  Total signals: ${signals.length}`);

  // Group by type
  const byType: Record<string, number> = {};
  const instanceIds = new Set<string>();
  const entityTypes = new Set<string>();

  for (const signal of signals) {
    byType[signal.type] = (byType[signal.type] || 0) + 1;
    instanceIds.add(signal.instance_id);
    entityTypes.add(signal.entity_type);
  }

  console.log('\n  By signal type:');
  for (const [type, count] of Object.entries(byType)) {
    console.log(`    ${type}: ${count}`);
  }

  console.log(`\n  Unique instance_ids: ${instanceIds.size}`);
  console.log(`  Entity types covered: ${[...entityTypes].sort().join(', ')}`);

  // Check keying - are we using instance_id correctly?
  console.log('\n─────────────────────────────────────────────────────────────────');
  console.log('Keying Validation:');

  // Sample a few signals and verify they reference valid entities
  const dbEntities = await pool.query('SELECT instance_id, entity_type FROM entities LIMIT 1000');
  const dbEntityMap = new Map(dbEntities.rows.map(r => [r.instance_id, r.entity_type]));

  let validRefs = 0;
  let invalidRefs = 0;
  const sampleSize = Math.min(100, signals.length);

  for (let i = 0; i < sampleSize; i++) {
    const signal = signals[i];
    if (dbEntityMap.has(signal.instance_id)) {
      validRefs++;
    } else {
      invalidRefs++;
    }
  }

  console.log(`\n  Sample validation (first ${sampleSize} signals):`);
  console.log(`    Valid references: ${validRefs}`);
  console.log(`    Invalid references: ${invalidRefs}`);

  // Check for contrast classes
  console.log('\n─────────────────────────────────────────────────────────────────');
  console.log('Contrast Class Analysis:');

  const hasCorrect = (byType['CORRECT'] || 0) > 0;
  const hasIncorrect = (byType['INCORRECT'] || 0) > 0;
  const hasPartial = (byType['PARTIAL'] || 0) > 0;
  const hasOrphan = (byType['ORPHAN_MARKER'] || 0) > 0;
  const hasAmbiguous = (byType['AMBIGUOUS'] || 0) > 0;

  console.log(`\n  CORRECT signals: ${hasCorrect ? '✓' : '✗'} (${byType['CORRECT'] || 0})`);
  console.log(`  INCORRECT signals: ${hasIncorrect ? '✓' : '✗'} (${byType['INCORRECT'] || 0})`);
  console.log(`  PARTIAL signals: ${hasPartial ? '✓' : '✗'} (${byType['PARTIAL'] || 0})`);
  console.log(`  ORPHAN_MARKER signals: ${hasOrphan ? '✓' : '✗'} (${byType['ORPHAN_MARKER'] || 0})`);
  console.log(`  AMBIGUOUS signals: ${hasAmbiguous ? '✓' : '✗'} (${byType['AMBIGUOUS'] || 0})`);

  const hasContrast = hasIncorrect || hasPartial || hasOrphan || hasAmbiguous;

  // Verdict
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('VERDICT');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const keyingPass = invalidRefs === 0 || (validRefs / sampleSize >= 0.95);
  const contrastNote = hasContrast 
    ? 'Contrast classes present'
    : 'GOVERNANCE DEBT: Only CORRECT signals - no contrast classes for Track C learning';

  console.log(`Keying: ${keyingPass ? 'PASS' : 'FAIL'} (${(validRefs / sampleSize * 100).toFixed(1)}% valid references)`);
  console.log(`Contrast: ${hasContrast ? 'PASS' : 'DEBT'} - ${contrastNote}`);

  if (keyingPass && hasContrast) {
    console.log('\n✓ PASS: Corpus is ready for Track C learning');
  } else if (keyingPass) {
    console.log('\n⚠ CONDITIONAL PASS: Keying is correct but contrast classes missing');
    console.log('  Synthetic INCORRECT/PARTIAL signals should be generated before Track C');
  } else {
    console.log('\n✗ FAIL: Invalid keying detected');
  }

  // Write result
  fs.mkdirSync('si-readiness-results', { recursive: true });
  const result = {
    timestamp: new Date().toISOString(),
    total_signals: signals.length,
    by_type: byType,
    unique_instance_ids: instanceIds.size,
    entity_types: [...entityTypes].sort(),
    keying_validation: {
      sample_size: sampleSize,
      valid_refs: validRefs,
      invalid_refs: invalidRefs,
      pass: keyingPass
    },
    contrast_classes: {
      has_correct: hasCorrect,
      has_incorrect: hasIncorrect,
      has_partial: hasPartial,
      has_orphan: hasOrphan,
      has_ambiguous: hasAmbiguous,
      has_contrast: hasContrast
    },
    pass: keyingPass,
    governance_debt: !hasContrast ? 'Missing contrast classes for Track C' : null
  };
  fs.writeFileSync('si-readiness-results/corpus-audit-result.json', JSON.stringify(result, null, 2));
  console.log('\nResult written to: si-readiness-results/corpus-audit-result.json');

  await pool.end();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
