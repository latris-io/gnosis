# Story A.1: Entity Registry

**Version:** 1.1.0  
**Implements:** STORY-64.1 (UTG Entity Extraction)  
**Track:** A  
**Duration:** 2-3 days  
**Canonical Sources:**
- BRD V20.6.3 §Epic 64, Story 64.1
- UTG Schema V20.6.1 §Entity Registry
- Verification Spec V20.6.4 §Part IX

---

## User Story

> As the Gnosis system, I need to extract and store all 16 Track A entity types from the codebase so that I have a complete structural inventory of what exists.

---

## Acceptance Criteria

| AC | Description | Pillar | Verification (REQUIRED) |
|----|-------------|--------|-------------------------|
| AC-64.1.1 | Extract Epic entities from BRD | Shadow Ledger | VERIFY-E01 |
| AC-64.1.2 | Extract Story entities from BRD | Shadow Ledger | VERIFY-E02 |
| AC-64.1.3 | Extract AcceptanceCriterion entities from BRD | Shadow Ledger | VERIFY-E03 |
| AC-64.1.4 | Extract Requirement entities from BRD | Shadow Ledger | VERIFY-E04 |
| AC-64.1.5 | Extract ArchitecturalDecision entities from ADRs | Shadow Ledger | VERIFY-E06 |
| AC-64.1.6 | Extract Component entities from module analysis | Shadow Ledger | VERIFY-E08 |
| AC-64.1.7 | Extract SourceFile entities from filesystem | Shadow Ledger | VERIFY-E11 |
| AC-64.1.8 | Extract Function entities from AST | Shadow Ledger | VERIFY-E12 |
| AC-64.1.9 | Extract Class entities from AST | Shadow Ledger | VERIFY-E13 |
| AC-64.1.10 | Extract Interface entities from AST | Shadow Ledger | VERIFY-E14 |
| AC-64.1.11 | Extract Module entities from imports | Shadow Ledger | VERIFY-E15 |
| AC-64.1.12 | Extract TestFile entities from test directory | Shadow Ledger | VERIFY-E27 |
| AC-64.1.13 | Extract TestSuite entities from describe blocks | Shadow Ledger | VERIFY-E28 |
| AC-64.1.14 | Extract TestCase entities from it blocks | Shadow Ledger | VERIFY-E29 |
| AC-64.1.15 | Extract ReleaseVersion entities from git tags | Shadow Ledger | VERIFY-E49 |
| AC-64.1.16 | Extract Commit entities from git log | Shadow Ledger | VERIFY-E50 |
| AC-64.1.17 | All extractions logged to shadow ledger | Shadow Ledger | RULE-LEDGER-001 |
| AC-64.1.18 | All entities have evidence anchors | Evidence | SANITY-044 |
| AC-64.1.19 | Semantic corpus initialized for Track C | Semantic Learning | VERIFY-CORPUS-01 |

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

export type EntityType = 
  | 'Epic' | 'Story' | 'AcceptanceCriterion' | 'Requirement'
  | 'ArchitecturalDecision' | 'Component'
  | 'SourceFile' | 'Function' | 'Class' | 'Interface' | 'Module'
  | 'TestFile' | 'TestSuite' | 'TestCase'
  | 'ReleaseVersion' | 'Commit' | 'ChangeSet';

