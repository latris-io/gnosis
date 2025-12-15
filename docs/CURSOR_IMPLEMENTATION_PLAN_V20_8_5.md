# Cursor Implementation Plan

**Version:** 20.8.5 (Organ Alignment Edition)  
**Date:** December 14, 2025  
**Purpose:** Transform Roadmap V20.6.4 into Cursor-executable specifications  
**Status:** Master execution guide for Gnosis → Sophia  
**Supersedes:** V1.0.0, V20.5.1, V20.6.0, V20.6.1, V20.7.0, V20.8.0, V20.8.1, V20.8.2, V20.8.3, V20.8.4

---

## Implements Canonical Doc Set V20.6.4 + Organ Alignment

**Versioning Convention:** Cursor Plan uses monotonic versioning. V20.8.5 implements the canonical document set V20.6.4 (Organ Alignment Edition).

This version adds:
- **Organ Alignment** — Synchronized all companion document references
- **Dormant Isolation Rule** — Explicit enforcement of dormant entity/gate exclusion

Previous additions remain:
- **Claim Hygiene** (V20.6.3) — Track C "alignment accuracy" → "alignment agreement"
- **Constraint A.1: Modular Extraction** (V20.6.2) — Provider interface for Track A extraction
- **Constraint A.2: Evidence Anchors** (V20.6.2) — Durable provenance in `attributes` JSONB
- **Semantic Rubric Freeze** (V20.6.1) — Track C rubric version constraint
- **EP-D-002 Runtime Reconciliation** (V20.6.1) — D.9, E84-E85, R113-R114, G-RUNTIME (dormant)

**For complete EP-D-002 specification, see:** `docs/integrations/EP-D-002_RUNTIME_RECONCILIATION_V20_6_1.md`

---

## Executive Summary

This document defines how to execute the Gnosis → Sophia Roadmap using Cursor AI. It transforms the canonical documents into discrete, verifiable, Cursor-sized implementation packets.

### The Core Insight

> Cursor works best with focused, self-contained instructions under ~400 lines.
> The roadmap is a planning document. This plan creates execution documents.

### What This Plan Produces

```
A complete spec/ directory structure where:
- Each file fits Cursor's context window
- Each file is self-contained (no need to reference other files during execution)
- Each file has explicit entry criteria, implementation steps, and verification
- Human gates are explicit checkpoints
- Progress is traceable back to roadmap stories
- All decisions trace to canonical documents
```

### Version 20.8.0 Unification

This version merges:
- **V20.7.0**: Correct architecture (PostgreSQL + Neo4j + Vector store)
- **V1.0.0**: Complete execution scaffolding (templates, protocols, metrics)

---

## ⚠️ CRITICAL: Architecture Requirements

**V20.6.0 and V20.6.1 contained INCORRECT architecture decisions. This version corrects those errors.**

### What Was Wrong (V20.6.x) — DO NOT USE

| Incorrect Statement | Why It's Wrong |
|---------------------|----------------|
| "Map<string, Entity> storage (LOCKED)" | Never specified in canonical docs |
| "DO NOT USE: PostgreSQL, Neo4j" | Opposite of requirements |
| "JSONL-only persistence" | JSONL is Track A only, migrates in Track B |
| "ts-morph (LOCKED)" | Parser choice not mandated |

### What Is Correct (This Version)

| Correct Requirement | Canonical Source |
|---------------------|------------------|
| PostgreSQL with RLS | Roadmap A.1.4, BRD AC-39.6.1 |
| Neo4j for graph traversal | BRD AC-39.5.7, Epic 64 AC-64.5.10 |
| Vector store (pgvector) | BRD AC-39.5.8 |
| Shadow ledger: JSONL → Graph | Verification Spec §8.1.2 |
| Parser: Implementation choice | NOT mandated |

**Rule:** If a decision cannot be traced to a canonical document, it is NOT a constraint.

---

## Canonical Document Set

All implementation specs derive from these authoritative sources:

| Document | Version | Location | Purpose |
|----------|---------|----------|---------|
| **BRD** | V20.6.3 | `docs/BRD_V20_6_3_COMPLETE.md` | WHAT (requirements) |
| **UTG Schema** | V20.6.1 | `docs/UNIFIED_TRACEABILITY_GRAPH_SCHEMA_V20_6_1.md` | HOW (schema) |
| **Verification Spec** | V20.6.4 | `docs/UNIFIED_VERIFICATION_SPECIFICATION_V20_6_4.md` | PROOF (extraction rules, gates, tests) |
| **Roadmap** | V20.6.4 | `docs/GNOSIS_TO_SOPHIA_MASTER_ROADMAP_V20_6_4.md` | WHEN (execution plan) |
| **This Document** | V20.8.5 | `docs/CURSOR_IMPLEMENTATION_PLAN_V20_8_5.md` | HOW TO EXECUTE |
| **EP-D-002** | V20.6.1 | `docs/integrations/EP-D-002_RUNTIME_RECONCILIATION_V20_6_1.md` | Runtime Reconciliation spec |

### Canonical Mission Statement (Governance-Critical)

> **This system is not an oracle.** It does not claim to know truth, understand meaning, or verify correctness in the abstract.
>
> This system is a **traceability-first verification engine**. Its purpose is to provably govern and verify software evolution by:
> - enforcing end-to-end traceability from business requirements through implementation and tests,
> - constraining change through explicit envelopes, ledgers, and immutability rules,
> - and issuing only **evidence-bounded judgments** whose confidence is derived from measured alignment, not asserted understanding.
>
> Any "decision" produced by the system is: scoped to a formally defined universe of artifacts, grounded in explicit tests, traces, and rubrics, and auditable back to its source evidence.
>
> **Where the system appears oracle-like, it is only because the domain itself has been reduced to verifiable structure.** The system never claims truth beyond what its traceability and verification mechanisms can actually support.

**Governance Rule:** Every story card verification section MUST include: "Mission Alignment: Confirm no oracle claims (confidence ≠ truth, alignment ≠ understanding)."

**Rule:** Cursor specs reference these documents but are self-contained. All context needed for implementation is inlined into each spec file.

**Rule:** If a decision cannot be traced to a canonical document, it is **FORBIDDEN** until a traceable authority is added. Untraceable decisions are not "unconstrained space" — they are prohibited.

---

## Implementation Architecture

### Database Layer

| Component | Technology | Source | Purpose |
|-----------|------------|--------|---------|
| **Primary Database** | PostgreSQL 16+ | Roadmap A.1.4, BRD AC-39.6.1 | Entity/relationship storage with RLS |
| **Graph Database** | Neo4j 5.x | BRD AC-39.5.7 | Complex graph traversals |
| **Vector Store** | pgvector | BRD AC-39.5.8 | Semantic search (Track C+) |

### PostgreSQL Requirements (from BRD Story 39.6)

```
AC-39.6.1: PostgreSQL Row-Level Security (RLS) enabled on all tables
AC-39.6.2: RLS policies enforce project_id filtering
AC-39.6.3: RLS policies enforce user_id when applicable
AC-39.6.4: No query can bypass RLS policies
AC-39.6.5: Database service accounts have limited privileges
AC-39.6.7: Direct database access blocked (only via API)
```

### Neo4j Requirements (from BRD Story 39.5)

```
AC-39.5.7: Neo4j queries filtered by project_id
```

### Vector Store Requirements (from BRD Story 39.5)

```
AC-39.5.8: Vector store namespaced per project
```

### Shadow Ledger Evolution (from Verification Spec §8.1.2)

| Track | Shadow Ledger Storage | Migration |
|-------|----------------------|-----------|
| A | External file (JSONL) | — |
| B | Verify 100% match, migrate to graph | External → PostgreSQL/Neo4j |
| C | Graph-based | — |
| D | Graph-based | — |
| Sophia | Graph + cryptographic hash chain | — |

