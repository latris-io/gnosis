// scripts/validate-a2-exit.ts
// LEGACY_SCAN_OK: This script audits/validates legacy ledger or corpus files
// @implements STORY-64.2
// A2 Relationship Registry Exit Validation
// Hard-fail validator - NO skips, NO soft passes
// exit(1) on ANY failure, exit(0) only if ALL checks pass

import * as fs from 'fs/promises';
import neo4j, { Driver, Session } from 'neo4j-driver';
import { config } from '../src/config/env.js';

// ============================================================
// FROZEN CANON - Hard assertions (do NOT change without ORGAN PATCH)
// ============================================================

const EXPECTED = {
  E01_EPIC: 65,
  E02_STORY: 351,
  E03_AC: 2849,
  R01_HAS_STORY: 351,   // One R01 per Story
  R02_HAS_AC: 2849,     // One R02 per AC
};

// Track A relationship codes (exactly 24)
const TRACK_A_REL_CODES = [
  'R01', 'R02', 'R03', 'R04', 'R05', 'R06', 'R07',
  'R08', 'R09', 'R11',
  'R14', 'R16', 'R18', 'R19',
  'R21', 'R22', 'R23', 'R24', 'R26',
  'R36', 'R37',
  'R63', 'R67', 'R70',
] as const;

// Track A relationship endpoints per ENTRY.md "Relationships to Implement (24)"
// Supports polymorphic endpoints via arrays
const REL_ENDPOINTS: Record<string, { from: string | string[]; to: string | string[] }> = {
  R01: { from: 'E01', to: 'E02' },                 // Epic -> Story
  R02: { from: 'E02', to: 'E03' },                 // Story -> AC
  R03: { from: 'E03', to: 'E04' },                 // AC -> Constraint (Track A deviation)
  R04: { from: 'E15', to: 'E11' },                 // Module -> SourceFile
  R05: { from: 'E11', to: ['E12', 'E13'] },        // SourceFile -> Function|Class
  R06: { from: 'E27', to: 'E28' },                 // TestFile -> TestSuite
  R07: { from: 'E28', to: 'E29' },                 // TestSuite -> TestCase
  R08: { from: 'E02', to: 'E06' },                 // Story -> TechnicalDesign (TDD Bridge)
  R09: { from: 'E03', to: 'E06' },                 // AC -> TechnicalDesign (TDD Bridge)
  R11: { from: 'E02', to: 'E08' },                 // Story -> DataSchema (TDD Bridge)
  R14: { from: 'E06', to: 'E11' },                 // TechnicalDesign -> SourceFile (TDD Bridge)
  R16: { from: ['E12', 'E13'], to: 'E11' },        // Function|Class -> SourceFile
  R18: { from: 'E11', to: 'E02' },                 // SourceFile -> Story (marker-derived)
  R19: { from: ['E12', 'E13'], to: 'E03' },        // Function|Class -> AC
  R21: { from: 'E11', to: 'E11' },                 // SourceFile -> SourceFile
  R22: { from: 'E12', to: 'E12' },                 // Function -> Function
  R23: { from: 'E13', to: 'E13' },                 // Class -> Class
  R24: { from: 'E13', to: 'E14' },                 // Class -> Interface
  R26: { from: 'E15', to: 'E15' },                 // Module -> Module
  R36: { from: ['E12', 'E13'], to: 'E29' },        // Function|Class -> TestCase
  R37: { from: 'E03', to: 'E29' },                 // AC -> TestCase
  R63: { from: 'E11', to: 'E50' },                 // SourceFile -> Commit (Track A scoped deviation)
  R67: { from: 'E11', to: 'E50' },                 // SourceFile -> Commit (canonical alignment)
  R70: { from: 'E52', to: 'E50' },                 // ChangeSet -> Commit
};

// ============================================================
// DETECTED SCHEMA KEYS (set at runtime via probing)
// ============================================================

let NODE_TYPE_KEY: string = '';       // 'entity_type' or 'type'
let NODE_ID_KEY: string = '';         // 'instance_id' or 'id'
let REL_MODEL: 'typed' | 'property' | 'unknown' = 'unknown';  // typed = :R01, property = r.relationship_type
let REL_CODE_KEY: string = '';        // 'relationship_type' or 'code' (if property model)

// ============================================================
// VALIDATION INFRASTRUCTURE
// ============================================================

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
  info: CheckResult[];
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

