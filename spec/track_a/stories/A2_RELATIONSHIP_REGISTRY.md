---
tdd:
  id: TDD-A2-RELATIONSHIP-REGISTRY
  type: TechnicalDesign
  version: "2.0.0"
  status: implemented
  addresses:
    stories:
      - STORY-64.2
    acceptance_criteria:
      - AC-64.2.1
      - AC-64.2.2
      - AC-64.2.3
      - AC-64.2.4
      - AC-64.2.5
      - AC-64.2.6
      - AC-64.2.7
      - AC-64.2.8
    schemas:
      - SCHEMA-Relationship
      - SCHEMA-RelationshipTypeCode
  implements:
    files:
      - src/extraction/providers/brd-relationship-provider.ts
      - src/extraction/providers/containment-derivation-provider.ts
      - src/extraction/providers/tdd-frontmatter-provider.ts
      - src/extraction/providers/tdd-relationship-provider.ts
      - src/services/relationships/relationship-service.ts
      - src/services/sync/sync-service.ts
      - src/ops/track-a.ts
---

<!-- MACHINE-READABLE SCOPE - DO NOT EDIT MANUALLY -->
<!-- @scope-entities: E01,E02,E03,E04,E06,E08,E11,E12,E13,E15,E27,E28,E29,E49,E50,E52 -->
<!-- @scope-relationships-active: R01,R02,R03,R04,R05,R06,R07,R14,R16,R63,R67,R70 -->
<!-- @scope-relationships-deferred: R18,R19,R21,R22,R23,R26,R36,R37 -->
<!-- @internal-linkages: R08,R09,R11 -->
<!-- @out-of-scope: R24 -->
<!-- END SCOPE -->

# Story A.2: Relationship Registry

**Version:** 2.0.0  
**Implements:** STORY-64.2 (UTG Relationship Extraction)  
**Track:** A  
**Duration:** 2-3 days  
**Canonical Sources:**
- BRD V20.6.3 §Epic 64, Story 64.2
- UTG Schema V20.6.1 §Relationship Registry
- Verification Spec V20.6.5 §Part IX

> **v2.0.0:** TDD Retrofit - Add R08/R09/R11 (TDD Bridge), R14 derived from TDD frontmatter (not deferred), scope expanded to 18 in-scope relationships
> **v1.6.0:** Organ Patch - Defer R14/R18/R19 to A3 (marker-dependent), defer R24 until E14 exists, scope reduced to 15 in-scope relationships  
> **v1.5.0:** Pre-A2 Hardening - Added Evidence Fields section, R36/R37 deferral to A3, instance_id format validation  
> **v1.4.0:** Added R70 GROUPS extraction logic, endpoint deviation note  
> **v1.3.0:** Multi-tenant identity fix: ON CONFLICT (project_id, instance_id)  
> **v1.2.0:** Entity count consistency: "16 in scope, 15 extractable (E14 deferred)"  
> **v1.1.0:** Added service-layer architecture per PROMPTS.md alignment

---

## User Story

> As the Gnosis system, I need to extract and store 18 Track A relationship types between entities so that I can traverse the structural connections in my codebase.
>
> **A2 Scope:** R01, R02, R03, R04, R05, R06, R07, R08, R09, R11, R14, R16, R21, R22, R23, R26, R63, R67, R70
>
> **TDD Bridge (NEW):** R08 (DESIGNED_IN), R09 (SPECIFIED_IN), R11 (DEFINES_SCHEMA), R14 (IMPLEMENTED_BY) - derived from TDD frontmatter
>
> **Deferred to A3:** R18, R19, R36, R37 (marker-dependent)
>
> **Deferred until E14 exists:** R24 (requires Interface entity)

---

## BRD Linkage

This story implements **STORY-64.2** (Relationship Registry with Confidence).
For BRD acceptance criteria, see BRD V20.6.3 §Epic 64, Story 64.2.

