# Story A.1: Entity Registry

**Version:** 1.6.0  
**Implements:** STORY-64.1 (UTG Entity Extraction)  
**Track:** A  
**Duration:** 2-3 days  
**Canonical Sources:**
- BRD V20.6.3 §Epic 64, Story 64.1
- UTG Schema V20.6.1 §Entity Registry
- Verification Spec V20.6.4 §Part IX

> **v1.6.0:** Added AC-64.1.19 for E52 ChangeSet, ChangeSetProvider, signal count 50, AC marker fix  
> **v1.5.0:** Multi-tenant identity fix: ON CONFLICT (project_id, instance_id)  
> **v1.4.0:** Entity count consistency: "16 in scope, 15 extractable (E14 deferred)"  
> **v1.3.0:** Fixed incomplete service delegation in API snippet; added service interface requirements  
> **v1.2.0:** Added service-layer architecture per PROMPTS.md alignment

---

## User Story

> As the Gnosis system, I need to extract and store all 16 Track A entity types from the codebase so that I have a complete structural inventory of what exists.

> **Note:** 16 entity types are in Track A scope. 15 are extractable; E14 Interface extraction is deferred to a later track. Relationships referencing E14 (e.g., R24 IMPLEMENTS_INTERFACE) will carry reduced confidence until E14 is populated.

---

## Acceptance Criteria

| AC | Description | Pillar | Verification (REQUIRED) |
|----|-------------|--------|-------------------------|
| AC-64.1.1 | Extract Epic entities from BRD | Shadow Ledger | VERIFY-E01 |
| AC-64.1.2 | Extract Story entities from BRD | Shadow Ledger | VERIFY-E02 |
| AC-64.1.3 | Extract AcceptanceCriterion entities from BRD | Shadow Ledger | VERIFY-E03 |
| AC-64.1.4 | Extract Constraint entities from BRD | Shadow Ledger | VERIFY-E04 |
| AC-64.1.5 | Extract TechnicalDesign entities from ADRs | Shadow Ledger | VERIFY-E06 |
| AC-64.1.6 | Extract DataSchema entities from module analysis | Shadow Ledger | VERIFY-E08 |
| AC-64.1.7 | Extract SourceFile entities from filesystem | Shadow Ledger | VERIFY-E11 |
| AC-64.1.8 | Extract Function entities from AST | Shadow Ledger | VERIFY-E12 |
| AC-64.1.9 | Extract Class entities from AST | Shadow Ledger | VERIFY-E13 |
| AC-64.1.10 | Extract Module entities from imports | Shadow Ledger | VERIFY-E15 |
| AC-64.1.11 | Extract TestFile entities from test directory | Shadow Ledger | VERIFY-E27 |
| AC-64.1.12 | Extract TestSuite entities from describe blocks | Shadow Ledger | VERIFY-E28 |
| AC-64.1.13 | Extract TestCase entities from it blocks | Shadow Ledger | VERIFY-E29 |
| AC-64.1.14 | Extract ReleaseVersion entities from git tags | Shadow Ledger | VERIFY-E49 |
| AC-64.1.15 | Extract Commit entities from git log | Shadow Ledger | VERIFY-E50 |
| AC-64.1.16 | All extractions logged to shadow ledger | Shadow Ledger | RULE-LEDGER-001 |
| AC-64.1.17 | All entities have evidence anchors | Evidence | SANITY-044 |
| AC-64.1.18 | Semantic corpus initialized for Track C | Semantic Learning | VERIFY-CORPUS-01 |
| AC-64.1.19 | Derive ChangeSet entities from commit groupings | Shadow Ledger | VERIFY-E52 |

---

## Entry Criteria

- [ ] Track A ENTRY.md checklist complete
- [ ] SANITY suite passes (SANITY-001..014 pre-track tests)
- [ ] PostgreSQL schema migrations applied
- [ ] Neo4j constraints created
- [ ] Provider interface file exists (`src/extraction/types.ts`)

