---
tdd:
  id: TDD-A5-GRAPH-API-V1
  type: TechnicalDesign
  version: "2.0.0"
  status: pending
  addresses:
    stories:
      - STORY-64.5
    acceptance_criteria:
      - AC-64.5.1
      - AC-64.5.2
      - AC-64.5.3
      - AC-64.5.4
    schemas:
      - SCHEMA-GraphQuery
      - SCHEMA-GraphResponse
  implements:
    files:
      - src/api/v1/entities.ts
---

<!-- MACHINE-READABLE SCOPE - DO NOT EDIT MANUALLY -->
<!-- @scope-entities: E01,E02,E03,E04,E06,E08,E11,E12,E13,E15,E27,E28,E29,E49,E50,E52 -->
<!-- @scope-relationships-active: R01,R02,R03,R04,R05,R06,R07,R14,R16,R18,R19,R21,R22,R23,R26,R36,R37,R63,R67,R70 -->
<!-- @scope-relationships-deferred: -->
<!-- @internal-linkages: R08,R09,R11 -->
<!-- @out-of-scope: R24 -->
<!-- END SCOPE -->

# Story A.5: Graph API v1

**Version:** 2.0.0  
**Implements:** STORY-64.5 (Graph API v1)  
**Track:** A  
**Duration:** 2-3 days  
**Canonical Sources:**
- BRD V20.6.4 §Epic 64, Story 64.5
- UTG Schema V20.6.1 §API Specification
- Verification Spec V20.6.6 §8.3 (G-API)

> **v2.0.0:** TDD Retrofit - Added TDD frontmatter for E06 TechnicalDesign extraction  
> **v1.2.0:** Added scope note clarifying pipeline is not public API surface  
> **v1.1.0:** Service-layer alignment; API delegates to services per PROMPTS.md

---

## User Story

> As the Gnosis system, I need a versioned Graph API that provides CRUD operations, traversal queries, and impact analysis so that all graph access goes through a controlled boundary.

---

## BRD Linkage

This story implements **STORY-64.5** (Graph API v1).
For BRD acceptance criteria, see BRD V20.6.4 §Epic 64, Story 64.5.

> **Governance Rule:** Track docs reference BRD stories but do not define or redefine AC-* identifiers. See Verification Spec Part XVII (Marker Governance).

---

## Execution Obligations

The following obligations must be satisfied for A5 completion. These derive from organ docs.

| Obligation | Organ Source | Verification |
|------------|--------------|--------------|
| Entity CRUD operations | Verification Spec §8.3 G-API | VERIFY-API-01 |
| Relationship CRUD operations | Verification Spec §8.3 G-API | VERIFY-API-02 |
| Type-safe query interface | UTG Schema §API Specification | VERIFY-API-03 |
| Graph traversal operations | Verification Spec §8.3 G-API | VERIFY-API-04 |
| Impact analysis queries | UTG Schema §Analysis | VERIFY-API-05 |
| Coverage queries | Verification Spec §Coverage | VERIFY-API-06 |
| All operations logged to shadow ledger | Roadmap §Track A Pillars | Ledger count > 0 |
| API versioning (v1 namespace) | Verification Spec §8.3 | VERIFY-API-07 |
| No direct database access outside API | Verification Spec §8.3 G-API | G-API gate |
| Pagination for large result sets | UTG Schema §API | VERIFY-API-08 |

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

> **Architecture:** API routes delegate to services; they do NOT import from `src/db/*` directly.
> See PROMPTS.md Database Access Boundary.

> **Scope Note:** Graph API v1 provides CRUD operations, queries, and traversals.
> Pipeline execution (orchestration, extraction) is NOT part of the public API surface.
> Pipeline is an operator/CLI concern, accessed via internal modules only.

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

### Step 1b: Entity and Relationship Services (from A1/A2)

> **Reuse, do not recreate.** Entity and relationship services are implemented in A1 and A2.
> - Identity at service boundary: `(project_id, instance_id)`
> - Emit ledger entries per Verification Spec §8.1.3 on CREATE/UPDATE only
> - See `src/services/entities/entity-service.ts` and `src/services/relationships/relationship-service.ts`

