/**
 * A1-A4 Coverage Report Generator
 * 
 * Generates a deterministic, machine-verifiable coverage accounting report
 * for Track A through A4.
 * 
 * @implements STORY-64.4
 * @g-api-exception Direct DB access required for verification evidence output.
 *   This script is read-only and queries counts for coverage audit.
 */
import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { Pool } from 'pg';
import neo4j, { Driver, Session } from 'neo4j-driver';
import {
  ENTITY_EXPECTATIONS,
  RELATIONSHIP_EXPECTATIONS,
  getStatusForPhase,
  type Phase,
  type Status,
} from './expectations/track-a-expectations.js';

// -----------------------------------------------------------------------------
// Configuration
// -----------------------------------------------------------------------------

const CANONICAL_PROJECT_ID = process.env.PROJECT_ID || '6df2f456-440d-4958-b475-d9808775ff69';
const PHASE: Phase = 'A4';
const OUTPUT_DIR = 'docs/verification';

// -----------------------------------------------------------------------------
// Database Connections
// -----------------------------------------------------------------------------

let pool: Pool;
let neo4jDriver: Driver;

function initConnections() {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  neo4jDriver = neo4j.driver(
    process.env.NEO4J_URL || 'bolt://localhost:7687',
    neo4j.auth.basic(
      process.env.NEO4J_USER || 'neo4j',
      process.env.NEO4J_PASSWORD || 'password'
    )
  );
}

async function closeConnections() {
  await pool.end();
  await neo4jDriver.close();
}

// -----------------------------------------------------------------------------
// RLS Context Helper
// -----------------------------------------------------------------------------

async function queryWithRLS<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  const client = await pool.connect();
  try {
    await client.query('SELECT set_project_id($1)', [CANONICAL_PROJECT_ID]);
    const result = await client.query(sql, params);
    return result.rows as T[];
  } finally {
    client.release();
  }
}

async function queryNeo4j<T>(cypher: string, params: Record<string, unknown> = {}): Promise<T[]> {
  const session = neo4jDriver.session();
  try {
    const result = await session.run(cypher, params);
    return result.records.map(r => r.toObject() as T);
  } finally {
    await session.close();
  }
}

// -----------------------------------------------------------------------------
// Section 0: Canonical Context
// -----------------------------------------------------------------------------

async function generateSection0(): Promise<string> {
  const gitSha = getGitSha();
  const brdHash = getBrdHash();
  const timestamp = new Date().toISOString();

  return `## Section 0 — Canonical Context

| Field | Value |
|-------|-------|
| PROJECT_ID | \`${CANONICAL_PROJECT_ID}\` |
| Git SHA | \`${gitSha}\` |
| BRD Hash | \`${brdHash}\` |
| Timestamp | \`${timestamp}\` |
| Phase | \`${PHASE}\` |
| RLS Context | ✅ All queries use \`set_project_id()\` |

`;
}

function getGitSha(): string {
  try {
    const { execSync } = require('child_process');
    return execSync('git rev-parse HEAD', { encoding: 'utf-8', cwd: process.cwd() }).trim();
  } catch (e) {
    console.warn('Could not get git SHA:', e);
    return 'unknown';
  }
}

function getBrdHash(): string {
  try {
    const envPath = path.resolve(process.cwd(), '.si-universe.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      const match = content.match(/BRD_HASH=([^\s]+)/);
      return match?.[1] || 'unknown';
    }
  } catch {}
  return 'unknown';
}

// -----------------------------------------------------------------------------
// Section 1: Entity Type Coverage
// -----------------------------------------------------------------------------

interface EntityCount {
  entity_type: string;
  count: number;
}

async function generateSection1(): Promise<string> {
  const counts = await queryWithRLS<EntityCount>(
    `SELECT entity_type, COUNT(*)::int as count 
     FROM entities WHERE project_id = $1 
     GROUP BY entity_type ORDER BY entity_type`,
    [CANONICAL_PROJECT_ID]
  );
  const countMap = new Map(counts.map(c => [c.entity_type, c.count]));

  let table = `## Section 1 — Entity Type Coverage (E-codes)

### 1.1 Expected Universe

16 Track A entity types per \`scripts/verification/expectations/track-a-expectations.ts\`.

### 1.2 Observed

Query: \`SELECT entity_type, COUNT(*) FROM entities WHERE project_id = $1 GROUP BY entity_type\`

### 1.3 Coverage Table

| EntityType | Name | ExpectedStatus(A4) | ExpectedRule | ActualCount | Pass/Fail | ClassificationIfFail | Evidence |
|------------|------|-------------------|--------------|-------------|-----------|---------------------|----------|
`;

  let defects = 0;
  for (const exp of ENTITY_EXPECTATIONS) {
    const status = getStatusForPhase(exp, PHASE);
    const actualCount = countMap.get(exp.code) || 0;
    const { pass, rule, classification } = evaluateExpectation(status, actualCount, exp.invariantCount);
    const evidence = `track-a-expectations.ts:${exp.code}`;
    
    if (!pass) defects++;
    
    table += `| ${exp.code} | ${exp.name} | ${status} | ${rule} | ${actualCount} | ${pass ? '✅ Pass' : '❌ Fail'} | ${classification} | ${evidence} |\n`;
  }

  table += `\n**Summary:** ${ENTITY_EXPECTATIONS.length - defects}/${ENTITY_EXPECTATIONS.length} passed\n\n`;
  return table;
}