export interface Entity {
  id: string;
  type: EntityType;
  attributes: Record<string, unknown>;
  evidence: EvidenceAnchor;
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

### Step 2: Create PostgreSQL Schema

```sql
-- migrations/001_entities.sql
-- @implements STORY-64.1
-- @satisfies AC-64.1.17

CREATE TABLE entities (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  attributes JSONB NOT NULL DEFAULT '{}',
  evidence JSONB NOT NULL,
  project_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policy
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;

CREATE POLICY entities_project_isolation ON entities
  USING (project_id = current_setting('app.project_id')::UUID);

-- Indexes
CREATE INDEX idx_entities_type ON entities(type);
CREATE INDEX idx_entities_project ON entities(project_id);
CREATE INDEX idx_entities_attributes ON entities USING GIN(attributes);
```

### Step 3: Implement BRD Parser (E01, E02, E03, E04)

```typescript
// src/extraction/providers/brd-provider.ts
// @implements STORY-64.1
// @satisfies AC-64.1.1, AC-64.1.2, AC-64.1.3, AC-64.1.4

import { ExtractionProvider, RepoSnapshot, ExtractionResult } from '../types';
import { parseBRD } from '../parsers/brd-parser';
import { createEvidenceAnchor } from '../evidence';

export class BRDProvider implements ExtractionProvider {
  name = 'brd-provider';
  
  supports(fileType: string): boolean {
    return fileType === 'brd' || fileType === 'md';
  }
  
  async extract(snapshot: RepoSnapshot): Promise<ExtractionResult> {
    const brdPath = `${snapshot.root_path}/docs/BRD_V20_6_3_COMPLETE.md`;
    const content = await fs.readFile(brdPath, 'utf8');
    const parsed = parseBRD(content);
    
    const entities: Entity[] = [];
    const evidence: EvidenceAnchor[] = [];
    
    // Extract Epics (E01)
    for (const epic of parsed.epics) {
      const anchor = createEvidenceAnchor(brdPath, epic.lineStart, epic.lineEnd, snapshot);
      entities.push({
        id: `EPIC-${epic.number}`,
        type: 'Epic',
        attributes: {
          number: epic.number,
          title: epic.title,
          description: epic.description
        },
        evidence: anchor
      });
      evidence.push(anchor);
    }
    
    // Extract Stories (E02)
    for (const story of parsed.stories) {
      const anchor = createEvidenceAnchor(brdPath, story.lineStart, story.lineEnd, snapshot);
      entities.push({
        id: `STORY-${story.epicNumber}.${story.storyNumber}`,
        type: 'Story',
        attributes: {
          epic_number: story.epicNumber,
          story_number: story.storyNumber,
          title: story.title,
          user_story: story.userStory
        },
        evidence: anchor
      });
      evidence.push(anchor);
    }
    
    // Extract Acceptance Criteria (E03)
    for (const ac of parsed.acceptanceCriteria) {
      const anchor = createEvidenceAnchor(brdPath, ac.lineStart, ac.lineEnd, snapshot);
      entities.push({
        id: `AC-${ac.epicNumber}.${ac.storyNumber}.${ac.acNumber}`,
        type: 'AcceptanceCriterion',
        attributes: {
          story_id: `STORY-${ac.epicNumber}.${ac.storyNumber}`,
          description: ac.description,
          verification: ac.verification
        },
        evidence: anchor
      });
      evidence.push(anchor);
    }
    
    return { entities, relationships: [], evidence };
  }
}
```

### Step 4: Implement AST Provider (E12, E13, E14)

```typescript
// src/extraction/providers/ast-provider.ts
// @implements STORY-64.1
// @satisfies AC-64.1.8, AC-64.1.9, AC-64.1.10

import { Project, SyntaxKind } from 'ts-morph';
import { ExtractionProvider, RepoSnapshot, ExtractionResult } from '../types';

export class ASTProvider implements ExtractionProvider {
  name = 'ast-provider';
  
  supports(fileType: string): boolean {
    return ['ts', 'tsx', 'js', 'jsx'].includes(fileType);
  }
  
  async extract(snapshot: RepoSnapshot): Promise<ExtractionResult> {
    const project = new Project();
    project.addSourceFilesAtPaths(`${snapshot.root_path}/src/**/*.{ts,tsx}`);
    
    const entities: Entity[] = [];
    const evidence: EvidenceAnchor[] = [];
    
    for (const sourceFile of project.getSourceFiles()) {
      const filePath = sourceFile.getFilePath();
      
      // Extract Functions (E12)
      for (const func of sourceFile.getFunctions()) {
        const anchor = createEvidenceAnchor(
          filePath,
          func.getStartLineNumber(),
          func.getEndLineNumber(),
          snapshot
        );
        entities.push({
          id: `function:${filePath}:${func.getName()}`,
          type: 'Function',
          attributes: {
            name: func.getName(),
            file_id: `file:${filePath}`,
            visibility: func.isExported() ? 'export' : 'private',
            parameters: func.getParameters().map(p => p.getName()),
            return_type: func.getReturnType().getText()
          },
          evidence: anchor
        });
      }
      
      // Extract Classes (E13)
      for (const cls of sourceFile.getClasses()) {
        const anchor = createEvidenceAnchor(
          filePath,
          cls.getStartLineNumber(),
          cls.getEndLineNumber(),
          snapshot
        );
        entities.push({
          id: `class:${filePath}:${cls.getName()}`,
          type: 'Class',
          attributes: {
            name: cls.getName(),
            file_id: `file:${filePath}`,
            visibility: cls.isExported() ? 'export' : 'private',
            extends: cls.getExtends()?.getText(),
            implements: cls.getImplements().map(i => i.getText())
          },
          evidence: anchor
        });
      }
      
      // Extract Interfaces (E14)
      for (const iface of sourceFile.getInterfaces()) {
        const anchor = createEvidenceAnchor(
          filePath,
          iface.getStartLineNumber(),
          iface.getEndLineNumber(),
          snapshot
        );
        entities.push({
          id: `interface:${filePath}:${iface.getName()}`,
          type: 'Interface',
          attributes: {
            name: iface.getName(),
            file_id: `file:${filePath}`,
            visibility: iface.isExported() ? 'export' : 'private',
            extends: iface.getExtends().map(e => e.getText())
          },
          evidence: anchor
        });
      }
    }
    
    return { entities, relationships: [], evidence };
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
// @satisfies AC-64.1.19

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

### Step 6: Create Graph API v1 Entity Operations

```typescript
// src/api/v1/entities.ts
// @implements STORY-64.1
// @satisfies AC-64.1.1 through AC-64.1.16

import { GraphAPI } from './index';
import { shadowLedger } from '../../ledger/shadow-ledger';
import { pool } from '../../db/postgres';
import { getSession } from '../../db/neo4j';

export async function createEntity(entity: Entity): Promise<Entity> {
  // Log to shadow ledger first
  await shadowLedger.append({
    timestamp: new Date(),
    operation: 'CREATE',
    entity_type: entity.type,
    entity_id: entity.id,
    evidence: entity.evidence,
    hash: computeHash(entity)
  });
  
  // Insert into PostgreSQL
  const result = await pool.query(
    `INSERT INTO entities (id, type, attributes, evidence, project_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [entity.id, entity.type, entity.attributes, entity.evidence, projectId]
  );
  
  // Insert into Neo4j for graph traversal
  const session = getSession();
  await session.run(
    `CREATE (e:Entity {id: $id, type: $type})`,
    { id: entity.id, type: entity.type }
  );
  await session.close();
  
  return result.rows[0];
}

export async function getEntity(id: string): Promise<Entity | null> {
  const result = await pool.query(
    `SELECT * FROM entities WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

export async function queryEntities(type: EntityType): Promise<Entity[]> {
  const result = await pool.query(
    `SELECT * FROM entities WHERE type = $1`,
    [type]
  );
  return result.rows;
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
| `src/extraction/providers/filesystem-provider.ts` | File enumeration | ~80 |
| `src/extraction/parsers/brd-parser.ts` | BRD markdown parsing | ~200 |
| `src/extraction/evidence.ts` | Evidence anchor creation | ~30 |
| `src/ledger/shadow-ledger.ts` | JSONL ledger | ~60 |
| `src/ledger/semantic-corpus.ts` | Semantic signals for Track C | ~80 |
| `src/api/v1/entities.ts` | Entity CRUD operations | ~100 |
| `migrations/001_entities.sql` | PostgreSQL schema | ~30 |
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
    const epics = result.entities.filter(e => e.type === 'Epic');
    expect(epics.length).toBe(65);
    expect(epics[0].id).toMatch(/^EPIC-\d+$/);
  });
  
  // VERIFY-E02: Story extraction
  it('extracts all stories from BRD', async () => {
    const result = await brdProvider.extract(snapshot);
    const stories = result.entities.filter(e => e.type === 'Story');
    expect(stories.length).toBe(351);
    expect(stories[0].id).toMatch(/^STORY-\d+\.\d+$/);
  });
  
  // VERIFY-E03: AC extraction
  it('extracts all acceptance criteria from BRD', async () => {
    const result = await brdProvider.extract(snapshot);
    const acs = result.entities.filter(e => e.type === 'AcceptanceCriterion');
    expect(acs.length).toBe(2901);
    expect(acs[0].id).toMatch(/^AC-\d+\.\d+\.\d+$/);
  });
  
  // VERIFY-E12: Function extraction
  it('extracts functions from source files', async () => {
    const result = await astProvider.extract(snapshot);
    const functions = result.entities.filter(e => e.type === 'Function');
    expect(functions.length).toBeGreaterThan(0);
    expect(functions[0].attributes.name).toBeDefined();
  });
  
  // Evidence anchor verification
  it('all entities have evidence anchors', async () => {
    const result = await brdProvider.extract(snapshot);
    for (const entity of result.entities) {
      expect(entity.evidence).toBeDefined();
      expect(entity.evidence.source_file).toBeDefined();
      expect(entity.evidence.line_start).toBeGreaterThan(0);
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
- [ ] Minimum 10 signals captured during this story (from extraction validation)

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

- [ ] All 16 entity types extractable
- [ ] All entity IDs match format patterns (SANITY-003)
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