---

## Implementation Steps

### Step 1: Create Entity Type Definitions

```typescript
// src/schema/track-a/entities.ts
// @implements STORY-64.1

// Per Cursor Plan V20.8.5 lines 443-465
export type EntityTypeCode = 
  | 'E01' | 'E02' | 'E03' | 'E04'  // Requirements: Epic, Story, AcceptanceCriterion, Constraint
  | 'E06' | 'E08'                  // Design: TechnicalDesign, DataSchema
  | 'E11' | 'E12' | 'E13' | 'E15'  // Implementation: SourceFile, Function, Class, Module
  | 'E27' | 'E28' | 'E29'          // Verification: TestFile, TestSuite, TestCase
  | 'E49' | 'E50' | 'E52';         // Provenance: ReleaseVersion, Commit, ChangeSet

// NOTE: E14 Interface is NOT in Track A entity scope

export interface Entity {
  id: string;                          // UUID
  entity_type: EntityTypeCode;         // E-code, not name
  instance_id: string;                 // Stable business key, e.g., "STORY-64.1"
  name: string;                        // Human-readable name
  attributes: Record<string, unknown>; // JSONB
  content_hash: string;                // SHA-256 hash for change detection
  source_file: string;                 // Provenance: extraction source
  line_start: number;                  // Provenance: start line
  line_end: number;                    // Provenance: end line
  commit_sha: string;                  // Provenance: git commit
  extraction_timestamp: Date;          // Provenance: when extracted
  extractor_version: string;           // Provenance: extractor version
  project_id: string;                  // UUID, for RLS
  created_at: Date;
  updated_at: Date;
}

export interface EvidenceAnchor {
  source_file: string;
  line_start: number;
  line_end: number;
  commit_sha: string;
  extraction_timestamp: Date;
  extractor_version: string;
}
```

### Step 2: PostgreSQL Schema (Already Applied)

The entity schema is defined in `migrations/003_reset_schema_to_cursor_plan.sql` per Cursor Plan V20.8.5 lines 443-465.

**Key schema points:**
- `entity_type VARCHAR(10)` stores E-codes ('E01', 'E02', etc.)
- `instance_id VARCHAR(500)` is a stable business key (e.g., 'STORY-64.1')
- Flat provenance fields instead of nested `evidence` JSONB
- RLS enabled with permissive policy (`USING (true)`)
- CHECK constraint: `entity_type ~ '^E[0-9]{2}$'`

See migration 003 for full schema.

### Step 3: Implement BRD Parser (E01, E02, E03, E04)

```typescript
// src/extraction/providers/brd-provider.ts
// @implements STORY-64.1
// @satisfies AC-64.1.1, AC-64.1.2, AC-64.1.3, AC-64.1.4

import { ExtractionProvider, RepoSnapshot, ExtractionResult, ExtractedEntity } from '../types';
import { parseBRD } from '../parsers/brd-parser';

export class BRDProvider implements ExtractionProvider {
  name = 'brd-provider';
  
  supports(fileType: string): boolean {
    return fileType === 'brd' || fileType === 'md';
  }
  
  async extract(snapshot: RepoSnapshot): Promise<ExtractionResult> {
    const brdPath = `${snapshot.root_path}/docs/BRD_V20_6_3_COMPLETE.md`;
    const content = await fs.readFile(brdPath, 'utf8');
    const parsed = parseBRD(content);
    
    const entities: ExtractedEntity[] = [];
    
    // Extract Epics (E01)
    for (const epic of parsed.epics) {
      entities.push({
        entity_type: 'E01',
        instance_id: `EPIC-${epic.number}`,
        name: epic.title,
        attributes: {
          number: epic.number,
          description: epic.description
        },
        source_file: brdPath,
        line_start: epic.lineStart,
        line_end: epic.lineEnd
      });
    }
    
    // Extract Stories (E02)
    for (const story of parsed.stories) {
      entities.push({
        entity_type: 'E02',
        instance_id: `STORY-${story.epicNumber}.${story.storyNumber}`,
        name: story.title,
        attributes: {
          epic_number: story.epicNumber,
          story_number: story.storyNumber,
          user_story: story.userStory
        },
        source_file: brdPath,
        line_start: story.lineStart,
        line_end: story.lineEnd
      });
    }
    
    // Extract Acceptance Criteria (E03)
    for (const ac of parsed.acceptanceCriteria) {
      entities.push({
        entity_type: 'E03',
        instance_id: `AC-${ac.epicNumber}.${ac.storyNumber}.${ac.acNumber}`,
        name: `AC-${ac.epicNumber}.${ac.storyNumber}.${ac.acNumber}`,
        attributes: {
          story_id: `STORY-${ac.epicNumber}.${ac.storyNumber}`,
          description: ac.description,
          verification: ac.verification
        },
        source_file: brdPath,
        line_start: ac.lineStart,
        line_end: ac.lineEnd
      });
    }
    
    return { entities, relationships: [], evidence: [] };
  }
}
```

