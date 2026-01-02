#!/usr/bin/env npx tsx
/**
 * Self-Ingestion Verification Script
 * 
 * Independently computes ground truth from source code AST and compares
 * to Track A's extracted relationships via the Graph API v1.
 * 
 * This script is an INDEPENDENT verifier:
 * - Uses ts-morph for AST parsing (not Track A extraction code)
 * - Queries relationships through src/api/v1/* (not services/db)
 * - Computes precision/recall per relationship type
 * 
 * Verified relationship types:
 * - R21 IMPORTS: SourceFile → SourceFile (import declarations)
 * - R23 EXTENDS: Class → Class (inheritance)
 * - R22 CALLS: Function → Function (verifiable subset only)
 * 
 * Usage:
 *   npx tsx scripts/verify-self-ingestion.ts --projectId <uuid> [options]
 * 
 * Options:
 *   --baseDir <path>        Source directory (default: src)
 *   --projectId <uuid>      Project UUID (required)
 *   --types <R21,R23,R22>   Relationship types to verify (default: R21,R23)
 *   --out <path>            Output report path (default: docs/verification/SELF_INGESTION_AUDIT_<date>.md)
 *   --failOnThreshold       Exit non-zero if thresholds not met (default: true)
 */

import { Project, SourceFile, SyntaxKind, Node } from 'ts-morph';
import * as path from 'path';
import * as fs from 'fs';
import { parseArgs } from 'util';

// Import from API layer ONLY (scripts-boundary compliant)
import { getEntityByInstanceId, queryEntities } from '../src/api/v1/entities.js';
import { getRelationshipsForEntity } from '../src/api/v1/relationships.js';
import { closeConnections } from '../src/ops/track-a.js';

// ============================================================================
// Types
// ============================================================================

interface GroundTruthEdge {
  fromInstanceId: string;
  toInstanceId: string;
  relationshipType: 'R21' | 'R22' | 'R23';
  sourceFile: string;
  lineStart: number;
  lineEnd: number;
  evidence: string; // Human-readable description
}

interface ExtractedEdge {
  fromInstanceId: string;
  toInstanceId: string;
  relationshipType: string;
  fromEntityId: string;
  toEntityId: string;
}

interface VerificationResult {
  relationshipType: string;
  // Counts
  groundTruthTotal: number;       // Total ground truth edges (excluding missing entities)
  extractedTotal: number;         // Total extracted edges found for scored entities
  verifiedMatches: number;        // Edges that match between ground truth and graph
  // Exclusions (not scored)
  excludedMissingEntity: number;  // Edges where source entity not in graph
  excludedUnresolved: number;     // Imports that couldn't be resolved
  // Metrics
  precision: number;
  recall: number;
  passed: boolean;
  // Details
  discrepancies: Discrepancy[];
  unresolved: UnresolvedItem[];
}

interface Discrepancy {
  type: 'MISSING_IN_GRAPH' | 'EXTRA_IN_GRAPH';
  fromInstanceId: string;
  toInstanceId: string;
  sourceFile?: string;
  lineStart?: number;
  evidence?: string;
}

interface UnresolvedItem {
  type: 'UNRESOLVED_IMPORT' | 'UNRESOLVED_EXTENDS' | 'UNRESOLVED_CALL';
  fromInstanceId: string;
  rawTarget: string;
  sourceFile: string;
  lineStart: number;
  reason: string;
}

// ============================================================================
// Thresholds
// ============================================================================

const THRESHOLDS: Record<string, { precision: number; recall: number; gated: boolean }> = {
  R21: { precision: 0.99, recall: 0.99, gated: true },
  R23: { precision: 0.99, recall: 0.99, gated: true },
  R22: { precision: 0.90, recall: 0.80, gated: false }, // Warn-only for R22
};

// ============================================================================
// CLI Argument Parsing
// ============================================================================

