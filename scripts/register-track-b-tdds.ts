#!/usr/bin/env npx tsx
// scripts/register-track-b-tdds.ts
// Track B TDD Registry - Registers TDD-TRACKB-B{n} as E06 nodes
// 
// Usage: PROJECT_ID=... npx tsx scripts/register-track-b-tdds.ts
//
// This script:
// 1. Parses spec/track_b/stories/B*.md for TDD frontmatter
// 2. Upserts E06 TechnicalDesign nodes via ops layer
// 3. Creates R14 IMPLEMENTED_BY edges (only when target file exists)
// 4. Writes evidence to docs/verification/track_b/TDD_REGISTRY_VERIFICATION.md
//
// TDD ID format: TDD-TRACKB-B{n} (e.g., TDD-TRACKB-B1)
// This conforms to ID_PATTERNS['E06'] = /^TDD-[\w.]+$/
//
// Guardrails:
// - Uses existing ops functions (no modification to locked surfaces)
// - Normalizes paths to match Track A E11 format
// - Only creates R14 when target file exists on disk
// - Does NOT create E11 nodes (let Track A extraction handle that)

import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'yaml';
import { persistEntities, persistRelationshipsAndSync, closeConnections } from '../src/ops/track-a.js';

// Derive types from ops layer function signatures (no extraction imports - boundary compliant)
type ExtractedEntity = Parameters<typeof persistEntities>[1][number];
type ExtractedRelationship = Parameters<typeof persistRelationshipsAndSync>[1][number];

// ============================================================
// CONFIGURATION
// ============================================================

const PROJECT_ID = process.env.PROJECT_ID;
if (!PROJECT_ID) {
  console.error('ERROR: PROJECT_ID environment variable required');
  console.error('Usage: PROJECT_ID=... npx tsx scripts/register-track-b-tdds.ts');
  process.exit(1);
}

const SPEC_DIR = path.resolve(process.cwd(), 'spec/track_b/stories');
const EVIDENCE_PATH = path.resolve(process.cwd(), 'docs/verification/track_b/TDD_REGISTRY_VERIFICATION.md');

// ============================================================
// TYPES
// ============================================================

interface TDDFrontmatter {
  id: string;
  type: string;
  version: string;
  status: string;
  implements?: {
    files?: string[];
  };
}

interface ParsedTDD {
  frontmatter: TDDFrontmatter;
  sourceFile: string;
  blockStart: number;
  blockEnd: number;
}

interface RegistryResult {
  e06Created: string[];
  e06Updated: string[];
  e06Noop: string[];
  r14Created: { from: string; to: string }[];
  r14Pending: { from: string; to: string; reason: string }[];
  errors: string[];
}

// ============================================================
// PATH NORMALIZATION (Guardrail #1)
// ============================================================

/**
 * Normalize a file path to match Track A E11 instance_id format.
 * - POSIX slashes
 * - No leading ./
 * - Relative to workspace root
 */
function normalizeFilePath(filePath: string): string {
  // Convert to POSIX slashes
  let normalized = filePath.replace(/\\/g, '/');
  
  // Remove leading ./
  if (normalized.startsWith('./')) {
    normalized = normalized.slice(2);
  }
  
  // Remove leading /
  if (normalized.startsWith('/')) {
    normalized = normalized.slice(1);
  }
  
  return normalized;
}

/**
 * Build E11 instance_id from file path (deterministic format)
 */
function buildE11InstanceId(filePath: string): string {
  return `FILE-${normalizeFilePath(filePath)}`;
}

/**
 * Build R14 instance_id from E06 and E11 instance_ids
 */
function buildR14InstanceId(fromId: string, toId: string): string {
  return `R14:${fromId}:${toId}`;
}

// ============================================================
// FRONTMATTER PARSING
// ============================================================