### Step 4: Implement AST Provider (E12, E13)

> **Note:** E14 Interface is NOT in Track A entity scope. Interface extraction is deferred to a later track. Relationships referencing Interface targets (R24 IMPLEMENTS_INTERFACE) will have `confidence < 1.0` until Interface entities are extracted.

```typescript
// src/extraction/providers/ast-provider.ts
// @implements STORY-64.1
// @satisfies AC-64.1.8, AC-64.1.9

import { Project, SyntaxKind } from 'ts-morph';
import { ExtractionProvider, RepoSnapshot, ExtractionResult, ExtractedEntity } from '../types';

export class ASTProvider implements ExtractionProvider {
  name = 'ast-provider';
  
  supports(fileType: string): boolean {
    return ['ts', 'tsx', 'js', 'jsx'].includes(fileType);
  }
  
  async extract(snapshot: RepoSnapshot): Promise<ExtractionResult> {
    const project = new Project();
    project.addSourceFilesAtPaths(`${snapshot.root_path}/src/**/*.{ts,tsx}`);
    
    const entities: ExtractedEntity[] = [];
    
    for (const sourceFile of project.getSourceFiles()) {
      const filePath = sourceFile.getFilePath();
      
      // Extract Functions (E12)
      for (const func of sourceFile.getFunctions()) {
        entities.push({
          entity_type: 'E12',
          instance_id: `FUNC-${filePath}:${func.getName()}`,
          name: func.getName() || '<anonymous>',
          attributes: {
            file_id: `FILE-${filePath}`,
            visibility: func.isExported() ? 'export' : 'private',
            parameters: func.getParameters().map(p => p.getName()),
            return_type: func.getReturnType().getText()
          },
          source_file: filePath,
          line_start: func.getStartLineNumber(),
          line_end: func.getEndLineNumber()
        });
      }
      
      // Extract Classes (E13)
      for (const cls of sourceFile.getClasses()) {
        entities.push({
          entity_type: 'E13',
          instance_id: `CLASS-${filePath}:${cls.getName()}`,
          name: cls.getName() || '<anonymous>',
          attributes: {
            file_id: `FILE-${filePath}`,
            visibility: cls.isExported() ? 'export' : 'private',
            extends: cls.getExtends()?.getText(),
            implements: cls.getImplements().map(i => i.getText())
          },
          source_file: filePath,
          line_start: cls.getStartLineNumber(),
          line_end: cls.getEndLineNumber()
        });
      }
      
      // NOTE: E14 Interface extraction is deferred to post-Track A
    }
    
    return { entities, relationships: [], evidence: [] };
  }
}
```

### Step 5: Implement Shadow Ledger

