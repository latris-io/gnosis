# Story A.2: Relationship Registry

**Version:** 1.0.0  
**Implements:** STORY-64.2 (UTG Relationship Extraction)  
**Track:** A  
**Duration:** 2-3 days  
**Canonical Sources:**
- BRD V20.6.3 §Epic 64, Story 64.2
- UTG Schema V20.6.1 §Relationship Registry
- Verification Spec V20.6.4 §Part IX

---

## User Story

> As the Gnosis system, I need to extract and store all 21 Track A relationship types between entities so that I can traverse the structural connections in my codebase.

---

## Acceptance Criteria

| AC | Description | Pillar | Verification (REQUIRED) |
|----|-------------|--------|-------------------------|
| AC-64.2.1 | Extract CONTAINS (Epic→Story) | Shadow Ledger | VERIFY-R01 |
| AC-64.2.2 | Extract CONTAINS (Story→AC) | Shadow Ledger | VERIFY-R02 |
| AC-64.2.3 | Extract SATISFIES (AC→Requirement) | Shadow Ledger | VERIFY-R03 |
| AC-64.2.4 | Extract DERIVES_FROM (Req→Req) | Shadow Ledger | VERIFY-R04 |
| AC-64.2.5 | Extract CONFLICTS_WITH (Req→Req) | Shadow Ledger | VERIFY-R05 |
| AC-64.2.6 | Extract DECIDES (ADR→Component) | Shadow Ledger | VERIFY-R10 |
| AC-64.2.7 | Extract COMPONENT_OF (Comp→Comp) | Shadow Ledger | VERIFY-R11 |
| AC-64.2.8 | Extract IMPORTS (File→File) | Shadow Ledger | VERIFY-R21 |
| AC-64.2.9 | Extract CALLS (Func→Func) | Shadow Ledger | VERIFY-R22 |
| AC-64.2.10 | Extract EXTENDS (Class→Class) | Shadow Ledger | VERIFY-R23 |
| AC-64.2.11 | Extract IMPLEMENTS_INTERFACE (Class→Interface) | Shadow Ledger | VERIFY-R24 |
| AC-64.2.12 | Extract DEFINES (File→Func/Class/Interface) | Shadow Ledger | VERIFY-R25 |
| AC-64.2.13 | Extract DEPENDS_ON (Module→Module) | Shadow Ledger | VERIFY-R26 |
| AC-64.2.14 | Extract CONTAINS (TestFile→TestSuite) | Shadow Ledger | VERIFY-R40 |
| AC-64.2.15 | Extract CONTAINS (TestSuite→TestCase) | Shadow Ledger | VERIFY-R41 |
| AC-64.2.16 | Extract TESTS (TestCase→Function) | Shadow Ledger | VERIFY-R42 |
| AC-64.2.17 | Extract TESTS (TestCase→AC) | Shadow Ledger | VERIFY-R43 |
| AC-64.2.18 | Extract COVERS (TestSuite→Story) | Shadow Ledger | VERIFY-R44 |
| AC-64.2.19 | Extract VERIFIES (TestCase→Requirement) | Shadow Ledger | VERIFY-R45 |
| AC-64.2.20 | Extract RELEASED_IN (Commit→Release) | Shadow Ledger | VERIFY-R60 |
| AC-64.2.21 | Extract CHANGES (Commit→File) | Shadow Ledger | VERIFY-R61 |
| AC-64.2.22 | All relationships logged to shadow ledger | Shadow Ledger | RULE-LEDGER-002 |
| AC-64.2.23 | All relationships have evidence anchors | Evidence | SANITY-044 |

---

## Entry Criteria

- [ ] Story A.1 (Entity Registry) complete
- [ ] All 16 entity types extractable
- [ ] Entity extraction tests pass
- [ ] Shadow ledger operational

---

## Implementation Steps

### Step 1: Create Relationship Type Definitions

