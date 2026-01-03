/**
 * Operator Guard - Shared utilities for Tier 2 script governance
 * 
 * Provides:
 * - requireConfirmRepair(): Ensures --confirm-repair flag is present
 * - resolveProjectId(): Resolves PROJECT_ID from env or --project-id flag
 * - getGitSha(): Returns current git commit SHA
 * - getNodeVersion(): Returns Node.js version
 * - getEnvironmentFingerprint(): Returns environment metadata
 * - writeEvidenceMarkdown(): Writes evidence artifact to operator_runs/
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const EVIDENCE_DIR = 'docs/verification/track_b/operator_runs';

/**
 * Parse command line arguments into a simple key-value map.
 * Supports: --flag, --key=value, --key value
 */
export function parseArgs(argv: string[]): { flags: Set<string>; values: Map<string, string> } {
  const flags = new Set<string>();
  const values = new Map<string, string>();
  
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      if (arg.includes('=')) {
        const [key, val] = arg.slice(2).split('=', 2);
        values.set(key, val);
      } else {
        const key = arg.slice(2);
        const nextArg = argv[i + 1];
        if (nextArg && !nextArg.startsWith('--')) {
          values.set(key, nextArg);
          i++;
        } else {
          flags.add(key);
        }
      }
    }
  }
  
  return { flags, values };
}

/**
 * Require --confirm-repair flag or exit with error.
 */
export function requireConfirmRepair(scriptName: string): void {
  const { flags } = parseArgs(process.argv.slice(2));
  
  if (!flags.has('confirm-repair')) {
    console.error('╔════════════════════════════════════════════════════════════════╗');
    console.error('║  OPERATOR CONFIRMATION REQUIRED                                ║');
    console.error('╚════════════════════════════════════════════════════════════════╝');
    console.error('');
    console.error(`This script (${scriptName}) can mutate canonical graph state.`);
    console.error('');
    console.error('To proceed, re-run with: --confirm-repair');
    console.error('');
    console.error('Example:');
    console.error(`  PROJECT_ID=<uuid> npx tsx ${scriptName} --confirm-repair`);
    console.error('');
    process.exit(1);
  }
}

/**
 * Resolve PROJECT_ID from environment or --project-id flag.
 * Exits with error if neither is provided.
 */
export function resolveProjectId(): string {
  const { values } = parseArgs(process.argv.slice(2));
  
  // Prefer env var, then --project-id flag
  const projectId = process.env.PROJECT_ID || values.get('project-id');
  
  if (!projectId) {
    console.error('╔════════════════════════════════════════════════════════════════╗');
    console.error('║  PROJECT_ID REQUIRED                                           ║');
    console.error('╚════════════════════════════════════════════════════════════════╝');
    console.error('');
    console.error('Provide PROJECT_ID via environment variable or --project-id flag:');
    console.error('');
    console.error('  PROJECT_ID=<uuid> npx tsx <script> --confirm-repair');
    console.error('  npx tsx <script> --project-id=<uuid> --confirm-repair');
    console.error('');
    process.exit(1);
  }
  
  return projectId;
}

/**
 * Get current git commit SHA.
 */
export function getGitSha(): string {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
  } catch {
    return 'UNKNOWN';
  }
}

/**
 * Get short git SHA (8 chars).
 */
export function getGitShortSha(): string {
  return getGitSha().slice(0, 8);
}

/**
 * Get Node.js version.
 */
export function getNodeVersion(): string {
  return process.version;
}

/**
 * Get environment fingerprint for evidence.
 */
export function getEnvironmentFingerprint(): Record<string, string> {
  return {
    node_version: getNodeVersion(),
    governance_phase: process.env.GOVERNANCE_PHASE || 'UNSET',
    platform: process.platform,
    arch: process.arch,
  };
}

/**
 * Generate evidence file path.
 */
export function getEvidenceFilePath(scriptBasename: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const shortSha = getGitShortSha();
  const filename = `${scriptBasename}__${timestamp}__${shortSha}.md`;
  return path.join(EVIDENCE_DIR, filename);
}

/**
 * Evidence artifact structure.
 */
export interface EvidenceArtifact {
  scriptName: string;
  scriptArgs: string[];
  timestamp: string;
  gitSha: string;
  projectId: string;
  environment: Record<string, string>;
  beforeCounts?: StateSnapshot;
  afterCounts?: StateSnapshot;
  operations?: string[];
  errors?: string[];
  status: 'SUCCESS' | 'FAILED' | 'ABORTED';
}

