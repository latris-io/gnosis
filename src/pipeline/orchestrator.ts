// src/pipeline/orchestrator.ts
// @implements STORY-64.4
// @tdd TDD-A4-STRUCTURAL-ANALYSIS
// NOTE: Infrastructure modules do not carry @satisfies markers.
// Only ast-relationship-provider.ts carries @satisfies AC-64.4.1/2/3.
//
// Pipeline Orchestrator - coordinates all extraction providers in dependency order.
// This is service-layer code; limited DB access is allowed per PROMPTS.md.

import { execSync } from 'child_process';
import type {
  PipelineConfig,
  PipelineResult,
  PipelineSnapshot,
  PipelineStage,
  StageResult,
  ExtractionStatistics,
  IntegrityResult,
  ChangeSet,
} from './types.js';
import { computeStatistics } from './statistics.js';
import { evaluateIntegrity } from './integrity.js';
import { IncrementalExtractor } from './incremental.js';
import { getProjectLedger, type DecisionType } from '../ledger/shadow-ledger.js';
import { startEpoch, completeEpoch, failEpoch, getCurrentEpoch } from '../ledger/epoch-service.js';
import {
  initProject,
  persistEntities,
  persistRelationshipsAndSync,
  extractAndPersistBrdRelationships,
  extractAndPersistMarkerRelationships,
  extractAndPersistTestRelationships,
  extractAndPersistModules,
  extractAndPersistContainmentRelationships,
  extractAndPersistTddRelationshipsR14Only,
  extractAndPersistGitRelationships,
  syncToNeo4j,
} from '../ops/track-a.js';
import { FilesystemProvider } from '../extraction/providers/filesystem-provider.js';
import { BRDProvider } from '../extraction/providers/brd-provider.js';
import { ASTProvider } from '../extraction/providers/ast-provider.js';
import { GitProvider } from '../extraction/providers/git-provider.js';
import { ChangeSetProvider } from '../extraction/providers/changeset-provider.js';
import {
  extractAstRelationships,
  flattenAstRelationships,
  type EntityInput,
} from '../extraction/providers/ast-relationship-provider.js';
import { getAllEntities } from '../api/v1/entities.js';

/**
 * Stage execution order - matches A4 story card v2.1.0
 */
const STAGE_ORDER: PipelineStage[] = [
  'SNAPSHOT',
  'FILESYSTEM',
  'BRD',
  'AST',
  'MODULE',
  'TEST',
  'GIT',
  'MARKERS',
  'BRD_REL',
  'CONTAINMENT_REL',
  'TDD_REL',
  'AST_REL',
  'TEST_REL',
  'GIT_REL',
  'VALIDATE',
];

/**
 * Pipeline Orchestrator - executes extraction providers in dependency order.
 */
export class PipelineOrchestrator {
  private incrementalExtractor: IncrementalExtractor;
  
  constructor() {
    this.incrementalExtractor = new IncrementalExtractor();
  }