### G-API Boundary (from Verification Spec §8.3)

**G-API Gate Enforcement:**

```typescript
// FORBIDDEN (G-API VIOLATION):
import { db } from '../database';           // Direct database import
import { prisma } from '@prisma/client';    // Direct ORM import
import { connection } from '../db/pool';    // Direct connection pool

// REQUIRED (G-API COMPLIANT):
import { GraphAPI } from '@gnosis/api';     // Versioned API
import { query, mutate } from '@gnosis/api/v2';
```

**Rules:**

| Rule | Description | Severity |
|------|-------------|----------|
| RULE-API-001 | No direct database imports in track code | ERROR |
| RULE-API-002 | No cross-track internal imports | ERROR |
| RULE-API-003 | All graph operations through versioned API | ERROR |
| RULE-API-004 | API version must match current track | WARNING |
| RULE-API-005 | All API calls logged to shadow ledger | ERROR |

### Dormant Isolation Rule (V20.8.5)

EP-D-002 entities, relationships, and gates are **DORMANT** until Track D.9 activation. The gate runner MUST enforce isolation.

**Dormant Artifacts:**
- Entities: E84 (ExecutionTrace), E85 (RuntimeCall)
- Relationships: R113 (TRACES_EXECUTION), R114 (RECONCILES_WITH)
- Gate: G-RUNTIME
- SANITY Tests: SANITY-080 through SANITY-083

**Enforcement Rules:**

| Rule | Description | Severity |
|------|-------------|----------|
| RULE-DORMANT-001 | Gate runner MUST NOT load dormant tests/gates until D.9 activation | ERROR |
| RULE-DORMANT-002 | Referencing E84, E85, R113, R114, or G-RUNTIME in pre-D.9 code | ERROR |
| RULE-DORMANT-003 | Dormant SANITY tests (080-083) MUST return `{ pass: true, skipped: true, reason: 'DORMANT' }` | ERROR |

**Implementation:**

```typescript
// src/gates/runner.ts

const DORMANT_ENTITIES = ['E84', 'E85'];
const DORMANT_RELATIONSHIPS = ['R113', 'R114'];
const DORMANT_GATES = ['G-RUNTIME'];
const DORMANT_SANITY = ['SANITY-080', 'SANITY-081', 'SANITY-082', 'SANITY-083'];

function isActivated(storyId: string): boolean {
  // Check if D.9 activation story has been completed
  return getCompletedStories().includes('D.9');
}

function runSanityTest(testId: string): SanityResult {
  if (DORMANT_SANITY.includes(testId) && !isActivated('D.9')) {
    return { pass: true, skipped: true, reason: 'DORMANT' };
  }
  // ... normal test execution
}
```

### Parser Choice (Implementation Decision — NOT Mandated)

The canonical documents do not mandate a specific AST parser:

| Language | Recommended | Alternatives |
|----------|-------------|--------------|
| TypeScript/JavaScript | ts-morph | TypeScript Compiler API, Babel, @typescript-eslint |
| Markdown | unified + remark | marked, markdown-it |

---

## Infrastructure Requirements

### Track A: Architectural Constraints (V20.8.3 — MUST READ BEFORE IMPLEMENTING)

Before implementing Track A extraction, understand these two constraints. They do not change Track A's scope — they shape implementation to avoid costly refactoring post-Track B.

#### Constraint A.1: Extraction Provider Interface

**DO NOT** implement extraction as a monolithic module.

**DO** implement behind this interface:

```typescript
// src/extraction/types.ts

export interface RepoSnapshot {
  id: string;              // Unique snapshot identifier (UUID)
  root_path: string;       // Repo root absolute path
  commit_sha?: string;     // Git SHA if available
  timestamp: string;       // ISO timestamp
}

export interface ExtractionProvider {
  readonly id: string;           // e.g., "typescript-ts-morph"
  readonly version: string;      // semver, e.g., "1.0.0"
  readonly languages: string[];  // e.g., ["typescript", "javascript"]
  
  extractEntities(snapshot: RepoSnapshot): Promise<ExtractedEntity[]>;
  extractRelationships(snapshot: RepoSnapshot): Promise<ExtractedRelationship[]>;
  extractMarkers(snapshot: RepoSnapshot): Promise<ExtractedMarker[]>;
}
```

**Implementation Pattern:**

```typescript
// src/extraction/providers/typescript-ts-morph.ts

export class TypeScriptTsMorphProvider implements ExtractionProvider {
  readonly id = 'typescript-ts-morph';
  readonly version = '1.0.0';
  readonly languages = ['typescript', 'javascript'];
  
  async extractEntities(snapshot: RepoSnapshot): Promise<ExtractedEntity[]> {
    // Implementation using ts-morph
  }
  // ... other methods
}

// src/extraction/registry.ts

export class ExtractionRegistry {
  private providers = new Map<string, ExtractionProvider>();
  
  register(provider: ExtractionProvider): void {
    this.providers.set(provider.id, provider);
  }
  
  getProviders(): ExtractionProvider[] {
    return Array.from(this.providers.values());
  }
}
```

**Why:** Adding new providers later becomes registration, not refactoring. Track B closure remains valid.

**Verification:** SANITY-043

---

#### Constraint A.2: Evidence Anchor Capture

**DO NOT** extract entities or relationships without evidence anchors.

**DO** include evidence anchors in the `attributes` JSONB field:

```typescript
// src/extraction/types.ts

export interface EvidenceAnchor {
  snapshot_id: string;        // Links to RepoSnapshot.id
  file_path: string;          // Relative path from repo root
  file_hash: string;          // SHA256 of file content at extraction
  span: {
    start_line: number;       // 1-indexed
    start_col: number;        // 0-indexed
    end_line: number;
    end_col: number;
  };
  ast_node_type?: string;     // e.g., "FunctionDeclaration"
  extraction_timestamp: string;
  provider_id: string;
  provider_version: string;
}

export interface ExtractedEntity {
  entity_type: string;
  instance_id: string;
  name: string;
  attributes: {
    evidence_anchor: EvidenceAnchor;  // REQUIRED
    [key: string]: unknown;
  };
}

export interface ExtractedRelationship {
  relationship_type: string;
  from_entity: string;
  to_entity: string;
  attributes: {
    evidence_anchor: EvidenceAnchor;  // REQUIRED for explicit relationships
    [key: string]: unknown;
  };
}
```

**Implementation Pattern:**

```typescript
function extractFunction(
  node: FunctionDeclaration, 
  snapshot: RepoSnapshot, 
  provider: ExtractionProvider
): ExtractedEntity {
  const sourceFile = node.getSourceFile();
  
  return {
    entity_type: 'E13',
    instance_id: `E13-${generateHash(node)}`,
    name: node.getName() || 'anonymous',
    attributes: {
      evidence_anchor: {
        snapshot_id: snapshot.id,
        file_path: path.relative(snapshot.root_path, sourceFile.getFilePath()),
        file_hash: sha256(sourceFile.getFullText()),
        span: {
          start_line: node.getStartLineNumber(),
          start_col: node.getStart() - sourceFile.getLineStarts()[node.getStartLineNumber() - 1],
          end_line: node.getEndLineNumber(),
          end_col: node.getEnd() - sourceFile.getLineStarts()[node.getEndLineNumber() - 1]
        },
        ast_node_type: node.getKindName(),
        extraction_timestamp: new Date().toISOString(),
        provider_id: provider.id,
        provider_version: provider.version
      },
      parameters: node.getParameters().map(p => p.getName()),
      return_type: node.getReturnType()?.getText()
    }
  };
}
```

**Storage:** Uses existing `attributes` JSONB column in PostgreSQL schema. No schema changes required.