```typescript
// src/ledger/shadow-ledger.ts
// @implements STORY-64.1
// @satisfies AC-64.1.17

import * as fs from 'fs/promises';
import * as path from 'path';

export interface LedgerEntry {
  timestamp: Date;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  entity_type: string;
  entity_id: string;
  evidence: EvidenceAnchor;
  hash: string;
}

export class ShadowLedger {
  private path: string;
  
  constructor(ledgerPath: string = 'shadow-ledger/ledger.jsonl') {
    this.path = ledgerPath;
  }
  
  async initialize(): Promise<void> {
    // Ensure directory exists
    const dir = path.dirname(this.path);
    await fs.mkdir(dir, { recursive: true });
    // Create file if it doesn't exist
    try {
      await fs.access(this.path);
    } catch {
      await fs.writeFile(this.path, '');
    }
  }
  
  async append(entry: LedgerEntry): Promise<void> {
    const line = JSON.stringify({
      ...entry,
      timestamp: entry.timestamp.toISOString()
    }) + '\n';
    await fs.appendFile(this.path, line);
  }
  
  async getEntries(): Promise<LedgerEntry[]> {
    const content = await fs.readFile(this.path, 'utf8');
    return content
      .split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line));
  }
}

// Singleton instance
export const shadowLedger = new ShadowLedger();
```

### Step 5b: Implement Semantic Corpus

```typescript
// src/ledger/semantic-corpus.ts
// @implements STORY-64.1
// @satisfies AC-64.1.18

import * as fs from 'fs/promises';
import * as path from 'path';

export type SignalType = 'CORRECT' | 'INCORRECT' | 'PARTIAL' | 'ORPHAN_MARKER' | 'AMBIGUOUS';

export interface SemanticSignal {
  timestamp: Date;
  type: SignalType;
  entity_id?: string;
  marker_type?: string;
  target_id?: string;
  source_entity_id?: string;
  context: Record<string, unknown>;
  evidence: Record<string, unknown>;
}

export class SemanticCorpus {
  private path: string;
  
  constructor(corpusPath: string = 'semantic-corpus/signals.jsonl') {
    this.path = corpusPath;
  }
  
  async initialize(): Promise<void> {
    // Ensure directory exists
    const dir = path.dirname(this.path);
    await fs.mkdir(dir, { recursive: true });
    // Create file if it doesn't exist
    try {
      await fs.access(this.path);
    } catch {
      await fs.writeFile(this.path, '');
    }
  }
  
  async capture(signal: SemanticSignal): Promise<void> {
    const line = JSON.stringify({
      ...signal,
      timestamp: signal.timestamp.toISOString()
    }) + '\n';
    await fs.appendFile(this.path, line);
  }
  
  async getSignals(type?: SignalType): Promise<SemanticSignal[]> {
    const content = await fs.readFile(this.path, 'utf8');
    const signals = content
      .split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line));
    
    if (type) {
      return signals.filter(s => s.type === type);
    }
    return signals;
  }
  
  async getCount(): Promise<number> {
    const signals = await this.getSignals();
    return signals.length;
  }
}

// Singleton for convenience
export const semanticCorpus = new SemanticCorpus();

// Helper function used throughout extraction
export async function captureSemanticSignal(signal: Omit<SemanticSignal, 'timestamp'>): Promise<void> {
  await semanticCorpus.capture({
    ...signal,
    timestamp: new Date()
  });
}
```

### Step 5c: Entity Service (Upsert Logic)