> **Governance Rule:** Track docs reference BRD stories but do not define or redefine AC-* identifiers. See Verification Spec Part XVII (Marker Governance).

---

## Execution Obligations

The following obligations must be satisfied for A2 completion. These derive from organ docs.

| Obligation | Organ Source | Verification |
|------------|--------------|--------------|
| R01-R03 BRD hierarchy relationships | Verification Spec §10.2 | VERIFY-R01, VERIFY-R02, VERIFY-R03 |
| R04 Module CONTAINS_FILE SourceFile | Verification Spec §10.2 R04 | VERIFY-R04 |
| R05 SourceFile CONTAINS_ENTITY | Verification Spec §10.2 R05 | VERIFY-R05 |
| R06 TestFile CONTAINS_SUITE | Verification Spec §10.2 R06 | VERIFY-R06 |
| R07 TestSuite CONTAINS_CASE | Verification Spec §10.2 R07 | VERIFY-R07 |
| All relationships logged to shadow ledger | Roadmap §Track A Pillars | Ledger count > 0 |
| All relationships have evidence anchors | Verification Spec §Evidence | SANITY-045 |

> **Note on Interface Targets:** R05 (CONTAINS_ENTITY) may reference E14 Interface as a target entity type. Since E14 extraction is deferred, R05 relationships targeting interfaces will not be emitted in A2.
>
> **R24 IMPLEMENTS_INTERFACE:** Do NOT emit R24 relationships in A2. R24 is deferred until E14 (Interface) entity extraction exists. Confidence stubs are explicitly forbidden for deferred relationships.

> **Endpoint Deviation:** See ENTRY.md §Relationship Endpoint Resolution Notice. The R04 endpoint deviation has been corrected as of V1.6.1.

---

## Entry Criteria

- [ ] Story A.1 (Entity Registry) complete
- [ ] All 16 entity types in scope (15 extractable; E14 deferred)
- [ ] Entity extraction tests pass
- [ ] Shadow ledger operational

---

## Evidence Fields (Required)

> **Added in Pre-A2 Hardening per Constraint A.2**

Every relationship row MUST include evidence anchor fields:

| Column | Type | Constraint | Description |
|--------|------|------------|-------------|
| source_file | VARCHAR(500) | NOT NULL, non-empty | File where relationship was extracted |
| line_start | INTEGER | NOT NULL, > 0 | Starting line of evidence |
| line_end | INTEGER | NOT NULL, >= line_start | Ending line of evidence |
| extracted_at | TIMESTAMPTZ | NOT NULL (auto) | Extraction timestamp |

**Validation:** SANITY-045 enforces evidence presence on all relationship rows.

**Instance ID Format:** All relationship instance_ids must match pattern: `^R\d{2}:.+:.+$`

Example: `R01:EPIC-64:STORY-64.1`

The service layer validates this format before upsert and rejects malformed IDs.

---

## R36/R37 Deferral (ORGAN PATCH - Deliberate Change)

> **AC-64.2.17 (TESTED_BY)** and **AC-64.2.18 (VERIFIED_BY)** are explicitly deferred to Story A3 (Marker Extraction).
>
> These relationships require marker-based extraction (`@implements`, `@satisfies`) which is not implemented until A3. This is a deliberate scope change recorded per organ patch rules, not an implementation shortcut. A2 exit criteria do NOT require R36/R37 extraction.

---

## TDD Bridge Relationships (NEW in v2.0.0)

### R08/R09/R11/R14 - Derived from TDD Frontmatter

These relationships are derived from TDD (Technical Design Document) frontmatter in Track A story files:

| R-Code | Name | From | To | Source |
|--------|------|------|-----|--------|
| R08 | DESIGNED_IN | Story | TechnicalDesign | `addresses.stories[]` |
| R09 | SPECIFIED_IN | AcceptanceCriterion | TechnicalDesign | `addresses.acceptance_criteria[]` |
| R11 | DEFINES_SCHEMA | Story | DataSchema | `addresses.schemas[]` |
| R14 | IMPLEMENTED_BY | TechnicalDesign | SourceFile | `implements.files[]` |