**Immutability Rule:** Evidence anchors are immutable for a given `(snapshot_id, provider_id, provider_version)` tuple. A new snapshot produces new anchors (expected behavior during re-extraction).

**Why:** Future ProofBundle generation requires this data. Re-ingestion cannot reconstruct it.

**Verification:** SANITY-044

---

#### Pre-Implementation Checklist

Before writing Track A extraction code:

- [ ] ExtractionProvider interface defined in `src/extraction/types.ts`
- [ ] ExtractionRegistry implemented in `src/extraction/registry.ts`
- [ ] EvidenceAnchor interface defined in `src/extraction/types.ts`
- [ ] TypeScriptTsMorphProvider scaffolded
- [ ] Provider registered in registry during initialization

#### Post-Track A Verification

Before marking Track A complete:

- [ ] SANITY-043 passes (provider interface exists and is used)
- [ ] SANITY-044 passes (all entities AND relationships have evidence anchors)
- [ ] No extraction code bypasses provider interface
- [ ] Evidence anchors persist through all graph operations

---

### Pre-Track Setup Checklist

```
[ ] PostgreSQL 16+ installed and running
[ ] PostgreSQL database created (gnosis)
[ ] PostgreSQL RLS policies ready (can be empty initially)
[ ] Neo4j 5.x installed and running
[ ] Neo4j database created (gnosis)
[ ] Vector store configured (pgvector extension)
[ ] Node.js 18+ installed
[ ] TypeScript 5.x configured
[ ] shadow-ledger/ledger.jsonl created (empty)
[ ] semantic-corpus/signals.jsonl created (empty)
[ ] Docker Compose configured for local dev
```

### Database Schema (Track A — from Roadmap A.1.4)

```sql
-- PostgreSQL schema for entities
CREATE TABLE entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(10) NOT NULL,
  instance_id VARCHAR(500) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  attributes JSONB DEFAULT '{}',
  source_file VARCHAR(500),
  line_start INTEGER,
  line_end INTEGER,
  content_hash VARCHAR(71),
  extracted_at TIMESTAMPTZ DEFAULT NOW(),
  project_id UUID NOT NULL,
  
  CONSTRAINT valid_entity_type CHECK (entity_type ~ '^E[0-9]{2}$')
);

-- Indexes for performance (A.1.4)
CREATE INDEX idx_entities_type ON entities(entity_type);
CREATE INDEX idx_entities_project ON entities(project_id);
CREATE INDEX idx_entities_instance ON entities(instance_id);

-- Row-Level Security (BRD AC-39.6.1)
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
CREATE POLICY entities_isolation ON entities
  USING (project_id = current_setting('app.current_project')::UUID);

-- PostgreSQL schema for relationships
CREATE TABLE relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_type VARCHAR(10) NOT NULL,
  instance_id VARCHAR(500) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  from_entity_id UUID NOT NULL REFERENCES entities(id),
  to_entity_id UUID NOT NULL REFERENCES entities(id),
  confidence DECIMAL(3,2) DEFAULT 1.0,
  extracted_at TIMESTAMPTZ DEFAULT NOW(),
  project_id UUID NOT NULL,
  
  CONSTRAINT valid_relationship_type CHECK (relationship_type ~ '^R[0-9]{2}$'),
  CONSTRAINT valid_confidence CHECK (confidence >= 0 AND confidence <= 1)
);

-- Indexes
CREATE INDEX idx_relationships_type ON relationships(relationship_type);
CREATE INDEX idx_relationships_from ON relationships(from_entity_id);
CREATE INDEX idx_relationships_to ON relationships(to_entity_id);
CREATE INDEX idx_relationships_project ON relationships(project_id);

-- RLS
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
CREATE POLICY relationships_isolation ON relationships
  USING (project_id = current_setting('app.current_project')::UUID);

-- Shadow ledger entries (for Track B migration)
CREATE TABLE ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_type VARCHAR(50) NOT NULL,
  entry_data JSONB NOT NULL,
  content_hash VARCHAR(71) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  project_id UUID NOT NULL
);

ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY ledger_isolation ON ledger_entries
  USING (project_id = current_setting('app.current_project')::UUID);
```

### Neo4j Schema (Track A)

```cypher
// Entity node constraint
CREATE CONSTRAINT entity_unique IF NOT EXISTS
FOR (e:Entity) REQUIRE e.instance_id IS UNIQUE;

// Relationship property indexes
CREATE INDEX rel_type_idx IF NOT EXISTS FOR ()-[r:RELATES]-() ON (r.type);

// Project isolation index
CREATE INDEX entity_project_idx IF NOT EXISTS FOR (e:Entity) ON (e.project_id);
```

---

## Directory Structure

```
gnosis/
├── docs/                                    # Canonical documents (read-only reference)
│   ├── BRD_V20_6_3_COMPLETE.md
│   ├── UNIFIED_TRACEABILITY_GRAPH_SCHEMA_V20_6_1.md
│   ├── UNIFIED_VERIFICATION_SPECIFICATION_V20_6_4.md
│   ├── GNOSIS_TO_SOPHIA_MASTER_ROADMAP_V20_6_4.md
│   ├── CURSOR_IMPLEMENTATION_PLAN_V20_8_0.md
│   └── integrations/
│       └── EP-D-002_RUNTIME_RECONCILIATION_V20_6_1.md
│
├── spec/                                    # Cursor-executable specifications
│   ├── 00_pre_track_validation/
│   │   ├── OVERVIEW.md
│   │   ├── SANITY_SUITE.md
│   │   ├── SYNTHETIC_CORPUS.md
│   │   ├── SCHEMA_FREEZE_RULES.md
│   │   ├── LEDGER_SCHEMAS.md
│   │   └── VALIDATION_PROMPTS.md
│   │
│   ├── track_a/
│   │   ├── OVERVIEW.md
│   │   ├── ENTRY.md
│   │   ├── stories/
│   │   │   ├── A1_ENTITY_REGISTRY.md
│   │   │   ├── A2_RELATIONSHIP_REGISTRY.md
│   │   │   ├── A3_MARKER_EXTRACTION.md
│   │   │   ├── A4_STRUCTURAL_ANALYSIS.md
│   │   │   └── A5_GRAPH_API_V1.md
│   │   ├── EXIT.md
│   │   ├── HUMAN_GATE_HGR1.md
│   │   └── TRACK_A_PROMPTS.md
│   │
│   ├── track_b/
│   │   ├── OVERVIEW.md
│   │   ├── ENTRY.md
│   │   ├── stories/
│   │   │   ├── B1_GROUND_TRUTH.md
│   │   │   ├── B2_BRD_REGISTRY.md
│   │   │   ├── B3_DRIFT_DETECTION.md
│   │   │   ├── B4_CLOSURE_CHECK.md
│   │   │   ├── B5_SHADOW_LEDGER_MIGRATION.md
│   │   │   ├── B6_GRAPH_API_V2.md
│   │   │   └── B7_SEMANTIC_CORPUS_EXPORT.md
│   │   ├── EXIT.md
│   │   ├── HUMAN_GATE_HGR2.md              # ⭐ CRITICAL: Oracle transition
│   │   └── TRACK_B_PROMPTS.md
│   │
│   ├── track_c/
│   │   ├── OVERVIEW.md
│   │   ├── ENTRY.md
│   │   ├── stories/
│   │   │   ├── C1_SEMANTIC_ALIGNMENT.md
│   │   │   ├── C2_CONFIDENCE_PROPAGATION.md
│   │   │   ├── C3_HYPOTHESIS_LIFECYCLE.md
│   │   │   ├── C4_EXTENSION_PROTOCOL.md
│   │   │   └── C5_GRAPH_API_V3.md
│   │   ├── EXIT.md
│   │   ├── HUMAN_GATE_HGR3.md
│   │   └── TRACK_C_PROMPTS.md
│   │
│   ├── track_d/
│   │   ├── OVERVIEW.md
│   │   ├── ENTRY.md
│   │   ├── stories/
│   │   │   ├── D1_POLICY_REGISTRY.md
│   │   │   ├── D2_AUTONOMY_FRAMEWORK.md
│   │   │   ├── D3_SIMULATION_ENGINE.md
│   │   │   └── D4_GRAPH_API_V4.md
│   │   ├── EXIT.md
│   │   ├── HUMAN_GATE_HGR4.md
│   │   └── TRACK_D_PROMPTS.md
│   │
│   └── sophia_v1/
│       ├── OVERVIEW.md
│       ├── CONTINUOUS_EVOLUTION.md
│       └── SOPHIA_PROMPTS.md
│
├── src/                                     # Implementation code
│   ├── db/                                  # Database modules (INTERNAL ONLY)
│   │   ├── postgres.ts
│   │   └── neo4j.ts
│   ├── api/                                 # Graph API (public interface)
│   │   ├── v1/
│   │   ├── v2/
│   │   ├── v3/
│   │   └── v4/
│   ├── schema/
│   │   ├── track-a/
│   │   ├── track-b/
│   │   ├── track-c/
│   │   └── track-d/
│   ├── extraction/
│   ├── validation/
│   └── ledger/
│
├── test/
│   ├── sanity/
│   └── verification/
│
├── shadow-ledger/                           # External shadow ledger (Track A/B)
│   └── ledger.jsonl
│
├── semantic-corpus/                         # Semantic signals
│   └── signals.jsonl
│
├── migrations/                              # Database migrations
│   ├── 001_initial_schema.sql
│   └── ...
│
├── docker-compose.yml                       # PostgreSQL + Neo4j containers
├── package.json
├── tsconfig.json
└── .current-track                           # Contains "PRE", "A", "B", "C", "D", or "SOPHIA"
```