async function parseTDDFromFile(filePath: string): Promise<ParsedTDD | null> {
  const content = await fs.readFile(filePath, 'utf-8');
  const lines = content.split('\n');
  
  // Find frontmatter boundaries
  let blockStart = -1;
  let blockEnd = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      if (blockStart === -1) {
        blockStart = i;
      } else {
        blockEnd = i;
        break;
      }
    }
  }
  
  if (blockStart === -1 || blockEnd === -1) {
    return null; // No frontmatter
  }
  
  // Extract and parse YAML
  const frontmatterContent = lines.slice(blockStart + 1, blockEnd).join('\n');
  
  let parsed: Record<string, unknown>;
  try {
    parsed = yaml.parse(frontmatterContent);
  } catch {
    return null; // Invalid YAML
  }
  
  // Extract tdd block
  const tdd = parsed.tdd as Record<string, unknown> | undefined;
  if (!tdd || typeof tdd !== 'object' || !tdd.id) {
    return null; // No valid tdd block
  }
  
  const frontmatter: TDDFrontmatter = {
    id: String(tdd.id),
    type: String(tdd.type || 'TechnicalDesign'),
    version: String(tdd.version || '1.0.0'),
    status: String(tdd.status || 'planned'),
  };
  
  // Parse implements.files if present
  const implements_ = tdd.implements as Record<string, unknown[]> | undefined;
  if (implements_ && Array.isArray(implements_.files)) {
    frontmatter.implements = {
      files: implements_.files.map(f => String(f)),
    };
  }
  
  return {
    frontmatter,
    sourceFile: filePath,
    blockStart: blockStart + 1, // 1-indexed
    blockEnd: blockEnd + 1,     // 1-indexed
  };
}

// ============================================================
// DISCOVERY
// ============================================================

async function discoverTrackBTDDs(): Promise<ParsedTDD[]> {
  let files: string[];
  try {
    files = await fs.readdir(SPEC_DIR);
  } catch {
    console.error(`ERROR: Cannot read ${SPEC_DIR}`);
    return [];
  }
  
  const tdds: ParsedTDD[] = [];
  
  for (const file of files.sort()) {
    if (!file.startsWith('B') || !file.endsWith('.md')) continue;
    
    const filePath = path.join(SPEC_DIR, file);
    const tdd = await parseTDDFromFile(filePath);
    
    if (tdd) {
      tdds.push(tdd);
    }
  }
  
  return tdds;
}

// ============================================================
// ENTITY & RELATIONSHIP BUILDING
// ============================================================

function buildE06Entity(tdd: ParsedTDD): ExtractedEntity {
  // Get relative path from workspace root
  const relPath = path.relative(process.cwd(), tdd.sourceFile);
  
  // Generate name from TDD ID
  // TDD-TRACKB-B1 -> "Track B B1"
  // DESIGN-TRACKB-B1 -> "Track B B1" (legacy compatibility)
  let name = tdd.frontmatter.id;
  if (tdd.frontmatter.id.startsWith('TDD-TRACKB-')) {
    name = 'Track B ' + tdd.frontmatter.id.replace('TDD-TRACKB-', '');
  } else if (tdd.frontmatter.id.startsWith('DESIGN-TRACKB-')) {
    name = 'Track B ' + tdd.frontmatter.id.replace('DESIGN-TRACKB-', '');
  }
  
  return {
    entity_type: 'E06',
    instance_id: tdd.frontmatter.id,
    name,
    attributes: {
      version: tdd.frontmatter.version,
      status: tdd.frontmatter.status,
      type: tdd.frontmatter.type,
      implements_files: tdd.frontmatter.implements?.files || [],
    },
    source_file: normalizeFilePath(relPath),
    line_start: tdd.blockStart,
    line_end: tdd.blockEnd,
  };
}

async function buildR14Relationships(
  tdd: ParsedTDD
): Promise<{ created: ExtractedRelationship[]; pending: { to: string; reason: string }[] }> {
  const created: ExtractedRelationship[] = [];
  const pending: { to: string; reason: string }[] = [];
  
  const files = tdd.frontmatter.implements?.files || [];
  
  for (const file of files) {
    const normalizedPath = normalizeFilePath(file);
    const fullPath = path.resolve(process.cwd(), normalizedPath);
    
    // Guardrail #2: Only create R14 if target file exists
    try {
      await fs.access(fullPath);
    } catch {
      pending.push({ to: normalizedPath, reason: 'file not present on disk' });
      continue;
    }
    
    const toInstanceId = buildE11InstanceId(normalizedPath);
    const relPath = path.relative(process.cwd(), tdd.sourceFile);
    
    created.push({
      relationship_type: 'R14',
      instance_id: buildR14InstanceId(tdd.frontmatter.id, toInstanceId),
      name: `${tdd.frontmatter.id} IMPLEMENTED_BY ${normalizedPath}`,
      from_instance_id: tdd.frontmatter.id,
      to_instance_id: toInstanceId,
      confidence: 1.0,
      attributes: {
        source: 'TDD frontmatter implements.files',
      },
      source_file: normalizeFilePath(relPath),
      line_start: tdd.blockStart,
      line_end: tdd.blockEnd,
    });
  }
  
  return { created, pending };
}

