// src/extraction/providers/ast-relationship-provider.ts
// @implements STORY-64.4
// @satisfies AC-64.4.1
// @satisfies AC-64.4.2
// @satisfies AC-64.4.3
// @tdd TDD-A4-STRUCTURAL-ANALYSIS
//
// AST Relationship Provider - derives structural relationships from code AST
// R21 IMPORTS: SourceFile → SourceFile
// R22 CALLS: Function → Function
// R23 EXTENDS: Class → Class
// R26 DEPENDS_ON: Module → Module
//
// Note: R24 IMPLEMENTS_INTERFACE is out-of-scope (E14 Interface deferred)
//
// This provider MUST NOT import from src/db/* or src/services/*
// per G-API boundary rules.

import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';
import * as ts from 'typescript';
import type { ExtractedRelationship, RepoSnapshot, ExtractedEntity } from '../types.js';
import type { RelationshipTypeCode } from '../../schema/track-a/relationships.js';

/**
 * Input entity for relationship derivation.
 */
export interface EntityInput {
  entity_type: string;
  instance_id: string;
  name: string;
  source_file: string;
  line_start: number;
  line_end: number;
  attributes?: Record<string, unknown>;
}

/**
 * Result of AST relationship extraction.
 */
export interface AstRelationshipResult {
  r21: ExtractedRelationship[];  // IMPORTS
  r22: ExtractedRelationship[];  // CALLS
  r23: ExtractedRelationship[];  // EXTENDS
  r26: ExtractedRelationship[];  // DEPENDS_ON
}

/**
 * Derive R21 IMPORTS relationships from import statements.
 * 
 * R21: SourceFile → SourceFile (via import statements)
 * 
 * Pattern: FILE-path/to/file.ts → FILE-path/to/imported.ts
 */
export function deriveR21(
  sourceFiles: EntityInput[],
  snapshot: RepoSnapshot
): ExtractedRelationship[] {
  const relationships: ExtractedRelationship[] = [];
  const fileInstanceIds = new Set(sourceFiles.map(f => f.instance_id));
  
  // Build a map from relative path to instance_id
  const pathToInstanceId = new Map<string, string>();
  for (const file of sourceFiles) {
    // Extract path from instance_id (FILE-path/to/file.ts → path/to/file.ts)
    const filePath = file.instance_id.replace(/^FILE-/, '');
    pathToInstanceId.set(filePath, file.instance_id);
    // Also add without extension for fuzzy matching
    pathToInstanceId.set(filePath.replace(/\.[tj]sx?$/, ''), file.instance_id);
  }
  
  // Note: Actual import analysis requires reading file contents
  // This is a structural derivation that would be populated by the orchestrator
  // calling extractImportsFromFile for each source file
  
  return relationships;
}

/**
 * Extract imports from a single file.
 * Called by orchestrator for each source file.
 */
export async function extractImportsFromFile(
  filePath: string,
  relativePath: string,
  sourceFiles: EntityInput[]
): Promise<ExtractedRelationship[]> {
  const relationships: ExtractedRelationship[] = [];
  
  let content: string;
  try {
    content = await fs.readFile(filePath, 'utf8');
  } catch {
    return relationships;
  }
  
  const sourceFile = ts.createSourceFile(
    relativePath,
    content,
    ts.ScriptTarget.Latest,
    true
  );
  
  const fromInstanceId = `FILE-${relativePath}`;
  
  // Build lookup for existing source files
  const fileInstanceIds = new Set(sourceFiles.map(f => f.instance_id));
  
  const visit = (node: ts.Node) => {
    if (ts.isImportDeclaration(node)) {
      const moduleSpecifier = node.moduleSpecifier;
      if (ts.isStringLiteral(moduleSpecifier)) {
        const importPath = moduleSpecifier.text;
        
        // Only track relative imports (local files)
        if (importPath.startsWith('.')) {
          const resolvedPath = resolveImportPath(relativePath, importPath);
          const toInstanceId = `FILE-${resolvedPath}`;
          
          // Only create relationship if target file exists
          if (fileInstanceIds.has(toInstanceId)) {
            const startLine = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
            const endLine = sourceFile.getLineAndCharacterOfPosition(node.getEnd()).line + 1;
            
            relationships.push({
              relationship_type: 'R21',
              instance_id: `R21:${fromInstanceId}:${toInstanceId}`,
              name: 'IMPORTS',
              from_instance_id: fromInstanceId,
              to_instance_id: toInstanceId,
              confidence: 1.0,
              source_file: relativePath,
              line_start: startLine,
              line_end: endLine,
            });
          }
        }
      }
    }
    
    ts.forEachChild(node, visit);
  };
  
  visit(sourceFile);
  return relationships;
}

