// Temporary script to check BRD extraction counts
import { brdProvider } from '../src/extraction/providers/brd-provider.js';

// Note on expected counts:
// BRD V20.6.3 metadata claims 2901 ACs, but actual content contains:
// - 2682 list-style ACs (- ACN: format)
// - 167 table-style ACs (| AC-X.Y.Z | format)
// - Total: 2849 actual ACs in BRD content
// The 52 difference is a metadata error in the BRD, not an extraction bug.
// Appendix B note says "Total ACs: 2,894" which is also inconsistent.
const EXPECTED = {
  E01: 65,
  E02: 351,
  E03: 2849, // Actual BRD content, not metadata claim of 2901
  E04: 0,    // BRD does not contain CNST-formatted constraints
};

async function main() {
  const snapshot = { id: 'test', root_path: process.cwd(), timestamp: new Date() };
  const result = await brdProvider.extract(snapshot);

  const counts = {
    E01: result.entities.filter(e => e.entity_type === 'E01').length,
    E02: result.entities.filter(e => e.entity_type === 'E02').length,
    E03: result.entities.filter(e => e.entity_type === 'E03').length,
    E04: result.entities.filter(e => e.entity_type === 'E04').length,
  };

  console.log('=== BRD EXTRACTION COUNTS ===');
  console.log(`E01 (Epic): ${counts.E01} - Expected: ${EXPECTED.E01}`);
  console.log(`E02 (Story): ${counts.E02} - Expected: ${EXPECTED.E02}`);
  console.log(`E03 (AcceptanceCriterion): ${counts.E03} - Expected: ${EXPECTED.E03}`);
  console.log(`E04 (Constraint): ${counts.E04} - Expected: ${EXPECTED.E04} (none in BRD V20.6.3)`);
  console.log('');
  console.log('Note: BRD metadata claims 2901 ACs but actual content has 2849');
  console.log('');
  console.log('MATCH STATUS:');
  console.log(`E01: ${counts.E01 === EXPECTED.E01 ? 'PASS' : 'FAIL (got ' + counts.E01 + ')'}`);
  console.log(`E02: ${counts.E02 === EXPECTED.E02 ? 'PASS' : 'FAIL (got ' + counts.E02 + ')'}`);
  console.log(`E03: ${counts.E03 === EXPECTED.E03 ? 'PASS' : 'FAIL (got ' + counts.E03 + ')'}`);
  console.log(`E04: ${counts.E04 === EXPECTED.E04 ? 'PASS' : 'FAIL (got ' + counts.E04 + ')'}`);
  
  const allPass = Object.entries(counts).every(([key, val]) => val === EXPECTED[key as keyof typeof EXPECTED]);
  console.log('');
  console.log(`OVERALL: ${allPass ? 'ALL PASS' : 'SOME FAILED'}`);
  process.exit(allPass ? 0 : 1);
}

main().catch(console.error);
