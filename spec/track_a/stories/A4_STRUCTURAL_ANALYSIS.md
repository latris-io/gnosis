# Story A.4: Structural Analysis

**Version:** 1.3.0  
**Implements:** STORY-64.4 (Structural Analysis Pipeline)  
**Track:** A  
**Duration:** 2-3 days  
**Canonical Sources:**
- BRD V20.6.3 §Epic 64, Story 64.4
- UTG Schema V20.6.1 §Analysis Pipeline
- Verification Spec V20.6.4 §Part IX

> **v1.3.0:** Added explicit project_id propagation in PipelineConfig, RepoSnapshot, createSnapshot, and create* calls  
> **v1.2.0:** Epistemic hygiene: IntegrityValidator→IntegrityEvaluator, pass/fail→findings with severity, schema column fix (entity_type with E-codes)  
> **v1.1.0:** Added architecture note clarifying IntegrityEvaluator is service-layer; added verification guardrail

---

## User Story

> As the Gnosis system, I need a complete structural analysis pipeline that orchestrates all extraction providers so that I can build a comprehensive graph from any codebase in a single operation.

---

## Acceptance Criteria

| AC | Description | Pillar | Verification (REQUIRED) |
|----|-------------|--------|-------------------------|
| AC-64.4.1 | Orchestrate all extraction providers | Shadow Ledger | VERIFY-PIPELINE-01 |
| AC-64.4.2 | Execute providers in dependency order | Shadow Ledger | VERIFY-PIPELINE-02 |
| AC-64.4.3 | Handle provider failures gracefully | API Boundary | VERIFY-PIPELINE-03 |
| AC-64.4.4 | Report extraction statistics | Semantic Learning | VERIFY-PIPELINE-04 |
| AC-64.4.5 | Validate graph integrity post-extraction | Shadow Ledger | VERIFY-PIPELINE-05 |
| AC-64.4.6 | Support incremental extraction | Shadow Ledger | VERIFY-PIPELINE-06 |
| AC-64.4.7 | Create snapshot before extraction | Shadow Ledger | VERIFY-PIPELINE-07 |
| AC-64.4.8 | All pipeline operations logged | Shadow Ledger | RULE-LEDGER-004 |

---

## Entry Criteria

- [ ] Story A.1 (Entity Registry) complete
- [ ] Story A.2 (Relationship Registry) complete
- [ ] Story A.3 (Marker Extraction) complete
- [ ] All extraction providers operational
- [ ] Database migrations applied

---

## Provider Execution Order

The pipeline executes providers in dependency order:

```
1. SNAPSHOT     → Create RepoSnapshot (git state)
2. FILESYSTEM   → Extract SourceFile, TestFile entities
3. BRD          → Extract Epic, Story, AC, Requirement entities
4. AST          → Extract Function, Class, Interface, Module entities
5. TEST         → Extract TestSuite, TestCase entities
6. GIT          → Extract Commit, ReleaseVersion, ChangeSet entities
7. MARKERS      → Extract @implements/@satisfies markers
8. BRD-REL      → Create requirement relationships (R01-R05)
9. AST-REL      → Create code relationships (R21-R26)
10. TEST-REL    → Create test relationships (R40-R45)
11. GIT-REL     → Create provenance relationships (R60-R61)
12. VALIDATE    → Verify graph integrity
```

---

## Implementation Steps

### Step 1: Create Pipeline Types