/**
 * Derive R22 CALLS relationships from function calls.
 * 
 * R22: Function → Function (via call expressions)
 */
export async function extractCallsFromFile(
  filePath: string,
  relativePath: string,
  functions: EntityInput[]
): Promise<ExtractedRelationship[]> {
  const relationships: ExtractedRelationship[] = [];
  
  let content: string;
  try {
    content = await fs.readFile(filePath, 'utf8');
  } catch {
    return relationships;
  }
  
  const sourceFile = ts.createSourceFile(
    relativePath,
    content,
    ts.ScriptTarget.Latest,
    true
  );
  
  // Build lookup for function names
  const functionNames = new Map<string, string>();
  for (const func of functions) {
    functionNames.set(func.name, func.instance_id);
  }
  
  // Track current function context
  let currentFunction: string | null = null;
  
  const visit = (node: ts.Node) => {
    // Enter function declaration
    if (ts.isFunctionDeclaration(node) && node.name) {
      currentFunction = `FUNC-${relativePath}:${node.name.text}`;
    }
    
    // Detect function calls
    if (currentFunction && ts.isCallExpression(node)) {
      const expression = node.expression;
      if (ts.isIdentifier(expression)) {
        const calledFn = expression.text;
        const toInstanceId = functionNames.get(calledFn);
        
        if (toInstanceId && toInstanceId !== currentFunction) {
          const startLine = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
          const endLine = sourceFile.getLineAndCharacterOfPosition(node.getEnd()).line + 1;
          
          relationships.push({
            relationship_type: 'R22',
            instance_id: `R22:${currentFunction}:${toInstanceId}`,
            name: 'CALLS',
            from_instance_id: currentFunction,
            to_instance_id: toInstanceId,
            confidence: 0.9, // Slightly lower confidence for call detection
            source_file: relativePath,
            line_start: startLine,
            line_end: endLine,
          });
        }
      }
    }
    
    ts.forEachChild(node, visit);
    
    // Exit function declaration
    if (ts.isFunctionDeclaration(node) && node.name) {
      currentFunction = null;
    }
  };
  
  visit(sourceFile);
  return relationships;
}

/**
 * Derive R23 EXTENDS relationships from class inheritance.
 * 
 * R23: Class → Class (via extends clause)
 */
export function deriveR23(classes: EntityInput[]): ExtractedRelationship[] {
  const relationships: ExtractedRelationship[] = [];
  
  // Build lookup for class names
  const classNames = new Map<string, EntityInput>();
  for (const cls of classes) {
    classNames.set(cls.name, cls);
  }
  
  for (const cls of classes) {
    const extendsName = cls.attributes?.extends as string | undefined;
    if (extendsName && classNames.has(extendsName)) {
      const parent = classNames.get(extendsName)!;
      
      relationships.push({
        relationship_type: 'R23',
        instance_id: `R23:${cls.instance_id}:${parent.instance_id}`,
        name: 'EXTENDS',
        from_instance_id: cls.instance_id,
        to_instance_id: parent.instance_id,
        confidence: 1.0,
        source_file: cls.source_file,
        line_start: cls.line_start,
        line_end: cls.line_end,
      });
    }
  }
  
  return relationships;
}

/**
 * Derive R26 DEPENDS_ON relationships from module dependencies.
 * 
 * R26: Module → Module (derived from R21 import relationships)
 */
