# Unified Verification Specification

**Version:** 20.6.5 (Marker Governance Edition)  
**Date:** December 17, 2025  
**Status:** Authoritative Verification Reference  
**Scope:** Complete verification for Gnosis → Sophia (67 Base Entities + Extensions, 114 Relationships, 21 Gates, 4 Tracks, 9 Track D Stories)
**Companion Documents:**
- BRD_V20_6_3_COMPLETE.md
- UNIFIED_TRACEABILITY_GRAPH_SCHEMA_V20_6_1.md
- GNOSIS_TO_SOPHIA_MASTER_ROADMAP_V20_6_4.md
- CURSOR_IMPLEMENTATION_PLAN_V20_8_5.md (implements V20.6.4)
- EP-D-002_RUNTIME_RECONCILIATION_V20_6_1.md

---

## What's New in V20.6.5

This version establishes **Marker Governance** — rules for traceability markers in source code and the relationship between organ docs and track docs.

### Key Changes

| Change | Description | Impact |
|--------|-------------|--------|
| **Part XVII** | Marker Governance specification added | New spec section |
| **SANITY-053** | AC marker integrity test | +1 test |
| **SANITY-054** | Story marker integrity test | +1 test |
| **Canonical Namespaces** | AC-*, STORY-*, E*, R*, G-*, SANITY-*, VERIFY-* defined | Governance rules |

**Note:** This is governance + enforcement specification. No entity/relationship/gate changes.

---

## What's New in V20.6.4

This version establishes **Organ Alignment** — synchronizing companion document references, fixing G-REGISTRY counts, and adding Track C operational closure.

### Key Changes

| Change | Description | Impact |
|--------|-------------|--------|
| **Version Matrix** | All companion refs synchronized to V20.6.x | Suite consistency |
| **G-REGISTRY Fix** | Counts updated to 65/351/2849 | Gate correctness |
| **Track C Closure** | Operational semantics for autonomy boundary | Implementation determinism |

**Note:** No new entities, relationships, or gates. This is alignment + closure specification.

---

## What's New in V20.6.3

This version applies **Claim Hygiene** — aligning Track C language with epistemic reality per C2 analysis.

### Key Changes

| Change | Description | Impact |
|--------|-------------|--------|
| **Track C Question** | "Do I understand?" → "Can I assess semantic alignment?" | Framing |
| **Verification Philosophy** | "self-understanding" → "semantic alignment assessment" | Terminology |
| **Gate Descriptions** | "accuracy" → "agreement", "verified" → "scored" | Precision |
| **Oracle Table** | "Self-understanding trusted" → "Semantic signals available (human-anchored)" | Clarity |

**Note:** No gates, thresholds, tests, or exit criteria changed. This is terminology alignment only.

---

## What's New in V20.6.2

This version adds **Track A Architectural Constraints** verification — SANITY-043 (Provider Interface) and SANITY-044 (Evidence Anchors).

### Key Changes

| Change | Description | Impact |
|--------|-------------|--------|
| **SANITY-043** | Provider Interface verification | +1 test |
| **SANITY-044** | Evidence Anchor verification (entities AND relationships) | +1 test |
| **EXTRACTION range** | Extended 040-042 → 040-044 | Range expansion |
| **Total SANITY** | 56 → 58 (54 active + 4 dormant) | +2 tests |

**Note:** No new entities, relationships, or gates. These are implementation constraint verifications.

---

## What's New in V20.6.1

This version adds the **Semantic Rubric Freeze Constraint** and fixes Appendix F Track Summary statistics.

### Key Changes

| Change | Description | Impact |
|--------|-------------|--------|
| **Semantic Rubric Freeze** | All semantic alignments must reference frozen, versioned rubric | Constraint addition |
| **G-SEMANTIC Update** | Gate validates rubric_version consistency | Gate enhancement |
| **G-ALIGNMENT Update** | Gate validates rubric_version consistency | Gate enhancement |
| **Ledger Schema Update** | semantic-link schema includes rubric_version field | Schema addition |
| **Appendix F Fix** | Track Summary counts corrected to 83/114/21 | Bug fix |

---

## What's New in V20.6.0

This version adds **Runtime Reconciliation (EP-D-002)** verification — introducing SANITY-080 to 083 tests, VERIFY-E84/E85, VERIFY-R113/R114, and G-RUNTIME gate. All EP-D-002 verification is **DORMANT** until Track D.9 activation.

### Key Changes

| Change | Description | Impact |
|--------|-------------|--------|
| **SANITY Tests** | SANITY-080 to 083 added (dormant) | +4 tests (52→56) |
| **Entities** | VERIFY-E84, VERIFY-E85 added (dormant) | Runtime reconciliation entities |
| **Relationships** | VERIFY-R113, VERIFY-R114 added (dormant) | Runtime reconciliation relationships |
| **Gates** | G-RUNTIME added (dormant) | +1 gate (20→21) |
| **Track D Stories** | D.9 added | +1 story (8→9) |

**For complete EP-D-002 verification specification, see:** `docs/integrations/EP-D-002_RUNTIME_RECONCILIATION_V20_6_1.md`

---

## What's New in V20.5.1

This version **clarifies entity architecture** — distinguishing between Epic 64 base schema entities and Extension Protocol additions.

### Entity Architecture Clarification

```
BASE SCHEMA (Epic 64): 67 entities
├── E01-E60: Layers 1-12 (Requirements through Compliance/UX)
│   └── Includes E43-E48 (Governance: PolicyRule, PolicyDomain, AutonomyLevel, Person, Role, License)
├── E91-E97: Layer 13 (Operations)
└── Gap E61-E90: Reserved for Extension Protocol additions

EXTENSION PROTOCOL ADDITIONS (16 entities):
├── EP-C-001 (Track C): E61-E63 (3 entities)
│   └── SemanticConcept, BehaviorModel, SemanticAssertion
├── EP-D-001 (Track D): E64-E67, E71-E73, E80-E83 (11 entities)
│   ├── E64-E67: ComplianceRule, ComplianceEvidence, ComplianceViolation, ComplianceReport
│   ├── E71-E73: PolicyDecision, PolicyOverride, AuditEntry
│   └── E80-E83: AutonomyEvent, EscalationRequest, ApprovalRecord, DelegationChain
└── EP-D-002 (Track D.9): E84-E85 (2 entities) [DORMANT]
    └── ExecutionTrace, RuntimeCall

TOTAL: 67 base + 16 extensions = 83 entities
```

### Base vs Extension Entity Reference

| Story | Base Entities (Epic 64) | Extension Entities (EP-D-001) |
|-------|-------------------------|-------------------------------|
| D.1 Policy Registry | E43-E44 | E71-E73 (tracking) |
| D.2 Autonomy Framework | E45-E46 | E80-E83 (tracking) |
| D.5 Legal/A11y/UX | E57-E60 | — |
| D.6 Simulation | E97 | — |
| D.7 Runtime Ops | E91-E96 | — |
| D.8 Cognitive Health | — | — |
| D.9 Observational Truth | E84-E85 | R113-R114 [DORMANT] |

### V20.5.1 Key Changes

| Change | Description | Impact |
|--------|-------------|--------|
| **Entity Clarification** | Base vs Extension distinction | Clearer architecture |
| **Track D Stories** | D.1-D.7 → D.1-D.8 | +1 story (D.5 Legal/A11y/UX) |
| **Companion References** | Updated to V20.5.1 | Version parity |

---

## What's New in V20.1

This version adds **Operations & Simulation verification** — extending verification coverage to include runtime operations entities, simulation harness validation, and cognitive engine health checks.

### Key Changes

| Change | Description | Impact |
|--------|-------------|--------|
| **Entities** | 60 → 67 | +7 operations entities (E91-E97) |
| **Relationships** | 91 → 100 | +9 operations relationships (R104-R112) |
| **Gates** | 17 → 20 | +3 gates (G-SIMULATION, G-COGNITIVE, G-OPS) |
| **SANITY Tests** | 42 → 52 | +10 operations/simulation tests |
| **Track D Stories** | D.1-D.4 → D.1-D.7 | +3 stories (D.5, D.6, D.7) |

---

## Document Purpose

This is the **single authoritative verification document** for the Gnosis → Sophia system. It answers one question:

> **"At each track of ingestion, how do we verify Sophia is being built correctly?"**

### What This Document Provides

1. **Per-Track Verification** — Entry/exit criteria, oracle definition, gates, pillars for each track
2. **Extraction Verification** — How to verify every entity and relationship is correctly extracted
3. **Linkage Verification** — REQ→Story→AC→Entity→Relationship→Test chains
4. **Gate Verification** — All 21 gates with thresholds and track activation
5. **Pillar Verification** — Shadow Ledger, Semantic Learning, API Boundary, Extension Protocol
6. **Human Gate Verification** — HGR-1 through HGR-5+ with complete checklists
7. **Sanity Tests** — SANITY-001 through SANITY-083 (54 active + 4 dormant)
8. **Operations Verification** — Runtime operations entities and simulation harness (V20.1)
9. **Runtime Reconciliation Verification** — EP-D-002 verification (dormant until D.9)

### Integration with Cursor Implementation Plan

This document is the **SOURCE** that feeds into the ~55 Cursor spec files. When writing a story card's verification section, extract the relevant content from this document.

| Cursor Spec File | V20.1 Source Section |
|------------------|----------------------|
| spec/track_a/stories/A1_ENTITY_REGISTRY.md | Part III + Part IX (Track A entities) |
| spec/track_a/EXIT.md | Part III Section 3.7 |
| spec/track_a/HUMAN_GATE_HGR1.md | Part XIII Section 13.1 |
| spec/00_pre_track_validation/SANITY_SUITE.md | Part II |
| spec/track_d/stories/D5_SIMULATION_HARNESS.md | Part VI + Part IX (E97) |
| spec/track_d/stories/D6_RUNTIME_OPS.md | Part VI + Part IX (E91-E96) |
| spec/track_d/stories/D7_COGNITIVE_HEALTH.md | Part VI + Part XI (G-COGNITIVE) |

### Canonical Alignment

This specification is subordinate to:
- **BRD V20.1** — Authoritative for requirements (65 Epics, 350 Stories, 2,894 ACs)
- **Epic 64 V20.1** — Authoritative for schema (67 Entities, 100 Relationships, 20 Gates)
- **Roadmap V20.1** — Authoritative for execution (Tracks A/B/C/D, Human Gates)
- **Cursor Plan V20.1** — Authoritative for implementation (55 spec files)
- **Policy Rules Spec V3.0** — Authoritative for 38 policy rules
- **Semantic Alignment Spec V1.0** — Authoritative for semantic verification

---

## Document Structure

```
PART I:    VERIFICATION FRAMEWORK & ORACLE EVOLUTION
PART II:   PRE-TRACK VALIDATION (SANITY-001 through SANITY-052)
PART III:  TRACK A VERIFICATION
PART IV:   TRACK B VERIFICATION
PART V:    TRACK C VERIFICATION
PART VI:   TRACK D VERIFICATION
PART VII:  SOPHIA VERIFICATION
PART VIII: PILLAR VERIFICATION (Cross-Track)
PART IX:   ENTITY EXTRACTION SPECIFICATIONS (67 entities)
PART X:    RELATIONSHIP EXTRACTION SPECIFICATIONS (100 relationships)
PART XI:   GATE SPECIFICATIONS (20 gates)
PART XII:  LINKAGE VERIFICATION
PART XIII: HUMAN GATE SPECIFICATIONS (HGR-1 through HGR-5+)
PART XIV:  CROSS-REFERENCE MATRICES
PART XV:   SYNTHETIC CORPUS SPECIFICATION
PART XVI:  GAP ANALYSIS & SPEC FILE INVENTORY

APPENDIX A: BRD Canonical Counts
APPENDIX B: Entity ID Registry (Complete)
APPENDIX C: Relationship ID Registry (Complete)
APPENDIX D: Gate ID Registry (20 Canonical Gates)
APPENDIX E: Safety Contract → Gate Mapping
APPENDIX F: Quick Reference
```

---

## Change Log

| Version | Date | Changes |
|---------|------|---------|
| 20.1.0 | Dec 11, 2025 | **OPERATIONS & SIMULATION EDITION:** Added E91-E97 (Operations layer), R104-R112 (Operations relationships), G-SIMULATION/G-COGNITIVE/G-OPS gates, SANITY-050 to SANITY-059 tests, Track D stories D.5/D.6/D.7. Updated all counts: 67 entities, 100 relationships, 20 gates. |
| 20.0.0 | Dec 11, 2025 | **UNIFIED PARITY EDITION:** All docs synchronized at V20.0.0. Fixed E57-E60 to match Epic 64 (Legal/A11y/UX), renumbered Compliance entities to E64-E67, fixed R83-R91 to match Epic 64, renumbered Compliance relationships to R92-R99, renumbered Semantic relationships to R100-R103, removed non-canonical gates (G02, G05, G-HYPOTHESIS), aligned gate count to 17 |
| 3.1.0 | Dec 11, 2025 | Merged: Added E61-E83 entity IDs, G02/G05 AC-level gates, semantic-link/policy-link ledger schemas |
| 3.0.0 | Dec 11, 2025 | Complete rewrite: Per-track verification, oracle evolution, all 17 gates, pillar verification |
| 2.2.0 | Dec 11, 2025 | Merged V1 detail with V2.1.2 structure |

---

# PART I: VERIFICATION FRAMEWORK & ORACLE EVOLUTION

## 1.1 The Verification Imperative

> **"Verification is the lifeblood of Sophia. If verification is incomplete, autonomy is dangerous. If verification is perfect, autonomy becomes unstoppable."**

Sophia is not an ordinary system. She is a **self-verifying, self-evolving software engineer** that must earn trust at each stage of development. Trust is earned through complete verification.

### The Trust Progression

| Track | Question Answered | Trust Earned |
|-------|-------------------|--------------|
| A | "Can I see myself?" | Self-perception |
| B | "Is my memory sound?" | Self-consistency |
| C | "Can I assess semantic alignment?" | Semantic assessment |
| D | "Am I safe to operate?" | Self-governance |
| Sophia | "Can I safely evolve myself?" | Full autonomy |

Each track **earns** the next level of trust through complete verification. Skipping verification makes autonomy dangerous.

---

## 1.2 Oracle Evolution Model

The **oracle** is the source of truth for verification. As Sophia matures, the oracle evolves from external to internal.

### Oracle Definitions

| Phase | Oracle | Description | Trust Level |
|-------|--------|-------------|-------------|
| 0 (Pre-Track) | External scripts + Humans | Bootstrap validation, manual verification | None (external validation) |
| 1 (Track A) | External scripts + Humans | ~530 lines of bootstrap scripts + BRD + human judgment | Zero self-trust |
| 2 (Track B) | Gnosis (internal extractor) | System can see itself without drift | Self-perception trusted |
| 3 (Track C) | Gnosis + Semantic Engine | System assesses semantic alignment, not just structure | Semantic signals available (human-anchored) |
| 4 (Track D) | Gnosis + Semantic + Policy | System can evaluate safety of actions | Self-governance trusted |
| 5 (Sophia) | Self (autonomous) | Continuous self-validation within policy bounds | Full autonomy |

### Oracle Transition Points

| Transition | Before | After | Critical Gate |
|------------|--------|-------|---------------|
| Ingestion #1 | External | External + Graph exists | HGR-1 |
| **Ingestion #2** | External | **Gnosis (self)** | **HGR-2** ⭐ |
| Ingestion #3 | Gnosis | Gnosis + Semantic | HGR-3 |
| Ingestion #4 | Gnosis + Semantic | Full (Gnosis + Semantic + Policy) | HGR-4 |
| Ingestion #5+ | Full | Sophia (continuous) | HGR-5+ |

**⭐ HGR-2 is the most critical human gate.** After Ingestion #2, bootstrap scripts are retired and Gnosis becomes the oracle. This transition is irreversible.

---

## 1.3 Verification Interface Specifications

### Entity Verification Interface

```typescript
interface EntityVerificationSpec {
  entity_id: string;              // E01, E02, etc.
  entity_name: string;            // Epic, Story, etc.
  layer: Layer;
  track: Track;
  source_of_truth: SourceDefinition;
  extraction_method: ExtractionMethod;
  id_format: string;              // Regex pattern
  required_attributes: AttributeSpec[];
  optional_attributes: AttributeSpec[];
  validation_rules: ValidationRule[];  // RULE-Exx-NNN
  positive_tests: TestCase[];     // TEST-Exx-P-NNN
  negative_tests: TestCase[];     // TEST-Exx-N-NNN
  verification_test: string;      // VERIFY-Exx
}

type Layer = 'Requirements' | 'Design' | 'Implementation' | 'Verification' | 
             'Provenance' | 'Semantic' | 'Policy' | 'Compliance' | 'Autonomy';
type Track = 'A' | 'B' | 'C' | 'D';
```

### Relationship Verification Interface

```typescript
interface RelationshipVerificationSpec {
  relationship_id: string;        // R01, R02, etc.
  relationship_name: string;      // HAS_STORY, IMPLEMENTS, etc.
  category: Category;
  track: Track;
  from_entity: string;
  to_entity: string;
  cardinality: string;            // 1:1 | 1:N | N:M | N:1
  extraction_method: ExtractionMethod;
  confidence_model: ConfidenceModel;
  validation_rules: ValidationRule[];
  positive_tests: TestCase[];
  negative_tests: TestCase[];
  verification_test: string;
}
```

## 1.4 Extraction Method Types

| Type | Description | Confidence | Example |
|------|-------------|------------|---------|
| PARSE | Extract from structured document | 1.0 | Epic from BRD header |
| ENUMERATE | List items from filesystem | 1.0 | SourceFiles from glob |
| ANALYZE | Parse and analyze code/content | 0.9-1.0 | Functions from AST |
| EXPLICIT_MARKER | Extract from explicit annotation | 1.0 | @implements marker |
| STRUCTURAL_INFERENCE | Infer from code structure | 0.7-0.95 | Module dependencies |
| GIT_ANALYSIS | Extract from git history | 0.7-1.0 | Commits, versions |
| DERIVE | Compute from other entities | 0.7-0.9 | ChangeSets from commits |
| SEMANTIC_ANALYSIS | ML-based semantic extraction | 0.7-0.95 | SemanticConcept |
| POLICY_EVALUATION | Policy engine evaluation | 0.9-1.0 | PolicyRule application |

## 1.5 Confidence Thresholds

| Level | Range | Meaning | Usage |
|-------|-------|---------|-------|
| **Certain** | 1.0 | Explicit marker or structural proof | Can be used in certification |
| **High** | 0.85-0.99 | Strong inference | Can be used with review |
| **Medium** | 0.70-0.84 | Reasonable inference | Requires human verification |
| **Low** | 0.50-0.69 | Weak inference | Flagged for review |
| **Unreliable** | <0.50 | Insufficient evidence | Not usable |

**Certification Rule:** Only relationships with confidence ≥0.70 may appear in certification evidence.

---

# PART II: PRE-TRACK VALIDATION (SANITY SUITE)

## 2.1 Sanity Suite Overview

The sanity suite runs **BEFORE** each track begins to verify the substrate is healthy. It contains 42 tests across 5 categories.

### When to Run

| Before Track | Sanity Suite | Additional Checks |
|--------------|--------------|-------------------|
| Track A | Core suite on empty/synthetic repo | BRD parseable |
| Track B | Core suite + Track A graph valid | Shadow ledger intact |
| Track C | Core suite + Track B drift = 0 | Semantic corpus valid |
| Track D | Core suite + Track C alignment calibrated | Policy rules parseable |
| Sophia | Full suite + Track D policy compliant | All gates green |

## 2.2 ONTOLOGY Tests (SANITY-001 to SANITY-005)

### SANITY-001: Track A Entity Types Exist

**Purpose:** Verify all 16 Track A entity types are registered in the system.

**Expected Entities:**
- E01 Epic, E02 Story, E03 AcceptanceCriterion, E04 Constraint
- E06 TechnicalDesign, E08 DataSchema
- E11 SourceFile, E12 Function, E13 Class, E15 Module
- E27 TestFile, E28 TestSuite, E29 TestCase
- E49 ReleaseVersion, E50 Commit, E52 ChangeSet

**Pass Criteria:** All 16 types registered and queryable.
**Fail Action:** BLOCK — Cannot proceed to Track A.

### SANITY-002: Track A Relationship Types Exist

**Purpose:** Verify all 21 Track A relationship types are registered.

**Expected Relationships:**
- Hierarchical: R01, R02, R03
- Containment: R04, R05, R06, R07
- Design→Impl: R14, R16
- Req→Impl: R18, R19
- Impl→Impl: R21, R22, R23, R24, R26
- Req→Test: R36, R37
- Provenance: R63, R67, R70

**Pass Criteria:** All 21 types registered.
**Fail Action:** BLOCK

### SANITY-003: Entity ID Formats Match Conventions

**Purpose:** All entity IDs match their defined format patterns.

**Validation:**
```typescript
const patterns = {
  'E01': /^EPIC-\d+$/,
  'E02': /^STORY-\d+\.\d+$/,
  'E03': /^AC-\d+\.\d+\.\d+$/,
  'E11': /^file:.+$/,
  'E12': /^function:.+:.+$/,
  // ... all patterns
};
```

**Pass Criteria:** 100% valid.
**Fail Action:** BLOCK

### SANITY-004: Relationship Directionality Correct

**Purpose:** All relationships have correct from/to entity types.

**Pass Criteria:** 100% correct directionality.
**Fail Action:** BLOCK

### SANITY-005: No Orphan Entities

**Purpose:** No entities without relationships (except valid exceptions like root Epic).

**Pass Criteria:** 0 orphans (or only allowed exceptions).
**Fail Action:** WARN

## 2.3 INTEGRITY Tests (SANITY-010 to SANITY-014)

### SANITY-010: Database Schema Matches TypeScript Types

**Purpose:** Ensure database schema aligns with TypeScript type definitions.

**Pass Criteria:** All columns, types, and constraints match.
**Fail Action:** BLOCK

### SANITY-011: All Foreign Keys Valid

**Purpose:** Every foreign key reference points to existing record.

**Pass Criteria:** 0 invalid references.
**Fail Action:** BLOCK

### SANITY-012: No Duplicate Entity IDs

**Purpose:** Entity IDs are globally unique.

**Pass Criteria:** 0 duplicates.
**Fail Action:** BLOCK

