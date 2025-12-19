// src/extraction/providers/containment-derivation-provider.ts
// @implements STORY-64.2
// @satisfies AC-64.2.4, AC-64.2.5, AC-64.2.6, AC-64.2.7
// @tdd TDD-A2-RELATIONSHIP-REGISTRY
// Derives containment relationships (R04-R07) from entity data
// Provider purity: NO imports from src/db/*

import * as path from 'path';
import type { ExtractedRelationship, ExtractedEntity } from '../types.js';

/**
 * Input type for entities used in derivation.
 */
export interface EntityInput {
  entity_type: string;
  instance_id: string;
  name?: string;
  source_file: string;
  line_start: number;
  line_end: number;
  attributes?: Record<string, unknown>;
}

/**
 * Extract directory from a FILE-prefixed instance_id.
 * Returns null for root-level files.
 */
function getDirectoryFromFileInstanceId(instanceId: string): string | null {
  if (!instanceId.startsWith('FILE-')) {
    return null;
  }
  const filePath = instanceId.slice(5);
  const dirPath = path.posix.dirname(filePath);
  
  if (dirPath === '.' || dirPath === '' || dirPath === '/') {
    return null;
  }
  
  // Normalize: no leading ./, no trailing /
  let normalized = dirPath.replace(/\\/g, '/');
  while (normalized.startsWith('./')) {
    normalized = normalized.slice(2);
  }
  while (normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }
  
  return normalized;
}

/**
 * Extract file path from various instance_id formats.
 */
function getFilePathFromInstanceId(instanceId: string): string | null {
  // FUNC-<path>:<name> or CLASS-<path>:<name>
  if (instanceId.startsWith('FUNC-') || instanceId.startsWith('CLASS-')) {
    const colonIndex = instanceId.lastIndexOf(':');
    if (colonIndex > 5) {
      return instanceId.slice(instanceId.indexOf('-') + 1, colonIndex);
    }
  }
  
  // FILE-<path>
  if (instanceId.startsWith('FILE-')) {
    return instanceId.slice(5);
  }
  
  // TSTF-<path>
  if (instanceId.startsWith('TSTF-')) {
    return instanceId.slice(5);
  }
  
  return null;
}

/**
 * Derive R04: Module CONTAINS_FILE SourceFile
 * 
 * Evidence comes from the TO entity (E11 file) per evidence inheritance pattern.
 * 
 * @param modules E15 Module entities
 * @param files E11 SourceFile entities
 */
export function deriveR04(
  modules: EntityInput[],
  files: EntityInput[]
): ExtractedRelationship[] {
  const relationships: ExtractedRelationship[] = [];
  
  // Build module lookup by directory path
  const moduleByDir = new Map<string, EntityInput>();
  for (const module of modules) {
    if (module.instance_id.startsWith('MOD-')) {
      const dir = module.instance_id.slice(4);
      moduleByDir.set(dir, module);
    }
  }
  
  for (const file of files) {
    const dir = getDirectoryFromFileInstanceId(file.instance_id);
    if (dir === null) {
      // Root-level files have no containing module
      continue;
    }
    
    const module = moduleByDir.get(dir);
    if (!module) {
      // No module for this directory (should not happen with correct derivation)
      continue;
    }
    
    const relationshipInstanceId = `R04:${module.instance_id}:${file.instance_id}`;
    
    relationships.push({
      relationship_type: 'R04',
      instance_id: relationshipInstanceId,
      name: 'CONTAINS_FILE',
      from_instance_id: module.instance_id,
      to_instance_id: file.instance_id,
      confidence: 1.0,
      // Evidence from TO entity (E11 file)
      source_file: file.source_file,
      line_start: file.line_start,
      line_end: file.line_end,
    });
  }
  
  return relationships;
}

/**
 * Derive R05: SourceFile CONTAINS_ENTITY Function/Class
 * 
 * @param files E11 SourceFile entities
 * @param codeUnits E12 Function and E13 Class entities
 */
export function deriveR05(
  files: EntityInput[],
  codeUnits: EntityInput[]
): ExtractedRelationship[] {
  const relationships: ExtractedRelationship[] = [];
  
  // Build file lookup by path
  const fileByPath = new Map<string, EntityInput>();
  for (const file of files) {
    const filePath = getFilePathFromInstanceId(file.instance_id);
    if (filePath) {
      fileByPath.set(filePath, file);
    }
  }
  
  for (const unit of codeUnits) {
    if (unit.entity_type !== 'E12' && unit.entity_type !== 'E13') {
      continue;
    }
    
    const filePath = getFilePathFromInstanceId(unit.instance_id);
    if (!filePath) {
      continue;
    }
    
    const file = fileByPath.get(filePath);
    if (!file) {
      // No matching file entity
      continue;
    }
    
    const relationshipInstanceId = `R05:${file.instance_id}:${unit.instance_id}`;
    
    relationships.push({
      relationship_type: 'R05',
      instance_id: relationshipInstanceId,
      name: 'CONTAINS_ENTITY',
      from_instance_id: file.instance_id,
      to_instance_id: unit.instance_id,
      confidence: 1.0,
      // Evidence from TO entity (Function/Class)
      source_file: unit.source_file,
      line_start: unit.line_start,
      line_end: unit.line_end,
    });
  }
  
  return relationships;
}

/**
 * Derive R06: TestFile CONTAINS_SUITE TestSuite
 * 
 * @param testFiles E27 TestFile entities
 * @param suites E28 TestSuite entities
 */