---

## File Types and Templates

### 1. OVERVIEW.md (Per Track)

**Purpose:** Provide track context without implementation details.  
**Size:** ~100-150 lines  
**When to use:** At the start of each track for orientation.

```markdown
# Track [X]: [Name]

## Purpose
[One paragraph describing what this track accomplishes]

## Question Answered
"[The question this track answers, from roadmap]"

## Infrastructure Requirements

| Component | Required | Version/Config |
|-----------|----------|----------------|
| PostgreSQL | Yes | 16+ with RLS enabled |
| Neo4j | Yes | 5.x |
| Vector Store | [Track C+] | pgvector |

## Database Operations

This track adds/modifies:
- Tables: [list]
- Indexes: [list]
- RLS Policies: [list]

## Scope Summary
- Entities: [count] ([list or "no new entities"])
- Relationships: [count] ([list or "no new relationships"])
- Gates: [count] ([list])
- API Version: v[X]

## Dependencies
- Requires: [prior track or "none"]
- Enables: [next track]

## Timeline
- Base: [X] days
- Contingency: +[Y] days
- Total: [Z] days

## Stories in This Track
1. [Story X.1]: [Title] (~[N] days)
2. [Story X.2]: [Title] (~[N] days)
...

## Key Risks
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| ... | ... | ... | ... |

## Pillar Integration
- **Shadow Ledger:** [how this track uses it]
- **Semantic Learning:** [how this track uses it]
- **API Boundary:** [what API version this track exposes/consumes]
- **Extension Protocol:** [if applicable]
```

---

### 2. ENTRY.md (Per Track)

**Purpose:** Checklist that must be 100% complete before track begins.  
**Size:** ~50-100 lines  
**When to use:** Before starting any story in the track.

```markdown
# Track [X] Entry Criteria

## Prerequisites
All items must be checked before proceeding to Track [X] stories.

### Infrastructure Verification
- [ ] PostgreSQL running and accessible
- [ ] PostgreSQL RLS enabled on all tables
- [ ] Neo4j running and accessible
- [ ] Database migrations applied
- [ ] Prior track API operational

### Prior Track Completion
- [ ] Track [X-1] EXIT.md all items checked
- [ ] Human Gate HGR-[X-1] signed and dated
- [ ] Ingestion #[X-1] completed successfully

### Validation Suite
- [ ] Core Sanity Suite passes
- [ ] VERIFY-E* tests pass for prior track entities
- [ ] VERIFY-R* tests pass for prior track relationships

### Artifacts Present
- [ ] Shadow ledger intact and valid
- [ ] Semantic corpus has ≥[N] signals
- [ ] Graph API v[X-1] operational

### Schema State
- [ ] Prior track schemas frozen (no modifications permitted)
- [ ] Extension proposals (if any) approved

## Entry Certification

```
I certify that all entry criteria have been verified:

Name: _____________
Date: _____________
```

## Proceed To
→ Start with: stories/[X]1_[FIRST_STORY].md
```

---

### 3. Story Card ([X]N_[NAME].md)

**Purpose:** Complete implementation specification for one story.  
**Size:** ~200-400 lines  
**When to use:** One Cursor session per story card.

```markdown
# Story [X].[N]: [Title]

## Context
[2-3 sentences describing what this story does and why]

## References
- **Roadmap:** Section "Story [X].[N]: [Title]"
- **Verification Spec:** [relevant sections]
- **Epic 64:** [relevant entity/relationship definitions]
- **BRD:** [relevant requirements]

## Dependencies
- **Requires:** [prior stories in this track, or "none"]
- **Enables:** [subsequent stories]

## Acceptance Criteria

| AC | Description | Pillar | Verification |
|----|-------------|--------|--------------|
| [X].[N].1 | [Description] | [Shadow/Semantic/API/—] | [VERIFY-* or test] |
| [X].[N].2 | [Description] | [Pillar] | [Verification] |
| ... | ... | ... | ... |

## Technical Specification

### Database Changes
[Any PostgreSQL/Neo4j schema changes]

### API Changes
[Any Graph API additions/modifications]

### [Component 1]
[Detailed specification with types, schemas, algorithms]

### [Component 2]
[Detailed specification]

## Files to Create

```
src/[module]/
├── [file1].ts          # [purpose]
├── [file2].ts          # [purpose]
└── [file3].ts          # [purpose]

test/[module]/
├── [file1].test.ts     # [what it tests]
└── [file2].test.ts     # [what it tests]
```

## Implementation Steps

1. [First step - specific instruction]
2. [Second step - specific instruction]
3. [Third step - specific instruction]
...

## Pillar Compliance

### Shadow Ledger
- [ ] Schema used: [entity-link / relationship-link / requirement-link]
- [ ] All operations logged with content_hash
- [ ] [Specific shadow ledger requirement]

### Semantic Learning
- [ ] [Specific semantic requirement, or "N/A for this story"]

### Semantic Rubric Freeze (Track C+) — V20.8.2

**CRITICAL for Track C and beyond:** All semantic alignment implementations MUST:

1. **Reference frozen rubric:** Every semantic alignment entry includes `rubric_version` field (e.g., `RUBRIC-2025-001`)
2. **Record in ledger:** Shadow ledger semantic-link schema requires `rubric_version` (RULE-LEDGER-033)
3. **Gate validation:** G-SEMANTIC and G-ALIGNMENT gates fail if rubric_version missing or inconsistent
4. **Update protocol:** Rubric version changes require HGR-3 human gate approval

**Implementation Checklist:**
- [ ] Rubric file exists at `config/semantic_rubric_v{VERSION}.yaml`
- [ ] SemanticAlignmentEntry interface includes `rubric_version` field
- [ ] Shadow ledger entries include `rubric_version`
- [ ] Gate evaluations validate rubric consistency

**Why This Matters:** Without a frozen rubric, semantic interpretations can drift between model versions, invalidating prior alignment decisions and breaking audit trails required for compliance-driven enterprise deployments.

### API Boundary
- [ ] All database access via Graph API only
- [ ] No direct imports from src/db/
- [ ] [Specific API requirement]

## Verification Checklist

- [ ] All acceptance criteria implemented
- [ ] All VERIFY-* tests pass
- [ ] Code has `@implements STORY-[X].[N]` marker
- [ ] Functions have `@satisfies AC-[X].[N].*` markers
- [ ] Shadow ledger entries recorded
- [ ] No direct database access from outside src/db/
- [ ] **Mission Alignment:** Confirm no oracle claims (confidence ≠ truth, alignment ≠ understanding)
- [ ] **No Placeholders:** All bracketed placeholders resolved to concrete values

## Definition of Done

- [ ] All files created per specification
- [ ] All tests pass
- [ ] All pillar compliance items checked
- [ ] All verification items checked
- [ ] Code reviewed (semantic signal captured)
- [ ] Committed with message: "STORY-[X].[N]: [Title]"

## Next Story
→ [X][N+1]_[NEXT_STORY].md
```