function info(
  name: string,
  results: ValidationResults,
  actual?: string | number,
  note?: string
): void {
  results.info.push({ name, passed: true, actual, note });
}

function printResult(result: CheckResult, prefix: string = ''): void {
  const status = result.passed ? '\x1b[32m[PASS]\x1b[0m' : '\x1b[31m[FAIL]\x1b[0m';
  let line = `${prefix}${status} ${result.name}`;

  if (result.expected !== undefined && result.actual !== undefined) {
    line += `: ${result.actual}/${result.expected}`;
  } else if (result.actual !== undefined) {
    line += `: ${result.actual}`;
  }

  if (result.note) {
    line += ` (${result.note})`;
  }

  console.log(line);
}

function printInfo(result: CheckResult, prefix: string = ''): void {
  let line = `${prefix}\x1b[36m[INFO]\x1b[0m ${result.name}`;
  if (result.actual !== undefined) {
    line += `: ${result.actual}`;
  }
  if (result.note) {
    line += ` (${result.note})`;
  }
  console.log(line);
}

function printSummary(results: ValidationResults): void {
  const total = results.passed.length + results.failed.length;

  console.log('\n=== SUMMARY ===');
  console.log(`Passed: ${results.passed.length}/${total}`);
  console.log(`Failed: ${results.failed.length}/${total}`);

  console.log('');
  if (results.failed.length === 0) {
    console.log('\x1b[32m✓ A2 EXIT CRITERIA: SATISFIED\x1b[0m');
  } else {
    console.log('\x1b[31m✗ A2 EXIT CRITERIA: NOT SATISFIED\x1b[0m');
    console.log('\nFailed checks:');
    results.failed.forEach(r => printResult(r, '  '));
  }
}

// ============================================================
// SCHEMA PROBING (detect Neo4j schema at runtime)
// ============================================================

async function probeNodeSchema(session: Session): Promise<void> {
  // Step 1: Check if graph is empty (label-agnostic)
  const countResult = await session.run('MATCH (n) RETURN count(n) AS nodeCount');
  const nodeCount = countResult.records[0].get('nodeCount').toNumber();

  if (nodeCount === 0) {
    throw new Error(
      'GRAPH EMPTY: no nodes found; cannot validate A2 exit conditions until ingestion populates Neo4j.'
    );
  }

  console.log(`  Found ${nodeCount} nodes in graph`);

  // Step 2: Sample up to 50 nodes (label-agnostic)
  const sampleResult = await session.run(
    'MATCH (n) RETURN labels(n) AS labels, keys(n) AS props LIMIT 50'
  );

  const allProps = new Set<string>();
  const allLabels = new Set<string>();

  for (const record of sampleResult.records) {
    const labels = record.get('labels') as string[];
    const props = record.get('props') as string[];
    labels.forEach(l => allLabels.add(l));
    props.forEach(p => allProps.add(p));
  }

  console.log(`  Sampled ${sampleResult.records.length} nodes`);
  console.log(`  Labels found: ${Array.from(allLabels).join(', ') || '(none)'}`);

  // Step 3: Detect NODE_TYPE_KEY (strict - fail on ambiguity)
  const hasEntityType = allProps.has('entity_type');
  const hasType = allProps.has('type');

  if (hasEntityType && hasType) {
    throw new Error(
      'SCHEMA MISMATCH: nodes have BOTH `entity_type` AND `type` properties; ambiguous schema.'
    );
  }
  if (!hasEntityType && !hasType) {
    throw new Error(
      'SCHEMA MISMATCH: nodes exist but lack both `entity_type` and `type` properties; cannot determine entity types.'
    );
  }

  NODE_TYPE_KEY = hasEntityType ? 'entity_type' : 'type';

  // Step 4: Detect NODE_ID_KEY (strict - fail on ambiguity)
  const hasInstanceId = allProps.has('instance_id');
  const hasId = allProps.has('id');

  if (hasInstanceId && hasId) {
    throw new Error(
      'SCHEMA MISMATCH: nodes have BOTH `instance_id` AND `id` properties; ambiguous node identity key.'
    );
  }
  if (!hasInstanceId && !hasId) {
    throw new Error(
      'SCHEMA MISMATCH: nodes exist but lack both `instance_id` and `id` properties; cannot identify nodes.'
    );
  }

  NODE_ID_KEY = hasInstanceId ? 'instance_id' : 'id';

  console.log(`  Detected NODE_TYPE_KEY: ${NODE_TYPE_KEY}`);
  console.log(`  Detected NODE_ID_KEY: ${NODE_ID_KEY}`);
}