  /**
   * Execute the full extraction pipeline.
   */
  async execute(config: PipelineConfig): Promise<PipelineResult> {
    const startTime = Date.now();
    const stages: StageResult[] = [];
    let pipelineSuccess = true;
    
    // Start epoch for this pipeline run
    let epochStarted = false;
    if (!getCurrentEpoch()) {
      await startEpoch(config.project_id);
      epochStarted = true;
    }
    
    // Create snapshot
    const snapshot = await this.createSnapshot(config);
    stages.push(this.createStageResult('SNAPSHOT', true, Date.now() - startTime, 0, 0));
    
    // Log pipeline start as DECISION entry
    const ledger = getProjectLedger(config.project_id);
    await ledger.logDecision({
      decision: 'PIPELINE_STARTED' as DecisionType,
      marker_type: 'pipeline',
      target_id: snapshot.id,
      source_entity_id: 'pipeline',
      source_file: config.repo_path,
      line_start: 1,
      line_end: 1,
      project_id: config.project_id,
    });
    
    try {
      // Execute stages in order
      for (const stage of STAGE_ORDER) {
        if (stage === 'SNAPSHOT') continue; // Already done
        if (config.skip_stages?.includes(stage)) continue;
        
        const stageStart = Date.now();
        
        try {
          const result = await this.executeStage(stage, snapshot, config);
          stages.push(result);
          
          if (!result.success) {
            pipelineSuccess = false;
            if (config.fail_fast) {
              break;
            }
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          stages.push(this.createStageResult(
            stage,
            false,
            Date.now() - stageStart,
            0,
            0,
            [errorMsg]
          ));
          
          pipelineSuccess = false;
          if (config.fail_fast) {
            break;
          }
        }
      }
      
      // Compute statistics
      const statistics = await computeStatistics(snapshot);
      
      // Evaluate integrity
      const integrity_check = await evaluateIntegrity(snapshot);
      
      // Log pipeline completion
      await ledger.logDecision({
        decision: 'PIPELINE_COMPLETED' as DecisionType,
        marker_type: 'pipeline',
        target_id: snapshot.id,
        source_entity_id: 'pipeline',
        source_file: config.repo_path,
        line_start: 1,
        line_end: 1,
        reason: pipelineSuccess ? 'success' : 'completed with errors',
        project_id: config.project_id,
      });
      
      // Complete epoch
      if (epochStarted) {
        await completeEpoch();
      }
      
      return {
        snapshot_id: snapshot.id,
        success: pipelineSuccess,
        total_duration_ms: Date.now() - startTime,
        stages,
        statistics,
        integrity_check,
      };
    } catch (error) {
      // Fail epoch on error
      if (epochStarted) {
        await failEpoch(error instanceof Error ? error.message : String(error));
      }
      throw error;
    }
  }

  /**
   * Create a pipeline snapshot.
   */
  private async createSnapshot(config: PipelineConfig): Promise<PipelineSnapshot> {
    let commitSha = '';
    try {
      commitSha = execSync('git rev-parse HEAD', { cwd: config.repo_path, encoding: 'utf8' }).trim();
    } catch {
      commitSha = 'unknown';
    }
    
    return {
      id: `snapshot-${Date.now()}-${commitSha.slice(0, 8)}`,
      project_id: config.project_id,
      root_path: config.repo_path,
      commit_sha: commitSha,
      timestamp: new Date(),
    };
  }

  /**
   * Execute a single pipeline stage.
   */
  private async executeStage(
    stage: PipelineStage,
    snapshot: PipelineSnapshot,
    config: PipelineConfig
  ): Promise<StageResult> {
    const startTime = Date.now();
    let entitiesCreated = 0;
    let relationshipsCreated = 0;
    const warnings: string[] = [];
    
    switch (stage) {
      case 'FILESYSTEM': {
        const provider = new FilesystemProvider();
        const result = await provider.extract(snapshot);
        const persistResult = await persistEntities(snapshot.project_id, result.entities);
        entitiesCreated = persistResult.filter(r => r.operation !== 'NO-OP').length;
        break;
      }
      
      case 'BRD': {
        const provider = new BRDProvider();
        const result = await provider.extract(snapshot);
        const persistResult = await persistEntities(snapshot.project_id, result.entities);
        entitiesCreated = persistResult.filter(r => r.operation !== 'NO-OP').length;
        break;
      }
      
      case 'AST': {
        const provider = new ASTProvider();
        const result = await provider.extract(snapshot);
        // Filter out E15 Module entities (they come from MODULE stage)
        const nonModuleEntities = result.entities.filter(e => e.entity_type !== 'E15');
        const persistResult = await persistEntities(snapshot.project_id, nonModuleEntities);
        entitiesCreated = persistResult.filter(r => r.operation !== 'NO-OP').length;
        break;
      }
      
      case 'MODULE': {
        const result = await extractAndPersistModules(snapshot.project_id);
        entitiesCreated = result.persisted;
        break;
      }
      
      case 'TEST': {
        // Test entities (E28, E29) are extracted by AST provider
        // This stage is a no-op since AST already handles test files
        break;
      }
      
      case 'GIT': {
        // Extract E49 ReleaseVersion and E50 Commit
        const provider = new GitProvider();
        const result = await provider.extract(snapshot);
        
        // Also extract E52 ChangeSet entities (derived from commits)
        const changesetProvider = new ChangeSetProvider();
        const changesetResult = await changesetProvider.extract(snapshot);
        
        // Persist all git entities
        const allEntities = [...result.entities, ...changesetResult.entities];
        const persistResult = await persistEntities(snapshot.project_id, allEntities);
        entitiesCreated = persistResult.filter(r => r.operation !== 'NO-OP').length;
        break;
      }
      
      case 'MARKERS': {
        const result = await extractAndPersistMarkerRelationships(snapshot.project_id);
        relationshipsCreated = result.r18_created + result.r19_created;
        if (result.orphans > 0) {
          warnings.push(`${result.orphans} orphan markers detected`);
        }
        break;
      }
      
      case 'BRD_REL': {
        // BRD_REL may encounter transient SSL/connection errors; retry once with finding
        let retried = false;
        try {
          const result = await extractAndPersistBrdRelationships(snapshot.project_id);
          relationshipsCreated = result.persisted;
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          if (msg.includes('SSL') || msg.includes('ssl') || msg.includes('Connection')) {
            warnings.push(`TRANSIENT_ERROR: ${msg} (retrying)`);
            retried = true;
            // Retry once
            const result = await extractAndPersistBrdRelationships(snapshot.project_id);
            relationshipsCreated = result.persisted;
          } else {
            throw err;
          }
        }
        if (retried) {
          warnings.push('RECOVERY: BRD_REL succeeded after retry');
        }
        break;
      }
      
      case 'CONTAINMENT_REL': {
        const result = await extractAndPersistContainmentRelationships(snapshot.project_id);
        relationshipsCreated = result.total.persisted;
        break;
      }
      
      case 'TDD_REL': {
        // A4 uses R14-only extraction to avoid missing E06 entity failures
        // R08/R09/R11 are deferred post-HGR-1 per ENTRY.md
        try {
          const result = await extractAndPersistTddRelationshipsR14Only(snapshot.project_id);
          relationshipsCreated = result.persisted;
          
          // Record deferred relationships as findings with full details
          if (result.skipped.r08 + result.skipped.r09 + result.skipped.r11 > 0) {
            warnings.push(`DEFERRED_RELATIONSHIPS: stage=TDD_REL, ` +
              `skipped_r08=${result.skipped.r08}, ` +
              `skipped_r09=${result.skipped.r09}, ` +
              `skipped_r11=${result.skipped.r11}, ` +
              `reason=deferred_post_HGR-1`);
          }
          
          // If R14 was extracted but none persisted, that's a warning
          if (result.extracted.r14 > 0 && result.persisted === 0) {
            warnings.push(`INCOMPLETE_EXTRACTION: R14 extracted ${result.extracted.r14} but persisted 0 (missing E06 entities)`);
          }
        } catch (err) {
          // R14 failures are warnings (E06 may not exist), not critical
          const msg = err instanceof Error ? err.message : String(err);
          if (msg.includes('not found in project')) {
            warnings.push(`MISSING_ENTITY_WARNING: stage=TDD_REL, error=${msg}`);
          } else {
            throw err;
          }
        }
        break;
      }
      
      case 'AST_REL': {
        // Get all entities for AST relationship derivation
        const dbEntities = await getAllEntities(snapshot.project_id);
        const entities: EntityInput[] = dbEntities.map(e => ({
          entity_type: e.entity_type,
          instance_id: e.instance_id,
          name: e.name,
          source_file: e.source_file || '',
          line_start: e.line_start || 1,
          line_end: e.line_end || 1,
          attributes: e.attributes || {},
        }));
        
        const astResult = await extractAstRelationships(snapshot, entities);
        const flatRels = flattenAstRelationships(astResult);
        
        // Deduplicate by instance_id to avoid "ON CONFLICT" errors
        const seen = new Set<string>();
        const uniqueRels = flatRels.filter(r => {
          if (seen.has(r.instance_id)) return false;
          seen.add(r.instance_id);
          return true;
        });
        
        if (uniqueRels.length > 0) {
          const persistResult = await persistRelationshipsAndSync(snapshot.project_id, uniqueRels);
          relationshipsCreated = persistResult.results.filter(r => r.operation !== 'NO-OP').length;
        }
        break;
      }
      
      case 'TEST_REL': {
        const result = await extractAndPersistTestRelationships(snapshot.project_id);
        relationshipsCreated = result.r36_created + result.r37_created;
        break;
      }
      
      case 'GIT_REL': {
        try {
          const result = await extractAndPersistGitRelationships(snapshot.project_id);
          relationshipsCreated = result.total.persisted;
          
          // Emit finding if any relationship types produced 0 (structural integrity signal)
          if (result.r63.persisted === 0 && result.r63.extracted > 0) {
            warnings.push(`INCOMPLETE_EXTRACTION: R63 extracted ${result.r63.extracted} but persisted 0 (missing entities)`);
          }
          if (result.r67.persisted === 0 && result.r67.extracted > 0) {
            warnings.push(`INCOMPLETE_EXTRACTION: R67 extracted ${result.r67.extracted} but persisted 0 (missing entities)`);
          }
          if (result.r70.persisted === 0 && result.r70.extracted > 0) {
            warnings.push(`INCOMPLETE_EXTRACTION: R70 extracted ${result.r70.extracted} but persisted 0 (missing entities)`);
          }
        } catch (err) {
          // GIT_REL may fail if referenced entities don't exist
          // This is a CRITICAL failure for provenance relationships - stage fails
          const msg = err instanceof Error ? err.message : String(err);
          if (msg.includes('not found in project')) {
            // Extract details for the error message
            const entityMatch = msg.match(/entity "([^"]+)" not found/);
            const relMatch = msg.match(/relationship ([^:]+)/);
            const detailedError = new Error(
              `MISSING_ENTITY_CRITICAL: stage=GIT_REL, ` +
              `relationship_type=${relMatch?.[1] || 'unknown'}, ` +
              `missing_entity_id=${entityMatch?.[1] || 'unknown'}, ` +
              `original_error=${msg}`
            );
            throw detailedError;
          }
          throw err;
        }
        break;
      }
      
      case 'VALIDATE': {
        // Sync to Neo4j to ensure parity
        await syncToNeo4j(snapshot.project_id);
        // Integrity check happens after all stages in execute()
        break;
      }
    }
    
    return this.createStageResult(
      stage,
      true,
      Date.now() - startTime,
      entitiesCreated,
      relationshipsCreated,
      [],
      warnings
    );
  }

  /**
   * Create a stage result object.
   */
  private createStageResult(
    stage: PipelineStage,
    success: boolean,
    durationMs: number,
    entitiesCreated: number,
    relationshipsCreated: number,
    errors: string[] = [],
    warnings: string[] = []
  ): StageResult {
    return {
      stage,
      success,
      duration_ms: durationMs,
      entities_created: entitiesCreated,
      relationships_created: relationshipsCreated,
      errors,
      warnings,
    };
  }
}

/**
 * Convenience function to execute the pipeline.
 */
export async function executePipeline(config: PipelineConfig): Promise<PipelineResult> {
  const orchestrator = new PipelineOrchestrator();
  return orchestrator.execute(config);
}

