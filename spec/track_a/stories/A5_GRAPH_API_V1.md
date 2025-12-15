# Story A.5: Graph API v1

**Version:** 1.0.0  
**Implements:** STORY-64.5 (Graph API v1)  
**Track:** A  
**Duration:** 2-3 days  
**Canonical Sources:**
- BRD V20.6.3 §Epic 64, Story 64.5
- UTG Schema V20.6.1 §API Specification
- Verification Spec V20.6.4 §8.3 (G-API)

---

## User Story

> As the Gnosis system, I need a versioned Graph API that provides CRUD operations, traversal queries, and impact analysis so that all graph access goes through a controlled boundary.

---

## Acceptance Criteria

| AC | Description | Pillar | Verification (REQUIRED) |
|----|-------------|--------|-------------------------|
| AC-64.5.1 | Entity CRUD operations | API Boundary | VERIFY-API-01 |
| AC-64.5.2 | Relationship CRUD operations | API Boundary | VERIFY-API-02 |
| AC-64.5.3 | Type-safe query interface | API Boundary | VERIFY-API-03 |
| AC-64.5.4 | Graph traversal operations | API Boundary | VERIFY-API-04 |
| AC-64.5.5 | Impact analysis queries | API Boundary | VERIFY-API-05 |
| AC-64.5.6 | Coverage queries | API Boundary | VERIFY-API-06 |
| AC-64.5.7 | All operations logged to shadow ledger | Shadow Ledger | RULE-LEDGER-005 |
| AC-64.5.8 | API versioning (v1 namespace) | API Boundary | VERIFY-API-07 |
| AC-64.5.9 | No direct database access outside API | API Boundary | G-API |
| AC-64.5.10 | Pagination for large result sets | API Boundary | VERIFY-API-08 |

---

## Entry Criteria

- [ ] Story A.1 (Entity Registry) complete
- [ ] Story A.2 (Relationship Registry) complete
- [ ] Story A.3 (Marker Extraction) complete
- [ ] Story A.4 (Structural Analysis) complete
- [ ] Database schemas deployed
- [ ] Neo4j constraints created

---

## API Structure

```
@gnosis/api/v1
├── entities.ts      # Entity CRUD
├── relationships.ts # Relationship CRUD
├── queries.ts       # Query operations
├── traversal.ts     # Graph traversal
├── impact.ts        # Impact analysis
├── coverage.ts      # Coverage queries
└── index.ts         # Public exports
```

---

## Implementation Steps

### Step 1: Create API Types

```typescript
// src/api/v1/types.ts
// @implements STORY-64.5

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface TraversalOptions {
  direction: 'outgoing' | 'incoming' | 'both';
  maxDepth: number;
  relationshipTypes?: RelationshipTypeCode[];
  entityTypes?: EntityTypeCode[];
}

export interface ImpactResult {
  affected_entities: Entity[];
  affected_relationships: Relationship[];
  impact_score: number;
  traversal_depth: number;
}

export interface CoverageResult {
  total: number;
  covered: number;
  uncovered: number;
  percentage: number;
  uncovered_items: string[];
}
```

### Step 2: Implement Entity API

```typescript
// src/api/v1/entities.ts
// @implements STORY-64.5
// @satisfies AC-64.5.1, AC-64.5.7, AC-64.5.10

import { pool, neo4jSession } from '../../db';
import { shadowLedger } from '../../ledger';
import { Entity, EntityTypeCode, QueryOptions, PaginatedResult } from './types';

// CREATE
export async function createEntity(entity: Entity): Promise<Entity> {
  // Log to shadow ledger FIRST
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
    `INSERT INTO entities (id, type, attributes, evidence, project_id, created_at, updated_at)
     VALUES ($1, $2, $3, $4, current_setting('app.project_id')::UUID, NOW(), NOW())
     RETURNING *`,
    [entity.id, entity.type, entity.attributes, entity.evidence]
  );
  
  // Insert into Neo4j
  await neo4jSession.run(
    `CREATE (e:Entity:${entity.type} {id: $id, type: $type})`,
    { id: entity.id, type: entity.type }
  );
  
  return result.rows[0];
}

// READ
export async function getEntity(id: string): Promise<Entity | null> {
  const result = await pool.query(
    `SELECT * FROM entities WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