function evaluateExpectation(
  status: Status,
  actual: number,
  invariant?: number
): { pass: boolean; rule: string; classification: string } {
  switch (status) {
    case 'EXPECTED_NONZERO':
      if (invariant !== undefined) {
        return {
          pass: actual === invariant,
          rule: `==${invariant}`,
          classification: actual === invariant ? 'IMPLEMENTED' : 'DEFECT',
        };
      }
      return {
        pass: actual > 0,
        rule: '>0',
        classification: actual > 0 ? 'IMPLEMENTED' : 'DEFECT',
      };
    case 'EXPECTED_ZERO':
      return {
        pass: actual === 0,
        rule: '==0',
        classification: actual === 0 ? 'IMPLEMENTED' : 'DEFECT',
      };
    case 'ALLOWED_ZERO':
      return {
        pass: true,
        rule: '>=0',
        classification: 'ALLOWED_ZERO',
      };
    case 'DEFERRED_TO_A3':
    case 'DEFERRED_TO_A4':
    case 'DEFERRED_TO_A5':
      return {
        pass: true,
        rule: 'deferred',
        classification: 'DEFERRED',
      };
    case 'NA':
      return {
        pass: true,
        rule: 'N/A',
        classification: 'OUT_OF_SCOPE',
      };
    default:
      return {
        pass: false,
        rule: 'unknown',
        classification: 'DEFECT',
      };
  }
}

// -----------------------------------------------------------------------------
// Section 2: BRD Universe Coverage
// -----------------------------------------------------------------------------

async function generateSection2(): Promise<string> {
  const e01Count = await queryWithRLS<{ count: number }>(
    `SELECT COUNT(*)::int as count FROM entities WHERE project_id = $1 AND entity_type = 'E01'`,
    [CANONICAL_PROJECT_ID]
  );
  const e02Count = await queryWithRLS<{ count: number }>(
    `SELECT COUNT(*)::int as count FROM entities WHERE project_id = $1 AND entity_type = 'E02'`,
    [CANONICAL_PROJECT_ID]
  );
  const e03Count = await queryWithRLS<{ count: number }>(
    `SELECT COUNT(*)::int as count FROM entities WHERE project_id = $1 AND entity_type = 'E03'`,
    [CANONICAL_PROJECT_ID]
  );

  const e01 = e01Count[0]?.count || 0;
  const e02 = e02Count[0]?.count || 0;
  const e03 = e03Count[0]?.count || 0;

  const expectedE01 = 65;
  const expectedE02 = 397;
  const expectedE03 = 3147;

  let section = `## Section 2 — BRD Universe Coverage (Epics/Stories/ACs)

### 2.1 Expected

Canonical BRD counts (per \`docs/BRD_V20_6_4_COMPLETE.md\`):
- E01 (Epic): ${expectedE01}
- E02 (Story): ${expectedE02}
- E03 (AcceptanceCriterion): ${expectedE03}

### 2.2 Observed

| EntityType | Expected | Actual | Match |
|------------|----------|--------|-------|
| E01 (Epic) | ${expectedE01} | ${e01} | ${e01 === expectedE01 ? '✅' : '❌'} |
| E02 (Story) | ${expectedE02} | ${e02} | ${e02 === expectedE02 ? '✅' : '❌'} |
| E03 (AcceptanceCriterion) | ${expectedE03} | ${e03} | ${e03 === expectedE03 ? '✅' : '❌'} |

### 2.3 Delta

`;

  if (e01 !== expectedE01) {
    section += `**E01 Mismatch:** Expected ${expectedE01}, found ${e01}\n\n`;
    if (e01 > expectedE01) {
      const extras = await queryWithRLS<{ instance_id: string; name: string; source_file: string }>(
        `SELECT instance_id, name, source_file FROM entities 
         WHERE project_id = $1 AND entity_type = 'E01' 
         ORDER BY instance_id`,
        [CANONICAL_PROJECT_ID]
      );
      section += `Extra E01 entities (${e01 - expectedE01}):\n`;
      section += '| instance_id | name | source_file |\n|-------------|------|-------------|\n';
      for (const e of extras.slice(expectedE01)) {
        section += `| ${e.instance_id} | ${e.name} | ${e.source_file || 'null'} |\n`;
      }
    }
    section += '\n';
  }

  if (e01 === expectedE01 && e02 === expectedE02 && e03 === expectedE03) {
    section += 'No delta — all counts match.\n\n';
  }

  section += `### 2.4 Classification

| Mismatch | Classification | Evidence |
|----------|----------------|----------|
`;
  section += e01 === expectedE01 ? '| E01 | IMPLEMENTED | BRD parity verified |\n' : '| E01 | DEFECT | Count mismatch |\n';
  section += e02 === expectedE02 ? '| E02 | IMPLEMENTED | BRD parity verified |\n' : '| E02 | DEFECT | Count mismatch |\n';
  section += e03 === expectedE03 ? '| E03 | IMPLEMENTED | BRD parity verified |\n' : '| E03 | DEFECT | Count mismatch |\n';

  section += '\n';
  return section;
}