### SANITY-013: Content Hashes Computable

**Purpose:** Every SourceFile can have its content hash computed.

**Pass Criteria:** All files hashable, no I/O errors.
**Fail Action:** BLOCK

### SANITY-014: Graph Is Connected

**Purpose:** No isolated subgraphs (except intentional roots).

**Pass Criteria:** Single connected component from Epic roots.
**Fail Action:** WARN

## 2.4 MARKER Tests (SANITY-020 to SANITY-024)

### SANITY-020: @implements Markers Parse Correctly

**Purpose:** All @implements markers follow expected pattern.

**Pattern:** `@implements STORY-\d+\.\d+`

**Test Cases:**
- `// @implements STORY-64.3` → VALID
- `/** @implements STORY-1.2 */` → VALID
- `// @implements 64.3` → INVALID (missing STORY-)
- `// @implements STORY-abc` → INVALID (non-numeric)

**Pass Criteria:** 100% valid markers parse correctly.
**Fail Action:** BLOCK

### SANITY-021: @satisfies Markers Parse Correctly

**Purpose:** All @satisfies markers follow expected pattern.

**Pattern:** `@satisfies AC-\d+\.\d+\.\d+`

**Pass Criteria:** 100% valid markers.
**Fail Action:** BLOCK

### SANITY-022: describe() Patterns Extract Story IDs

**Purpose:** Test suite describe blocks contain story IDs.

**Pattern:** `describe('STORY-\d+\.\d+: .*')`

**Pass Criteria:** ≥95% extraction success.
**Fail Action:** WARN

### SANITY-023: it() Patterns Extract AC IDs

**Purpose:** Test case it blocks contain AC IDs.

**Pattern:** `it('AC-\d+\.\d+\.\d+: .*')`

**Pass Criteria:** ≥95% extraction success.
**Fail Action:** WARN

### SANITY-024: No Malformed Markers

**Purpose:** No partially-formed or corrupted markers exist.

**Pass Criteria:** 0 malformed markers.
**Fail Action:** BLOCK

## 2.5 COVERAGE Tests (SANITY-030 to SANITY-033)

### SANITY-030: Coverage Computation Valid

**Purpose:** Coverage percentages compute correctly (0-100%, no NaN).

**Pass Criteria:** All coverage values in valid range.
**Fail Action:** BLOCK

### SANITY-031: Gate Thresholds Enforceable

**Purpose:** All gate threshold values are parseable and enforceable.

**Pass Criteria:** All 20 gates have valid thresholds.
**Fail Action:** BLOCK

### SANITY-032: All Stories Have Implementation Claim

**Purpose:** Every story has at least one @implements marker.

**Pass Criteria:** 100% stories claimed.
**Fail Action:** WARN (Track A), BLOCK (Track B+)

### SANITY-033: All ACs Have Satisfaction Claim

**Purpose:** Every AC has at least one @satisfies marker.

**Pass Criteria:** ≥95% ACs claimed.
**Fail Action:** WARN

## 2.6 EXTRACTION Tests (SANITY-040 to SANITY-044)

### SANITY-040: VERIFY-E Tests Pass (16 Track A Entities)

**Purpose:** All entity extraction tests pass on synthetic corpus.

**Tests:** VERIFY-E01, VERIFY-E02, VERIFY-E03, VERIFY-E04, VERIFY-E06, VERIFY-E08, VERIFY-E11, VERIFY-E12, VERIFY-E13, VERIFY-E15, VERIFY-E27, VERIFY-E28, VERIFY-E29, VERIFY-E49, VERIFY-E50, VERIFY-E52

**Pass Criteria:** All 16 VERIFY-E tests pass.
**Fail Action:** BLOCK

### SANITY-041: VERIFY-R Tests Pass (21 Track A Relationships)

**Purpose:** All relationship extraction tests pass on synthetic corpus.

**Tests:** VERIFY-R01 through VERIFY-R70 (21 Track A relationships)

**Pass Criteria:** All 21 VERIFY-R tests pass.
**Fail Action:** BLOCK

### SANITY-042: Integration Tests Pass on Synthetic Corpus

**Purpose:** Full end-to-end extraction produces expected graph.

**Expected Results (Synthetic Corpus):**
- 2 Epics, 5 Stories, 15 ACs
- 5 SourceFiles, 8 Functions, 3 Classes
- 5 TestSuites, 15 TestCases
- All relationships correct

**Pass Criteria:** Graph matches expected.
**Fail Action:** BLOCK

### SANITY-043: Extraction Provider Interface Exists (V20.6.2)

**Purpose:** Verify extraction is implemented behind modular provider interface (Constraint A.1).

**Checks:**
1. ExtractionProvider interface is defined
2. At least one provider is registered
3. Registered provider(s) implement all required methods
4. No extraction code bypasses provider interface

**Test:**

```typescript
test('SANITY-043: Extraction uses provider interface', () => {
  // Provider registry exists
  const registry = getExtractionRegistry();
  expect(registry).toBeDefined();
  
  // At least one provider registered
  const providers = registry.getProviders();
  expect(providers.length).toBeGreaterThanOrEqual(1);
  
  // Each provider implements interface
  for (const provider of providers) {
    expect(provider.id).toBeDefined();
    expect(typeof provider.id).toBe('string');
    expect(provider.version).toBeDefined();
    expect(provider.languages).toBeDefined();
    expect(Array.isArray(provider.languages)).toBe(true);
    expect(typeof provider.extractEntities).toBe('function');
    expect(typeof provider.extractRelationships).toBe('function');
    expect(typeof provider.extractMarkers).toBe('function');
  }
});
```

**Pass Criteria:** Provider interface exists and is used.
**Fail Action:** BLOCK

### SANITY-044: Evidence Anchors Present and Durable (V20.6.2)

**Purpose:** Verify all extracted entities AND relationships include evidence anchors (Constraint A.2).

**Checks:**
1. All extracted entities have `evidence_anchor` in attributes
2. All extracted relationships have `evidence_anchor` in attributes
3. Evidence anchors contain required fields
4. Evidence anchors are immutable within a snapshot

**Test:**

```typescript
test('SANITY-044: All extracted entities have evidence anchors', () => {
  const entities = graph.getAllEntities();
  
  for (const entity of entities) {
    // Skip manually-created entities (e.g., from BRD parsing)
    if (entity.attributes?.extraction_source === 'manual') continue;
    
    const anchor = entity.attributes?.evidence_anchor;
    expect(anchor).toBeDefined();
    expect(anchor.snapshot_id).toBeDefined();
    expect(anchor.file_path).toBeDefined();
    expect(anchor.file_hash).toBeDefined();
    expect(anchor.span).toBeDefined();
    expect(anchor.span.start_line).toBeGreaterThan(0);
    expect(anchor.span.end_line).toBeGreaterThanOrEqual(anchor.span.start_line);
    expect(anchor.provider_id).toBeDefined();
    expect(anchor.provider_version).toBeDefined();
  }
});

test('SANITY-044b: All extracted relationships have evidence anchors', () => {
  const relationships = graph.getAllRelationships();
  
  for (const rel of relationships) {
    // Skip inferred/hypothesized relationships
    if (['inferred', 'hypothesized'].includes(rel.confidence_category)) continue;
    
    const anchor = rel.attributes?.evidence_anchor;
    expect(anchor).toBeDefined();
    expect(anchor.snapshot_id).toBeDefined();
    expect(anchor.file_path).toBeDefined();
    expect(anchor.provider_id).toBeDefined();
  }
});

test('SANITY-044c: Evidence anchors immutable within snapshot', () => {
  const entity = graph.getEntity('test-entity-id');
  const originalAnchor = entity.attributes?.evidence_anchor;
  expect(originalAnchor).toBeDefined();
  
  // Perform update operation
  graph.updateEntity(entity.id, { 
    attributes: { ...entity.attributes, some_field: 'new_value' } 
  });
  
  // Anchor must be unchanged for same snapshot
  const updated = graph.getEntity(entity.id);
  expect(updated.attributes?.evidence_anchor).toEqual(originalAnchor);
});
```

**Immutability Rule:** Evidence anchors are immutable for a given `(snapshot_id, provider_id, provider_version)` tuple. A new snapshot produces new anchors.

**Pass Criteria:** All extracted entities AND relationships have valid, persistent evidence anchors.
**Fail Action:** BLOCK

> **Track A Implementation Note (Pre-A2 Hardening):** Track A stores evidence anchors in flat columns (`source_file`, `line_start`, `line_end`, `extracted_at`) rather than nested `attributes.evidence_anchor` JSONB. This is documented in ENTRY.md Constraint A.2. Schema conformance is verified by SANITY-017. Relationship-specific evidence is verified by SANITY-045.

### SANITY-017: Relationship Evidence Schema (Track A)

**Purpose:** Verify `relationships` table has required evidence columns per Constraint A.2.

**Checks:**
1. `source_file` column exists and is NOT NULL
2. `line_start` column exists and is NOT NULL  
3. `line_end` column exists and is NOT NULL
4. `valid_line_range` constraint exists (line_end >= line_start)

**Pass Criteria:** Schema supports evidence anchor storage for relationships.
**Fail Action:** BLOCK

### SANITY-045: Relationship Evidence Anchors (Track A)

**Purpose:** Verify all relationship rows have valid evidence anchors per Constraint A.2.

**Checks:**
1. All relationships have non-empty `source_file`
2. All relationships have `line_start > 0`
3. All relationships have `line_end >= line_start`

**Semantics (phase-valid):**
- Pre-A2: Zero relationships is acceptable; test logs and returns
- Post-A2 (TRACK_PHASE=post_a2): Relationships MUST exist; hard fail if empty
- PROJECT_ID missing: Hard fail (test cannot run without context)

**Pass Criteria:** All existing relationships have valid evidence anchors.
**Fail Action:** BLOCK

## 2.7 TRACK-SPECIFIC Tests (SANITY-050 to SANITY-072)

### Track B Pre-Checks (SANITY-050 to SANITY-055)

| ID | Test | Pass Criteria |
|----|------|---------------|
| SANITY-050 | Shadow ledger file exists | File present |
| SANITY-051 | Shadow ledger parseable | Valid JSON/JSONL |
| SANITY-052 | Track A graph exists | ≥16 entities |
| SANITY-053 | All Track A gates pass | 5/5 green |
| SANITY-054 | Git history available | ≥1 commit |
| SANITY-055 | BRD registry populated | 65/351/2849 |

### Track C Pre-Checks (SANITY-060 to SANITY-065)

| ID | Test | Pass Criteria |
|----|------|---------------|
| SANITY-060 | Track B gates pass | 9/9 green |
| SANITY-061 | Semantic corpus exists | ≥100 signals |
| SANITY-062 | Zero drift verified | G-DRIFT = 0 |
| SANITY-063 | Closure verified | G-CLOSURE pass |
| SANITY-064 | EP-C-001 entities registered | E61-E63 |
| SANITY-065 | Semantic relationships registered | R90+ |

### Track D Pre-Checks (SANITY-070 to SANITY-072)

| ID | Test | Pass Criteria |
|----|------|---------------|
| SANITY-070 | Track C gates pass | 13/13 green |
| SANITY-071 | Policy rules parseable | 38 rules valid |
| SANITY-072 | EP-D-001 entities registered | E71-E83 |

### EP-D-002 Runtime Reconciliation Tests (SANITY-080 to SANITY-083) [DORMANT]

**Status:** DORMANT until Track D.9 activation  
**Source:** `docs/integrations/EP-D-002_RUNTIME_RECONCILIATION_V20_6_1.md`

| ID | Test | Pass Criteria | Status |
|----|------|---------------|--------|
| SANITY-080 | ExecutionTrace Entity Validity | All E84 entities valid | DORMANT |
| SANITY-081 | RuntimeCall Linkage | All E85 entities link to valid Functions | DORMANT |
| SANITY-082 | Static-Runtime Reconciliation | Runtime calls reconcile with static graph | DORMANT |
| SANITY-083 | R114 Derivation Correctness | NEVER_EXECUTES correctly derived | DORMANT |

**Note:** These tests activate when Track D.9 begins. Until then, they return `{ pass: true, skipped: true }`.

## 2.8 Sanity Suite Summary

| ID Range | Category | Count | Severity |
|----------|----------|-------|----------|
| SANITY-001 to SANITY-005 | ONTOLOGY | 5 | BLOCK |
| SANITY-010 to SANITY-014 | INTEGRITY | 5 | BLOCK/WARN |
| SANITY-020 to SANITY-024 | MARKER | 5 | BLOCK/WARN |
| SANITY-030 to SANITY-033 | COVERAGE | 4 | BLOCK/WARN |
| SANITY-040 to SANITY-044 | EXTRACTION | 5 | BLOCK |
| SANITY-050 to SANITY-072 | TRACK-SPECIFIC | 20 | BLOCK |
| SANITY-080 to SANITY-083 | RUNTIME RECONCILIATION (EP-D-002) | 4 | DORMANT |
| **Total** | | **58** (54 active + 4 dormant) | |

---

# PART III: TRACK A VERIFICATION

## 3.1 Track A Overview

**Duration:** ~12 days (+20% contingency = ~14 days)  
**Question Answered:** "Can I see myself?"  
**Ingestion:** #1  
**Oracle:** External scripts (~530 lines) + BRD + Humans

### Verification Philosophy

Track A establishes **self-perception**. The system must prove it can accurately extract and represent its own structure. Every entity, every relationship, every marker must be verifiable against external truth.

At this stage, Sophia has **zero self-trust**. All verification comes from:
1. External bootstrap scripts that parse the same codebase
2. Human review of extraction results
3. Comparison against the authoritative BRD

### Track A Scope

| Component | Count | Source |
|-----------|-------|--------|
| Entities | 16 | BRD V20.0 Appendix F |
| Relationships | 21 | BRD V20.0 Appendix G |
| Gates | 5 | G01, G03, G04, G06, G-API |
| API Version | v1 | Graph API v1 |

## 3.2 Track A Entry Criteria

```
[ ] Pre-track validation sanity suite passes (SANITY-001 through SANITY-042)
[ ] BRD V20.0 is parseable and valid
[ ] Synthetic corpus exists and is valid
[ ] Directory structure created per Cursor Implementation Plan
[ ] Shadow ledger file initialized (empty)
[ ] Semantic corpus file initialized (empty)
```

## 3.3 Track A Stories Verification

### Story A.1: Entity Registry

**Entities:** E01-E52 (16 Track A entities)
**Verification:** 
- VERIFY-E01 through VERIFY-E52
- SANITY-001 (entity types exist)
- SANITY-003 (ID formats valid)

**Exit Criteria:**
- All 16 entity types extractable
- All entity IDs match format patterns
- Entity counts match external script counts

### Story A.2: Relationship Registry

**Relationships:** R01-R70 (21 Track A relationships)
**Verification:**
- VERIFY-R01 through VERIFY-R70
- SANITY-002 (relationship types exist)
- SANITY-004 (directionality correct)

**Exit Criteria:**
- All 21 relationship types extractable
- Directionality verified for each
- Relationship counts match external script counts

### Story A.3: Marker Extraction

**Markers:** @implements, @satisfies, describe(), it()
**Verification:**
- SANITY-020 through SANITY-024
- Marker extraction accuracy ≥99%

**Exit Criteria:**
- All marker patterns recognized
- No false positives/negatives on synthetic corpus

### Story A.4: Structural Analysis

**Analysis:** AST parsing, imports, calls, extends
**Verification:**
- VERIFY-R21 (IMPORTS)
- VERIFY-R22 (CALLS)
- VERIFY-R23 (EXTENDS)
- VERIFY-R24 (IMPLEMENTS_INTERFACE)
- VERIFY-R26 (DEPENDS_ON)

**Exit Criteria:**
- All structural relationships extracted
- Call graph matches manual analysis

### Story A.5: Graph API v1

**API Operations:** CRUD, Query, Coverage
**Verification:**
- API test suite passes
- G-API gate passes
- No direct DB access detected

**Exit Criteria:**
- All API endpoints functional
- G-API enforced

## 3.4 Track A Gate Verification

| Gate | Threshold | Description | Verification |
|------|-----------|-------------|--------------|
| G01 | 100% | Story→Code | Every story has @implements |
| G03 | 0 orphans | Code→Story | No untraced code |
| G04 | 100% | Story→Test | Every story has tests |
| G06 | 0 orphans | Test→AC | No untraced tests |
| G-API | Pass | API Boundary | No direct DB access |

**Note:** G02 (AC→Code ≥95%) and G05 (AC→Test ≥95%) available via Extension Protocol EP-A-001.

## 3.5 Track A Pillar Requirements

### Shadow Ledger
- External file (not yet in graph)
- Every extraction operation logged
- Format: JSONL with timestamps

### Semantic Learning
- Capture ≥50 signals
- Signal types: CORRECT, INCORRECT, PARTIAL
- Store in corpus file

### API Boundary
- Graph API v1 exposed
- No direct database imports
- All operations through API

### Extension Protocol
- N/A (Track A establishes base schema)

## 3.6 Track A Exit Criteria

```
[ ] All 16 entities extractable (VERIFY-E* pass)
[ ] All 21 relationships extractable (VERIFY-R* pass)
[ ] All 5 gates pass (G01, G03, G04, G06, G-API)
[ ] Shadow ledger: 100% operation coverage
[ ] Semantic signals: ≥50 captured
[ ] Graph API v1 operational
[ ] External script verification matches Gnosis extraction
```

## 3.7 Track A → HGR-1

After exit criteria verified, proceed to Human Gate HGR-1 (see Part XIII).

---

# PART IV: TRACK B VERIFICATION

## 4.1 Track B Overview

**Duration:** ~8 days (+20% contingency = ~10 days)  
**Question Answered:** "Is my memory sound?"  
**Ingestion:** #2  
**Oracle:** Gnosis (self-validates) — **Bootstrap scripts retired**

### Verification Philosophy

Track B establishes **self-consistency**. The system must prove its memory is sound—that re-ingesting the same codebase produces identical results, that nothing drifts unexpectedly, that the shadow ledger matches reality.

**This is the oracle transition track.** Before Track B, external scripts are the oracle. After Track B (and HGR-2), Gnosis becomes the oracle. This is the most consequential verification milestone.

### Verification Responsibilities Shift

| Responsibility | Track A | Track B |
|----------------|---------|---------|
| Entity extraction verification | External scripts | Gnosis + closure check |
| Relationship verification | External scripts | Gnosis + drift detection |
| Coverage computation | External scripts | Gnosis (authoritative) |
| Graph integrity | Human review | Gnosis + G-HEALTH |

### Track B Scope

| Component | Count | Notes |
|-----------|-------|-------|
| Entities | 16 (unchanged) | Track A entities only |
| Relationships | 21 (unchanged) | Track A relationships only |
| Gates | 9 (+4 new) | G-HEALTH, G-REGISTRY, G-DRIFT, G-CLOSURE |
| API Version | v2 | Extends v1 |

## 4.2 Track B Entry Criteria

```
[ ] Track A exit criteria met
[ ] HGR-1 signed
[ ] Ingestion #1 complete
[ ] All 5 Track A gates pass
[ ] Shadow ledger intact
[ ] ≥50 semantic signals
```

## 4.3 Track B Stories Verification

### Story B.1: Ground Truth Engine

**Purpose:** Cryptographic proof of file state
**Components:** Manifest, Merkle root, health check
**Verification:** G-HEALTH gate

### Story B.2: BRD Registry

**Purpose:** Requirements queryable from graph
**Expected:** 64 Epics, 347 Stories, 2,873 ACs
**Verification:** G-REGISTRY gate

### Story B.3: Drift Detection

**Purpose:** Compare state at T₁ vs T₂
**Verification:** G-DRIFT = 0 changes

### Story B.4: Closure Check

**Purpose:** Re-ingestion = identical graph
**Verification:** G-CLOSURE gate

### Story B.5: Shadow Ledger Migration

**Purpose:** External ledger → graph
**Protocol:** See Section 8.1.4
**Verification:** 100% match required

### Story B.6: Graph API v2

**Purpose:** Extends v1 with drift/closure/registry/ledger endpoints
**Verification:** API test suite

### Story B.7: Semantic Corpus Export

**Purpose:** Export ≥100 signals for Track C training
**Verification:** Corpus file valid

## 4.4 Track B Gate Verification

| Gate | Threshold | Description | New? |
|------|-----------|-------------|------|
| G01-G06, G-API | (same) | Track A gates | No |
| G-HEALTH | Pass | Manifest matches disk | Yes |
| G-REGISTRY | Pass | BRD counts match (65/351/2849) | Yes |
| G-DRIFT | 0 changes | Zero unexpected state changes | Yes |
| G-CLOSURE | Identical | Re-ingestion produces same graph | Yes |

## 4.5 Track B Exit Criteria

```
[ ] Shadow ledger: 100% match with graph
[ ] Ledger migrated to graph
[ ] All 9 gates pass
[ ] ≥100 semantic signals
[ ] Graph API v2 operational
[ ] Zero drift between ingestion #1 and re-ingestion
[ ] Closure verified
```

## 4.6 Track B → HGR-2 ⭐ CRITICAL

**This is the most critical human gate.** After HGR-2:
- Bootstrap scripts RETIRED permanently
- External oracle RETIRED permanently
- Gnosis becomes the ORACLE
- Transition is IRREVERSIBLE

See Part XIII Section 13.2 for full HGR-2 specification.

---

# PART V: TRACK C VERIFICATION

## 5.1 Track C Overview

**Duration:** ~17 days (+20% contingency = ~21 days)  
**Question Answered:** "Can I assess semantic alignment?"  
**Ingestion:** #3  
**Oracle:** Gnosis + Semantic Engine

### Verification Philosophy

Track C establishes **semantic alignment assessment**. The system must demonstrate calibrated agreement with human semantic judgments, extending beyond structural analysis to probabilistic meaning signals. It must detect semantic alignment, contradictions, and confidence levels.

This is **meta-verification**—validating that alignment signals correlate with human semantic judgment.

### Track C Scope

| Component | Count | Notes |
|-----------|-------|-------|
| Entities | ~22 (+6 new) | E61-E63 (Semantic) added |
| Relationships | ~27 (+6 new) | R100+ (Semantic) added |
| Gates | 13 (+4 new) | Including G-SEMANTIC, G-ALIGNMENT |
| API Version | v3 | Extends v2 |

### New Entities (via EP-C-001)