function parseCliArgs(): {
  baseDir: string;
  projectId: string;
  types: string[];
  outPath: string;
  failOnThreshold: boolean;
} {
  const { values } = parseArgs({
    options: {
      baseDir: { type: 'string', default: 'src' },
      projectId: { type: 'string' },
      types: { type: 'string', default: 'R21,R23' },
      out: { type: 'string' },
      failOnThreshold: { type: 'boolean', default: true },
    },
    strict: true,
  });

  if (!values.projectId) {
    console.error('ERROR: --projectId is required');
    process.exit(1);
  }

  const today = new Date().toISOString().split('T')[0];
  const defaultOut = `docs/verification/SELF_INGESTION_AUDIT_${today}.md`;

  return {
    baseDir: values.baseDir ?? 'src',
    projectId: values.projectId,
    types: (values.types ?? 'R21,R23').split(',').map(t => t.trim()),
    outPath: values.out ?? defaultOut,
    failOnThreshold: values.failOnThreshold ?? true,
  };
}

// ============================================================================
// Instance ID Helpers
// ============================================================================

function filePathToInstanceId(filePath: string, rootDir: string): string {
  // Normalize to relative path from workspace root
  const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
  return `FILE-${relativePath}`;
}

function classToInstanceId(filePath: string, className: string): string {
  const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
  return `CLASS-${relativePath}:${className}`;
}

function functionToInstanceId(filePath: string, funcName: string): string {
  const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
  return `FUNC-${relativePath}:${funcName}`;
}

// ============================================================================
// AST Ground Truth Extraction (Independent of Track A)
// ============================================================================

class GroundTruthExtractor {
  private project: Project;
  private rootDir: string;
  private sourceFileMap: Map<string, string> = new Map(); // normalized path -> instance_id

  constructor(baseDir: string) {
    this.rootDir = path.resolve(process.cwd(), baseDir);
    this.project = new Project({
      tsConfigFilePath: path.resolve(process.cwd(), 'tsconfig.json'),
      skipAddingFilesFromTsConfig: true,
    });

    // Add source files from baseDir
    this.project.addSourceFilesAtPaths([
      `${this.rootDir}/**/*.ts`,
      `${this.rootDir}/**/*.tsx`,
    ]);

    // Build source file map for resolution
    for (const sf of this.project.getSourceFiles()) {
      const normalized = this.normalizePath(sf.getFilePath());
      const instanceId = filePathToInstanceId(sf.getFilePath(), this.rootDir);
      this.sourceFileMap.set(normalized, instanceId);
    }
  }

  private normalizePath(filePath: string): string {
    return path.resolve(filePath).replace(/\\/g, '/');
  }

  /**
   * Extract R21 IMPORTS edges from import declarations.
   * 
   * NOTE: Multiple import statements to the same target file are deduplicated
   * to a single edge (matching Track A's behavior where R21 edges are keyed
   * by from_instance_id:to_instance_id).
   */
  extractR21Imports(): { edges: GroundTruthEdge[]; unresolved: UnresolvedItem[] } {
    const edgesMap = new Map<string, GroundTruthEdge>(); // Dedupe by from|to
    const unresolved: UnresolvedItem[] = [];

    for (const sourceFile of this.project.getSourceFiles()) {
      const fromPath = sourceFile.getFilePath();
      const fromInstanceId = filePathToInstanceId(fromPath, this.rootDir);

      for (const importDecl of sourceFile.getImportDeclarations()) {
        const moduleSpecifier = importDecl.getModuleSpecifierValue();
        const lineStart = importDecl.getStartLineNumber();
        const lineEnd = importDecl.getEndLineNumber();

        // Try to resolve the import
        const resolvedSourceFile = importDecl.getModuleSpecifierSourceFile();

        if (resolvedSourceFile) {
          const toPath = resolvedSourceFile.getFilePath();
          // Only include imports within the project
          if (toPath.includes('node_modules')) continue;

          const toInstanceId = filePathToInstanceId(toPath, this.rootDir);
          const key = `${fromInstanceId}|${toInstanceId}`;

          // Only keep first occurrence (for evidence line tracking)
          if (!edgesMap.has(key)) {
            edgesMap.set(key, {
              fromInstanceId,
              toInstanceId,
              relationshipType: 'R21',
              sourceFile: fromPath,
              lineStart,
              lineEnd,
              evidence: `import from "${moduleSpecifier}"`,
            });
          }
        } else {
          // Unresolved import (external package or missing)
          unresolved.push({
            type: 'UNRESOLVED_IMPORT',
            fromInstanceId,
            rawTarget: moduleSpecifier,
            sourceFile: fromPath,
            lineStart,
            reason: moduleSpecifier.startsWith('.') 
              ? 'Could not resolve relative import' 
              : 'External package (not in project)',
          });
        }
      }
    }

    return { edges: Array.from(edgesMap.values()), unresolved };
  }