> **R14 Change (v2.0.0):** R14 is NO LONGER marker-dependent. It is derived from TDD frontmatter `implements.files[]` arrays. A2 extracts R14; A3 validates bidirectional consistency via `@tdd` markers.

---

## Relationship Deferrals

### R18/R19 Deferral (Marker-Dependent)

> **AC-64.2.10 (IMPLEMENTS)** and **AC-64.2.11 (SATISFIES)** are deferred to Story A3 (Marker Extraction).
>
> These relationships require `@implements` and `@satisfies` marker parsing, which is A3's responsibility.
>
> **A2 exit criteria do NOT require R18/R19 extraction.**

### R24 Deferral (E14-Dependent)

> **AC-64.2.15 (IMPLEMENTS_INTERFACE)** is deferred until E14 (Interface) entity extraction exists.
>
> R24 connects Class (E13) to Interface (E14). Since E14 is deferred in Track A, R24 cannot be meaningfully extracted.
>
> **A2 exit criteria do NOT require R24 extraction.**

### Summary of Deferred Relationships

| R-Code | Name | Reason | Deferred To |
|--------|------|--------|-------------|
| R18 | IMPLEMENTS | Requires @implements markers | A3 |
| R19 | SATISFIES | Requires @satisfies markers | A3 |
| R24 | IMPLEMENTS_INTERFACE | Requires E14 Interface entity | Post-Track A |
| R36 | TESTED_BY | Requires @implements markers | A3 |
| R37 | VERIFIED_BY | Requires @satisfies markers | A3 |

---

## Implementation Steps

### Step 1: Create Relationship Type Definitions