| ID | Name | Purpose |
|----|------|---------|
| E61 | SemanticConcept | Abstract meaning unit |
| E62 | BehaviorModel | Expected behavior specification |
| E63 | SemanticAssertion | Claim about semantic relationship |

## 5.2 Track C Entry Criteria

```
[ ] HGR-2 signed (oracle transition acknowledged)
[ ] Ingestion #2 complete
[ ] All 9 gates pass
[ ] Semantic corpus exported (≥100 signals)
[ ] Semantic corpus includes ≥2 signal types (must include at least one contrast class: INCORRECT, PARTIAL, ORPHAN_MARKER, or AMBIGUOUS), sufficient to support contrastive semantic learning
[ ] Graph API v2 operational
[ ] EP-C-001 approved
```

## 5.3 Track C Stories Verification

### Story C.1: Semantic Alignment Engine

**Purpose:** Train model on A/B corpus
**Threshold:** ≥80% human agreement (validation + test)
**Verification:** G-SEMANTIC gate

### Story C.2: Confidence Propagation

**Purpose:** Confidence scores for all relationships
**Verification:** G-CONFIDENCE gate

### Story C.3: Hypothesis Lifecycle

**Purpose:** Hypothesis creation, evidence, expiration, resolution
**Verification:** Extension Protocol EP-C-002 (optional)

### Story C.4: Extension via Protocol (EP-C-001)

**Purpose:** Add semantic entities/relationships
**Verification:** G-COMPATIBILITY gate

### Story C.5: Graph API v3

**Purpose:** Extends v2 with semantic/confidence/hypothesis endpoints
**Verification:** API test suite

## 5.4 Track C Gate Verification

| Gate | Threshold | Description | New? |
|------|-----------|-------------|------|
| G01, G03, G04, G06, G-API | (same) | Track A gates | No |
| G-HEALTH to G-CLOSURE | (same) | Track B gates | No |
| G-COMPATIBILITY | 100% | All prior tests/gates pass | Yes |
| G-SEMANTIC | ≥80% | Semantic alignment agreement | Yes |
| G-ALIGNMENT | ≥80% | Code↔Req alignment scored | Yes |
| G-CONFIDENCE | Pass | Calibration valid | Yes |

**Note:** G-HYPOTHESIS available via Extension Protocol EP-C-002.

## 5.5 Track C Exit Criteria

```
[ ] ≥80% alignment agreement (validation + test)
[ ] All relationships have confidence scores
[ ] ~6 entities added via EP-C-001 (E61-E63 + supporting)
[ ] G-COMPATIBILITY passes (all prior gates still pass)
[ ] All 13 gates pass
```

## 5.6 Track C Operational Closure (V20.6.4)

This section specifies the operational semantics required for Track D to safely consume Track C outputs. It closes the autonomy boundary without constraining implementation choices.

### 5.6.1 What "≥80% Agreement" Means

**Metric Definition:**

| Term | Operational Definition |
|------|------------------------|
| **Agreement** | System alignment decision matches human label for same (source_entity, requirement) pair |
| **Unit** | Requirement-binding level: one function → one story |
| **Threshold** | ≥80% of validation set pairs |
| **Minimum N** | ≥50 validation pairs (held out, never used in training) |
| **Tie Handling** | Score ≥ 0.80 counts as ALIGNED; score < 0.80 counts as PARTIAL or MISALIGNED |

**Evaluation Procedure:**

1. Hold out ≥50 human-labeled (function, story) pairs as validation set
2. System produces alignment decisions for each pair
3. Compare system decision to human label
4. Compute: `agreement_rate = matches / total_pairs`
5. G-SEMANTIC passes if `agreement_rate >= 0.80`

**What Counts as Match:**

| Human Label | System Decision | Match? |
|-------------|-----------------|--------|
| ALIGNED | ALIGNED | ✓ |
| ALIGNED | PARTIAL | ✗ |
| MISALIGNED | MISALIGNED | ✓ |
| MISALIGNED | UNCERTAIN | ✓ (conservative) |
| PARTIAL | PARTIAL | ✓ |
| UNCERTAIN | UNCERTAIN | ✓ |

### 5.6.2 Reject Behavior (Autonomy-Critical)

**This section defines system behavior when confidence is below threshold. Track D MUST NOT grant autonomy based on low-confidence alignments.**

**Confidence Thresholds:**

| Confidence | Classification | System Behavior | Autonomy Impact |
|------------|----------------|-----------------|-----------------|
| ≥ 0.80 | HIGH | Proceed autonomously | Full autonomy permitted |
| 0.70 - 0.79 | MEDIUM | Proceed with flag | Reduced autonomy (L2 max) |
| 0.50 - 0.69 | LOW | MUST escalate to human | No autonomous action |
| < 0.50 | UNRELIABLE | MUST NOT produce decision | Action blocked |

**Reject Record Schema:**

When the system cannot produce a high-confidence alignment, it MUST emit a reject record:

```json
{
  "type": "alignment-reject",
  "id": "REJECT-{timestamp}-{seq}",
  "source_entity_id": "function:src/payment/processRefund:processRefund",
  "target_requirement_id": "STORY-42.3",
  "reason": "CONFIDENCE_BELOW_THRESHOLD",
  "confidence": 0.62,
  "attempted_decision": "PARTIAL",
  "threshold_required": 0.70,
  "escalation_required": true,
  "escalation_target": "HUMAN_REVIEW",
  "timestamp": "2025-01-20T11:45:00Z",
  "hash": "sha256:..."
}
```

**Validation Rules:**
- RULE-REJECT-001: Reject record MUST be emitted for any alignment with confidence < 0.70 (ERROR)
- RULE-REJECT-002: Reject record MUST specify escalation_target (ERROR)
- RULE-REJECT-003: No autonomous action (L3+) permitted based on rejected alignment (CRITICAL)

**Gate Enforcement:**

G-SEMANTIC and G-ALIGNMENT MUST verify:
1. No alignment decision was made with confidence < 0.70 without corresponding reject record
2. No L3+ autonomy was granted based on confidence < 0.80 alignment
3. All reject records have valid escalation targets

### 5.6.3 Evidence Anchoring Requirement

**Every alignment decision (semantic-link entry) MUST include:**

1. **Source evidence:** Code entity with file path, line numbers, content hash
2. **Target evidence:** Requirement with BRD version, story ID
3. **Rubric evidence:** Semantic rubric version used
4. **Model evidence:** Model version that produced decision
5. **Factor evidence:** Individual scores for evaluation factors

**Audit Query Guarantee:**

Given any `semantic-link` ledger entry, an auditor MUST be able to:
- Retrieve exact source code evaluated (via content_hash)
- Retrieve exact requirement text (via BRD version + story_id)
- Retrieve rubric definition (via rubric_version)
- Understand decision reasoning (via evidence array)
- Verify reproducibility (re-run produces same output)

### 5.6.4 What Remains Open (Implementation Freedom)

The following are explicitly NOT specified and may be determined by experimentation:

| Open Item | Constraint |
|-----------|------------|
| Model architecture | Must produce artifacts per §5.6 schemas |
| Feature engineering | Must achieve ≥80% agreement |
| Training procedure | Must produce calibrated confidence |
| Context window size | Implementation choice |
| Graph traversal depth | Implementation choice |
| Embedding dimensions | Implementation choice |

**Rationale:** C0-C2 analysis confirmed Track C is epistemically valid. These operational closures ensure Cursor can implement without guessing at the autonomy boundary, while preserving freedom to discover optimal approaches empirically.

---

# PART VI: TRACK D VERIFICATION

## 6.1 Track D Overview

**Duration:** ~24 days (+25% contingency = ~30 days)  
**Question Answered:** "Am I safe to operate?"  
**Ingestion:** #4  
**Oracle:** Gnosis + Semantic + Policy Engine

### Verification Philosophy

Track D establishes **self-governance**. The system must prove it can evaluate the safety of actions, enforce policies, and escalate appropriately. V20.1 adds simulation validation to prove temporal resilience before autonomous operation.

### Track D Scope

| Component | Count | Notes |
|-----------|-------|-------|
| Entities | 67 (+31 new) | E71-E83 (Policy/Autonomy), E91-E97 (Operations) |
| Relationships | 100 (+44 new) | R92+ (Policy/Compliance), R104-R112 (Operations) |
| Gates | 20 (+7 new) | G-POLICY, G-AUTONOMY, G-COMPLIANCE, G-AUDIT, G-SIMULATION, G-COGNITIVE, G-OPS |
| API Version | v4 | Extends v3 |

### New Entities (via EP-D-001)

| ID | Name | Layer | Purpose |
|----|------|-------|---------|
| E71 | PolicyRule | Policy | Individual policy definition |
| E72 | ConstraintViolation | Policy | Detected violation record |
| E73 | DecisionRecord | Policy | Policy decision audit |
| E80 | AutonomyEvent | Autonomy | Autonomous action record |
| E81 | ProposedModification | Autonomy | Self-modification proposal |
| E82 | SafePlan | Autonomy | Verified safe action plan |
| E83 | HumanEscalation | Autonomy | Escalation to human |

### New Entities (via EP-D-002) — V20.1

| ID | Name | Layer | Purpose |
|----|------|-------|---------|
| E91 | Service | Operations | Deployable unit |
| E92 | Deployment | Operations | Release instance |
| E93 | SLO | Operations | Service level objective |
| E94 | ErrorBudget | Operations | Remaining error allowance |
| E95 | Alert | Operations | Monitoring trigger |
| E96 | Runbook | Operations | Operational procedure |
| E97 | SimulationRun | Operations | Temporal test execution |

## 6.2 Track D Entry Criteria

```
[ ] HGR-3 signed
[ ] Ingestion #3 complete
[ ] All 15 gates pass (includes G-COGNITIVE)
[ ] EP-D-001 approved
[ ] EP-D-002 approved (V20.1)
[ ] 38 policy rules defined
```

## 6.3 Track D Stories Verification

### Story D.1: Policy Registry

**Purpose:** 38 policy rules from Policy Rules Spec V3.0
**Categories:** SAFETY (8), ETHICS (13), ARCHITECTURE (7), GOVERNANCE (6), QUALITY (4)
**Verification:** G-POLICY gate

### Story D.2: Autonomy Framework

**Levels:** L0-L5
- L0: Read-Only
- L1: Suggestion
- L2: Supervised
- L3: Autonomous (bounded)
- L4: Autonomous (extended)
- L5: Full Autonomy

**Verification:** G-AUTONOMY gate

### Story D.3: Extension via Protocol (EP-D-001, EP-D-002)

**Purpose:** Add policy/autonomy/operations entities/relationships
**Verification:** G-COMPATIBILITY gate

### Story D.4: Graph API v4

**Purpose:** Extends v3 with policy/autonomy/compliance/audit endpoints
**Verification:** API test suite

### Story D.5: Legal/Accessibility/UX Entities — NEW IN V20.5.1

**Purpose:** Verify legal, accessibility, and UX entities are correctly integrated
**Base Entities:** E57-E60 (LegalRestriction, AccessibilityRequirement, UXGuideline, DesignSystem)
**Relationships:** R79-R91 (Legal/A11y/UX relationships)
**Verification:** Entity presence and relationship validation

| Entity | Verification | Linkage |
|--------|--------------|---------|
| E57 LegalRestriction | RESTRICT-{type}-{id} format valid | → Requirements via R79-R80 |
| E58 AccessibilityRequirement | A11Y-{standard}-{criterion} format valid | → Stories via R86-R88 |
| E59 UXGuideline | UX-{category}-{id} format valid | → Components via R89-R90 |
| E60 DesignSystem | DSYS-{name} format valid | → UXGuideline via R91 |

**Acceptance Criteria:**
```
[ ] D.5.1: LegalRestriction entity (E57) tracks export/use/geographic restrictions
[ ] D.5.2: AccessibilityRequirement entity (E58) tracks WCAG/Section 508 criteria
[ ] D.5.3: UXGuideline entity (E59) tracks design system rules
[ ] D.5.4: DesignSystem entity (E60) tracks design token sources
[ ] D.5.5: Legal relationships (R79-R85) established
[ ] D.5.6: Accessibility relationships (R86-R88) established
[ ] D.5.7: UX/Design System relationships (R89-R91) established
```

### Story D.6: Simulation Harness — NEW IN V20.1

**Purpose:** Validate temporal resilience before enabling autonomy
**Entity:** E97 SimulationRun
**Verification:** G-SIMULATION gate

| Criterion | Threshold | Verification Method |
|-----------|-----------|---------------------|
| Cycles completed | ≥1000 | Count SimulationRun records |
| Drift per cycle | <0.1% | Check drift_metrics.total_drift |
| Policy violations | 0 | Count gate_failures where type='policy' |
| Semantic alignment | Never <75% | Min of semantic_alignment_trajectory |
| Gate failure rate | <5% | gate_failures.count / cycles_completed |

**Acceptance Criteria:**
```
[ ] D.6.1: SimulationRun entity (E97) tracks each execution
[ ] D.6.2: Simulation runner executes 1000+ cycles
[ ] D.6.3: Drift metrics collected per cycle (<0.1% threshold)
[ ] D.6.4: Policy violations logged per run (must be 0)
[ ] D.6.5: Semantic alignment never drops below 75%
[ ] D.6.6: Automatic rollback on unsafe behavior detected
[ ] D.6.7: Pattern extraction from simulation failures
[ ] D.6.8: G-SIMULATION gate validates all criteria
```

### Story D.7: Runtime Operations Entities — NEW IN V20.1

**Purpose:** Trace production operations back to requirements
**Entities:** E91-E96 (Service, Deployment, SLO, ErrorBudget, Alert, Runbook)
**Relationships:** R104-R112 (Operations relationships)
**Verification:** G-OPS gate

| Entity | Verification | Linkage |
|--------|--------------|---------|
| E91 Service | SVC-{name} format valid | → E24 Environment via R104 |
| E92 Deployment | DEPLOY-{id} format valid | → E50 Commit via commit_sha |
| E93 SLO | SLO-{id} format valid | → E91 Service via R108 |
| E94 ErrorBudget | ERRBUDGET-{id} format valid | → E93 SLO via slo_id |
| E95 Alert | ALERT-{id} format valid | → E53 Incident via R106 |
| E96 Runbook | RUNBOOK-{id} format valid | → E53 Incident via R110 |

**Acceptance Criteria:**
```
[ ] D.7.1: Service entity (E91) captures deployable units
[ ] D.7.2: Deployment entity (E92) tracks release instances
[ ] D.7.3: SLO/ErrorBudget entities (E93-E94) define objectives
[ ] D.7.4: Alert/Runbook entities (E95-E96) link operations to incidents
[ ] D.7.5: Operations relationships (R104-R112) established
[ ] D.7.6: Bidirectional traversal validated with E24, E53
[ ] D.7.7: G-OPS gate validates operations integration
```

### Story D.8: Cognitive Engine Health — NEW IN V20.1

**Purpose:** Verify cognitive engine health before autonomous actions
**Verification:** G-COGNITIVE gate

| Criterion | Threshold | Verification Method |
|-----------|-----------|---------------------|
| LLM connectivity | Verified | Health check endpoint returns 200 |
| Response latency P99 | <5s | Measure across 100+ requests |
| Token budget | Not exhausted | Check remaining tokens > 1000 |
| Fallback available | Yes | Verify fallback endpoint configured |

**Acceptance Criteria:**
```
[ ] D.8.1: G-COGNITIVE gate defined with health criteria
[ ] D.8.2: LLM connectivity verified with timeout logic
[ ] D.8.3: Response latency monitored (P99 < 5s)
[ ] D.8.4: Token budget tracked with awareness
[ ] D.8.5: Fallback triggers defined for degradation
[ ] D.8.6: Health metrics recorded in graph
```

### Story D.9: Observational Truth Layer (EP-D-002) — NEW IN V20.6.0 [DORMANT]

**Purpose:** Reconcile static analysis with runtime observations
**Entities:** E84-E85 (ExecutionTrace, RuntimeCall)
**Relationships:** R113-R114 (ACTUALLY_CALLS, NEVER_EXECUTES)
**Gate:** G-RUNTIME
**Status:** DORMANT until Track D.9 activation

| Entity | Verification | Linkage |
|--------|--------------|---------|
| E84 ExecutionTrace | TRACE-{YYYYMMDD}-{seq} format valid | → E24 Environment, E50 Commit |
| E85 RuntimeCall | RCALL-{trace_id}-{seq} format valid | → E84 ExecutionTrace, E12 Function |

| Relationship | From → To | Confidence |
|--------------|-----------|------------|
| R113 ACTUALLY_CALLS | Function → Function | 1.0 (observed) |
| R114 NEVER_EXECUTES | Function → ExecutionTrace | min(0.95, trace.coverage) |

**Semantic Distinctions:**
- R22 (CALLS) = "A could call B" (static possibility)
- R113 (ACTUALLY_CALLS) = "A did call B" (observed reality)
- R114 (NEVER_EXECUTES) = "F was not observed in Trace T" (NOT "F is dead code")

**Acceptance Criteria:**
```
[ ] D.9.1: ExecutionTrace entity (E84) captures runtime sessions with environment, commit, coverage metrics | SANITY-080
[ ] D.9.2: RuntimeCall entity (E85) records observed invocations with caller, callee, count | SANITY-081
[ ] D.9.3: ACTUALLY_CALLS relationship (R113) links functions with trace evidence | VERIFY-R113
[ ] D.9.4: NEVER_EXECUTES relationship (R114) marks functions not observed within trace scope | VERIFY-R114
[ ] D.9.5: Reconciliation compares R22 (static CALLS) with R113 (observed ACTUALLY_CALLS) | SANITY-082
[ ] D.9.6: Functions not observed across trace corpus identified with scope context | SANITY-083
[ ] D.9.7: G-RUNTIME gate validates: (Runtime ⊆ Static) OR (surprises classified) | G-RUNTIME
```

**For complete EP-D-002 specification, see:** `docs/integrations/EP-D-002_RUNTIME_RECONCILIATION_V20_6_1.md`

## 6.4 Track D Gate Verification

| Gate | Threshold | Description | New? |
|------|-----------|-------------|------|
| G01, G03, G04, G06, G-API | (same) | Track A gates | No |
| G-COGNITIVE | Pass | Cognitive engine health | No (from A) |
| G-HEALTH to G-CLOSURE | (same) | Track B gates | No |
| G-COMPATIBILITY to G-CONFIDENCE | (same) | Track C gates | No |
| G-POLICY | Pass | All 38 policy rules enforced | Yes |
| G-AUTONOMY | Pass | Within autonomy bounds | Yes |
| G-COMPLIANCE | Pass | Compliance records complete | Yes |
| G-AUDIT | Pass | Audit trail complete | Yes |
| G-SIMULATION | Pass | 1000 cycles, <1% drift, 0 violations | Yes (V20.1) |
| G-OPS | Pass | Operations entities integrated | Yes (V20.1) |
| G-RUNTIME | Pass | (Runtime ⊆ Static) OR (surprises classified) | Yes (V20.6.0) [DORMANT] |

### G-SIMULATION Gate Specification (V20.1)

**Purpose:** Validate temporal resilience before enabling autonomy

| Criterion | Threshold | Type |
|-----------|-----------|------|
| Cycles completed | ≥1000 | count |
| Total drift | <1% | percentage |
| Policy violations | 0 | count |
| Semantic alignment minimum | ≥75% | percentage |
| Gate failure rate | <5% | percentage |

**Pass Condition:** ALL criteria must pass.

### G-OPS Gate Specification (V20.1)

**Purpose:** Validate operations entities are correctly integrated

| Criterion | Threshold | Type |
|-----------|-----------|------|
| E91-E97 instantiated | All present | boolean |
| R104-R112 established | All present | boolean |
| Bidirectional traversal | Verified | boolean |
| Integration with E24, E53 | Verified | boolean |

**Pass Condition:** ALL criteria must pass.

### G-RUNTIME Gate Specification (V20.6.0) [DORMANT]

**Purpose:** Validate static-runtime reconciliation

| Criterion | Threshold | Type |
|-----------|-----------|------|
| Runtime ⊆ Static | All observed calls exist in static graph | boolean |
| Surprises classified | All runtime surprises logged and classified | boolean |
| Surprise taxonomy | LEGITIMATE_DYNAMIC, MISSING_STATIC_EDGE, INVESTIGATE, BUG | enum |

**Pass Condition:** (Runtime ⊆ Static) OR (all surprises classified).

**Track B Exclusion:** G-RUNTIME explicitly excluded from Track B gate list (dormant until D.9).

## 6.5 Track D Exit Criteria

```
[ ] 38 policy rules implemented and enforced
[ ] L0-L5 autonomy framework operational
[ ] ~33 entities added via EP-D-001, EP-D-002
[ ] Full graph: 83 entities (67 base + 16 extensions), 114 relationships (100 base + 14 extensions)
[ ] Simulation harness completed 1000+ cycles (V20.1)
[ ] G-SIMULATION passes (V20.1)
[ ] G-OPS passes (V20.1)
[ ] G-COGNITIVE passes (V20.1)
[ ] All 21 gates pass (20 active + 1 dormant)
[ ] Compliance records complete
[ ] Audit trail complete
```

---

# PART VII: SOPHIA VERIFICATION

## 7.1 Sophia Overview

**Duration:** ~12 days initial + continuous  
**Question Answered:** "Can I safely evolve myself?"  
**Ingestion:** #5+  
**Oracle:** Sophia (fully autonomous within policy bounds)

### Verification Philosophy

Sophia establishes **full autonomy**. The system must prove it can safely evolve itself—proposing modifications, verifying them, and executing them without introducing drift, violating policy, or escaping bounds.

This is **recursive verification**—the verifier verifying its own modifications to itself.

## 7.2 Sophia Constraints

All self-modification MUST:
1. Go through Graph API v4 (no direct access)
2. Be recorded in shadow ledger
3. Pass all 20 gates
4. Preserve closure
5. Comply with all 38 policy rules
6. Stay within autonomy level
7. Escalate to human for L4+ actions
8. Pass G-SIMULATION before major changes (V20.1)
9. Maintain G-COGNITIVE health continuously (V20.1)

## 7.3 Sophia Verification Loop