---

### 4. EXIT.md (Per Track)

**Purpose:** Verification checklist before human gate.  
**Size:** ~100-150 lines  
**When to use:** After all stories complete, before human gate.

```markdown
# Track [X] Exit Criteria

## Story Completion
- [ ] Story [X].1 Definition of Done complete
- [ ] Story [X].2 Definition of Done complete
- [ ] Story [X].3 Definition of Done complete
...

## Entity Verification
[For tracks that add entities]
- [ ] VERIFY-E[XX]: [Entity] extraction passes
...

## Relationship Verification
[For tracks that add relationships]
- [ ] VERIFY-R[XX]: [Relationship] extraction passes
...

## Gate Verification
- [ ] G[XX]: [Gate] passes with threshold
...

## Pillar Verification

### Shadow Ledger
- [ ] All changes recorded in shadow ledger
- [ ] Shadow ledger entry count: [expected]
- [ ] No unrecorded modifications
- [ ] content_hash valid for all entries

### Semantic Learning
- [ ] Semantic signals captured: ≥[N]
- [ ] Signal quality review complete

### API Boundary
- [ ] Graph API v[X] exposed and documented
- [ ] No cross-track internal imports
- [ ] G-API gate passes
- [ ] No direct database imports in track code

## Integration Verification
- [ ] Full ingestion completes without error
- [ ] PostgreSQL data matches Neo4j graph
- [ ] [Track-specific integration checks]

## Exit Certification

```
I certify that all exit criteria have been verified:

Name: _____________
Date: _____________
```

## Proceed To
→ HUMAN_GATE_HGR[X].md
```

---

### 5. HUMAN_GATE_HGRX.md (Per Track)

**Purpose:** Explicit human approval checkpoint.  
**Size:** ~50-100 lines  
**When to use:** After EXIT.md complete, before ingestion.

```markdown
# Human Gate HGR-[X]: [Track Name]

## Gate Purpose
[Description of what this human gate verifies]

## Criticality
[Normal / HIGH / CRITICAL]
[For HGR-2: "CRITICAL - Oracle transition. After this gate, Gnosis validates itself."]

## Review Checklist

### Documentation Review
- [ ] EXIT.md all items verified
- [ ] Shadow ledger reviewed for completeness
- [ ] Semantic signals reviewed for quality

### Technical Review
- [ ] All gates passing
- [ ] Integration tests passing
- [ ] No unexpected drift detected
- [ ] PostgreSQL and Neo4j data consistent

### Architecture Compliance
- [ ] No G-API violations detected
- [ ] All database access through Graph API
- [ ] RLS policies enforced

### Risk Assessment
- [ ] Known risks acceptable
- [ ] Contingency plans in place
- [ ] Rollback procedure documented

## [Track-Specific Verifications]
[Any special verifications for this track]

## Approval

```
HUMAN GATE HGR-[X] APPROVAL

I, [Name], have verified that:

1. [ ] All exit criteria are genuinely met
2. [ ] Shadow ledger entries match expectations
3. [ ] Semantic signals are reasonable
4. [ ] Technical review is satisfactory
5. [ ] Architecture compliance verified
6. [ ] Risks are acceptable
[Track-specific items]

Decision: [ ] APPROVE  [ ] REJECT  [ ] DEFER

If REJECT/DEFER, reason:
_________________________________

Signature: _____________
Date: _____________
Role: _____________
```

## After Approval
→ Proceed to Ingestion #[X]
→ Then: track_[next]/ENTRY.md
```

---

### 6. PROMPTS.md (Per Track)

**Purpose:** Ready-to-use Cursor prompts for each phase.  
**Size:** ~200-300 lines  
**When to use:** Copy-paste into Cursor for each task.

```markdown
# Track [X] Cursor Prompts

## How to Use This File
1. Open the relevant story card in Cursor
2. Copy the appropriate prompt from this file
3. Paste into Cursor chat
4. Cursor will implement based on the story card + prompt

---

## Story [X].1: [Title]

### Initial Implementation Prompt
```
I need you to implement Story [X].1 based on the specification in this file.

Key requirements:
1. Create all files listed in "Files to Create"
2. Implement all acceptance criteria
3. Add @implements STORY-[X].1 marker to main file
4. Add @satisfies AC-[X].1.* markers to relevant functions
5. Create tests that verify each AC
6. Use Graph API for all database operations (no direct DB imports)
7. Log all operations to shadow ledger

Start with [specific starting point].

Do not:
- Import from other track directories
- Access the database directly (use @gnosis/api only)
- Skip the shadow ledger logging
- Import from src/db/ in track code
```

### Verification Prompt
```
Please verify the implementation of Story [X].1:

1. Run all tests and show results
2. Check that all files in "Files to Create" exist
3. Verify @implements and @satisfies markers are present
4. Confirm shadow ledger entries were created
5. Check for any direct database imports (G-API violations)
6. Check the Definition of Done items

Show me any items that are not complete.
```

### Fix Issues Prompt
```
The following issues were found in Story [X].1:
[paste issues]

Please fix these issues while maintaining:
- All existing tests passing
- Shadow ledger logging
- Marker annotations
- Graph API usage (no direct DB access)
```

---

## Story [X].2: [Title]
[Same pattern...]

---

## Track Exit Verification Prompt
```
Please run the Track [X] exit verification:

1. Run all VERIFY-E* tests for Track [X] entities
2. Run all VERIFY-R* tests for Track [X] relationships
3. Run all gate checks (G[XX], G[YY], ...)
4. Verify shadow ledger completeness
5. Count semantic signals captured
6. Check for any cross-track imports
7. Verify PostgreSQL and Neo4j data consistency

Generate a report showing pass/fail for each item.
```
```

---

## Execution Protocol

### Phase 1: Setup

```
1. Create directory structure per this plan
2. Copy canonical documents to docs/
3. Initialize PostgreSQL database with schema
4. Initialize Neo4j database with constraints
5. Configure docker-compose.yml for local dev
6. Initialize git repository
7. Create shadow-ledger/ledger.jsonl (empty)
8. Create semantic-corpus/signals.jsonl (empty)
9. Set .current-track to "PRE"
10. Generate spec/ files (using templates above)
```

### Phase 2: Pre-Track Validation

```
1. Open spec/00_pre_track_validation/OVERVIEW.md in Cursor
2. Use prompts from VALIDATION_PROMPTS.md to:
   a. Verify infrastructure (PostgreSQL, Neo4j running)
   b. Create synthetic test corpus
   c. Implement sanity suite
   d. Run validation
3. All sanity tests must pass before proceeding
4. Set .current-track to "A"
```