```typescript
// src/pipeline/types.ts
// @implements STORY-64.4

export type PipelineStage = 
  | 'SNAPSHOT' | 'FILESYSTEM' | 'BRD' | 'AST' | 'TEST' | 'GIT' 
  | 'MARKERS' | 'BRD_REL' | 'AST_REL' | 'TEST_REL' | 'GIT_REL' | 'VALIDATE';

export interface PipelineConfig {
  project_id: string;
  repo_path: string;
  incremental: boolean;
  skip_stages?: PipelineStage[];
  fail_fast: boolean;
}

export interface StageResult {
  stage: PipelineStage;
  success: boolean;
  duration_ms: number;
  entities_created: number;
  relationships_created: number;
  errors: string[];
  warnings: string[];
}

export interface PipelineResult {
  snapshot_id: string;
  success: boolean;
  total_duration_ms: number;
  stages: StageResult[];
  statistics: ExtractionStatistics;
  integrity_check: IntegrityResult;
}

export interface ExtractionStatistics {
  total_entities: number;
  entities_by_type: Record<string, number>;
  total_relationships: number;
  relationships_by_type: Record<string, number>;
  orphan_entities: number;
  orphan_markers: number;
}

export interface IntegrityResult {
  findings: IntegrityFinding[];
  summary: string;
}

export interface IntegrityFinding {
  name: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  evidence?: Record<string, unknown>;
}
```

### Step 2: Implement Pipeline Orchestrator

```typescript
// src/pipeline/orchestrator.ts
// @implements STORY-64.4
// @satisfies AC-64.4.1, AC-64.4.2, AC-64.4.3, AC-64.4.8

export class PipelineOrchestrator {
  private providers: Map<PipelineStage, ExtractionProvider>;
  private ledger: ShadowLedger;
  
  constructor() {
    this.providers = new Map();
    this.ledger = new ShadowLedger();
    this.registerProviders();
  }
  
  private registerProviders(): void {
    this.providers.set('FILESYSTEM', new FilesystemProvider());
    this.providers.set('BRD', new BRDProvider());
    this.providers.set('AST', new ASTProvider());
    this.providers.set('TEST', new TestProvider());
    this.providers.set('GIT', new GitProvider());
    this.providers.set('MARKERS', new MarkerProvider());
    this.providers.set('BRD_REL', new BRDRelationshipProvider());
    this.providers.set('AST_REL', new ASTRelationshipProvider());
    this.providers.set('TEST_REL', new TestRelationshipProvider());
    this.providers.set('GIT_REL', new GitRelationshipProvider());
  }
  
  async execute(config: PipelineConfig): Promise<PipelineResult> {
    const startTime = Date.now();
    const stages: StageResult[] = [];
    
    // Stage 1: Create snapshot
    const snapshot = await this.createSnapshot(config);
    stages.push(this.recordStage('SNAPSHOT', true, Date.now() - startTime, 0, 0));
    
    await this.ledger.append({
      timestamp: new Date(),
      operation: 'PIPELINE_START',
      entity_type: 'pipeline',
      entity_id: snapshot.id,
      evidence: { config },
      hash: computeHash(config)
    });
    
    // Execute stages in order
    const stageOrder: PipelineStage[] = [
      'FILESYSTEM', 'BRD', 'AST', 'TEST', 'GIT',
      'MARKERS', 'BRD_REL', 'AST_REL', 'TEST_REL', 'GIT_REL'
    ];
    
    for (const stage of stageOrder) {
      if (config.skip_stages?.includes(stage)) {
        continue;
      }
      
      const stageStart = Date.now();
      
      try {
        const provider = this.providers.get(stage);
        if (!provider) {
          throw new Error(`No provider for stage ${stage}`);
        }
        
        const result = await provider.extract(snapshot);
        
        // Persist results (project-scoped)
        for (const entity of result.entities) {
          await createEntity(snapshot.project_id, entity);
        }
        for (const rel of result.relationships) {
          await createRelationship(snapshot.project_id, rel);
        }
        
        stages.push(this.recordStage(
          stage,
          true,
          Date.now() - stageStart,
          result.entities.length,
          result.relationships.length
        ));
        
      } catch (error) {
        stages.push(this.recordStage(
          stage,
          false,
          Date.now() - stageStart,
          0,
          0,
          [error.message]
        ));
        
        if (config.fail_fast) {
          break;
        }
      }
    }
    
    // Stage: Validate integrity
    const integrity = await this.validateIntegrity(snapshot);
    stages.push(this.recordStage('VALIDATE', integrity.valid, 0, 0, 0));
    
    // Compute statistics
    const statistics = await this.computeStatistics();
    
    const result: PipelineResult = {
      snapshot_id: snapshot.id,
      success: stages.every(s => s.success),
      total_duration_ms: Date.now() - startTime,
      stages,
      statistics,
      integrity_check: integrity
    };
    
    await this.ledger.append({
      timestamp: new Date(),
      operation: 'PIPELINE_COMPLETE',
      entity_type: 'pipeline',
      entity_id: snapshot.id,
      evidence: { result },
      hash: computeHash(result)
    });
    
    return result;
  }
  
  private async createSnapshot(config: PipelineConfig): Promise<RepoSnapshot> {
    const gitSha = await this.getGitSha(config.repo_path);
    
    return {
      id: `snapshot-${Date.now()}-${gitSha.slice(0, 8)}`,
      project_id: config.project_id,
      root_path: config.repo_path,
      commit_sha: gitSha,
      timestamp: new Date()
    };
  }
  
  private recordStage(
    stage: PipelineStage,
    success: boolean,
    duration: number,
    entities: number,
    relationships: number,
    errors: string[] = []
  ): StageResult {
    return {
      stage,
      success,
      duration_ms: duration,
      entities_created: entities,
      relationships_created: relationships,
      errors,
      warnings: []
    };
  }
}
```