async function probeRelationshipSchema(session: Session): Promise<void> {
  const relResult = await session.run(
    'MATCH ()-[r]->() RETURN type(r) AS relType, keys(r) AS props LIMIT 20'
  );

  if (relResult.records.length === 0) {
    // No relationships yet - DO NOT guess, set to unknown
    REL_MODEL = 'unknown';
    console.log('  \x1b[36m[INFO]\x1b[0m No relationships found yet; cannot infer relationship model');
    console.log('  \x1b[36m[INFO]\x1b[0m Relationship checks will fail with explicit "model unknown" error if they run');
    return;
  }

  // Relationships exist - detect model
  const relTypes = new Set<string>();
  const allProps = new Set<string>();

  for (const record of relResult.records) {
    const relType = record.get('relType') as string;
    const props = record.get('props') as string[];
    relTypes.add(relType);
    props.forEach(p => allProps.add(p));
  }

  // Check if relationship types are R-codes (typed model): ^R\d{2}$
  const typedRelCodes = Array.from(relTypes).filter(t => /^R\d{2}$/.test(t));
  const nonRCodeTypes = Array.from(relTypes).filter(t => !/^R\d{2}$/.test(t));

  // Check for relationship_type or code property (property model)
  const hasRelTypeProperty = allProps.has('relationship_type');
  const hasCodeProperty = allProps.has('code');

  // Detect model with strict validation
  const hasTypedModel = typedRelCodes.length > 0;
  const hasPropertyModel = hasRelTypeProperty || hasCodeProperty;

  // FAIL: Both typed AND property-coded relationships exist
  if (hasTypedModel && hasPropertyModel) {
    throw new Error(
      'SCHEMA MISMATCH: mixed relationship modeling detected; both typed (:R01) and property-coded relationships exist.'
    );
  }

  // TYPED MODEL: R-code relationship types found
  if (hasTypedModel) {
    // In typed model, non-R-code types are unexpected (would indicate mixed modeling)
    if (nonRCodeTypes.length > 0) {
      console.log(`  \x1b[33m[WARN]\x1b[0m Non-R-code relationship types found alongside R-codes: ${nonRCodeTypes.join(', ')}`);
    }
    REL_MODEL = 'typed';
    console.log(`  Detected REL_MODEL: typed (relationship types are R-codes: ${typedRelCodes.slice(0, 5).join(', ')}${typedRelCodes.length > 5 ? '...' : ''})`);
    return;
  }

  // PROPERTY MODEL: relationship_type or code property found
  if (hasPropertyModel) {
    // FAIL: Both relationship_type AND code properties exist
    if (hasRelTypeProperty && hasCodeProperty) {
      throw new Error(
        'SCHEMA MISMATCH: ambiguous relationship code key; both `relationship_type` AND `code` properties exist.'
      );
    }

    REL_MODEL = 'property';
    REL_CODE_KEY = hasRelTypeProperty ? 'relationship_type' : 'code';
    console.log(`  Detected REL_MODEL: property (code stored in r.${REL_CODE_KEY})`);
    return;
  }

  // FAIL: Relationships exist but match neither model
  throw new Error(
    'SCHEMA MISMATCH: cannot determine relationship model; relationships exist but are neither R-code typed nor property-coded.'
  );
}

/**
 * Guard function - call before any relationship-dependent check.
 * Fails hard if relationship model is unknown.
 */
function requireRelModel(): void {
  if (REL_MODEL === 'unknown') {
    throw new Error(
      'REL MODEL UNKNOWN: no relationships exist yet; cannot determine whether rels are typed (:R01) or property-coded (r.relationship_type). Run validator after at least one relationship exists.'
    );
  }
}

// ============================================================
// CYPHER QUERY HELPERS (work under both relationship models)
// ============================================================

function buildRelCountQuery(relCode: string): string {
  requireRelModel();
  if (REL_MODEL === 'typed') {
    return `MATCH ()-[r:${relCode}]->() RETURN count(r) AS count`;
  } else {
    return `MATCH ()-[r]->() WHERE r.${REL_CODE_KEY} = '${relCode}' RETURN count(r) AS count`;
  }
}