// -----------------------------------------------------------------------------
// Section 3: Relationship Type Coverage
// -----------------------------------------------------------------------------

interface RelCount {
  relationship_type: string;
  count: number;
}

async function generateSection3(): Promise<string> {
  const counts = await queryWithRLS<RelCount>(
    `SELECT relationship_type, COUNT(*)::int as count 
     FROM relationships WHERE project_id = $1 
     GROUP BY relationship_type ORDER BY relationship_type`,
    [CANONICAL_PROJECT_ID]
  );
  const countMap = new Map(counts.map(c => [c.relationship_type, c.count]));

  let table = `## Section 3 — Relationship Type Coverage (R-codes)

### 3.1 Expected Universe

20 Track A relationship types per \`scripts/verification/expectations/track-a-expectations.ts\`.

### 3.2 Observed

Query: \`SELECT relationship_type, COUNT(*) FROM relationships WHERE project_id = $1 GROUP BY relationship_type\`

### 3.3 Coverage Table

| RelCode | Name | ExpectedStatus(A4) | ExpectedRule | ActualCount | Pass/Fail | ClassificationIfFail | Evidence |
|---------|------|-------------------|--------------|-------------|-----------|---------------------|----------|
`;

  let defects = 0;
  for (const exp of RELATIONSHIP_EXPECTATIONS) {
    const status = getStatusForPhase(exp, PHASE);
    const actualCount = countMap.get(exp.code) || 0;
    const { pass, rule, classification } = evaluateExpectation(status, actualCount, exp.invariantCount);
    const evidence = `track-a-expectations.ts:${exp.code}`;
    
    if (!pass) defects++;
    
    table += `| ${exp.code} | ${exp.name} | ${status} | ${rule} | ${actualCount} | ${pass ? '✅ Pass' : '❌ Fail'} | ${classification} | ${evidence} |\n`;
  }

  table += `\n**Summary:** ${RELATIONSHIP_EXPECTATIONS.length - defects}/${RELATIONSHIP_EXPECTATIONS.length} passed\n\n`;
  return table;
}

// -----------------------------------------------------------------------------
// Section 4: Evidence Anchor Coverage
// -----------------------------------------------------------------------------

