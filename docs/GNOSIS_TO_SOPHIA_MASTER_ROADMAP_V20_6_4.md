# GNOSIS → SOPHIA Master Roadmap

**Version:** 20.6.4 (Organ Alignment Edition)  
**Date:** December 14, 2025  
**Status:** Aligned with BRD V20.6.3 and UNIFIED_TRACEABILITY_GRAPH_SCHEMA V20.6.1  
**Companion Documents:**
- BRD_V20_6_3_COMPLETE.md (Requirements - WHAT)
- UNIFIED_TRACEABILITY_GRAPH_SCHEMA_V20_6_1.md (Schema - HOW)
- UNIFIED_VERIFICATION_SPECIFICATION_V20_6_4.md (Verification - PROOF)
- CURSOR_IMPLEMENTATION_PLAN_V20_8_5.md (Implementation - EXECUTE)
- EP-D-002_RUNTIME_RECONCILIATION_V20_6_1.md (EP-D-002 specification)

---

## What's New in V20.6.4

This version establishes **Organ Alignment** — synchronizing all companion document references to a single canonical version matrix.

### Key Changes

| Change | Description | Impact |
|--------|-------------|--------|
| **Version Matrix** | All companion refs synchronized | Suite consistency |
| **Status Line** | Fixed BRD version reference | Header consistency |

**Note:** No timeline, gate, or scope changes. This is reference alignment only.

---

## What's New in V20.6.3

This version applies **Claim Hygiene** — aligning Track C language with epistemic limits.

### Key Changes

| Change | Description | Impact |
|--------|-------------|--------|
| **Track C Question** | "Do I understand?" → "Can I assess semantic alignment?" | Framing |
| **Track C Purpose** | "verify...implements" → "assess...aligns" | Terminology |
| **User Story** | Updated to reflect assessment vs verification | Precision |

**Note:** No scope, gate, or criteria changes. This is terminology alignment only.

---

## What's New in V20.6.2

This version adds **Track A Architectural Constraints** — two implementation constraints that prevent costly refactoring after Track B closure.

### Key Changes

| Change | Description | Impact |
|--------|-------------|--------|
| **Constraint A.1** | Modular Extraction (Provider Interface) | SANITY-043 |
| **Constraint A.2** | Evidence Anchor Capture | SANITY-044 |
| **SANITY Tests** | +2 tests in EXTRACTION range | 56 → 58 |

**Note:** No new entities, relationships, or gates. These are implementation constraints, not schema changes.

---

## What's New in V20.6.1

This version **aligns companion references** with V20.6.1 documents (BRD, Verification Spec) that added the Semantic Rubric Freeze constraint.

### Key Changes

| Change | Description | Impact |
|--------|-------------|--------|
| **Companion Alignment** | Updated references to V20.6.1 docs | Cross-doc consistency |
| **Semantic Rubric Freeze** | Track C constraint (documented in BRD/VerificationSpec) | Auditability |

**Note:** No timeline, entity, relationship, or gate changes in V20.6.1. This is a documentation alignment update.

---

## What's New in V20.6.0

This version adds **Runtime Reconciliation (EP-D-002)** — introducing Story D.9 and observational truth capabilities to complete the Third Law of Traceability. All EP-D-002 additions are **DORMANT** until Track D.9 activation.

### Key Changes

| Change | Description | Impact |
|--------|-------------|--------|
| **Story D.9** | Observational Truth Layer story added | +1 story, +7 ACs, ~4-7 days |
| **Entities** | E84-E85 added (dormant) | +2 entities (81→83) |
| **Relationships** | R113-R114 added (dormant) | +2 relationships (112→114) |
| **Gates** | G-RUNTIME added (dormant) | +1 gate (20→21) |
| **Layers** | Layer 14 added | +1 layer (13→14) |
| **Categories** | Category 21 added | +1 category (20→21) |
| **Track D Timeline** | 24+6=30 → 27+7=34 days | +3 base +1 contingency from D.9 |

**For complete EP-D-002 specification, see:** `docs/integrations/EP-D-002_RUNTIME_RECONCILIATION_V20_6_0.md`

---

## What's New in V20.5.1

This version **corrects entity ID references** — ensuring Track D story entity references match actual Epic 64 base schema.

### The Issue That V20.5.1 Corrects

V20.5.0 referenced extension entity IDs (E71-E73, E80-E83) instead of base schema entities. The base governance entities are E43-E48 in Layer 8.

### V20.5.1 Key Changes

| Change | Description | Impact |
|--------|-------------|--------|
| **D.1 Entity Refs** | E71-E73 → E43-E44 | Correct base policy entities |
| **D.2 Entity Refs** | E80-E83 → E45-E46 | Correct base autonomy entities |
| **Extension Note** | Added clarification | EP-D-001 adds E71-E83 beyond base |

### Track D Story Alignment (V20.6.0)

| Story | Title | Base Entities (Epic 64) | Relationships |
|-------|-------|-------------------------|---------------|
| D.1 | Policy Registry | E43-E44 (PolicyRule, PolicyDomain) | R47-R48, R51-R53 |
| D.2 | Autonomy Framework | E45-E46 (AutonomyLevel, Person) | R56-R57 |
| D.3 | Extension via Protocol | — (defines EP-D-001) | — |
| D.4 | Graph API v4 | — | — |
| **D.5** | **Legal/A11y/UX** | **E57-E60** | **R79-R91** |
| D.6 | Simulation Harness | E97 | R111-R112 |
| D.7 | Runtime Operations | E91-E96 | R104-R110 |
| D.8 | Cognitive Health | — | — |
| **D.9** | **Observational Truth Layer** | **E84-E85** | **R113-R114** | [DORMANT] |

**Note on Extension Entities:** Extension Protocol EP-D-001 adds tracking/audit entities (E71-E73 for policy decisions, E80-E83 for autonomy events) beyond the base 67. EP-D-002 adds runtime reconciliation entities (E84-E85) and relationships (R113-R114) beyond the base 67. These are optional additions, not base schema.

---

## What's New in V20.5

This version adds **Legal/Accessibility/UX story** — aligning Track D story numbering between Roadmap and Cursor Implementation Plan by adding explicit story for E57-E60 entities.

### Key Changes

| Change | Description | Impact |
|--------|-------------|--------|
| **Story D.5** | Legal/Accessibility/UX Entities added | E57-E60, R79-R91 |
| **Story Renumbering** | D.5→D.6, D.6→D.7, D.7→D.8 | Aligns with Cursor Plan |
| **Track D Stories** | 7 → 8 stories | Complete entity coverage |

---

## What's New in V20.1

This version adds **Operations & Simulation** requirements — extending the roadmap with runtime operations, simulation harness validation, and cognitive engine health checks required before enabling autonomous operation.

### Key Changes

| Change | Description | Impact |
|--------|-------------|--------|
| **Track D.5** | Simulation Harness requirement added | +5-7 days |
| **G-SIMULATION** | Required before HGR-4 | Temporal resilience proof |
| **G-COGNITIVE** | Required from Track A+ | Cognitive engine health |
| **G-OPS** | Required in Track D | Operations entity validation |
| **Entity Count** | 60 → 67 | +7 operations entities |
| **Relationship Count** | 91 → 100 | +9 operations relationships |
| **Gate Count** | 17 → 20 | +3 gates |
| **Sophia V1+** | Post-V1 evolution section added | Learning pipeline activation |
| **Companion Docs** | Implementation architecture references | 6 planned documents |

### Why Simulation Before Autonomy?

Without simulation validation:
- Can't prove temporal resilience before enabling autonomy
- Can't test self-modification behavior safely
- Can't detect drift patterns across time

With G-SIMULATION gate:
- 1000+ simulation cycles validate autonomous behavior
- Drift patterns detected before production impact
- Policy violations caught in simulation, not production

---

## Executive Summary

This roadmap defines the execution plan for building Sophia — an autonomous AI development system capable of **safe, traceable, verifiable self-evolution**.

### The Three Generations

| Generation | Name | Greek | Purpose | Timeline |
|------------|------|-------|---------|----------|
| 1 | **GNOSIS** | γνῶσις | Self-aware build system | Tracks A-D (~55-65 days) |
| 2 | **DIKAIOS** | δίκαιος | Production software delivery | 15-20 weeks + pilot |
| 3 | **SOPHIA** | σοφία | Autonomous engineering organization | Continuous |

### The Core Challenge

> **How do you build a system that can trustworthily evolve itself?**

This requires solving four problems simultaneously:
- **Trust:** How do you trust a system that validates itself?
- **Meaning:** How do you automate judgment without losing correctness?
- **Safety:** How do you allow self-modification without unbounded risk?
- **Growth:** How do you let a system expand without breaking its invariants?

### The Solution: Pillars + Governance

We solve this with **four architectural pillars** that define HOW the system evolves, plus a **validation framework** that governs WHEN evolution proceeds.

#### The Four Pillars (Architecture)

| Pillar | Problem | Mechanism |
|--------|---------|-----------|
| **Shadow Ledger** | Trust bootstrap | External record created before self-validation |
| **Semantic Learning** | Knowledge bootstrap | Human judgment captured before automation |
| **API Boundaries** | Modification safety | All changes traced through versioned interfaces |
| **Extension Protocol** | Growth safety | Controlled ontology evolution with closure preservation |

#### The Validation Framework (Governance)

| Component | Problem | Mechanism |
|-----------|---------|-----------|
| **Pre-Track Validation** | Substrate corruption | Regression suite before each track |
| **Human Gates** | Premature autonomy | Explicit human approval before each ingestion |
| **Compatibility Verification** | Silent regression | Prior-track tests re-run after extensions |
| **Risk Management** | Unplanned failures | Per-track risks with mitigations and contingencies |

Together, the pillars and framework ensure that **every step of evolution is architecturally sound AND governmentally approved**.

---

## The Five-Track Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           SOPHIA V1                                      │
│                    Continuous Self-Evolution                             │
│                         (~10-15 days)                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                          TRACK D                                         │
│                   Policy & Governance                                    │
│                        (~15-20 days)                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                          TRACK C                                         │
│                   Semantic Understanding                                 │
│                        (~15-20 days)                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                          TRACK B                                         │
│                        Zero Drift                                        │
│                         (~8 days)                                        │
├─────────────────────────────────────────────────────────────────────────┤
│                          TRACK A                                         │
│                    Basic Nervous System                                  │
│                         (~12 days)                                       │
└─────────────────────────────────────────────────────────────────────────┘
```

**Total: 60-75 days to Sophia V1** (plus ~20% contingency buffer)

---

## Track Dependencies and Validation Points

```
Pre-Validation → Track A → Exit + Human Gate → Ingestion #1
                              ↓
Pre-Validation → Track B → Exit + Human Gate → Ingestion #2 ⭐ Oracle Transition
                              ↓
Pre-Validation → Track C → Exit + Human Gate → Ingestion #3
                              ↓
Pre-Validation → Track D → Exit + Human Gate → Ingestion #4
                              ↓
                         Sophia V1 → Ingestion #5+