```typescript
// src/schema/track-a/relationships.ts
// @implements STORY-64.2
// Per Cursor Plan V20.8.5 lines 475-507

// Relationship type codes (21 for Track A)
export type RelationshipTypeCode =
  // Requirements (R01-R03)
  | 'R01' | 'R02' | 'R03'  // HAS_STORY, HAS_AC, HAS_CONSTRAINT
  // Containment (R04-R07)
  | 'R04' | 'R05' | 'R06' | 'R07'  // CONTAINS_FILE, CONTAINS_ENTITY, CONTAINS_SUITE, CONTAINS_CASE
  // Implementation (R14, R16, R18-R19, R21-R24, R26)
  | 'R14' | 'R16' | 'R18' | 'R19'  // IMPLEMENTED_BY, DEFINED_IN, IMPLEMENTS, SATISFIES
  | 'R21' | 'R22' | 'R23' | 'R24' | 'R26'  // IMPORTS, CALLS, EXTENDS, IMPLEMENTS_INTERFACE, DEPENDS_ON
  // Verification (R36-R37)
  | 'R36' | 'R37'  // TESTED_BY, VERIFIED_BY
  // Provenance (R63, R67, R70)
  | 'R63' | 'R67' | 'R70';  // INTRODUCED_IN, MODIFIED_IN, GROUPS

export interface Relationship {
  id: string;                             // UUID
  relationship_type: RelationshipTypeCode; // R-code
  instance_id: string;                    // Stable business key
  name: string;                           // Human-readable name
  from_entity_id: string;                 // UUID of source entity
  to_entity_id: string;                   // UUID of target entity
  attributes: Record<string, unknown>;    // JSONB
  confidence: number;                     // 0.0-1.0 (default 1.0)
  source_file: string;                    // Provenance
  line_start: number;
  line_end: number;
  commit_sha: string;
  extraction_timestamp: Date;
  extractor_version: string;
  project_id: string;                     // UUID, for RLS
  created_at: Date;
  updated_at: Date;
}

export interface RelationshipDefinition {
  code: RelationshipTypeCode;
  name: string;
  from_type: EntityTypeCode;
  to_type: EntityTypeCode;
  cardinality: '1:1' | '1:N' | 'N:1' | 'N:M';
}

// Track A Relationship Definitions (21 total)
export const TRACK_A_RELATIONSHIPS: RelationshipDefinition[] = [
  { code: 'R01', name: 'HAS_STORY', from_type: 'E01', to_type: 'E02', cardinality: '1:N' },
  { code: 'R02', name: 'HAS_AC', from_type: 'E02', to_type: 'E03', cardinality: '1:N' },
  { code: 'R03', name: 'HAS_CONSTRAINT', from_type: 'E03', to_type: 'E04', cardinality: 'N:M' },
  { code: 'R04', name: 'CONTAINS_FILE', from_type: 'E11', to_type: 'E11', cardinality: 'N:M' },
  { code: 'R05', name: 'CONTAINS_ENTITY', from_type: 'E11', to_type: 'E12', cardinality: '1:N' },
  { code: 'R06', name: 'CONTAINS_SUITE', from_type: 'E27', to_type: 'E28', cardinality: '1:N' },
  { code: 'R07', name: 'CONTAINS_CASE', from_type: 'E28', to_type: 'E29', cardinality: '1:N' },
  { code: 'R14', name: 'IMPLEMENTED_BY', from_type: 'E02', to_type: 'E12', cardinality: 'N:M' },
  { code: 'R16', name: 'DEFINED_IN', from_type: 'E12', to_type: 'E11', cardinality: 'N:1' },
  { code: 'R18', name: 'IMPLEMENTS', from_type: 'E12', to_type: 'E02', cardinality: 'N:M' },
  { code: 'R19', name: 'SATISFIES', from_type: 'E12', to_type: 'E03', cardinality: 'N:M' },
  { code: 'R21', name: 'IMPORTS', from_type: 'E11', to_type: 'E11', cardinality: 'N:M' },
  { code: 'R22', name: 'CALLS', from_type: 'E12', to_type: 'E12', cardinality: 'N:M' },
  { code: 'R23', name: 'EXTENDS', from_type: 'E13', to_type: 'E13', cardinality: 'N:1' },
  { code: 'R24', name: 'IMPLEMENTS_INTERFACE', from_type: 'E13', to_type: 'E14', cardinality: 'N:M' },  // E14 deferred
  { code: 'R26', name: 'DEPENDS_ON', from_type: 'E15', to_type: 'E15', cardinality: 'N:M' },
  { code: 'R36', name: 'TESTED_BY', from_type: 'E12', to_type: 'E29', cardinality: 'N:M' },
  { code: 'R37', name: 'VERIFIED_BY', from_type: 'E03', to_type: 'E29', cardinality: 'N:M' },
  { code: 'R63', name: 'INTRODUCED_IN', from_type: 'E11', to_type: 'E50', cardinality: 'N:1' },
  { code: 'R67', name: 'MODIFIED_IN', from_type: 'E11', to_type: 'E50', cardinality: 'N:M' },
  { code: 'R70', name: 'GROUPS', from_type: 'E52', to_type: 'E50', cardinality: '1:N' },
];
```

### Step 2: PostgreSQL Schema (Already Applied)

The relationship schema is defined in `migrations/003_reset_schema_to_cursor_plan.sql` per Cursor Plan V20.8.5 lines 475-507.

**Key schema points:**
- `relationship_type VARCHAR(10)` stores R-codes ('R01', 'R02', etc.)
- `instance_id VARCHAR(500)` is a stable business key
- `from_entity_id UUID` and `to_entity_id UUID` (not source_id/target_id)
- FKs are `DEFERRABLE INITIALLY DEFERRED` for batch insertion
- Flat provenance fields instead of nested `evidence` JSONB
- RLS enabled with permissive policy (`USING (true)`)
- CHECK constraint: `relationship_type ~ '^R[0-9]{2}$'`
- `confidence NUMERIC(3,2)` defaults to 1.0