async function generateSection4(): Promise<string> {
  // Entity evidence
  const entityEvidence = await queryWithRLS<{
    entity_type: string;
    total: number;
    missing_source: number;
    invalid_line_start: number;
    invalid_line_end: number;
  }>(
    `SELECT 
       entity_type,
       COUNT(*)::int as total,
       COUNT(*) FILTER (WHERE source_file IS NULL OR source_file = '')::int as missing_source,
       COUNT(*) FILTER (WHERE line_start IS NULL OR line_start <= 0)::int as invalid_line_start,
       COUNT(*) FILTER (WHERE line_end IS NULL OR line_end < line_start)::int as invalid_line_end
     FROM entities 
     WHERE project_id = $1
     GROUP BY entity_type
     ORDER BY entity_type`,
    [CANONICAL_PROJECT_ID]
  );

  // Relationship evidence
  const relEvidence = await queryWithRLS<{
    relationship_type: string;
    total: number;
    missing_source: number;
    invalid_line_start: number;
    invalid_line_end: number;
    missing_extracted_at: number;
  }>(
    `SELECT 
       relationship_type,
       COUNT(*)::int as total,
       COUNT(*) FILTER (WHERE source_file IS NULL OR source_file = '')::int as missing_source,
       COUNT(*) FILTER (WHERE line_start IS NULL OR line_start <= 0)::int as invalid_line_start,
       COUNT(*) FILTER (WHERE line_end IS NULL OR line_end < line_start)::int as invalid_line_end,
       COUNT(*) FILTER (WHERE extracted_at IS NULL)::int as missing_extracted_at
     FROM relationships 
     WHERE project_id = $1
     GROUP BY relationship_type
     ORDER BY relationship_type`,
    [CANONICAL_PROJECT_ID]
  );

  let section = `## Section 4 — Evidence Anchor Coverage

### 4.1 Entity Evidence Fields

| EntityType | Total | Missing_source_file | Invalid_line_start | Invalid_line_end | Pass/Fail |
|------------|-------|---------------------|-------------------|-----------------|-----------|
`;

  for (const e of entityEvidence) {
    const pass = e.missing_source === 0 && e.invalid_line_start === 0 && e.invalid_line_end === 0;
    section += `| ${e.entity_type} | ${e.total} | ${e.missing_source} | ${e.invalid_line_start} | ${e.invalid_line_end} | ${pass ? '✅ Pass' : '❌ Fail'} |\n`;
  }

  section += `\n### 4.2 Relationship Evidence Fields

| RelType | Total | Missing_source_file | Invalid_line_start | Invalid_line_end | Missing_extracted_at | Pass/Fail |
|---------|-------|---------------------|-------------------|-----------------|---------------------|-----------|
`;

  for (const r of relEvidence) {
    const pass = r.missing_source === 0 && r.invalid_line_start === 0 && r.invalid_line_end === 0 && r.missing_extracted_at === 0;
    section += `| ${r.relationship_type} | ${r.total} | ${r.missing_source} | ${r.invalid_line_start} | ${r.invalid_line_end} | ${r.missing_extracted_at} | ${pass ? '✅ Pass' : '❌ Fail'} |\n`;
  }

  section += '\n';
  return section;
}

// -----------------------------------------------------------------------------
// Section 5: Referential Integrity Coverage
// -----------------------------------------------------------------------------

async function generateSection5(): Promise<string> {
  const orphans = await queryWithRLS<{
    relationship_type: string;
    orphan_from: number;
    orphan_to: number;
  }>(
    `SELECT 
       r.relationship_type,
       COUNT(*) FILTER (WHERE e_from.id IS NULL)::int as orphan_from,
       COUNT(*) FILTER (WHERE e_to.id IS NULL)::int as orphan_to
     FROM relationships r
     LEFT JOIN entities e_from ON r.from_entity_id = e_from.id AND r.project_id = e_from.project_id
     LEFT JOIN entities e_to ON r.to_entity_id = e_to.id AND r.project_id = e_to.project_id
     WHERE r.project_id = $1
     GROUP BY r.relationship_type
     ORDER BY r.relationship_type`,
    [CANONICAL_PROJECT_ID]
  );

  let section = `## Section 5 — Referential Integrity Coverage

### 5.1 Orphan Endpoints

| RelType | OrphanFrom | OrphanTo | Pass/Fail |
|---------|-----------|----------|-----------|
`;

  let hasDefects = false;
  for (const o of orphans) {
    const pass = o.orphan_from === 0 && o.orphan_to === 0;
    if (!pass) hasDefects = true;
    section += `| ${o.relationship_type} | ${o.orphan_from} | ${o.orphan_to} | ${pass ? '✅ Pass' : '❌ DEFECT'} |\n`;
  }

  section += `\n**Summary:** ${hasDefects ? '❌ Orphan references detected' : '✅ All references valid'}\n\n`;
  return section;
}

// -----------------------------------------------------------------------------
// Section 6: Acceptance Criteria Coverage (E03 → R19)
// -----------------------------------------------------------------------------

