// @implements INFRASTRUCTURE
// Track A Entry Verification Script
// Verifies all prerequisites from spec/track_a/ENTRY.md before Track A implementation begins
// Per PROMPTS.md Phase 0.7 specification

import 'dotenv/config';
import { existsSync, readFileSync } from 'fs';
import { execSync } from 'child_process';
import { Pool } from 'pg';
import neo4j from 'neo4j-driver';

const CANONICAL_DOCS = [
  'docs/BRD_V20_6_3_COMPLETE.md',
  'docs/UNIFIED_TRACEABILITY_GRAPH_SCHEMA_V20_6_1.md',
  'docs/UNIFIED_VERIFICATION_SPECIFICATION_V20_6_4.md',
  'docs/GNOSIS_TO_SOPHIA_MASTER_ROADMAP_V20_6_4.md',
  'docs/CURSOR_IMPLEMENTATION_PLAN_V20_8_5.md',
  'docs/integrations/EP-D-002_RUNTIME_RECONCILIATION_V20_6_1.md',
];

const REQUIRED_DIRS = ['src', 'test', 'docs', 'spec'];
const REQUIRED_ENV_VARS = ['DATABASE_URL', 'NEO4J_URL', 'NODE_ENV'];

const TRACK_A_SPECS = [
  'spec/track_a/ENTRY.md',
  'spec/track_a/EXIT.md',
  'spec/track_a/PROMPTS.md',
  'spec/track_a/HUMAN_GATE_HGR-1.md',
  'spec/track_a/stories/A1_ENTITY_REGISTRY.md',
  'spec/track_a/stories/A2_RELATIONSHIP_REGISTRY.md',
  'spec/track_a/stories/A3_MARKER_EXTRACTION.md',
  'spec/track_a/stories/A4_STRUCTURAL_ANALYSIS.md',
  'spec/track_a/stories/A5_GRAPH_API_V1.md',
];

interface CheckResult {
  name: string;
  passed: boolean;
  message: string;
}

const results: CheckResult[] = [];

function addResult(name: string, passed: boolean, message: string): void {
  results.push({ name, passed, message });
}

async function checkEnvironment(): Promise<void> {
  const missing = REQUIRED_ENV_VARS.filter(v => !process.env[v]);
  if (missing.length === 0) {
    addResult('Environment variables', true, `All required env vars present (${REQUIRED_ENV_VARS.join(', ')})`);
  } else {
    addResult('Environment variables', false, `Missing: ${missing.join(', ')}`);
  }
}

async function checkCanonicalDocs(): Promise<void> {
  const missing = CANONICAL_DOCS.filter(d => !existsSync(d));
  if (missing.length === 0) {
    addResult('Canonical documents', true, `All ${CANONICAL_DOCS.length} canonical documents present`);
  } else {
    addResult('Canonical documents', false, `Missing: ${missing.join(', ')}`);
  }
}

async function checkProjectStructure(): Promise<void> {
  const missing = REQUIRED_DIRS.filter(d => !existsSync(d));
  if (missing.length === 0) {
    addResult('Project structure', true, `Required directories present (${REQUIRED_DIRS.join(', ')})`);
  } else {
    addResult('Project structure', false, `Missing directories: ${missing.join(', ')}`);
  }
}

async function checkPostgreSQL(): Promise<void> {
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    // Check connection
    await pool.query('SELECT 1');
    
    // Check entities table has required columns
    const entitiesResult = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'entities' 
      AND column_name IN ('instance_id', 'entity_type', 'project_id', 'content_hash')
    `);
    const entityCols = entitiesResult.rows.map(r => r.column_name);
    
    // Check relationships table has required columns
    const relResult = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'relationships' 
      AND column_name IN ('instance_id', 'relationship_type', 'from_entity_id', 'to_entity_id', 'project_id')
    `);
    const relCols = relResult.rows.map(r => r.column_name);
    
    await pool.end();
    
    const hasAllEntityCols = ['instance_id', 'entity_type', 'project_id', 'content_hash'].every(c => entityCols.includes(c));
    const hasAllRelCols = ['instance_id', 'relationship_type', 'from_entity_id', 'to_entity_id', 'project_id'].every(c => relCols.includes(c));
    
    if (hasAllEntityCols && hasAllRelCols) {
      addResult('PostgreSQL schema', true, 'Connection successful, schema verified');
    } else {
      addResult('PostgreSQL schema', false, `Missing columns - entities: ${entityCols.join(',')}, relationships: ${relCols.join(',')}`);
    }
  } catch (error) {
    addResult('PostgreSQL schema', false, `Connection failed: ${(error as Error).message}`);
  }
}