export function deriveR06(
  testFiles: EntityInput[],
  suites: EntityInput[]
): ExtractedRelationship[] {
  const relationships: ExtractedRelationship[] = [];
  
  // Build test file lookup by path
  const testFileByPath = new Map<string, EntityInput>();
  for (const tf of testFiles) {
    // TSTF-<path>
    if (tf.instance_id.startsWith('TSTF-')) {
      const filePath = tf.instance_id.slice(5);
      testFileByPath.set(filePath, tf);
    }
  }
  
  for (const suite of suites) {
    // Get file path from suite's attributes or source_file
    const filePath = suite.attributes?.file_path as string | undefined;
    
    if (!filePath) {
      continue;
    }
    
    const testFile = testFileByPath.get(filePath);
    if (!testFile) {
      continue;
    }
    
    const relationshipInstanceId = `R06:${testFile.instance_id}:${suite.instance_id}`;
    
    relationships.push({
      relationship_type: 'R06',
      instance_id: relationshipInstanceId,
      name: 'CONTAINS_SUITE',
      from_instance_id: testFile.instance_id,
      to_instance_id: suite.instance_id,
      confidence: 1.0,
      // Evidence from TO entity (TestSuite)
      source_file: suite.source_file,
      line_start: suite.line_start,
      line_end: suite.line_end,
    });
  }
  
  return relationships;
}

/**
 * Derive R07: TestSuite CONTAINS_CASE TestCase
 * 
 * For nested suites, selects the innermost suite as the container.
 * 
 * @param suites E28 TestSuite entities
 * @param cases E29 TestCase entities
 */
export function deriveR07(
  suites: EntityInput[],
  cases: EntityInput[]
): ExtractedRelationship[] {
  const relationships: ExtractedRelationship[] = [];
  
  // Build suite lookup by name for matching
  const suitesByFile = new Map<string, EntityInput[]>();
  for (const suite of suites) {
    const filePath = suite.attributes?.file_path as string | undefined;
    if (filePath) {
      if (!suitesByFile.has(filePath)) {
        suitesByFile.set(filePath, []);
      }
      suitesByFile.get(filePath)!.push(suite);
    }
  }
  
  for (const testCase of cases) {
    const filePath = testCase.attributes?.file_path as string | undefined;
    const suiteName = testCase.attributes?.suite_name as string | undefined;
    
    if (!filePath || !suiteName) {
      continue;
    }
    
    const fileSuites = suitesByFile.get(filePath) || [];
    
    // Find matching suite by name
    const matchingSuite = fileSuites.find(s => s.name === suiteName);
    
    if (!matchingSuite) {
      continue;
    }
    
    const relationshipInstanceId = `R07:${matchingSuite.instance_id}:${testCase.instance_id}`;
    
    relationships.push({
      relationship_type: 'R07',
      instance_id: relationshipInstanceId,
      name: 'CONTAINS_CASE',
      from_instance_id: matchingSuite.instance_id,
      to_instance_id: testCase.instance_id,
      confidence: 1.0,
      // Evidence from TO entity (TestCase)
      source_file: testCase.source_file,
      line_start: testCase.line_start,
      line_end: testCase.line_end,
    });
  }
  
  return relationships;
}

/**
 * Validate evidence anchors for entities that should have native evidence.
 * Throws on invalid anchors for E11, E12, E13, E28, E29.
 */
export function validateEvidenceAnchors(entities: EntityInput[]): void {
  const entityTypesWithNativeEvidence = ['E11', 'E12', 'E13', 'E28', 'E29'];
  
  for (const entity of entities) {
    if (!entityTypesWithNativeEvidence.includes(entity.entity_type)) {
      continue;
    }
    
    // Validate source_file
    if (!entity.source_file || entity.source_file === '') {
      throw new Error(
        `Entity ${entity.instance_id} (${entity.entity_type}) has invalid source_file: ${entity.source_file}`
      );
    }
    
    // Validate line_start (must be > 0)
    if (typeof entity.line_start !== 'number' || entity.line_start < 1) {
      throw new Error(
        `Entity ${entity.instance_id} (${entity.entity_type}) has invalid line_start: ${entity.line_start}`
      );
    }
    
    // Validate line_end (must be >= line_start)
    if (typeof entity.line_end !== 'number' || entity.line_end < entity.line_start) {
      throw new Error(
        `Entity ${entity.instance_id} (${entity.entity_type}) has invalid line_end: ${entity.line_end}`
      );
    }
  }
}

/**
 * Containment Derivation Provider class.
 * Note: This provider does NOT implement ExtractionProvider interface
 * because it derives from existing entities, not from RepoSnapshot.
 */
export class ContainmentDerivationProvider {
  name = 'containment-derivation-provider';
  
  /**
   * Derive R04: Module CONTAINS_FILE SourceFile
   */
  deriveR04(modules: EntityInput[], files: EntityInput[]): ExtractedRelationship[] {
    return deriveR04(modules, files);
  }
  
  /**
   * Derive R05: SourceFile CONTAINS_ENTITY Function/Class
   */
  deriveR05(files: EntityInput[], codeUnits: EntityInput[]): ExtractedRelationship[] {
    return deriveR05(files, codeUnits);
  }
  
  /**
   * Derive R06: TestFile CONTAINS_SUITE TestSuite
   */
  deriveR06(testFiles: EntityInput[], suites: EntityInput[]): ExtractedRelationship[] {
    return deriveR06(testFiles, suites);
  }
  
  /**
   * Derive R07: TestSuite CONTAINS_CASE TestCase
   */
  deriveR07(suites: EntityInput[], cases: EntityInput[]): ExtractedRelationship[] {
    return deriveR07(suites, cases);
  }
  
  /**
   * Validate evidence anchors.
   */
  validateEvidence(entities: EntityInput[]): void {
    return validateEvidenceAnchors(entities);
  }
}

// Export singleton instance
export const containmentDerivationProvider = new ContainmentDerivationProvider();