See migration 003 for full schema.

### Step 3: Implement BRD Relationship Extraction (R01, R02)

```typescript
// src/extraction/providers/brd-relationship-provider.ts
// @implements STORY-64.2
// @satisfies AC-64.2.1, AC-64.2.2

import type { ExtractedRelationship } from '../types';

export class BRDRelationshipProvider implements ExtractionProvider {
  name = 'brd-relationship-provider';
  
  async extract(snapshot: RepoSnapshot): Promise<ExtractionResult> {
    const entities = await getEntities(['E01', 'E02', 'E03']);  // Epic, Story, AC
    const relationships: ExtractedRelationship[] = [];
    
    // R01: Epic HAS_STORY Story
    for (const story of entities.filter(e => e.entity_type === 'E02')) {
      const epicNumber = story.attributes.epic_number;
      const epicInstanceId = `EPIC-${epicNumber}`;
      
      relationships.push({
        relationship_type: 'R01',
        instance_id: `R01:${epicInstanceId}:${story.instance_id}`,
        name: `HAS_STORY: ${epicInstanceId} → ${story.instance_id}`,
        from_instance_id: epicInstanceId,     // Resolved to UUID during persistence
        to_instance_id: story.instance_id,    // Resolved to UUID during persistence
        confidence: 1.0
      });
    }
    
    // R02: Story HAS_AC AcceptanceCriterion
    for (const ac of entities.filter(e => e.entity_type === 'E03')) {
      const storyInstanceId = ac.attributes.story_id;
      
      relationships.push({
        relationship_type: 'R02',
        instance_id: `R02:${storyInstanceId}:${ac.instance_id}`,
        name: `HAS_AC: ${storyInstanceId} → ${ac.instance_id}`,
        from_instance_id: storyInstanceId,
        to_instance_id: ac.instance_id,
        confidence: 1.0
      });
    }
    
    return { entities: [], relationships, evidence: [] };
  }
}
```

### Step 4: Implement AST Relationship Extraction (R16, R21-R24, R26)