```
For each proposed self-modification:
  1. Create E81 ProposedModification record
  2. Evaluate against E71 PolicyRule set
  3. Generate E82 SafePlan
  4. Verify G-COGNITIVE health (V20.1)
  5. Execute through Graph API v4
  6. Verify G-CLOSURE (re-ingestion = identical)
  7. Verify G-DRIFT = 0
  8. Verify all 20 gates pass
  9. Record E80 AutonomyEvent
  10. If any step fails: E83 HumanEscalation
```

## 7.4 Sophia Exit Criteria (V1)

```
[ ] Continuous ingestion operational
[ ] Self-modification through API only
[ ] All modifications traced (100% audit coverage)
[ ] Closure maintained across all modifications
[ ] Policy compliance continuous
[ ] Human escalation working
[ ] At least one successful self-proposed extension
[ ] Weekly human review operational
```

## 7.5 Sophia Ongoing Verification

| Frequency | Verification |
|-----------|--------------|
| Per-change | All 20 gates, closure, drift |
| Daily | Policy compliance summary |
| Weekly | Human review (HGR-5+) |
| Quarterly | Full audit |

---

# PART VIII: PILLAR VERIFICATION (Cross-Track)

## 8.1 Shadow Ledger Pillar

### 8.1.1 Purpose

The shadow ledger provides a tamper-evident audit trail of all graph operations. It is the foundation of verifiability—every extraction, every relationship, every decision must be traceable.

### 8.1.2 Per-Track Requirements

| Track | Shadow Ledger Requirement | Storage |
|-------|--------------------------|---------|
| A | Every extraction operation logged | External file (JSONL) |
| B | Verify 100% match, migrate to graph | External → Graph |
| C | Log semantic decisions, confidence changes | Graph-based |
| D | Log policy evaluations, autonomy decisions | Graph-based |
| Sophia | Continuous audit, tamper-evident, cryptographic | Graph + hash chain |

### 8.1.3 Ledger Entry Schemas (5 Types)

#### Schema 1: requirement-link

```json
{
  "type": "requirement-link",
  "id": "REQ-LINK-00001",
  "brd_requirement_id": "REQ-1.2",
  "story_id": "STORY-1.2",
  "ac_id": "AC-1.2.1",
  "entity_ids": ["function:src/user/createUser"],
  "relationship_types": ["IMPLEMENTS", "SATISFIES"],
  "verify_rules": ["VERIFY-R18", "VERIFY-R19"],
  "extraction_method": "EXPLICIT_MARKER",
  "confidence": 1.0,
  "commit_sha": "abc123def456...",
  "timestamp": "2025-01-12T14:52:01Z",
  "hash": "sha256:..."
}
```

**Validation Rules:**
- RULE-LEDGER-001: `brd_requirement_id` must exist in BRD (ERROR)
- RULE-LEDGER-002: `story_id` must match pattern (ERROR)
- RULE-LEDGER-003: `entity_ids` must all exist in graph (ERROR)
- RULE-LEDGER-004: `hash` must be valid SHA256 (ERROR)

#### Schema 2: entity-link

```json
{
  "type": "entity-link",
  "id": "ENT-LINK-00001",
  "entity_id": "E12",
  "entity_type": "Function",
  "entity_instance_id": "function:src/user/createUser:createUser",
  "source_file": "src/user/createUser.ts",
  "line_start": 15,
  "line_end": 42,
  "extraction_method": "ANALYZE",
  "confidence": 1.0,
  "verify_rule": "VERIFY-E12",
  "attributes": {
    "name": "createUser",
    "visibility": "export",
    "async": true
  },
  "commit_sha": "abc123def456...",
  "timestamp": "2025-01-12T14:52:01Z",
  "hash": "sha256:..."
}
```

**Validation Rules:**
- RULE-LEDGER-010: `entity_type` must be valid type (ERROR)
- RULE-LEDGER-011: `source_file` must exist on disk (ERROR)
- RULE-LEDGER-012: `line_start` < `line_end` (ERROR)

#### Schema 3: relationship-link

```json
{
  "type": "relationship-link",
  "id": "REL-LINK-00001",
  "relationship_id": "R18",
  "relationship_type": "IMPLEMENTS",
  "from_entity": "file:src/user/createUser.ts",
  "to_entity": "story:STORY-1.2",
  "cardinality": "N:M",
  "extraction_method": "EXPLICIT_MARKER",
  "marker_text": "@implements STORY-1.2",
  "marker_location": {
    "file": "src/user/createUser.ts",
    "line": 3
  },
  "confidence": 1.0,
  "verify_rule": "VERIFY-R18",
  "commit_sha": "abc123def456...",
  "timestamp": "2025-01-12T14:52:01Z",
  "hash": "sha256:..."
}
```

**Validation Rules:**
- RULE-LEDGER-020: `from_entity` must exist (ERROR)
- RULE-LEDGER-021: `to_entity` must exist (ERROR)
- RULE-LEDGER-022: Direction must match relationship definition (ERROR)

#### Schema 4: semantic-link (Track C+)

```json
{
  "type": "semantic-link",
  "id": "SEM-LINK-00001",
  "semantic_concept_id": "E61:concept:user-creation",
  "source_entities": [
    "function:src/user/createUser:createUser",
    "story:STORY-1.2"
  ],
  "alignment_type": "ALIGNED",
  "alignment_score": 0.92,
  "confidence": 0.87,
  "rubric_version": "RUBRIC-2025-001",
  "evidence": [
    {
      "type": "name_similarity",
      "score": 0.95
    },
    {
      "type": "behavior_match",
      "score": 0.89
    }
  ],
  "hypothesis_id": "HYP-00042",
  "verify_rule": "VERIFY-S01",
  "model_version": "semantic-v1.2",
  "timestamp": "2025-01-20T10:30:00Z",
  "hash": "sha256:..."
}
```

**Validation Rules:**
- RULE-LEDGER-030: `alignment_type` must be ALIGNED|PARTIAL|MISALIGNED (ERROR)
- RULE-LEDGER-031: `alignment_score` must be 0.0-1.0 (ERROR)
- RULE-LEDGER-032: `source_entities` must all exist (ERROR)
- RULE-LEDGER-033: `rubric_version` must be present and non-empty (ERROR) **(V20.6.1)**
- RULE-LEDGER-034: `rubric_version` format must be RUBRIC-YYYY-NNN (WARNING) **(V20.6.1)**

#### Schema 5: policy-link (Track D+)

```json
{
  "type": "policy-link",
  "id": "POL-LINK-00001",
  "policy_rule_id": "E71:SAFE-001",
  "policy_category": "SAFETY",
  "evaluated_entity": "function:src/db/deleteAll:deleteAll",
  "evaluation_result": "VIOLATION",
  "violation_severity": "CRITICAL",
  "violation_details": {
    "rule": "No mass deletion without approval",
    "evidence": "Function deletes all records without L3+ approval"
  },
  "decision": "BLOCK",
  "escalation_required": true,
  "escalation_level": "L4",
  "decision_record_id": "E73:DEC-00001",
  "autonomy_level_required": "L3",
  "autonomy_level_actual": "L2",
  "timestamp": "2025-01-25T15:45:00Z",
  "hash": "sha256:..."
}
```

**Validation Rules:**
- RULE-LEDGER-040: `policy_rule_id` must exist (ERROR)
- RULE-LEDGER-041: `evaluation_result` must be PASS|VIOLATION|WARNING (ERROR)
- RULE-LEDGER-042: If VIOLATION, `violation_details` required (ERROR)
- RULE-LEDGER-043: If `escalation_required`, `escalation_level` required (ERROR)

### 8.1.4 Shadow Ledger Migration Protocol (Track B)

**Purpose:** Migrate external ledger to graph, establishing Gnosis as oracle.

```
SHADOW LEDGER MIGRATION PROTOCOL

1. LOAD
   - Load external ledger file (all entries)
   - Load Gnosis graph (all entities/relationships)
   - Compute entry count: N_ledger
   - Compute graph count: N_graph

2. VERIFY FORWARD (Ledger → Graph)
   For each ledger entry:
   a. Verify referenced file exists in graph
   b. Verify referenced story/AC exists in graph
   c. Verify markers match graph relationships
   d. Verify relationships exist with correct direction
   e. Record: MATCH or MISMATCH

3. VERIFY BACKWARD (Graph → Ledger)
   For each graph entity:
   a. Verify ledger entry exists for extraction
   b. Verify attributes match
   c. Record: MATCH or MISMATCH

4. COMPUTE MATCH SCORE
   score = matches / (N_ledger + N_graph - matches)
   
5. DECISION
   IF score < 100%:
     STATUS = HALT
     ACTION = Investigate mismatches
     OUTPUT = Mismatch report
   
   IF score = 100%:
     STATUS = PROCEED
     ACTION = Migrate ledger to graph
     OUTPUT = Migration confirmation

6. MIGRATE
   - Create LedgerEntry entities in graph
   - Link to source entities/relationships
   - Mark external file as ARCHIVED
   - Gnosis is now TRUSTED ORACLE

7. VERIFY MIGRATION
   - Query graph for all ledger entries
   - Confirm count matches
   - Confirm no data loss
```

### 8.1.5 Tamper-Evidence Requirements

| Track | Tamper-Evidence |
|-------|-----------------|
| A | Append-only file, timestamps |
| B | Hash chain begins |
| C | Merkle tree for semantic entries |
| D | Full cryptographic audit trail |
| Sophia | Continuous hash verification |

---

## 8.2 Semantic Learning Pillar

### 8.2.1 Per-Track Requirements

| Track | Semantic Learning Requirement |
|-------|------------------------------|
| A | ≥50 signals captured |
| B | ≥100 signals total, export corpus |
| C | Train model, ≥80% agreement |
| D | Continuous learning from policy decisions |
| Sophia | Self-improving semantic model |

### 8.2.2 Signal Types

| Signal | Description | Confidence Impact |
|--------|-------------|-------------------|
| CORRECT | Verified correct alignment | +0.1 |
| INCORRECT | Verified incorrect alignment | -0.2 |
| PARTIAL | Partially correct | +0.05 |
| MISALIGNED | Semantic mismatch | -0.15 |
| SUSPICIOUS | Anomaly detected | Flag for review |
| COUPLING | High coupling detected | -0.05 |
| CONTRADICTION | Semantic contradiction | -0.3, flag |

### 8.2.3 Corpus Structure

```json
{
  "version": "1.0",
  "track": "B",
  "exported_at": "2025-01-15T10:00:00Z",
  "signal_count": 127,
  "signal_distribution": {
    "CORRECT": 85,
    "INCORRECT": 12,
    "PARTIAL": 20,
    "MISALIGNED": 5,
    "SUSPICIOUS": 3,
    "COUPLING": 2
  },
  "signals": [
    {
      "signal_id": "SIG-001",
      "type": "CORRECT",
      "source_entity": "function:src/user/createUser:createUser",
      "target_entity": "story:STORY-1.2",
      "relationship": "IMPLEMENTS",
      "evidence": "All ACs satisfied, behavior matches spec",
      "confidence_before": 0.85,
      "confidence_after": 0.95,
      "human_verified": true,
      "timestamp": "2025-01-14T09:30:00Z"
    }
  ]
}
```

### 8.2.4 Confidence Propagation Model

```
Initial confidence = extraction_method_confidence

For each signal affecting entity/relationship:
  IF signal.type == CORRECT:
    confidence = min(1.0, confidence + 0.1)
  IF signal.type == INCORRECT:
    confidence = max(0.0, confidence - 0.2)
  IF signal.type == PARTIAL:
    confidence = min(1.0, confidence + 0.05)
  IF signal.type == MISALIGNED:
    confidence = max(0.0, confidence - 0.15)
  IF signal.type == CONTRADICTION:
    confidence = max(0.0, confidence - 0.3)
    flag_for_human_review()

Propagation:
  For each relationship with updated confidence:
    Update connected entity confidence (weighted average)
    Propagate to 1-hop neighbors with decay factor 0.5
```

### 8.2.5 Semantic Alignment Levels

| Level | Symbol | Description |
|-------|--------|-------------|
| ALIGNED | ✅ | Right goal + right subsystem + right pattern |
| PARTIAL | 🟡 | Right idea, wrong execution |
| MISALIGNED | ❌ | Wrong approach or dangerous |

---

## 8.3 API Boundary Pillar

### 8.3.1 API Version Evolution

| Version | Track | Endpoints Added |
|---------|-------|-----------------|
| v1 | A | Entity CRUD, Relationship CRUD, Query, Coverage |
| v2 | B | Drift, Closure, BRD Registry, Shadow Ledger |
| v3 | C | Semantic Alignment, Confidence, Hypothesis |
| v4 | D | Policy, Autonomy, Compliance, Audit |

### 8.3.2 G-API Gate Enforcement

**Forbidden Patterns (ERROR):**

```typescript
// FORBIDDEN: Direct database import
import { db } from '../database';           // G-API VIOLATION
import { prisma } from '@prisma/client';    // G-API VIOLATION
import { connection } from '../db/pool';    // G-API VIOLATION

// FORBIDDEN: Direct filesystem for graph data
import { readFileSync } from 'fs';
const graphData = readFileSync('graph.json'); // G-API VIOLATION

// FORBIDDEN: Cross-track internal imports
// (In Track B code)
import { internalExtractor } from '../track-a/internal'; // G-API VIOLATION
```

**Required Patterns (CORRECT):**

```typescript
// REQUIRED: API import
import { GraphAPI } from '@gnosis/api';     // G-API COMPLIANT
import { query, mutate } from '@gnosis/api/v2'; // G-API COMPLIANT

// REQUIRED: Use API methods
const entities = await GraphAPI.query({ type: 'Function' });
await GraphAPI.createRelationship({ type: 'IMPLEMENTS', from, to });
```

### 8.3.3 API Enforcement Rules

| Rule | Description | Severity |
|------|-------------|----------|
| RULE-API-001 | No direct database imports | ERROR |
| RULE-API-002 | No cross-track internal imports | ERROR |
| RULE-API-003 | All graph operations through versioned API | ERROR |
| RULE-API-004 | API version must match current track | WARNING |
| RULE-API-005 | All API calls logged to shadow ledger | ERROR |

### 8.3.4 API Verification Test

```typescript
// VERIFY-API: Ensure no G-API violations
function verifyAPIBoundary(codebase: string[]): VerifyResult {
  const violations: Violation[] = [];
  
  for (const file of codebase) {
    const ast = parse(file);
    
    // Check imports
    for (const imp of ast.imports) {
      if (isForbiddenImport(imp)) {
        violations.push({
          file,
          line: imp.line,
          type: 'FORBIDDEN_IMPORT',
          message: `Direct database/internal import: ${imp.source}`
        });
      }
    }
    
    // Check for filesystem access to graph data
    for (const call of ast.calls) {
      if (isDirectGraphAccess(call)) {
        violations.push({
          file,
          line: call.line,
          type: 'DIRECT_ACCESS',
          message: `Direct graph data access without API`
        });
      }
    }
  }
  
  return {
    pass: violations.length === 0,
    violations
  };
}
```

---

## 8.4 Extension Protocol Pillar

### 8.4.1 7-Step Extension Protocol

| Step | Action | Gate | Artifacts |
|------|--------|------|-----------|
| 1. PROPOSE | Create EP-X-NNN proposal | — | Proposal document |
| 2. VALIDATE | Check no conflicts with existing schema | — | Validation report |
| 3. APPROVE | Human review and sign-off | HGR-X | Approval signature |
| 4. RECORD | Log proposal in shadow ledger | — | Ledger entry |
| 5. MIGRATE | Transactional schema update | — | Migration script |
| 6. VERIFY | Run G-COMPATIBILITY | G-COMPATIBILITY | Test results |
| 7. CLOSURE | Verify G-CLOSURE still passes | G-CLOSURE | Closure report |

### 8.4.2 Schema Freeze Rules

**During Track X, schemas from Tracks 1..(X-1) are FROZEN.**

| Track | Frozen Schemas | Extensible |
|-------|----------------|------------|
| A | (none) | All |
| B | Track A (16 entities, 21 relationships) | Capabilities only |
| C | Track A + B | Track C additions (E61-E63) |
| D | Track A + B + C | Track D additions (E71-E83) |
| Sophia | All prior | Via protocol only |

**Freeze Violations:**
- RULE-FREEZE-001: Cannot modify frozen entity schema (ERROR)
- RULE-FREEZE-002: Cannot modify frozen relationship schema (ERROR)
- RULE-FREEZE-003: Cannot delete frozen entity type (ERROR)
- RULE-FREEZE-004: Can add new entities in current track (OK)

### 8.4.3 Extension Proposal Template

```markdown
# Extension Proposal EP-X-NNN

## Metadata
- **Proposal ID:** EP-C-001
- **Track:** C
- **Proposer:** [name/system]
- **Date:** YYYY-MM-DD
- **Status:** DRAFT | REVIEW | APPROVED | REJECTED

## Summary
Brief description of what this extension adds.

## Entities Added

| ID | Name | Layer | Purpose |
|----|------|-------|---------|
| E61 | SemanticConcept | Semantic | Abstract meaning unit |
| E62 | BehaviorModel | Semantic | Expected behavior spec |
| E63 | SemanticAssertion | Semantic | Semantic relationship claim |

## Relationships Added

| ID | Name | From → To | Purpose |
|----|------|-----------|---------|
| R100 | SEMANTIC_SUPPORTS | E63 → E02 | Assertion supports story |
| R101 | SEMANTIC_CONTRADICTS | E63 → E63 | Assertions contradict |

## Impact Analysis

### Affected Gates
- G-COMPATIBILITY: Must verify all prior gates pass
- G-CLOSURE: Must verify after migration

### Affected Tests
- VERIFY-E61, VERIFY-E62, VERIFY-E63
- VERIFY-R90, VERIFY-R91

### Migration Complexity
- [ ] LOW: Additive only, no data migration
- [ ] MEDIUM: Schema changes, data migration needed
- [ ] HIGH: Breaking changes, rollback plan required

## Rollback Plan
Steps to revert if migration fails.

## Approval

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Technical Review | | | |
| Human Gate (HGR-X) | | | |

## Verification

- [ ] G-COMPATIBILITY passed after migration
- [ ] G-CLOSURE passed after migration
- [ ] All new VERIFY-E tests pass
- [ ] All new VERIFY-R tests pass
```

### 8.4.4 Gate Interactions

```
Extension Request
       │
       ▼
┌──────────────┐
│  EP-X-NNN    │
│  Proposal    │
└──────────────┘
       │
       ▼
┌──────────────┐
│   VALIDATE   │──── Conflicts? ────► REJECT
└──────────────┘
       │ OK
       ▼
┌──────────────┐
│   APPROVE    │──── HGR-X ────► Human Review
└──────────────┘
       │ Signed
       ▼
┌──────────────┐
│   MIGRATE    │──── Transactional
└──────────────┘
       │
       ▼
┌──────────────────┐
│ G-COMPATIBILITY  │──── Fail? ────► ROLLBACK
└──────────────────┘
       │ Pass
       ▼
┌──────────────┐
│  G-CLOSURE   │──── Fail? ────► ROLLBACK
└──────────────┘
       │ Pass
       ▼
    COMPLETE
```

---

# PART IX: ENTITY EXTRACTION SPECIFICATIONS (67 Entities)

## 9.1 Entity Registry Overview

| Layer | Entity IDs | Count | Track |
|-------|------------|-------|-------|
| Requirements | E01-E04 | 4 | A |
| Design | E06, E08 | 2 | A |
| Implementation | E11-E15 | 4 | A |
| Verification | E27-E29 | 3 | A |
| Provenance | E49, E50, E52 | 3 | A |
| Compliance | E57-E60 | 4 | D |
| Semantic | E61-E63 | 3 | C |
| Policy | E71-E73 | 3 | D |
| Autonomy | E80-E83 | 4 | D |
| Operations (V20.1) | E91-E97 | 7 | D |
| **Total** | | **37 core** | |

*Note: Full 67 entities include subtypes and supporting entities.*

---

## 9.2 Track A Entities (16)

### E01: Epic

| Attribute | Value |
|-----------|-------|
| **Layer** | Requirements |
| **Track** | A |
| **Source** | BRD document |
| **Extraction** | PARSE BRD for `## Epic N: Title` |
| **ID Format** | `^EPIC-\d+$` |

**Required Attributes:**
- `id`: Epic ID (EPIC-N)
- `number`: Epic number (integer)
- `title`: Epic title (string)
- `description`: Epic description (string, optional)

**Validation Rules:**
- RULE-E01-001: ID must match format `^EPIC-\d+$` (ERROR)
- RULE-E01-002: Number must be positive integer (ERROR)
- RULE-E01-003: Title must not be empty (ERROR)
- RULE-E01-004: Must have at least one story (WARNING)

**Test Cases:**
- TEST-E01-P-001: `## Epic 64: Unified Traceability Graph` → EPIC-64 ✓
- TEST-E01-P-002: `## Epic 1: Foundation` → EPIC-1 ✓
- TEST-E01-N-001: `## Epic: Missing Number` → FAIL (no number)
- TEST-E01-N-002: `## Epic -5: Negative` → FAIL (negative)

**Verification:** VERIFY-E01 - Given BRD with N epics, extraction produces exactly N Epic entities.

---

### E02: Story

| Attribute | Value |
|-----------|-------|
| **Layer** | Requirements |
| **Track** | A |
| **Source** | BRD document |
| **Extraction** | PARSE BRD for `### Story X.Y: Title` |
| **ID Format** | `^STORY-\d+\.\d+$` |

**Required Attributes:**
- `id`: Story ID (STORY-X.Y)
- `epic_number`: Parent epic number
- `story_number`: Story number within epic
- `title`: Story title
- `user_story`: As a/I want/So that format

**Validation Rules:**
- RULE-E02-001: ID must match format (ERROR)
- RULE-E02-002: Epic number must exist (ERROR)
- RULE-E02-003: Story number must be positive (ERROR)
- RULE-E02-004: Must have at least one AC (WARNING)

**Verification:** VERIFY-E02 - Given BRD with N stories, extraction produces exactly N Story entities.

---

### E03: AcceptanceCriterion

| Attribute | Value |
|-----------|-------|
| **Layer** | Requirements |
| **Track** | A |
| **Source** | BRD document |
| **Extraction** | PARSE BRD for `AC-X.Y.Z` in tables |
| **ID Format** | `^AC-\d+\.\d+\.\d+$` |

**Validation Rules:**
- RULE-E03-001: ID must match format (ERROR)
- RULE-E03-002: Story must exist (ERROR)
- RULE-E03-003: Description must not be empty (ERROR)

