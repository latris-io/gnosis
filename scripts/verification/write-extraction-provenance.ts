#!/usr/bin/env npx tsx
/**
 * Write Extraction Provenance
 * 
 * Generates docs/verification/track_b/EXTRACTION_PROVENANCE.md with current
 * git state, environment fingerprint, and extraction context.
 * 
 * This script is run after extraction to capture provenance for B.3 drift
 * snapshots and B.4 closure verification.
 * 
 * Usage:
 *   PROJECT_ID=<uuid> npx tsx scripts/verification/write-extraction-provenance.ts
 * 
 * Output:
 *   docs/verification/track_b/EXTRACTION_PROVENANCE.md
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import pg from 'pg';

const { Pool } = pg;

interface ProvenanceData {
  timestamp: string;
  gitSha: string;
  gitBranch: string;
  gitStatus: string;
  nodeVersion: string;
  npmVersion: string;
  governancePhase: string;
  projectId: string;
  entityCount: number;
  relationshipCount: number;
  e06FromExtraction: number;
  e06Total: number;
  runner: 'CI' | 'LOCAL';
}

function exec(cmd: string): string {
  try {
    return execSync(cmd, { encoding: 'utf-8' }).trim();
  } catch {
    return 'unknown';
  }
}

async function getDbCounts(projectId: string): Promise<{ entities: number; relationships: number; e06Extraction: number; e06Total: number }> {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  try {
    await pool.query(`SELECT set_config('app.current_project_id', $1, false)`, [projectId]);
    
    const entityResult = await pool.query('SELECT COUNT(*)::int AS c FROM entities');
    const relResult = await pool.query('SELECT COUNT(*)::int AS c FROM relationships');
    
    // E06 from extraction (TDD-A* patterns from Track A extraction)
    const e06ExtractionResult = await pool.query(`
      SELECT COUNT(*)::int AS c FROM entities 
      WHERE entity_type = 'E06' AND instance_id LIKE 'TDD-A%'
    `);
    
    // E06 total (includes Track B TDD-TRACKB-* from registry)
    const e06TotalResult = await pool.query(`
      SELECT COUNT(*)::int AS c FROM entities 
      WHERE entity_type = 'E06'
    `);

    return {
      entities: entityResult.rows[0].c,
      relationships: relResult.rows[0].c,
      e06Extraction: e06ExtractionResult.rows[0].c,
      e06Total: e06TotalResult.rows[0].c,
    };
  } finally {
    await pool.end();
  }
}

function generateMarkdown(data: ProvenanceData): string {
  return `# Track B Extraction Provenance

**Purpose:** Capture the exact extraction/derivation commands and outputs used to build the graph state for B.1 verification and future closure (B.4).

**Generated:** ${data.timestamp}  
**Runner:** ${data.runner}

---

## Git State (Provenance Anchor)

| Field | Value |
|-------|-------|
| **Commit SHA** | \`${data.gitSha}\` |
| **Branch** | \`${data.gitBranch}\` |
| **Working Tree** | ${data.gitStatus === '' ? 'Clean (no uncommitted changes)' : 'Dirty (uncommitted changes)'} |

\`\`\`bash
$ git rev-parse HEAD
${data.gitSha}

$ git status --porcelain
${data.gitStatus || '# (empty - clean working tree)'}
\`\`\`

---

## Environment Fingerprint

| Component | Version / Target |
|-----------|------------------|
| Node.js | ${data.nodeVersion} |
| npm | ${data.npmVersion} |
| GOVERNANCE_PHASE | ${data.governancePhase} |
| Database | Remote PostgreSQL (prod cluster via DATABASE_URL) |
| Neo4j | Remote AuraDB (prod instance via NEO4J_URL) |
| Project ID | \`${data.projectId}\` |

**Note:** Database URLs are secrets; only cluster/instance type is recorded here for provenance.

---

## Extraction Command

\`\`\`bash
PROJECT_ID=${data.projectId} npx tsx scripts/run-a1-extraction.ts
\`\`\`

**This command covers steps 1–4 of the baseline definition:**
1. Entity extraction (providers)
2. E15 module derivation
3. Containment derivation (R04-R07, R16)
4. Track A TDD registry (via \`tdd-frontmatter-provider\`)

---

## Graph State After Extraction

| Metric | Count |
|--------|-------|
| Total Entities | ${data.entityCount} |
| Total Relationships | ${data.relationshipCount} |
| E06 from Extraction (TDD-A*) | ${data.e06FromExtraction} |
| E06 Total (incl. Track B registry) | ${data.e06Total} |

---

## Baseline Definition

The "baseline" for B.1 ground truth and B.4 closure is the state produced by:

1. \`npx tsx scripts/run-a1-extraction.ts\` — entities + derivations
2. \`npx tsx scripts/register-track-b-tdds.ts\` — Track B E06 + R14 (if run)

This provenance file is regenerated each time extraction runs (in CI or locally).

---

## Related Documents

- \`docs/verification/track_b/B1_GROUND_TRUTH_EVIDENCE.md\` — B.1 health check evidence
- \`docs/verification/track_b/TDD_REGISTRY_VERIFICATION.md\` — Track B TDD registry evidence
- \`docs/verification/track_b/EXECUTION_PATHS_INVENTORY.md\` — Script inventory and governance
`;
}

async function main() {
  const projectId = process.env.PROJECT_ID;
  if (!projectId) {
    console.error('ERROR: PROJECT_ID required');
    process.exit(1);
  }

  console.log('Generating extraction provenance...');

  const data: ProvenanceData = {
    timestamp: new Date().toISOString(),
    gitSha: exec('git rev-parse HEAD'),
    gitBranch: exec('git rev-parse --abbrev-ref HEAD'),
    gitStatus: exec('git status --porcelain'),
    nodeVersion: process.version,
    npmVersion: exec('npm --version'),
    governancePhase: process.env.GOVERNANCE_PHASE || '1',
    projectId,
    entityCount: 0,
    relationshipCount: 0,
    e06FromExtraction: 0,
    e06Total: 0,
    runner: process.env.CI ? 'CI' : 'LOCAL',
  };

  // Get DB counts
  try {
    const counts = await getDbCounts(projectId);
    data.entityCount = counts.entities;
    data.relationshipCount = counts.relationships;
    data.e06FromExtraction = counts.e06Extraction;
    data.e06Total = counts.e06Total;
  } catch (err) {
    console.warn('Warning: Could not fetch DB counts:', err);
  }

  const markdown = generateMarkdown(data);
  
  const outputPath = path.join(process.cwd(), 'docs/verification/track_b/EXTRACTION_PROVENANCE.md');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, markdown);

  console.log(`✓ Extraction provenance written to: ${outputPath}`);
  console.log(`  Git SHA: ${data.gitSha}`);
  console.log(`  Entities: ${data.entityCount}`);
  console.log(`  Relationships: ${data.relationshipCount}`);
  console.log(`  Runner: ${data.runner}`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