```typescript
// src/extraction/providers/ast-relationship-provider.ts
// @implements STORY-64.2

import type { ExtractedRelationship } from '../types';

export class ASTRelationshipProvider implements ExtractionProvider {
  name = 'ast-relationship-provider';
  
  async extract(snapshot: RepoSnapshot): Promise<ExtractionResult> {
    const project = new Project();
    project.addSourceFilesAtPaths(`${snapshot.root_path}/src/**/*.{ts,tsx}`);
    
    const relationships: ExtractedRelationship[] = [];
    
    for (const sourceFile of project.getSourceFiles()) {
      const filePath = sourceFile.getFilePath();
      const fileInstanceId = `FILE-${filePath}`;
      
      // R21: IMPORTS
      for (const imp of sourceFile.getImportDeclarations()) {
        const moduleSpecifier = imp.getModuleSpecifierValue();
        const targetFileInstanceId = resolveModulePath(filePath, moduleSpecifier);
        
        if (targetFileInstanceId) {
          relationships.push({
            relationship_type: 'R21',
            instance_id: `R21:${fileInstanceId}:${targetFileInstanceId}`,
            name: `IMPORTS: ${fileInstanceId} → ${targetFileInstanceId}`,
            from_instance_id: fileInstanceId,
            to_instance_id: targetFileInstanceId,
            confidence: 1.0
          });
        }
      }
      
      // R22: CALLS
      for (const func of sourceFile.getFunctions()) {
        const funcInstanceId = `FUNC-${filePath}:${func.getName()}`;
        const callExpressions = func.getDescendantsOfKind(SyntaxKind.CallExpression);
        
        for (const call of callExpressions) {
          const calledFuncName = call.getExpression().getText();
          const targetFuncInstanceId = resolveFunctionCall(filePath, calledFuncName);
          
          if (targetFuncInstanceId) {
            relationships.push({
              relationship_type: 'R22',
              instance_id: `R22:${funcInstanceId}:${targetFuncInstanceId}`,
              name: `CALLS: ${funcInstanceId} → ${targetFuncInstanceId}`,
              from_instance_id: funcInstanceId,
              to_instance_id: targetFuncInstanceId,
              confidence: 1.0
            });
          }
        }
      }
      
      // R23: EXTENDS
      for (const cls of sourceFile.getClasses()) {
        const classInstanceId = `CLASS-${filePath}:${cls.getName()}`;
        const extendsClause = cls.getExtends();
        
        if (extendsClause) {
          const baseClassName = extendsClause.getText();
          const baseClassInstanceId = resolveClassName(filePath, baseClassName);
          
          if (baseClassInstanceId) {
            relationships.push({
              relationship_type: 'R23',
              instance_id: `R23:${classInstanceId}:${baseClassInstanceId}`,
              name: `EXTENDS: ${classInstanceId} → ${baseClassInstanceId}`,
              from_instance_id: classInstanceId,
              to_instance_id: baseClassInstanceId,
              confidence: 1.0
            });
          }
        }
      }
      
      // R24: IMPLEMENTS_INTERFACE - DEFERRED UNTIL E14 EXISTS
      // Do NOT emit R24 relationships in A2. Confidence stubs are forbidden.
      
      // R16: DEFINED_IN (Function/Class → SourceFile)
      for (const func of sourceFile.getFunctions()) {
        const funcInstanceId = `FUNC-${filePath}:${func.getName()}`;
        relationships.push({
          relationship_type: 'R16',
          instance_id: `R16:${funcInstanceId}:${fileInstanceId}`,
          name: `DEFINED_IN: ${funcInstanceId} → ${fileInstanceId}`,
          from_instance_id: funcInstanceId,
          to_instance_id: fileInstanceId,
          confidence: 1.0
        });
      }
      
      for (const cls of sourceFile.getClasses()) {
        const classInstanceId = `CLASS-${filePath}:${cls.getName()}`;
        relationships.push({
          relationship_type: 'R16',
          instance_id: `R16:${classInstanceId}:${fileInstanceId}`,
          name: `DEFINED_IN: ${classInstanceId} → ${fileInstanceId}`,
          from_instance_id: classInstanceId,
          to_instance_id: fileInstanceId,
          confidence: 1.0
        });
      }
    }
    
    return { entities: [], relationships, evidence: [] };
  }
}
```

### Step 4b: Relationship Service (Upsert Logic)

```typescript
// src/services/relationships/relationship-service.ts
// @implements STORY-64.2
// Implements ENTRY.md Upsert Rule (Locked)

import { pool } from '../../db/postgres';

/**
 * Identity and persistence both use (project_id, instance_id).
 * Per ENTRY.md locked upsert rule.
 */
export async function upsert(projectId: string, extracted: ExtractedRelationship): Promise<Relationship> {
  // Resolve from_instance_id and to_instance_id to UUIDs
  const fromEntityId = await resolveEntityId(extracted.from_instance_id);
  const toEntityId = await resolveEntityId(extracted.to_instance_id);
  
  const result = await pool.query(`
    INSERT INTO relationships (
      id, relationship_type, instance_id, name,
      from_entity_id, to_entity_id, confidence, project_id, extracted_at
    ) VALUES (
      gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW()
    )
    ON CONFLICT (project_id, instance_id) DO UPDATE SET
      name = EXCLUDED.name,
      from_entity_id = EXCLUDED.from_entity_id,
      to_entity_id = EXCLUDED.to_entity_id,
      confidence = EXCLUDED.confidence,
      extracted_at = NOW()
    RETURNING id, (xmax = 0) AS inserted
  `, [
    extracted.relationship_type, extracted.instance_id, extracted.name,
    fromEntityId, toEntityId, extracted.confidence ?? 1.0,
    projectId  // project_id included in INSERT
  ]);
  
  // Emit relationship-link entry per Verification Spec §8.1.3 on CREATE/UPDATE only
  if (result.rows[0]) {
    await emitRelationshipLinkEntry(result.rows[0], extracted);
  }
  
  return result.rows[0];
}
```