export function deriveR26(
  modules: EntityInput[],
  r21Relationships: ExtractedRelationship[]
): ExtractedRelationship[] {
  const relationships: ExtractedRelationship[] = [];
  
  // Build module path map
  const modulePathMap = new Map<string, string>();
  for (const mod of modules) {
    // MOD-path/to/dir → path/to/dir
    const modPath = mod.instance_id.replace(/^MOD-/, '');
    modulePathMap.set(modPath, mod.instance_id);
  }
  
  // Get module for a file path
  const getModuleForFile = (fileInstanceId: string): string | null => {
    // FILE-path/to/file.ts → path/to
    const filePath = fileInstanceId.replace(/^FILE-/, '');
    const dirPath = path.dirname(filePath);
    
    // Try to find matching module
    for (const [modPath, modId] of modulePathMap) {
      if (dirPath === modPath || dirPath.startsWith(modPath + '/')) {
        return modId;
      }
    }
    return null;
  };
  
  // Derive module dependencies from file imports
  const moduleDeps = new Set<string>();
  
  for (const r21 of r21Relationships) {
    const fromModule = getModuleForFile(r21.from_instance_id);
    const toModule = getModuleForFile(r21.to_instance_id);
    
    if (fromModule && toModule && fromModule !== toModule) {
      const depKey = `${fromModule}:${toModule}`;
      if (!moduleDeps.has(depKey)) {
        moduleDeps.add(depKey);
        
        const fromMod = modules.find(m => m.instance_id === fromModule);
        
        relationships.push({
          relationship_type: 'R26',
          instance_id: `R26:${fromModule}:${toModule}`,
          name: 'DEPENDS_ON',
          from_instance_id: fromModule,
          to_instance_id: toModule,
          confidence: 1.0,
          source_file: fromMod?.source_file || '',
          line_start: fromMod?.line_start || 1,
          line_end: fromMod?.line_end || 1,
        });
      }
    }
  }
  
  return relationships;
}

/**
 * Resolve an import path relative to the importing file.
 */
function resolveImportPath(fromFile: string, importPath: string): string {
  const fromDir = path.dirname(fromFile);
  let resolved = path.join(fromDir, importPath);
  
  // Normalize path
  resolved = resolved.replace(/\\/g, '/');
  
  // Add .ts extension if not present
  if (!resolved.endsWith('.ts') && !resolved.endsWith('.js')) {
    resolved = resolved + '.ts';
  }
  
  // Handle .js imports that should be .ts
  if (resolved.endsWith('.js')) {
    resolved = resolved.replace(/\.js$/, '.ts');
  }
  
  return resolved;
}

/**
 * Extract all AST relationships for a project.
 * 
 * This is the main entry point called by the pipeline orchestrator.
 */
export async function extractAstRelationships(
  snapshot: RepoSnapshot,
  entities: EntityInput[]
): Promise<AstRelationshipResult> {
  const sourceFiles = entities.filter(e => e.entity_type === 'E11');
  const functions = entities.filter(e => e.entity_type === 'E12');
  const classes = entities.filter(e => e.entity_type === 'E13');
  const modules = entities.filter(e => e.entity_type === 'E15');
  
  const r21: ExtractedRelationship[] = [];
  const r22: ExtractedRelationship[] = [];
  
  // Extract R21 and R22 from each source file
  for (const file of sourceFiles) {
    const filePath = file.source_file || path.join(snapshot.root_path, file.instance_id.replace(/^FILE-/, ''));
    const relativePath = file.instance_id.replace(/^FILE-/, '');
    
    const imports = await extractImportsFromFile(filePath, relativePath, sourceFiles);
    r21.push(...imports);
    
    const calls = await extractCallsFromFile(filePath, relativePath, functions);
    r22.push(...calls);
  }
  
  // Derive R23 from class inheritance
  const r23 = deriveR23(classes);
  
  // Derive R26 from R21 module dependencies
  const r26 = deriveR26(modules, r21);
  
  return { r21, r22, r23, r26 };
}

/**
 * Flatten result into a single array.
 */
export function flattenAstRelationships(result: AstRelationshipResult): ExtractedRelationship[] {
  return [...result.r21, ...result.r22, ...result.r23, ...result.r26];
}

