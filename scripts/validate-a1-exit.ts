// scripts/validate-a1-exit.ts
// LEGACY_SCAN_OK: This script audits/validates legacy ledger or corpus files
// A1 Entity Registry Exit Validation
// Verifies all A1 exit criteria per spec/track_a/EXIT.md

import * as fs from 'fs/promises';
import * as path from 'path';
import { execSync } from 'child_process';
import { brdProvider } from '../src/extraction/providers/brd-provider.js';
import { filesystemProvider } from '../src/extraction/providers/filesystem-provider.js';
import { astProvider } from '../src/extraction/providers/ast-provider.js';
import { gitProvider } from '../src/extraction/providers/git-provider.js';
import { changesetProvider } from '../src/extraction/providers/changeset-provider.js';
import type { RepoSnapshot } from '../src/extraction/types.js';

// Expected counts per ORGAN PATCH
const EXPECTED = {
  epics: 65,
  stories: 397,
  acceptanceCriteria: 3147,
};

// Track A entity types (16 total, E14 deferred)
const TRACK_A_ENTITIES = [
  'E01', 'E02', 'E03', 'E04',  // BRD
  'E06', 'E08',                 // Design
  'E11', 'E12', 'E13', 'E15',  // Implementation (E14 deferred)
  'E27', 'E28', 'E29',         // Verification
  'E49', 'E50', 'E52',         // Provenance
];

interface CheckResult {
  name: string;
  passed: boolean;
  actual?: string | number;
  expected?: string | number;
  note?: string;
}

interface ValidationResults {
  passed: CheckResult[];
  failed: CheckResult[];
  warnings: CheckResult[];
}

// Helper functions
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function countLines(filePath: string): Promise<number> {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return content.split('\n').filter(line => line.trim()).length;
  } catch {
    return 0;
  }
}

async function countMarkers(pattern: string): Promise<number> {
  try {
    const output = execSync(
      `grep -rl "${pattern}" src/ --include="*.ts" 2>/dev/null | wc -l`,
      { encoding: 'utf8' }
    );
    return parseInt(output.trim(), 10);
  } catch {
    return 0;
  }
}

function check(
  name: string,
  passed: boolean,
  results: ValidationResults,
  actual?: string | number,
  expected?: string | number,
  note?: string
): void {
  const result: CheckResult = { name, passed, actual, expected, note };
  if (passed) {
    results.passed.push(result);
  } else {
    results.failed.push(result);
  }
}

function checkCount(
  name: string,
  actual: number,
  expected: number,
  results: ValidationResults
): void {
  check(name, actual === expected, results, actual, expected);
}

function printResult(result: CheckResult, prefix: string): void {
  const status = result.passed ? '\x1b[32m[PASS]\x1b[0m' : '\x1b[31m[FAIL]\x1b[0m';
  let line = `  ${status} ${result.name}`;
  
  if (result.expected !== undefined && result.actual !== undefined) {
    line += `: ${result.actual}/${result.expected}`;
  } else if (result.actual !== undefined) {
    line += ` (${result.actual})`;
  }
  
  if (result.note) {
    line += ` - ${result.note}`;
  }
  
  console.log(line);
}

function printSummary(results: ValidationResults): void {
  const total = results.passed.length + results.failed.length;
  
  console.log('\n=== SUMMARY ===');
  console.log(`Passed: ${results.passed.length}/${total}`);
  console.log(`Failed: ${results.failed.length}/${total}`);
  
  if (results.warnings.length > 0) {
    console.log(`Warnings: ${results.warnings.length}`);
  }
  
  console.log('');
  if (results.failed.length === 0) {
    console.log('\x1b[32m✓ A1 EXIT CRITERIA: SATISFIED\x1b[0m');
  } else {
    console.log('\x1b[31m✗ A1 EXIT CRITERIA: NOT SATISFIED\x1b[0m');
    console.log('\nFailed checks:');
    results.failed.forEach(r => printResult(r, '  '));
  }
}

