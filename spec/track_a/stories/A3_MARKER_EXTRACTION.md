# Story A.3: Marker Extraction

**Version:** 1.2.0  
**Implements:** STORY-64.3 (Traceability Marker Extraction)  
**Track:** A  
**Duration:** 1-2 days  
**Canonical Sources:**
- BRD V20.6.3 §Epic 64, Story 64.3
- UTG Schema V20.6.1 §Marker Patterns
- Verification Spec V20.6.4 §Part IX, SANITY-030-033

> **v1.2.0:** Fixed instance_id prefixes to canonical uppercase forms (FILE-, FUNC-, CLASS-) per ENTRY.md  
> **v1.1.0:** Added service-layer imports; added projectId scoping; added architecture note

---

## User Story

> As the Gnosis system, I need to extract @implements and @satisfies markers from source code so that I can create verified links between code and requirements.

---

## BRD Linkage

This story implements **STORY-64.3** (Traceability Marker Extraction).
For BRD acceptance criteria, see BRD V20.6.3 §Epic 64, Story 64.3.

> **Governance Rule:** Track docs reference BRD stories but do not define or redefine AC-* identifiers. See Verification Spec Part XVII (Marker Governance).

---

## Execution Obligations

The following obligations must be satisfied for A3 completion. These derive from organ docs.

| Obligation | Organ Source | Verification |
|------------|--------------|--------------|
| Extract @implements STORY-X.Y markers | Verification Spec §SANITY-030 | VERIFY-MARKER-01 |
| Extract @satisfies AC-X.Y.Z markers | Verification Spec §SANITY-031 | VERIFY-MARKER-02 |
| Link markers to source entities | UTG Schema §Marker Patterns | VERIFY-MARKER-03 |
| Create R14/R18 IMPLEMENTS relationships | Verification Spec §10.2 | VERIFY-R14, VERIFY-R18 |
| Create R19 SATISFIES relationships | Verification Spec §10.2 | VERIFY-R19 |
| Validate marker targets exist | Verification Spec §Evidence | VERIFY-MARKER-04 |
| Report orphan markers to semantic corpus | Roadmap §Track A Pillars | Signal count includes ORPHAN_MARKER |
| Support multiline and block comments | SANITY-030/031 patterns | VERIFY-MARKER-06 |
| All marker extractions logged | Roadmap §Track A Pillars | Ledger count > 0 |

---

## Entry Criteria

- [ ] Story A.1 (Entity Registry) complete
- [ ] Story A.2 (Relationship Registry) complete
- [ ] Entity and relationship APIs operational
- [ ] SANITY-030 to 033 pass (marker patterns)

---

## Architecture Note

A3 operates within the **Provider + Service** layers:

```
MarkerProvider (src/extraction/providers/)
    ↓ emits raw markers (no DB access)
MarkerValidator (src/markers/)
    ↓ validates via entityService (service-layer, not API)
markers.ts API (src/api/v1/)
    ↓ orchestrates extraction, delegates persistence to relationshipService
```

**Layering rules:**
- Providers: NO imports from `src/db/*` or `src/services/*`
- Validators: MAY import from `src/services/*`, MUST NOT import from `src/api/*`
- API: Delegates to services, MUST NOT import from `src/db/*`

This story reuses entity/relationship services from A1/A2. It does NOT create new services.

---

## Marker Patterns

### @implements Pattern

```typescript
// Pattern: @implements STORY-{epic}.{story}
const IMPLEMENTS_PATTERN = /@implements\s+(STORY-\d+\.\d+)/g;

// Valid examples:
// @implements STORY-64.1
// @implements STORY-1.5
/* @implements STORY-39.6 */

// Invalid examples:
// @implements 64.1          (missing STORY- prefix)
// @implements STORY-64      (missing story number)
// @implements story-64.1    (wrong case)
```

### @satisfies Pattern

```typescript
// Pattern: @satisfies AC-{epic}.{story}.{ac}
const SATISFIES_PATTERN = /@satisfies\s+(AC-\d+\.\d+\.\d+)/g;

// Valid examples:
// @satisfies AC-64.1.1
// @satisfies AC-39.5.7
/* @satisfies AC-1.2.3 */

// Invalid examples:
// @satisfies 64.1.1         (missing AC- prefix)
// @satisfies AC-64.1        (missing AC number)
// @satisfies ac-64.1.1      (wrong case)
```

---

## Implementation Steps

### Step 1: Create Marker Types