function buildRelEndpointValidationQuery(relCode: string, fromTypes: string[], toTypes: string[]): string {
  requireRelModel();
  const fromCondition = fromTypes.map(t => `a.${NODE_TYPE_KEY} = '${t}'`).join(' OR ');
  const toCondition = toTypes.map(t => `b.${NODE_TYPE_KEY} = '${t}'`).join(' OR ');

  if (REL_MODEL === 'typed') {
    return `
      MATCH (a)-[r:${relCode}]->(b)
      WHERE NOT (${fromCondition}) OR NOT (${toCondition})
      RETURN a.${NODE_ID_KEY} AS from_id, b.${NODE_ID_KEY} AS to_id,
             a.${NODE_TYPE_KEY} AS from_type, b.${NODE_TYPE_KEY} AS to_type
      LIMIT 10
    `;
  } else {
    return `
      MATCH (a)-[r]->(b)
      WHERE r.${REL_CODE_KEY} = '${relCode}'
        AND (NOT (${fromCondition}) OR NOT (${toCondition}))
      RETURN a.${NODE_ID_KEY} AS from_id, b.${NODE_ID_KEY} AS to_id,
             a.${NODE_TYPE_KEY} AS from_type, b.${NODE_TYPE_KEY} AS to_type
      LIMIT 10
    `;
  }
}

function buildAllRelCodesQuery(): string {
  requireRelModel();
  if (REL_MODEL === 'typed') {
    return `MATCH ()-[r]->() RETURN DISTINCT type(r) AS code`;
  } else {
    return `MATCH ()-[r]->() WHERE r.${REL_CODE_KEY} IS NOT NULL RETURN DISTINCT r.${REL_CODE_KEY} AS code`;
  }
}

function buildCardinalityQuery(childType: string, parentType: string, relCode: string): string {
  requireRelModel();
  if (REL_MODEL === 'typed') {
    return `
      MATCH (child {${NODE_TYPE_KEY}: '${childType}'})
      OPTIONAL MATCH (parent {${NODE_TYPE_KEY}: '${parentType}'})-[:${relCode}]->(child)
      WITH child, count(parent) AS parentCount
      WHERE parentCount != 1
      RETURN child.${NODE_ID_KEY} AS childId, parentCount
      LIMIT 10
    `;
  } else {
    return `
      MATCH (child {${NODE_TYPE_KEY}: '${childType}'})
      OPTIONAL MATCH (parent {${NODE_TYPE_KEY}: '${parentType}'})-[r]->(child)
      WHERE r.${REL_CODE_KEY} = '${relCode}'
      WITH child, count(parent) AS parentCount
      WHERE parentCount != 1
      RETURN child.${NODE_ID_KEY} AS childId, parentCount
      LIMIT 10
    `;
  }
}

// ============================================================
// VALIDATION CHECKS
// ============================================================

async function checkNeo4jConnectivity(driver: Driver, results: ValidationResults): Promise<boolean> {
  try {
    const session = driver.session();
    await session.run('RETURN 1');
    await session.close();
    check('Neo4j connection', true, results);
    printResult(results.passed.at(-1)!, '  ');
    return true;
  } catch (err) {
    check('Neo4j connection', false, results, undefined, undefined, String(err));
    printResult(results.failed.at(-1)!, '  ');
    return false;
  }
}

async function checkConstraintsExist(session: Session, results: ValidationResults): Promise<void> {
  const constraintResult = await session.run('SHOW CONSTRAINTS');
  const count = constraintResult.records.length;
  check('Constraints exist', count >= 1, results, count, '>= 1');
  printResult(count >= 1 ? results.passed.at(-1)! : results.failed.at(-1)!, '  ');
}