### Phase 3: Track Execution (Repeat for A, B, C, D)

```
For each Track:

1. ENTRY PHASE
   a. Open spec/track_[x]/ENTRY.md
   b. Verify all prerequisites (including infrastructure)
   c. Sign entry certification

2. BUILD PHASE
   For each story in order:
   a. Open spec/track_[x]/stories/[story].md in Cursor
   b. Copy implementation prompt from TRACK_[X]_PROMPTS.md
   c. Cursor implements story
   d. Run verification prompt
   e. Fix any issues
   f. Complete Definition of Done
   g. Commit with story ID in message
   h. Record semantic signal (code review)

3. EXIT PHASE
   a. Open spec/track_[x]/EXIT.md
   b. Run exit verification prompt
   c. Complete all checklist items
   d. Sign exit certification

4. HUMAN GATE
   a. Open spec/track_[x]/HUMAN_GATE_HGR[X].md
   b. Human reviews all materials
   c. Human signs approval

5. INGESTION
   a. Run ingestion #[X]
   b. Verify success
   c. Update .current-track to next track
   d. Proceed to next track
```

### Phase 4: Sophia Activation

```
1. Complete Track D with HGR-4 approval
2. Run Ingestion #4
3. Set .current-track to "SOPHIA"
4. Activate continuous evolution per sophia_v1/
5. Human oversight continues via HGR-5+
```

---

## Integration Map: Spec ↔ Verification ↔ Roadmap

### Track A Integration

| Spec File | Roadmap Story | Verification Rules | Gates |
|-----------|---------------|-------------------|-------|
| A1_ENTITY_REGISTRY.md | A.1 | VERIFY-E01..E16 | G01 |
| A2_RELATIONSHIP_REGISTRY.md | A.2 | VERIFY-R01..R21 | G03 |
| A3_MARKER_EXTRACTION.md | A.3 | SANITY-020..024 | G04 |
| A4_STRUCTURAL_ANALYSIS.md | A.4 | SANITY-040..042 | G06 |
| A5_GRAPH_API_V1.md | A.5 | G-API | G-API |

### Track B Integration

| Spec File | Roadmap Story | Verification Rules | Gates |
|-----------|---------------|-------------------|-------|
| B1_GROUND_TRUTH.md | B.1 | G-REGISTRY | G-REGISTRY |
| B2_BRD_REGISTRY.md | B.2 | BRD count verification | G-REGISTRY |
| B3_DRIFT_DETECTION.md | B.3 | Drift analysis | G-DRIFT |
| B4_CLOSURE_CHECK.md | B.4 | Deterministic ingestion | G-CLOSURE |
| B5_SHADOW_LEDGER_MIGRATION.md | B.5 | 100% ledger match | G-HEALTH |
| B6_GRAPH_API_V2.md | B.6 | API versioning | G-API |
| B7_SEMANTIC_CORPUS_EXPORT.md | B.7 | Corpus export | — |

### Track C Integration

| Spec File | Roadmap Story | Verification Rules | Gates |
|-----------|---------------|-------------------|-------|
| C1_SEMANTIC_ALIGNMENT.md | C.1 | VERIFY-E semantic entities | G-SEMANTIC |
| C2_CONFIDENCE_PROPAGATION.md | C.2 | Confidence scoring | G-CONFIDENCE |
| C3_HYPOTHESIS_LIFECYCLE.md | C.3 | Hypothesis validation | G-ALIGNMENT |
| C4_EXTENSION_PROTOCOL.md | C.4 | Extension rules | G-COMPATIBILITY |
| C5_GRAPH_API_V3.md | C.5 | API versioning | G-API |

### Track D Integration

| Spec File | Roadmap Story | Verification Rules | Gates |
|-----------|---------------|-------------------|-------|
| D1_POLICY_REGISTRY.md | D.1 | Policy entities | G-POLICY |
| D2_AUTONOMY_FRAMEWORK.md | D.2 | Autonomy bounds | G-AUTONOMY |
| D3_SIMULATION_ENGINE.md | D.3 | Simulation verification | G-SIMULATION |
| D4_GRAPH_API_V4.md | D.4 | Final API version | G-API, G-OPS |

---

## SANITY Suite Integration

### SANITY Test Mapping

| Test ID | Category | Location | Track |
|---------|----------|----------|-------|
| SANITY-001..005 | ONTOLOGY | test/sanity/ontology.test.ts | Pre-Track |
| SANITY-010..014 | INTEGRITY | test/sanity/integrity.test.ts | Pre-Track |
| SANITY-020..024 | MARKER | test/sanity/markers.test.ts | Track A |
| SANITY-030..033 | COVERAGE | test/sanity/coverage.test.ts | Track A |
| SANITY-040..044 | EXTRACTION | test/sanity/extraction.test.ts | Track A |

### SANITY Suite File Structure

```
test/sanity/
├── index.ts              # Sanity suite runner
├── ontology.test.ts      # SANITY-001 to SANITY-005
├── integrity.test.ts     # SANITY-010 to SANITY-014
├── markers.test.ts       # SANITY-020 to SANITY-024
├── coverage.test.ts      # SANITY-030 to SANITY-033
└── extraction.test.ts    # SANITY-040 to SANITY-042
```

### Running SANITY Tests

```bash
# Run full sanity suite
npm run sanity

# Run specific category
npm run sanity -- --category=ONTOLOGY

# Run specific test
npm run sanity -- --test=SANITY-001
```

---

## Traceability Requirements

### Code Markers

Every source file must have:
```typescript
/**
 * @implements STORY-X.N
 * @track A|B|C|D
 */
```

Every function/class satisfying an AC must have:
```typescript
/**
 * @satisfies AC-X.N.M
 */
```

### Commit Messages

Format: `STORY-X.N: [Title] - [brief description]`

Example: `STORY-A.1: Entity Registry - implement 16 entity types with CRUD`

### Shadow Ledger Entries

Every extraction operation must log (using appropriate schema):

```json
{
  "schema": "entity-link",
  "timestamp": "ISO-8601",
  "operation": "CREATE",
  "entity_id": "E11:FILE-example.ts",
  "entity_type": "E11",
  "source_file": "src/example.ts",
  "extraction_method": "ANALYZE",
  "confidence": 1.0,
  "content_hash": "sha256:..."
}
```

### Semantic Signals

Every code review captures:
```json
{
  "signal_id": "SIG-X-NNN",
  "timestamp": "ISO-8601",
  "story_id": "STORY-X.N",
  "verdict": "CORRECT|INCORRECT|PARTIAL",
  "reasoning": "Why this verdict",
  "reviewer_id": "human-1"
}
```

---

## File Generation Order

To bootstrap this system, generate files in this order:

### Batch 1: Foundation (Generate First)
```
1. spec/00_pre_track_validation/OVERVIEW.md
2. spec/00_pre_track_validation/SANITY_SUITE.md
3. spec/00_pre_track_validation/SYNTHETIC_CORPUS.md
4. spec/00_pre_track_validation/SCHEMA_FREEZE_RULES.md
5. spec/00_pre_track_validation/LEDGER_SCHEMAS.md
6. spec/00_pre_track_validation/VALIDATION_PROMPTS.md
```

### Batch 2: Track A (10 files)
```
7.  spec/track_a/OVERVIEW.md
8.  spec/track_a/ENTRY.md
9.  spec/track_a/stories/A1_ENTITY_REGISTRY.md
10. spec/track_a/stories/A2_RELATIONSHIP_REGISTRY.md
11. spec/track_a/stories/A3_MARKER_EXTRACTION.md
12. spec/track_a/stories/A4_STRUCTURAL_ANALYSIS.md
13. spec/track_a/stories/A5_GRAPH_API_V1.md
14. spec/track_a/EXIT.md
15. spec/track_a/HUMAN_GATE_HGR1.md
16. spec/track_a/TRACK_A_PROMPTS.md
```