```typescript
// src/markers/types.ts
// @implements STORY-64.3

export type MarkerType = 'implements' | 'satisfies';

export interface Marker {
  type: MarkerType;
  target_id: string;        // STORY-64.1 or AC-64.1.1
  source_entity_id: string; // FUNC-path:name or FILE-path
  line_number: number;
  raw_text: string;
  validated: boolean;
  validation_error?: string;
}

export interface MarkerExtractionResult {
  markers: Marker[];
  orphans: Marker[];  // Markers with targets that don't exist
  relationships: Relationship[];
}
```

> **Instance ID Rule:** All instance_id prefixes MUST match ENTRY.md canonical forms:
> - `FILE-{path}` for SourceFile (E11)
> - `FUNC-{path}:{name}` for Function (E12)
> - `CLASS-{path}:{name}` for Class (E13)
>
> Do NOT use lowercase prefixes like `function:`, `class:`, or `file:`.

### Step 2: Implement Marker Extractor

```typescript
// src/extraction/providers/marker-provider.ts
// @implements STORY-64.3
// @satisfies AC-64.3.1, AC-64.3.2, AC-64.3.8

import { Project, SyntaxKind, Node } from 'ts-morph';

const IMPLEMENTS_PATTERN = /@implements\s+(STORY-\d+\.\d+)/g;
const SATISFIES_PATTERN = /@satisfies\s+(AC-\d+\.\d+\.\d+)/g;

export class MarkerProvider implements ExtractionProvider {
  name = 'marker-provider';
  
  supports(fileType: string): boolean {
    return ['ts', 'tsx', 'js', 'jsx'].includes(fileType);
  }
  
  async extract(snapshot: RepoSnapshot): Promise<ExtractionResult> {
    const project = new Project();
    project.addSourceFilesAtPaths(`${snapshot.root_path}/src/**/*.{ts,tsx}`);
    
    const markers: Marker[] = [];
    
    for (const sourceFile of project.getSourceFiles()) {
      const filePath = sourceFile.getFilePath();
      const fileId = `FILE-${filePath}`;
      
      // Extract from file-level comments
      const fileComments = this.extractCommentsFromNode(sourceFile);
      for (const comment of fileComments) {
        markers.push(...this.parseMarkers(comment, fileId, filePath, snapshot));
      }
      
      // Extract from function-level comments
      for (const func of sourceFile.getFunctions()) {
        const funcId = `FUNC-${filePath}:${func.getName()}`;
        const jsDocs = func.getJsDocs();
        
        for (const jsDoc of jsDocs) {
          markers.push(...this.parseMarkers(jsDoc.getText(), funcId, filePath, snapshot));
        }
        
        // Also check leading comments
        const leadingComments = func.getLeadingCommentRanges();
        for (const comment of leadingComments) {
          const commentText = sourceFile.getFullText().slice(comment.getPos(), comment.getEnd());
          markers.push(...this.parseMarkers(commentText, funcId, filePath, snapshot));
        }
      }
      
      // Extract from class-level comments
      for (const cls of sourceFile.getClasses()) {
        const classId = `CLASS-${filePath}:${cls.getName()}`;
        const jsDocs = cls.getJsDocs();
        
        for (const jsDoc of jsDocs) {
          markers.push(...this.parseMarkers(jsDoc.getText(), classId, filePath, snapshot));
        }
      }
    }
    
    return { entities: [], relationships: [], evidence: [], markers };
  }
  
  private parseMarkers(
    text: string, 
    sourceEntityId: string, 
    filePath: string,
    snapshot: RepoSnapshot
  ): Marker[] {
    const markers: Marker[] = [];
    
    // Extract @implements markers
    let match;
    while ((match = IMPLEMENTS_PATTERN.exec(text)) !== null) {
      markers.push({
        type: 'implements',
        target_id: match[1],
        source_entity_id: sourceEntityId,
        line_number: this.getLineNumber(text, match.index),
        raw_text: match[0],
        validated: false
      });
    }
    
    // Reset regex
    IMPLEMENTS_PATTERN.lastIndex = 0;
    
    // Extract @satisfies markers
    while ((match = SATISFIES_PATTERN.exec(text)) !== null) {
      markers.push({
        type: 'satisfies',
        target_id: match[1],
        source_entity_id: sourceEntityId,
        line_number: this.getLineNumber(text, match.index),
        raw_text: match[0],
        validated: false
      });
    }
    
    // Reset regex
    SATISFIES_PATTERN.lastIndex = 0;
    
    return markers;
  }
  
  private getLineNumber(text: string, index: number): number {
    return text.slice(0, index).split('\n').length;
  }
}
```

### Step 3: Implement Marker Validator