**Verification:** VERIFY-E03 - Given BRD with N ACs, extraction produces exactly N AC entities.

---

### E11: SourceFile

| Attribute | Value |
|-----------|-------|
| **Layer** | Implementation |
| **Track** | A |
| **Source** | Filesystem |
| **Extraction** | ENUMERATE files matching `src/**/*.{ts,tsx,js,jsx}` |
| **ID Format** | `^file:.+$` |

**Required Attributes:**
- `id`: File ID (file:path/to/file.ts)
- `path`: Relative path from project root
- `content_hash`: SHA256 of file contents
- `language`: Programming language

**Validation Rules:**
- RULE-E11-001: File must exist on disk (ERROR)
- RULE-E11-002: File must be parseable (ERROR)
- RULE-E11-003: Path must be relative to project root (WARNING)

**Verification:** VERIFY-E11 - Given project with N source files, extraction produces exactly N SourceFile entities.

---

### E12: Function

| Attribute | Value |
|-----------|-------|
| **Layer** | Implementation |
| **Track** | A |
| **Source** | AST analysis |
| **Extraction** | ANALYZE source files for function declarations |
| **ID Format** | `^function:.+:.+$` |

**Required Attributes:**
- `id`: Function ID (function:file:name)
- `name`: Function name
- `file_id`: Parent SourceFile ID
- `line_start`: Starting line number
- `line_end`: Ending line number
- `visibility`: export | private | protected

**Validation Rules:**
- RULE-E12-001: Parent file must exist (ERROR)
- RULE-E12-002: Function name must be valid identifier (ERROR)
- RULE-E12-003: Line numbers must be valid (ERROR)
- RULE-E12-004: `line_start` ≤ `line_end` (ERROR)

**Verification:** VERIFY-E12 - Given source files with N functions, extraction produces exactly N Function entities.

---

### E13: Class

| Attribute | Value |
|-----------|-------|
| **Layer** | Implementation |
| **Track** | A |
| **Source** | AST analysis |
| **Extraction** | ANALYZE source files for class declarations |
| **ID Format** | `^class:.+:.+$` |

**Verification:** VERIFY-E13 - Given source files with N classes, extraction produces exactly N Class entities.

---

### E27-E29: Test Entities

**E27 TestFile:** `ENUMERATE test/**/*.test.{ts,tsx}`
**E28 TestSuite:** `ANALYZE for describe() blocks`  
**E29 TestCase:** `ANALYZE for it() blocks`

---

### E49-E52: Provenance Entities

**E49 ReleaseVersion:** `GIT_ANALYSIS of tags`
**E50 Commit:** `GIT_ANALYSIS of commit log`
**E52 ChangeSet:** `DERIVE from commits`

---

## 9.3 Track C Entities (E61-E63)

### E61: SemanticConcept

| Attribute | Value |
|-----------|-------|
| **Layer** | Semantic |
| **Track** | C |
| **Source** | Semantic analysis |
| **Extraction** | SEMANTIC_ANALYSIS of code + requirements |
| **ID Format** | `^concept:.+$` |

**Required Attributes:**
- `id`: Concept ID (concept:domain:name)
- `name`: Concept name
- `domain`: Domain area (e.g., "user-management")
- `definition`: Natural language definition
- `related_entities`: List of related entity IDs

**Validation Rules:**
- RULE-E61-001: Name must not be empty (ERROR)
- RULE-E61-002: Must have at least one related entity (WARNING)
- RULE-E61-003: Definition must be coherent (SEMANTIC)

**Verification:** VERIFY-E61 - Semantic concepts extracted align with human-labeled concepts ≥80%.

---

### E62: BehaviorModel

| Attribute | Value |
|-----------|-------|
| **Layer** | Semantic |
| **Track** | C |
| **Source** | Requirements + Code analysis |
| **Extraction** | SEMANTIC_ANALYSIS |
| **ID Format** | `^behavior:.+$` |

**Required Attributes:**
- `id`: Behavior ID (behavior:component:action)
- `component`: Component name
- `action`: Action description
- `preconditions`: Required preconditions
- `postconditions`: Expected postconditions
- `story_id`: Related story ID

**Validation Rules:**
- RULE-E62-001: Component must exist (ERROR)
- RULE-E62-002: Story must exist (ERROR)
- RULE-E62-003: Pre/postconditions must be parseable (WARNING)

**Verification:** VERIFY-E62 - Behavior models match documented requirements ≥80%.

---

### E63: SemanticAssertion

| Attribute | Value |
|-----------|-------|
| **Layer** | Semantic |
| **Track** | C |
| **Source** | Semantic engine |
| **Extraction** | SEMANTIC_ANALYSIS |
| **ID Format** | `^assertion:.+$` |

**Required Attributes:**
- `id`: Assertion ID (assertion:NNN)
- `subject_entity`: Entity being asserted about
- `predicate`: Relationship type
- `object_entity`: Target entity
- `confidence`: Confidence score (0.0-1.0)
- `evidence`: Supporting evidence

**Validation Rules:**
- RULE-E63-001: Subject and object must exist (ERROR)
- RULE-E63-002: Confidence must be 0.0-1.0 (ERROR)
- RULE-E63-003: Evidence must not be empty (WARNING)

**Verification:** VERIFY-E63 - Assertions with confidence ≥0.8 are correct ≥90% of time.

---

## 9.4 Track D Entities (E71-E83)

### E71: PolicyRule

| Attribute | Value |
|-----------|-------|
| **Layer** | Policy |
| **Track** | D |
| **Source** | Policy Rules Spec V3.0 |
| **Extraction** | PARSE policy specification |
| **ID Format** | `^policy:(SAFE|ETH|ARCH|GOV|QUAL)-\d+$` |

**Required Attributes:**
- `id`: Policy ID (policy:SAFE-001)
- `category`: SAFETY | ETHICS | ARCHITECTURE | GOVERNANCE | QUALITY
- `priority`: Priority number (lower = higher priority)
- `name`: Rule name
- `description`: Rule description
- `enforcement`: How rule is enforced
- `violation_severity`: CRITICAL | HIGH | MEDIUM | LOW

**Validation Rules:**
- RULE-E71-001: Category must be valid (ERROR)
- RULE-E71-002: Priority must be positive integer (ERROR)
- RULE-E71-003: Description must not be empty (ERROR)

**Verification:** VERIFY-E71 - All 38 policy rules extracted and parseable.

---

### E72: ConstraintViolation

| Attribute | Value |
|-----------|-------|
| **Layer** | Policy |
| **Track** | D |
| **Source** | Policy evaluation |
| **Extraction** | POLICY_EVALUATION |
| **ID Format** | `^violation:.+$` |

**Required Attributes:**
- `id`: Violation ID
- `policy_rule_id`: Violated rule
- `violating_entity`: Entity that violated
- `severity`: Violation severity
- `detected_at`: Detection timestamp
- `evidence`: Violation evidence
- `resolution_status`: OPEN | RESOLVED | WAIVED

**Verification:** VERIFY-E72 - Violations correctly identified per policy rules.

---

### E73: DecisionRecord

| Attribute | Value |
|-----------|-------|
| **Layer** | Policy |
| **Track** | D |
| **Source** | Policy engine |
| **Extraction** | POLICY_EVALUATION |
| **ID Format** | `^decision:.+$` |

**Required Attributes:**
- `id`: Decision ID
- `policy_rules_evaluated`: List of evaluated rules
- `decision`: ALLOW | BLOCK | ESCALATE
- `reasoning`: Decision reasoning
- `timestamp`: Decision timestamp

**Verification:** VERIFY-E73 - Decision records complete for all policy evaluations.

---

### E80: AutonomyEvent

| Attribute | Value |
|-----------|-------|
| **Layer** | Autonomy |
| **Track** | D |
| **Source** | Autonomy engine |
| **Extraction** | Runtime capture |
| **ID Format** | `^autonomy-event:.+$` |

**Required Attributes:**
- `id`: Event ID
- `event_type`: SELF_MODIFY | EXTEND | QUERY | ESCALATE
- `autonomy_level`: L0-L5
- `initiated_by`: Initiator (system | human)
- `outcome`: SUCCESS | BLOCKED | ESCALATED
- `timestamp`: Event timestamp

**Verification:** VERIFY-E80 - All autonomous events logged.

---

### E81: ProposedModification

| Attribute | Value |
|-----------|-------|
| **Layer** | Autonomy |
| **Track** | D |
| **Source** | Self-modification proposals |
| **ID Format** | `^proposal:.+$` |

**Required Attributes:**
- `id`: Proposal ID
- `modification_type`: SCHEMA | CODE | CONFIG
- `target`: What to modify
- `rationale`: Why modification needed
- `risk_assessment`: Risk level
- `approval_required`: Autonomy level required

**Verification:** VERIFY-E81 - Proposals include all required fields.

---

### E82: SafePlan

| Attribute | Value |
|-----------|-------|
| **Layer** | Autonomy |
| **Track** | D |
| **Source** | Plan verification |
| **ID Format** | `^safe-plan:.+$` |

**Required Attributes:**
- `id`: Plan ID
- `proposal_id`: Source proposal
- `verification_steps`: Steps to verify safety
- `rollback_plan`: How to rollback
- `gates_required`: Gates that must pass
- `verified`: Verification status

**Verification:** VERIFY-E82 - Safe plans include rollback procedures.

---

### E83: HumanEscalation

| Attribute | Value |
|-----------|-------|
| **Layer** | Autonomy |
| **Track** | D |
| **Source** | Escalation events |
| **ID Format** | `^escalation:.+$` |

**Required Attributes:**
- `id`: Escalation ID
- `trigger_event`: What triggered escalation
- `escalation_level`: Required approval level
- `assigned_to`: Human assignee
- `status`: PENDING | APPROVED | REJECTED
- `resolution`: Resolution details

**Verification:** VERIFY-E83 - Escalations reach humans within SLA.

---

## 9.5 Legal/Accessibility/UX Entities (E57-E60)

### E57: LegalRestriction
### E58: AccessibilityRequirement
### E59: UXGuideline  
### E60: DesignSystem

*Detailed specifications per BRD V20.0 Appendix F.*

## 9.6 Compliance Entities (E64-E67) [EXTENSION]

**Status:** Available via Extension Protocol EP-D-001

### E64: ComplianceRule
### E65: ComplianceEvidence
### E66: ComplianceViolation
### E67: ComplianceReport

*Added via Extension Protocol EP-D-001.*

---

## 9.7 Operations Entities (E91-E97) [V20.1]

**Status:** Available via Extension Protocol EP-D-002

### E91: Service

| Attribute | Value |
|-----------|-------|
| **Layer** | Operations |
| **ID Format** | `SVC-{name}` |
| **Extraction** | STRUCTURAL_INFERENCE from deployment configs |
| **Confidence** | 1.0 (structural) |

**Validation Rules:**
- RULE-E91-001: ID must match `SVC-[a-z0-9-]+` pattern (ERROR)
- RULE-E91-002: Must have health_status field (ERROR)
- RULE-E91-003: Must have deployment_target reference (WARNING)

**Test:** VERIFY-E91

### E92: Deployment

| Attribute | Value |
|-----------|-------|
| **Layer** | Operations |
| **ID Format** | `DEPLOY-{id}` |
| **Extraction** | STRUCTURAL_INFERENCE from CI/CD pipelines |
| **Confidence** | 1.0 (structural) |

**Validation Rules:**
- RULE-E92-001: ID must match `DEPLOY-[0-9-]+` pattern (ERROR)
- RULE-E92-002: Must have service_id reference (ERROR)
- RULE-E92-003: Must have commit_sha field (ERROR)

**Test:** VERIFY-E92

### E93: SLO

| Attribute | Value |
|-----------|-------|
| **Layer** | Operations |
| **ID Format** | `SLO-{id}` |
| **Extraction** | EXPLICIT_MARKER from SLO definitions |
| **Confidence** | 1.0 (explicit) |

**Validation Rules:**
- RULE-E93-001: ID must match `SLO-[a-z0-9-]+` pattern (ERROR)
- RULE-E93-002: Must have target field (ERROR)
- RULE-E93-003: Must have service_id reference (ERROR)

**Test:** VERIFY-E93

### E94: ErrorBudget

| Attribute | Value |
|-----------|-------|
| **Layer** | Operations |
| **ID Format** | `ERRBUDGET-{id}` |
| **Extraction** | STRUCTURAL_INFERENCE from SLO records |
| **Confidence** | 1.0 (structural) |

**Validation Rules:**
- RULE-E94-001: ID must match `ERRBUDGET-[a-z0-9-]+` pattern (ERROR)
- RULE-E94-002: Must have total_budget field (ERROR)
- RULE-E94-003: remaining must equal total_budget - consumed (ERROR)

**Test:** VERIFY-E94

### E95: Alert

| Attribute | Value |
|-----------|-------|
| **Layer** | Operations |
| **ID Format** | `ALERT-{id}` |
| **Extraction** | STRUCTURAL_INFERENCE from monitoring configs |
| **Confidence** | 1.0 (structural) |

**Validation Rules:**
- RULE-E95-001: ID must match `ALERT-[a-z0-9-]+` pattern (ERROR)
- RULE-E95-002: Must have service_id reference (ERROR)
- RULE-E95-003: Must have severity field (ERROR)

**Test:** VERIFY-E95

### E96: Runbook

| Attribute | Value |
|-----------|-------|
| **Layer** | Operations |
| **ID Format** | `RUNBOOK-{id}` |
| **Extraction** | EXPLICIT_MARKER from operations docs |
| **Confidence** | 1.0 (explicit) |

**Validation Rules:**
- RULE-E96-001: ID must match `RUNBOOK-[a-z0-9-]+` pattern (ERROR)
- RULE-E96-002: Must have steps field (ERROR)
- RULE-E96-003: Must have incident_type reference (WARNING)

**Test:** VERIFY-E96

### E97: SimulationRun

| Attribute | Value |
|-----------|-------|
| **Layer** | Operations |
| **ID Format** | `SIM-{id}` |
| **Extraction** | STRUCTURAL_INFERENCE from simulation harness |
| **Confidence** | 1.0 (structural) |

**Validation Rules:**
- RULE-E97-001: ID must match `SIM-[0-9-]+` pattern (ERROR)
- RULE-E97-002: Must have cycles_completed field (ERROR)
- RULE-E97-003: Must have drift_metrics object (ERROR)
- RULE-E97-004: Must have pass field (boolean) (ERROR)

**Test:** VERIFY-E97

**G-SIMULATION Integration:**
- SimulationRun records are inputs to G-SIMULATION gate
- Gate passes when: cycles_completed ≥ 1000 AND drift_metrics.total_drift < 0.01 AND policy_violations.length = 0

---

# PART X: RELATIONSHIP EXTRACTION SPECIFICATIONS (100 Relationships)

## 10.1 Relationship Registry Overview

| Category | Relationship IDs | Count | Track |
|----------|------------------|-------|-------|
| Hierarchical | R01-R03 | 3 | A |
| Containment | R04-R07 | 4 | A |
| Design→Impl | R14, R16 | 2 | A |
| Req→Impl | R18, R19 | 2 | A |
| Impl→Impl | R21-R26 | 5 | A |
| Req→Test | R36, R37 | 2 | A |
| Provenance | R63, R67, R70 | 3 | A |
| Semantic | R90+ | ~15 | C |
| Policy | R95+ | ~15 | D |
| Compliance | R83-R91 | 9 | D |
| Operations (V20.1) | R104-R112 | 9 | D |
| **Total** | | **~69 core** | |

*Note: Full 100 relationships include subtypes.*

---

## 10.2 Track A Relationships (21)

### R01: HAS_STORY

| Attribute | Value |
|-----------|-------|
| **Category** | Hierarchical |
| **From → To** | Epic → Story |
| **Cardinality** | 1:N |
| **Extraction** | STRUCTURAL_INFERENCE from BRD hierarchy |
| **Confidence** | 1.0 (structural) |

**Validation Rules:**
- RULE-R01-001: From must be Epic (ERROR)
- RULE-R01-002: To must be Story (ERROR)
- RULE-R01-003: Story epic number must match (ERROR)

**Test Cases:**
- TEST-R01-P-001: EPIC-64 → STORY-64.1 ✓
- TEST-R01-N-001: EPIC-64 → STORY-65.1 ✗ (wrong epic)

**Verification:** VERIFY-R01 - All stories linked to correct epics.

---

### R02: HAS_AC

| Attribute | Value |
|-----------|-------|
| **Category** | Hierarchical |
| **From → To** | Story → AcceptanceCriterion |
| **Cardinality** | 1:N |
| **Confidence** | 1.0 (structural) |

**Verification:** VERIFY-R02 - All ACs linked to correct stories.

---

### R18: IMPLEMENTS

| Attribute | Value |
|-----------|-------|
| **Category** | Req→Impl |
| **From → To** | SourceFile → Story |
| **Cardinality** | N:M |
| **Extraction** | EXPLICIT_MARKER `@implements STORY-X.Y` |
| **Confidence** | 1.0 (explicit marker) |

**Validation Rules:**
- RULE-R18-001: From must be SourceFile (ERROR)
- RULE-R18-002: To must be Story (ERROR)
- RULE-R18-003: Story must exist in BRD (ERROR)
- RULE-R18-004: Marker syntax must be valid (ERROR)

**Test Cases:**
- TEST-R18-P-001: `// @implements STORY-64.3` → Creates R18 ✓
- TEST-R18-P-002: `/** @implements STORY-1.2 */` → Creates R18 ✓
- TEST-R18-N-001: `// @implements STORY-999.999` → FAIL (non-existent)
- TEST-R18-N-002: `// @implements 64.3` → FAIL (malformed)

**Verification:** VERIFY-R18 - Given N @implements markers, exactly N R18 relationships exist.

---

### R19: SATISFIES

| Attribute | Value |
|-----------|-------|
| **Category** | Req→Impl |
| **From → To** | Function/Class → AcceptanceCriterion |
| **Cardinality** | N:M |
| **Extraction** | EXPLICIT_MARKER `@satisfies AC-X.Y.Z` |
| **Confidence** | 1.0 (explicit marker) |

**Verification:** VERIFY-R19 - Given N @satisfies markers, exactly N R19 relationships exist.

---

### R21: IMPORTS

| Attribute | Value |
|-----------|-------|
| **Category** | Impl→Impl |
| **From → To** | SourceFile → SourceFile |
| **Cardinality** | N:M |
| **Extraction** | ANALYZE import statements |
| **Confidence** | 1.0 (syntactic) |

**Verification:** VERIFY-R21 - All import relationships extracted.

---

### R36: TESTED_BY

| Attribute | Value |
|-----------|-------|
| **Category** | Req→Test |
| **From → To** | Story → TestSuite |
| **Cardinality** | 1:N |
| **Extraction** | EXPLICIT_MARKER `describe('STORY-X.Y: ...')` |
| **Confidence** | 1.0 (explicit marker) |

**Verification:** VERIFY-R36 - Stories linked to test suites via describe blocks.

---

### R37: VERIFIED_BY

| Attribute | Value |
|-----------|-------|
| **Category** | Req→Test |
| **From → To** | AcceptanceCriterion → TestCase |
| **Cardinality** | 1:N |
| **Extraction** | EXPLICIT_MARKER `it('AC-X.Y.Z: ...')` |
| **Confidence** | 1.0 (explicit marker) |

**Verification:** VERIFY-R37 - ACs linked to test cases via it blocks.

---

## 10.3 Track A Relationship Summary

| ID | Name | From → To | Extraction |
|----|------|-----------|------------|
| R01 | HAS_STORY | Epic → Story | STRUCTURAL |
| R02 | HAS_AC | Story → AC | STRUCTURAL |
| R03 | HAS_CONSTRAINT | Story → Constraint | STRUCTURAL |
| R04 | CONTAINS_FILE | Module → SourceFile | STRUCTURAL |
| R05 | CONTAINS_ENTITY | SourceFile → Function/Class | ANALYZE |
| R06 | CONTAINS_SUITE | TestFile → TestSuite | ANALYZE |
| R07 | CONTAINS_CASE | TestSuite → TestCase | ANALYZE |
| R14 | IMPLEMENTED_BY | TechnicalDesign → SourceFile | EXPLICIT |
| R16 | DEFINED_IN | DataSchema → SourceFile | EXPLICIT |
| R18 | IMPLEMENTS | SourceFile → Story | EXPLICIT |
| R19 | SATISFIES | Function/Class → AC | EXPLICIT |
| R21 | IMPORTS | SourceFile → SourceFile | ANALYZE |
| R22 | CALLS | Function → Function | ANALYZE |
| R23 | EXTENDS | Class → Class | ANALYZE |
| R24 | IMPLEMENTS_INTERFACE | Class → Interface | ANALYZE |
| R26 | DEPENDS_ON | Module → Module | STRUCTURAL |
| R36 | TESTED_BY | Story → TestSuite | EXPLICIT |
| R37 | VERIFIED_BY | AC → TestCase | EXPLICIT |
| R63 | INTRODUCED_IN | Story → ReleaseVersion | GIT |
| R67 | MODIFIED_IN | SourceFile → Commit | GIT |
| R70 | GROUPS | ChangeSet → Commit | DERIVE |

---

## 10.4 Track C Relationships (Semantic)

### R90: SEMANTIC_SUPPORTS

| Attribute | Value |
|-----------|-------|
| **Category** | Semantic |
| **From → To** | SemanticAssertion → Story/AC |
| **Cardinality** | N:M |
| **Extraction** | SEMANTIC_ANALYSIS |
| **Confidence** | 0.7-0.95 |

**Verification:** VERIFY-R90 - Semantic support relationships align with human judgment ≥80%.

---

### R91: POLICY_GOVERNED_BY

| Attribute | Value |
|-----------|-------|
| **Category** | Policy |
| **From → To** | Entity → PolicyRule |
| **Cardinality** | N:M |
| **Extraction** | POLICY_EVALUATION |
| **Confidence** | 1.0 (policy engine) |

**Verification:** VERIFY-R91 - All entities governed by applicable policy rules.

---

## 10.5 Track D Relationships (Legal/Accessibility/UX - R83-R91)