async function generateSection6(): Promise<string> {
  const totalACs = await queryWithRLS<{ count: number }>(
    `SELECT COUNT(*)::int as count FROM entities WHERE project_id = $1 AND entity_type = 'E03'`,
    [CANONICAL_PROJECT_ID]
  );

  const acsWithR19 = await queryWithRLS<{ count: number }>(
    `SELECT COUNT(DISTINCT e.id)::int as count
     FROM entities e
     JOIN relationships r ON r.to_entity_id = e.id AND r.project_id = e.project_id
     WHERE e.project_id = $1 AND e.entity_type = 'E03' AND r.relationship_type = 'R19'`,
    [CANONICAL_PROJECT_ID]
  );

  const total = totalACs[0]?.count || 0;
  const withR19 = acsWithR19[0]?.count || 0;
  const withoutR19 = total - withR19;

  let section = `## Section 6 — Acceptance Criteria Coverage (E03 → R19)

### 6.1 Expected Universe

Total E03 AcceptanceCriterion entities in DB: ${total}

### 6.2 Observed Link

ACs with at least one R19 SATISFIES relationship: ${withR19}

### 6.3 Summary

| Total_ACs | ACs_with_R19 | ACs_without_R19 |
|-----------|-------------|----------------|
| ${total} | ${withR19} | ${withoutR19} |

**Coverage Rate:** ${total > 0 ? ((withR19 / total) * 100).toFixed(2) : 0}%

### 6.4 Classification

Most ACs without R19 are expected as DEFERRED — @satisfies markers are only applied to 
implemented functions/classes. Per spec, AC coverage grows incrementally as development proceeds.

| Classification | Count | Evidence |
|----------------|-------|----------|
| ACs with R19 (IMPLEMENTED) | ${withR19} | R19 exists in relationships table |
| ACs without R19 (DEFERRED) | ${withoutR19} | Track A scope allows incremental coverage |

`;
  return section;
}

// -----------------------------------------------------------------------------
// Section 7: Technical Design Coverage (E06 → R14)
// -----------------------------------------------------------------------------

async function generateSection7(): Promise<string> {
  const totalTDDs = await queryWithRLS<{ count: number }>(
    `SELECT COUNT(*)::int as count FROM entities WHERE project_id = $1 AND entity_type = 'E06'`,
    [CANONICAL_PROJECT_ID]
  );

  const tddsWithR14 = await queryWithRLS<{ count: number }>(
    `SELECT COUNT(DISTINCT e.id)::int as count
     FROM entities e
     JOIN relationships r ON r.from_entity_id = e.id AND r.project_id = e.project_id
     WHERE e.project_id = $1 AND e.entity_type = 'E06' AND r.relationship_type = 'R14'`,
    [CANONICAL_PROJECT_ID]
  );

  const total = totalTDDs[0]?.count || 0;
  const withR14 = tddsWithR14[0]?.count || 0;
  const withoutR14 = total - withR14;

  let section = `## Section 7 — Technical Design Coverage (E06 → R14)

### 7.1 Expected Universe

Total E06 TechnicalDesign entities in DB: ${total}

### 7.2 Observed

| Total_TDDs | TDDs_with_R14 | TDDs_without_R14 |
|-----------|--------------|-----------------|
| ${total} | ${withR14} | ${withoutR14} |

### 7.3 Classification

Per \`spec/track_a/ENTRY.md\`, R14 IMPLEMENTED_BY links TechnicalDesign → SourceFile.
TDDs without R14 may be abstract designs or not yet linked to implementation.

| Classification | Count | Evidence |
|----------------|-------|----------|
| TDDs with R14 (IMPLEMENTED) | ${withR14} | R14 exists |
| TDDs without R14 (DEFERRED) | ${withoutR14} | May be abstract/unimplemented |

`;
  return section;
}

// -----------------------------------------------------------------------------
// Section 8: Marker Governance Coverage
// -----------------------------------------------------------------------------

async function generateSection8(): Promise<string> {
  // Check for orphan R18 (IMPLEMENTS) - references to non-existent Story IDs
  const r18Orphans = await queryWithRLS<{ count: number }>(
    `SELECT COUNT(*)::int as count
     FROM relationships r
     LEFT JOIN entities e ON r.to_entity_id = e.id AND r.project_id = e.project_id
     WHERE r.project_id = $1 AND r.relationship_type = 'R18' AND e.id IS NULL`,
    [CANONICAL_PROJECT_ID]
  );

  // Check for orphan R19 (SATISFIES) - references to non-existent AC IDs
  const r19Orphans = await queryWithRLS<{ count: number }>(
    `SELECT COUNT(*)::int as count
     FROM relationships r
     LEFT JOIN entities e ON r.to_entity_id = e.id AND r.project_id = e.project_id
     WHERE r.project_id = $1 AND r.relationship_type = 'R19' AND e.id IS NULL`,
    [CANONICAL_PROJECT_ID]
  );

  const r18Total = await queryWithRLS<{ count: number }>(
    `SELECT COUNT(*)::int as count FROM relationships WHERE project_id = $1 AND relationship_type = 'R18'`,
    [CANONICAL_PROJECT_ID]
  );
  const r19Total = await queryWithRLS<{ count: number }>(
    `SELECT COUNT(*)::int as count FROM relationships WHERE project_id = $1 AND relationship_type = 'R19'`,
    [CANONICAL_PROJECT_ID]
  );

  const section = `## Section 8 — Marker Governance Coverage

### 8.1 Orphan Marker Relationships

| MarkerRel | Total | OrphanTargets | Pass/Fail |
|-----------|-------|--------------|-----------|
| R18 (IMPLEMENTS) | ${r18Total[0]?.count || 0} | ${r18Orphans[0]?.count || 0} | ${r18Orphans[0]?.count === 0 ? '✅ Pass' : '❌ DEFECT'} |
| R19 (SATISFIES) | ${r19Total[0]?.count || 0} | ${r19Orphans[0]?.count || 0} | ${r19Orphans[0]?.count === 0 ? '✅ Pass' : '❌ DEFECT'} |

`;
  return section;
}