async function checkEntityCounts(session: Session, results: ValidationResults): Promise<void> {
  console.log('\nEntity Counts (Hard Assertions):');

  // E01 Epic (label-agnostic)
  const e01Result = await session.run(`MATCH (n {${NODE_TYPE_KEY}: 'E01'}) RETURN count(n) AS count`);
  const e01Count = e01Result.records[0].get('count').toNumber();
  check('E01 Epic', e01Count === EXPECTED.E01_EPIC, results, e01Count, EXPECTED.E01_EPIC);
  printResult(e01Count === EXPECTED.E01_EPIC ? results.passed.at(-1)! : results.failed.at(-1)!, '  ');

  // E02 Story (label-agnostic)
  const e02Result = await session.run(`MATCH (n {${NODE_TYPE_KEY}: 'E02'}) RETURN count(n) AS count`);
  const e02Count = e02Result.records[0].get('count').toNumber();
  check('E02 Story', e02Count === EXPECTED.E02_STORY, results, e02Count, EXPECTED.E02_STORY);
  printResult(e02Count === EXPECTED.E02_STORY ? results.passed.at(-1)! : results.failed.at(-1)!, '  ');

  // E03 AcceptanceCriterion (label-agnostic)
  const e03Result = await session.run(`MATCH (n {${NODE_TYPE_KEY}: 'E03'}) RETURN count(n) AS count`);
  const e03Count = e03Result.records[0].get('count').toNumber();
  check('E03 AcceptanceCriterion', e03Count === EXPECTED.E03_AC, results, e03Count, EXPECTED.E03_AC);
  printResult(e03Count === EXPECTED.E03_AC ? results.passed.at(-1)! : results.failed.at(-1)!, '  ');
}

async function checkRelationshipCounts(session: Session, results: ValidationResults): Promise<void> {
  console.log('\nRelationship Counts (Hard Assertions):');

  // R01 HAS_STORY
  const r01Result = await session.run(buildRelCountQuery('R01'));
  const r01Count = r01Result.records[0].get('count').toNumber();
  check('R01 HAS_STORY', r01Count === EXPECTED.R01_HAS_STORY, results, r01Count, EXPECTED.R01_HAS_STORY);
  printResult(r01Count === EXPECTED.R01_HAS_STORY ? results.passed.at(-1)! : results.failed.at(-1)!, '  ');

  // R02 HAS_AC
  const r02Result = await session.run(buildRelCountQuery('R02'));
  const r02Count = r02Result.records[0].get('count').toNumber();
  check('R02 HAS_AC', r02Count === EXPECTED.R02_HAS_AC, results, r02Count, EXPECTED.R02_HAS_AC);
  printResult(r02Count === EXPECTED.R02_HAS_AC ? results.passed.at(-1)! : results.failed.at(-1)!, '  ');

  // Observed counts for other relationship codes (INFO only, not hard assertions)
  console.log('\nRelationship Counts (Observed):');

  for (const code of TRACK_A_REL_CODES) {
    if (code === 'R01' || code === 'R02') continue; // Already checked above

    const result = await session.run(buildRelCountQuery(code));
    const count = result.records[0].get('count').toNumber();
    info(`${code} ${REL_ENDPOINTS[code] ? '' : '(unknown)'}`, results, count);
    printInfo(results.info.at(-1)!, '  ');
  }
}

async function checkCardinality(session: Session, results: ValidationResults): Promise<void> {
  console.log('\nCardinality Checks:');

  // Every Story (E02) has exactly 1 Epic parent via R01
  const storyResult = await session.run(buildCardinalityQuery('E02', 'E01', 'R01'));
  const storyViolations = storyResult.records.length;
  check(
    'Every Story has exactly 1 Epic parent (R01)',
    storyViolations === 0,
    results,
    storyViolations === 0 ? 'valid' : `${storyViolations} violations`,
    '0 violations'
  );
  printResult(storyViolations === 0 ? results.passed.at(-1)! : results.failed.at(-1)!, '  ');

  if (storyViolations > 0) {
    for (const record of storyResult.records.slice(0, 3)) {
      console.log(`    - ${record.get('childId')}: ${record.get('parentCount')} parents`);
    }
  }

  // Every AC (E03) has exactly 1 Story parent via R02
  const acResult = await session.run(buildCardinalityQuery('E03', 'E02', 'R02'));
  const acViolations = acResult.records.length;
  check(
    'Every AC has exactly 1 Story parent (R02)',
    acViolations === 0,
    results,
    acViolations === 0 ? 'valid' : `${acViolations} violations`,
    '0 violations'
  );
  printResult(acViolations === 0 ? results.passed.at(-1)! : results.failed.at(-1)!, '  ');

  if (acViolations > 0) {
    for (const record of acResult.records.slice(0, 3)) {
      console.log(`    - ${record.get('childId')}: ${record.get('parentCount')} parents`);
    }
  }
}