// UPDATE
export async function updateEntity(id: string, updates: Partial<Entity>): Promise<Entity> {
  const existing = await getEntity(id);
  if (!existing) {
    throw new Error(`Entity ${id} not found`);
  }
  
  // Log to shadow ledger
  await shadowLedger.append({
    timestamp: new Date(),
    operation: 'UPDATE',
    entity_type: existing.type,
    entity_id: id,
    evidence: { before: existing, after: updates },
    hash: computeHash({ id, updates })
  });
  
  const result = await pool.query(
    `UPDATE entities 
     SET attributes = COALESCE($1, attributes),
         evidence = COALESCE($2, evidence),
         updated_at = NOW()
     WHERE id = $3
     RETURNING *`,
    [updates.attributes, updates.evidence, id]
  );
  
  return result.rows[0];
}

// DELETE
export async function deleteEntity(id: string): Promise<void> {
  const existing = await getEntity(id);
  if (!existing) {
    throw new Error(`Entity ${id} not found`);
  }
  
  // Log to shadow ledger
  await shadowLedger.append({
    timestamp: new Date(),
    operation: 'DELETE',
    entity_type: existing.type,
    entity_id: id,
    evidence: existing,
    hash: computeHash(existing)
  });
  
  // Delete from Neo4j first (due to relationships)
  await neo4jSession.run(
    `MATCH (e:Entity {id: $id}) DETACH DELETE e`,
    { id }
  );
  
  // Delete from PostgreSQL
  await pool.query(`DELETE FROM entities WHERE id = $1`, [id]);
}