```typescript
// src/markers/validator.ts
// @implements STORY-64.3
// @satisfies AC-64.3.6, AC-64.3.7

import * as entityService from '../services/entities/entity-service';
import { captureSemanticSignal } from '../ledger/semantic-corpus';
import type { Marker, MarkerExtractionResult } from './types';
import type { ExtractedRelationship } from '../extraction/types';

export class MarkerValidator {
  constructor(private projectId: string) {}

  async validate(markers: Marker[]): Promise<MarkerExtractionResult> {
    const validatedMarkers: Marker[] = [];
    const orphans: Marker[] = [];
    const relationships: ExtractedRelationship[] = [];
    
    for (const marker of markers) {
      // Check if target exists (project-scoped)
      const targetExists = await this.targetExists(marker.target_id);
      
      if (targetExists) {
        marker.validated = true;
        validatedMarkers.push(marker);
        
        // Create relationship
        const rel = this.createRelationship(marker);
        relationships.push(rel);
      } else {
        marker.validated = false;
        marker.validation_error = `Target ${marker.target_id} not found in entity registry`;
        orphans.push(marker);
        
        // Log as semantic signal for learning
        await captureSemanticSignal({
          type: 'ORPHAN_MARKER',
          marker_type: marker.type,
          target_id: marker.target_id,
          source_entity_id: marker.source_entity_id,
          evidence: marker
        });
      }
    }
    
    return { markers: validatedMarkers, orphans, relationships };
  }
  
  private async targetExists(targetId: string): Promise<boolean> {
    const entity = await entityService.getByInstanceId(this.projectId, targetId);
    return entity !== null;
  }
  
  private createRelationship(marker: Marker): ExtractedRelationship {
    // R18 = IMPLEMENTS (code → story), R19 = SATISFIES (code → AC)
    const relTypeCode = marker.type === 'implements' ? 'R18' : 'R19';
    
    return {
      relationship_type: relTypeCode,
      instance_id: `${relTypeCode}:${marker.source_entity_id}:${marker.target_id}`,
      name: `${marker.type.toUpperCase()}: ${marker.source_entity_id} → ${marker.target_id}`,
      from_instance_id: marker.source_entity_id,  // Resolved to UUID during persistence
      to_instance_id: marker.target_id,           // Resolved to UUID during persistence
      confidence: 1.0
    };
  }
}
```

### Step 4: Create Marker API

```typescript
// src/api/v1/markers.ts
// @implements STORY-64.3
// @satisfies AC-64.3.3, AC-64.3.4, AC-64.3.5, AC-64.3.9

import { MarkerProvider } from '../../extraction/providers/marker-provider';
import { MarkerValidator } from '../../markers/validator';
import { shadowLedger } from '../../ledger/shadow-ledger';
import * as relationshipService from '../../services/relationships/relationship-service';
import { computeHash } from '../../utils/hash';
import type { RepoSnapshot } from '../../extraction/types';
import type { MarkerExtractionResult, Marker } from '../../markers/types';

export async function extractAndValidateMarkers(
  projectId: string,
  snapshot: RepoSnapshot
): Promise<MarkerExtractionResult> {
  const provider = new MarkerProvider();
  const validator = new MarkerValidator(projectId);
  
  // Extract all markers
  const extracted = await provider.extract(snapshot);
  
  // Validate markers against entity registry (project-scoped)
  const result = await validator.validate(extracted.markers);
  
  // Log to shadow ledger
  for (const marker of result.markers) {
    await shadowLedger.append({
      timestamp: new Date(),
      operation: 'CREATE',
      entity_type: `marker:${marker.type}`,
      entity_id: `${marker.source_entity_id}:${marker.target_id}`,
      evidence: marker,
      hash: computeHash(marker)
    });
  }
  
  // Create relationships via service
  for (const rel of result.relationships) {
    await relationshipService.upsert(projectId, rel);
  }
  
  // Report orphans
  if (result.orphans.length > 0) {
    console.warn(`Found ${result.orphans.length} orphan markers:`);
    for (const orphan of result.orphans) {
      console.warn(`  - ${orphan.type} ${orphan.target_id} at ${orphan.source_entity_id}`);
    }
  }
  
  return result;
}

export async function getMarkersForEntity(
  projectId: string,
  entityId: string
): Promise<Marker[]> {
  // Get all relationships where this entity is the target (project-scoped)
  const implementsRels = await relationshipService.queryByType(projectId, 'R18', undefined, entityId);
  const satisfiesRels = await relationshipService.queryByType(projectId, 'R19', undefined, entityId);
  
  return [...implementsRels, ...satisfiesRels].map(rel => ({
    type: rel.relationship_type === 'R18' ? 'implements' : 'satisfies',
    target_id: entityId,
    source_entity_id: rel.from_id,
    line_number: rel.attributes?.marker_line,
    raw_text: rel.attributes?.marker_raw,
    validated: true
  }));
}
```

---

## Files to Create