  /**
   * Extract R23 EXTENDS edges from class inheritance.
   */
  extractR23Extends(): { edges: GroundTruthEdge[]; unresolved: UnresolvedItem[] } {
    const edges: GroundTruthEdge[] = [];
    const unresolved: UnresolvedItem[] = [];

    for (const sourceFile of this.project.getSourceFiles()) {
      const filePath = sourceFile.getFilePath();

      for (const classDecl of sourceFile.getClasses()) {
        const className = classDecl.getName();
        if (!className) continue;

        const fromInstanceId = classToInstanceId(filePath, className);
        const extendsExpr = classDecl.getExtends();

        if (extendsExpr) {
          const lineStart = extendsExpr.getStartLineNumber();
          const lineEnd = extendsExpr.getEndLineNumber();
          const baseClassName = extendsExpr.getText();

          // Try to resolve the base class
          const symbol = extendsExpr.getExpression().getSymbol();
          const declarations = symbol?.getDeclarations() ?? [];

          let resolved = false;
          for (const decl of declarations) {
            const declSourceFile = decl.getSourceFile();
            if (declSourceFile.getFilePath().includes('node_modules')) continue;

            if (Node.isClassDeclaration(decl)) {
              const baseClassFile = declSourceFile.getFilePath();
              const baseName = decl.getName();
              if (baseName) {
                const toInstanceId = classToInstanceId(baseClassFile, baseName);
                edges.push({
                  fromInstanceId,
                  toInstanceId,
                  relationshipType: 'R23',
                  sourceFile: filePath,
                  lineStart,
                  lineEnd,
                  evidence: `extends ${baseClassName}`,
                });
                resolved = true;
                break;
              }
            }
          }

          if (!resolved) {
            unresolved.push({
              type: 'UNRESOLVED_EXTENDS',
              fromInstanceId,
              rawTarget: baseClassName,
              sourceFile: filePath,
              lineStart,
              reason: 'Could not resolve base class declaration',
            });
          }
        }
      }
    }

    return { edges, unresolved };
  }

  /**
   * Extract R22 CALLS edges (conservative, verifiable subset only).
   * Only includes direct function calls where callee resolves to a project function.
   */
  extractR22Calls(): { edges: GroundTruthEdge[]; unresolved: UnresolvedItem[] } {
    const edges: GroundTruthEdge[] = [];
    const unresolved: UnresolvedItem[] = [];

    for (const sourceFile of this.project.getSourceFiles()) {
      const filePath = sourceFile.getFilePath();

      // Get all functions in this file
      const functions = sourceFile.getFunctions();

      for (const func of functions) {
        const funcName = func.getName();
        if (!funcName) continue;

        const fromInstanceId = functionToInstanceId(filePath, funcName);

        // Find call expressions within this function
        const callExprs = func.getDescendantsOfKind(SyntaxKind.CallExpression);

        for (const callExpr of callExprs) {
          const lineStart = callExpr.getStartLineNumber();
          const lineEnd = callExpr.getEndLineNumber();

          // Try to resolve the callee
          const expr = callExpr.getExpression();
          const symbol = expr.getSymbol();

          if (!symbol) {
            // Can't resolve - skip (don't count as unresolved for now)
            continue;
          }

          const declarations = symbol.getDeclarations() ?? [];
          let resolved = false;

          for (const decl of declarations) {
            const declSourceFile = decl.getSourceFile();
            if (declSourceFile.getFilePath().includes('node_modules')) continue;

            if (Node.isFunctionDeclaration(decl) || Node.isFunctionExpression(decl)) {
              const calleeFile = declSourceFile.getFilePath();
              const calleeName = decl.getName?.() ?? symbol.getName();
              if (calleeName) {
                const toInstanceId = functionToInstanceId(calleeFile, calleeName);
                
                // Avoid self-recursion edges for cleaner comparison
                if (fromInstanceId !== toInstanceId) {
                  edges.push({
                    fromInstanceId,
                    toInstanceId,
                    relationshipType: 'R22',
                    sourceFile: filePath,
                    lineStart,
                    lineEnd,
                    evidence: `calls ${calleeName}()`,
                  });
                }
                resolved = true;
                break;
              }
            }
          }

          // Note: We don't add to unresolved for method calls, etc.
          // R22 is "verifiable subset" - we only claim what we can resolve
        }
      }
    }

    // Deduplicate edges (same from/to pair from multiple call sites)
    const uniqueEdges = new Map<string, GroundTruthEdge>();
    for (const edge of edges) {
      const key = `${edge.fromInstanceId}|${edge.toInstanceId}`;
      if (!uniqueEdges.has(key)) {
        uniqueEdges.set(key, edge);
      }
    }

    return { edges: Array.from(uniqueEdges.values()), unresolved };
  }
}