// -----------------------------------------------------------------------------
// Section 9: Ledger Coverage
// -----------------------------------------------------------------------------

async function generateSection9(): Promise<string> {
  const ledgerPath = `shadow-ledger/${CANONICAL_PROJECT_ID}/ledger.jsonl`;
  const fullPath = path.resolve(process.cwd(), ledgerPath);
  
  let exists = false;
  let totalEntries = 0;
  let createCount = 0;
  let updateCount = 0;
  let decisionCount = 0;
  let pipelineStarted = false;
  let pipelineCompleted = false;
  let foreignProjects = 0;

  try {
    if (fs.existsSync(fullPath)) {
      exists = true;
      const content = fs.readFileSync(fullPath, 'utf-8');
      const lines = content.trim().split('\n').filter(l => l.trim());
      totalEntries = lines.length;

      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          if (entry.operation === 'CREATE') createCount++;
          else if (entry.operation === 'UPDATE') updateCount++;
          else if (entry.operation === 'DECISION') decisionCount++;
          
          if (entry.decision === 'PIPELINE_STARTED') pipelineStarted = true;
          if (entry.decision === 'PIPELINE_COMPLETED') pipelineCompleted = true;
          
          if (entry.project_id && entry.project_id !== CANONICAL_PROJECT_ID) {
            foreignProjects++;
          }
        } catch {}
      }
    }
  } catch {}

  const pass = exists && pipelineStarted && pipelineCompleted && foreignProjects === 0;

  const section = `## Section 9 — Ledger Coverage (Shadow Ledger)

| Metric | Value | Pass/Fail |
|--------|-------|-----------|
| Ledger Exists | ${exists ? '✅ Yes' : '❌ No'} | ${exists ? '✅' : '❌'} |
| Path | \`${ledgerPath}\` | - |
| Total Entries | ${totalEntries} | - |
| CREATE Operations | ${createCount} | - |
| UPDATE Operations | ${updateCount} | - |
| DECISION Operations | ${decisionCount} | - |
| PIPELINE_STARTED | ${pipelineStarted ? '✅ Found' : '❌ Missing'} | ${pipelineStarted ? '✅' : '❌'} |
| PIPELINE_COMPLETED | ${pipelineCompleted ? '✅ Found' : '❌ Missing'} | ${pipelineCompleted ? '✅' : '❌'} |
| Foreign project_id | ${foreignProjects} | ${foreignProjects === 0 ? '✅' : '❌'} |

**Overall:** ${pass ? '✅ Pass' : '❌ Fail'}

`;
  return section;
}

// -----------------------------------------------------------------------------
// Section 10: Epoch Coverage
// -----------------------------------------------------------------------------

async function generateSection10(): Promise<string> {
  const epochDir = `shadow-ledger/${CANONICAL_PROJECT_ID}/epochs`;
  const fullPath = path.resolve(process.cwd(), epochDir);
  
  let epochCount = 0;
  let latestEpoch: { epoch_id: string; repo_sha: string; completed_at: string } | null = null;

  try {
    if (fs.existsSync(fullPath)) {
      const files = fs.readdirSync(fullPath).filter(f => f.endsWith('.json'));
      epochCount = files.length;

      let latestTime = new Date(0);
      for (const file of files) {
        try {
          const content = fs.readFileSync(path.join(fullPath, file), 'utf-8');
          const epoch = JSON.parse(content);
          const completedAt = new Date(epoch.completed_at || epoch.started_at);
          if (completedAt > latestTime) {
            latestTime = completedAt;
            latestEpoch = {
              epoch_id: epoch.epoch_id,
              repo_sha: epoch.repo_sha,
              completed_at: epoch.completed_at || epoch.started_at,
            };
          }
        } catch {}
      }
    }
  } catch {}

  const pass = epochCount > 0 && latestEpoch !== null;

  const section = `## Section 10 — Epoch Coverage

| Metric | Value |
|--------|-------|
| Epoch Count | ${epochCount} |
| Latest Epoch ID | ${latestEpoch?.epoch_id || 'N/A'} |
| Latest SHA | ${latestEpoch?.repo_sha || 'N/A'} |
| Latest Timestamp | ${latestEpoch?.completed_at || 'N/A'} |

**Pass/Fail:** ${pass ? '✅ Pass' : '❌ Fail'}

`;
  return section;
}