### Step 4c: Implement Git Relationship Extraction (R63, R67, R70)

```typescript
// src/extraction/providers/git-relationship-provider.ts
// @implements STORY-64.2

import type { ExtractedRelationship } from '../types';
import * as entityService from '../../services/entities/entity-service';

export class GitRelationshipProvider implements ExtractionProvider {
  name = 'git-relationship-provider';
  
  async extract(snapshot: RepoSnapshot): Promise<ExtractionResult> {
    const relationships: ExtractedRelationship[] = [];
    
    // R63: INTRODUCED_IN (SourceFile → Commit) - first commit introducing the file (Track A-scoped deviation from global canon)
    // R67: MODIFIED_IN (SourceFile → Commit) - commits modifying the file (canonical alignment)
    // (Implementation for R63/R67 based on git blame/log analysis)
    
    // R70: GROUPS (ChangeSet → Commit)
    const changesets = await entityService.queryByType(snapshot.project_id, 'E52');
    
    for (const changeset of changesets) {
      const commitShas = changeset.attributes.commit_shas as string[];
      
      for (const sha of commitShas) {
        const commitEntity = await entityService.getByInstanceId(
          snapshot.project_id, 
          `COMMIT-${sha.slice(0, 12)}`
        );
        
        if (commitEntity) {
          relationships.push({
            relationship_type: 'R70',
            instance_id: `R70:${changeset.instance_id}:${commitEntity.instance_id}`,
            name: 'GROUPS',
            from_instance_id: changeset.instance_id,
            to_instance_id: commitEntity.instance_id,
            confidence: 1.0
          });
        }
      }
    }
    
    return { entities: [], relationships, evidence: [] };
  }
}
```

### Step 5: Create Graph API v1 Relationship Operations

> **Architecture:** API routes delegate to services; they do NOT import from `src/db/*` directly.
> See PROMPTS.md Database Access Boundary.

```typescript
// src/api/v1/relationships.ts
// @implements STORY-64.2

import { upsert as upsertRelationship } from '../../services/relationships/relationship-service';
import type { Relationship, RelationshipTypeCode } from '../../schema/track-a/relationships';
import type { ExtractedRelationship } from '../../extraction/types';

/**
 * Create or update a relationship via service layer.
 * API is project-scoped; service handles upsert logic and ledger emission.
 */
export async function createRelationship(projectId: string, extracted: ExtractedRelationship): Promise<Relationship> {
  return upsertRelationship(projectId, extracted);
}

export async function getRelationship(projectId: string, id: string): Promise<Relationship | null> {
  // Delegate to service layer for project-scoped query
  return relationshipService.getById(projectId, id);
}

export async function queryRelationships(
  projectId: string,
  relationshipType: RelationshipTypeCode,
  fromEntityId?: string,
  toEntityId?: string
): Promise<Relationship[]> {
  // Delegate to service layer for project-scoped query
  return relationshipService.query(projectId, relationshipType, fromEntityId, toEntityId);
}

export async function traverseGraph(
  projectId: string,
  startId: string,
  relationshipTypes: RelationshipTypeCode[],
  direction: 'outgoing' | 'incoming' | 'both',
  maxDepth: number = 3
): Promise<Entity[]> {
  // Delegate to service layer for project-scoped traversal
  return relationshipService.traverse(projectId, startId, relationshipTypes, direction, maxDepth);
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
| `src/services/relationships/relationship-service.ts` | Upsert logic + ledger emission | ~100 |
| `src/api/v1/relationships.ts` | Relationship CRUD | ~150 |
| `migrations/003_reset_schema_to_cursor_plan.sql` | Schema already established (do not modify); future changes require 004+ | — |
| `test/relationships/relationship-registry.test.ts` | Relationship tests | ~250 |

---

## Verification Tests

```typescript
// test/relationships/relationship-registry.test.ts
// @implements STORY-64.2