### Step 2: Implement Entity API

> API delegates to entity service from A1. No direct DB imports.

```typescript
// src/api/v1/entities.ts
// @implements STORY-64.5
// @satisfies AC-64.5.1, AC-64.5.7, AC-64.5.10

import { entityService } from '../../services/entities/entity-service';
import type { Entity, EntityTypeCode, QueryOptions, PaginatedResult } from './types';
import type { ExtractedEntity } from '../../extraction/types';

/**
 * API delegates to entity service.
 * All operations are project-scoped at service boundary.
 */

// CREATE
export async function createEntity(projectId: string, entity: ExtractedEntity): Promise<Entity> {
  return entityService.upsert(projectId, entity);
}

// READ
export async function getEntity(projectId: string, id: string): Promise<Entity | null> {
  return entityService.getById(projectId, id);
}

// UPDATE
export async function updateEntity(projectId: string, id: string, updates: Partial<Entity>): Promise<Entity> {
  return entityService.update(projectId, id, updates);
}

// DELETE
export async function deleteEntity(projectId: string, id: string): Promise<void> {
  return entityService.delete(projectId, id);
}

// QUERY with pagination
export async function queryEntities(
  projectId: string,
  entityType?: EntityTypeCode,
  options: QueryOptions = {}
): Promise<PaginatedResult<Entity>> {
  return entityService.query(projectId, entityType, options);
}

// BATCH operations
export async function createEntities(projectId: string, entities: ExtractedEntity[]): Promise<Entity[]> {
  return entityService.upsertBatch(projectId, entities);
}
```

### Step 2b: Traversal Service

> Example shape showing responsibility. Service owns DB access (Neo4j + PostgreSQL).

```typescript
// src/services/traversal/traversal-service.ts
// @implements STORY-64.5

import { pool } from '../../db/postgres';
import { getSession } from '../../db/neo4j';

/**
 * Responsibility: Graph traversal and path finding.
 * Identity at service boundary: (project_id, startId).
 */
export async function traverse(projectId: string, startId: string, options: TraversalOptions): Promise<Entity[]> {
  // Service owns DB logic (Neo4j + PostgreSQL)
  // project_id scoping at service boundary
}

export async function findPath(projectId: string, fromId: string, toId: string, maxDepth: number): Promise<Array<Entity | Relationship>> {
  // Path finding logic here
}

export async function getNeighbors(projectId: string, entityId: string, depth: number): Promise<{ entities: Entity[]; relationships: Relationship[] }> {
  // Neighbor retrieval logic here
}
```

### Step 3: Implement Traversal API

> API delegates to traversal service. No direct DB imports.

```typescript
// src/api/v1/traversal.ts
// @implements STORY-64.5
// @satisfies AC-64.5.4

import { traversalService } from '../../services/traversal/traversal-service';
import type { Entity, Relationship, TraversalOptions } from './types';

/**
 * API delegates to traversal service.
 * All operations are project-scoped at service boundary.
 */

export async function traverse(
  projectId: string,
  startId: string,
  options: TraversalOptions
): Promise<Entity[]> {
  return traversalService.traverse(projectId, startId, options);
}

export async function findPath(
  projectId: string,
  fromId: string,
  toId: string,
  maxDepth: number = 10
): Promise<Array<Entity | Relationship>> {
  return traversalService.findPath(projectId, fromId, toId, maxDepth);
}

export async function getNeighbors(
  projectId: string,
  entityId: string,
  depth: number = 1
): Promise<{ entities: Entity[]; relationships: Relationship[] }> {
  return traversalService.getNeighbors(projectId, entityId, depth);
}
```

### Step 3b: Impact Service

> Example shape showing responsibility. Service owns DB access and impact calculation.