async function checkNeo4j(): Promise<void> {
  let driver: neo4j.Driver | null = null;
  let session: neo4j.Session | null = null;
  
  try {
    driver = neo4j.driver(
      process.env.NEO4J_URL!,
      neo4j.auth.basic(process.env.NEO4J_USER || 'neo4j', process.env.NEO4J_PASSWORD || '')
    );
    session = driver.session();
    try {
      await session.run('RETURN 1');
    } finally {
      try { await session.close(); } catch { /* ignore close errors */ }
    }
    addResult('Neo4j connection', true, 'Connection successful');
  } catch (error) {
    addResult('Neo4j connection', false, `Connection failed: ${(error as Error).message}`);
  } finally {
    if (driver) {
      try { await driver.close(); } catch { /* ignore close errors */ }
    }
  }
}

async function checkMigration003(): Promise<void> {
  const migrationPath = 'migrations/003_reset_schema_to_cursor_plan.sql';
  if (!existsSync(migrationPath)) {
    addResult('Migration 003 content', false, 'Migration file not found');
    return;
  }
  
  const content = readFileSync(migrationPath, 'utf8');
  
  const checks = {
    compositeUnique: /UNIQUE\s*\(\s*project_id\s*,\s*instance_id\s*\)/i.test(content),
    rCodeRegex: /\^R\[0-9\]\{2\}\$/.test(content) && !/\{2,3\}/.test(content),
    rlsVariable: /app\.project_id/.test(content),
    entityType: /entity_type\s+VARCHAR/.test(content),
    instanceId: /instance_id\s+VARCHAR/.test(content),
  };
  
  const allPassed = Object.values(checks).every(v => v);
  
  if (allPassed) {
    addResult('Migration 003 content', true, 'Schema matches Cursor Plan (composite unique, R{2} regex, RLS)');
  } else {
    const failed = Object.entries(checks).filter(([_, v]) => !v).map(([k]) => k);
    addResult('Migration 003 content', false, `Missing or incorrect: ${failed.join(', ')}`);
  }
}

async function checkTrackASpecs(): Promise<void> {
  const missing = TRACK_A_SPECS.filter(s => !existsSync(s));
  if (missing.length === 0) {
    addResult('Track A specifications', true, `All ${TRACK_A_SPECS.length} Track A spec files present`);
  } else {
    addResult('Track A specifications', false, `Missing: ${missing.join(', ')}`);
  }
}

async function checkSanitySuite(): Promise<void> {
  console.log('\nRunning SANITY suite (SANITY-001 through SANITY-024)...\n');
  try {
    execSync('npm run test:sanity', { stdio: 'inherit' });
    addResult('SANITY suite', true, 'All pre-entry tests pass');
  } catch {
    addResult('SANITY suite', false, 'SANITY tests failed - see output above');
  }
}

async function main(): Promise<void> {
  console.log('Track A Entry Verification\n');
  console.log('═'.repeat(60) + '\n');

  // Infrastructure checks first (fast)
  await checkEnvironment();
  await checkCanonicalDocs();
  await checkProjectStructure();
  await checkPostgreSQL();
  await checkNeo4j();
  await checkMigration003();
  await checkTrackASpecs();
  
  // SANITY suite last (runs tests, slower)
  await checkSanitySuite();

  console.log('\n' + '═'.repeat(60));
  console.log('\nResults:\n');
  
  let allPassed = true;
  for (const result of results) {
    const icon = result.passed ? '✓' : '✗';
    console.log(`${icon} ${result.name}: ${result.message}`);
    if (!result.passed) allPassed = false;
  }
  
  console.log('\n' + '═'.repeat(60));
  
  if (allPassed) {
    console.log('\n✓ TRACK A ENTRY: APPROVED\n');
    console.log('All entry prerequisites verified. Ready to proceed to Story A.1: Entity Registry.\n');
    process.exit(0);
  } else {
    console.log('\n✗ TRACK A ENTRY: BLOCKED\n');
    console.log('Fix the failed checks above before proceeding.\n');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