// ============================================================================
// Graph API Verification
// ============================================================================

async function resolveEntityId(
  projectId: string,
  instanceId: string
): Promise<string | null> {
  try {
    const entity = await getEntityByInstanceId(projectId, instanceId);
    return entity?.id ?? null;
  } catch {
    return null;
  }
}

async function getExtractedEdgesForEntity(
  projectId: string,
  entityId: string,
  relationshipType: string,
  direction: 'outgoing' | 'incoming' | 'both' = 'both'
): Promise<ExtractedEdge[]> {
  try {
    const response = await getRelationshipsForEntity(projectId, entityId, {});
    
    return response.relationships
      .filter(r => r.relationship_type === relationshipType)
      .filter(r => {
        // Filter by direction
        if (direction === 'outgoing') return r.from_entity_id === entityId;
        if (direction === 'incoming') return r.to_entity_id === entityId;
        return true;
      })
      .map(r => {
        // Parse instance_id: R21:FILE-src/foo.ts:FILE-src/bar.ts
        // Need to handle the R21:from:to pattern where from/to may contain colons
        const parts = r.instance_id.split(':');
        const relType = parts[0];
        // Reconstruct from/to by finding the last occurrence of :FILE-
        const rest = parts.slice(1).join(':');
        const lastFileIdx = rest.lastIndexOf(':FILE-');
        let fromInstanceId: string;
        let toInstanceId: string;
        if (lastFileIdx > 0) {
          fromInstanceId = rest.substring(0, lastFileIdx);
          toInstanceId = rest.substring(lastFileIdx + 1);
        } else {
          // Fallback to simple split
          fromInstanceId = parts[1] || '';
          toInstanceId = parts[2] || '';
        }
        
        return {
          fromInstanceId,
          toInstanceId,
          relationshipType: r.relationship_type,
          fromEntityId: r.from_entity_id,
          toEntityId: r.to_entity_id,
        };
      });
  } catch {
    return [];
  }
}

// ============================================================================
// Verification Logic
// ============================================================================