```typescript
// src/services/impact/impact-service.ts
// @implements STORY-64.5

import { pool } from '../../db/postgres';

/**
 * Responsibility: Impact analysis queries.
 * May delegate to traversal service for affected entity discovery.
 */
export async function analyze(projectId: string, entityId: string, maxDepth: number): Promise<ImpactResult> {
  // Impact calculation logic here
}

export async function whatIf(projectId: string, entityId: string, operation: 'delete' | 'modify'): Promise<WhatIfResult> {
  // What-if analysis logic here
}
```

### Step 4: Implement Impact Analysis API

> API delegates to impact service. No direct DB imports.

```typescript
// src/api/v1/impact.ts
// @implements STORY-64.5
// @satisfies AC-64.5.5

import { impactService } from '../../services/impact/impact-service';
import type { ImpactResult } from './types';

/**
 * API delegates to impact service.
 * All operations are project-scoped at service boundary.
 */

export async function analyzeImpact(
  projectId: string,
  entityId: string,
  maxDepth: number = 5
): Promise<ImpactResult> {
  return impactService.analyze(projectId, entityId, maxDepth);
}

export async function whatIf(
  projectId: string,
  entityId: string,
  operation: 'delete' | 'modify'
): Promise<{
  impact: ImpactResult;
  warnings: string[];
  blockers: string[];
}> {
  return impactService.whatIf(projectId, entityId, operation);
}
```

### Step 4b: Coverage Service

> Example shape showing responsibility. Service owns DB access for coverage queries.

```typescript
// src/services/coverage/coverage-service.ts
// @implements STORY-64.5

import { pool } from '../../db/postgres';

/**
 * Responsibility: Coverage computation (story, AC, test).
 * All coverage queries are project-scoped.
 */
export async function getStoryCoverage(projectId: string): Promise<CoverageResult> {
  // Coverage query logic here
}

export async function getACCoverage(projectId: string): Promise<CoverageResult> {
  // AC coverage logic here
}

export async function getTestCoverage(projectId: string): Promise<CoverageResult> {
  // Test coverage logic here
}
```

### Step 5: Implement Coverage API

> API delegates to coverage service. No direct DB imports.

```typescript
// src/api/v1/coverage.ts
// @implements STORY-64.5
// @satisfies AC-64.5.6

import { coverageService } from '../../services/coverage/coverage-service';
import type { CoverageResult } from './types';

/**
 * API delegates to coverage service.
 * All operations are project-scoped at service boundary.
 */

export async function getStoryCoverage(projectId: string): Promise<CoverageResult> {
  return coverageService.getStoryCoverage(projectId);
}

export async function getACCoverage(projectId: string): Promise<CoverageResult> {
  return coverageService.getACCoverage(projectId);
}

export async function getTestCoverage(projectId: string): Promise<CoverageResult> {
  return coverageService.getTestCoverage(projectId);
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

> **Prerequisite:** Entity and relationship services from A1/A2 must already exist. Do not recreate them.

| File | Purpose | Lines |
|------|---------|-------|
| `src/api/v1/types.ts` | API type definitions | ~80 |
| `src/api/v1/entities.ts` | Entity CRUD (delegates to service) | ~80 |
| `src/api/v1/relationships.ts` | Relationship CRUD (delegates to service) | ~80 |
| `src/api/v1/traversal.ts` | Graph traversal (delegates to service) | ~50 |
| `src/api/v1/impact.ts` | Impact analysis (delegates to service) | ~50 |
| `src/api/v1/coverage.ts` | Coverage queries (delegates to service) | ~50 |
| `src/api/v1/index.ts` | Public exports | ~50 |
| `src/services/traversal/*` | Graph traversal + path finding | ~120 |
| `src/services/impact/*` | Impact analysis queries | ~80 |
| `src/services/coverage/*` | Coverage computation | ~100 |
| `test/api/v1/api.test.ts` | API tests | ~400 |

> Suggested service names: `traversal-service.ts`, `impact-service.ts`, `coverage-service.ts` — adjust to match repo conventions.

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
    
    expect(coverage.total).toBe(397);
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
- [ ] After implementation: `rg -n "(from|require).*(/db/|@gnosis/db|src/db|\\./db|\\.\\./db)" src/api/v1` returns 0 matches
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