```

**Every track has:**
- **Entry Criteria:** Pre-track validation must pass
- **Exit Criteria:** Track deliverables complete
- **Human Gate:** Explicit approval before ingestion proceeds

---

## Bootstrap Layer Architecture

**Reference:** BRD V20.1 Appendix I

```
┌─────────────────────────────────────────────────────────────────────────┐
│ FULL GRAPH (Epic 64 + Epic 65)                                          │
│ 67 entities, 100 relationships, 20 gates                                │
│ "Complete nervous system + operations"                                  │
├─────────────────────────────────────────────────────────────────────────┤
│ TRACK A FOUNDATION                                                       │
│ 16 entities, 21 relationships, 5 gates                                   │
│ "Substrate for zero drift (Track B prerequisite)"                        │
├─────────────────────────────────────────────────────────────────────────┤
│ MVP BOOTSTRAP                                                            │
│ 10 entities, 15 relationships, 4 gates                                   │
│ "Minimum to run first ingestion"                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Key Principle:** MVP ⊂ Track A ⊂ Full Graph (strict subset hierarchy)

---

# Part I: Architectural Foundations

## Section 1: The Four Pillars

### Pillar 1: Shadow Ledger Protocol

#### The Problem

After Ingestion #2, Gnosis becomes the oracle — it validates itself. But how do you trust a system that validates itself?

#### The Solution

Create an **external record BEFORE the system can self-validate**. This record becomes the ground truth against which self-validation is verified.

#### Shadow Ledger Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Track A Build (Days 1-12)                                                │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Shadow Ledger: ACTIVE (external file, human-maintained)              │ │
│ │ Records: Every code change, every review decision, every marker     │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                    ↓                                     │
│ Ingestion #1: Graph created, shadow ledger preserved externally          │
├─────────────────────────────────────────────────────────────────────────┤
│ Track B Build (Days 13-20)                                               │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Shadow Ledger: ACTIVE (external file, human-maintained)              │ │
│ │ Records: Continues recording all changes                            │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                    ↓                                     │
│ Ingestion #2: Gnosis becomes oracle                                      │
│ VERIFICATION: Compare Gnosis graph to external shadow ledger             │
│ If match → Gnosis is trustworthy                                         │
│ If mismatch → Gnosis is compromised, halt                                │
├─────────────────────────────────────────────────────────────────────────┤
│ Track C+ (Days 21+)                                                      │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Shadow Ledger: MIGRATED TO GRAPH (E50 Commit, E52 ChangeSet, R70)   │ │
│ │ External backup: Maintained for catastrophic recovery               │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Shadow Ledger Schema

```typescript
interface ShadowLedgerEntry {
  // Identity
  entry_id: string;              // Sequential ID
  timestamp: Date;               // When recorded
  
  // What changed
  change_type: 'CREATE' | 'MODIFY' | 'DELETE' | 'RENAME';
  file_path: string;             // Affected file
  content_hash_before: string;   // SHA256 before change (null for CREATE)
  content_hash_after: string;    // SHA256 after change (null for DELETE)
  
  // Traceability claims
  story_id: string;              // Story this change implements
  ac_ids: string[];              // ACs this change satisfies
  markers_added: string[];       // @implements, @satisfies markers
  
  // Human verification
  reviewer_id: string;           // Who reviewed
  review_verdict: 'APPROVED' | 'REJECTED' | 'PENDING';
  review_notes?: string;         // Explanation
  
  // Git correlation
  commit_sha: string;            // Git commit
  branch: string;                // Git branch
}
```

#### Shadow Ledger Verification Protocol

After Ingestion #2:

```
1. Load external shadow ledger (created during A/B)
2. Load Gnosis graph
3. For each shadow ledger entry:
   a. Verify file exists in graph with matching hash
   b. Verify story relationship exists
   c. Verify AC relationships exist
   d. Verify markers extracted correctly
4. For each graph entity:
   a. Verify corresponding shadow ledger entry exists
   b. Verify no "phantom" entities (in graph but not in ledger)
5. Compute match score
6. If match < 100%: HALT, investigate discrepancies
7. If match = 100%: Shadow ledger migrates to graph, Gnosis is trusted
```

---

### Pillar 2: Semantic Learning Protocol

#### The Problem

Track C automates semantic grounding. But semantic grounding requires training data — examples of "correct" and "incorrect" code-to-requirement mappings.

#### The Solution

**Capture human semantic decisions DURING Tracks A/B.** Every review, every approval, every rejection is a labeled example.

#### The Insight

```
Track A/B: Humans ARE the semantic grounding engine (manual)
Track C:   System BECOMES the semantic grounding engine (automated)

Track C doesn't introduce semantic grounding.
Track C automates what humans were already doing.
```

#### Semantic Signal Types

| Signal Type | When Captured | Example |
|-------------|---------------|---------|
| **CORRECT** | Code review approved | "This file correctly implements Story 64.3" |
| **INCORRECT** | Code review rejected | "This function doesn't satisfy AC-64.3.2" |
| **PARTIAL** | Code review conditional | "Implements story but missing error handling" |
| **MISALIGNED** | Marker dispute | "Marker claims Story X but code does Story Y" |
| **SUSPICIOUS** | Marker review | "Marker present but implementation unclear" |
| **COUPLING** | Dependency review | "Unexpected dependency on unrelated module" |

#### Semantic Signal Schema

```typescript
interface SemanticSignal {
  // Identity
  signal_id: string;             // SIG-{track}-{number}
  timestamp: Date;
  track: 'A' | 'B' | 'C' | 'D';  // Which track generated this
  
  // What was evaluated
  file_path: string;
  file_hash: string;
  code_snippet?: string;         // Relevant code section (≤500 chars)
  code_context?: string;         // Surrounding context (≤1000 chars)
  
  // Traceability target
  story_id: string;
  ac_id?: string;                // Specific AC if applicable
  marker_text?: string;          // The actual marker
  
  // Human judgment
  verdict: 'CORRECT' | 'INCORRECT' | 'PARTIAL' | 
           'MISALIGNED' | 'SUSPICIOUS' | 'COUPLING';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  reasoning: string;             // WHY this verdict (critical for learning)
  
  // Reviewer
  reviewer_id: string;
  reviewer_expertise: string[];  // Domains reviewer knows
  
  // Correlation
  shadow_ledger_entry_id: string;
  commit_sha: string;
}
```

#### Semantic Dataset Specification

The semantic corpus is the training data for Track C. It must be:

| Property | Requirement | Rationale |
|----------|-------------|-----------|
| **Format** | JSONL (one signal per line) | Streaming, appendable |
| **Storage** | External file during A/B, graph nodes after C | Matches oracle evolution |
| **Versioning** | Immutable snapshots at track boundaries | Reproducibility |
| **Export** | Standard format for ML training | Track C consumption |

#### Corpus Structure

```
semantic_corpus/
├── track_a/
│   ├── signals_v1.jsonl           # Raw signals from Track A
│   ├── signals_v1.sha256          # Integrity hash
│   └── metadata.json              # Track, dates, reviewer stats
├── track_b/
│   ├── signals_v1.jsonl           # Raw signals from Track B
│   ├── signals_v1.sha256
│   └── metadata.json
├── exports/
│   ├── training_set_v1.jsonl      # 80% of A+B signals
│   ├── validation_set_v1.jsonl    # 10% held out
│   ├── test_set_v1.jsonl          # 10% held out
│   └── split_metadata.json        # How split was done
└── corpus_manifest.json           # Overall inventory
```

#### Corpus Quality Requirements

| Metric | Minimum | Target | Rationale |
|--------|---------|--------|-----------|
| **Total signals** | 100 | 200+ | Statistical significance |
| **CORRECT signals** | 40% | 50% | Positive examples |
| **INCORRECT signals** | 20% | 30% | Negative examples critical |
| **PARTIAL/other** | 10% | 20% | Edge cases |
| **Unique stories covered** | 50% | 80% | Breadth |
| **Reviewer diversity** | 2+ | 3+ | Reduce bias |
| **Reasoning length** | ≥50 chars | ≥100 chars | Explanatory value |

#### Semantic Learning Workflow

```
┌─────────────────────────────────────────────────────────────────────────┐
│ During Track A/B Code Review                                             │
│                                                                          │
│ Developer: "PR ready for review - implements Story 64.3"                │
│                        ↓                                                 │
│ Reviewer examines code                                                   │
│                        ↓                                                 │
│ Reviewer makes semantic judgment:                                        │
│   - Does this code ACTUALLY implement Story 64.3?                       │
│   - Does function X ACTUALLY satisfy AC-64.3.2?                         │
│   - Is this marker ACTUALLY correct?                                    │
│                        ↓                                                 │
│ Reviewer records verdict + reasoning (SemanticSignal)                   │
│                        ↓                                                 │
│ Signal appended to corpus (JSONL)                                        │
│ Shadow ledger entry cross-referenced                                     │
└─────────────────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ Track B Complete: Corpus Export                                          │
│                                                                          │
│ 1. Snapshot corpus at track boundary                                     │
│ 2. Validate quality requirements met                                     │
│ 3. Generate train/validation/test split                                  │
│ 4. Export in ML-ready format                                             │
│ 5. Hash and version for reproducibility                                  │
└─────────────────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ Track C Training                                                         │
│                                                                          │
│ Input: Exported corpus from Tracks A/B                                   │
│                        ↓                                                 │
│ Train alignment model:                                                   │
│   - Code embedding ↔ Requirement embedding                              │
│   - Verdict prediction                                                   │
│   - Confidence calibration                                               │
│                        ↓                                                 │
│ Validate: Model verdicts match human verdicts on held-out set           │
│   - Minimum: ≥80% agreement                                              │
│   - Target: ≥90% agreement                                               │
│                        ↓                                                 │
│ Deploy: Automated semantic grounding                                     │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### Pillar 3: API Boundary Protocol

#### The Problem

If Track B can directly access Track A's database, then:
- Those queries aren't traced in the graph
- Modifications bypass provenance
- "Shadow paths" emerge that the nervous system can't see

#### The Solution

**Each track exposes a versioned API. Subsequent tracks MUST use only this API.**

#### The Principle

```
The graph can only trace what flows through its interfaces.
API boundaries are trust boundaries.
```

#### API Evolution by Track

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Track A Complete → Graph API v1                                          │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Capabilities:                                                        │ │
│ │   - Entity CRUD (16 types)                                          │ │
│ │   - Relationship CRUD (21 types)                                    │ │
│ │   - Query: traversal, filtering, aggregation                        │ │
│ │   - Marker extraction trigger                                        │ │
│ │   - Coverage computation                                             │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                    ↓                                     │
│ Track B MUST use Graph API v1 (cannot import Track A internals)          │
├─────────────────────────────────────────────────────────────────────────┤
│ Track B Complete → Graph API v2 (extends v1)                             │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ New Capabilities:                                                    │ │
│ │   - Ground truth: manifest, hash verification                       │ │
│ │   - Drift detection: snapshot diff, regression identification       │ │
│ │   - Closure check: deterministic ingestion verification             │ │
│ │   - BRD registry: requirement query                                  │ │
│ │   - Shadow ledger: audit trail query                                 │ │
│ │ Guarantees:                                                          │ │
│ │   - All v1 endpoints unchanged (backward compatible)                │ │
│ │   - Deprecation requires 1-track notice                              │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                    ↓                                     │
│ Track C MUST use Graph API v2 (cannot import Track A/B internals)        │
├─────────────────────────────────────────────────────────────────────────┤
│ Track C Complete → Graph API v3 (extends v2)                             │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ New Capabilities:                                                    │ │
│ │   - Semantic alignment: code↔requirement scoring                    │ │
│ │   - Confidence query: relationship strength                          │ │
│ │   - Hypothesis management: uncertain relationship lifecycle         │ │
│ │   - Embedding access: vector similarity                              │ │
│ │ Guarantees:                                                          │ │
│ │   - All v2 endpoints unchanged                                       │ │
│ │   - Semantic operations isolated from structural                    │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                    ↓                                     │
│ Track D MUST use Graph API v3 (cannot import Track A/B/C internals)      │
├─────────────────────────────────────────────────────────────────────────┤
│ Track D Complete → Graph API v4 (extends v3)                             │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ New Capabilities:                                                    │ │
│ │   - Policy evaluation: rule checking                                 │ │
│ │   - Autonomy query: current level, boundaries                        │ │
│ │   - Transformation envelope: allowed modifications                   │ │
│ │   - Approval workflow: human escalation                              │ │
│ │ Guarantees:                                                          │ │
│ │   - All v3 endpoints unchanged                                       │ │
│ │   - Policy cannot override structural integrity                     │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                    ↓                                     │
│ Sophia uses Graph API v4 for ALL self-modification                       │
└─────────────────────────────────────────────────────────────────────────┘
```