```typescript
// src/relationships/types.ts
// @implements STORY-64.2

export type RelationshipType =
  // Requirements (R01-R05)
  | 'CONTAINS' | 'SATISFIES' | 'DERIVES_FROM' | 'CONFLICTS_WITH'
  // Design (R10-R11)
  | 'DECIDES' | 'COMPONENT_OF'
  // Implementation (R21-R26)
  | 'IMPORTS' | 'CALLS' | 'EXTENDS' | 'IMPLEMENTS_INTERFACE' | 'DEFINES' | 'DEPENDS_ON'
  // Verification (R40-R45)
  | 'TESTS' | 'COVERS' | 'VERIFIES'
  // Provenance (R60-R61)
  | 'RELEASED_IN' | 'CHANGES';

export interface Relationship {
  id: string;
  type: RelationshipType;
  source_id: string;
  target_id: string;
  attributes: Record<string, unknown>;
  evidence: EvidenceAnchor;
  created_at: Date;
  updated_at: Date;
}

export interface RelationshipDefinition {
  type: RelationshipType;
  source_type: EntityType;
  target_type: EntityType;
  cardinality: '1:1' | '1:N' | 'N:1' | 'N:M';
}

// Track A Relationship Definitions (21 total)
export const TRACK_A_RELATIONSHIPS: RelationshipDefinition[] = [
  { type: 'CONTAINS', source_type: 'Epic', target_type: 'Story', cardinality: '1:N' },
  { type: 'CONTAINS', source_type: 'Story', target_type: 'AcceptanceCriterion', cardinality: '1:N' },
  { type: 'SATISFIES', source_type: 'AcceptanceCriterion', target_type: 'Requirement', cardinality: 'N:M' },
  { type: 'DERIVES_FROM', source_type: 'Requirement', target_type: 'Requirement', cardinality: 'N:M' },
  { type: 'CONFLICTS_WITH', source_type: 'Requirement', target_type: 'Requirement', cardinality: 'N:M' },
  { type: 'DECIDES', source_type: 'ArchitecturalDecision', target_type: 'Component', cardinality: 'N:M' },
  { type: 'COMPONENT_OF', source_type: 'Component', target_type: 'Component', cardinality: 'N:1' },
  { type: 'IMPORTS', source_type: 'SourceFile', target_type: 'SourceFile', cardinality: 'N:M' },
  { type: 'CALLS', source_type: 'Function', target_type: 'Function', cardinality: 'N:M' },
  { type: 'EXTENDS', source_type: 'Class', target_type: 'Class', cardinality: 'N:1' },
  { type: 'IMPLEMENTS_INTERFACE', source_type: 'Class', target_type: 'Interface', cardinality: 'N:M' },
  { type: 'DEFINES', source_type: 'SourceFile', target_type: 'Function', cardinality: '1:N' },
  { type: 'DEPENDS_ON', source_type: 'Module', target_type: 'Module', cardinality: 'N:M' },
  { type: 'CONTAINS', source_type: 'TestFile', target_type: 'TestSuite', cardinality: '1:N' },
  { type: 'CONTAINS', source_type: 'TestSuite', target_type: 'TestCase', cardinality: '1:N' },
  { type: 'TESTS', source_type: 'TestCase', target_type: 'Function', cardinality: 'N:M' },
  { type: 'TESTS', source_type: 'TestCase', target_type: 'AcceptanceCriterion', cardinality: 'N:M' },
  { type: 'COVERS', source_type: 'TestSuite', target_type: 'Story', cardinality: 'N:M' },
  { type: 'VERIFIES', source_type: 'TestCase', target_type: 'Requirement', cardinality: 'N:M' },
  { type: 'RELEASED_IN', source_type: 'Commit', target_type: 'ReleaseVersion', cardinality: 'N:1' },
  { type: 'CHANGES', source_type: 'Commit', target_type: 'SourceFile', cardinality: 'N:M' },
];
```

### Step 2: Create PostgreSQL Schema

```sql
-- migrations/002_relationships.sql
-- @implements STORY-64.2
-- @satisfies AC-64.2.22

CREATE TABLE relationships (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  source_id TEXT NOT NULL REFERENCES entities(id),
  target_id TEXT NOT NULL REFERENCES entities(id),
  attributes JSONB NOT NULL DEFAULT '{}',
  evidence JSONB NOT NULL,
  project_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policy
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY relationships_project_isolation ON relationships
  USING (project_id = current_setting('app.project_id')::UUID);

-- Indexes
CREATE INDEX idx_relationships_type ON relationships(type);
CREATE INDEX idx_relationships_source ON relationships(source_id);
CREATE INDEX idx_relationships_target ON relationships(target_id);
CREATE INDEX idx_relationships_project ON relationships(project_id);

-- Unique constraint per relationship instance
CREATE UNIQUE INDEX idx_relationships_unique 
  ON relationships(type, source_id, target_id);
```