// -----------------------------------------------------------------------------
// Section 11: Postgres ↔ Neo4j Parity
// -----------------------------------------------------------------------------

async function generateSection11(): Promise<string> {
  // Postgres counts
  const pgEntities = await queryWithRLS<{ count: number }>(
    `SELECT COUNT(*)::int as count FROM entities WHERE project_id = $1`,
    [CANONICAL_PROJECT_ID]
  );
  const pgRels = await queryWithRLS<{ count: number }>(
    `SELECT COUNT(*)::int as count FROM relationships WHERE project_id = $1`,
    [CANONICAL_PROJECT_ID]
  );

  const pgEntityTypes = await queryWithRLS<{ entity_type: string; count: number }>(
    `SELECT entity_type, COUNT(*)::int as count FROM entities WHERE project_id = $1 
     GROUP BY entity_type ORDER BY entity_type`,
    [CANONICAL_PROJECT_ID]
  );

  const pgRelTypes = await queryWithRLS<{ relationship_type: string; count: number }>(
    `SELECT relationship_type, COUNT(*)::int as count FROM relationships WHERE project_id = $1 
     GROUP BY relationship_type ORDER BY relationship_type`,
    [CANONICAL_PROJECT_ID]
  );

  // Neo4j counts
  const neo4jEntitiesResult = await queryNeo4j<{ count: number }>(
    'MATCH (n:Entity {project_id: $projectId}) RETURN count(n) as count',
    { projectId: CANONICAL_PROJECT_ID }
  );
  const neo4jRelsResult = await queryNeo4j<{ count: number }>(
    'MATCH (:Entity {project_id: $projectId})-[r:RELATIONSHIP]->(:Entity {project_id: $projectId}) RETURN count(r) as count',
    { projectId: CANONICAL_PROJECT_ID }
  );

  const neo4jEntityTypes = await queryNeo4j<{ type: string; count: number }>(
    'MATCH (n:Entity {project_id: $projectId}) RETURN n.entity_type as type, count(n) as count ORDER BY type',
    { projectId: CANONICAL_PROJECT_ID }
  );

  const neo4jRelTypes = await queryNeo4j<{ type: string; count: number }>(
    'MATCH (:Entity {project_id: $projectId})-[r:RELATIONSHIP]->(:Entity {project_id: $projectId}) RETURN r.relationship_type as type, count(r) as count ORDER BY type',
    { projectId: CANONICAL_PROJECT_ID }
  );

  const pgEntityTotal = pgEntities[0]?.count || 0;
  const pgRelTotal = pgRels[0]?.count || 0;
  const neo4jEntityTotal = typeof neo4jEntitiesResult[0]?.count === 'object' 
    ? (neo4jEntitiesResult[0]?.count as any).toNumber() 
    : neo4jEntitiesResult[0]?.count || 0;
  const neo4jRelTotal = typeof neo4jRelsResult[0]?.count === 'object'
    ? (neo4jRelsResult[0]?.count as any).toNumber()
    : neo4jRelsResult[0]?.count || 0;

  let section = `## Section 11 — Postgres ↔ Neo4j Parity

### Summary

| Item | Postgres | Neo4j | Match |
|------|----------|-------|-------|
| Total Entities | ${pgEntityTotal} | ${neo4jEntityTotal} | ${pgEntityTotal === neo4jEntityTotal ? '✅' : '❌'} |
| Total Relationships | ${pgRelTotal} | ${neo4jRelTotal} | ${pgRelTotal === neo4jRelTotal ? '✅' : '❌'} |

### Entity Type Breakdown

| EntityType | Postgres | Neo4j | Match |
|------------|----------|-------|-------|
`;

  const neo4jEntityMap = new Map(
    neo4jEntityTypes.map(e => {
      const count = typeof e.count === 'object' ? (e.count as any).toNumber() : e.count;
      return [e.type, count];
    })
  );

  for (const e of pgEntityTypes) {
    const neo4jCount = neo4jEntityMap.get(e.entity_type) || 0;
    section += `| ${e.entity_type} | ${e.count} | ${neo4jCount} | ${e.count === neo4jCount ? '✅' : '❌'} |\n`;
  }

  section += `\n### Key Relationship Breakdown

| RelType | Postgres | Neo4j | Match |
|---------|----------|-------|-------|
`;

  const neo4jRelMap = new Map(
    neo4jRelTypes.map(r => {
      const count = typeof r.count === 'object' ? (r.count as any).toNumber() : r.count;
      return [r.type, count];
    })
  );

  const keyRels = ['R21', 'R22', 'R23', 'R26', 'R14', 'R18', 'R19'];
  for (const rel of keyRels) {
    const pgCount = pgRelTypes.find(r => r.relationship_type === rel)?.count || 0;
    const neo4jCount = neo4jRelMap.get(rel) || 0;
    section += `| ${rel} | ${pgCount} | ${neo4jCount} | ${pgCount === neo4jCount ? '✅' : '❌'} |\n`;
  }

  section += '\n';
  return section;
}