describe('Relationship Registry', () => {
  // VERIFY-R01: Epic HAS_STORY Story
  it('extracts Epic→Story relationships', async () => {
    const rels = await queryRelationships('R01');  // HAS_STORY
    expect(rels.length).toBe(351); // One per story
    // Verify via joined entity instance_ids
    for (const rel of rels.slice(0, 5)) {
      expect(rel.instance_id).toMatch(/^R01:EPIC-\d+:STORY-\d+\.\d+$/);
    }
  });
  
  // VERIFY-R02: Story HAS_AC AC
  it('extracts Story→AC relationships', async () => {
    const rels = await queryRelationships('R02');  // HAS_AC
    expect(rels.length).toBe(2849); // One per AC
  });
  
  // VERIFY-R21: IMPORTS
  it('extracts file import relationships', async () => {
    const rels = await queryRelationships('R21');  // IMPORTS
    expect(rels.length).toBeGreaterThan(0);
    expect(rels[0].instance_id).toMatch(/^R21:FILE-.+:FILE-.+$/);
  });
  
  // VERIFY-R22: CALLS
  it('extracts function call relationships', async () => {
    const rels = await queryRelationships('R22');  // CALLS
    expect(rels.length).toBeGreaterThan(0);
    expect(rels[0].instance_id).toMatch(/^R22:FUNC-.+:FUNC-.+$/);
  });
  
  // Provenance verification (flat fields, not nested evidence JSONB)
  it('all relationships have provenance fields', async () => {
    const rels = await pool.query('SELECT * FROM relationships LIMIT 100');
    for (const rel of rels.rows) {
      expect(rel.source_file).toBeDefined();
      expect(rel.from_entity_id).toBeDefined();
      expect(rel.to_entity_id).toBeDefined();
    }
  });
  
  // Graph traversal
  it('can traverse relationships in Neo4j', async () => {
    const entities = await traverseGraph('EPIC-64', ['R01'], 'outgoing', 2);  // HAS_STORY
    expect(entities.length).toBeGreaterThan(0);
  });
});
```

---

## Verification Checklist

- [ ] All acceptance criteria implemented (15 in-scope relationships)
- [ ] All VERIFY-R* tests pass for in-scope relationships
- [ ] Code has `@implements STORY-64.2` marker
- [ ] Functions have `@satisfies AC-64.2.*` markers
- [ ] Shadow ledger entries recorded for all in-scope relationships
- [ ] No direct database access from outside src/db/
- [ ] **Deferred relationships NOT emitted:** R14, R18, R19, R24, R36, R37 have 0 rows
- [ ] **Mission Alignment:** Confirm no oracle claims (confidence ≠ truth, alignment ≠ understanding)
- [ ] **No Placeholders:** All bracketed placeholders resolved to concrete values

---

## Definition of Done

- [ ] All 15 in-scope relationship types extractable (using R-codes)
- [ ] Relationship counts validate against entities:
  - [ ] 351 Epic→Story HAS_STORY (R01)
  - [ ] 2,849 Story→AC HAS_AC (R02)
- [ ] All tests pass for in-scope relationships
- [ ] Neo4j traversal operational
- [ ] Shadow ledger contains entries for all in-scope relationships
- [ ] Deferred relationships (R14, R18, R19, R24, R36, R37) are NOT emitted
- [ ] Committed with message: "STORY-64.2: Relationship Registry"

> **Note:** Deferred relationships are NOT required for A2 exit. They will be implemented in A3 (marker-dependent) or post-Track A (E14-dependent).

---

## Next Story

→ `A3_MARKER_EXTRACTION.md`

---

**END OF STORY A.2**