### Step 3: Implement BRD Relationship Extraction (R01, R02)

```typescript
// src/extraction/providers/brd-relationship-provider.ts
// @implements STORY-64.2
// @satisfies AC-64.2.1, AC-64.2.2

export class BRDRelationshipProvider implements ExtractionProvider {
  name = 'brd-relationship-provider';
  
  async extract(snapshot: RepoSnapshot): Promise<ExtractionResult> {
    const entities = await getEntities(['Epic', 'Story', 'AcceptanceCriterion']);
    const relationships: Relationship[] = [];
    
    // R01: Epic CONTAINS Story
    for (const story of entities.filter(e => e.type === 'Story')) {
      const epicNumber = story.attributes.epic_number;
      const epicId = `EPIC-${epicNumber}`;
      
      relationships.push({
        id: `R01:${epicId}:${story.id}`,
        type: 'CONTAINS',
        source_id: epicId,
        target_id: story.id,
        attributes: { relationship_code: 'R01' },
        evidence: story.evidence
      });
    }
    
    // R02: Story CONTAINS AcceptanceCriterion
    for (const ac of entities.filter(e => e.type === 'AcceptanceCriterion')) {
      const storyId = ac.attributes.story_id;
      
      relationships.push({
        id: `R02:${storyId}:${ac.id}`,
        type: 'CONTAINS',
        source_id: storyId,
        target_id: ac.id,
        attributes: { relationship_code: 'R02' },
        evidence: ac.evidence
      });
    }
    
    return { entities: [], relationships, evidence: [] };
  }
}
```

### Step 4: Implement AST Relationship Extraction (R21-R26)

```typescript
// src/extraction/providers/ast-relationship-provider.ts
// @implements STORY-64.2
// @satisfies AC-64.2.8, AC-64.2.9, AC-64.2.10, AC-64.2.11, AC-64.2.12, AC-64.2.13

export class ASTRelationshipProvider implements ExtractionProvider {
  name = 'ast-relationship-provider';
  
  async extract(snapshot: RepoSnapshot): Promise<ExtractionResult> {
    const project = new Project();
    project.addSourceFilesAtPaths(`${snapshot.root_path}/src/**/*.{ts,tsx}`);
    
    const relationships: Relationship[] = [];
    
    for (const sourceFile of project.getSourceFiles()) {
      const filePath = sourceFile.getFilePath();
      const fileId = `file:${filePath}`;
      
      // R21: IMPORTS
      for (const imp of sourceFile.getImportDeclarations()) {
        const moduleSpecifier = imp.getModuleSpecifierValue();
        const targetFileId = resolveModulePath(filePath, moduleSpecifier);
        
        if (targetFileId) {
          relationships.push({
            id: `R21:${fileId}:${targetFileId}`,
            type: 'IMPORTS',
            source_id: fileId,
            target_id: targetFileId,
            attributes: { 
              relationship_code: 'R21',
              import_type: imp.isTypeOnly() ? 'type' : 'value'
            },
            evidence: createEvidenceAnchor(filePath, imp.getStartLineNumber(), imp.getEndLineNumber(), snapshot)
          });
        }
      }
      
      // R22: CALLS
      for (const func of sourceFile.getFunctions()) {
        const funcId = `function:${filePath}:${func.getName()}`;
        const callExpressions = func.getDescendantsOfKind(SyntaxKind.CallExpression);
        
        for (const call of callExpressions) {
          const calledFuncName = call.getExpression().getText();
          const targetFuncId = resolveFunctionCall(filePath, calledFuncName);
          
          if (targetFuncId) {
            relationships.push({
              id: `R22:${funcId}:${targetFuncId}`,
              type: 'CALLS',
              source_id: funcId,
              target_id: targetFuncId,
              attributes: { relationship_code: 'R22' },
              evidence: createEvidenceAnchor(filePath, call.getStartLineNumber(), call.getEndLineNumber(), snapshot)
            });
          }
        }
      }
      
      // R23: EXTENDS
      for (const cls of sourceFile.getClasses()) {
        const classId = `class:${filePath}:${cls.getName()}`;
        const extendsClause = cls.getExtends();
        
        if (extendsClause) {
          const baseClassName = extendsClause.getText();
          const baseClassId = resolveClassName(filePath, baseClassName);
          
          if (baseClassId) {
            relationships.push({
              id: `R23:${classId}:${baseClassId}`,
              type: 'EXTENDS',
              source_id: classId,
              target_id: baseClassId,
              attributes: { relationship_code: 'R23' },
              evidence: createEvidenceAnchor(filePath, extendsClause.getStartLineNumber(), extendsClause.getEndLineNumber(), snapshot)
            });
          }
        }
      }
      
      // R24: IMPLEMENTS_INTERFACE
      for (const cls of sourceFile.getClasses()) {
        const classId = `class:${filePath}:${cls.getName()}`;
        
        for (const impl of cls.getImplements()) {
          const interfaceName = impl.getText();
          const interfaceId = resolveInterfaceName(filePath, interfaceName);
          
          if (interfaceId) {
            relationships.push({
              id: `R24:${classId}:${interfaceId}`,
              type: 'IMPLEMENTS_INTERFACE',
              source_id: classId,
              target_id: interfaceId,
              attributes: { relationship_code: 'R24' },
              evidence: createEvidenceAnchor(filePath, impl.getStartLineNumber(), impl.getEndLineNumber(), snapshot)
            });
          }
        }
      }
      
      // R25: DEFINES
      for (const func of sourceFile.getFunctions()) {
        const funcId = `function:${filePath}:${func.getName()}`;
        relationships.push({
          id: `R25:${fileId}:${funcId}`,
          type: 'DEFINES',
          source_id: fileId,
          target_id: funcId,
          attributes: { relationship_code: 'R25' },
          evidence: createEvidenceAnchor(filePath, func.getStartLineNumber(), func.getEndLineNumber(), snapshot)
        });
      }
      
      for (const cls of sourceFile.getClasses()) {
        const classId = `class:${filePath}:${cls.getName()}`;
        relationships.push({
          id: `R25:${fileId}:${classId}`,
          type: 'DEFINES',
          source_id: fileId,
          target_id: classId,
          attributes: { relationship_code: 'R25' },
          evidence: createEvidenceAnchor(filePath, cls.getStartLineNumber(), cls.getEndLineNumber(), snapshot)
        });
      }
    }
    
    return { entities: [], relationships, evidence: [] };
  }
}
```