### Batch 3: Track B (12 files)
```
17. spec/track_b/OVERVIEW.md
18. spec/track_b/ENTRY.md
19. spec/track_b/stories/B1_GROUND_TRUTH.md
20. spec/track_b/stories/B2_BRD_REGISTRY.md
21. spec/track_b/stories/B3_DRIFT_DETECTION.md
22. spec/track_b/stories/B4_CLOSURE_CHECK.md
23. spec/track_b/stories/B5_SHADOW_LEDGER_MIGRATION.md
24. spec/track_b/stories/B6_GRAPH_API_V2.md
25. spec/track_b/stories/B7_SEMANTIC_CORPUS_EXPORT.md
26. spec/track_b/EXIT.md
27. spec/track_b/HUMAN_GATE_HGR2.md
28. spec/track_b/TRACK_B_PROMPTS.md
```

### Batch 4: Track C (10 files)
```
29. spec/track_c/OVERVIEW.md
30. spec/track_c/ENTRY.md
31. spec/track_c/stories/C1_SEMANTIC_ALIGNMENT.md
32. spec/track_c/stories/C2_CONFIDENCE_PROPAGATION.md
33. spec/track_c/stories/C3_HYPOTHESIS_LIFECYCLE.md
34. spec/track_c/stories/C4_EXTENSION_PROTOCOL.md
35. spec/track_c/stories/C5_GRAPH_API_V3.md
36. spec/track_c/EXIT.md
37. spec/track_c/HUMAN_GATE_HGR3.md
38. spec/track_c/TRACK_C_PROMPTS.md
```

### Batch 5: Track D (9 files)
```
39. spec/track_d/OVERVIEW.md
40. spec/track_d/ENTRY.md
41. spec/track_d/stories/D1_POLICY_REGISTRY.md
42. spec/track_d/stories/D2_AUTONOMY_FRAMEWORK.md
43. spec/track_d/stories/D3_SIMULATION_ENGINE.md
44. spec/track_d/stories/D4_GRAPH_API_V4.md
45. spec/track_d/stories/D9_OBSERVATIONAL_TRUTH.md [DORMANT]
46. spec/track_d/EXIT.md
47. spec/track_d/HUMAN_GATE_HGR4.md
48. spec/track_d/TRACK_D_PROMPTS.md
```

### Batch 6: Sophia (3 files)
```
49. spec/sophia_v1/OVERVIEW.md
50. spec/sophia_v1/CONTINUOUS_EVOLUTION.md
51. spec/sophia_v1/SOPHIA_PROMPTS.md
```

**Total: 51 spec files**

---

## Success Metrics

### Per Story
- [ ] All ACs implemented
- [ ] All tests pass
- [ ] Markers present (@implements, @satisfies)
- [ ] Shadow ledger updated (correct schema)
- [ ] Semantic signal captured
- [ ] No G-API violations

### Per Track
- [ ] All stories complete
- [ ] All VERIFY-* tests pass
- [ ] All gates pass thresholds
- [ ] Human gate approved
- [ ] Ingestion successful
- [ ] PostgreSQL ↔ Neo4j consistency verified

### Overall
- [ ] Track A: 16 entities, 21 relationships, 6 gates
- [ ] Track B: Zero drift achieved, oracle transition complete, ledger migrated
- [ ] Track C: ≥80% semantic alignment agreement, 4 gates
- [ ] Track D: Policy rules enforced, 6 gates, EP-D-002 integrated (dormant)
- [ ] Sophia: Continuous self-evolution operational, all 21 gates (20 active + 1 dormant)

### Quantitative Targets

| Metric | Target | Source |
|--------|--------|--------|
| Total Entities | 83 (67 base + 16 extensions) | UTG Schema V20.6.1 |
| Total Relationships | 114 (100 base + 14 extensions) | UTG Schema V20.6.1 |
| Total Gates | 21 (20 active + 1 dormant) | Verification Spec V20.6.4 |
| SANITY Tests | 58 (54 active + 4 dormant) | Verification Spec V20.6.4 |
| Stories | 351 | BRD V20.6.3 |
| Acceptance Criteria | 2,901 | BRD V20.6.3 |

---

## Cursor Best Practices

### Context Management

```
DO:
- Open only ONE story card at a time
- Include the story card file in Cursor's context
- Use prompts from PROMPTS.md verbatim
- Verify after each story before proceeding
- Use Graph API for all data access
- Reference the locked Verification Spec version (V20.6.4) for all verification rules

DON'T:
- Open multiple story cards simultaneously
- Ask Cursor to "read the roadmap" (too large)
- Skip verification steps
- Proceed without Definition of Done complete
- Import database modules directly in track code
- Bypass the Graph API
- Assume in-memory storage
```

### Prompt Engineering

```
EFFECTIVE PROMPTS:
- Start with "I need you to implement..."
- Reference specific sections: "per the Files to Create section"
- Include constraints: "Do not import from track_b/"
- Request specific outputs: "Show me the test results"
- Specify architecture: "Use PostgreSQL with the schema from A.1.4"
- Enforce API: "Create Graph API v1 that wraps PostgreSQL/Neo4j access"

INEFFECTIVE PROMPTS:
- "Build Track A" (too vague)
- "Follow the roadmap" (Cursor can't hold it)
- "Do whatever you think is best" (no verification)
- "Store entities in a Map" (wrong architecture)
- "Use in-memory storage" (wrong architecture)
- "Import directly from database" (G-API violation)
```

### Error Recovery

```
IF Cursor produces incorrect output:
1. Do NOT continue to next story
2. Use "Fix Issues Prompt" with specific issues listed
3. Re-run verification
4. If still failing after 3 attempts, escalate to human
   (Failure = any Definition of Done item unchecked OR any VERIFY-* test not passing)

IF Cursor hallucinates entities/relationships:
1. Stop immediately
2. Check against Verification Spec
3. Delete hallucinated code
4. Re-prompt with explicit entity/relationship list from Epic 64

IF Cursor uses direct database access:
1. This is a G-API violation
2. Remove the direct imports
3. Refactor to use @gnosis/api
4. Re-run verification
```

### Critical Constraint: No Inference Without Evidence (V20.8.5)

```
CURSOR MUST NOT:
- Infer entity types not in Epic 64 (E01-E97 + extensions)
- Infer relationships not in UTG Schema (R01-R114)
- Infer acceptance criteria beyond those explicitly listed
- Treat examples as suggestions — examples are specifications
- Assume a test passes without running it
- Assume schema alignment without checking canonical doc
- Silently resolve ambiguity by choosing among plausible options
- Interpret dormant elements (E84-E85, R113-R114, G-RUNTIME) as active
- Assume default values if rubric_version or other required fields are missing
- Optimize, refactor, or "improve" beyond spec — implement exactly as written
- Add "helpful" features not in the acceptance criteria
- Rename variables/functions for "clarity" if spec names them explicitly

CURSOR MUST:
- Halt and request clarification if specification is ambiguous
- Reference exact AC numbers when claiming completion
- Produce VERIFY-* test output before marking complete
- Treat dormant elements as no-ops only; do not simulate their behavior
- Flag missing required fields as ERROR and halt; do not infer
```

### Ambiguity Stop Rule (V20.8.5)

```
IF specification is ambiguous:
1. Do NOT choose among plausible interpretations
2. Produce an Ambiguity Report:
   - What is ambiguous
   - What options exist
   - Which canonical document section would resolve it
   - Specific citation needed
3. HALT and await human clarification
4. Do NOT proceed on assumption

Ambiguity includes:
- Multiple valid interpretations of an AC
- Missing field in schema with no explicit default
- Conflicting guidance between documents
- Undefined behavior for edge cases
```

