// src/extraction/providers/ast-provider.ts
// @implements STORY-64.1
// @satisfies AC-64.1.6, AC-64.1.8
// @tdd TDD-A1-ENTITY-REGISTRY
// AST extraction provider - parses TypeScript files
// E08 DataSchema, E12 Function, E13 Class, E28 TestSuite, E29 TestCase
// NOTE: E15 Module is derived by module-derivation-provider.ts, NOT from imports

import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';
import * as ts from 'typescript';
import type { ExtractionProvider, RepoSnapshot, ExtractionResult, ExtractedEntity } from '../types.js';
import { createEvidenceAnchor } from '../evidence.js';
import { captureCorrectSignal, captureIncorrectSignal } from '../../ledger/semantic-corpus.js';

/**
 * AST Provider - extracts entities from TypeScript AST.
 * 
 * Entities extracted:
 * - E08 DataSchema: from interface/type definitions in schema files
 * - E12 Function: from function declarations
 * - E13 Class: from class declarations
 * - E15 Module: from import statements
 * - E28 TestSuite: from describe() blocks in test files
 * - E29 TestCase: from it() blocks in test files
 * 
 * Note: E14 Interface is deferred to post-Track A.
 */
export class ASTProvider implements ExtractionProvider {
  name = 'ast-provider';

  supports(fileType: string): boolean {
    return ['ts', 'tsx'].includes(fileType);
  }

  async extract(snapshot: RepoSnapshot): Promise<ExtractionResult> {
    const rootPath = snapshot.root_path;
    const entities: ExtractedEntity[] = [];

    // Extract from source files
    const sourceFiles = await glob('src/**/*.ts', { cwd: rootPath, nodir: true });
    for (const file of sourceFiles) {
      const fullPath = path.join(rootPath, file);
      const fileEntities = await this.extractFromFile(fullPath, file);
      entities.push(...fileEntities);
    }

    // Extract from test files (E28 TestSuite, E29 TestCase)
    const testFiles = await glob('test/**/*.test.ts', { cwd: rootPath, nodir: true });
    for (const file of testFiles) {
      const fullPath = path.join(rootPath, file);
      const testEntities = await this.extractTestEntities(fullPath, file);
      entities.push(...testEntities);
    }

    return { entities, relationships: [], evidence: [] };
  }

  /**
   * Extract entities from a single source file.
   */
  private async extractFromFile(fullPath: string, relativePath: string): Promise<ExtractedEntity[]> {
    const entities: ExtractedEntity[] = [];

    let content: string;
    try {
      content = await fs.readFile(fullPath, 'utf8');
    } catch {
      return entities;
    }

    const sourceFile = ts.createSourceFile(
      relativePath,
      content,
      ts.ScriptTarget.Latest,
      true
    );

    const lines = content.split('\n');

    // Walk the AST
    const visit = (node: ts.Node) => {
      // E12: Extract Functions
      if (ts.isFunctionDeclaration(node) && node.name) {
        const name = node.name.text;
        const startLine = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
        const endLine = sourceFile.getLineAndCharacterOfPosition(node.getEnd()).line + 1;
        const instanceId = `FUNC-${relativePath}:${name}`;

        entities.push({
          entity_type: 'E12',
          instance_id: instanceId,
          name,
          attributes: {
            file_id: `FILE-${relativePath}`,
            visibility: this.hasExportModifier(node) ? 'export' : 'private',
            is_async: this.hasAsyncModifier(node),
            parameters: this.getParameterNames(node),
          },
          source_file: fullPath,
          line_start: startLine,
          line_end: endLine,
        });

        captureCorrectSignal('E12', instanceId, { name }).catch(() => {});
      }

      // E13: Extract Classes
      if (ts.isClassDeclaration(node) && node.name) {
        const name = node.name.text;
        const startLine = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
        const endLine = sourceFile.getLineAndCharacterOfPosition(node.getEnd()).line + 1;
        const instanceId = `CLASS-${relativePath}:${name}`;

        entities.push({
          entity_type: 'E13',
          instance_id: instanceId,
          name,
          attributes: {
            file_id: `FILE-${relativePath}`,
            visibility: this.hasExportModifier(node) ? 'export' : 'private',
            extends: this.getExtendsClause(node),
            implements: this.getImplementsClause(node),
          },
          source_file: fullPath,
          line_start: startLine,
          line_end: endLine,
        });

        captureCorrectSignal('E13', instanceId, { name }).catch(() => {});
      }

      // E08: Extract DataSchema (interfaces/types in schema files)
      if (relativePath.includes('schema') && (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node))) {
        const name = node.name.text;
        const startLine = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
        const endLine = sourceFile.getLineAndCharacterOfPosition(node.getEnd()).line + 1;
        const instanceId = `SCHEMA-${name}`;

        entities.push({
          entity_type: 'E08',
          instance_id: instanceId,
          name,
          attributes: {
            file_id: `FILE-${relativePath}`,
            kind: ts.isInterfaceDeclaration(node) ? 'interface' : 'type',
            visibility: this.hasExportModifier(node) ? 'export' : 'private',
          },
          source_file: fullPath,
          line_start: startLine,
          line_end: endLine,
        });

        captureCorrectSignal('E08', instanceId, { name }).catch(() => {});
      }

      // NOTE: E15 Module extraction removed - E15 must be directory-based only
      // Use module-derivation-provider.ts to derive E15 from E11 SourceFile directories

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return entities;
  }