/**
 * State snapshot (counts from PG and Neo4j).
 */
export interface StateSnapshot {
  postgres?: {
    entities: number;
    relationships: number;
    error?: string;
  };
  neo4j?: {
    entities: number;
    relationships: number;
    error?: string;
  };
}

/**
 * Format evidence as markdown.
 */
export function formatEvidenceMarkdown(evidence: EvidenceArtifact): string {
  const lines: string[] = [];
  
  lines.push(`# Operator Run Evidence: ${evidence.scriptName}`);
  lines.push('');
  lines.push(`**Generated:** ${evidence.timestamp}`);
  lines.push(`**Status:** ${evidence.status}`);
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## Context');
  lines.push('');
  lines.push(`| Field | Value |`);
  lines.push(`|-------|-------|`);
  lines.push(`| Script | \`${evidence.scriptName}\` |`);
  lines.push(`| Args | \`${evidence.scriptArgs.join(' ')}\` |`);
  lines.push(`| Git SHA | \`${evidence.gitSha}\` |`);
  lines.push(`| Project ID | \`${evidence.projectId}\` |`);
  lines.push('');
  lines.push('## Environment');
  lines.push('');
  lines.push('```json');
  lines.push(JSON.stringify(evidence.environment, null, 2));
  lines.push('```');
  lines.push('');
  
  if (evidence.beforeCounts) {
    lines.push('## Before State');
    lines.push('');
    lines.push('| Store | Entities | Relationships | Error |');
    lines.push('|-------|----------|---------------|-------|');
    if (evidence.beforeCounts.postgres) {
      const pg = evidence.beforeCounts.postgres;
      lines.push(`| PostgreSQL | ${pg.entities} | ${pg.relationships} | ${pg.error || '-'} |`);
    }
    if (evidence.beforeCounts.neo4j) {
      const neo = evidence.beforeCounts.neo4j;
      lines.push(`| Neo4j | ${neo.entities} | ${neo.relationships} | ${neo.error || '-'} |`);
    }
    lines.push('');
  }
  
  if (evidence.afterCounts) {
    lines.push('## After State');
    lines.push('');
    lines.push('| Store | Entities | Relationships | Error |');
    lines.push('|-------|----------|---------------|-------|');
    if (evidence.afterCounts.postgres) {
      const pg = evidence.afterCounts.postgres;
      lines.push(`| PostgreSQL | ${pg.entities} | ${pg.relationships} | ${pg.error || '-'} |`);
    }
    if (evidence.afterCounts.neo4j) {
      const neo = evidence.afterCounts.neo4j;
      lines.push(`| Neo4j | ${neo.entities} | ${neo.relationships} | ${neo.error || '-'} |`);
    }
    lines.push('');
  }
  
  if (evidence.operations && evidence.operations.length > 0) {
    lines.push('## Operations');
    lines.push('');
    for (const op of evidence.operations) {
      lines.push(`- ${op}`);
    }
    lines.push('');
  }
  
  if (evidence.errors && evidence.errors.length > 0) {
    lines.push('## Errors');
    lines.push('');
    lines.push('```');
    for (const err of evidence.errors) {
      lines.push(err);
    }
    lines.push('```');
    lines.push('');
  }
  
  return lines.join('\n');
}

/**
 * Write evidence artifact to operator_runs directory.
 */
export function writeEvidenceMarkdown(evidence: EvidenceArtifact): string {
  const scriptBasename = path.basename(evidence.scriptName, '.ts');
  const filePath = getEvidenceFilePath(scriptBasename);
  
  // Ensure directory exists
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  
  const content = formatEvidenceMarkdown(evidence);
  fs.writeFileSync(filePath, content, 'utf-8');
  
  console.log(`[EVIDENCE] Written to: ${filePath}`);
  return filePath;
}

/**
 * Create initial evidence artifact (call at script start).
 */
export function createEvidence(scriptName: string, projectId: string): EvidenceArtifact {
  return {
    scriptName,
    scriptArgs: process.argv.slice(2),
    timestamp: new Date().toISOString(),
    gitSha: getGitSha(),
    projectId,
    environment: getEnvironmentFingerprint(),
    operations: [],
    errors: [],
    status: 'ABORTED', // Default to aborted; caller sets SUCCESS or FAILED
  };
}