| File | Purpose | Lines |
|------|---------|-------|
| `src/markers/types.ts` | Marker type definitions | ~30 |
| `src/extraction/providers/marker-provider.ts` | Marker extraction | ~150 |
| `src/markers/validator.ts` | Marker validation | ~80 |
| `src/api/v1/markers.ts` | Marker API operations | ~100 |
| `test/markers/marker-extraction.test.ts` | Marker tests | ~200 |

---

## Verification Tests

```typescript
// test/markers/marker-extraction.test.ts
// @implements STORY-64.3

describe('Marker Extraction', () => {
  // VERIFY-MARKER-01: @implements extraction
  it('extracts @implements markers', async () => {
    const testFile = createTestFile(`
      // @implements STORY-64.3
      function testFunction() {}
    `);
    
    const result = await markerProvider.extract(testFile);
    expect(result.markers.length).toBe(1);
    expect(result.markers[0].type).toBe('implements');
    expect(result.markers[0].target_id).toBe('STORY-64.3');
  });
  
  // VERIFY-MARKER-02: @satisfies extraction
  it('extracts @satisfies markers', async () => {
    const testFile = createTestFile(`
      // @satisfies AC-64.3.1
      function satisfyingFunction() {}
    `);
    
    const result = await markerProvider.extract(testFile);
    expect(result.markers.length).toBe(1);
    expect(result.markers[0].type).toBe('satisfies');
    expect(result.markers[0].target_id).toBe('AC-64.3.1');
  });
  
  // VERIFY-MARKER-03: Link to source entities
  it('links markers to source entities', async () => {
    const result = await extractAndValidateMarkers(snapshot);
    
    for (const marker of result.markers) {
      expect(marker.source_entity_id).toBeDefined();
      expect(marker.source_entity_id).toMatch(/^(FUNC-|CLASS-|FILE-)/);
    }
  });
  
  // VERIFY-MARKER-04: Validates target exists
  it('validates marker targets exist', async () => {
    const result = await extractAndValidateMarkers(snapshot);
    
    for (const marker of result.markers) {
      expect(marker.validated).toBe(true);
      const target = await getEntity(marker.target_id);
      expect(target).not.toBeNull();
    }
  });
  
  // VERIFY-MARKER-05: Reports orphan markers
  it('reports orphan markers', async () => {
    const testFile = createTestFile(`
      // @implements STORY-999.999
      function orphanFunction() {}
    `);
    
    const result = await extractAndValidateMarkers(testFile);
    expect(result.orphans.length).toBe(1);
    expect(result.orphans[0].validation_error).toContain('not found');
  });
  
  // VERIFY-MARKER-06: Supports multiline comments
  it('extracts from multiline comments', async () => {
    const testFile = createTestFile(`
      /**
       * @implements STORY-64.3
       * @satisfies AC-64.3.1
       */
      function documentedFunction() {}
    `);
    
    const result = await markerProvider.extract(testFile);
    expect(result.markers.length).toBe(2);
  });
  
  // VERIFY-R-IMPL: Creates IMPLEMENTS relationships
  it('creates IMPLEMENTS relationships', async () => {
    const result = await extractAndValidateMarkers(snapshot);
    const implementsRels = result.relationships.filter(r => r.type === 'IMPLEMENTS');
    expect(implementsRels.length).toBeGreaterThan(0);
  });
  
  // VERIFY-R-SAT: Creates SATISFIES relationships
  it('creates SATISFIES relationships', async () => {
    const result = await extractAndValidateMarkers(snapshot);
    const satisfiesRels = result.relationships.filter(r => r.type === 'SATISFIES');
    expect(satisfiesRels.length).toBeGreaterThan(0);
  });
});
```

---

## Verification Checklist

- [ ] All acceptance criteria implemented
- [ ] All VERIFY-MARKER-* tests pass
- [ ] Code has `@implements STORY-64.3` marker
- [ ] Functions have `@satisfies AC-64.3.*` markers
- [ ] Shadow ledger entries recorded for all markers
- [ ] Orphan markers logged as semantic signals
- [ ] **Mission Alignment:** Confirm no oracle claims (confidence ≠ truth, alignment ≠ understanding)
- [ ] **No Placeholders:** All bracketed placeholders resolved to concrete values

---

## Definition of Done

- [ ] Both @implements and @satisfies patterns extractable
- [ ] Markers linked to source entities (function/class/file)
- [ ] Relationships created for validated markers
- [ ] Orphan markers reported and logged
- [ ] Multiline and block comments supported
- [ ] All tests pass
- [ ] Committed with message: "STORY-64.3: Marker Extraction"

---

## Next Story

→ `A4_STRUCTURAL_ANALYSIS.md`

---

**END OF STORY A.3**