// ============================================================
// EVIDENCE REPORT
// ============================================================

function generateEvidenceReport(result: RegistryResult): string {
  const timestamp = new Date().toISOString();
  const e06Total = result.e06Created.length + result.e06Updated.length;
  
  let report = `# Track B TDD Registry Verification

**Generated:** ${timestamp}  
**Project ID:** ${PROJECT_ID}

---

## Summary

| Metric | Count |
|--------|-------|
| E06 TechnicalDesign nodes created | ${result.e06Created.length} |
| E06 TechnicalDesign nodes updated | ${result.e06Updated.length} |
| E06 TechnicalDesign nodes no-op | ${result.e06Noop.length} |
| E06 total modified (created+updated) | ${e06Total} |
| R14 IMPLEMENTED_BY edges created | ${result.r14Created.length} |
| R14 edges pending (file not present) | ${result.r14Pending.length} |
| Errors | ${result.errors.length} |

---

## E06 TechnicalDesign Nodes Created

`;

  if (result.e06Created.length === 0) {
    report += '_None created_\n';
  } else {
    for (const id of result.e06Created) {
      report += `- \`${id}\`\n`;
    }
  }

  report += `
---

## E06 TechnicalDesign Nodes Updated

`;

  if (result.e06Updated.length === 0) {
    report += '_None updated_\n';
  } else {
    for (const id of result.e06Updated) {
      report += `- \`${id}\`\n`;
    }
  }

  report += `
---

## E06 TechnicalDesign Nodes No-Op

`;

  if (result.e06Noop.length === 0) {
    report += '_None (all were created or updated)_\n';
  } else {
    for (const id of result.e06Noop) {
      report += `- \`${id}\`\n`;
    }
  }

  report += `
---

## R14 IMPLEMENTED_BY Edges

`;

  if (result.r14Created.length === 0) {
    report += '_None created_\n';
  } else {
    report += '| From (E06) | To (E11) |\n';
    report += '|------------|----------|\n';
    for (const edge of result.r14Created) {
      report += `| \`${edge.from}\` | \`${edge.to}\` |\n`;
    }
  }

  report += `
---

## Pending R14 Edges (File Not Present)

`;

  if (result.r14Pending.length === 0) {
    report += '_None pending_\n';
  } else {
    report += '| From (E06) | To (path) | Reason |\n';
    report += '|------------|-----------|--------|\n';
    for (const edge of result.r14Pending) {
      report += `| \`${edge.from}\` | \`${edge.to}\` | ${edge.reason} |\n`;
    }
  }

  if (result.errors.length > 0) {
    report += `
---

## Errors

`;
    for (const error of result.errors) {
      report += `- ${error}\n`;
    }
  }

  report += `
---

## Legacy Note

Legacy \`DESIGN-TRACKB-*\` nodes may exist from prior runs; cleanup deferred post-HGR-2.

---

## Verification Commands

\`\`\`bash
# Re-run registry
PROJECT_ID=${PROJECT_ID} npx tsx scripts/register-track-b-tdds.ts

# Verify TDD nodes exist
# (implement verify:tdd-registry when ready)
\`\`\`
`;

  return report;
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log('Track B TDD Registry');
  console.log('====================');
  console.log(`Project ID: ${PROJECT_ID}`);
  console.log(`Spec dir: ${SPEC_DIR}`);
  console.log('');
  
  const result: RegistryResult = {
    e06Created: [],
    e06Updated: [],
    e06Noop: [],
    r14Created: [],
    r14Pending: [],
    errors: [],
  };
  
  // Discover TDDs
  console.log('Discovering Track B TDDs...');
  const tdds = await discoverTrackBTDDs();
  console.log(`Found ${tdds.length} TDDs`);
  console.log('');
  
  if (tdds.length === 0) {
    console.error('ERROR: No TDDs found');
    process.exit(1);
  }
  
  // Build E06 entities
  console.log('Building E06 entities...');
  const entities: ExtractedEntity[] = tdds.map(tdd => buildE06Entity(tdd));
  
  for (const entity of entities) {
    console.log(`  - ${entity.instance_id}`);
  }
  console.log('');
  
  // Persist E06 entities
  console.log('Persisting E06 entities...');
  try {
    const entityResults = await persistEntities(PROJECT_ID!, entities);
    
    // Categorize results by operation type
    for (let i = 0; i < entityResults.length; i++) {
      const res = entityResults[i];
      const instanceId = entities[i].instance_id;
      
      if (res.operation === 'CREATE') {
        result.e06Created.push(instanceId);
        console.log(`  + ${instanceId} (created)`);
      } else if (res.operation === 'UPDATE') {
        result.e06Updated.push(instanceId);
        console.log(`  ~ ${instanceId} (updated)`);
      } else {
        result.e06Noop.push(instanceId);
        console.log(`  = ${instanceId} (no-op)`);
      }
    }
    
    const counts = `${result.e06Created.length} created, ${result.e06Updated.length} updated, ${result.e06Noop.length} no-op`;
    console.log(`  Total: ${entityResults.length} entities (${counts})`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    result.errors.push(`E06 persistence failed: ${msg}`);
    console.error(`  ERROR: ${msg}`);
  }
  console.log('');
  
  // Build and persist R14 relationships
  console.log('Building R14 relationships...');
  const allRelationships: ExtractedRelationship[] = [];
  
  for (const tdd of tdds) {
    const { created, pending } = await buildR14Relationships(tdd);
    
    for (const rel of created) {
      allRelationships.push(rel);
      result.r14Created.push({ from: tdd.frontmatter.id, to: rel.to_instance_id });
      console.log(`  + ${tdd.frontmatter.id} → ${rel.to_instance_id}`);
    }
    
    for (const p of pending) {
      result.r14Pending.push({ from: tdd.frontmatter.id, to: p.to, reason: p.reason });
      console.log(`  ~ ${tdd.frontmatter.id} → ${p.to} (pending: ${p.reason})`);
    }
  }
  console.log('');
  
  if (allRelationships.length > 0) {
    console.log('Persisting R14 relationships...');
    try {
      const relResults = await persistRelationshipsAndSync(PROJECT_ID!, allRelationships);
      const created = relResults.results.filter(r => r.operation === 'CREATE').length;
      const updated = relResults.results.filter(r => r.operation === 'UPDATE').length;
      console.log(`  Persisted ${created + updated} relationships (${created} created, ${updated} updated)`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      result.errors.push(`R14 persistence failed: ${msg}`);
      console.error(`  ERROR: ${msg}`);
    }
  } else {
    console.log('No R14 relationships to persist (no implements.files with existing files)');
  }
  console.log('');
  
  // Generate evidence report
  console.log('Generating evidence report...');
  const report = generateEvidenceReport(result);
  
  // Ensure directory exists
  const evidenceDir = path.dirname(EVIDENCE_PATH);
  await fs.mkdir(evidenceDir, { recursive: true });
  
  await fs.writeFile(EVIDENCE_PATH, report, 'utf-8');
  console.log(`  Written to: ${EVIDENCE_PATH}`);
  console.log('');
  
  // Summary
  console.log('Summary');
  console.log('-------');
  console.log(`E06 created: ${result.e06Created.length}`);
  console.log(`E06 updated: ${result.e06Updated.length}`);
  console.log(`E06 no-op: ${result.e06Noop.length}`);
  console.log(`R14 created: ${result.r14Created.length}`);
  console.log(`R14 pending: ${result.r14Pending.length}`);
  console.log(`Errors: ${result.errors.length}`);
  
  if (result.errors.length > 0) {
    console.log('');
    console.error('ERRORS:');
    for (const error of result.errors) {
      console.error(`  - ${error}`);
    }
    await closeConnections();
    process.exit(1);
  }
  
  console.log('');
  console.log('✓ Track B TDD Registry complete');
  
  // Close connections to prevent script from hanging
  await closeConnections();
}

main().catch(async error => {
  console.error('FATAL:', error);
  await closeConnections();
  process.exit(1);
});