#### API Enforcement Mechanisms

| Mechanism | Description | Gate |
|-----------|-------------|------|
| **Import Linting** | Static analysis blocks cross-track internal imports | G-API |
| **API Gateway** | All inter-track calls route through traced gateway | G-API |
| **Dependency Audit** | Package.json cannot include cross-track internal modules | G-API |
| **Runtime Enforcement** | Direct DB connections rejected from non-owner tracks | G-API |

#### API Contract Specification

```typescript
interface APIContract {
  version: string;              // Semantic version (v1, v2, v3, v4)
  track: string;                // Owning track
  released: Date;               // When this version was released
  
  endpoints: Endpoint[];        // Available operations
  types: TypeDefinition[];      // Request/response types
  
  guarantees: {
    backwardCompatible: boolean;    // Always true
    deprecationNotice: string;      // Tracks before removal
    maxLatency: string;             // SLO
  };
  
  changelog: ChangelogEntry[];  // What changed from prior version
}

interface Endpoint {
  name: string;
  method: 'query' | 'mutation';
  input: TypeReference;
  output: TypeReference;
  
  traces: true;                 // All calls traced (always true)
  idempotent: boolean;
  
  addedIn: string;              // Which version added this
  deprecatedIn?: string;        // Which version deprecated this
}
```

---

### Pillar 4: Extension Protocol

#### The Problem

After Ingestion #2, Gnosis validates itself with 16 entities and 21 relationships. Track C needs to add ~20 new entities. Track D needs to add ~24 more.

How does a self-validating system safely expand its own ontology?

#### The Solution

**A controlled 7-step protocol for extending the graph post-ingestion.**

(Updated from 6-step to include compatibility verification)

#### The Extension Protocol

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Step 1: PROPOSE                                                          │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ - Define new entity/relationship in BRD                              │ │
│ │ - Define schema in Epic 64                                           │ │
│ │ - Human approval required                                            │ │
│ │ - Output: Extension Proposal (EP-XXX)                                │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────┤
│ Step 2: VALIDATE                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ - Verify new entity doesn't conflict with existing                   │ │
│ │ - Verify new relationships reference valid entity types              │ │
│ │ - Verify ID format follows convention                                │ │
│ │ - Verify no existing gates will break                                │ │
│ │ - Output: Validation Report                                          │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────┤
│ Step 3: GENERATE                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ - Auto-generate schema migration                                     │ │
│ │ - Auto-generate TypeScript types                                     │ │
│ │ - Auto-generate API endpoint stubs                                   │ │
│ │ - Auto-generate test scaffolding                                     │ │
│ │ - Output: Migration Package                                          │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────┤
│ Step 4: APPLY                                                            │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ - Run migration in transaction                                       │ │
│ │ - Rollback on any failure                                            │ │
│ │ - Record in shadow ledger                                            │ │
│ │ - Output: Extended Schema                                            │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────┤
│ Step 5: INGEST                                                           │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ - Re-run ingestion with extended schema                              │ │
│ │ - Populate new entities/relationships                                │ │
│ │ - Update API version                                                 │ │
│ │ - Output: Extended Graph                                             │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────┤
│ Step 6: COMPATIBILITY CHECK ⭐ NEW                                       │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ - Re-run ALL prior-track tests                                       │ │
│ │ - Re-run ALL prior-track gates                                       │ │
│ │ - Verify no regressions introduced                                   │ │
│ │ - G-COMPATIBILITY: All prior gates still pass                        │ │
│ │ - Output: Compatibility Report                                       │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────┤
│ Step 7: VERIFY                                                           │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ - Closure check: re-ingestion produces identical graph               │ │
│ │ - All existing gates still pass                                      │ │
│ │ - New gates (if any) pass                                            │ │
│ │ - Shadow ledger matches graph                                        │ │
│ │ - Output: Extension Complete                                         │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Extension Constraints

| Constraint | Description | Enforced By |
|------------|-------------|-------------|
| **Additive Only** | New entities/relationships add capability, never remove | Step 2 |
| **Backward Compatible** | Existing API contracts remain valid | Step 6 |
| **Closure Preserving** | Re-ingestion must still produce identical graph | Step 7 |
| **Gate Preserving** | Existing gates cannot start failing | Step 6, G-COMPATIBILITY |
| **Traced** | All extensions recorded in shadow ledger | Step 4 |

#### Schema Freeze Rule

```
RULE-SCHEMA-FREEZE: During Track X development, schemas from 
Tracks 1..(X-1) are FROZEN. No modifications permitted.

Track B: Cannot modify Track A schema
Track C: Cannot modify Track A or B schemas  
Track D: Cannot modify Track A, B, or C schemas
Sophia: Can propose modifications via Extension Protocol only
```

---

## Section 2: Validation Framework

### Pre-Track Validation

#### The Problem

The current structure validates AFTER building:

```
Build Track X → Exit Criteria → Ingestion
```

But what if the substrate is corrupted BEFORE you build?

#### The Solution

**Run a regression suite BEFORE each track starts.**

```
Pre-Validation → Build Track X → Exit Criteria → Human Gate → Ingestion
      ↑
"Is the substrate still healthy before I build on it?"
```

#### Core Sanity Suite

The Core Sanity Suite is a set of invariant tests that must pass before any track begins:

```typescript
interface SanitySuite {
  version: string;               // Suite version
  last_run: Date;
  
  tests: SanityTest[];
  
  overall_result: 'PASS' | 'FAIL';
  blocking: boolean;             // If FAIL, block track start
}

interface SanityTest {
  id: string;                    // SANITY-XXX
  name: string;
  category: 'ONTOLOGY' | 'INTEGRITY' | 'MARKER' | 'COVERAGE';
  
  description: string;
  query: string;                 // What to check
  expected: string;              // What result should be
  
  result: 'PASS' | 'FAIL' | 'SKIP';
  actual?: string;               // What result was
  error?: string;                // If failed, why
}
```

#### Sanity Tests by Category

**Note:** Detailed extraction and validation logic for each entity/relationship is defined in the Entity & Relationship Verification Specification V1.0.1. The sanity tests below verify structural integrity; the VERIFY-XXX tests in the spec verify extraction correctness.

**ONTOLOGY Tests:**
```
SANITY-001: All 16 Track A entity types exist in registry
SANITY-002: All 21 Track A relationship types exist in registry
SANITY-003: Entity ID formats match conventions (per Verification Spec)
SANITY-004: Relationship directionality correct (per Verification Spec)
SANITY-005: No orphan entities (entities with no relationships)
```

**INTEGRITY Tests:**
```
SANITY-010: Database schema matches TypeScript types
SANITY-011: All foreign keys valid
SANITY-012: No duplicate entity IDs
SANITY-013: Content hashes computable for all files
SANITY-014: Graph is connected (no isolated subgraphs)
```

**MARKER Tests:**
```
SANITY-020: @implements markers parse correctly (per VERIFY-R18)
SANITY-021: @satisfies markers parse correctly (per VERIFY-R19)
SANITY-022: describe() patterns extract story IDs (per VERIFY-R36)
SANITY-023: it() patterns extract AC IDs (per VERIFY-R37)
SANITY-024: No malformed markers in codebase
```

**COVERAGE Tests:**
```
SANITY-030: Coverage computation produces valid percentages
SANITY-031: Gate thresholds are enforceable
SANITY-032: All stories have at least one implementation claim
SANITY-033: All ACs have at least one satisfaction claim
```

**EXTRACTION Tests (from Verification Spec):**
```
SANITY-040: VERIFY-E01 through VERIFY-E52 pass (all 16 entities)
SANITY-041: VERIFY-R01 through VERIFY-R70 pass (all 21 relationships)
SANITY-042: Integration tests pass on synthetic corpus
```

#### Pre-Track Validation by Track

| Before Track | Sanity Suite | Additional Checks |
|--------------|--------------|-------------------|
| Track A | Core suite on empty/synthetic repo | BRD parseable |
| Track B | Core suite + Track A graph valid | Shadow ledger intact |
| Track C | Core suite + Track B drift = 0 | Semantic corpus valid |
| Track D | Core suite + Track C alignment calibrated | Policy rules parseable |
| Sophia | Full suite + Track D policy compliant | All gates green |

---

### Human Gates

#### The Problem