```typescript
// src/services/entities/entity-service.ts
// @implements STORY-64.1
// Implements ENTRY.md Upsert Rule (Locked)

import { pool } from '../../db/postgres';

/**
 * Identity and persistence both use (project_id, instance_id).
 * Per ENTRY.md locked upsert rule.
 */
export async function upsert(projectId: string, extracted: ExtractedEntity): Promise<Entity> {
  const contentHash = computeHash(extracted);
  
  const result = await pool.query(`
    INSERT INTO entities (
      id, entity_type, instance_id, name, attributes, content_hash,
      source_file, line_start, line_end, project_id, extracted_at
    ) VALUES (
      gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()
    )
    ON CONFLICT (project_id, instance_id) DO UPDATE SET
      name = EXCLUDED.name,
      attributes = EXCLUDED.attributes,
      content_hash = EXCLUDED.content_hash,
      source_file = EXCLUDED.source_file,
      line_start = EXCLUDED.line_start,
      line_end = EXCLUDED.line_end,
      extracted_at = NOW()
    WHERE entities.content_hash IS DISTINCT FROM EXCLUDED.content_hash
    RETURNING id, (xmax = 0) AS inserted
  `, [
    extracted.entity_type, extracted.instance_id, extracted.name,
    extracted.attributes, contentHash,
    extracted.source_file, extracted.line_start, extracted.line_end,
    projectId  // project_id included in INSERT
  ]);
  
  // Emit entity-link entry per Verification Spec §8.1.3 on CREATE/UPDATE only
  if (result.rows[0]) {
    await emitEntityLinkEntry(result.rows[0], extracted);
  }
  
  return result.rows[0];
}

/**
 * Additional service methods required by API:
 * - getById(projectId, id): Retrieve entity by UUID, project-scoped
 * - getByInstanceId(projectId, instanceId): Retrieve entity by instance_id, project-scoped
 * - queryByType(projectId, entityType): Query entities by type, project-scoped
 * 
 * Implementation per schema in migrations/003.
 * 
 * NOTE: Stub signatures only. Implementations MUST follow Track A schema + story requirements.
 * Do NOT invent additional behaviors beyond what is specified here.
 */
export async function getById(projectId: string, id: string): Promise<Entity | null> {
  // Implementation: project-scoped query by UUID
}

export async function getByInstanceId(projectId: string, instanceId: string): Promise<Entity | null> {
  // Implementation: project-scoped query by instance_id
}

export async function queryByType(projectId: string, entityType: EntityTypeCode): Promise<Entity[]> {
  // Implementation: project-scoped query by entity_type
}
```

### Step 5d: Implement ChangeSet Derivation (E52)

> **Note:** E52 ChangeSet is DERIVED, not directly extracted. ChangeSets group commits by story reference. R70 GROUPS relationships are created in A2.

```typescript
// src/extraction/providers/changeset-provider.ts
// @implements STORY-64.1
// @satisfies AC-64.1.19

import { ExtractionProvider, RepoSnapshot, ExtractionResult, ExtractedEntity } from '../types';
import { execSync } from 'child_process';

export class ChangeSetProvider implements ExtractionProvider {
  name = 'changeset-provider';
  
  supports(fileType: string): boolean {
    return fileType === 'git';
  }
  
  async extract(snapshot: RepoSnapshot): Promise<ExtractionResult> {
    const entities: ExtractedEntity[] = [];
    const upperBound = snapshot.commit_sha || 'HEAD';
    
    let stdout: string;
    try {
      stdout = execSync(
        `git log --format="%H|%s" ${upperBound}`,
        { cwd: snapshot.root_path, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
      );
    } catch {
      return { entities: [], relationships: [], evidence: [] };
    }
    
    // Group commits by story reference
    const commitsByStory = new Map<string, string[]>();
    
    for (const line of stdout.split('\n').filter(Boolean)) {
      const pipeIndex = line.indexOf('|');
      if (pipeIndex === -1) continue;
      
      const sha = line.slice(0, pipeIndex);
      const message = line.slice(pipeIndex + 1);
      const storyMatch = message.match(/STORY-(\d+\.\d+)/);
      
      if (storyMatch) {
        const storyId = storyMatch[1];
        if (!commitsByStory.has(storyId)) {
          commitsByStory.set(storyId, []);
        }
        commitsByStory.get(storyId)!.push(sha);
      }
    }
    
    // Create ChangeSet entity for each story grouping (deterministic order)
    for (const storyId of Array.from(commitsByStory.keys()).sort()) {
      const commits = commitsByStory.get(storyId)!;
      entities.push({
        entity_type: 'E52',
        instance_id: `CHGSET-STORY-${storyId}`,
        name: `ChangeSet for STORY-${storyId}`,
        attributes: {
          story_id: `STORY-${storyId}`,
          commit_count: commits.length,
          commit_shas: commits.sort()
        },
        source_file: '.git',
        line_start: 0,
        line_end: 0
      });
    }
    
    return { entities, relationships: [], evidence: [] };
  }
}
```