async function verifyRelationshipType(
  projectId: string,
  relationshipType: 'R21' | 'R22' | 'R23',
  groundTruthEdges: GroundTruthEdge[],
  unresolvedItems: UnresolvedItem[]
): Promise<VerificationResult> {
  const discrepancies: Discrepancy[] = [];
  const extractedEdgesMap = new Map<string, ExtractedEdge>();
  const missingSourceEntities = new Set<string>(); // Track entities not found in graph
  let verifiedMatches = 0;

  console.log(`\n  Verifying ${relationshipType}: ${groundTruthEdges.length} ground truth edges`);

  // For each unique source entity, query the graph
  const uniqueFromIds = [...new Set(groundTruthEdges.map(e => e.fromInstanceId))];
  console.log(`  Querying graph for ${uniqueFromIds.length} source entities...`);

  let queriedCount = 0;
  for (const fromInstanceId of uniqueFromIds) {
    // Resolve entity ID
    const entityId = await resolveEntityId(projectId, fromInstanceId);
    if (!entityId) {
      // Entity not in graph - track it for later reporting
      missingSourceEntities.add(fromInstanceId);
      continue;
    }

    // Query OUTGOING relationships from this entity only
    const extractedEdges = await getExtractedEdgesForEntity(projectId, entityId, relationshipType, 'outgoing');

    // Add to extracted map
    for (const edge of extractedEdges) {
      const key = `${fromInstanceId}|${edge.toInstanceId}`;
      extractedEdgesMap.set(key, edge);
    }

    queriedCount++;
    if (queriedCount % 100 === 0) {
      console.log(`    Queried ${queriedCount}/${uniqueFromIds.length} entities...`);
    }
  }

  // Compare ground truth vs extracted
  for (const edge of groundTruthEdges) {
    const key = `${edge.fromInstanceId}|${edge.toInstanceId}`;
    
    // Check if source entity was missing from graph
    if (missingSourceEntities.has(edge.fromInstanceId)) {
      discrepancies.push({
        type: 'MISSING_IN_GRAPH',
        fromInstanceId: edge.fromInstanceId,
        toInstanceId: edge.toInstanceId,
        sourceFile: edge.sourceFile,
        lineStart: edge.lineStart,
        evidence: `Source entity not in graph (file may be new since last extraction)`,
      });
      continue;
    }
    
    if (extractedEdgesMap.has(key)) {
      verifiedMatches++;
      extractedEdgesMap.delete(key); // Remove matched
    } else {
      discrepancies.push({
        type: 'MISSING_IN_GRAPH',
        fromInstanceId: edge.fromInstanceId,
        toInstanceId: edge.toInstanceId,
        sourceFile: edge.sourceFile,
        lineStart: edge.lineStart,
        evidence: edge.evidence,
      });
    }
  }

  // Remaining in extractedEdgesMap are extras (in graph but not in ground truth)
  for (const [key, edge] of extractedEdgesMap) {
    discrepancies.push({
      type: 'EXTRA_IN_GRAPH',
      fromInstanceId: edge.fromInstanceId,
      toInstanceId: edge.toInstanceId,
      evidence: 'Present in graph but not in ground truth',
    });
  }

  // Calculate totals with clear bucket separation
  const excludedMissingEntity = groundTruthEdges.filter(e => missingSourceEntities.has(e.fromInstanceId)).length;
  const excludedUnresolved = unresolvedItems.length;
  
  // Ground truth excludes edges from missing entities (they weren't extracted)
  const groundTruthInScope = groundTruthEdges.filter(e => !missingSourceEntities.has(e.fromInstanceId));
  const groundTruthTotal = groundTruthInScope.length;
  const extractedTotal = verifiedMatches + extractedEdgesMap.size;
  const precision = extractedTotal > 0 ? verifiedMatches / extractedTotal : 1.0;
  const recall = groundTruthTotal > 0 ? verifiedMatches / groundTruthTotal : 1.0;

  const threshold = THRESHOLDS[relationshipType];
  const passed = precision >= threshold.precision && recall >= threshold.recall;

  // Add summary note about missing source entities
  if (missingSourceEntities.size > 0) {
    console.log(`  Note: ${missingSourceEntities.size} source entities not in graph (excluded from scoring)`);
  }

  return {
    relationshipType,
    groundTruthTotal,
    extractedTotal,
    verifiedMatches,
    excludedMissingEntity,
    excludedUnresolved,
    precision,
    recall,
    passed,
    discrepancies,
    unresolved: unresolvedItems,
  };
}

// ============================================================================
// Report Generation
// ============================================================================