  /**
   * Extract test entities (E28 TestSuite, E29 TestCase) from test files.
   */
  private async extractTestEntities(fullPath: string, relativePath: string): Promise<ExtractedEntity[]> {
    const entities: ExtractedEntity[] = [];

    let content: string;
    try {
      content = await fs.readFile(fullPath, 'utf8');
    } catch {
      return entities;
    }

    const sourceFile = ts.createSourceFile(
      relativePath,
      content,
      ts.ScriptTarget.Latest,
      true
    );

    // Track current describe block for nesting
    let currentSuite: string | null = null;

    const visit = (node: ts.Node) => {
      // E28: Extract TestSuite from describe() calls
      if (ts.isCallExpression(node)) {
        const expression = node.expression;
        
        if (ts.isIdentifier(expression)) {
          const fnName = expression.text;
          
          // describe() or it()
          if (fnName === 'describe' && node.arguments.length >= 1) {
            const firstArg = node.arguments[0];
            if (ts.isStringLiteral(firstArg)) {
              const suiteName = firstArg.text;
              const startLine = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
              const endLine = sourceFile.getLineAndCharacterOfPosition(node.getEnd()).line + 1;
              const instanceId = `TSTS-${suiteName.replace(/[^a-zA-Z0-9]/g, '-')}`;

              entities.push({
                entity_type: 'E28',
                instance_id: instanceId,
                name: suiteName,
                attributes: {
                  test_file_id: `TSTF-${relativePath}`,
                  file_path: relativePath,
                },
                source_file: fullPath,
                line_start: startLine,
                line_end: endLine,
              });

              currentSuite = suiteName;
              captureCorrectSignal('E28', instanceId, { name: suiteName }).catch(() => {});
            }
          }

          // E29: Extract TestCase from it() calls
          if (fnName === 'it' && node.arguments.length >= 1) {
            const firstArg = node.arguments[0];
            if (ts.isStringLiteral(firstArg)) {
              const testName = firstArg.text;
              const startLine = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
              const endLine = sourceFile.getLineAndCharacterOfPosition(node.getEnd()).line + 1;
              const suitePrefix = currentSuite ? `${currentSuite.replace(/[^a-zA-Z0-9]/g, '-')}-` : '';
              const instanceId = `TC-${suitePrefix}${testName.replace(/[^a-zA-Z0-9]/g, '-')}`;

              entities.push({
                entity_type: 'E29',
                instance_id: instanceId,
                name: testName,
                attributes: {
                  test_file_id: `TSTF-${relativePath}`,
                  suite_name: currentSuite,
                  file_path: relativePath,
                },
                source_file: fullPath,
                line_start: startLine,
                line_end: endLine,
              });

              captureCorrectSignal('E29', instanceId, { name: testName }).catch(() => {});
            }
          }
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return entities;
  }

  // Helper methods

  private hasExportModifier(node: ts.Node): boolean {
    if (!ts.canHaveModifiers(node)) return false;
    const modifiers = ts.getModifiers(node);
    return modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword) ?? false;
  }

  private hasAsyncModifier(node: ts.Node): boolean {
    if (!ts.canHaveModifiers(node)) return false;
    const modifiers = ts.getModifiers(node);
    return modifiers?.some(m => m.kind === ts.SyntaxKind.AsyncKeyword) ?? false;
  }

  private getParameterNames(node: ts.FunctionDeclaration): string[] {
    return node.parameters.map(p => {
      if (ts.isIdentifier(p.name)) {
        return p.name.text;
      }
      return '<destructured>';
    });
  }

  private getExtendsClause(node: ts.ClassDeclaration): string | undefined {
    const heritage = node.heritageClauses?.find(h => h.token === ts.SyntaxKind.ExtendsKeyword);
    if (heritage && heritage.types.length > 0) {
      return heritage.types[0].expression.getText();
    }
    return undefined;
  }

  private getImplementsClause(node: ts.ClassDeclaration): string[] {
    const heritage = node.heritageClauses?.find(h => h.token === ts.SyntaxKind.ImplementsKeyword);
    if (heritage) {
      return heritage.types.map(t => t.expression.getText());
    }
    return [];
  }
}

// Export singleton instance
export const astProvider = new ASTProvider();