The oracle transition (Ingestion #2) is a critical moment. If we proceed automatically, we trust a machine to validate itself without human verification.

#### The Solution

**Explicit human approval gates before each ingestion.**

#### Human Gate Protocol

```
┌─────────────────────────────────────────────────────────────────────────┐
│ HUMAN-GATE-X: Before Ingestion #X                                        │
│                                                                          │
│ Inputs for Human Review:                                                 │
│   - Track X Exit Criteria checklist (all checked)                       │
│   - Shadow ledger since last ingestion                                   │
│   - Semantic signals since last ingestion                                │
│   - Schema changes (if any)                                              │
│   - Risk assessment (from risk register)                                 │
│   - Pre-validation sanity suite results                                  │
│                                                                          │
│ Human Reviews:                                                           │
│   - Are all exit criteria genuinely met?                                │
│   - Do shadow ledger entries match expectations?                         │
│   - Are semantic signals reasonable?                                     │
│   - Are schema changes safe?                                             │
│   - Are risks acceptable?                                                │
│                                                                          │
│ Human Decision:                                                          │
│   - APPROVE: Proceed to ingestion                                        │
│   - REJECT: Return to track with issues                                  │
│   - DEFER: Need more information                                         │
│                                                                          │
│ Output:                                                                  │
│   - Human Gate Record (HGR-X)                                            │
│   - Approver ID, timestamp, decision, notes                              │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Human Gate Record Schema

```typescript
interface HumanGateRecord {
  gate_id: string;               // HGR-{ingestion_number}
  ingestion_number: number;
  
  // What was reviewed
  track_completed: string;
  exit_criteria_checked: number;
  exit_criteria_total: number;
  shadow_ledger_entries: number;
  semantic_signals: number;
  schema_changes: number;
  
  // Decision
  decision: 'APPROVE' | 'REJECT' | 'DEFER';
  decision_timestamp: Date;
  approver_id: string;
  approver_role: string;
  
  // Rationale
  notes: string;
  concerns?: string[];
  conditions?: string[];         // "Approved IF..."
  
  // For oracle transition (Ingestion #2)
  oracle_transition_acknowledged?: boolean;
}
```

#### Critical Human Gates

| Gate | Before | Criticality | Special Considerations |
|------|--------|-------------|------------------------|
| HGR-1 | Ingestion #1 | High | First graph creation |
| **HGR-2** | **Ingestion #2** | **CRITICAL** | **Oracle transition — Gnosis becomes self-validating** |
| HGR-3 | Ingestion #3 | High | Semantic automation begins |
| HGR-4 | Ingestion #4 | High | Policy enforcement begins |
| HGR-5+ | Ingestion #5+ | Medium | Ongoing oversight |

**HGR-2 is the most critical gate.** After this, the system validates itself. The human must explicitly acknowledge:

```
"I have verified that:
1. Shadow ledger matches Gnosis graph 100%
2. All Track A/B gates pass
3. Closure check succeeds
4. I approve Gnosis becoming the oracle
5. I understand bootstrap scripts will be retired"

Signature: _____________
Date: _____________
```

---

### Compatibility Verification

#### The Problem

Schema extensions in Track C/D might silently break earlier functionality.

#### The Solution

**G-COMPATIBILITY gate that re-runs all prior-track tests after any extension.**

#### G-COMPATIBILITY Gate

```typescript
interface CompatibilityGate {
  gate_id: 'G-COMPATIBILITY';
  triggered_by: 'SCHEMA_EXTENSION' | 'API_CHANGE' | 'GATE_ADDITION';
  
  // What to verify
  prior_tracks: string[];        // ['A', 'B'] for Track C extension
  
  checks: {
    // Re-run all prior tests
    prior_tests_run: number;
    prior_tests_passed: number;
    prior_tests_failed: number;
    
    // Re-run all prior gates
    prior_gates_run: number;
    prior_gates_passed: number;
    prior_gates_failed: number;
    
    // API backward compatibility
    api_contracts_checked: number;
    api_contracts_valid: number;
    api_breaking_changes: string[];
  };
  
  result: 'PASS' | 'FAIL';
  failure_details?: string[];
}
```

#### Compatibility Rules

```
RULE-COMPAT-001: After any schema extension, ALL prior-track tests must pass
RULE-COMPAT-002: After any schema extension, ALL prior-track gates must pass
RULE-COMPAT-003: API breaking changes require deprecation notice + migration path
RULE-COMPAT-004: G-COMPATIBILITY failure blocks ingestion
```

---

# Part II: Track Specifications

Each track follows this structure:

```
1. Purpose and Question Answered
2. Scope (entities, relationships, gates)
3. Entry Criteria (pre-track validation)
4. Stories with ACs (tagged by pillar)
5. Pillar Integration (shadow, semantic, API, extension)
6. Risk Assessment
7. Exit Criteria
8. Human Gate requirements
```

---

# Track A: Basic Nervous System

**Duration:** ~12 days (+20% contingency = ~14 days)  
**Question Answered:** "Can I see myself?"  
**Ingestion:** #1  
**Oracle:** External scripts (~530 lines) + BRD + Humans

## Track A Purpose

Build the foundational graph infrastructure: entities, relationships, markers, structural analysis, coverage computation.

## Track A Scope

**Authoritative Definition:** Track A implements EXACTLY the 16 entities and 21 relationships defined in BRD V20.0, Appendix I (Bootstrap Layer Architecture). No additions or omissions are permitted. Any deviation from this specification constitutes a roadmap violation and must be reconciled before proceeding.

### Entities (16)

| ID | Entity | Layer |
|----|--------|-------|
| E01 | Epic | Requirements |
| E02 | Story | Requirements |
| E03 | AcceptanceCriterion | Requirements |
| E04 | Constraint | Requirements |
| E06 | TechnicalDesign | Design |
| E08 | DataSchema | Design |
| E11 | SourceFile | Implementation |
| E12 | Function | Implementation |
| E13 | Class | Implementation |
| E15 | Module | Implementation |
| E27 | TestFile | Verification |
| E28 | TestSuite | Verification |
| E29 | TestCase | Verification |
| E49 | ReleaseVersion | Provenance |
| E50 | Commit | Provenance |
| E52 | ChangeSet | Provenance |

### Relationships (21)

| ID | Relationship | From → To | Category |
|----|--------------|-----------|----------|
| R01 | HAS_STORY | Epic → Story | Hierarchical |
| R02 | HAS_AC | Story → AC | Hierarchical |
| R03 | HAS_CONSTRAINT | Story → Constraint | Hierarchical |
| R04 | CONTAINS_FILE | Module → SourceFile | Containment |
| R05 | CONTAINS_ENTITY | SourceFile → Function/Class | Containment |
| R06 | CONTAINS_SUITE | TestFile → TestSuite | Containment |
| R07 | CONTAINS_CASE | TestSuite → TestCase | Containment |
| R14 | IMPLEMENTED_BY | TechnicalDesign → SourceFile | Design→Impl |
| R16 | DEFINED_IN | DataSchema → SourceFile | Design→Impl |
| R18 | IMPLEMENTS | SourceFile → Story | Req→Impl |
| R19 | SATISFIES | Function/Class → AC | Req→Impl |
| R21 | IMPORTS | SourceFile → SourceFile | Impl→Impl |
| R22 | CALLS | Function → Function | Impl→Impl |
| R23 | EXTENDS | Class → Class | Impl→Impl |
| R24 | IMPLEMENTS_INTERFACE | Class → Interface | Impl→Impl |
| R26 | DEPENDS_ON | Module → Module | Impl→Impl |
| R36 | TESTED_BY | Story → TestSuite | Req→Test |
| R37 | VERIFIED_BY | AC → TestCase | Req→Test |
| R63 | INTRODUCED_IN | Story → ReleaseVersion | Provenance |
| R67 | MODIFIED_IN | SourceFile → Commit | Provenance |
| R70 | GROUPS | ChangeSet → Commit | Provenance |

### Gates (4)

| Gate | Threshold | Purpose |
|------|-----------|---------|
| G01 | Story → Code ≥99% | Every story implemented |
| G03 | Code → Story = 100% | No orphan code |
| G04 | Story → Test ≥99% | Every story tested |
| G06 | Test → AC = 100% | No orphan tests |

## Track A Entry Criteria

Before Track A can begin:

- [ ] BRD V20.0 available and parseable
- [ ] Epic 64 V20.0 available
- [ ] **Entity/Relationship Verification Spec V1.0.1 reviewed and approved**
- [ ] **Synthetic test corpus created per spec**
- [ ] **Verification tests pass on synthetic corpus**
- [ ] Core Sanity Suite passes on synthetic test repository
- [ ] Shadow ledger file initialized
- [ ] Semantic corpus directory created
- [ ] Development environment ready

## Track A Stories

### Story A.1: Entity Registry (~3 days)

**As a** traceability system  
**I want** a registry of all 16 entity types  
**So that** every artifact is typed and trackable

| AC | Description | Pillar |
|----|-------------|--------|
| A.1.1 | All 16 entity types defined with TypeScript interfaces | — |
| A.1.2 | ID format validation via regex | — |
| A.1.3 | CRUD operations for all entities | API |
| A.1.4 | PostgreSQL schema with indexes | — |
| A.1.5 | Bulk insert for ingestion performance | — |
| A.1.6 | All entity operations logged to shadow ledger | Shadow |

### Story A.2: Relationship Registry (~2 days)

**As a** traceability system  
**I want** a registry of all 21 relationship types  
**So that** every connection is typed and traversable

| AC | Description | Pillar |
|----|-------------|--------|
| A.2.1 | All 21 relationship types defined | — |
| A.2.2 | Directionality enforced (From → To) | — |
| A.2.3 | Confidence score on all relationships | — |
| A.2.4 | Bidirectional traversal queries | API |
| A.2.5 | All relationship operations logged to shadow ledger | Shadow |

### Story A.3: Marker Extraction (~3 days)

**As a** traceability system  
**I want** to extract @implements, @satisfies, describe(), it() markers  
**So that** explicit traceability claims are captured

| AC | Description | Pillar |
|----|-------------|--------|
| A.3.1 | Parse @implements STORY-XX.YY from source files | — |
| A.3.2 | Parse @satisfies AC-XX.YY.ZZ from functions/classes | — |
| A.3.3 | Parse describe('STORY-XX.YY: ...') from test files | — |
| A.3.4 | Parse it('AC-XX.YY.ZZ: ...') from test cases | — |
| A.3.5 | Record marker extraction in shadow ledger | Shadow |
| A.3.6 | Capture semantic signals for suspicious markers | Semantic |

### Story A.4: Structural Analysis (~2 days)

**As a** traceability system  
**I want** to infer imports, calls, extends, depends relationships  
**So that** implicit dependencies are visible

| AC | Description | Pillar |
|----|-------------|--------|
| A.4.1 | Parse import statements → IMPORTS relationships | — |
| A.4.2 | Parse function calls → CALLS relationships | — |
| A.4.3 | Parse class extension → EXTENDS relationships | — |
| A.4.4 | Infer module dependencies → DEPENDS_ON relationships | — |
| A.4.5 | Log all inferred relationships to shadow ledger | Shadow |

### Story A.5: Graph API v1 (~2 days)

**As a** subsequent track  
**I want** a versioned API to access the graph  
**So that** I don't need direct database access

| AC | Description | Pillar |
|----|-------------|--------|
| A.5.1 | Graph API v1 exposed with all CRUD operations | API |
| A.5.2 | Query API for traversal, filtering, aggregation | API |
| A.5.3 | All API calls traced and logged | API |
| A.5.4 | API contract documented | API |
| A.5.5 | Coverage computation via API | API |
| A.5.6 | G-API gate: no direct DB access permitted | API |

## Track A: Pillar Integration

### Shadow Ledger

```
Day 1: shadow_ledger_track_a.jsonl created
Every code change recorded with:
  - File path, content hash
  - Story/AC claims
  - Markers added
  - Reviewer verdict

Day 12: Complete record of Track A build preserved
```

### Semantic Learning

```
Every code review captures a SemanticSignal
Target: ≥50 signals by end of Track A
Signals stored in: semantic_corpus/track_a/signals_v1.jsonl
```

### API Boundary

```
Track A exposes: Graph API v1
Track B MUST use: Graph API v1 only
Track B CANNOT: Import track-a/database, track-a/internal/*
```

## Track A: Architectural Constraints (V20.6.2)

Two implementation constraints shape Track A extraction to avoid costly refactoring post-Track B. These do not add scope or change deliverables.

### Constraint A.1: Modular Extraction (Provider Interface)

All structural extraction MUST be implemented behind an `ExtractionProvider` interface.

**Rationale:** Once Track B proves self-ingestion, changing extraction logic means re-verifying that proof. An interface allows adding providers (Python, Java, external repos) without invalidating Track B closure.

**Constraint:** Track A implements ONE provider (TypeScript). The interface exists for future extensibility.

**Interface Contract:**

```typescript
interface ExtractionProvider {
  readonly id: string;           // e.g., "typescript-ts-morph"
  readonly version: string;
  readonly languages: string[];
  
  extractEntities(snapshot: RepoSnapshot): Promise<ExtractedEntity[]>;
  extractRelationships(snapshot: RepoSnapshot): Promise<ExtractedRelationship[]>;
  extractMarkers(snapshot: RepoSnapshot): Promise<ExtractedMarker[]>;
}
```

**Verification:** SANITY-043

### Constraint A.2: Evidence Anchor Capture

All extracted entities and relationships MUST include durable evidence anchors in the `attributes` JSONB field.

**Rationale:** The Third Law requires evidence for every claim. For extracted entities, evidence is "where in the code." This cannot be reconstructed after extraction because the code may change.

**Constraint:** Anchors are captured at extraction time. No schema changes required — uses existing `attributes` JSONB column.

**Anchor Structure:**

```typescript
interface EvidenceAnchor {
  snapshot_id: string;
  file_path: string;
  file_hash: string;
  span: { start_line: number; start_col: number; end_line: number; end_col: number; };
  ast_node_type?: string;
  extraction_timestamp: string;
  provider_id: string;
  provider_version: string;
}
```

**Immutability Rule:** Evidence anchors are immutable for a given `(snapshot_id, provider_id, provider_version)` tuple. A new snapshot produces new anchors (expected behavior during re-extraction).

**Verification:** SANITY-044

### What These Constraints Preserve

- All marker-based gates unchanged (SANITY-020 through SANITY-024, SANITY-032/033)
- Track A scope and deliverables unchanged
- Exit criteria unchanged (except SANITY range)
- Entity/relationship schema (67 base) unchanged

## Track A Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Marker parsing edge cases | Medium | Medium | Extensive test corpus, human review |
| Schema performance issues | Low | High | Index optimization, bulk operations |
| Entity ID collisions | Low | High | Strict ID format validation |
| Incomplete structural analysis | Medium | Medium | Conservative inference, human review |

**Contingency buffer:** +2 days (20%)

## Track A Exit Criteria

- [ ] All 16 entities extractable from codebase (VERIFY-E01 through VERIFY-E52 pass)
- [ ] All 21 relationships extractable or inferable (VERIFY-R01 through VERIFY-R70 pass)
- [ ] **For each entity/relationship, verification logic implemented per Verification Spec V1.0.1 (extraction method, validation rules, confidence model)**
- [ ] First ingestion completes without error
- [ ] Graph API v1 exposed and documented
- [ ] Shadow ledger contains 100% of Track A changes
- [ ] ≥50 semantic signals captured
- [ ] G-API: No direct database access in Track A code
- [ ] Core Sanity Suite passes on Track A graph (including SANITY-040 through SANITY-044)
- [ ] All 4 coverage gates computable

## Track A Human Gate (HGR-1)

Before Ingestion #1:

- [ ] All exit criteria reviewed and verified
- [ ] Shadow ledger reviewed for completeness
- [ ] Semantic signals reviewed for quality
- [ ] Risk assessment acceptable
- [ ] Human approver signs HGR-1

---

# Track B: Zero Drift

**Duration:** ~8 days (+20% contingency = ~10 days)  
**Question Answered:** "Is my memory sound?"  
**Ingestion:** #2  
**Oracle:** Gnosis (self-validates) — **Bootstrap scripts retired**

## Track B Purpose

Achieve zero drift guarantee: ground truth, BRD registry, drift detection, closure verification. After Track B, Gnosis becomes the oracle.

## Track B Scope

Track B adds **capabilities** on the Track A substrate, not new entities/relationships.

| Capability | Purpose | Depends On |
|------------|---------|------------|
| Ground Truth Engine | Know what files exist with hash integrity | E11, E50, R67 |
| BRD Registry | Structured requirements queryable from graph | E01-E04, R01-R03 |
| Drift Detection | Compare state at T₁ vs T₂ | E49, E50, E52, R63, R67, R70 |
| Closure Check | Re-ingestion produces identical graph | All Track A |
| Shadow Ledger Migration | Move external ledger into graph | E50, E52, R70 |

### Track B Gates (4 additional)

| Gate | Purpose |
|------|---------|
| G-HEALTH | System health metrics nominal |
| G-REGISTRY | BRD registry complete and queryable |
| G-DRIFT | Zero drift detected between ingestions |
| G-CLOSURE | Re-ingestion produces identical graph |

**After Track B:** 8 total gates

## Track B Entry Criteria

Before Track B can begin:

- [ ] Ingestion #1 complete (Track A graph exists)
- [ ] HGR-1 approved
- [ ] Core Sanity Suite passes on Track A graph
- [ ] Shadow ledger from Track A intact and valid
- [ ] ≥50 semantic signals from Track A
- [ ] Graph API v1 operational
- [ ] **All ACs for Track A stories mapped to implementation (R19 SATISFIES) and tests (R37 VERIFIED_BY)**
- [ ] **No AC may be unimplemented, unverified, or lacking a traceability marker — gate failure blocks Track B**

## Track B Stories

### Story B.1: Ground Truth Engine (~2 days)

**As a** traceability system  
**I want** cryptographic proof of what files exist  
**So that** untracked or tampered files are detected

| AC | Description | Pillar |
|----|-------------|--------|
| B.1.1 | Generate manifest with SHA256 per file | — |
| B.1.2 | Compute Merkle root of all hashes | — |
| B.1.3 | Health check: manifest vs disk | — |
| B.1.4 | Health score via Graph API v2 | API |
| B.1.5 | G-HEALTH gate: fail if health < 100% | — |
| B.1.6 | Log manifest operations to shadow ledger | Shadow |

### Story B.2: BRD Registry (~2 days)

**As a** traceability system  
**I want** to parse the authoritative BRD  
**So that** I know exactly what requirements exist

| AC | Description | Pillar |
|----|-------------|--------|
| B.2.1 | Parse markdown BRD → Extract epics/stories/ACs | — |
| B.2.2 | Store BRD version with content hash | — |
| B.2.3 | Compare BRD stories to graph stories via API | API |
| B.2.4 | G-REGISTRY gate: fail on mismatch | — |
| B.2.5 | Log BRD parsing to shadow ledger | Shadow |

### Story B.3: Drift Detection (~2 days)

**As a** traceability system  
**I want** to detect changes between builds  
**So that** regressions are caught

| AC | Description | Pillar |
|----|-------------|--------|
| B.3.1 | Create GraphSnapshot with Merkle root | — |
| B.3.2 | Diff snapshots: adds, deletes, mutations | — |
| B.3.3 | G-DRIFT gate: fail if unexpected changes | — |
| B.3.4 | Drift report via Graph API v2 | API |
| B.3.5 | Log all drifts to shadow ledger | Shadow |
| B.3.6 | Capture semantic signals for suspicious drift | Semantic |

### Story B.4: Closure Check (~1 day)

**As a** traceability system  
**I want** proof that re-ingestion produces identical graph  
**So that** I can trust determinism

| AC | Description | Pillar |
|----|-------------|--------|
| B.4.1 | Run ingestion twice from same source | — |
| B.4.2 | Compare resulting graphs exactly | — |
| B.4.3 | G-CLOSURE gate: fail if graphs differ | — |
| B.4.4 | Closure report via Graph API v2 | API |

### Story B.5: Shadow Ledger Verification & Migration (~1 day)

**As a** traceability system  
**I want** to verify Gnosis matches the external shadow ledger  
**So that** I can trust Gnosis to become the oracle

| AC | Description | Pillar |
|----|-------------|--------|
| B.5.1 | Load external shadow ledger from Tracks A/B | Shadow |
| B.5.2 | Compare every entry to graph state | Shadow |
| B.5.3 | 100% match required to proceed | Shadow |
| B.5.4 | Migrate ledger to graph (ChangeSet entities) | Shadow |
| B.5.5 | External ledger archived, graph ledger becomes primary | Shadow |

### Story B.6: Graph API v2 (~1 day)

**As a** subsequent track  
**I want** an extended API with drift and closure operations  
**So that** I can build on verified infrastructure

| AC | Description | Pillar |
|----|-------------|--------|
| B.6.1 | Graph API v2 exposes all v1 operations | API |
| B.6.2 | New: drift detection endpoints | API |
| B.6.3 | New: closure verification endpoints | API |
| B.6.4 | New: BRD registry query endpoints | API |
| B.6.5 | New: shadow ledger query endpoints | API |
| B.6.6 | Track C cannot import Track A/B internals | API |

### Story B.7: Semantic Corpus Export (~0.5 days)

**As a** Track C  
**I want** the semantic corpus from A/B exported and validated  
**So that** I can train the alignment model

| AC | Description | Pillar |
|----|-------------|--------|
| B.7.1 | Corpus quality requirements met (see Pillar 2) | Semantic |
| B.7.2 | Train/validation/test split generated | Semantic |
| B.7.3 | Export in ML-ready format | Semantic |
| B.7.4 | Corpus versioned and hashed | Semantic |

## Track B: Pillar Integration

### Shadow Ledger

```
Continue recording to external shadow ledger
After Ingestion #2:
  1. Compare external ledger to Gnosis graph → MUST be 100% match
  2. Migrate ledger to graph (E50, E52, R70)
  3. Archive external ledger
  4. Graph-based ledger becomes authoritative
```

### Semantic Learning

```
Continue capturing semantic signals
New signal types: DRIFT, REGISTRY_MISMATCH
Target: ≥100 total signals (A + B)
Export corpus for Track C
```

### API Boundary

```
Track B exposes: Graph API v2 (extends v1)
Track C MUST use: Graph API v2 only
Track C CANNOT: Import track-a/*, track-b/internal/*
```

### Oracle Transition

```
Before Ingestion #2: External scripts + humans are oracle
After Ingestion #2:  Gnosis is oracle (verified against shadow ledger)

Bootstrap scripts: RETIRED
External oracle: RETIRED
```

## Track B Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Shadow ledger mismatch | Low | CRITICAL | Extensive verification, halt on any discrepancy |
| Closure check fails | Medium | High | Debug determinism issues, fix before proceeding |
| BRD parsing edge cases | Medium | Medium | Test with full BRD, handle edge cases |
| Oracle transition premature | Low | CRITICAL | HGR-2 explicit acknowledgment required |

**Contingency buffer:** +2 days (25%)

## Track B Exit Criteria

- [ ] Ground truth manifest produced and verified
- [ ] BRD registry queryable via API
- [ ] Drift detection operational via API
- [ ] Re-ingestion produces identical graph (closure)
- [ ] Shadow ledger verification: 100% match
- [ ] Shadow ledger migrated to graph
- [ ] Graph API v2 exposed and documented
- [ ] ≥100 semantic signals captured (A + B total)
- [ ] Semantic corpus exported and validated
- [ ] G-API: No direct A/B database access in Track B code
- [ ] All 8 gates passing

## Track B Human Gate (HGR-2) ⭐ CRITICAL

**This is the most critical human gate in the entire roadmap.**

Before Ingestion #2:

- [ ] All exit criteria reviewed and verified
- [ ] Shadow ledger vs Gnosis graph: 100% match confirmed
- [ ] Closure check: deterministic ingestion confirmed
- [ ] Semantic corpus quality requirements met
- [ ] All 8 gates passing

**Explicit Oracle Transition Acknowledgment:**

```
"I, [Name], have verified that:

1. ☐ Shadow ledger matches Gnosis graph 100%
2. ☐ All Track A and Track B gates pass
3. ☐ Closure check succeeds (deterministic ingestion)
4. ☐ Semantic corpus meets quality requirements
5. ☐ I approve Gnosis becoming the oracle
6. ☐ I understand bootstrap scripts will be retired
7. ☐ I understand this transition is irreversible

Signature: _____________
Date: _____________
Role: _____________"
```

---

# Track C: Semantic Understanding

**Duration:** ~15-20 days (+20% contingency = ~18-24 days)  
**Question Answered:** "Can I assess semantic alignment?"  
**Ingestion:** #3  
**Oracle:** Gnosis + Semantic Engine

## Track C Purpose

Automate semantic grounding: assess whether code semantically aligns with requirements, beyond structural compliance.

## Track C Scope

### New Entities (~20)

Added via Extension Protocol (EP-C-001).

| Category | Examples |
|----------|----------|
| Semantic | SemanticVector, MeaningUnit, AlignmentScore |
| Hypothesis | Hypothesis, HypothesisEvidence, HypothesisDecay |
| Confidence | ConfidenceScore, ConfidenceSource, ConfidencePropagation |

### New Relationships (~35)

| Category | Examples |
|----------|----------|
| Semantic | SEMANTICALLY_ALIGNS, CONTRADICTS, REFINES |
| Hypothesis | SUPPORTS, WEAKENS, EXPIRES |
| Confidence | DERIVED_FROM, PROPAGATES_TO, CALIBRATED_BY |

### New Gates (3)

| Gate | Purpose |
|------|---------|
| G-SEMANTIC | Semantic alignment scores above threshold |
| G-ALIGNMENT | Code-requirement alignment scored |
| G-CONFIDENCE | Confidence scores calibrated |

**After Track C:** 11 total gates, ~36 entities, ~56 relationships

## Track C Entry Criteria

Before Track C can begin:

- [ ] Ingestion #2 complete (Gnosis is oracle)
- [ ] HGR-2 approved with oracle transition acknowledgment
- [ ] Core Sanity Suite passes
- [ ] Semantic corpus exported and validated
- [ ] Corpus meets quality requirements (≥100 signals, proper distribution)
- [ ] Graph API v2 operational
- [ ] All 8 gates passing

## Track C Stories

### Story C.1: Semantic Alignment Engine (~5 days)

**As a** traceability system  
**I want** to assess code-to-requirement semantic alignment  
**So that** structural compliance doesn't mask semantic drift

| AC | Description | Pillar |
|----|-------------|--------|
| C.1.1 | Load semantic corpus from Tracks A/B | Semantic |
| C.1.2 | Train alignment model on human verdicts | Semantic |
| C.1.3 | Achieve ≥80% agreement with human verdicts on validation set | Semantic |
| C.1.4 | Achieve ≥80% agreement on held-out test set | Semantic |
| C.1.5 | Score all code-requirement pairs | — |
| C.1.6 | Expose alignment scoring via Graph API v3 | API |
| C.1.7 | Log alignment decisions to shadow ledger | Shadow |

### Story C.2: Confidence Propagation (~4 days)

**As a** traceability system  
**I want** probabilistic confidence on all relationships  
**So that** I know what I'm certain about vs. guessing

| AC | Description | Pillar |
|----|-------------|--------|
| C.2.1 | Explicit relationships: confidence = 1.0 | — |
| C.2.2 | Structural relationships: confidence from analysis | — |
| C.2.3 | Inferred relationships: confidence from model | — |
| C.2.4 | Confidence propagation through graph | — |
| C.2.5 | Confidence query via Graph API v3 | API |

### Story C.3: Hypothesis Lifecycle (~4 days)

**As a** traceability system  
**I want** to manage uncertain relationships  
**So that** guesses don't become facts without evidence

| AC | Description | Pillar |
|----|-------------|--------|
| C.3.1 | Create hypothesis for uncertain relationships | — |
| C.3.2 | Accumulate evidence for/against | — |
| C.3.3 | 7-day expiration if unverified | — |
| C.3.4 | Hypothesis status via Graph API v3 | API |
| C.3.5 | Log hypothesis lifecycle to shadow ledger | Shadow |

### Story C.4: Extension via Protocol (~3 days)

**As a** traceability system  
**I want** to add Track C entities via Extension Protocol  
**So that** closure is preserved while I grow

| AC | Description | Pillar |
|----|-------------|--------|
| C.4.1 | Submit Extension Proposal EP-C-001 | Extension |
| C.4.2 | Validate: no conflicts with existing entities | Extension |
| C.4.3 | Generate migration for ~20 new entities | Extension |
| C.4.4 | Apply migration transactionally | Extension |
| C.4.5 | Run G-COMPATIBILITY: all prior tests/gates pass | Extension |
| C.4.6 | Verify closure preserved | Extension |
| C.4.7 | Update Graph API to v3 | API |

### Story C.5: Graph API v3 (~2 days)

| AC | Description | Pillar |
|----|-------------|--------|
| C.5.1 | Graph API v3 exposes all v2 operations | API |
| C.5.2 | New: semantic alignment endpoints | API |
| C.5.3 | New: confidence query endpoints | API |
| C.5.4 | New: hypothesis management endpoints | API |
| C.5.5 | Track D cannot import Track A/B/C internals | API |

## Track C Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Alignment model agreement < 80% | Medium | High | More training data, model tuning, human fallback |
| Extension breaks prior gates | Low | High | G-COMPATIBILITY gate, extensive testing |
| Confidence calibration issues | Medium | Medium | Calibration dataset, iterative tuning |
| Hypothesis lifecycle edge cases | Medium | Low | Conservative expiration, human review |

**Contingency buffer:** +4 days (25%)

## Track C Exit Criteria

- [ ] Semantic alignment model trained on A/B corpus
- [ ] ≥80% agreement with human verdicts (validation)
- [ ] ≥80% agreement with human verdicts (test)
- [ ] All relationships have confidence scores
- [ ] Hypothesis lifecycle operational
- [ ] ~20 entities added via Extension Protocol (EP-C-001)
- [ ] G-COMPATIBILITY passes (all prior tests/gates)
- [ ] Closure preserved after extension
- [ ] Graph API v3 exposed and documented
- [ ] G-API: No direct A/B/C database access
- [ ] All 11 gates passing

## Track C Human Gate (HGR-3)

Before Ingestion #3:

- [ ] All exit criteria reviewed and verified
- [ ] Alignment model agreement verified on held-out test set
- [ ] G-COMPATIBILITY report reviewed
- [ ] Extension proposal EP-C-001 reviewed
- [ ] Human approver signs HGR-3

---

# Track D: Policy & Governance

**Duration:** ~15-20 days (+20% contingency = ~18-24 days)  
**Question Answered:** "Am I safe to operate?"  
**Ingestion:** #4  
**Oracle:** Gnosis + Semantic + Policy Engine

## Track D Purpose

Add policy enforcement and autonomy management: rules, levels, compliance, audit.

## Track D Scope

### New Entities (~31)

Added via Extension Protocol (EP-D-001 and EP-D-002).

| Category | Examples |
|----------|----------|
| Policy | PolicyRule, PolicyScope, PolicyViolation |
| Autonomy | AutonomyLevel, AutonomyBoundary, Escalation |
| Compliance | ComplianceRecord, AuditEntry, ApprovalRequest |
| Operations (V20.1) | Service, Deployment, SLO, ErrorBudget, Alert, Runbook, SimulationRun |

### New Relationships (~44)

| Category | Examples |
|----------|----------|
| Policy | GOVERNED_BY, PERMITS, PROHIBITS |
| Autonomy | REQUIRES_APPROVAL, ESCALATES_TO, BOUNDED_BY |
| Compliance | COMPLIES_WITH, VIOLATES, AUDITED_BY |
| Operations (V20.1) | DEPLOYS_TO, MONITORS, TRIGGERED_BY, RESOLVES, MEASURES, CONSUMES, DOCUMENTS, VALIDATES, SIMULATES |

### New Gates (7)

| Gate | Purpose |
|------|---------|
| G-POLICY | All actions comply with policy rules |
| G-AUTONOMY | Autonomy level appropriate for action |
| G-COMPLIANCE | Compliance records complete |
| G-AUDIT | Audit trail complete |
| G-SIMULATION (V20.1) | Simulation harness validates temporal resilience |
| G-COGNITIVE (V20.1) | Cognitive engine health verified |
| G-OPS (V20.1) | Operations entities correctly integrated |

**After Track D:** 20 total gates, 67 entities, 100 relationships (Full Graph)

## Track D Entry Criteria

Before Track D can begin:

- [ ] Ingestion #3 complete
- [ ] HGR-3 approved
- [ ] Core Sanity Suite passes
- [ ] Semantic alignment operational (≥80% agreement)
- [ ] Graph API v3 operational
- [ ] All 11 gates passing

## Track D Stories

### Story D.1: Policy Registry (~4 days)

| AC | Description | Pillar |
|----|-------------|--------|
| D.1.1 | Define 38 policy rules from Policy Rules Specification | — |
| D.1.2 | Policy evaluation engine | — |
| D.1.3 | Policy query via Graph API v4 | API |
| D.1.4 | Log policy decisions to shadow ledger | Shadow |

### Story D.2: Autonomy Framework (~4 days)

| AC | Description | Pillar |
|----|-------------|--------|
| D.2.1 | Define autonomy levels L0-L5 | — |
| D.2.2 | Action → required level mapping | — |
| D.2.3 | Escalation workflow to humans | — |
| D.2.4 | Autonomy query via Graph API v4 | API |

### Story D.3: Extension via Protocol (~3 days)

| AC | Description | Pillar |
|----|-------------|--------|
| D.3.1 | Submit Extension Proposal EP-D-001 | Extension |
| D.3.2 | Validate: no conflicts | Extension |
| D.3.3 | Generate migration for ~24 new entities | Extension |
| D.3.4 | Apply migration transactionally | Extension |
| D.3.5 | Run G-COMPATIBILITY: all prior tests/gates pass | Extension |
| D.3.6 | Verify closure preserved | Extension |
| D.3.7 | Update Graph API to v4 | API |

### Story D.4: Graph API v4 (~2 days)

| AC | Description | Pillar |
|----|-------------|--------|
| D.4.1 | Graph API v4 exposes all v3 operations | API |
| D.4.2 | New: policy evaluation endpoints | API |
| D.4.3 | New: autonomy query endpoints | API |
| D.4.4 | New: compliance endpoints | API |
| D.4.5 | Sophia MUST use Graph API v4 for all self-modification | API |

### Story D.5: Legal/Accessibility/UX Entities (~2 days) — NEW IN V20.5

| AC | Description | Pillar |
|----|-------------|--------|
| D.5.1 | LegalRestriction entity (E57) tracks export/use/geographic restrictions | Extension |
| D.5.2 | AccessibilityRequirement entity (E58) tracks WCAG/Section 508 criteria | Extension |
| D.5.3 | UXGuideline entity (E59) tracks design system rules | Extension |
| D.5.4 | DesignSystem entity (E60) tracks design token sources | Extension |
| D.5.5 | Legal relationships (R83-R85) established | Extension |
| D.5.6 | Accessibility relationships (R86-R88) established | Extension |
| D.5.7 | UX/Design System relationships (R89-R91) established | Extension |

### Story D.6: Simulation Harness (~5-7 days) — NEW IN V20.1

| AC | Description | Pillar |
|----|-------------|--------|
| D.6.1 | SimulationRun entity (E97) tracks each simulation execution | Extension |
| D.6.2 | Simulation runner executes 1000+ cycles | — |
| D.6.3 | Drift metrics collected per cycle (<0.1% threshold) | Shadow |
| D.6.4 | Policy violations logged per run (must be 0) | Shadow |
| D.6.5 | Semantic alignment never drops below 75% | Semantic |
| D.6.6 | Automatic rollback on unsafe behavior detected | — |
| D.6.7 | Pattern extraction from simulation failures | Semantic |
| D.6.8 | G-SIMULATION gate validates: 1000 cycles, <1% drift, 0 violations | — |

**Note:** G-SIMULATION must pass before HGR-4 approval. This ensures temporal resilience is proven before enabling autonomous operation.

### Story D.7: Runtime Operations Entities (~3 days) — NEW IN V20.1

| AC | Description | Pillar |
|----|-------------|--------|
| D.7.1 | Service entity (E91) captures deployable units | Extension |
| D.7.2 | Deployment entity (E92) tracks release instances | Extension |
| D.7.3 | SLO/ErrorBudget entities (E93-E94) define service objectives | Extension |
| D.7.4 | Alert/Runbook entities (E95-E96) link operations to incidents | Extension |
| D.7.5 | Operations relationships (R104-R112) established | Extension |
| D.7.6 | Bidirectional traversal validated with E24, E53 | Extension |
| D.7.7 | G-OPS gate validates operations entity integration | — |

### Story D.8: Cognitive Engine Health (~2 days) — NEW IN V20.1

| AC | Description | Pillar |
|----|-------------|--------|
| D.8.1 | G-COGNITIVE gate defined with health criteria | — |
| D.8.2 | LLM connectivity verified with timeout logic | — |
| D.8.3 | Response latency monitored (P99 < 5s) | — |
| D.8.4 | Token budget tracked with awareness | — |
| D.8.5 | Fallback triggers defined for degradation | — |
| D.8.6 | Health metrics recorded in graph | Extension |

### Story D.9: Observational Truth Layer (~4-7 days) — NEW IN V20.6.0 [DORMANT]

**Purpose:** Reconcile static analysis with runtime observations to complete the Third Law of Traceability.
**Prerequisites:** G-OPS must pass (D.7 complete), G-SIMULATION should pass (D.6 recommended), trace collection mechanism available.
**Status:** DORMANT until Track D.9 activation.

| AC | Description | Pillar |
|----|-------------|--------|
| D.9.1 | ExecutionTrace entity (E84) captures runtime sessions with environment, commit, coverage metrics | Extension |
| D.9.2 | RuntimeCall entity (E85) records observed invocations with caller, callee, count | Extension |
| D.9.3 | ACTUALLY_CALLS relationship (R113) links functions with trace evidence | Extension |
| D.9.4 | NEVER_EXECUTES relationship (R114) marks functions not observed within trace scope | Extension |
| D.9.5 | Reconciliation compares R22 (static CALLS) with R113 (observed ACTUALLY_CALLS) | — |
| D.9.6 | Functions not observed across trace corpus identified with scope context | — |
| D.9.7 | G-RUNTIME gate validates: (Runtime ⊆ Static) OR (surprises classified) | — |

**Semantic Distinctions:**
- R22 (CALLS) = "A could call B" (static possibility)
- R113 (ACTUALLY_CALLS) = "A did call B" (observed reality)
- R114 (NEVER_EXECUTES) = "F was not observed in Trace T" (NOT "F is dead code")

**For complete specification, see:** `docs/integrations/EP-D-002_RUNTIME_RECONCILIATION_V20_6_0.md`

## Track D Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Policy rule ambiguity | Medium | High | Clear rule definitions, edge case testing |
| Autonomy level miscalibration | Medium | High | Conservative initial levels, human review |
| Extension breaks prior functionality | Low | High | G-COMPATIBILITY gate |
| Policy conflicts | Medium | Medium | Conflict detection, precedence rules |
| Trace collection infrastructure unavailable | Medium | Medium | +1.5 day contingency, fallback to unit test traces |

**Contingency buffer:** +7 days (26%) — includes +1 day from D.9

## Track D Exit Criteria

- [ ] 38 policy rules implemented and tested
- [ ] Autonomy levels L0-L5 operational
- [ ] Escalation workflow functional
- [ ] ~33 entities added via Extension Protocol (EP-D-001, EP-D-002)
- [ ] G-COMPATIBILITY passes (all prior tests/gates)
- [ ] Full graph complete: 83 entities (67 base + 16 extensions), 114 relationships (100 base + 14 extensions)
- [ ] Closure preserved after extension
- [ ] Graph API v4 exposed and documented
- [ ] **Simulation harness completed 1000+ cycles** (V20.1)
- [ ] **G-SIMULATION passes** (V20.1)
- [ ] **G-OPS passes** (V20.1)
- [ ] **G-COGNITIVE passes** (V20.1)
- [ ] All 21 gates passing (20 active + 1 dormant)

## Track D Human Gate (HGR-4)

Before Ingestion #4:

- [ ] All exit criteria reviewed and verified
- [ ] Policy rules reviewed for completeness and correctness
- [ ] Autonomy levels reviewed for appropriateness
- [ ] G-COMPATIBILITY report reviewed
- [ ] **Simulation harness report reviewed (1000+ cycles, <1% drift, 0 violations)** (V20.1)
- [ ] **G-SIMULATION, G-OPS, G-COGNITIVE all passing** (V20.1)
- [ ] **EP-D-002 dormancy verified (E84, E85, R113, R114, G-RUNTIME all marked dormant)** (V20.6.0)
- [ ] Human approver signs HGR-4

---

# Sophia V1: Continuous Self-Evolution

**Duration:** ~10-15 days initial + continuous  
**Question Answered:** "I re-ingest forever."  
**Ingestion:** #5+  
**Oracle:** Sophia (fully autonomous within policy bounds)

## Sophia Purpose

Achieve continuous self-evolution: self-modification, self-improvement, autonomous operation within policy bounds.

## Sophia Capabilities

| Capability | Description | Governed By |
|------------|-------------|-------------|
| Continuous Ingestion | Re-ingest on every change | G-CLOSURE |
| Self-Modification | Modify own code | G-POLICY, G-AUTONOMY, API |
| Self-Improvement | Optimize performance | G-SEMANTIC, G-POLICY |
| Self-Extension | Propose new entities | Extension Protocol, HGR-X |

## Sophia Constraints

```
All self-modification MUST:
1. Go through Graph API v4 (no direct access)
2. Be recorded in shadow ledger
3. Pass all 21 gates (20 active + 1 dormant)
4. Preserve closure
5. Comply with all 38 policy rules
6. Stay within autonomy level
7. Escalate to human for L4+ actions
8. Pass G-SIMULATION before major changes (V20.1)
9. Maintain G-COGNITIVE health continuously (V20.1)
```

## Sophia Entry Criteria

- [ ] Ingestion #4 complete
- [ ] HGR-4 approved
- [ ] Full graph operational (83/114/21)
- [ ] All 21 gates passing (20 active + 1 dormant)
- [ ] Policy compliance verified
- [ ] Escalation workflow tested
- [ ] **G-SIMULATION passed** (V20.1)
- [ ] **G-COGNITIVE operational** (V20.1)

## Sophia Exit Criteria (V1)

- [ ] Continuous ingestion operational
- [ ] Self-modification through API only
- [ ] All modifications traced in shadow ledger
- [ ] Closure maintained across self-modifications
- [ ] Policy compliance verified continuously
- [ ] Human escalation working for L4+ actions
- [ ] At least one successful self-proposed extension (human approved)

## Sophia Human Gates (HGR-5+)

Ongoing human oversight:

- [ ] Weekly review of self-modification log
- [ ] Approval required for any self-proposed extensions
- [ ] Quarterly audit of policy compliance
- [ ] Human can pause/resume autonomous operation

---

# Sophia V1+: Beyond Initial Autonomy (NEW IN V20.1)

**Duration:** Continuous  
**Question Answered:** "How do I keep getting better?"  
**Oracle:** Sophia + Learning Pipeline

## Sophia V1+ Purpose

After achieving stable autonomous operation (Sophia V1), the system enters continuous improvement mode. This requires additional capabilities not present in V1.

## Sophia V1+ Capabilities (Planned)

| Capability | Description | Companion Document |
|------------|-------------|-------------------|
| Learning Pipeline | Feedback → Improvement loop | LEARNING_PIPELINE_V1.md |
| Self-Modification | Safe Sophia evolution | SELF_MODIFICATION_PROTOCOL_V1.md |
| Cross-Repo Wisdom | Pattern memory across projects | CROSS_REPO_WISDOM_V1.md |

## Sophia V1+ Entry Criteria

- [ ] Sophia V1 stable for 30+ days
- [ ] Zero policy violations in production
- [ ] G-SIMULATION passes on 10,000+ cycles
- [ ] Human review of self-modification patterns
- [ ] Learning Pipeline companion document complete

## Companion Implementation Documents (Planned)

The following documents are required for full autonomy but are implementation architecture (not requirements/verification):

| Document | Purpose | Required For |
|----------|---------|--------------|
| COGNITIVE_ENGINE_ARCHITECTURE_V1.md | LLM selection, prompts, context | Track A |
| CODE_GENERATION_PIPELINE_V1.md | Requirement → Code flow | Track A |
| SIMULATION_HARNESS_V1.md | 10,000 lifetime testing | Track D |
| LEARNING_PIPELINE_V1.md | Feedback → Improvement | Sophia V1+ |
| SELF_MODIFICATION_PROTOCOL_V1.md | Safe evolution | Sophia V1+ |
| CROSS_REPO_WISDOM_V1.md | Pattern memory | Sophia V1+ |

---

# Part III: Cross-Cutting Specifications

## Oracle Evolution

| Phase | Oracle | Shadow Ledger | Human Gate |
|-------|--------|---------------|------------|
| 0 (Track A) | External scripts + Humans | External file | HGR-1 |
| 1 (Track B) | External scripts + Graph | External file | HGR-2 ⭐ |
| 2 (Post-Ingestion #2) | **Gnosis (self)** | **Migrated to graph** | — |
| 3 (Track C) | Gnosis + Semantic | Graph-based | HGR-3 |
| 4 (Track D) | Gnosis + Semantic + Policy | Graph-based | HGR-4 |
| 5 (Sophia) | **Sophia (autonomous)** | Continuous audit | HGR-5+ |

---

## Gate Evolution

| Gate | A | B | C | D | S | Purpose |
|------|---|---|---|---|---|---------|
| G01 Story→Code | ✓ | ✓ | ✓ | ✓ | ✓ | Every story implemented |
| G03 Code→Story | ✓ | ✓ | ✓ | ✓ | ✓ | No orphan code |
| G04 Story→Test | ✓ | ✓ | ✓ | ✓ | ✓ | Every story tested |
| G06 Test→AC | ✓ | ✓ | ✓ | ✓ | ✓ | No orphan tests |
| G-HEALTH | | ✓ | ✓ | ✓ | ✓ | Manifest integrity |
| G-REGISTRY | | ✓ | ✓ | ✓ | ✓ | BRD/graph match |
| G-DRIFT | | ✓ | ✓ | ✓ | ✓ | No unexpected changes |
| G-CLOSURE | | ✓ | ✓ | ✓ | ✓ | Deterministic ingestion |
| G-API | ✓ | ✓ | ✓ | ✓ | ✓ | No direct DB access |
| G-COMPATIBILITY | | | ✓ | ✓ | ✓ | Prior tests/gates pass |
| G-SEMANTIC | | | ✓ | ✓ | ✓ | Semantic alignment |
| G-ALIGNMENT | | | ✓ | ✓ | ✓ | Code↔Req alignment scored |
| G-CONFIDENCE | | | ✓ | ✓ | ✓ | Confidence calibrated |
| G-POLICY | | | | ✓ | ✓ | Policy compliance |
| G-AUTONOMY | | | | ✓ | ✓ | Within autonomy bounds |
| G-COMPLIANCE | | | | ✓ | ✓ | Compliance recorded |
| G-AUDIT | | | | ✓ | ✓ | Audit trail complete |
| G-SIMULATION (V20.1) | | | | ✓ | ✓ | Temporal resilience |
| G-COGNITIVE (V20.1) | ✓ | ✓ | ✓ | ✓ | ✓ | Cognitive engine health |
| G-OPS (V20.1) | | | | ✓ | ✓ | Operations integrated |
| G-RUNTIME (V20.6.0) [DORMANT] | | | | D.9 | ✓ | Runtime reconciliation |

**Total:** 6 → 10 → 15 → 21 → 21 (20 active + 1 dormant)

(Note: G-API added to Track A, G-COGNITIVE added to Track A, G-COMPATIBILITY added to Track C, G-RUNTIME dormant until Track D.9)

---

## API Evolution

| Version | After Track | New Capabilities | Backward Compatible |
|---------|-------------|------------------|---------------------|
| v1 | A | Entity/Relationship CRUD, Query, Coverage | — |
| v2 | B | + Drift, Closure, BRD Registry, Shadow Ledger | ✓ with v1 |
| v3 | C | + Semantic Alignment, Confidence, Hypothesis | ✓ with v1, v2 |
| v4 | D | + Policy, Autonomy, Compliance, Audit | ✓ with v1, v2, v3 |

---

## Risk Management Summary

| Track | Top Risk | Probability | Impact | Mitigation |
|-------|----------|-------------|--------|------------|
| A | Marker parsing edge cases | Medium | Medium | Extensive test corpus |
| B | Shadow ledger mismatch | Low | CRITICAL | Halt on any discrepancy |
| C | Alignment agreement < 80% | Medium | High | More data, model tuning |
| D | Policy rule ambiguity | Medium | High | Clear definitions, testing |
| Sophia | Unbounded self-modification | Low | CRITICAL | API-only, policy gates |

**Overall contingency:** 20-25% buffer per track

**Future Enhancement:** A comprehensive Risk Register (RISK_REGISTER_V1.md) with detailed per-track risks, mitigations, contingency triggers, and escalation paths should be created before Track A begins. This summary table is a placeholder for that artifact.

---

## Summary Timeline

| Track | Base Days | Contingency | Total | Entities | Relationships | Gates | API |
|-------|-----------|-------------|-------|----------|---------------|-------|-----|
| A | 12 | +2 | 14 | 16 | 21 | 6 | v1 |
| B | 8 | +2 | 10 | 16 | 21 | 10 | v2 |
| C | 17 | +4 | 21 | ~36 | ~56 | 15 | v3 |
| D | 27 | +7 | 34 | 83 | 114 | 21 | v4 |
| Sophia | 12 | +3 | 15 | 83 | 114 | 21 | v4 |
| **Total** | **76** | **+18** | **94** | | | | |

**Total: 76-94 days to Sophia V1** (V20.6.0 adds ~4 days for Story D.9)

**Track D Timeline Delta Attribution:**
- V20.1: +9 days for simulation harness and operations (D.5-D.8)
- V20.6.0: +3 base days +1 contingency day for Story D.9 (24+6=30 → 27+7=34)

---

## Document Alignment

| Document | Version | Purpose | Status |
|----------|---------|---------|--------|
| BRD | V20.6.3 | WHAT we're building | ✓ Authoritative |
| UTG Schema | V20.6.1 | HOW to build it (schema) | ✓ Source of truth |
| Verification Spec | V20.6.4 | HOW to verify extraction | ✓ Implementation companion |
| Roadmap | V20.6.4 | WHEN and HOW to execute | ✓ This document |
| Cursor Plan | V20.8.5 (implements V20.6.4) | HOW to implement | ✓ Execution guide |
| EP-D-002 Integration | V20.6.1 | Runtime Reconciliation spec | ✓ Extension spec |

**Verification Spec Permanence:** The Entity/Relationship Verification Specification is a **permanent artifact** used in all Tracks (A, B, C, D) and all future Sophia generations. When new entities or relationships are added via Extension Protocol, corresponding verification definitions must be added to the spec before ingestion.

**Cross-Reference Verification:**
- Track A entities (16) match BRD V20.6.3 Appendix I ✓
- Track A relationships (21) match BRD V20.6.3 Appendix I ✓
- Full graph (83/114/21) matches UTG Schema V20.6.1 ✓
- All entity/relationship IDs verified against UTG Schema ✓
- Verification Spec covers all entities (VERIFY-E01 through VERIFY-E97, VERIFY-E84/E85 dormant) ✓
- Verification Spec covers all relationships (VERIFY-R01 through VERIFY-R114) ✓
- Four architectural pillars integrated throughout ✓
- Validation framework integrated throughout ✓
- Ledger schemas (5) defined: requirement-link, entity-link, relationship-link, semantic-link, policy-link ✓
- Risk management integrated throughout ✓
- Simulation harness requirements integrated (V20.1) ✓
- Operations entities integrated (V20.1) ✓
- Runtime reconciliation entities integrated (V20.6.0, dormant) ✓

---

# Version History

| Version | Date | Changes |
|---------|------|---------|
| **20.6.4** | **Dec 14, 2025** | **Organ Alignment Edition.** (1) Synchronized all companion document references. (2) Fixed status line BRD version. (3) No scope, gate, or criteria changes. |
| 20.6.3 | Dec 14, 2025 | **Claim Hygiene Edition.** (1) Track C language aligned with epistemic limits. (2) "Do I understand?" → "Can I assess semantic alignment?" (3) "verify...implements" → "assess...aligns". (4) No scope, gate, or criteria changes. |
| 20.6.2 | Dec 14, 2025 | **Architectural Constraints Edition.** (1) Added Constraint A.1: Modular Extraction (Provider Interface). (2) Added Constraint A.2: Evidence Anchor Capture. (3) Added SANITY-043, SANITY-044 to Track A exit criteria. (4) SANITY tests: 56 → 58. |
| 20.6.1 | Dec 14, 2025 | **Companion Alignment Edition.** (1) Updated companion references to V20.6.1 (BRD, Verification Spec). (2) Aligns with Semantic Rubric Freeze constraint added in V20.6.1. |
| 20.6.0 | Dec 14, 2025 | **Runtime Reconciliation Edition.** (1) Added Story D.9: Observational Truth Layer (EP-D-002). (2) Added E84-E85 entities (dormant). (3) Added R113-R114 relationships (dormant). (4) Added G-RUNTIME gate (dormant). (5) Added Layer 14 (Runtime Reconciliation). (6) Updated full graph to 83 entities, 114 relationships, 21 gates. (7) Updated Track D timeline: 24+6=30 → 27+7=34 days. (8) Updated all cross-references to V20.6.0. |
| 20.5.1 | Dec 11, 2025 | **Entity Reference Correction Edition.** (1) Corrected Track D entity references to use base schema entities. (2) Added Story D.5: Legal/A11y/UX entities. (3) Renumbered D.5→D.6, D.6→D.7, D.7→D.8. |
| 20.1.0 | Dec 11, 2025 | **Operations & Simulation Edition.** (1) Added Track D.5 Simulation Harness (+5-7 days). (2) Added Track D.6 Runtime Operations Entities. (3) Added Track D.7 Cognitive Engine Health. (4) Added G-SIMULATION, G-COGNITIVE, G-OPS gates. (5) Updated full graph to 67 entities, 100 relationships, 20 gates. (6) Added Sophia V1+ section with companion document references. (7) Updated all cross-references. |
| 20.0.0 | Dec 11, 2025 | **Unified Parity Edition.** (1) All companion docs synchronized at V20.0.0. (2) Fixed Full Graph gate count to 17. (3) Corrected Track C gate count to 13. (4) Added ledger schemas to cross-reference verification. |
| 10.2.2 | Dec 10, 2025 | **Hardened Edition.** (1) Track A Scope now explicitly references BRD V10.1 Appendix I as authoritative. (2) Track A Exit Criteria requires verification logic per entity/relationship. (3) Track B Entry Criteria requires AC↔Implementation↔Test mapping. (4) Verification Spec declared permanent artifact. (5) Risk Register pointer added. |
| 10.2.1 | Dec 10, 2025 | Integrated Entity/Relationship Verification Spec V1.0.1 references throughout. Added to companion documents, document alignment table, sanity tests, and exit criteria. |
| 10.2.0 | Dec 10, 2025 | **Validated Execution Edition.** Added Pre-Track Validation (Core Sanity Suite), Human Gates (HGR-1 through HGR-5+), G-COMPATIBILITY gate, Risk Management per track, Entry Criteria per track, Semantic Dataset Specification, 20% contingency buffers. Integrated validation framework throughout all tracks. |
| 10.1.0 | Dec 10, 2025 | Architectural Integration Edition. Added four pillars: Shadow Ledger, Semantic Learning, API Boundaries, Extension Protocol. |
| 10.0.0 | Dec 10, 2025 | Synchronized with BRD V10.1 and Epic 64 V10.0. Track A corrected to 16/21. |

---

**END OF ROADMAP V20.6.3**