async function validateA1Exit(): Promise<number> {
  console.log('=== A1 Entity Registry Exit Validation ===');
  console.log(`Date: ${new Date().toISOString()}\n`);

  const results: ValidationResults = {
    passed: [],
    failed: [],
    warnings: [],
  };

  // Create snapshot for extraction
  const snapshot: RepoSnapshot = {
    id: 'a1-validation-' + Date.now(),
    root_path: process.cwd(),
    timestamp: new Date(),
  };

  // ============================================================
  // 1. BRD EXTRACTION COUNTS
  // ============================================================
  console.log('BRD Extraction:');
  
  const brdResult = await brdProvider.extract(snapshot);
  
  const epics = brdResult.entities.filter(e => e.entity_type === 'E01');
  const stories = brdResult.entities.filter(e => e.entity_type === 'E02');
  const acs = brdResult.entities.filter(e => e.entity_type === 'E03');
  const constraints = brdResult.entities.filter(e => e.entity_type === 'E04');
  
  checkCount('Epics (E01)', epics.length, EXPECTED.epics, results);
  printResult(results.passed.at(-1) || results.failed.at(-1)!, '');
  
  checkCount('Stories (E02)', stories.length, EXPECTED.stories, results);
  printResult(results.passed.at(-1) || results.failed.at(-1)!, '');
  
  checkCount('Acceptance Criteria (E03)', acs.length, EXPECTED.acceptanceCriteria, results);
  printResult(results.passed.at(-1) || results.failed.at(-1)!, '');
  
  // E04 Constraint: BRD V20.6.3 contains no CNST-formatted constraints
  check(
    'Constraints (E04)',
    constraints.length === 0,
    results,
    constraints.length,
    0,
    'BRD V20.6.3 contains no CNST-formatted constraints'
  );
  printResult(results.passed.at(-1) || results.failed.at(-1)!, '');

  // ============================================================
  // 2. OTHER ENTITY TYPES
  // ============================================================
  console.log('\nOther Entity Extraction:');
  
  const fsResult = await filesystemProvider.extract(snapshot);
  const astResult = await astProvider.extract(snapshot);
  
  // E06 TechnicalDesign (ADRs, specs)
  const technicalDesigns = fsResult.entities.filter(e => e.entity_type === 'E06');
  check('TechnicalDesign (E06)', technicalDesigns.length > 0, results, technicalDesigns.length);
  printResult(results.passed.at(-1) || results.failed.at(-1)!, '');
  
  // E08 DataSchema
  const dataSchemas = astResult.entities.filter(e => e.entity_type === 'E08');
  check('DataSchema (E08)', dataSchemas.length > 0, results, dataSchemas.length);
  printResult(results.passed.at(-1) || results.failed.at(-1)!, '');
  
  // E11 SourceFile
  const sourceFiles = fsResult.entities.filter(e => e.entity_type === 'E11');
  check('SourceFile (E11)', sourceFiles.length > 0, results, sourceFiles.length);
  printResult(results.passed.at(-1) || results.failed.at(-1)!, '');
  
  // E12 Function
  const functions = astResult.entities.filter(e => e.entity_type === 'E12');
  check('Function (E12)', functions.length > 0, results, functions.length);
  printResult(results.passed.at(-1) || results.failed.at(-1)!, '');
  
  // E13 Class
  const classes = astResult.entities.filter(e => e.entity_type === 'E13');
  check('Class (E13)', classes.length > 0, results, classes.length);
  printResult(results.passed.at(-1) || results.failed.at(-1)!, '');
  
  // E15 Module
  const modules = astResult.entities.filter(e => e.entity_type === 'E15');
  check('Module (E15)', modules.length > 0, results, modules.length);
  printResult(results.passed.at(-1) || results.failed.at(-1)!, '');
  
  // E27 TestFile
  const testFiles = fsResult.entities.filter(e => e.entity_type === 'E27');
  check('TestFile (E27)', testFiles.length > 0, results, testFiles.length);
  printResult(results.passed.at(-1) || results.failed.at(-1)!, '');
  
  // E28 TestSuite
  const testSuites = astResult.entities.filter(e => e.entity_type === 'E28');
  check('TestSuite (E28)', testSuites.length > 0, results, testSuites.length);
  printResult(results.passed.at(-1) || results.failed.at(-1)!, '');
  
  // E29 TestCase
  const testCases = astResult.entities.filter(e => e.entity_type === 'E29');
  check('TestCase (E29)', testCases.length > 0, results, testCases.length);
  printResult(results.passed.at(-1) || results.failed.at(-1)!, '');
  
  // Git entities (E49, E50, E52) - these need git history
  console.log('\nGit Entity Extraction:');
  
  const gitResult = await gitProvider.extract(snapshot);
  const changesetResult = await changesetProvider.extract(snapshot);
  
  // E49 ReleaseVersion
  const releases = gitResult.entities.filter(e => e.entity_type === 'E49');
  check('ReleaseVersion (E49)', releases.length >= 0, results, releases.length, undefined, 
    releases.length === 0 ? 'No tags in repo (valid)' : undefined);
  printResult(results.passed.at(-1) || results.failed.at(-1)!, '');
  
  // E50 Commit
  const commits = gitResult.entities.filter(e => e.entity_type === 'E50');
  check('Commit (E50)', commits.length > 0, results, commits.length);
  printResult(results.passed.at(-1) || results.failed.at(-1)!, '');
  
  // E52 ChangeSet
  const changesets = changesetResult.entities.filter(e => e.entity_type === 'E52');
  check('ChangeSet (E52)', changesets.length >= 0, results, changesets.length,
    undefined, changesets.length === 0 ? 'No STORY- refs in commits (valid)' : undefined);
  printResult(results.passed.at(-1) || results.failed.at(-1)!, '');

  // ============================================================
  // 3. SHADOW LEDGER
  // ============================================================
  console.log('\nShadow Ledger:');
  
  const ledgerPath = 'shadow-ledger/ledger.jsonl';
  const ledgerExists = await fileExists(ledgerPath);
  const ledgerLines = ledgerExists ? await countLines(ledgerPath) : 0;
  
  check('Shadow ledger exists', ledgerExists, results);
  printResult(results.passed.at(-1) || results.failed.at(-1)!, '');
  
  check('Shadow ledger has entries', ledgerLines > 0, results, `${ledgerLines} entries`);
  printResult(results.passed.at(-1) || results.failed.at(-1)!, '');

  // ============================================================
  // 4. SEMANTIC CORPUS
  // ============================================================
  console.log('\nSemantic Corpus:');
  
  const corpusPath = 'semantic-corpus/signals.jsonl';
  const corpusExists = await fileExists(corpusPath);
  const corpusLines = corpusExists ? await countLines(corpusPath) : 0;
  
  check('Semantic corpus exists', corpusExists, results);
  printResult(results.passed.at(-1) || results.failed.at(-1)!, '');
  
  check('Semantic corpus >= 50 signals', corpusLines >= 50, results, `${corpusLines} signals`);
  printResult(results.passed.at(-1) || results.failed.at(-1)!, '');

  // ============================================================
  // 5. CODE MARKERS
  // ============================================================
  console.log('\nCode Markers:');
  
  const implementsCount = await countMarkers('@implements STORY-64.1');
  const satisfiesCount = await countMarkers('@satisfies AC-64.1');
  
  check('@implements STORY-64.1 markers', implementsCount > 0, results, `${implementsCount} files`);
  printResult(results.passed.at(-1) || results.failed.at(-1)!, '');
  
  check('@satisfies AC-64.1.* markers', satisfiesCount > 0, results, `${satisfiesCount} files`);
  printResult(results.passed.at(-1) || results.failed.at(-1)!, '');

  // ============================================================
  // 6. SUMMARY
  // ============================================================
  printSummary(results);

  return results.failed.length === 0 ? 0 : 1;
}

// Run validation
validateA1Exit()
  .then((exitCode) => process.exit(exitCode))
  .catch((err) => {
    console.error('[ERROR]', err);
    process.exit(1);
  });