### Step 5: Create Graph API v1 Relationship Operations

```typescript
// src/api/v1/relationships.ts
// @implements STORY-64.2
// @satisfies AC-64.2.1 through AC-64.2.21

export async function createRelationship(rel: Relationship): Promise<Relationship> {
  // Log to shadow ledger first
  await shadowLedger.append({
    timestamp: new Date(),
    operation: 'CREATE',
    entity_type: `relationship:${rel.type}`,
    entity_id: rel.id,
    evidence: rel.evidence,
    hash: computeHash(rel)
  });
  
  // Insert into PostgreSQL
  const result = await pool.query(
    `INSERT INTO relationships (id, type, source_id, target_id, attributes, evidence, project_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [rel.id, rel.type, rel.source_id, rel.target_id, rel.attributes, rel.evidence, projectId]
  );
  
  // Insert into Neo4j for graph traversal
  await neo4jSession.run(
    `MATCH (s:Entity {id: $source_id}), (t:Entity {id: $target_id})
     CREATE (s)-[r:${rel.type} {id: $id}]->(t)`,
    { id: rel.id, source_id: rel.source_id, target_id: rel.target_id }
  );
  
  return result.rows[0];
}

export async function getRelationship(id: string): Promise<Relationship | null> {
  const result = await pool.query(
    `SELECT * FROM relationships WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

export async function queryRelationships(
  type: RelationshipType,
  sourceId?: string,
  targetId?: string
): Promise<Relationship[]> {
  let query = `SELECT * FROM relationships WHERE type = $1`;
  const params: unknown[] = [type];
  
  if (sourceId) {
    params.push(sourceId);
    query += ` AND source_id = $${params.length}`;
  }
  
  if (targetId) {
    params.push(targetId);
    query += ` AND target_id = $${params.length}`;
  }
  
  const result = await pool.query(query, params);
  return result.rows;
}

export async function traverseGraph(
  startId: string,
  relationshipTypes: RelationshipType[],
  direction: 'outgoing' | 'incoming' | 'both',
  maxDepth: number = 3
): Promise<Entity[]> {
  const directionClause = direction === 'outgoing' ? '-[r]->' 
    : direction === 'incoming' ? '<-[r]-'
    : '-[r]-';
  
  const result = await neo4jSession.run(
    `MATCH (start:Entity {id: $startId})${directionClause}(end:Entity)
     WHERE type(r) IN $types
     RETURN DISTINCT end.id as id
     LIMIT 100`,
    { startId, types: relationshipTypes }
  );
  
  const entityIds = result.records.map(r => r.get('id'));
  return getEntitiesByIds(entityIds);
}
```

---

## Files to Create

| File | Purpose | Lines |
|------|---------|-------|
| `src/relationships/types.ts` | Relationship type definitions | ~80 |
| `src/extraction/providers/brd-relationship-provider.ts` | BRD relationships | ~80 |
| `src/extraction/providers/ast-relationship-provider.ts` | AST relationships | ~200 |
| `src/extraction/providers/test-relationship-provider.ts` | Test relationships | ~120 |
| `src/extraction/providers/git-relationship-provider.ts` | Git relationships | ~80 |
| `src/api/v1/relationships.ts` | Relationship CRUD | ~150 |
| `migrations/002_relationships.sql` | PostgreSQL schema | ~30 |
| `test/relationships/relationship-registry.test.ts` | Relationship tests | ~250 |

---

## Verification Tests

```typescript
// test/relationships/relationship-registry.test.ts
// @implements STORY-64.2

describe('Relationship Registry', () => {
  // VERIFY-R01: Epic CONTAINS Story
  it('extracts Epic→Story relationships', async () => {
    const rels = await queryRelationships('CONTAINS');
    const epicToStory = rels.filter(r => 
      r.source_id.startsWith('EPIC-') && r.target_id.startsWith('STORY-')
    );
    expect(epicToStory.length).toBe(351); // One per story
  });
  
  // VERIFY-R02: Story CONTAINS AC
  it('extracts Story→AC relationships', async () => {
    const rels = await queryRelationships('CONTAINS');
    const storyToAC = rels.filter(r => 
      r.source_id.startsWith('STORY-') && r.target_id.startsWith('AC-')
    );
    expect(storyToAC.length).toBe(2901); // One per AC
  });
  
  // VERIFY-R21: IMPORTS
  it('extracts file import relationships', async () => {
    const rels = await queryRelationships('IMPORTS');
    expect(rels.length).toBeGreaterThan(0);
    expect(rels[0].source_id).toMatch(/^file:/);
    expect(rels[0].target_id).toMatch(/^file:/);
  });
  
  // VERIFY-R22: CALLS
  it('extracts function call relationships', async () => {
    const rels = await queryRelationships('CALLS');
    expect(rels.length).toBeGreaterThan(0);
    expect(rels[0].source_id).toMatch(/^function:/);
    expect(rels[0].target_id).toMatch(/^function:/);
  });
  
  // Evidence verification
  it('all relationships have evidence anchors', async () => {
    const rels = await pool.query('SELECT * FROM relationships LIMIT 100');
    for (const rel of rels.rows) {
      expect(rel.evidence).toBeDefined();
      expect(rel.evidence.source_file).toBeDefined();
    }
  });
  
  // Graph traversal
  it('can traverse relationships in Neo4j', async () => {
    const entities = await traverseGraph('EPIC-64', ['CONTAINS'], 'outgoing', 2);
    expect(entities.length).toBeGreaterThan(0);
  });
});
```

---

## Verification Checklist

- [ ] All acceptance criteria implemented
- [ ] All VERIFY-R* tests pass
- [ ] Code has `@implements STORY-64.2` marker
- [ ] Functions have `@satisfies AC-64.2.*` markers
- [ ] Shadow ledger entries recorded for all relationships
- [ ] No direct database access from outside src/db/
- [ ] **Mission Alignment:** Confirm no oracle claims (confidence ≠ truth, alignment ≠ understanding)
- [ ] **No Placeholders:** All bracketed placeholders resolved to concrete values

---

## Definition of Done

- [ ] All 21 relationship types extractable
- [ ] Relationship counts validate against entities:
  - [ ] 351 Epic→Story CONTAINS
  - [ ] 2,901 Story→AC CONTAINS
- [ ] All tests pass
- [ ] Neo4j traversal operational
- [ ] Shadow ledger contains entries for all relationships
- [ ] Committed with message: "STORY-64.2: Relationship Registry"

---

## Next Story

→ `A3_MARKER_EXTRACTION.md`

---

**END OF STORY A.2**