### Step 3: Implement Integrity Evaluator

> **Architecture Note:** `IntegrityEvaluator` is a **service-layer module** (`src/pipeline/integrity.ts`), not an API route. Service-layer modules MAY access `pool` and `neo4jSession` directly per PROMPTS.md: "src/services/** may import from src/db/**". The pipeline module follows the same rule.

```typescript
// src/pipeline/integrity.ts
// @implements STORY-64.4
// @satisfies AC-64.4.5

export class IntegrityEvaluator {
  async evaluate(snapshot: RepoSnapshot): Promise<IntegrityResult> {
    const findings: IntegrityFinding[] = [];
    
    // Evaluate 1: All relationships reference existing entities
    findings.push(await this.evaluateRelationshipIntegrity());
    
    // Evaluate 2: No duplicate entity IDs
    findings.push(await this.evaluateEntityUniqueness());
    
    // Evaluate 3: All required entity types present
    findings.push(await this.evaluateRequiredEntityTypes());
    
    // Evaluate 4: BRD counts (reported as finding, not assertion)
    findings.push(await this.evaluateBRDCounts());
    
    // Evaluate 5: No orphan files (files without functions/classes)
    findings.push(await this.evaluateOrphanFiles());
    
    // Evaluate 6: Graph connectivity (from Epic to Code)
    findings.push(await this.evaluateGraphConnectivity());
    
    // NOTE: Findings are signals. Track B + Human Gate (HGR-1) determine whether
    // discrepancies are blocking. Track A does not assert correctness.
    
    const criticalCount = findings.filter(f => f.severity === 'critical').length;
    return {
      findings,
      summary: `${findings.length} findings (${criticalCount} critical)`
    };
  }
  
  private async evaluateRelationshipIntegrity(): Promise<IntegrityFinding> {
    const result = await pool.query(`
      SELECT r.id, r.from_entity_id, r.to_entity_id
      FROM relationships r
      LEFT JOIN entities s ON r.from_entity_id = s.id
      LEFT JOIN entities t ON r.to_entity_id = t.id
      WHERE s.id IS NULL OR t.id IS NULL
    `);
    
    return {
      name: 'relationship_integrity',
      severity: result.rows.length === 0 ? 'info' : 'critical',
      message: result.rows.length === 0 
        ? 'All relationships reference valid entities'
        : `${result.rows.length} relationships have invalid references`,
      evidence: { orphan_count: result.rows.length }
    };
  }
  
  private async evaluateEntityUniqueness(): Promise<IntegrityFinding> {
    const result = await pool.query(`
      SELECT id, COUNT(*) as count
      FROM entities
      GROUP BY id
      HAVING COUNT(*) > 1
    `);
    
    return {
      name: 'entity_uniqueness',
      severity: result.rows.length === 0 ? 'info' : 'critical',
      message: result.rows.length === 0
        ? 'All entity IDs are unique'
        : `${result.rows.length} duplicate entity IDs found`,
      evidence: { duplicate_count: result.rows.length }
    };
  }
  
  private async evaluateRequiredEntityTypes(): Promise<IntegrityFinding> {
    // NOTE: Column name + enum values MUST match Track A schema (entity_type with E-codes)
    const requiredTypes = ['E01', 'E02', 'E03', 'E11', 'E12', 'E27', 'E29'];  // Epic, Story, AC, SourceFile, Function, TestFile, TestCase
    
    const result = await pool.query(`
      SELECT DISTINCT entity_type FROM entities
    `);
    
    const foundTypes = new Set(result.rows.map(r => r.entity_type));
    const missingTypes = requiredTypes.filter(t => !foundTypes.has(t));
    
    return {
      name: 'required_entity_types',
      severity: missingTypes.length === 0 ? 'info' : 'warning',
      message: missingTypes.length === 0
        ? 'All required entity types present'
        : `Missing entity types: ${missingTypes.join(', ')}`,
      evidence: { missing_types: missingTypes }
    };
  }
  
  private async evaluateBRDCounts(): Promise<IntegrityFinding> {
    // NOTE: Column name + enum values MUST match Track A schema (entity_type with E-codes)
    const epicCount = await pool.query(`SELECT COUNT(*) FROM entities WHERE entity_type = 'E01'`);
    const storyCount = await pool.query(`SELECT COUNT(*) FROM entities WHERE entity_type = 'E02'`);
    const acCount = await pool.query(`SELECT COUNT(*) FROM entities WHERE entity_type = 'E03'`);
    
    const expected = { epics: 65, stories: 351, acs: 2849 };
    const actual = {
      epics: parseInt(epicCount.rows[0].count),
      stories: parseInt(storyCount.rows[0].count),
      acs: parseInt(acCount.rows[0].count)
    };
    
    // Report as finding, not assertion. Track B/HGR-1 determines if discrepancy is blocking.
    return {
      name: 'brd_counts',
      severity: 'info',  // Always info - human gate reviews discrepancies
      message: `BRD counts: expected ${expected.epics}/${expected.stories}/${expected.acs}, found ${actual.epics}/${actual.stories}/${actual.acs}`,
      evidence: { expected, actual }
    };
  }
  
  private async evaluateOrphanFiles(): Promise<IntegrityFinding> {
    // Check for source files without any functions or classes
    const result = await pool.query(`
      SELECT sf.id FROM entities sf
      WHERE sf.entity_type = 'E11'
      AND NOT EXISTS (
        SELECT 1 FROM relationships r
        WHERE r.from_entity_id = sf.id
        AND r.relationship_type IN ('R05')
      )
    `);
    
    return {
      name: 'orphan_files',
      severity: result.rows.length === 0 ? 'info' : 'warning',
      message: result.rows.length === 0
        ? 'No orphan source files found'
        : `${result.rows.length} source files have no contained entities`,
      evidence: { orphan_count: result.rows.length }
    };
  }
  
  private async evaluateGraphConnectivity(): Promise<IntegrityFinding> {
    // Evaluate that we can traverse from at least one Epic to at least one Function
    const result = await neo4jSession.run(`
      MATCH path = (e:Entity {entity_type: 'E01'})-[*1..5]->(f:Entity {entity_type: 'E12'})
      RETURN COUNT(DISTINCT path) as paths
      LIMIT 1
    `);
    
    const pathCount = result.records[0]?.get('paths')?.toNumber() || 0;
    
    return {
      name: 'graph_connectivity',
      severity: pathCount > 0 ? 'info' : 'warning',
      message: pathCount > 0
        ? 'Graph is connected (Epic → Function paths exist)'
        : 'Graph may be disconnected (no Epic → Function paths found)',
      evidence: { path_count: pathCount }
    };
  }
}
```