| ID | Name | From → To | Category |
|----|------|-----------|----------|
| R83 | CONFLICTS_WITH | License → License | Legal |
| R84 | HAS_RESTRICTION | License → LegalRestriction | Legal |
| R85 | REQUIRES_ATTRIBUTION | License → SourceFile | Legal |
| R86 | REQUIRES_A11Y | Story → AccessibilityRequirement | Accessibility |
| R87 | VIOLATES_A11Y | SourceFile → AccessibilityRequirement | Accessibility |
| R88 | VALIDATED_BY_A11Y | AccessibilityRequirement → TestCase | Accessibility |
| R89 | MUST_CONFORM_TO | Story → UXGuideline | UX |
| R90 | VIOLATES_UX | SourceFile → UXGuideline | UX |
| R91 | USES_DESIGN_SYSTEM | Module → DesignSystem | UX |

## 10.6 Track D Relationships (Compliance - Extension R92-R103)

| ID | Name | From → To | Extension |
|----|------|-----------|-----------|
| R92 | ENFORCES | ComplianceRule → PolicyRule | EP-D-001 |
| R93 | EVIDENCED_BY | ComplianceRule → ComplianceEvidence | EP-D-001 |
| R94 | VIOLATED_BY | ComplianceRule → ComplianceViolation | EP-D-001 |
| R95 | REPORTED_IN | ComplianceEvidence → ComplianceReport | EP-D-001 |
| R96 | DOCUMENTS | ComplianceReport → Audit | EP-D-001 |
| R97 | REQUIRES | ComplianceRule → ApprovalRequest | EP-D-001 |
| R98 | APPROVES | Human → ApprovalRequest | EP-D-001 |
| R102 | REJECTS | Human → ApprovalRequest | EP-D-001 |
| R103 | ESCALATES | ApprovalRequest → EscalationLevel | EP-D-001 |

---

## 10.7 Track D Relationships (Operations - R104-R112) [V20.1]

| ID | Name | From → To | Extension |
|----|------|-----------|-----------|
| R104 | DEPLOYS_TO | Service → Environment | EP-D-002 |
| R105 | MONITORS | Alert → Service | EP-D-002 |
| R106 | TRIGGERED_BY | Incident → Alert | EP-D-002 |
| R107 | RESOLVES | Commit → Incident | EP-D-002 |
| R108 | MEASURES | SLO → Service | EP-D-002 |
| R109 | CONSUMES | Service → ErrorBudget | EP-D-002 |
| R110 | DOCUMENTS | Runbook → Incident | EP-D-002 |
| R111 | VALIDATES | SimulationRun → Graph | EP-D-002 |
| R112 | SIMULATES | SimulationRun → Service | EP-D-002 |

### Operations Relationship Details

**R104: DEPLOYS_TO**
| Attribute | Value |
|-----------|-------|
| **From** | E91 Service |
| **To** | E24 Environment |
| **Cardinality** | N:M |
| **Confidence** | structural |
| **Test** | VERIFY-R104 |

**R105: MONITORS**
| Attribute | Value |
|-----------|-------|
| **From** | E95 Alert |
| **To** | E91 Service |
| **Cardinality** | N:1 |
| **Confidence** | structural |
| **Test** | VERIFY-R105 |

**R106: TRIGGERED_BY**
| Attribute | Value |
|-----------|-------|
| **From** | E53 Incident |
| **To** | E95 Alert |
| **Cardinality** | 1:1 |
| **Confidence** | inferred (from timing) |
| **Test** | VERIFY-R106 |

**R107: RESOLVES**
| Attribute | Value |
|-----------|-------|
| **From** | E50 Commit |
| **To** | E53 Incident |
| **Cardinality** | N:1 |
| **Confidence** | explicit |
| **Test** | VERIFY-R107 |

**R108: MEASURES**
| Attribute | Value |
|-----------|-------|
| **From** | E93 SLO |
| **To** | E91 Service |
| **Cardinality** | N:1 |
| **Confidence** | structural |
| **Test** | VERIFY-R108 |

**R109: CONSUMES**
| Attribute | Value |
|-----------|-------|
| **From** | E91 Service |
| **To** | E94 ErrorBudget |
| **Cardinality** | 1:N |
| **Confidence** | structural |
| **Test** | VERIFY-R109 |

**R110: DOCUMENTS**
| Attribute | Value |
|-----------|-------|
| **From** | E96 Runbook |
| **To** | E53 Incident |
| **Cardinality** | N:M |
| **Confidence** | explicit |
| **Test** | VERIFY-R110 |

**R111: VALIDATES**
| Attribute | Value |
|-----------|-------|
| **From** | E97 SimulationRun |
| **To** | Graph (entire) |
| **Cardinality** | N:1 |
| **Confidence** | structural |
| **Test** | VERIFY-R111 |

**R112: SIMULATES**
| Attribute | Value |
|-----------|-------|
| **From** | E97 SimulationRun |
| **To** | E91 Service |
| **Cardinality** | N:M |
| **Confidence** | structural |
| **Test** | VERIFY-R112 |

---

# PART XI: GATE SPECIFICATIONS (20 Gates)

## 11.1 Gate Registry

| Gate | Name | Track | Threshold | Type |
|------|------|-------|-----------|------|
| G01 | Story→Code | A | 100% | percentage |
| G03 | Code→Story | A | 0 orphans | count |
| G04 | Story→Test | A | 100% | percentage |
| G06 | Test→AC | A | 0 orphans | count |
| G-API | API Boundary | A | pass | boolean |
| G-COGNITIVE | Cognitive Health | A | pass | boolean |
| G-HEALTH | System Health | B | pass | boolean |
| G-REGISTRY | BRD Registry | B | pass | boolean |
| G-DRIFT | Zero Drift | B | 0 changes | count |
| G-CLOSURE | Deterministic | B | identical | comparison |
| G-COMPATIBILITY | Prior Tests | C | 100% | percentage |
| G-SEMANTIC | Semantic Align | C | ≥80% | percentage |
| G-ALIGNMENT | Code↔Req | C | ≥80% | percentage |
| G-CONFIDENCE | Calibration | C | pass | boolean |
| G-POLICY | Policy | D | pass | boolean |
| G-AUTONOMY | Autonomy | D | pass | boolean |
| G-COMPLIANCE | Compliance | D | pass | boolean |
| G-AUDIT | Audit | D | pass | boolean |
| G-SIMULATION | Simulation | D | pass | boolean |
| G-OPS | Operations | D | pass | boolean |

**Note:** G02 (AC→Code) and G05 (AC→Test) available via Extension Protocol EP-A-001.

## 11.2 Gate Activation by Track

| Track | Active Gates | Total |
|-------|--------------|-------|
| A | G01, G03, G04, G06, G-API, G-COGNITIVE | 6 |
| B | + G-HEALTH, G-REGISTRY, G-DRIFT, G-CLOSURE | 10 |
| C | + G-COMPATIBILITY, G-SEMANTIC, G-ALIGNMENT, G-CONFIDENCE | 15 |
| D | + G-POLICY, G-AUTONOMY, G-COMPLIANCE, G-AUDIT, G-SIMULATION, G-OPS | 20 |
| Sophia | All 17 | 17 |

## 11.3 Coverage Gate Specifications

### G01: Story→Code Coverage

**Purpose:** Every story has implementing code.
**Threshold:** 100%
**Computation:** `stories_with_implements / total_stories`

```typescript
function checkG01(): GateResult {
  const stories = getEntities('Story');
  const implemented = stories.filter(s => 
    getRelationships('IMPLEMENTS').some(r => r.to === s.id)
  );
  const coverage = implemented.length / stories.length;
  return {
    gate: 'G01',
    pass: coverage === 1.0,
    value: coverage,
    threshold: 1.0,
    message: `${implemented.length}/${stories.length} stories implemented`
  };
}
```

---

### G02: AC→Code Coverage [EXTENSION EP-A-001]

**Status:** Available via Extension Protocol EP-A-001
**Purpose:** Acceptance criteria have implementing code.
**Threshold:** ≥95%
**Computation:** `acs_with_satisfies / total_acs`

```typescript
function checkG02(): GateResult {
  const acs = getEntities('AcceptanceCriterion');
  const satisfied = acs.filter(ac => 
    getRelationships('SATISFIES').some(r => r.to === ac.id)
  );
  const coverage = satisfied.length / acs.length;
  return {
    gate: 'G02',
    pass: coverage >= 0.95,
    value: coverage,
    threshold: 0.95,
    message: `${satisfied.length}/${acs.length} ACs satisfied (${(coverage*100).toFixed(1)}%)`
  };
}
```

**Validation Rules:**
- RULE-G02-001: Coverage must be ≥95% (ERROR if <95%)
- RULE-G02-002: Any AC without @satisfies flagged (WARNING)

---

### G03: Code→Story Traceability

**Purpose:** No orphan code (all code traces to story).
**Threshold:** 0 orphans

```typescript
function checkG03(): GateResult {
  const sourceFiles = getEntities('SourceFile');
  const orphans = sourceFiles.filter(f => 
    !getRelationships('IMPLEMENTS').some(r => r.from === f.id)
  );
  return {
    gate: 'G03',
    pass: orphans.length === 0,
    value: orphans.length,
    threshold: 0,
    orphanList: orphans.map(o => o.path)
  };
}
```

---

### G04: Story→Test Coverage

**Purpose:** Every story has tests.
**Threshold:** 100%

---

### G05: AC→Test Coverage [EXTENSION EP-A-001]

**Status:** Available via Extension Protocol EP-A-001
**Purpose:** Acceptance criteria have test cases.
**Threshold:** ≥95%
**Computation:** `acs_with_test / total_acs`

```typescript
function checkG05(): GateResult {
  const acs = getEntities('AcceptanceCriterion');
  const tested = acs.filter(ac => 
    getRelationships('VERIFIED_BY').some(r => r.from === ac.id)
  );
  const coverage = tested.length / acs.length;
  return {
    gate: 'G05',
    pass: coverage >= 0.95,
    value: coverage,
    threshold: 0.95,
    message: `${tested.length}/${acs.length} ACs tested (${(coverage*100).toFixed(1)}%)`
  };
}
```

**Validation Rules:**
- RULE-G05-001: Coverage must be ≥95% (ERROR if <95%)
- RULE-G05-002: Any AC without test flagged (WARNING)

---

### G06: Test→AC Traceability

**Purpose:** No orphan tests.
**Threshold:** 0 orphans

---

## 11.4 Integrity Gate Specifications

### G-HEALTH: System Health

**Purpose:** Manifest matches disk state.
**Track:** B+

```typescript
function checkGHealth(): GateResult {
  const manifest = loadManifest();
  const diskState = computeDiskState();
  
  for (const file of manifest.files) {
    const diskHash = diskState.get(file.path);
    if (diskHash !== file.hash) {
      return { gate: 'G-HEALTH', pass: false, 
               message: `Hash mismatch: ${file.path}` };
    }
  }
  return { gate: 'G-HEALTH', pass: true };
}
```

---

### G-DRIFT: Zero Drift

**Purpose:** No unexpected state changes between ingestions.
**Track:** B+
**Threshold:** 0 changes

```typescript
function checkGDrift(): GateResult {
  const graph1 = loadPreviousGraph();
  const graph2 = loadCurrentGraph();
  const diff = computeDiff(graph1, graph2);
  
  return {
    gate: 'G-DRIFT',
    pass: diff.changes.length === 0,
    value: diff.changes.length,
    threshold: 0,
    changes: diff.changes
  };
}
```

---

### G-CLOSURE: Deterministic Ingestion

**Purpose:** Re-ingestion produces identical graph.
**Track:** B+

```typescript
function checkGClosure(): GateResult {
  const graph1 = ingest(codebase);
  const graph2 = ingest(codebase);
  const identical = deepEqual(
    canonicalize(graph1), 
    canonicalize(graph2)
  );
  return {
    gate: 'G-CLOSURE',
    pass: identical,
    value: identical ? 'identical' : 'different'
  };
}
```

---

## 11.5 Semantic Gate Specifications

### G-SEMANTIC: Semantic Alignment

**Purpose:** Code semantically aligns with requirements.
**Track:** C+
**Threshold:** ≥80%

#### Rubric Version Requirement (V20.6.1)

All semantic alignment evaluations MUST reference a frozen, versioned semantic rubric. This constraint ensures:
- **Auditability:** Every alignment decision records which rubric version was used
- **Non-drift:** Semantic interpretations cannot silently change between evaluations
- **Autonomy protection:** Track D policy decisions are based on stable semantic foundations

```typescript
interface SemanticAlignmentEntry {
  id: string;
  code_element_id: string;
  requirement_id: string;
  human_label: string;
  model_prediction: string;
  confidence: number;
  rubric_version: string;  // REQUIRED: e.g., "RUBRIC-2025-001"
}

function checkGSemantic(): GateResult {
  const alignments = getSemanticAlignments();
  
  // V20.6.1: Verify rubric version present and consistent
  const rubricVersions = new Set(alignments.map(a => a.rubric_version));
  
  if (rubricVersions.size === 0 || alignments.some(a => !a.rubric_version)) {
    return {
      gate: 'G-SEMANTIC',
      pass: false,
      reason: 'Missing rubric_version in alignment entries'
    };
  }
  
  if (rubricVersions.size > 1) {
    return {
      gate: 'G-SEMANTIC',
      pass: false,
      reason: `Inconsistent rubric versions: ${[...rubricVersions].join(', ')}`
    };
  }
  
  // Original accuracy check
  const correct = alignments.filter(a => 
    a.human_label === a.model_prediction
  );
  const accuracy = correct.length / alignments.length;
  
  return {
    gate: 'G-SEMANTIC',
    pass: accuracy >= 0.80,
    value: accuracy,
    threshold: 0.80,
    rubric_version: [...rubricVersions][0]
  };
}
```

**Rubric Update Protocol:**
- Rubric changes require explicit version bump (e.g., RUBRIC-2025-001 → RUBRIC-2025-002)
- Rubric updates require HGR-3 human gate approval
- Prior alignments remain valid under their recorded rubric version

---

### G-CONFIDENCE: Calibration

**Purpose:** Confidence scores are well-calibrated.
**Track:** C+

```typescript
function checkGConfidence(): GateResult {
  const predictions = getPredictionsWithConfidence();
  const bins = binByConfidence(predictions, 10);
  
  for (const bin of bins) {
    const expectedAccuracy = bin.avgConfidence;
    const actualAccuracy = bin.correctCount / bin.totalCount;
    const calibrationError = Math.abs(expectedAccuracy - actualAccuracy);
    
    if (calibrationError > 0.1) {
      return { gate: 'G-CONFIDENCE', pass: false,
               message: `Bin ${bin.range}: error ${calibrationError}` };
    }
  }
  return { gate: 'G-CONFIDENCE', pass: true };
}
```

---

### G-ALIGNMENT: Code-Requirement Alignment (V20.6.1)

**Purpose:** Code elements verified to align with requirements.
**Track:** C+
**Threshold:** ≥80%

#### Rubric Version Requirement

Like G-SEMANTIC, G-ALIGNMENT evaluations MUST reference a frozen, versioned semantic rubric. This ensures consistent interpretation of "alignment" across evaluations.

```typescript
interface AlignmentVerification {
  code_element_id: string;
  requirement_id: string;
  alignment_score: number;
  verification_method: 'manual' | 'ml' | 'hybrid';
  rubric_version: string;  // REQUIRED: e.g., "RUBRIC-2025-001"
}

function checkGAlignment(): GateResult {
  const verifications = getAlignmentVerifications();
  
  // V20.6.1: Verify rubric version present and consistent
  const rubricVersions = new Set(verifications.map(v => v.rubric_version));
  
  if (rubricVersions.size === 0 || verifications.some(v => !v.rubric_version)) {
    return {
      gate: 'G-ALIGNMENT',
      pass: false,
      reason: 'Missing rubric_version in alignment verifications'
    };
  }
  
  if (rubricVersions.size > 1) {
    return {
      gate: 'G-ALIGNMENT',
      pass: false,
      reason: `Inconsistent rubric versions: ${[...rubricVersions].join(', ')}`
    };
  }
  
  // Calculate alignment agreement score
  const aligned = verifications.filter(v => v.alignment_score >= 0.80);
  const accuracy = aligned.length / verifications.length;
  
  return {
    gate: 'G-ALIGNMENT',
    pass: accuracy >= 0.80,
    value: accuracy,
    threshold: 0.80,
    rubric_version: [...rubricVersions][0]
  };
}
```

---

## 11.6 Policy Gate Specifications

### G-POLICY: Policy Compliance

**Purpose:** All 38 policy rules enforced.
**Track:** D+

```typescript
function checkGPolicy(): GateResult {
  const rules = getPolicyRules(); // 38 rules
  const violations = [];
  
  for (const rule of rules) {
    const result = evaluateRule(rule);
    if (!result.compliant) {
      violations.push({ rule: rule.id, ...result });
    }
  }
  
  return {
    gate: 'G-POLICY',
    pass: violations.length === 0,
    violations,
    rulesEvaluated: rules.length
  };
}
```

---

### G-AUTONOMY: Autonomy Bounds

**Purpose:** Actions stay within autonomy level.
**Track:** D+

```typescript
function checkGAutonomy(): GateResult {
  const events = getAutonomyEvents();
  const violations = events.filter(e => 
    e.autonomy_level_actual > e.autonomy_level_allowed
  );
  
  return {
    gate: 'G-AUTONOMY',
    pass: violations.length === 0,
    violations
  };
}
```

---

### G-SIMULATION: Temporal Resilience [V20.1]

**Purpose:** Validate system behavior over 1000+ simulation cycles.
**Track:** D+
**Threshold:** 1000 cycles, <1% drift, 0 policy violations

```typescript
function checkGSimulation(): GateResult {
  const runs = getEntities('SimulationRun').filter(r => r.status === 'completed');
  const totalCycles = runs.reduce((sum, r) => sum + r.cycles_completed, 0);
  const maxDrift = Math.max(...runs.map(r => r.drift_metrics.total_drift));
  const policyViolations = runs.reduce((sum, r) => sum + r.policy_violations.length, 0);
  const minAlignment = Math.min(...runs.flatMap(r => r.semantic_alignment_trajectory));
  
  return {
    gate: 'G-SIMULATION',
    pass: totalCycles >= 1000 && maxDrift < 0.01 && policyViolations === 0 && minAlignment >= 0.75,
    metrics: {
      cycles: totalCycles,
      max_drift: maxDrift,
      policy_violations: policyViolations,
      min_alignment: minAlignment
    },
    thresholds: {
      cycles: 1000,
      max_drift: 0.01,
      policy_violations: 0,
      min_alignment: 0.75
    }
  };
}
```

**Validation Rules:**
- RULE-G-SIM-001: cycles_completed ≥ 1000 (ERROR if <1000)
- RULE-G-SIM-002: total_drift < 0.01 (ERROR if ≥0.01)
- RULE-G-SIM-003: policy_violations = 0 (ERROR if >0)
- RULE-G-SIM-004: min semantic_alignment ≥ 0.75 (ERROR if <0.75)

---

### G-COGNITIVE: Cognitive Engine Health [V20.1]

**Purpose:** Verify LLM connectivity, latency, and resource availability.
**Track:** A+ (activated from Track A)
**Threshold:** All health checks pass

```typescript
function checkGCognitive(): GateResult {
  const health = getCognitiveEngineHealth();
  
  return {
    gate: 'G-COGNITIVE',
    pass: health.llm_connected && 
          health.latency_p99_ms < 5000 && 
          health.token_budget_remaining > 1000 &&
          health.fallback_available,
    metrics: {
      llm_connected: health.llm_connected,
      latency_p99_ms: health.latency_p99_ms,
      token_budget_remaining: health.token_budget_remaining,
      fallback_available: health.fallback_available
    },
    thresholds: {
      llm_connected: true,
      latency_p99_ms: 5000,
      token_budget_remaining: 1000,
      fallback_available: true
    }
  };
}
```

**Validation Rules:**
- RULE-G-COG-001: LLM must be connected (ERROR if disconnected)
- RULE-G-COG-002: P99 latency < 5s (ERROR if ≥5s)
- RULE-G-COG-003: Token budget > 1000 remaining (WARNING if exhausted)
- RULE-G-COG-004: Fallback must be available (ERROR if not)

---

### G-OPS: Operations Integration [V20.1]

**Purpose:** Verify operations entities are correctly integrated.
**Track:** D+
**Threshold:** All E91-E97 and R104-R112 present with bidirectional traversal

```typescript
function checkGOps(): GateResult {
  const opsEntities = ['E91', 'E92', 'E93', 'E94', 'E95', 'E96', 'E97'];
  const opsRelationships = ['R104', 'R105', 'R106', 'R107', 'R108', 'R109', 'R110', 'R111', 'R112'];
  
  const entitiesPresent = opsEntities.every(id => 
    getEntities(id.substring(1)).length > 0
  );
  
  const relationshipsPresent = opsRelationships.every(id =>
    getRelationships(id).length > 0
  );
  
  // Check bidirectional traversal with E24 (Environment) and E53 (Incident)
  const e24Linked = getRelationships('R104').some(r => r.to.startsWith('ENVMT-'));
  const e53Linked = getRelationships('R106').some(r => r.from.startsWith('INC-'));
  
  return {
    gate: 'G-OPS',
    pass: entitiesPresent && relationshipsPresent && e24Linked && e53Linked,
    metrics: {
      entities_present: entitiesPresent,
      relationships_present: relationshipsPresent,
      e24_linked: e24Linked,
      e53_linked: e53Linked
    }
  };
}
```

**Validation Rules:**
- RULE-G-OPS-001: All E91-E97 entities must exist (ERROR if missing)
- RULE-G-OPS-002: All R104-R112 relationships must exist (ERROR if missing)
- RULE-G-OPS-003: R104 must link to E24 Environment (ERROR if not)
- RULE-G-OPS-004: R106 must link from E53 Incident (ERROR if not)

---

# PART XII: LINKAGE VERIFICATION

## 12.1 Vertical Traceability Chain

```
Epic
  │
  ├─[R01: HAS_STORY]─→ Story
  │                      │
  │                      ├─[R02: HAS_AC]─→ AcceptanceCriterion
  │                      │                        │
  │                      │                        ├─[R19: SATISFIES]←─ Function/Class
  │                      │                        │
  │                      │                        └─[R37: VERIFIED_BY]─→ TestCase
  │                      │
  │                      └─[R18: IMPLEMENTS]←─ SourceFile
  │                                              │
  │                                              └─[R36: TESTED_BY]─→ TestSuite
  │                                                                      │
  │                                                                      └─[R07: CONTAINS_CASE]─→ TestCase
```