### Human Gate Halt Requirement (V20.8.5)

```
AT EVERY HUMAN GATE (HGR-1, HGR-2, HGR-3, HGR-4):
1. Cursor MUST output: "HALT: Awaiting HGR-X approval"
2. Cursor MUST NOT proceed to next track on assumption
3. Cursor MUST NOT interpret lack of rejection as approval
4. Human must provide explicit signed approval artifact
5. Only after approval artifact exists may next track begin

This is NON-NEGOTIABLE. Human gates exist because:
- HGR-2 transitions the oracle (irreversible)
- HGR-3 validates semantic alignment claims
- HGR-4 authorizes autonomous operation
Cursor cannot make these determinations.
```

### Epistemic Constraint: Confidence ≠ Correctness (V20.8.5)

```
Model confidence is NOT implementation correctness.

- High confidence from Cursor does not verify an AC
- Only passing VERIFY-* tests verify ACs
- If Cursor says "I believe this is correct" but tests don't pass, the AC is NOT complete
- Alignment scores are measured agreement with human labels, not truth
- Semantic signals are evidence-bounded judgments, not understanding

This constraint applies to BOTH:
- Cursor (during build): Do not claim completion without test evidence
- Sophia (at runtime): Do not claim truth without traceability evidence
```

### No-Placeholder Rule (V20.8.5)

```
Story cards and spec files MUST NOT contain unresolved placeholders.

INVALID (causes immediate halt):
- "[relevant sections]"
- "[Description]"
- "[TBD]"
- "[TODO]"
- Any bracketed text that is not a concrete value

IF any placeholder remains after spec generation:
1. Spec is INVALID
2. Do NOT proceed to implementation
3. Regenerate spec with concrete values
4. All placeholders must resolve to canonical document citations

This prevents interpretive freedom at exactly the layer meant to eliminate discretion.
```

---

## Scope Clarification

### What This Document Covers vs What It Doesn't

| This Document Covers | This Document Does NOT Cover |
|---------------------|------------------------------|
| How to BUILD Gnosis (the tool) | What Sophia can UNDERSTAND |
| Gnosis implementation (TypeScript) | Languages Sophia can parse (unlimited) |
| Track B self-ingestion mechanics | Sophia's language capabilities |
| Infrastructure setup | Production deployment |

### The Critical Distinction

```
┌─────────────────────────────────────────────────────────────────────┐
│                    TWO COMPLETELY DIFFERENT THINGS                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. BUILDING GNOSIS (this document)                                  │
│     ├── Gnosis is built with TypeScript                             │
│     ├── Gnosis stores data in PostgreSQL + Neo4j                    │
│     ├── Gnosis validates itself for Track B                         │
│     └── This is about Gnosis's INTERNAL implementation              │
│                                                                      │
│  2. WHAT SOPHIA CAN UNDERSTAND (NOT this document)                   │
│     ├── Sophia can understand ANY language                          │
│     ├── Sophia can parse ANY repo structure                         │
│     ├── Epic 64's entities are language-agnostic                    │
│     └── Language support is EXTENSIBLE via additional parsers       │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Architecture Decision Traceability

Every architecture decision must trace to a canonical document:

| Decision | Source Document | Section/AC |
|----------|-----------------|------------|
| PostgreSQL for storage | Roadmap V20.6.4 | Story A.1, AC A.1.4 |
| PostgreSQL RLS | BRD V20.6.3 | Story 39.6, AC-39.6.1 |
| Neo4j for graph queries | BRD V20.6.3 | Story 39.5, AC-39.5.7 |
| Vector store per project | BRD V20.6.3 | Story 39.5, AC-39.5.8 |
| Shadow ledger JSONL (Track A) | Verification Spec V20.6.4 | §8.1.2 |
| Shadow ledger migration (Track B) | Verification Spec V20.6.4 | §8.1.2 |
| G-API no direct DB imports | Verification Spec V20.6.4 | §8.3.2, RULE-API-001 |
| 16 Track A entities | BRD V20.6.3, Roadmap V20.6.4 | Appendix I, Track A |
| 21 Track A relationships | BRD V20.6.3, Roadmap V20.6.4 | Appendix I, Track A |
| 83 total entities (67 base + 16 ext) | UTG Schema V20.6.1 | Statistics |
| 114 total relationships (100 base + 14 ext) | UTG Schema V20.6.1 | Statistics |
| 21 total gates (20 active + 1 dormant) | Verification Spec V20.6.4 | Appendix D |

**If a decision cannot be traced to a canonical document, it is FORBIDDEN until a traceable authority is added.**

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Dec 10, 2025 | Initial implementation plan (V10.x refs) |
| 20.5.1 | Dec 11, 2025 | Entity Reference Correction Edition |
| 20.6.0 | Dec 11, 2025 | ⚠️ INCORRECT: Added wrong architecture decisions |
| 20.6.1 | Dec 11, 2025 | ⚠️ INCORRECT: Perpetuated wrong architecture |
| 20.7.0 | Dec 12, 2025 | Architecture correction (PostgreSQL + Neo4j) |
| 20.8.0 | Dec 12, 2025 | **UNIFIED EDITION.** Merged V20.7.0 architecture corrections with V1.0.0 execution scaffolding. Includes: complete directory structure, all templates (Story Card, EXIT, HUMAN_GATE, PROMPTS), execution protocol, integration map, SANITY suite integration, traceability requirements, file generation order (50 files), success metrics, and architecture decision traceability. |
| 20.8.1 | Dec 14, 2025 | **Implements Canonical Doc Set V20.6.0 + EP-D-002.** (1) Updated all canonical document references to V20.6.0. (2) Added EP-D-002 Runtime Reconciliation integration. (3) Added D9_OBSERVATIONAL_TRUTH.md spec file (dormant). (4) Updated statistics: 83 entities, 114 relationships, 21 gates, 56 SANITY tests, 351 stories, 2,901 ACs. (5) Updated success metrics for 21 gates. (6) Added EP-D-002 Integration Plan reference. |
| 20.8.2 | Dec 14, 2025 | **SEMANTIC RUBRIC FREEZE EDITION.** (1) Implements Canonical Doc Set V20.6.1. (2) Added Semantic Rubric Freeze constraint for Track C. (3) Added rubric_version requirement to story template. (4) Updated canonical document references to V20.6.1 (BRD, Verification Spec). |
| 20.8.3 | Dec 14, 2025 | **ARCHITECTURAL CONSTRAINTS EDITION.** (1) Implements Canonical Doc Set V20.6.2. (2) Added Constraint A.1: Modular Extraction (Provider Interface). (3) Added Constraint A.2: Evidence Anchors in `attributes` JSONB. (4) Added SANITY-043, SANITY-044 verification. (5) Updated SANITY count: 56 → 58. (6) Added Track A implementation guidance section. |
| **20.8.5** | **Dec 14, 2025** | **ORGAN ALIGNMENT EDITION.** (1) Implements Canonical Doc Set V20.6.4. (2) Synchronized all companion document references. (3) Added Dormant Isolation Rule (RULE-DORMANT-001-003). (4) Updated canonical document references to V20.6.4 (BRD V20.6.3, Roadmap V20.6.4, Verification Spec V20.6.4, UTG Schema V20.6.1). |
| 20.8.4 | Dec 14, 2025 | **CLAIM HYGIENE EDITION.** (1) Implements Canonical Doc Set V20.6.3. (2) Track C "alignment accuracy" → "alignment agreement". (3) Updated canonical document references to V20.6.3 (BRD V20.6.2, Roadmap V20.6.3, Verification Spec V20.6.3). |

---

**END OF CURSOR IMPLEMENTATION PLAN V20.8.5**