### Step 4: Implement Incremental Extraction

```typescript
// src/pipeline/incremental.ts
// @implements STORY-64.4
// @satisfies AC-64.4.6

export class IncrementalExtractor {
  async extractChanges(
    previousSnapshot: RepoSnapshot,
    currentSnapshot: RepoSnapshot
  ): Promise<ChangeSet> {
    // Get changed files from git
    const changedFiles = await this.getChangedFiles(
      previousSnapshot.commit_sha,
      currentSnapshot.commit_sha
    );
    
    const additions: Entity[] = [];
    const modifications: Entity[] = [];
    const deletions: string[] = [];
    
    for (const file of changedFiles) {
      switch (file.status) {
        case 'added':
          // Extract new entities from file
          const newEntities = await this.extractFromFile(file.path, currentSnapshot);
          additions.push(...newEntities);
          break;
          
        case 'modified':
          // Delete old entities, extract new
          const oldEntities = await this.getEntitiesForFile(file.path);
          deletions.push(...oldEntities.map(e => e.id));
          const updatedEntities = await this.extractFromFile(file.path, currentSnapshot);
          modifications.push(...updatedEntities);
          break;
          
        case 'deleted':
          // Mark entities for deletion
          const removedEntities = await this.getEntitiesForFile(file.path);
          deletions.push(...removedEntities.map(e => e.id));
          break;
      }
    }
    
    return { additions, modifications, deletions };
  }
  
  private async getChangedFiles(
    fromSha: string,
    toSha: string
  ): Promise<Array<{ path: string; status: 'added' | 'modified' | 'deleted' }>> {
    const result = await exec(`git diff --name-status ${fromSha} ${toSha}`);
    
    return result.stdout.split('\n')
      .filter(line => line.trim())
      .map(line => {
        const [status, path] = line.split('\t');
        return {
          path,
          status: status === 'A' ? 'added' : status === 'D' ? 'deleted' : 'modified'
        };
      });
  }
}
```