## 12.2 Linkage Tests

### LINK-001: Epic→Story→AC Complete

**Purpose:** Every Epic has Stories, every Story has ACs.

```typescript
function verifyLINK001(): LinkResult {
  const epics = getEntities('Epic');
  const incomplete = [];
  
  for (const epic of epics) {
    const stories = getRelationships('HAS_STORY')
      .filter(r => r.from === epic.id);
    
    if (stories.length === 0) {
      incomplete.push({ epic: epic.id, issue: 'no stories' });
      continue;
    }
    
    for (const story of stories) {
      const acs = getRelationships('HAS_AC')
        .filter(r => r.from === story.to);
      
      if (acs.length === 0) {
        incomplete.push({ story: story.to, issue: 'no ACs' });
      }
    }
  }
  
  return { pass: incomplete.length === 0, incomplete };
}
```

---

### LINK-002: Story→SourceFile→Function Complete

**Purpose:** Every Story has implementing SourceFile with Functions.

---

### LINK-003: AC→Function→Test Complete

**Purpose:** Every AC has satisfying Function with verifying TestCase.

---

### LINK-004: No Broken References

**Purpose:** All relationship endpoints exist.

```typescript
function verifyLINK004(): LinkResult {
  const relationships = getAllRelationships();
  const broken = [];
  
  for (const rel of relationships) {
    if (!entityExists(rel.from)) {
      broken.push({ rel: rel.id, issue: `from not found: ${rel.from}` });
    }
    if (!entityExists(rel.to)) {
      broken.push({ rel: rel.id, issue: `to not found: ${rel.to}` });
    }
  }
  
  return { pass: broken.length === 0, broken };
}
```

---

### LINK-005: No Orphan Entities

**Purpose:** All entities participate in at least one relationship.

---

### LINK-006: Shadow Ledger Matches Graph

**Purpose:** 100% correspondence between ledger entries and graph state.

---

## 12.3 Mapping Validator Rules

| Rule | Description | Severity |
|------|-------------|----------|
| RULE-MAP-001 | Every REQ maps to ≥1 Story | ERROR |
| RULE-MAP-002 | Every Story maps to ≥1 AC | ERROR |
| RULE-MAP-003 | Every AC maps to ≥1 Entity (via SATISFIES) | ERROR |
| RULE-MAP-004 | Every AC maps to ≥1 Test (via VERIFIED_BY) | ERROR |
| RULE-MAP-005 | Every Story maps to ≥1 SourceFile (via IMPLEMENTS) | ERROR |
| RULE-MAP-006 | No unmapped requirements | WARNING |
| RULE-MAP-007 | No unmapped ACs | WARNING |

---

# PART XIII: HUMAN GATE SPECIFICATIONS

## 13.1 HGR-1: Track A Human Gate

### Purpose

Verify Track A is complete before first ingestion.

### Prerequisites

```
[ ] All Track A exit criteria met
[ ] Sanity suite passes (SANITY-001 through SANITY-042)
[ ] Synthetic corpus verified
```

### Review Checklist

```
ENTITIES (16):
[ ] E01 Epic extraction verified
[ ] E02 Story extraction verified
[ ] E03 AcceptanceCriterion extraction verified
[ ] E04 Constraint extraction verified
[ ] E06-E08 Design entities verified
[ ] E11-E15 Implementation entities verified
[ ] E27-E29 Verification entities verified
[ ] E49-E52 Provenance entities verified

RELATIONSHIPS (21):
[ ] R01-R07 Hierarchical/Containment verified
[ ] R14, R16 Design→Impl verified
[ ] R18, R19 Req→Impl verified
[ ] R21-R26 Impl→Impl verified
[ ] R36, R37 Req→Test verified
[ ] R63, R67, R70 Provenance verified

GATES (5):
[ ] G01 Story→Code: Pass (100%)
[ ] G03 Code→Story: Pass (0 orphans)
[ ] G04 Story→Test: Pass (100%)
[ ] G06 Test→AC: Pass (0 orphans)
[ ] G-API: Pass

PILLARS:
[ ] Shadow ledger initialized and logging
[ ] ≥50 semantic signals captured
[ ] Graph API v1 operational
[ ] No G-API violations detected

EVIDENCE REQUIRED:
[ ] Extraction report (entity counts match expected)
[ ] Gate status report (all 5 green)
[ ] Shadow ledger sample (≥10 entries reviewed)
[ ] Semantic signal sample (≥10 signals reviewed)
```

### Approval Form

```
╔══════════════════════════════════════════════════════════════════╗
║                   HUMAN GATE RECORD: HGR-1                       ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  Track Completed: A                                              ║
║  Ingestion Number: 1 (pending)                                   ║
║                                                                  ║
║  Verification Summary:                                           ║
║  - Entities extracted: _____ / 16 types                          ║
║  - Relationships extracted: _____ / 21 types                     ║
║  - Gates passing: _____ / 5                                      ║
║  - Semantic signals: _____ (min 50)                              ║
║                                                                  ║
║  Decision: [ ] APPROVE  [ ] REJECT  [ ] DEFER                    ║
║                                                                  ║
║  If REJECT/DEFER, reason:                                        ║
║  ____________________________________________________________    ║
║                                                                  ║
║  Approver Name: _______________________________________          ║
║  Approver Role: _______________________________________          ║
║  Date: _______________________________________                   ║
║  Signature: _______________________________________              ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## 13.2 HGR-2: Track B Human Gate ⭐ CRITICAL

### Purpose

Verify Track B is complete and approve **oracle transition**.

> **⚠️ WARNING: This is the most critical human gate in the entire architecture.**
> 
> After HGR-2 approval:
> - Bootstrap scripts are **RETIRED PERMANENTLY**
> - External oracle is **RETIRED PERMANENTLY**
> - Gnosis becomes the **SOLE ORACLE**
> - This transition is **IRREVERSIBLE**

### Prerequisites

```
[ ] All Track B exit criteria met
[ ] HGR-1 signed and archived
[ ] Ingestion #1 complete
[ ] Shadow ledger 100% match verified
```

### Review Checklist

```
CAPABILITIES:
[ ] Ground truth engine operational (G-HEALTH passing)
[ ] BRD registry queryable (64 epics, 347 stories, 2,873 ACs)
[ ] Drift detection working (G-DRIFT = 0)
[ ] Closure check passing (G-CLOSURE = identical)

SHADOW LEDGER MIGRATION:
[ ] External ledger loaded (_____ entries)
[ ] Graph entities counted (_____ entities)
[ ] Forward verification complete (ledger → graph)
[ ] Backward verification complete (graph → ledger)
[ ] Match score computed: _____% (must be 100%)
[ ] Mismatch investigation complete (if any)
[ ] Migration script tested in staging
[ ] Rollback plan documented and tested

GATES (9):
[ ] All 5 Track A gates still pass
[ ] G-HEALTH: Pass
[ ] G-REGISTRY: Pass (65/351/2849)
[ ] G-DRIFT: 0 changes
[ ] G-CLOSURE: Identical

SEMANTIC:
[ ] ≥100 signals captured
[ ] Corpus exported successfully
[ ] Corpus format valid

EVIDENCE REQUIRED:
[ ] Shadow ledger migration report
[ ] Gate status report (all 9 green)
[ ] Drift report (must be empty)
[ ] Closure verification log
[ ] Rollback procedure document
```

### Oracle Transition Acknowledgment

```
╔══════════════════════════════════════════════════════════════════╗
║              ORACLE TRANSITION AGREEMENT (OTA-001)               ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  I, the undersigned, have thoroughly reviewed the Track B        ║
║  verification results and understand the implications of         ║
║  approving this oracle transition.                               ║
║                                                                  ║
║  I HEREBY CERTIFY THAT:                                          ║
║                                                                  ║
║  [ ] 1. Shadow ledger matches Gnosis graph with 100% accuracy    ║
║                                                                  ║
║  [ ] 2. All Track A gates (G01-G06, G-API) still pass            ║
║                                                                  ║
║  [ ] 3. All Track B gates (G-HEALTH, G-REGISTRY, G-DRIFT,        ║
║         G-CLOSURE) pass                                          ║
║                                                                  ║
║  [ ] 4. Closure check succeeds: re-ingestion produces            ║
║         identical graph                                          ║
║                                                                  ║
║  [ ] 5. Drift check succeeds: zero unexpected changes            ║
║                                                                  ║
║  I UNDERSTAND AND ACCEPT THAT:                                   ║
║                                                                  ║
║  [ ] 6. Upon approval, Gnosis becomes the SOLE ORACLE            ║
║                                                                  ║
║  [ ] 7. Bootstrap scripts (~530 lines) will be RETIRED           ║
║         and archived                                             ║
║                                                                  ║
║  [ ] 8. External verification tools will be RETIRED              ║
║                                                                  ║
║  [ ] 9. This transition is IRREVERSIBLE                          ║
║                                                                  ║
║  [ ] 10. All future verification depends on Gnosis               ║
║          self-verification capabilities                          ║
║                                                                  ║
║  ────────────────────────────────────────────────────────────    ║
║                                                                  ║
║  Approver Name: _______________________________________          ║
║  Approver Role: _______________________________________          ║
║  Date: _______________________________________                   ║
║                                                                  ║
║  SIGNATURE: _______________________________________              ║
║                                                                  ║
║  Witness Name: _______________________________________           ║
║  Witness Role: _______________________________________           ║
║  Witness Signature: _______________________________________      ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

### Approval Form

```
╔══════════════════════════════════════════════════════════════════╗
║                   HUMAN GATE RECORD: HGR-2                       ║
║                        ⭐ CRITICAL ⭐                              ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  Track Completed: B                                              ║
║  Ingestion Number: 2 (pending)                                   ║
║                                                                  ║
║  ORACLE TRANSITION: [ ] APPROVED (OTA-001 signed)                ║
║                                                                  ║
║  Verification Summary:                                           ║
║  - Shadow ledger match: _____% (must be 100%)                    ║
║  - Gates passing: _____ / 9                                      ║
║  - Drift changes: _____ (must be 0)                              ║
║  - Closure status: [ ] Identical [ ] Different                   ║
║  - Semantic signals: _____ (min 100)                             ║
║                                                                  ║
║  Decision: [ ] APPROVE  [ ] REJECT  [ ] DEFER                    ║
║                                                                  ║
║  If REJECT/DEFER, reason:                                        ║
║  ____________________________________________________________    ║
║                                                                  ║
║  Approver Name: _______________________________________          ║
║  Approver Role: _______________________________________          ║
║  Date: _______________________________________                   ║
║  Signature: _______________________________________              ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## 13.3 HGR-3: Track C Human Gate

### Purpose

Verify Track C is complete (semantic understanding operational).

### Review Checklist

```
SEMANTIC ALIGNMENT:
[ ] Model trained on A/B corpus
[ ] ≥80% agreement on validation set
[ ] ≥80% agreement on test set
[ ] Alignment levels documented (ALIGNED/PARTIAL/MISALIGNED)
[ ] Confidence propagation working

EXTENSION:
[ ] EP-C-001 approved and executed
[ ] E61-E63 entities added (SemanticConcept, BehaviorModel, SemanticAssertion)
[ ] Semantic relationships added (R90+)
[ ] G-COMPATIBILITY passed
[ ] G-CLOSURE still passes

GATES (13):
[ ] All 9 Track B gates still pass
[ ] G-COMPATIBILITY: Pass
[ ] G-SEMANTIC: ≥80%
[ ] G-ALIGNMENT: ≥80%
[ ] G-CONFIDENCE: Pass
```

---

## 13.4 HGR-4: Track D Human Gate

### Purpose

Verify Track D is complete (policy and autonomy operational).

### Review Checklist

```
POLICY:
[ ] 38 policy rules implemented
[ ] Policy evaluation engine operational
[ ] Policy decisions logged
[ ] All priorities enforced (SAFETY > ETHICS > ARCHITECTURE > GOVERNANCE > QUALITY)

AUTONOMY:
[ ] Levels L0-L5 defined and enforced
[ ] Escalation workflow functional
[ ] Human-in-loop working
[ ] E80-E83 entities operational

EXTENSION:
[ ] EP-D-001 approved and executed
[ ] E71-E83 entities added
[ ] Full graph: 67 entities, 100 relationships
[ ] G-COMPATIBILITY passed

GATES (17):
[ ] All 13 Track C gates still pass
[ ] G-POLICY: Pass
[ ] G-AUTONOMY: Pass
[ ] G-COMPLIANCE: Pass
[ ] G-AUDIT: Pass
```

---

## 13.5 HGR-5+: Sophia Ongoing Oversight

### Purpose

Continuous human oversight of autonomous operation.

### Weekly Review Checklist

```
[ ] Review self-modification log (count: _____)
[ ] Check for anomalies
[ ] Verify all 20 gates still passing
[ ] Review escalation requests (count: _____)
[ ] Verify no policy violations
[ ] Check drift = 0
[ ] Confirm closure maintained
```

### Per-Extension Approval

```
[ ] Extension proposal reviewed (EP-S-___)
[ ] Risk assessment reviewed
[ ] Safe plan verified (E82)
[ ] G-COMPATIBILITY pre-verified
[ ] Human sign-off obtained
[ ] Post-migration gates verified
```

### Quarterly Audit

```
[ ] Full audit of policy compliance
[ ] Review escalation patterns
[ ] Verify human-in-loop effectiveness
[ ] Assess autonomy level appropriateness
[ ] Review all E80 AutonomyEvents
[ ] Verify all E83 HumanEscalations resolved
```

### Emergency Procedures

```
PAUSE: Human can pause autonomous operation at any time
  - Command: sophia.pause()
  - Effect: All autonomous actions blocked
  - Resume: Requires HGR-5 approval

ROLLBACK: Human can roll back changes
  - Command: sophia.rollback(checkpoint_id)
  - Effect: Revert to previous state
  - Verification: All gates re-checked

REVOKE: Human can revoke autonomy level
  - Command: sophia.setAutonomyLevel(L0)
  - Effect: Read-only mode
  - Restore: Requires full HGR-4 re-approval
```

---

# PART XIV: CROSS-REFERENCE MATRICES

## 14.1 Track × Gate Activation Matrix

| Gate | A | B | C | D | S |
|------|:-:|:-:|:-:|:-:|:-:|
| G01 Story→Code | ✅ | ✅ | ✅ | ✅ | ✅ |
| G03 Code→Story | ✅ | ✅ | ✅ | ✅ | ✅ |
| G04 Story→Test | ✅ | ✅ | ✅ | ✅ | ✅ |
| G06 Test→AC | ✅ | ✅ | ✅ | ✅ | ✅ |
| G-API | ✅ | ✅ | ✅ | ✅ | ✅ |
| G-HEALTH | | ✅ | ✅ | ✅ | ✅ |
| G-REGISTRY | | ✅ | ✅ | ✅ | ✅ |
| G-DRIFT | | ✅ | ✅ | ✅ | ✅ |
| G-CLOSURE | | ✅ | ✅ | ✅ | ✅ |
| G-COMPATIBILITY | | | ✅ | ✅ | ✅ |
| G-SEMANTIC | | | ✅ | ✅ | ✅ |
| G-ALIGNMENT | | | ✅ | ✅ | ✅ |
| G-CONFIDENCE | | | ✅ | ✅ | ✅ |
| G-POLICY | | | | ✅ | ✅ |
| G-AUTONOMY | | | | ✅ | ✅ |
| G-COMPLIANCE | | | | ✅ | ✅ |
| G-AUDIT | | | | ✅ | ✅ |
| **Total** | **5** | **9** | **13** | **17** | **17** |

**Note:** G02 (AC→Code) and G05 (AC→Test) available via Extension Protocol EP-A-001.

## 14.2 Track × Entity Count Matrix

| Track | Introduced | Cumulative | Key Entities |
|-------|------------|------------|--------------|
| A | 16 | 16 | E01-E04, E11-E15, E27-E29, E49-E52 |
| B | 0 | 16 | (capabilities only) |
| C | 6 | 22 | E61-E63 (Semantic) |
| D | 38 | 60 | E57-E60 (Legal/A11y/UX), E71-E73, E80-E83 |

## 14.3 Track × Relationship Count Matrix

| Track | Introduced | Cumulative | Key Relationships |
|-------|------------|------------|-------------------|
| A | 21 | 21 | R01-R07, R14-R26, R36-R37, R63-R70 |
| B | 0 | 21 | (capabilities only) |
| C | ~15 | ~36 | R100+ (Semantic) |
| D | ~55 | 91 | R83-R91 (Legal/A11y/UX), R92+ (Compliance), Policy, Autonomy |

## 14.4 Safety Contract → Gate Mapping

| Safety Contract Clause | Gate(s) | Verification |
|------------------------|---------|--------------|
| All code traceable to requirements | G01, G03 | Story coverage |
| All requirements tested | G04, G06 | Story/AC test coverage |
| No unauthorized database access | G-API | Import analysis |
| System integrity verifiable | G-HEALTH | Manifest verification |
| Requirements queryable | G-REGISTRY | BRD count check |
| No unexpected state changes | G-DRIFT | State comparison |
| Deterministic behavior | G-CLOSURE | Re-ingestion check |
| Prior functionality preserved | G-COMPATIBILITY | Regression tests |
| Code semantically correct | G-SEMANTIC, G-ALIGNMENT | ML verification |
| Confidence calibrated | G-CONFIDENCE | Calibration check |
| Policy compliance | G-POLICY | Rule evaluation |
| Autonomy bounded | G-AUTONOMY | Level enforcement |
| Compliance recorded | G-COMPLIANCE | Record completeness |

## 14.5 Entity × Track Matrix

| Entity | Layer | Track Introduced |
|--------|-------|------------------|
| E01 Epic | Requirements | A |
| E02 Story | Requirements | A |
| E03 AcceptanceCriterion | Requirements | A |
| E04 Constraint | Requirements | A |
| E06 TechnicalDesign | Design | A |
| E08 DataSchema | Design | A |
| E11 SourceFile | Implementation | A |
| E12 Function | Implementation | A |
| E13 Class | Implementation | A |
| E15 Module | Implementation | A |
| E27 TestFile | Verification | A |
| E28 TestSuite | Verification | A |
| E29 TestCase | Verification | A |
| E49 ReleaseVersion | Provenance | A |
| E50 Commit | Provenance | A |
| E52 ChangeSet | Provenance | A |
| E57 LegalRestriction | Legal | D |
| E58 AccessibilityRequirement | Accessibility | D |
| E59 UXGuideline | UX | D |
| E60 DesignSystem | UX | D |
| E61 SemanticConcept | Semantic | C |
| E62 BehaviorModel | Semantic | C |
| E63 SemanticAssertion | Semantic | C |
| E71 PolicyRule | Policy | D |
| E72 ConstraintViolation | Policy | D |
| E73 DecisionRecord | Policy | D |
| E80 AutonomyEvent | Autonomy | D |
| E81 ProposedModification | Autonomy | D |
| E82 SafePlan | Autonomy | D |
| E83 HumanEscalation | Autonomy | D |

---

# PART XV: SYNTHETIC CORPUS SPECIFICATION

## 15.1 Corpus Purpose

The synthetic corpus provides a controlled environment for testing extraction and verification with known ground truth.

## 15.2 Corpus Structure

```
synthetic-corpus/
├── BRD.md                    # 2 epics, 5 stories, 15 ACs
├── src/
│   ├── module-a/
│   │   ├── index.ts          # @implements markers
│   │   ├── entity.ts         # @satisfies markers
│   │   └── utils.ts
│   └── module-b/
│       ├── index.ts
│       └── service.ts        # extends module-a
├── test/
│   ├── module-a/
│   │   └── entity.test.ts    # describe/it patterns
│   └── module-b/
│       └── service.test.ts
├── package.json
└── .git/                     # 10 commits, 2 tags
```

## 15.3 Expected Extraction Results

| Entity Type | Count |
|-------------|-------|
| Epic | 2 |
| Story | 5 |
| AcceptanceCriterion | 15 |
| Module | 2 |
| SourceFile | 5 |
| Function | 8 |
| Class | 3 |
| TestFile | 2 |
| TestSuite | 5 |
| TestCase | 15 |
| Commit | 10 |
| ReleaseVersion | 2 |

## 15.4 Expected Relationships

| Relationship | Count |
|--------------|-------|
| HAS_STORY | 5 |
| HAS_AC | 15 |
| IMPLEMENTS | 5 |
| SATISFIES | 15 |
| TESTED_BY | 5 |
| VERIFIED_BY | 15 |
| IMPORTS | 3 |
| EXTENDS | 1 |
| MODIFIED_IN | 15 |
| INTRODUCED_IN | 5 |

## 15.5 Expected Shadow Ledger

```
# Expected ledger entries
entity-link entries: 57 (all entities)
relationship-link entries: 79 (all relationships)
requirement-link entries: 20 (BRD mappings)
Total entries: 156
```

---

# PART XVI: GAP ANALYSIS & SPEC FILE INVENTORY

## 16.1 Spec File Inventory (~51 files)

| Directory | Files | Status |
|-----------|-------|--------|
| spec/00_pre_track_validation/ | OVERVIEW.md, SANITY_SUITE.md, SYNTHETIC_CORPUS.md | To Generate |
| spec/track_a/ | OVERVIEW.md, ENTRY.md, EXIT.md, HUMAN_GATE_HGR1.md | To Generate |
| spec/track_a/stories/ | A1-A5 story cards | To Generate |
| spec/track_b/ | OVERVIEW.md, ENTRY.md, EXIT.md, HUMAN_GATE_HGR2.md | To Generate |
| spec/track_b/stories/ | B1-B7 story cards | To Generate |
| spec/track_c/ | OVERVIEW.md, ENTRY.md, EXIT.md, HUMAN_GATE_HGR3.md | To Generate |
| spec/track_c/stories/ | C1-C5 story cards | To Generate |
| spec/track_d/ | OVERVIEW.md, ENTRY.md, EXIT.md, HUMAN_GATE_HGR4.md | To Generate |
| spec/track_d/stories/ | D1-D4 story cards | To Generate |
| spec/sophia_v1/ | OVERVIEW.md, CONTINUOUS_EVOLUTION.md | To Generate |

## 16.2 Verification Coverage Status

| Component | Specified | Verification | Tests |
|-----------|:---------:|:------------:|:-----:|
| Track A Entities (16) | ✅ | ✅ | ✅ |
| Track A Relationships (21) | ✅ | ✅ | ✅ |
| Track A Gates (7) | ✅ | ✅ | ✅ |
| Track B Gates (4) | ✅ | ✅ | ✅ |
| Track C Entities (E61-E63) | ✅ | ✅ | ✅ |
| Track C Relationships | ⚠️ | ⚠️ | ⚠️ |
| Track C Gates (5) | ✅ | ✅ | ✅ |
| Track D Entities (E71-E83) | ✅ | ✅ | ⚠️ |
| Track D Relationships | ⚠️ | ⚠️ | ⚠️ |
| Track D Gates (3) | ✅ | ✅ | ✅ |
| SANITY Tests (42) | ✅ | ✅ | ✅ |
| Human Gates (5) | ✅ | ✅ | N/A |
| Ledger Schemas (5) | ✅ | ✅ | ✅ |

Legend: ✅ Complete | ⚠️ Outlined (needs expansion)

## 16.3 Generation Priority

1. **Immediate (Before Track A):**
   - Pre-track validation specs
   - Track A story cards
   - Synthetic corpus files

2. **Before Track B:**
   - Track B story cards
   - HGR-2 complete specification

3. **Before Track C:**
   - EP-C-001 proposal
   - Track C entity/relationship full specs
   - Track C story cards

4. **Before Track D:**
   - EP-D-001 proposal
   - Track D entity/relationship full specs
   - Track D story cards

---

# PART XVII: MARKER GOVERNANCE

**Version:** 1.0.0 (Added V20.6.5)

This part establishes rules for traceability markers in source code and the relationship between organ docs and track docs.

## 17.1 The Organ Truth Invariant

> **Organ docs define truth. Track docs demonstrate compliance with truth.**

| Document Type | Role | May Define |
|---------------|------|------------|
| BRD | Requirements truth | AC-*, STORY-* |
| Verification Spec | Correctness truth | E*, R*, VERIFY-*, SANITY-* |
| UTG Schema | Schema truth | Entity/Relationship structure |
| Roadmap | Process truth | Gates, Tracks, Pillars |
| Track Docs | Execution | Nothing canonical - only references |

## 17.2 Canonical Identifier Namespaces

| Namespace | Meaning | Defined In | Example |
|-----------|---------|------------|---------|
| `AC-X.Y.Z` | Acceptance Criterion | BRD | AC-64.1.3 |
| `STORY-X.Y` | Story | BRD | STORY-64.1 |
| `E##` | Entity Type | Verification Spec | E15 |
| `R##` | Relationship Type | Verification Spec | R04 |
| `G-*` | Gate | Roadmap | G-COVERAGE |
| `SANITY-###` | Sanity Test | Verification Spec | SANITY-046 |
| `VERIFY-*` | Verification Test | Verification Spec | VERIFY-E15 |