### Step 6: Create Graph API v1 Entity Operations

> **Architecture:** API routes delegate to services; they do NOT import from `src/db/*` directly.
> See PROMPTS.md Database Access Boundary.

```typescript
// src/api/v1/entities.ts
// @implements STORY-64.1
// @satisfies AC-64.1.1 through AC-64.1.15

import * as entityService from '../../services/entities/entity-service';
import type { Entity, EntityTypeCode } from '../../schema/track-a/entities';
import type { ExtractedEntity } from '../../extraction/types';

/**
 * API delegates to entity service.
 * All operations are project-scoped at service boundary.
 */
export async function createEntity(projectId: string, extracted: ExtractedEntity): Promise<Entity> {
  return entityService.upsert(projectId, extracted);
}

export async function getEntity(projectId: string, id: string): Promise<Entity | null> {
  return entityService.getById(projectId, id);
}

export async function queryEntities(projectId: string, entityType: EntityTypeCode): Promise<Entity[]> {
  return entityService.queryByType(projectId, entityType);
}
```

---

## Files to Create

| File | Purpose | Lines |
|------|---------|-------|
| `src/schema/track-a/entities.ts` | Entity type definitions | ~50 |
| `src/extraction/types.ts` | Provider interface | ~40 |
| `src/extraction/providers/brd-provider.ts` | BRD parsing | ~150 |
| `src/extraction/providers/ast-provider.ts` | AST extraction | ~200 |
| `src/extraction/providers/git-provider.ts` | Git analysis | ~100 |
| `src/extraction/providers/changeset-provider.ts` | ChangeSet derivation (E52) | ~70 |
| `src/extraction/providers/filesystem-provider.ts` | File enumeration | ~80 |
| `src/extraction/parsers/brd-parser.ts` | BRD markdown parsing | ~200 |
| `src/extraction/evidence.ts` | Evidence anchor creation | ~30 |
| `src/ledger/shadow-ledger.ts` | JSONL ledger | ~60 |
| `src/ledger/semantic-corpus.ts` | Semantic signals for Track C | ~80 |
| `src/services/entities/entity-service.ts` | Upsert logic + ledger emission | ~80 |
| `src/api/v1/entities.ts` | Entity CRUD operations | ~100 |
| `migrations/003_reset_schema_to_cursor_plan.sql` | Schema already established (do not modify); future changes require 004+ | — |
| `test/verification/entity-registry.test.ts` | Entity tests | ~200 |

---

## Verification Tests