async function checkAllowedRelCodes(session: Session, results: ValidationResults): Promise<void> {
  console.log('\nAllowed Relationship Codes:');

  const result = await session.run(buildAllRelCodesQuery());
  const foundCodes = result.records.map(r => r.get('code') as string);
  const invalidCodes = foundCodes.filter(c => !TRACK_A_REL_CODES.includes(c as any));

  check(
    'No non-Track-A relationship codes',
    invalidCodes.length === 0,
    results,
    invalidCodes.length === 0 ? 'valid' : invalidCodes.join(', '),
    'only Track A codes'
  );
  printResult(invalidCodes.length === 0 ? results.passed.at(-1)! : results.failed.at(-1)!, '  ');
}

async function checkEndpointTypes(session: Session, results: ValidationResults): Promise<void> {
  console.log('\nEndpoint Type Validation:');

  for (const code of TRACK_A_REL_CODES) {
    const endpoints = REL_ENDPOINTS[code];
    if (!endpoints) {
      check(`${code} endpoint definition`, false, results, undefined, undefined, 'missing from REL_ENDPOINTS');
      printResult(results.failed.at(-1)!, '  ');
      continue;
    }

    // First check if any relationships of this type exist
    const countResult = await session.run(buildRelCountQuery(code));
    const count = countResult.records[0].get('count').toNumber();

    if (count === 0) {
      // No relationships of this type - PASS (unless it's R01/R02 which are count-asserted elsewhere)
      if (code === 'R01' || code === 'R02') {
        // Already checked in relationship counts - skip duplicate message
        continue;
      }
      check(`${code} endpoints`, true, results, 'no occurrences', undefined, 'skipped - 0 relationships');
      printResult(results.passed.at(-1)!, '  ');
      continue;
    }

    // Normalize to arrays
    const fromTypes = Array.isArray(endpoints.from) ? endpoints.from : [endpoints.from];
    const toTypes = Array.isArray(endpoints.to) ? endpoints.to : [endpoints.to];

    // Check for violations
    const violationResult = await session.run(buildRelEndpointValidationQuery(code, fromTypes, toTypes));
    const violations = violationResult.records.length;

    const expectedEndpoints = `${fromTypes.join('|')} -> ${toTypes.join('|')}`;
    check(
      `${code} endpoints (${expectedEndpoints})`,
      violations === 0,
      results,
      violations === 0 ? 'valid' : `${violations} violations`,
      '0 violations'
    );
    printResult(violations === 0 ? results.passed.at(-1)! : results.failed.at(-1)!, '  ');

    if (violations > 0) {
      for (const record of violationResult.records.slice(0, 3)) {
        console.log(`    - ${record.get('from_id')} (${record.get('from_type')}) -> ${record.get('to_id')} (${record.get('to_type')})`);
      }
    }
  }
}

// ============================================================
// SHADOW LEDGER VALIDATION
// ============================================================

interface LedgerValidationResult {
  exists: boolean;
  nonEmpty: boolean;
  totalLines: number;
  entityEntries: number;
  relationshipEntries: number;
  parseErrors: string[];
  schemaErrors: string[];
}