---

## Files to Create

| File | Purpose | Lines |
|------|---------|-------|
| `src/pipeline/types.ts` | Pipeline type definitions | ~70 |
| `src/pipeline/orchestrator.ts` | Main pipeline orchestrator | ~200 |
| `src/pipeline/integrity.ts` | Integrity validation | ~150 |
| `src/pipeline/incremental.ts` | Incremental extraction | ~100 |
| `src/pipeline/statistics.ts` | Statistics computation | ~80 |
| `src/api/v1/pipeline.ts` | Pipeline API | ~50 |
| `test/pipeline/pipeline.test.ts` | Pipeline tests | ~300 |

---

## Verification Tests

```typescript
// test/pipeline/pipeline.test.ts
// @implements STORY-64.4

describe('Structural Analysis Pipeline', () => {
  // VERIFY-PIPELINE-01: Orchestrates all providers
  it('executes all extraction providers', async () => {
    const result = await pipeline.execute({ project_id: projectId, repo_path: '.', incremental: false, fail_fast: true });
    
    const expectedStages = ['FILESYSTEM', 'BRD', 'AST', 'TEST', 'GIT', 'MARKERS'];
    for (const stage of expectedStages) {
      expect(result.stages.find(s => s.stage === stage)).toBeDefined();
    }
  });
  
  // VERIFY-PIPELINE-02: Dependency order
  it('executes providers in dependency order', async () => {
    const result = await pipeline.execute({ project_id: projectId, repo_path: '.', incremental: false, fail_fast: true });
    
    const stageOrder = result.stages.map(s => s.stage);
    expect(stageOrder.indexOf('FILESYSTEM')).toBeLessThan(stageOrder.indexOf('AST'));
    expect(stageOrder.indexOf('BRD')).toBeLessThan(stageOrder.indexOf('MARKERS'));
  });
  
  // VERIFY-PIPELINE-03: Handles failures
  it('handles provider failures gracefully', async () => {
    const result = await pipeline.execute({ 
      project_id: projectId,
      repo_path: '/nonexistent', 
      incremental: false, 
      fail_fast: false 
    });
    
    expect(result.success).toBe(false);
    expect(result.stages.some(s => !s.success)).toBe(true);
  });
  
  // VERIFY-PIPELINE-04: Reports statistics
  it('reports extraction statistics', async () => {
    const result = await pipeline.execute({ project_id: projectId, repo_path: '.', incremental: false, fail_fast: true });
    
    expect(result.statistics).toBeDefined();
    expect(result.statistics.total_entities).toBeGreaterThan(0);
    expect(result.statistics.entities_by_type).toBeDefined();
  });
  
  // VERIFY-PIPELINE-05: Evaluates integrity signals
  it('evaluates structural integrity signals', async () => {
    const result = await pipeline.execute({ project_id: projectId, repo_path: '.', incremental: false, fail_fast: true });
    
    expect(result.integrity_check).toBeDefined();
    expect(result.integrity_check.checks.length).toBeGreaterThan(0);
  });
  
  // VERIFY-PIPELINE-06: Supports incremental
  it('supports incremental extraction', async () => {
    // First full extraction
    const full = await pipeline.execute({ project_id: projectId, repo_path: '.', incremental: false, fail_fast: true });
    
    // Make a change
    await fs.writeFile('src/test-file.ts', '// test');
    
    // Incremental extraction
    const incr = await pipeline.execute({ project_id: projectId, repo_path: '.', incremental: true, fail_fast: true });
    
    expect(incr.total_duration_ms).toBeLessThan(full.total_duration_ms);
  });
  
  // VERIFY-PIPELINE-07: Creates snapshot
  it('creates snapshot before extraction', async () => {
    const result = await pipeline.execute({ project_id: projectId, repo_path: '.', incremental: false, fail_fast: true });
    
    expect(result.snapshot_id).toBeDefined();
    expect(result.snapshot_id).toMatch(/^snapshot-\d+-[a-f0-9]+$/);
  });
});
```