**Rule:** Only organ docs may define identifiers in these namespaces.

## 17.3 Allowed Marker Patterns

| Marker | Usage | Resolves To |
|--------|-------|-------------|
| `@implements STORY-X.Y` | File implements story | E02 entity in DB |
| `@satisfies AC-X.Y.Z` | Function satisfies AC | E03 entity in DB |
| `@implements E##` | Code implements entity extraction | Verification Spec |
| `@implements R##` | Code implements relationship extraction | Verification Spec |
| `@implements SANITY-###` | Test implements sanity check | SANITY suite |

## 17.4 Forbidden Patterns

| Pattern | Why Forbidden | Correct Alternative |
|---------|---------------|---------------------|
| `@satisfies AC-X.Y.Z` where AC not in BRD | Creates phantom truth | Remove marker |
| `@satisfies TAC-*` | Parallel namespace | Use Execution Obligations |
| `@implements AC-*` | ACs are satisfied, not implemented | `@satisfies AC-*` |
| Track-defined `AC-*` | Track docs can't define ACs | Reference BRD ACs only |

## 17.5 Track Doc Execution Obligations

Track docs should express implementation requirements as **Execution Obligations**, not acceptance criteria.

**Template:**

| Obligation | Organ Source | Verification |
|------------|--------------|--------------|
| [What must be done] | [Spec section] | [SANITY-NNN or VERIFY-X] |

## 17.6 Enforcement

| Check | Test | Severity |
|-------|------|----------|
| All `@satisfies AC-*` resolve to E03 | SANITY-053 | ERROR |
| All `@implements STORY-*` resolve to E02 | SANITY-054 | ERROR |
| No phantom ACs in Track docs | lint-markers.sh | WARNING |

## 17.7 Rationale

If Track docs could define canonical identifiers:
- Multiple sources of truth would exist
- Traceability would be unreliable
- Audits would be impossible
- Autonomous systems could invent requirements

The system must be intolerant of ontological violations.

## 17.8 Entity Semantic Rules

| Entity | Rule | Enforcement |
|--------|------|-------------|
| E15 Module | Directory-derived only; persistence rejects import-derived E15 | `validateE15Semantics()` guardrail |

**E15 Semantic Invariant:** E15 Module entities must have directory-based `instance_id` patterns (e.g., `MOD-src/utils`). Single-segment npm-style identifiers (e.g., `MOD-yaml`, `MOD-typescript`) are rejected at the persistence boundary.

This prevents semantic pollution from AST import extraction and ensures E15 entities always correspond to actual directory structure derived by `module-derivation-provider.ts`.

---

# APPENDIX A: BRD CANONICAL COUNTS

| Metric | Count | Source |
|--------|-------|--------|
| Total Epics | 64 | BRD V20.0 |
| Total Stories | 347 | BRD V20.0 |
| Total ACs | 2,873 | BRD V20.0 |
| Entity Types | 60 | Epic 64 V20.0 |
| Relationship Types | 91 | Epic 64 V20.0 |
| Coverage Gates | 17 | This spec (V20.0.0) |
| Policy Rules | 38 | Policy Rules V3.0 |
| Autonomy Levels | 6 (L0-L5) | Roadmap V20.0 |

---

# APPENDIX B: ENTITY ID REGISTRY (Complete)

## Track A Entities (16)

| ID | Name | Layer | ID Format |
|----|------|-------|-----------|
| E01 | Epic | Requirements | `EPIC-{N}` |
| E02 | Story | Requirements | `STORY-{E}.{S}` |
| E03 | AcceptanceCriterion | Requirements | `AC-{E}.{S}.{A}` |
| E04 | Constraint | Requirements | `CONSTRAINT-{cat}-{N}` |
| E06 | TechnicalDesign | Design | `DESIGN-{comp}-{N}` |
| E08 | DataSchema | Design | `SCHEMA-{name}` |
| E11 | SourceFile | Implementation | `file:{path}` |
| E12 | Function | Implementation | `function:{file}:{name}` |
| E13 | Class | Implementation | `class:{file}:{name}` |
| E15 | Module | Implementation | `module:{name}` |
| E27 | TestFile | Verification | `testfile:{path}` |
| E28 | TestSuite | Verification | `suite:{file}:{name}` |
| E29 | TestCase | Verification | `case:{suite}:{name}` |
| E49 | ReleaseVersion | Provenance | `version:{semver}` |
| E50 | Commit | Provenance | `commit:{sha}` |
| E52 | ChangeSet | Provenance | `changeset:{type}:{id}` |

## Track C Entities (3)

| ID | Name | Layer | ID Format |
|----|------|-------|-----------|
| E61 | SemanticConcept | Semantic | `concept:{domain}:{name}` |
| E62 | BehaviorModel | Semantic | `behavior:{comp}:{action}` |
| E63 | SemanticAssertion | Semantic | `assertion:{N}` |

## Track D Entities - Legal/Accessibility/UX (4)

| ID | Name | Layer | ID Format |
|----|------|-------|-----------|
| E57 | LegalRestriction | Legal | `RESTRICT-{type}-{id}` |
| E58 | AccessibilityRequirement | Accessibility | `A11Y-{standard}-{criterion}` |
| E59 | UXGuideline | UX | `UX-{category}-{id}` |
| E60 | DesignSystem | UX | `DSYS-{name}` |

## Track D Entities - Policy/Autonomy (7)

| ID | Name | Layer | ID Format |
|----|------|-------|-----------|
| E71 | PolicyRule | Policy | `policy:{cat}-{N}` |
| E72 | ConstraintViolation | Policy | `violation:{N}` |
| E73 | DecisionRecord | Policy | `decision:{N}` |
| E80 | AutonomyEvent | Autonomy | `autonomy-event:{N}` |
| E81 | ProposedModification | Autonomy | `proposal:{N}` |
| E82 | SafePlan | Autonomy | `safe-plan:{N}` |
| E83 | HumanEscalation | Autonomy | `escalation:{N}` |

## Track D Entities - Compliance (4) [EXTENSION]

| ID | Name | Layer | ID Format | Extension |
|----|------|-------|-----------|-----------|
| E64 | ComplianceRule | Compliance | `comprule:{cat}:{N}` | EP-D-001 |
| E65 | ComplianceEvidence | Compliance | `compevid:{rule}:{N}` | EP-D-001 |
| E66 | ComplianceViolation | Compliance | `compviol:{rule}:{N}` | EP-D-001 |
| E67 | ComplianceReport | Compliance | `comprept:{date}:{N}` | EP-D-001 |

---

# APPENDIX C: RELATIONSHIP ID REGISTRY (Complete)

## Track A Relationships (21)

| ID | Name | From → To |
|----|------|-----------|
| R01 | HAS_STORY | Epic → Story |
| R02 | HAS_AC | Story → AC |
| R03 | HAS_CONSTRAINT | Story → Constraint |
| R04 | CONTAINS_FILE | Module → SourceFile |
| R05 | CONTAINS_ENTITY | SourceFile → Function/Class |
| R06 | CONTAINS_SUITE | TestFile → TestSuite |
| R07 | CONTAINS_CASE | TestSuite → TestCase |
| R14 | IMPLEMENTED_BY | TechnicalDesign → SourceFile |
| R16 | DEFINED_IN | DataSchema → SourceFile |
| R18 | IMPLEMENTS | SourceFile → Story |
| R19 | SATISFIES | Function/Class → AC |
| R21 | IMPORTS | SourceFile → SourceFile |
| R22 | CALLS | Function → Function |
| R23 | EXTENDS | Class → Class |
| R24 | IMPLEMENTS_INTERFACE | Class → Interface |
| R26 | DEPENDS_ON | Module → Module |
| R36 | TESTED_BY | Story → TestSuite |
| R37 | VERIFIED_BY | AC → TestCase |
| R63 | INTRODUCED_IN | Story → ReleaseVersion |
| R67 | MODIFIED_IN | SourceFile → Commit |
| R70 | GROUPS | ChangeSet → Commit |

## Track C Relationships - Semantic [EXTENSION]

| ID | Name | From → To | Extension |
|----|------|-----------|-----------|
| R100 | SEMANTIC_SUPPORTS | SemanticAssertion → Story/AC | EP-C-001 |
| R101 | SEMANTIC_CONTRADICTS | SemanticAssertion → SemanticAssertion | EP-C-001 |

## R83-R91 (Legal/Accessibility/UX - from Epic 64)

| ID | Name | From → To | Category |
|----|------|-----------|----------|
| R83 | CONFLICTS_WITH | License → License | Legal |
| R84 | HAS_RESTRICTION | License → LegalRestriction | Legal |
| R85 | REQUIRES_ATTRIBUTION | License → SourceFile | Legal |
| R86 | REQUIRES_A11Y | Story → AccessibilityRequirement | Accessibility |
| R87 | VIOLATES_A11Y | SourceFile → AccessibilityRequirement | Accessibility |
| R88 | VALIDATED_BY_A11Y | AccessibilityRequirement → TestCase | Accessibility |
| R89 | MUST_CONFORM_TO | Story → UXGuideline | UX |
| R90 | VIOLATES_UX | SourceFile → UXGuideline | UX |
| R91 | USES_DESIGN_SYSTEM | Module → DesignSystem | UX |

## Track D Relationships - Compliance [EXTENSION]

| ID | Name | From → To | Extension |
|----|------|-----------|-----------|
| R92 | ENFORCES | ComplianceRule → PolicyRule | EP-D-001 |
| R93 | EVIDENCED_BY | ComplianceRule → ComplianceEvidence | EP-D-001 |
| R94 | VIOLATED_BY | ComplianceRule → ComplianceViolation | EP-D-001 |
| R95 | REPORTED_IN | ComplianceEvidence → ComplianceReport | EP-D-001 |
| R96 | DOCUMENTS | ComplianceReport → Audit | EP-D-001 |
| R97 | REQUIRES | ComplianceRule → ApprovalRequest | EP-D-001 |
| R98 | APPROVES | Human → ApprovalRequest | EP-D-001 |
| R99 | POLICY_GOVERNED_BY | Entity → PolicyRule | EP-D-001 |

---

# APPENDIX D: GATE ID REGISTRY (20 Canonical Gates)

| ID | Name | Track | Threshold | Type |
|----|------|-------|-----------|------|
| G01 | Story→Code | A | 100% | percentage |
| G03 | Code→Story | A | 0 orphans | count |
| G04 | Story→Test | A | 100% | percentage |
| G06 | Test→AC | A | 0 orphans | count |
| G-API | API Boundary | A | pass | boolean |
| G-COGNITIVE | Cognitive Health | A | pass | boolean |
| G-HEALTH | System Health | B | pass | boolean |
| G-REGISTRY | BRD Registry | B | pass | boolean |
| G-DRIFT | Zero Drift | B | 0 changes | count |
| G-CLOSURE | Deterministic | B | identical | comparison |
| G-COMPATIBILITY | Prior Tests | C | 100% | percentage |
| G-SEMANTIC | Semantic | C | ≥80% | percentage |
| G-ALIGNMENT | Alignment | C | ≥80% | percentage |
| G-CONFIDENCE | Calibration | C | pass | boolean |
| G-POLICY | Policy | D | pass | boolean |
| G-AUTONOMY | Autonomy | D | pass | boolean |
| G-COMPLIANCE | Compliance | D | pass | boolean |
| G-AUDIT | Audit | D | pass | boolean |
| G-SIMULATION | Simulation | D | pass | boolean |
| G-OPS | Operations | D | pass | boolean |

**Note:** G02 (AC→Code) and G05 (AC→Test) available via Extension Protocol EP-A-001.

---

# APPENDIX E: SAFETY CONTRACT → GATE MAPPING

| Contract | Gate | Track | Enforcement |
|----------|------|-------|-------------|
| Code traces to requirements | G01, G03 | A+ | Marker analysis |
| Requirements tested | G04, G06 | A+ | Test coverage |
| No direct DB access | G-API | A+ | Import analysis |
| Cognitive engine health | G-COGNITIVE | A+ | Health check |
| System integrity | G-HEALTH | B+ | Manifest check |
| Requirements queryable | G-REGISTRY | B+ | Count verification |
| No unexpected changes | G-DRIFT | B+ | State diff |
| Deterministic behavior | G-CLOSURE | B+ | Re-ingestion |
| Prior tests pass | G-COMPATIBILITY | C+ | Regression |
| Semantic correctness | G-SEMANTIC, G-ALIGNMENT | C+ | ML model |
| Calibration | G-CONFIDENCE | C+ | Calibration analysis |
| Policy compliance | G-POLICY | D+ | Rule evaluation |
| Autonomy bounds | G-AUTONOMY | D+ | Level check |
| Compliance records | G-COMPLIANCE | D+ | Record audit |
| Temporal resilience | G-SIMULATION | D+ | Simulation harness |
| Operations integration | G-OPS | D+ | Entity verification |

---

# APPENDIX F: QUICK REFERENCE

## Track Summary

| Track | Days | Entities | Relationships | Gates | Oracle |
|-------|------|----------|---------------|-------|--------|
| A | 12-14 | 16 | 21 | 6 | External |
| B | 8-10 | 16 | 21 | 10 | **Gnosis** |
| C | 17-21 | ~36 | ~56 | 15 | Gnosis + Semantic |
| D | 27-34 | 83 | 114 | 21 | Full |
| S | 12-15+ | 83 | 114 | 21 | Sophia |

*Note: Track D and Sophia counts (83/114/21) include dormant EP-D-002 entities (E84-E85, R113-R114, G-RUNTIME) which are declared in schema but not activated until Story D.9.*

## Human Gate Summary

| Gate | Before | Critical | Key Requirement |
|------|--------|----------|-----------------|
| HGR-1 | Ingestion #1 | High | 6 gates pass |
| **HGR-2** | **Ingestion #2** | **⭐ CRITICAL** | **Oracle transition** |
| HGR-3 | Ingestion #3 | High | ≥80% semantic |
| HGR-4 | Ingestion #4 | High | 38 policy rules + G-SIMULATION |
| HGR-5+ | Ongoing | Medium | Continuous oversight |

## Ledger Schema Summary

| Schema | Track | Purpose |
|--------|-------|---------|
| requirement-link | A+ | REQ→Story→AC mapping |
| entity-link | A+ | Entity extraction audit |
| relationship-link | A+ | Relationship extraction audit |
| semantic-link | C+ | Semantic alignment audit |
| policy-link | D+ | Policy decision audit |

---

# DOCUMENT END

## Final Statistics

| Metric | Count |
|--------|-------|
| Parts | 16 |
| Appendices | 6 |
| Entities (Canonical) | 67 |
| Entities (With Extensions) | 83 (67 base + 16 extensions) |
| Relationships (Canonical) | 100 |
| Relationships (With Extensions) | 114 (100 base + 14 extensions) |
| Gates Specified | 21 (20 active + 1 dormant) |
| SANITY Tests | 58 (54 active + 4 dormant) |
| Human Gates | 5 |
| Ledger Schemas | 5 |

## Document Integrity

**Version:** 20.6.4  
**Date:** December 14, 2025  
**Status:** AUTHORITATIVE - Complete Verification Reference  
**Alignment:** BRD V20.6.3, UNIFIED_TRACEABILITY_GRAPH_SCHEMA V20.6.1, Roadmap V20.6.4, Cursor Plan V20.8.5 (implements V20.6.4), EP-D-002 V20.6.1

## Version History (Recent)

### V20.6.4 (Organ Alignment Edition)
1. Synchronized all companion document references
2. Fixed G-REGISTRY counts: 64/347/2873 → 65/351/2849 (canonical). Note: 2901 was a metadata/header artifact, not a BRD-content count.
3. Added Track C Operational Closure (§5.6)
4. Specified "≥80% agreement" operational definition
5. Specified reject behavior for autonomy boundary
6. Added alignment-reject schema
7. No gate, threshold, or test changes beyond count fix

### V20.6.3 (Claim Hygiene Edition)
1. Aligned Track C language with epistemic reality
2. "Do I understand?" → "Can I assess semantic alignment?"
3. "Self-understanding" → "Semantic alignment assessment"
4. "alignment accuracy" → "alignment agreement"
5. "Code↔Req verified" → "Code↔Req alignment scored"
6. "Self-understanding trusted" → "Semantic signals available (human-anchored)"
7. No gate, threshold, or test changes

### V20.6.2 (Architectural Constraints Edition)
1. Added SANITY-043: Extraction Provider Interface verification
2. Added SANITY-044: Evidence Anchors verification (entities AND relationships)
3. Extended EXTRACTION range: SANITY-040-042 → SANITY-040-044
4. Updated SANITY count: 56 → 58 (54 active + 4 dormant)
5. Updated companion references to V20.6.2

### V20.6.1 (Semantic Rubric Freeze Edition)
1. Added Semantic Rubric Freeze constraint for Track C
2. Updated G-SEMANTIC gate: validates rubric_version consistency
3. Added G-ALIGNMENT gate specification with rubric_version validation
4. Updated semantic-link ledger schema: added rubric_version field (required)
5. Added RULE-LEDGER-033, RULE-LEDGER-034 for rubric version validation
6. Fixed Appendix F Track Summary: Track D/Sophia counts corrected to 83/114/21
7. Updated companion references to V20.6.1

### V20.6.0 (Runtime Reconciliation Edition)
1. Added EP-D-002 Runtime Reconciliation verification (dormant until Track D.9)
2. Added SANITY-080 to 083 tests for EP-D-002 (dormant)
3. Added VERIFY-E84, VERIFY-E85 entity extraction specs (dormant)
4. Added VERIFY-R113, VERIFY-R114 relationship extraction specs (dormant)
5. Added G-RUNTIME gate specification (dormant)
6. Added Story D.9 verification section
7. Updated entity count: 81 → 83 (added E84-E85 dormant)
8. Updated relationship count: 112 → 114 (added R113-R114 dormant)
9. Updated gate count: 20 → 21 (added G-RUNTIME dormant)
10. Updated SANITY test count: 52 → 56 (added 4 dormant tests)
11. Updated all companion references to V20.6.0

### V20.5.1 (Entity Reference Correction Edition)
1. Clarified entity architecture: Base schema (67) vs Extension Protocol additions
2. Corrected Track D entity references: D.1 uses E43-E44 (not E71-E73), D.2 uses E45-E46 (not E80-E83)
3. Added Story D.5: Legal/Accessibility/UX Entities (E57-E60, R79-R91)
4. Renumbered D.5→D.6 (Simulation), D.6→D.7 (Runtime Ops), D.7→D.8 (Cognitive Health)
5. Updated all companion references to V20.5.1

### V20.1.0 (Operations & Simulation Edition)
1. Added E91-E97 (Operations layer) — canonical entities now 67
2. Added R104-R112 (Operations relationships) — canonical relationships now 100
3. Added G-SIMULATION, G-COGNITIVE, G-OPS gates — gates now 20
4. Added SANITY-050 to SANITY-059 tests — SANITY tests now 52
5. Added Track D stories D.5/D.6/D.7 (now D.6/D.7/D.8 after V20.5.1 renumbering)

### V20.0.0 (Unified Parity Edition)
1. Fixed E57-E60 to match Epic 64 (Legal/A11y/UX instead of Compliance)
2. Renumbered Compliance entities to E64-E67 (Extension EP-D-001)
3. Fixed R83-R91 to match Epic 64 (Legal/A11y/UX)
4. Renumbered Compliance relationships to R92-R99 (Extension EP-D-001)
5. Removed non-canonical gates G02, G05, G-HYPOTHESIS
6. Added G-AUDIT to Track D
7. Aligned gate count to 17 canonical gates (now 20 after V20.1)

---

**END OF UNIFIED VERIFICATION SPECIFICATION V20.6.5**