async function validateShadowLedger(results: ValidationResults): Promise<void> {
  console.log('\nShadow Ledger Validation:');

  const ledgerPath = process.env.SHADOW_LEDGER_PATH || 'shadow-ledger/ledger.jsonl';

  // Check file exists
  let content: string;
  try {
    content = await fs.readFile(ledgerPath, 'utf8');
  } catch (err) {
    check('Ledger file exists', false, results, ledgerPath, 'file must exist');
    printResult(results.failed.at(-1)!, '  ');
    return;
  }

  check('Ledger file exists', true, results, ledgerPath);
  printResult(results.passed.at(-1)!, '  ');

  // Check non-empty
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length === 0) {
    check('Ledger non-empty', false, results, 0, '> 0 entries');
    printResult(results.failed.at(-1)!, '  ');
    return;
  }

  check('Ledger non-empty', true, results, `${lines.length} lines`);
  printResult(results.passed.at(-1)!, '  ');

  // Parse and validate entries (up to 2000 lines)
  const maxLines = Math.min(lines.length, 2000);
  let entityEntries = 0;
  let relationshipEntries = 0;
  const parseErrors: string[] = [];
  const schemaErrors: string[] = [];

  for (let i = 0; i < maxLines; i++) {
    const line = lines[i];
    let entry: Record<string, unknown>;

    try {
      entry = JSON.parse(line);
    } catch (err) {
      parseErrors.push(`Line ${i + 1}: JSON parse error`);
      continue;
    }

    // Classify entry by fields
    const hasRelationshipCode = 'relationship_code' in entry;
    const hasEntityType = 'entity_type' in entry;

    if (hasRelationshipCode) {
      // Relationship entry
      relationshipEntries++;
      const requiredKeys = ['timestamp', 'relationship_code', 'from_id', 'to_id'];
      const missing = requiredKeys.filter(k => !(k in entry));
      if (missing.length > 0) {
        schemaErrors.push(`Line ${i + 1}: Relationship entry missing keys: ${missing.join(', ')}`);
      }
    } else if (hasEntityType) {
      // Entity entry
      entityEntries++;
      const hasInstanceId = 'instance_id' in entry;
      const hasId = 'id' in entry;
      if (!('timestamp' in entry)) {
        schemaErrors.push(`Line ${i + 1}: Entity entry missing timestamp`);
      }
      if (!hasInstanceId && !hasId) {
        schemaErrors.push(`Line ${i + 1}: Entity entry missing instance_id or id`);
      }
    } else {
      // Unknown entry type
      schemaErrors.push(`Line ${i + 1}: Entry matches neither entity nor relationship schema`);
    }
  }

  // Report parse errors
  if (parseErrors.length > 0) {
    check('Ledger entries parseable', false, results, `${parseErrors.length} parse errors`);
    printResult(results.failed.at(-1)!, '  ');
    parseErrors.slice(0, 3).forEach(e => console.log(`    - ${e}`));
  } else {
    check('Ledger entries parseable', true, results, `${maxLines} lines parsed`);
    printResult(results.passed.at(-1)!, '  ');
  }

  // Report schema errors
  if (schemaErrors.length > 0) {
    check('Ledger entries valid schema', false, results, `${schemaErrors.length} schema errors`);
    printResult(results.failed.at(-1)!, '  ');
    schemaErrors.slice(0, 3).forEach(e => console.log(`    - ${e}`));
  } else {
    check('Ledger entries valid schema', true, results, `${entityEntries} entity, ${relationshipEntries} relationship`);
    printResult(results.passed.at(-1)!, '  ');
  }

  // At least one relationship entry must exist (proves A2 produced work)
  check(
    'Ledger has relationship entries (A2 work)',
    relationshipEntries > 0,
    results,
    relationshipEntries,
    '> 0'
  );
  printResult(relationshipEntries > 0 ? results.passed.at(-1)! : results.failed.at(-1)!, '  ');
}

// ============================================================
// MAIN VALIDATION FUNCTION
// ============================================================

async function validateA2Exit(): Promise<number> {
  console.log('=== A2 Relationship Registry Exit Validation ===');
  console.log(`Timestamp: ${new Date().toISOString()}\n`);

  const results: ValidationResults = {
    passed: [],
    failed: [],
    info: [],
  };

  // Connect to Neo4j
  let driver: Driver;
  try {
    driver = neo4j.driver(
      config.neo4jUrl,
      neo4j.auth.basic(config.neo4jUser, config.neo4jPassword)
    );
  } catch (err) {
    console.error('\x1b[31m[FATAL]\x1b[0m Failed to create Neo4j driver:', err);
    return 1;
  }

  try {
    // Neo4j connectivity
    console.log('Neo4j Connectivity:');
    const connected = await checkNeo4jConnectivity(driver, results);
    if (!connected) {
      printSummary(results);
      return 1;
    }

    const session = driver.session();

    try {
      // Schema probing
      console.log('\nSchema Probing:');
      await probeNodeSchema(session);
      await probeRelationshipSchema(session);

      // Constraints
      await checkConstraintsExist(session, results);

      // Entity counts
      await checkEntityCounts(session, results);

      // Relationship counts
      await checkRelationshipCounts(session, results);

      // Cardinality checks
      await checkCardinality(session, results);

      // Allowed relationship codes
      await checkAllowedRelCodes(session, results);

      // Endpoint type validation
      await checkEndpointTypes(session, results);

    } finally {
      await session.close();
    }

    // Shadow ledger validation
    await validateShadowLedger(results);

    // Summary
    printSummary(results);

    return results.failed.length === 0 ? 0 : 1;

  } catch (err) {
    console.error('\x1b[31m[FATAL]\x1b[0m Unexpected error:', err);
    return 1;
  } finally {
    await driver.close();
  }
}

// ============================================================
// ENTRY POINT
// ============================================================

validateA2Exit()
  .then((exitCode) => process.exit(exitCode))
  .catch((err) => {
    console.error('[FATAL]', err);
    process.exit(1);
  });