// -----------------------------------------------------------------------------
// Section 12: Final Verdict
// -----------------------------------------------------------------------------

async function generateSection12(sections: string[]): Promise<string> {
  // Count defects from all sections
  const allContent = sections.join('\n');
  const failMatches = allContent.match(/❌ (Fail|DEFECT)/g) || [];
  const defectCount = failMatches.length;

  const verdict = defectCount === 0 ? 'PASS' : 'FAIL';

  let section = `## Section 12 — Final Verdict

| Metric | Value |
|--------|-------|
| Total Sections | 11 |
| Defects Found | ${defectCount} |
| Verdict | **${verdict}** |

`;

  if (defectCount > 0) {
    section += `### Defects

The following sections contain failures (search for "❌"):\n\n`;
    
    // List sections with failures
    for (let i = 1; i <= 11; i++) {
      const sectionContent = sections[i] || '';
      if (sectionContent.includes('❌')) {
        section += `- Section ${i}\n`;
      }
    }
  } else {
    section += `All coverage checks passed. Track A through A4 is complete.\n`;
  }

  section += '\n';
  return section;
}

// -----------------------------------------------------------------------------
// Main
// -----------------------------------------------------------------------------

async function main() {
  console.log('A1-A4 Coverage Report Generator');
  console.log('================================');
  console.log(`Project ID: ${CANONICAL_PROJECT_ID}`);
  console.log(`Phase: ${PHASE}`);
  console.log('');

  initConnections();

  try {
    console.log('Generating sections...');
    
    const sections: string[] = [];
    
    console.log('  Section 0: Canonical Context');
    sections[0] = await generateSection0();
    
    console.log('  Section 1: Entity Type Coverage');
    sections[1] = await generateSection1();
    
    console.log('  Section 2: BRD Universe Coverage');
    sections[2] = await generateSection2();
    
    console.log('  Section 3: Relationship Type Coverage');
    sections[3] = await generateSection3();
    
    console.log('  Section 4: Evidence Anchor Coverage');
    sections[4] = await generateSection4();
    
    console.log('  Section 5: Referential Integrity Coverage');
    sections[5] = await generateSection5();
    
    console.log('  Section 6: Acceptance Criteria Coverage');
    sections[6] = await generateSection6();
    
    console.log('  Section 7: Technical Design Coverage');
    sections[7] = await generateSection7();
    
    console.log('  Section 8: Marker Governance Coverage');
    sections[8] = await generateSection8();
    
    console.log('  Section 9: Ledger Coverage');
    sections[9] = await generateSection9();
    
    console.log('  Section 10: Epoch Coverage');
    sections[10] = await generateSection10();
    
    console.log('  Section 11: Postgres ↔ Neo4j Parity');
    sections[11] = await generateSection11();
    
    console.log('  Section 12: Final Verdict');
    sections[12] = await generateSection12(sections);

    // Generate header
    const today = new Date().toISOString().split('T')[0];
    const header = `# A1-A4 Coverage Report

**Date:** ${today}  
**Project:** ${CANONICAL_PROJECT_ID}  
**Phase:** ${PHASE}  
**Generated By:** \`scripts/verification/a1-a4-coverage-report.ts\`

---

`;

    // Assemble report
    const report = header + sections.join('---\n\n');

    // Write report
    const outputPath = path.resolve(process.cwd(), OUTPUT_DIR, `A1_A4_COVERAGE_REPORT_${today}.md`);
    fs.writeFileSync(outputPath, report);
    console.log('');
    console.log(`Report written to: ${outputPath}`);

    // Print to console as well
    console.log('');
    console.log('='.repeat(80));
    console.log(report);

  } finally {
    await closeConnections();
  }
}

main().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});