```typescript
// test/verification/entity-registry.test.ts
// @implements STORY-64.1

describe('Entity Registry', () => {
  // VERIFY-E01: Epic extraction
  it('extracts all epics from BRD', async () => {
    const result = await brdProvider.extract(snapshot);
    const epics = result.entities.filter(e => e.entity_type === 'E01');
    expect(epics.length).toBe(65);
    expect(epics[0].instance_id).toMatch(/^EPIC-\d+$/);
  });
  
  // VERIFY-E02: Story extraction
  it('extracts all stories from BRD', async () => {
    const result = await brdProvider.extract(snapshot);
    const stories = result.entities.filter(e => e.entity_type === 'E02');
    expect(stories.length).toBe(351);
    expect(stories[0].instance_id).toMatch(/^STORY-\d+\.\d+$/);
  });
  
  // VERIFY-E03: AC extraction
  it('extracts all acceptance criteria from BRD', async () => {
    const result = await brdProvider.extract(snapshot);
    const acs = result.entities.filter(e => e.entity_type === 'E03');
    expect(acs.length).toBe(2901);
    expect(acs[0].instance_id).toMatch(/^AC-\d+\.\d+\.\d+$/);
  });
  
  // VERIFY-E12: Function extraction
  it('extracts functions from source files', async () => {
    const result = await astProvider.extract(snapshot);
    const functions = result.entities.filter(e => e.entity_type === 'E12');
    expect(functions.length).toBeGreaterThan(0);
    expect(functions[0].name).toBeDefined();
  });
  
  // Evidence anchor verification (flat provenance fields)
  it('all entities have provenance fields', async () => {
    const result = await brdProvider.extract(snapshot);
    for (const entity of result.entities) {
      expect(entity.source_file).toBeDefined();
      expect(entity.line_start).toBeGreaterThan(0);
    }
  });
  
  // Shadow ledger verification
  it('all extractions logged to shadow ledger', async () => {
    await brdProvider.extract(snapshot);
    const entries = await shadowLedger.getEntries();
    expect(entries.length).toBeGreaterThan(0);
    expect(entries[0].operation).toBe('CREATE');
  });
  
  // VERIFY-CORPUS-01: Semantic corpus initialization
  it('semantic corpus initialized', async () => {
    await semanticCorpus.initialize();
    const exists = await fs.access('semantic-corpus/signals.jsonl').then(() => true).catch(() => false);
    expect(exists).toBe(true);
  });
  
  // Semantic signal capture
  it('can capture semantic signals', async () => {
    await captureSemanticSignal({
      type: 'CORRECT',
      entity_id: 'EPIC-1',
      context: { test: true },
      evidence: {}
    });
    const signals = await semanticCorpus.getSignals();
    expect(signals.length).toBeGreaterThan(0);
  });
});
```

---

## Pillar Compliance

### Shadow Ledger
- [ ] Every entity creation logged
- [ ] Log format: JSONL with timestamp, operation, entity_id, evidence
- [ ] Log location: `shadow-ledger/ledger.jsonl`

### Semantic Learning
- [ ] Semantic corpus file created at `semantic-corpus/signals.jsonl`
- [ ] `captureSemanticSignal()` function exported
- [ ] Signal types defined: CORRECT, INCORRECT, PARTIAL, ORPHAN_MARKER, AMBIGUOUS
- [ ] Minimum 50 signals captured during this story (from extraction validation)

### API Boundary
- [ ] No direct database imports in extraction code
- [ ] All persistence through `@gnosis/api/v1`

### Extension Protocol
- [ ] N/A (base schema only)

---

## Verification Checklist

- [ ] All acceptance criteria implemented
- [ ] All VERIFY-* tests pass
- [ ] Code has `@implements STORY-64.1` marker
- [ ] Functions have `@satisfies AC-64.1.*` markers
- [ ] Shadow ledger entries recorded
- [ ] No direct database access from outside src/db/
- [ ] **Mission Alignment:** Confirm no oracle claims (confidence ≠ truth, alignment ≠ understanding)
- [ ] **No Placeholders:** All bracketed placeholders resolved to concrete values

---

## Definition of Done

- [ ] All 16 Track A entity types in scope (15 extractable; E14 Interface deferred)
- [ ] All entity instance_ids match format patterns (SANITY-003)
- [ ] Entity counts match external verification:
  - [ ] 65 Epics
  - [ ] 351 Stories
  - [ ] 2,901 Acceptance Criteria
- [ ] All tests pass
- [ ] Shadow ledger contains entries for all extractions
- [ ] Code reviewed (semantic signal captured)
- [ ] Committed with message: "STORY-64.1: Entity Registry"

---

## Next Story

→ `A2_RELATIONSHIP_REGISTRY.md`

---

## Ambiguity Resolution

If any specification is ambiguous:
1. **HALT** — do not choose among interpretations
2. Check canonical sources listed at top of this file
3. If still ambiguous, produce Ambiguity Report and await clarification

---

**END OF STORY A.1**