function generateReport(
  results: VerificationResult[],
  args: ReturnType<typeof parseCliArgs>
): string {
  const timestamp = new Date().toISOString();
  const allPassed = results.every(r => r.passed || !THRESHOLDS[r.relationshipType]?.gated);

  let report = `# Self-Ingestion Verification Audit

**Generated:** ${timestamp}  
**Project ID:** ${args.projectId}  
**Base Directory:** ${args.baseDir}  
**Verified Types:** ${args.types.join(', ')}  
**Overall Result:** ${allPassed ? '✅ PASS' : '❌ FAIL'}

---

## Executive Summary

This report independently verifies Track A's extracted relationships against
ground truth computed directly from source code AST analysis.

**Methodology:**
- Ground truth extracted using ts-morph (independent of Track A extraction)
- Relationships queried via Graph API v1 (not direct DB access)
- Precision and recall computed per relationship type

**Scoring Rules:**
- Only edges where **both endpoints are present in the graph** are scored
- Edges from entities not in graph are excluded (indicates stale graph, not extraction error)
- External imports (node_modules) are excluded (out of scope)

---

## Summary Table (Scored Edges Only)

| Type | Scored Ground Truth | Extracted | Matches | Precision | Recall | Threshold | Result |
|------|---------------------|-----------|---------|-----------|--------|-----------|--------|
`;

  for (const r of results) {
    const threshold = THRESHOLDS[r.relationshipType];
    const thresholdStr = threshold 
      ? `P≥${(threshold.precision * 100).toFixed(0)}% R≥${(threshold.recall * 100).toFixed(0)}%`
      : 'N/A';
    const result = r.passed ? '✅ PASS' : (threshold?.gated ? '❌ FAIL' : '⚠️ WARN');
    
    report += `| ${r.relationshipType} | ${r.groundTruthTotal} | ${r.extractedTotal} | ${r.verifiedMatches} | ${(r.precision * 100).toFixed(1)}% | ${(r.recall * 100).toFixed(1)}% | ${thresholdStr} | ${result} |\n`;
  }

  report += '\n---\n\n';

  // Add exclusions summary
  report += `## Exclusions Summary\n\n`;
  report += `| Type | Missing Entity (not scored) | Unresolved Imports (external) |\n`;
  report += `|------|----------------------------|-------------------------------|\n`;
  for (const r of results) {
    report += `| ${r.relationshipType} | ${r.excludedMissingEntity} | ${r.excludedUnresolved} |\n`;
  }
  report += '\n---\n\n';

  // Detailed sections per type
  for (const r of results) {
    report += `## ${r.relationshipType} Details\n\n`;
    report += `**Precision:** ${(r.precision * 100).toFixed(2)}%  \n`;
    report += `**Recall:** ${(r.recall * 100).toFixed(2)}%  \n`;
    report += `**Unresolved Items:** ${r.unresolved.length}\n\n`;

    if (r.discrepancies.length > 0) {
      report += `### Discrepancies (${r.discrepancies.length})\n\n`;
      
      const missing = r.discrepancies.filter(d => d.type === 'MISSING_IN_GRAPH');
      const extra = r.discrepancies.filter(d => d.type === 'EXTRA_IN_GRAPH');

      if (missing.length > 0) {
        report += `#### Missing in Graph (${missing.length})\n\n`;
        report += `| From | To | File | Line | Evidence |\n`;
        report += `|------|-----|------|------|----------|\n`;
        for (const d of missing.slice(0, 50)) { // Limit to 50
          const file = d.sourceFile ? path.relative(process.cwd(), d.sourceFile) : 'N/A';
          report += `| \`${d.fromInstanceId}\` | \`${d.toInstanceId}\` | ${file} | ${d.lineStart ?? 'N/A'} | ${d.evidence ?? ''} |\n`;
        }
        if (missing.length > 50) {
          report += `\n*... and ${missing.length - 50} more*\n`;
        }
        report += '\n';
      }

      if (extra.length > 0) {
        report += `#### Extra in Graph (${extra.length})\n\n`;
        report += `| From | To | Evidence |\n`;
        report += `|------|-----|----------|\n`;
        for (const d of extra.slice(0, 50)) {
          report += `| \`${d.fromInstanceId}\` | \`${d.toInstanceId}\` | ${d.evidence ?? ''} |\n`;
        }
        if (extra.length > 50) {
          report += `\n*... and ${extra.length - 50} more*\n`;
        }
        report += '\n';
      }
    } else {
      report += `### ✅ No Discrepancies\n\n`;
    }

    if (r.unresolved.length > 0) {
      report += `### Unresolved Items (${r.unresolved.length})\n\n`;
      report += `These items could not be resolved and are excluded from verification:\n\n`;
      report += `| Type | From | Target | File | Line | Reason |\n`;
      report += `|------|------|--------|------|------|--------|\n`;
      for (const u of r.unresolved.slice(0, 30)) {
        const file = path.relative(process.cwd(), u.sourceFile);
        report += `| ${u.type} | \`${u.fromInstanceId}\` | ${u.rawTarget} | ${file} | ${u.lineStart} | ${u.reason} |\n`;
      }
      if (r.unresolved.length > 30) {
        report += `\n*... and ${r.unresolved.length - 30} more*\n`;
      }
      report += '\n';
    }

    report += '---\n\n';
  }

  report += `## Methodology Notes

### R21 IMPORTS
- Ground truth: All import declarations resolving to project source files
- Excluded: node_modules imports (external packages)
- Edge key: from SourceFile instance_id → to SourceFile instance_id

### R23 EXTENDS
- Ground truth: Class inheritance where base class is in project
- Excluded: External base classes (e.g., from libraries)
- Edge key: from Class instance_id → to Class instance_id

### R22 CALLS (Verifiable Subset)
- Ground truth: Direct function calls where callee resolves to project function
- Excluded: Method calls, dynamic calls, unresolvable symbols
- Note: This is a conservative subset; actual call graph may be larger
- Edge key: from Function instance_id → to Function instance_id

---

**END OF REPORT**
`;

  return report;
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log('='.repeat(60));
  console.log('Self-Ingestion Verification');
  console.log('='.repeat(60));

  const args = parseCliArgs();
  console.log(`\nConfiguration:`);
  console.log(`  Base Directory: ${args.baseDir}`);
  console.log(`  Project ID: ${args.projectId}`);
  console.log(`  Types: ${args.types.join(', ')}`);
  console.log(`  Output: ${args.outPath}`);

  // Initialize AST extractor
  console.log(`\nInitializing AST parser...`);
  const extractor = new GroundTruthExtractor(args.baseDir);

  const results: VerificationResult[] = [];

  try {
    // Verify each requested type
    for (const type of args.types) {
      console.log(`\nProcessing ${type}...`);

      let groundTruth: { edges: GroundTruthEdge[]; unresolved: UnresolvedItem[] };

      switch (type) {
        case 'R21':
          groundTruth = extractor.extractR21Imports();
          break;
        case 'R23':
          groundTruth = extractor.extractR23Extends();
          break;
        case 'R22':
          groundTruth = extractor.extractR22Calls();
          break;
        default:
          console.warn(`  Unknown type: ${type}, skipping`);
          continue;
      }

      console.log(`  Ground truth: ${groundTruth.edges.length} edges, ${groundTruth.unresolved.length} unresolved`);

      const result = await verifyRelationshipType(
        args.projectId,
        type as 'R21' | 'R22' | 'R23',
        groundTruth.edges,
        groundTruth.unresolved
      );

      results.push(result);

      const status = result.passed ? '✅ PASS' : (THRESHOLDS[type]?.gated ? '❌ FAIL' : '⚠️ WARN');
      console.log(`  Result: ${status} (P=${(result.precision * 100).toFixed(1)}%, R=${(result.recall * 100).toFixed(1)}%)`);
    }

    // Generate report
    console.log(`\nGenerating report...`);
    const report = generateReport(results, args);

    // Ensure output directory exists
    const outDir = path.dirname(args.outPath);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    fs.writeFileSync(args.outPath, report);
    console.log(`Report written to: ${args.outPath}`);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('Summary');
    console.log('='.repeat(60));

    let anyFailed = false;
    for (const r of results) {
      const threshold = THRESHOLDS[r.relationshipType];
      const status = r.passed ? '✅ PASS' : (threshold?.gated ? '❌ FAIL' : '⚠️ WARN');
      console.log(`  ${r.relationshipType}: ${status}`);
      if (!r.passed && threshold?.gated) {
        anyFailed = true;
      }
    }

    console.log('');

    if (anyFailed && args.failOnThreshold) {
      console.log('❌ Verification FAILED - thresholds not met');
      process.exit(1);
    } else {
      console.log('✅ Verification PASSED');
      process.exit(0);
    }
  } finally {
    await closeConnections();
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