---

## Verification Checklist

- [ ] All acceptance criteria implemented
- [ ] All VERIFY-PIPELINE-* tests pass
- [ ] Code has `@implements STORY-64.4` marker
- [ ] Functions have `@satisfies AC-64.4.*` markers
- [ ] Shadow ledger entries for pipeline start/complete
- [ ] All integrity findings reviewed (no unresolved critical findings)
- [ ] **Mission Alignment:** Confirm no oracle claims (confidence ≠ truth, alignment ≠ understanding)
- [ ] **No Placeholders:** All bracketed placeholders resolved to concrete values
- [ ] **Architecture Compliance:**
  - `rg -n "from.*db/" src/api/v1` returns 0 matches
  - `rg -n "from.*db/" src/pipeline` returns matches only in orchestrator/integrity (service-layer)
  - `rg -n "from.*db/" src/extraction/providers` returns 0 matches

---

## Definition of Done

- [ ] Pipeline orchestrates all providers
- [ ] Providers execute in dependency order
- [ ] Failures handled gracefully (with fail_fast option)
- [ ] Statistics reported accurately
- [ ] Integrity evaluation completes (findings reviewed at HGR-1)
- [ ] Incremental extraction works
- [ ] All tests pass
- [ ] Committed with message: "STORY-64.4: Structural Analysis Pipeline"

---

## Next Story

→ `A5_GRAPH_API_V1.md`

---

**END OF STORY A.4**