// QUERY with pagination
export async function queryEntities(
  entityType?: EntityTypeCode,
  options: QueryOptions = {}
): Promise<PaginatedResult<Entity>> {
  const { limit = 100, offset = 0, orderBy = 'created_at', orderDirection = 'desc' } = options;
  
  let query = `SELECT * FROM entities`;
  let countQuery = `SELECT COUNT(*) FROM entities`;
  const params: unknown[] = [];
  
  if (entityType) {
    query += ` WHERE entity_type = $1`;
    countQuery += ` WHERE entity_type = $1`;
    params.push(entityType);
  }
  
  query += ` ORDER BY ${orderBy} ${orderDirection} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);
  
  const [result, countResult] = await Promise.all([
    pool.query(query, params),
    pool.query(countQuery, entityType ? [entityType] : [])
  ]);
  
  const total = parseInt(countResult.rows[0].count);
  
  return {
    data: result.rows,
    total,
    limit,
    offset,
    hasMore: offset + result.rows.length < total
  };
}

// BATCH operations
export async function createEntities(entities: Entity[]): Promise<Entity[]> {
  const results: Entity[] = [];
  
  // Use transaction for atomicity
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    for (const entity of entities) {
      const result = await createEntity(entity);
      results.push(result);
    }
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
  
  return results;
}
```

### Step 3: Implement Traversal API

```typescript
// src/api/v1/traversal.ts
// @implements STORY-64.5
// @satisfies AC-64.5.4

export async function traverse(
  startId: string,
  options: TraversalOptions
): Promise<Entity[]> {
  const { direction, maxDepth, relationshipTypes, entityTypes } = options;
  
  // Build Cypher query
  const directionClause = direction === 'outgoing' ? '-[r]->'
    : direction === 'incoming' ? '<-[r]-'
    : '-[r]-';
  
  let whereClause = '';
  const params: Record<string, unknown> = { startId, maxDepth };
  
  if (relationshipTypes?.length) {
    whereClause += ` AND type(r) IN $relTypes`;
    params.relTypes = relationshipTypes;
  }
  
  if (entityTypes?.length) {
    whereClause += ` AND end.type IN $entityTypes`;
    params.entityTypes = entityTypes;
  }
  
  const result = await neo4jSession.run(`
    MATCH path = (start:Entity {id: $startId})${directionClause}(end:Entity)
    WHERE length(path) <= $maxDepth ${whereClause}
    RETURN DISTINCT end.id as id
    LIMIT 1000
  `, params);
  
  const entityIds = result.records.map(r => r.get('id'));
  
  // Fetch full entities from PostgreSQL
  if (entityIds.length === 0) return [];
  
  const pgResult = await pool.query(
    `SELECT * FROM entities WHERE id = ANY($1)`,
    [entityIds]
  );
  
  return pgResult.rows;
}

export async function findPath(
  fromId: string,
  toId: string,
  maxDepth: number = 10
): Promise<Array<Entity | Relationship>> {
  const result = await neo4jSession.run(`
    MATCH path = shortestPath((from:Entity {id: $fromId})-[*..${maxDepth}]-(to:Entity {id: $toId}))
    RETURN [node IN nodes(path) | node.id] as nodeIds,
           [rel IN relationships(path) | rel.id] as relIds
  `, { fromId, toId });
  
  if (result.records.length === 0) {
    return [];
  }
  
  const nodeIds = result.records[0].get('nodeIds');
  const relIds = result.records[0].get('relIds');
  
  const [entities, relationships] = await Promise.all([
    pool.query(`SELECT * FROM entities WHERE id = ANY($1)`, [nodeIds]),
    pool.query(`SELECT * FROM relationships WHERE id = ANY($1)`, [relIds])
  ]);
  
  // Interleave entities and relationships in path order
  const path: Array<Entity | Relationship> = [];
  for (let i = 0; i < nodeIds.length; i++) {
    path.push(entities.rows.find(e => e.id === nodeIds[i]));
    if (i < relIds.length) {
      path.push(relationships.rows.find(r => r.id === relIds[i]));
    }
  }
  
  return path;
}

export async function getNeighbors(
  entityId: string,
  depth: number = 1
): Promise<{ entities: Entity[]; relationships: Relationship[] }> {
  const result = await neo4jSession.run(`
    MATCH (start:Entity {id: $entityId})-[r]-(neighbor:Entity)
    WHERE length(shortestPath((start)-[*..${depth}]-(neighbor))) <= ${depth}
    RETURN DISTINCT neighbor.id as entityId, r.id as relId
    LIMIT 500
  `, { entityId });
  
  const entityIds = result.records.map(r => r.get('entityId'));
  const relIds = result.records.map(r => r.get('relId'));
  
  const [entities, relationships] = await Promise.all([
    pool.query(`SELECT * FROM entities WHERE id = ANY($1)`, [entityIds]),
    pool.query(`SELECT * FROM relationships WHERE id = ANY($1)`, [relIds])
  ]);
  
  return {
    entities: entities.rows,
    relationships: relationships.rows
  };
}
```

### Step 4: Implement Impact Analysis API

```typescript
// src/api/v1/impact.ts
// @implements STORY-64.5
// @satisfies AC-64.5.5

export async function analyzeImpact(
  entityId: string,
  maxDepth: number = 5
): Promise<ImpactResult> {
  // Find all entities that could be affected by changes to this entity
  const affected = await traverse(entityId, {
    direction: 'both',
    maxDepth,
    relationshipTypes: [
      'CONTAINS', 'IMPORTS', 'CALLS', 'EXTENDS', 'IMPLEMENTS_INTERFACE',
      'DEPENDS_ON', 'TESTS', 'SATISFIES'
    ]
  });
  
  // Get relationships involving affected entities
  const affectedIds = affected.map(e => e.id);
  const relResult = await pool.query(`
    SELECT * FROM relationships
    WHERE from_entity_id = ANY($1) OR to_entity_id = ANY($1)
  `, [affectedIds]);
  
  // Calculate impact score based on entity types and depths
  const impactScore = calculateImpactScore(affected);
  
  return {
    affected_entities: affected,
    affected_relationships: relResult.rows,
    impact_score: impactScore,
    traversal_depth: maxDepth
  };
}

function calculateImpactScore(entities: Entity[]): number {
  // Weight by entity type (requirements more impactful than code)
  const weights: Record<string, number> = {
    'Epic': 10,
    'Story': 8,
    'AcceptanceCriterion': 6,
    'Requirement': 7,
    'TestCase': 5,
    'TestSuite': 4,
    'Function': 2,
    'Class': 3,
    'SourceFile': 1
  };
  
  let score = 0;
  for (const entity of entities) {
    score += weights[entity.type] || 1;
  }
  
  return Math.min(100, score); // Cap at 100
}

export async function whatIf(
  entityId: string,
  operation: 'delete' | 'modify'
): Promise<{
  impact: ImpactResult;
  warnings: string[];
  blockers: string[];
}> {
  const impact = await analyzeImpact(entityId, 5);
  const warnings: string[] = [];
  const blockers: string[] = [];
  
  // Check for requirements that would be orphaned
  const orphanedReqs = impact.affected_entities.filter(e => 
    e.type === 'AcceptanceCriterion' || e.type === 'Story'
  );
  
  if (orphanedReqs.length > 0) {
    warnings.push(`${orphanedReqs.length} requirements would lose traceability`);
  }
  
  // Check for tests that would fail
  const affectedTests = impact.affected_entities.filter(e => 
    e.type === 'TestCase' || e.type === 'TestSuite'
  );
  
  if (affectedTests.length > 0) {
    warnings.push(`${affectedTests.length} tests would be affected`);
  }
  
  // Block if deleting something with high coverage
  if (operation === 'delete' && impact.impact_score > 50) {
    blockers.push(`Impact score ${impact.impact_score} exceeds threshold (50)`);
  }
  
  return { impact, warnings, blockers };
}
```

### Step 5: Implement Coverage API

```typescript
// src/api/v1/coverage.ts
// @implements STORY-64.5
// @satisfies AC-64.5.6

export async function getStoryCoverage(): Promise<CoverageResult> {
  // Stories with @implements markers (R18 = IMPLEMENTS)
  // Join to get instance_id from to_entity_id
  const coveredResult = await pool.query(`
    SELECT DISTINCT e.instance_id
    FROM relationships r
    JOIN entities e ON r.to_entity_id = e.id
    WHERE r.relationship_type = 'R18' AND e.instance_id LIKE 'STORY-%'
  `);
  
  const coveredIds = new Set(coveredResult.rows.map(r => r.instance_id));
  
  // All stories
  const allStoriesResult = await pool.query(`
    SELECT instance_id FROM entities WHERE entity_type = 'E02'
  `);
  
  const allIds = allStoriesResult.rows.map(r => r.instance_id);
  const uncoveredIds = allIds.filter(id => !coveredIds.has(id));
  
  return {
    total: allIds.length,
    covered: coveredIds.size,
    uncovered: uncoveredIds.length,
    percentage: (coveredIds.size / allIds.length) * 100,
    uncovered_items: uncoveredIds
  };
}

export async function getACCoverage(): Promise<CoverageResult> {
  // ACs with @satisfies markers (R19 = SATISFIES)
  const coveredResult = await pool.query(`
    SELECT DISTINCT e.instance_id
    FROM relationships r
    JOIN entities e ON r.to_entity_id = e.id
    WHERE r.relationship_type = 'R19' AND e.instance_id LIKE 'AC-%'
  `);
  
  const coveredIds = new Set(coveredResult.rows.map(r => r.instance_id));
  
  // All ACs (E03)
  const allACsResult = await pool.query(`
    SELECT instance_id FROM entities WHERE entity_type = 'E03'
  `);
  
  const allIds = allACsResult.rows.map(r => r.instance_id);
  const uncoveredIds = allIds.filter(id => !coveredIds.has(id));
  
  return {
    total: allIds.length,
    covered: coveredIds.size,
    uncovered: uncoveredIds.length,
    percentage: (coveredIds.size / allIds.length) * 100,
    uncovered_items: uncoveredIds
  };
}

export async function getTestCoverage(): Promise<CoverageResult> {
  // Stories with test coverage (R36 = TESTED_BY or similar)
  // Note: This query uses relationship from test to code, need to trace back
  const coveredResult = await pool.query(`
    SELECT DISTINCT e.instance_id
    FROM relationships r
    JOIN entities e ON r.to_entity_id = e.id
    WHERE r.relationship_type = 'R36' AND e.entity_type = 'E02'
  `);
  
  const coveredIds = new Set(coveredResult.rows.map(r => r.instance_id));
  
  // All stories (E02)
  const allStoriesResult = await pool.query(`
    SELECT instance_id FROM entities WHERE entity_type = 'E02'
  `);
  
  const allIds = allStoriesResult.rows.map(r => r.instance_id);
  const uncoveredIds = allIds.filter(id => !coveredIds.has(id));
  
  return {
    total: allIds.length,
    covered: coveredIds.size,
    uncovered: uncoveredIds.length,
    percentage: (coveredIds.size / allIds.length) * 100,
    uncovered_items: uncoveredIds
  };
}
```

### Step 6: Create API Index

```typescript
// src/api/v1/index.ts
// @implements STORY-64.5
// @satisfies AC-64.5.8

export const API_VERSION = 'v1';

// Entity operations
export {
  createEntity,
  getEntity,
  updateEntity,
  deleteEntity,
  queryEntities,
  createEntities
} from './entities';

// Relationship operations
export {
  createRelationship,
  getRelationship,
  updateRelationship,
  deleteRelationship,
  queryRelationships,
  createRelationships
} from './relationships';

// Traversal operations
export {
  traverse,
  findPath,
  getNeighbors
} from './traversal';

// Impact analysis
export {
  analyzeImpact,
  whatIf
} from './impact';

// Coverage queries
export {
  getStoryCoverage,
  getACCoverage,
  getTestCoverage
} from './coverage';

// Types
export * from './types';
```

---

## Files to Create

| File | Purpose | Lines |
|------|---------|-------|
| `src/api/v1/types.ts` | API type definitions | ~80 |
| `src/api/v1/entities.ts` | Entity CRUD | ~200 |
| `src/api/v1/relationships.ts` | Relationship CRUD | ~200 |
| `src/api/v1/traversal.ts` | Graph traversal | ~150 |
| `src/api/v1/impact.ts` | Impact analysis | ~120 |
| `src/api/v1/coverage.ts` | Coverage queries | ~100 |
| `src/api/v1/index.ts` | Public exports | ~50 |
| `test/api/v1/api.test.ts` | API tests | ~400 |

---

## Verification Tests

```typescript
// test/api/v1/api.test.ts
// @implements STORY-64.5

describe('Graph API v1', () => {
  // VERIFY-API-01: Entity CRUD
  it('performs entity CRUD operations', async () => {
    const entity = await createEntity({
      id: 'test-entity-1',
      type: 'Function',
      attributes: { name: 'test' },
      evidence: mockEvidence
    });
    expect(entity.id).toBe('test-entity-1');
    
    const retrieved = await getEntity('test-entity-1');
    expect(retrieved).not.toBeNull();
    
    const updated = await updateEntity('test-entity-1', { attributes: { name: 'updated' } });
    expect(updated.attributes.name).toBe('updated');
    
    await deleteEntity('test-entity-1');
    const deleted = await getEntity('test-entity-1');
    expect(deleted).toBeNull();
  });
  
  // VERIFY-API-02: Relationship CRUD
  it('performs relationship CRUD operations', async () => {
    // Create test entities first
    await createEntity({ id: 'source-uuid-1', entity_type: 'E12', instance_id: 'FUNC-test:source', ... });
    await createEntity({ id: 'target-uuid-1', entity_type: 'E12', instance_id: 'FUNC-test:target', ... });
    
    const rel = await createRelationship({
      id: 'rel-uuid-1',
      relationship_type: 'R22',  // CALLS
      instance_id: 'R22:FUNC-test:source:FUNC-test:target',
      from_entity_id: 'source-uuid-1',
      to_entity_id: 'target-uuid-1',
      ...
    });
    expect(rel.id).toBe('rel-uuid-1');
    
    const retrieved = await getRelationship('rel-uuid-1');
    expect(retrieved).not.toBeNull();
  });
  
  // VERIFY-API-03: Type-safe queries
  it('provides type-safe query interface', async () => {
    const result = await queryEntities('Function', { limit: 10 });
    
    expect(result.data).toBeInstanceOf(Array);
    expect(result.total).toBeGreaterThanOrEqual(0);
    expect(result.hasMore).toBeDefined();
  });
  
  // VERIFY-API-04: Graph traversal
  it('traverses graph relationships', async () => {
    const entities = await traverse('EPIC-64', {
      direction: 'outgoing',
      maxDepth: 2,
      relationshipTypes: ['CONTAINS']
    });
    
    expect(entities.length).toBeGreaterThan(0);
  });
  
  // VERIFY-API-05: Impact analysis
  it('analyzes impact of changes', async () => {
    const impact = await analyzeImpact('function:src/index.ts:main');
    
    expect(impact.affected_entities).toBeDefined();
    expect(impact.impact_score).toBeGreaterThanOrEqual(0);
  });
  
  // VERIFY-API-06: Coverage queries
  it('queries coverage information', async () => {
    const coverage = await getStoryCoverage();
    
    expect(coverage.total).toBe(351);
    expect(coverage.percentage).toBeGreaterThanOrEqual(0);
    expect(coverage.percentage).toBeLessThanOrEqual(100);
  });
  
  // VERIFY-API-07: API versioning
  it('exports versioned API', async () => {
    const { API_VERSION } = await import('@gnosis/api/v1');
    expect(API_VERSION).toBe('v1');
  });
  
  // VERIFY-API-08: Pagination
  it('paginates large result sets', async () => {
    const page1 = await queryEntities('Story', { limit: 10, offset: 0 });
    const page2 = await queryEntities('Story', { limit: 10, offset: 10 });
    
    expect(page1.data.length).toBe(10);
    expect(page2.data[0].id).not.toBe(page1.data[0].id);
  });
  
  // G-API: No direct database access
  it('enforces G-API boundary', async () => {
    // This test verifies that importing db modules directly fails
    expect(() => require('../../src/db/pool')).toThrow();
  });
});
```

---

## Verification Checklist

- [ ] All acceptance criteria implemented
- [ ] All VERIFY-API-* tests pass
- [ ] Code has `@implements STORY-64.5` marker
- [ ] Functions have `@satisfies AC-64.5.*` markers
- [ ] All operations logged to shadow ledger
- [ ] No direct database access from outside src/db/
- [ ] **Mission Alignment:** Confirm no oracle claims (confidence ≠ truth, alignment ≠ understanding)
- [ ] **No Placeholders:** All bracketed placeholders resolved to concrete values

---

## Definition of Done

- [ ] Entity CRUD operational
- [ ] Relationship CRUD operational
- [ ] Traversal queries working with Neo4j
- [ ] Impact analysis implemented
- [ ] Coverage queries return accurate results
- [ ] Pagination working for all query endpoints
- [ ] API exported at @gnosis/api/v1
- [ ] All tests pass
- [ ] G-API gate passes (no direct DB imports)
- [ ] Committed with message: "STORY-64.5: Graph API v1"

---

## Next Step

→ Track A EXIT.md (All stories complete)

---

**END OF STORY A.5**
