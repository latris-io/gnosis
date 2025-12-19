# Unified Traceability Graph Schema
## The Nervous System of Autonomous Software Development

**Version:** 20.6.1 (Organ Alignment Edition)  
**Date:** December 14, 2025  
**Status:** FOUNDATIONAL SPECIFICATION  
**Classification:** Prerequisite for Autonomous Operation  

> **Historical Note:** This document originated as the specification for Epic 64 (Unified Traceability Graph). It now encompasses all graph schema definitions including Epic 65 (Operations & Simulation) and Extension Protocol additions. The filename was changed in V20.6.0 to reflect this broader scope.

**Companion Documents:**
- BRD_V20_6_3_COMPLETE.md
- GNOSIS_TO_SOPHIA_MASTER_ROADMAP_V20_6_4.md
- UNIFIED_VERIFICATION_SPECIFICATION_V20_6_5.md
- CURSOR_IMPLEMENTATION_PLAN_V20_8_5.md (implements V20.6.4)
- EP-D-002_RUNTIME_RECONCILIATION_V20_6_1.md

---

# What's New in V20.6.1

This version establishes **Organ Alignment** — synchronizing companion document references and classifying the epilogue as non-normative.

### Key Changes

| Change | Description | Impact |
|--------|-------------|--------|
| **Version Matrix** | All companion refs synchronized | Suite consistency |
| **Epilogue Classification** | Marked as non-normative | Epistemic clarity |

**Note:** No entities, relationships, or gates changed. This is reference and classification alignment only.

---

# What's New in V20.6.0

This version adds **Runtime Reconciliation (EP-D-002)** — introducing Layer 14 and observational truth capabilities. All EP-D-002 additions (E84-E85, R113-R114, G-RUNTIME) are **DORMANT** until Track D.9 activation.

### Key Changes

| Change | Description | Impact |
|--------|-------------|--------|
| **Layer 14** | Runtime Reconciliation layer added | +1 layer (13→14) |
| **Category 21** | Runtime Reconciliation category added | +1 category (20→21) |
| **Entities** | E84-E85 added (dormant) | +2 entities (81→83) |
| **Relationships** | R113-R114 added (dormant) | +2 relationships (112→114) |
| **Gates** | G-RUNTIME added (dormant) | +1 gate (20→21) |
| **Story D.9** | Observational Truth Layer story | +1 story, +7 ACs |

**For complete EP-D-002 specification, see:** `docs/integrations/EP-D-002_RUNTIME_RECONCILIATION_V20_6_1.md`

---

# What's New in V20.5.1

This version **corrects entity ID references** — ensuring companion documents reference actual Epic 64 base schema entities.

### The Issue That V20.5.1 Corrects

V20.5.0's Track D alignment tables in BRD/Roadmap referenced extension entity IDs (E71-E73, E80-E83) instead of base schema entities. This version clarifies:

| Base Governance Entities | ID | Purpose |
|--------------------------|-----|---------|
| PolicyRule | E43 | Behavioral constraint |
| PolicyDomain | E44 | Rule category |
| AutonomyLevel | E45 | Self-modification tier |
| Person | E46 | Human actor |
| Role | E47 | Permission group |
| License | E48 | Software license |

### Entity Architecture

```
BASE SCHEMA (Epic 64): 67 entities
├── E01-E60: Layers 1-12 (Requirements through Compliance/UX)
├── E91-E97: Layer 13 (Operations)
└── Gap E61-E90: Reserved for Extension Protocol additions

EXTENSION PROTOCOL ADDITIONS (16 entities):
├── EP-C-001: E61-E63 (3 entities)
│   └── SemanticConcept, BehaviorModel, SemanticAssertion
├── EP-D-001: E64-E67, E71-E73, E80-E83 (11 entities)
│   ├── E64-E67: ComplianceRule, ComplianceEvidence, ComplianceViolation, ComplianceReport
│   ├── E71-E73: PolicyDecision, PolicyOverride, AuditEntry
│   └── E80-E83: AutonomyEvent, EscalationRequest, ApprovalRecord, DelegationChain
└── EP-D-002: E84-E85 (2 entities) [DORMANT]
    └── ExecutionTrace, RuntimeCall

TOTAL: 67 base + 16 extensions = 83 entities
```

### V20.5.1 Statistics (Unchanged)

| Metric | Value |
|--------|-------|
| **Entities** | 67 (base) |
| **Relationships** | 100 |
| **Layers** | 13 |
| **Categories** | 20 |
| **Gates** | 20 |

---

# What's New in V20.5

This version establishes **story numbering alignment** — no schema changes, only companion document version references updated for cross-document consistency.

### Key Changes

| Change | Description | Impact |
|--------|-------------|--------|
| **Track D Story Alignment** | D.5-D.8 numbering synchronized across Roadmap and Cursor Plan | Cross-document consistency |
| **Companion References** | Updated to V20.5 | Version parity maintained |

### V20.5 Statistics (Unchanged from V20.1)

| Metric | Value |
|--------|-------|
| **Entities** | 67 |
| **Relationships** | 100 |
| **Layers** | 13 |
| **Categories** | 20 |
| **Gates** | 20 |

---

# What's New in V20.1

This version adds **Operations & Simulation** — extending the graph with runtime operations entities and simulation capabilities to enable temporal resilience testing before autonomous operation.

### Key Changes

| Change | Description | Impact |
|--------|-------------|--------|
| **Layer 13** | Operations layer added (E91-E97) | +7 entities |
| **Category 20** | Operations relationships (R104-R112) | +9 relationships |
| **Gates** | G-SIMULATION, G-COGNITIVE, G-OPS | +3 gates (17→20) |
| **Entity Count** | 60 → 67 | Operations entities |
| **Relationship Count** | 91 → 100 | Operations relationships |

### V20.1 Statistics

| Metric | V20.0 | V20.1 | Delta |
|--------|-------|-------|-------|
| **Entities** | 60 | **67** | +7 |
| **Relationships** | 91 | **100** | +9 |
| **Layers** | 12 | **13** | +1 |
| **Categories** | 19 | **20** | +1 |
| **Gates** | 17 | **20** | +3 |

### Why Operations & Simulation?

Without Layer 13:
- Graph understands code but not production behavior
- No traceability from requirements to SLOs
- No way to test autonomous behavior over time

With Layer 13:
- Production incidents trace to requirements
- Simulation validates temporal resilience
- Cognitive engine health feeds decision-making

---

# What's New in V20.0

This version establishes **unified parity** — all companion documents synchronized at V20.0.0.

### Key Changes

| Change | Description | Impact |
|--------|-------------|--------|
| **Version Parity** | All docs now V20.0.0 | Unambiguous cross-references |
| **Gate Registry** | Added Appendix D with 17 gates | Complete gate specification |
| **Gate Count** | Updated to 17 | Matches all companion docs |

---

# What's New in V10.0

This is the **Synchronized Edition** — ensuring complete alignment between the Epic 64 specification and the BRD.

### Changes from V3.2

| Change | Old Value | New Value |
|--------|-----------|-----------|
| **Version** | 3.2.0 | 10.0.0 |
| **Entity Count (Final Stats)** | 56 | 60 |
| **Relationship Count (Final Stats)** | 82 | 91 |
| **Layer Count (Final Stats)** | 10 | 12 |
| **Category Count (Final Stats)** | 16 | 19 |
| **Companion Reference** | None | BRD_V10_0_COMPLETE.md |

### Why V10.0?

Version 10.0 aligns with BRD V10.0 to establish synchronized versioning between documents. This eliminates confusion about which versions are compatible and ensures both documents reflect identical schema definitions.

### Verification

All counts in this document have been verified against:
- Entity definitions in Part II (13 layers, E01-E60, E91-E97)
- Relationship definitions in Part III (20 categories, R01-R91, R104-R112)
- Appendix A (67 entities listed)
- Appendix B (100 relationships listed)

---

# Prologue: On the Nature of Understanding

A nervous system does not merely connect—it *knows*. It carries not just signals but certainty, not just connections but confidence in those connections. When you touch a flame, your nervous system doesn't just report "heat detected"—it reports urgency, location, intensity, and recommended action, all in a single integrated pulse of understanding.

This document defines the nervous system of autonomous software development. It specifies not merely what entities exist and how they connect, but *how certain we are* about each connection, *where that certainty comes from*, and *how certainty evolves* as the system learns from reality.

Without this nervous system, Sophia has files. With it, Sophia has understanding.

Without confidence in connections, Sophia guesses. With it, Sophia *knows what it knows and knows what it doesn't know*.

This is the difference between intelligence and wisdom.

---

# Part I: Foundational Principles

## 1.1 The Purpose of the Graph

The Unified Traceability Graph exists to answer one question with perfect accuracy:

> **"When anything changes, what else must change, and how certain are we?"**

This question has four components:
1. **What exists** — The entities in the system
2. **What connects** — The relationships between entities  
3. **How certain** — The confidence in each relationship
4. **What changes** — The impact when any entity is modified

A graph that answers only the first two is a database.
A graph that answers all four is a nervous system.

## 1.2 The Three Laws of Traceability

**First Law: Nothing Exists Without Justification**
Every artifact in the system traces to a requirement that demanded it. Code without requirements is dead weight. Requirements without code are broken promises.

**Second Law: Nothing Changes Without Known Impact**
Every modification propagates through the graph with calculable effect. No change is safe until its blast radius is understood.

**Third Law: Nothing Is Certain Without Evidence**
Every relationship carries a confidence score derived from its provenance. Explicit markers provide certainty. Inference provides probability. Hypothesis provides direction for investigation.

## 1.3 The Nature of Certainty

Not all knowledge is equal. The graph must distinguish:

| Provenance | Confidence | Source | Example |
|------------|------------|--------|---------|
| **Explicit** | 100% | Human-authored markers | `@implements STORY-54.1` |
| **Structural** | 95-99% | Static code analysis | Import/export parsing |
| **Inferred** | 70-94% | Semantic analysis | SQL → table relationships |
| **Hypothesized** | 30-69% | Runtime correlation | Incident → suspected cause |
| **Speculative** | <30% | Pattern matching | Similar code might relate |

A nervous system that treats hypotheses as facts will make confident mistakes.
A nervous system that tracks confidence will know what it knows.

## 1.4 The Complete Lifecycle

The graph models the complete software lifecycle as a closed loop:

```
                    ┌─────────────────────────────────────────┐
                    │                                         │
                    ▼                                         │
             ┌──────────┐                                     │
             │REQUIREMENTS│                                    │
             │  Intent   │                                     │
             └────┬─────┘                                     │
                  │                                           │
                  ▼                                           │
             ┌──────────┐                                     │
             │  DESIGN   │                                     │
             │Architecture│                                    │
             └────┬─────┘                                     │
                  │                                           │
                  ▼                                           │
             ┌──────────┐                                     │
             │   CODE    │                                     │
             │  Reality  │                                     │
             └────┬─────┘                                     │
                  │                                           │
                  ▼                                           │
             ┌──────────┐                                     │
             │   TEST    │                                     │
             │   Proof   │                                     │
             └────┬─────┘                                     │
                  │                                           │
                  ▼                                           │
             ┌──────────┐                                     │
             │  DEPLOY   │                                     │
             │  Release  │                                     │
             └────┬─────┘                                     │
                  │                                           │
                  ▼                                           │
             ┌──────────┐         ┌──────────┐               │
             │PRODUCTION │────────▶│ FEEDBACK │───────────────┘
             │  Runtime  │         │ Learning │
             └──────────┘         └──────────┘

    ════════════════════════════════════════════════════════
                      GOVERNANCE LAYER
         Policies • Safety • Risk • Certification
    ════════════════════════════════════════════════════════
```

The feedback loop is not an addition—it is what makes the system alive.

---

# Part II: The Thirteen Layers

The graph organizes all software artifacts into thirteen layers. Each layer represents a distinct aspect of software reality. Together they form a complete model of what exists.

## Layer 1: Requirements — What We Intend

*The layer of intent. Every artifact traces here.*

| ID | Entity | Purpose | ID Format |
|----|--------|---------|-----------|
| E01 | **Epic** | Major capability grouping | `EPIC-{number}` |
| E02 | **Story** | User-facing requirement | `STORY-{epic}.{number}` |
| E03 | **AcceptanceCriterion** | Testable condition defining done | `AC-{epic}.{story}.{number}` |
| E04 | **Constraint** | Non-functional requirement | `CNST-{type}-{number}` |
| E05 | **Assumption** | Documented dependency on external truth | `ASUM-{number}` |

**Attributes:**

```typescript
interface Epic {
  id: string;                    // EPIC-54
  title: string;                 // "Ground Truth Engine"
  generation: string;            // "Gnosis" | "Dikaios" | "Sophia"
  priority: "P0" | "P1" | "P2";
  status: "draft" | "approved" | "implementing" | "complete" | "deprecated";
  owner: PersonId;
  stories: StoryId[];
}

interface Story {
  id: string;                    // STORY-54.1
  epic_id: EpicId;
  title: string;
  description: string;
  priority: "P0" | "P1" | "P2";
  status: "draft" | "approved" | "implementing" | "complete" | "deprecated";
  acceptance_criteria: AcceptanceCriterionId[];
  constraints: ConstraintId[];
}

interface AcceptanceCriterion {
  id: string;                    // AC-54.1.2
  story_id: StoryId;
  description: string;
  testable: boolean;
  status: "pending" | "implemented" | "verified" | "failed";
}

interface Constraint {
  id: string;                    // CNST-PERF-001
  type: "performance" | "security" | "reliability" | "scalability" | "cost";
  description: string;
  threshold: number;
  unit: string;
  measurement_method: string;
}

interface Assumption {
  id: string;                    // ASUM-001
  description: string;
  validated: boolean;
  risk_if_false: "low" | "medium" | "high" | "critical";
  validation_method: string;
}
```

**Invariants:**
- Every Story belongs to exactly one Epic
- Every AcceptanceCriterion belongs to exactly one Story
- Every Story has at least one AcceptanceCriterion
- Status transitions are monotonic (cannot go backward without deprecation)

---

## Layer 2: Design — How We Plan

*The layer of architecture. Bridges intent to reality.*

| ID | Entity | Purpose | ID Format |
|----|--------|---------|-----------|
| E06 | **TechnicalDesign** | Specification document | `TDD-{version}` |
| E07 | **InterfaceContract** | API or interface spec | `IFACE-{name}` |
| E08 | **DataSchema** | Type or data structure definition | `SCHEMA-{name}` |
| E09 | **DatabaseSchema** | Database table or view | `DBTBL-{name}` |
| E10 | **ArchitectureDecision** | Recorded decision (ADR) | `ADR-{number}` |

**Attributes:**

```typescript
interface TechnicalDesign {
  id: string;                    // TDD-2.7
  title: string;
  version: string;
  status: "draft" | "approved" | "superseded";
  sections: TDDSection[];
  stories_addressed: StoryId[];
}

interface InterfaceContract {
  id: string;                    // IFACE-IManifestGenerator
  name: string;
  version: SemVer;
  stability: "experimental" | "stable" | "deprecated";
  methods: MethodSignature[];
  breaking_changes: BreakingChange[];
}

interface DataSchema {
  id: string;                    // SCHEMA-FileManifest
  name: string;
  language: "typescript" | "json" | "protobuf" | "graphql";
  fields: Field[];
  version: SemVer;
}

interface DatabaseSchema {
  id: string;                    // DBTBL-file_manifests
  name: string;
  columns: Column[];             // Nested type, not separate entity
  indexes: Index[];
  foreign_keys: ForeignKey[];
  constraints: DBConstraint[];
}

// Column is a nested type within DatabaseSchema, not a first-class entity
interface Column {
  name: string;
  type: string;
  nullable: boolean;
  default?: any;
  primary_key: boolean;
  references?: ForeignKeyRef;
}

interface ArchitectureDecision {
  id: string;                    // ADR-007
  title: string;
  status: "proposed" | "accepted" | "deprecated" | "superseded";
  context: string;
  decision: string;
  consequences: string[];
  superseded_by?: ADRId;
}
```

**Invariants:**
- Design artifacts trace to at least one Requirement
- ADRs are immutable once accepted (supersede, don't edit)
- Interface contracts follow semantic versioning
- Breaking changes require major version bump

---

## Layer 3: Implementation — What We Built

*The layer of reality. Where design becomes code.*

| ID | Entity | Purpose | ID Format |
|----|--------|---------|-----------|
| E11 | **SourceFile** | Code file | `FILE-{path}` |
| E12 | **Function** | Function or method | `FUNC-{file}:{name}` |
| E13 | **Class** | Class definition | `CLASS-{file}:{name}` |
| E14 | **Interface** | TypeScript/language interface | `TYPE-{file}:{name}` |
| E15 | **Module** | Package or bounded context | `MOD-{name}` |
| E16 | **APIEndpoint** | HTTP/RPC endpoint | `API-{method}-{path}` |
| E17 | **PipelineStep** | CI/CD or processing stage | `PIPE-{name}` |
| E18 | **Migration** | Database migration | `MIG-{version}` |
| E19 | **ExternalPackage** | Third-party dependency | `PKG-{name}@{version}` |

**Attributes:**

```typescript
interface SourceFile {
  id: string;                    // FILE-src/v265/manifest.ts
  path: string;
  language: string;
  size_bytes: number;
  line_count: number;
  content_hash: string;          // SHA-256 for integrity
  last_modified: timestamp;
}

interface Function {
  id: string;                    // FUNC-src/v265/manifest.ts:generateManifest
  name: string;
  file_id: SourceFileId;
  line_start: number;
  line_end: number;
  parameters: Parameter[];
  return_type: string;
  complexity: number;            // Cyclomatic complexity
  is_exported: boolean;
}

interface Class {
  id: string;                    // CLASS-src/v265/manifest.ts:ManifestGenerator
  name: string;
  file_id: SourceFileId;
  line_start: number;
  line_end: number;
  methods: FunctionId[];
  properties: Property[];
  extends?: ClassId;
  implements: InterfaceId[];
}

interface Module {
  id: string;                    // MOD-@gnosis/ground-truth
  name: string;
  version: SemVer;
  entry_point: SourceFileId;
  exports: (FunctionId | ClassId | TypeId)[];
  internal: boolean;             // Internal vs published
}

interface APIEndpoint {
  id: string;                    // API-GET-/api/manifests
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  parameters: Parameter[];
  request_schema?: SchemaId;
  response_schema?: SchemaId;
  authentication: "none" | "required" | "optional";
  rate_limit?: RateLimit;
}

interface PipelineStep {
  id: string;                    // PIPE-build-and-test
  name: string;
  type: "build" | "test" | "deploy" | "analyze" | "notify";
  inputs: string[];
  outputs: string[];
  triggers: Trigger[];
  timeout_minutes: number;
  autonomy_level: AutonomyLevelId;
}

interface Migration {
  id: string;                    // MIG-002
  version: string;
  description: string;
  up_script: string;
  down_script: string;
  applied_at?: timestamp;
  checksum: string;
}

interface ExternalPackage {
  id: string;                    // PKG-lodash@4.17.21
  name: string;
  version: SemVer;
  registry: "npm" | "pypi" | "maven" | "cargo" | "go";
  checksum: string;
  direct: boolean;               // Direct vs transitive dependency
  dev_only: boolean;             // Dev dependency vs production
}
```

**Invariants:**
- Every SourceFile has a content hash for integrity verification
- Functions and Classes belong to exactly one SourceFile
- Migrations are ordered and irreversible in production
- Exported entities must have documentation
- External packages track both direct and transitive dependencies

---

## Layer 4: Configuration — How It Adapts

*The layer of environment. How the system adjusts to context.*

| ID | Entity | Purpose | ID Format |
|----|--------|---------|-----------|
| E20 | **ConfigKey** | Application configuration | `CFG-{key}` |
| E21 | **EnvironmentVariable** | Environment variable | `ENV-{name}` |
| E22 | **FeatureFlag** | Feature toggle | `FLAG-{name}` |
| E23 | **Secret** | Sensitive credential | `SCRT-{name}` |
| E24 | **Environment** | Deployment environment | `ENVMT-{name}` |
| E25 | **ResourceEstimate** | Compute/cost projection | `RES-{id}` |
| E26 | **BudgetConstraint** | Cost limit | `BUDGET-{id}` |

**Attributes:**

```typescript
interface ConfigKey {
  id: string;                    // CFG-HASH_ALGORITHM
  key: string;
  default_value: any;
  type: "string" | "number" | "boolean" | "json";
  description: string;
  mutable_at_runtime: boolean;
  sensitive: boolean;
}

interface FeatureFlag {
  id: string;                    // FLAG-enable_v265
  name: string;
  default_enabled: boolean;
  description: string;
  rollout_percentage: number;    // 0-100
  expires_at?: timestamp;
  owner: PersonId;
}

interface Secret {
  id: string;                    // SCRT-DATABASE_PASSWORD
  name: string;
  rotation_policy: "manual" | "30d" | "90d" | "yearly";
  last_rotated: timestamp;
  vault_path: string;
  accessed_by: FunctionId[];     // Audit trail
}

interface Environment {
  id: string;                    // ENVMT-production
  name: string;
  type: "development" | "staging" | "production";
  config_overrides: ConfigOverride[];
  url: string;
}

interface ResourceEstimate {
  id: string;                    // RES-001
  description: string;
  cpu_hours: number;
  memory_gb_hours: number;
  storage_gb: number;
  cost_usd: number;
  confidence: number;            // 0.0 - 1.0
  basis: string;                 // How estimate was derived
}

interface BudgetConstraint {
  id: string;                    // BUDGET-Q1-2025
  name: string;
  limit_usd: number;
  period: "monthly" | "quarterly" | "yearly" | "project";
  current_spend: number;
  alert_thresholds: number[];    // e.g., [50, 75, 90, 100]
}
```

**Invariants:**
- Secrets never appear in logs, errors, or tracebacks
- Feature flags have expiration dates (no permanent flags)
- Resource estimates include confidence levels
- Budget alerts trigger before limit reached

---

## Layer 5: Verification — How We Prove

*The layer of proof. Evidence that reality matches intent.*

| ID | Entity | Purpose | ID Format |
|----|--------|---------|-----------|
| E27 | **TestFile** | Test source file | `TSTF-{path}` |
| E28 | **TestSuite** | Logical test grouping | `TSTS-{name}` |
| E29 | **TestCase** | Individual test | `TC-{suite}:{name}` |
| E30 | **TestFixture** | Reusable test data | `FIXTURE-{name}` |
| E31 | **Benchmark** | Performance test | `BENCH-{name}` |
| E32 | **Mock** | Test double | `MOCK-{name}` |

**Attributes:**

```typescript
interface TestFile {
  id: string;                    // TSTF-src/v265/manifest.test.ts
  path: string;
  framework: "jest" | "mocha" | "pytest" | "vitest";
  suite_count: number;
  status: "passing" | "failing" | "skipped";
}

interface TestSuite {
  id: string;                    // TSTS-ManifestGeneration
  name: string;
  file_id: TestFileId;
  test_count: number;
  story_refs: StoryId[];         // Stories this suite tests
  setup?: FunctionId;
  teardown?: FunctionId;
  tags: string[];
}

interface TestCase {
  id: string;                    // TC-ManifestGeneration:lists-all-files
  name: string;
  suite_id: TestSuiteId;
  ac_refs: AcceptanceCriterionId[];  // ACs this test verifies
  status: "pending" | "passing" | "failing" | "skipped";
  duration_ms?: number;
  last_run: timestamp;
  flaky: boolean;                // Has intermittent failures
}

interface Benchmark {
  id: string;                    // BENCH-manifest-generation-1000-files
  name: string;
  description: string;
  metric: string;                // "throughput" | "latency" | "memory"
  threshold: number;
  unit: string;
  baseline: number;
  tolerance_percent: number;
  constraint_ref?: ConstraintId; // NFR this validates
}

interface Mock {
  id: string;                    // MOCK-fileSystem
  name: string;
  target_type: string;
  behavior: string;
  stateful: boolean;
}
```

**Invariants:**
- Every AcceptanceCriterion has at least one verifying TestCase
- Test status is computed from execution, not manually set
- Flaky tests are tracked and remediated
- Benchmarks link to Constraints they validate

---

## Layer 6: Quality & Risk — How We Assure

*The layer of confidence. Managing uncertainty.*

| ID | Entity | Purpose | ID Format |
|----|--------|---------|-----------|
| E33 | **RiskCheckpoint** | Risk evaluation gate | `RISK-{id}` |
| E34 | **CertificationGate** | Version milestone | `GATE-{version}` |
| E35 | **QualityMetric** | Measured quality attribute | `METRIC-{name}` |
| E36 | **CertificationReport** | Gate passage evidence | `CRPT-{id}` |
| E37 | **Vulnerability** | Known security flaw | `VULN-{cve}` |

**Attributes:**

```typescript
interface RiskCheckpoint {
  id: string;                    // RISK-V27-semantic-grounding
  name: string;
  description: string;
  criteria: RiskCriterion[];
  threshold: number;             // Acceptable risk score
  owner: PersonId;
  status: "open" | "mitigated" | "accepted" | "closed";
  review_frequency: "weekly" | "monthly" | "quarterly";
}

interface CertificationGate {
  id: string;                    // GATE-V2.65
  version: SemVer;
  criteria: GateCriterion[];
  required_stories: StoryId[];
  blocking_issues: IssueId[];
  status: "pending" | "passed" | "failed";
  certified_at?: timestamp;
  certified_by?: PersonId;
}

interface QualityMetric {
  id: string;                    // METRIC-test-coverage
  name: string;
  description: string;
  current_value: number;
  target: number;
  unit: string;
  trend: "improving" | "stable" | "declining";
  last_updated: timestamp;
}

interface CertificationReport {
  id: string;                    // CRPT-V265-001
  gate_id: CertificationGateId;
  timestamp: timestamp;
  results: GateResult[];
  evidence: Evidence[];
  pass: boolean;
  signed_by: PersonId;
}

interface Vulnerability {
  id: string;                    // VULN-CVE-2024-1234
  cve_id: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  affected_packages: PackageVersion[];
  remediation: string;
  status: "open" | "mitigated" | "resolved" | "accepted";
  discovered_at: timestamp;
  resolved_at?: timestamp;
}
```

**Invariants:**
- Gates block releases until all criteria pass
- Critical vulnerabilities block production deployment
- Quality metrics have historical trend data
- Risk checkpoints require periodic review

---

## Layer 7: Documentation — How We Explain

*The layer of communication. Making understanding transferable.*

| ID | Entity | Purpose | ID Format |
|----|--------|---------|-----------|
| E38 | **DocSection** | Documentation section | `DOC-{path}#{section}` |
| E39 | **APIDoc** | Endpoint documentation | `APIDOC-{endpoint}` |
| E40 | **UserGuide** | End-user documentation | `GUIDE-{name}` |
| E41 | **Runbook** | Operational procedure | `RUNBOOK-{name}` |
| E42 | **ContractClause** | Customer commitment | `CLAUSE-{id}` |

**Attributes:**

```typescript
interface DocSection {
  id: string;                    // DOC-api-reference.md#authentication
  path: string;
  section: string;
  title: string;
  content_hash: string;
  last_updated: timestamp;
  author: PersonId;
}

interface APIDoc {
  id: string;                    // APIDOC-GET-/api/manifests
  endpoint_id: APIEndpointId;
  description: string;
  examples: Example[];
  deprecated: boolean;
  deprecation_notice?: string;
}

interface UserGuide {
  id: string;                    // GUIDE-getting-started
  name: string;
  path: string;
  audience: "developer" | "operator" | "end-user";
  version: SemVer;
  sections: string[];
}

interface Runbook {
  id: string;                    // RUNBOOK-incident-response
  name: string;
  path: string;
  triggers: string[];
  steps: RunbookStep[];
  escalation: EscalationPath;
}

interface ContractClause {
  id: string;                    // CLAUSE-SLA-001
  contract_name: string;
  clause_number: string;
  text: string;
  guarantees: Guarantee[];
  penalties: Penalty[];
  effective_date: timestamp;
  expiration_date?: timestamp;
}
```

**Invariants:**
- Public APIs require documentation
- Runbooks exist for every production procedure
- Contract clauses trace to implementing Stories and PolicyRules
- Documentation freshness tracked via content hash

---

## Layer 8: Governance — How We Constrain

*The layer of rules. Bounding behavior within acceptable limits.*

| ID | Entity | Purpose | ID Format |
|----|--------|---------|-----------|
| E43 | **PolicyRule** | Behavioral constraint | `RULE-{tier}-{id}` |
| E44 | **PolicyDomain** | Rule category | `DOMAIN-{name}` |
| E45 | **AutonomyLevel** | Self-modification tier | `AUTON-{level}` |
| E46 | **Person** | Human actor | `PERSON-{id}` |
| E47 | **Role** | Permission group | `ROLE-{name}` |
| E48 | **License** | Software license | `LIC-{spdx}` |

**Attributes:**

```typescript
interface PolicyRule {
  id: string;                    // RULE-TIER1-001
  tier: 1 | 2 | 3;               // 1=immutable, 2=approval, 3=advisory
  domain_id: PolicyDomainId;
  description: string;
  condition: string;             // When this rule applies
  action: "block" | "warn" | "audit" | "allow";
  severity: "critical" | "high" | "medium" | "low";
  rationale: string;
}

interface PolicyDomain {
  id: string;                    // DOMAIN-safety
  name: string;
  description: string;
  rules: PolicyRuleId[];
  owner: PersonId;
}

interface AutonomyLevel {
  id: string;                    // AUTON-3
  level: number;                 // 0-5
  name: string;
  description: string;
  permissions: Permission[];
  restrictions: Restriction[];
  approval_required: boolean;
  human_oversight: "none" | "audit" | "approval" | "realtime";
}

interface Person {
  id: string;                    // PERSON-001
  name: string;
  email: string;
  roles: RoleId[];
  credentials: Credential[];
  active: boolean;
}

interface Role {
  id: string;                    // ROLE-approver
  name: string;
  description: string;
  permissions: Permission[];
  members: PersonId[];
  inherits_from?: RoleId;
}

interface License {
  id: string;                    // LIC-MIT
  spdx_id: string;
  name: string;
  type: "permissive" | "copyleft" | "proprietary" | "public-domain";
  obligations: string[];
  compatible_with: LicenseId[];
  incompatible_with: LicenseId[];
}
```

**Invariants:**
- Tier-1 rules require human approval to modify
- Autonomy levels are hierarchical
- License compatibility checked before dependency addition
- All policy decisions are auditable
- Every Person's roles are explicitly tracked

---

## Layer 9: Provenance — How It Evolved

*The layer of history. Tracing the path to the present.*

| ID | Entity | Purpose | ID Format |
|----|--------|---------|-----------|
| E49 | **ReleaseVersion** | Software release | `REL-{version}` |
| E50 | **Commit** | Atomic code change | `COMMIT-{sha}` |
| E51 | **PullRequest** | Code review unit | `PR-{number}` |
| E52 | **ChangeSet** | Logical change group | `CHGSET-{id}` |

**Attributes:**

```typescript
interface ReleaseVersion {
  id: string;                    // REL-V2.65
  version: SemVer;
  release_date: timestamp;
  stories_included: StoryId[];
  commits_included: CommitId[];
  changelog: string;
  breaking_changes: BreakingChange[];
  rollback_procedure: string;
}

interface Commit {
  id: string;                    // COMMIT-abc123def456
  sha: string;
  message: string;
  author: PersonId;
  timestamp: timestamp;
  files_changed: FileChange[];
  stories_referenced: StoryId[];  // From commit message parsing
}

interface PullRequest {
  id: string;                    // PR-147
  number: number;
  title: string;
  description: string;
  author: PersonId;
  reviewers: PersonId[];
  commits: CommitId[];
  status: "open" | "merged" | "closed";
  merged_at?: timestamp;
  approved_by: PersonId[];
}

interface ChangeSet {
  id: string;                    // CHGSET-feature-manifest-v2
  name: string;
  description: string;
  commits: CommitId[];
  stories: StoryId[];
  author: PersonId;
  created_at: timestamp;
}
```

**Invariants:**
- Commits are immutable
- Pull requests require review before merge
- Release versions follow semantic versioning
- Breaking changes documented explicitly
- ChangeSets group related commits for logical tracking

---

## Layer 10: Feedback — How We Learn

*The layer of reality. What production teaches us.*

| ID | Entity | Purpose | ID Format |
|----|--------|---------|-----------|
| E53 | **Incident** | Production failure | `INC-{id}` |
| E54 | **BugReport** | User-reported defect | `BUG-{id}` |
| E55 | **UserFeedback** | Feature request or comment | `FDBK-{id}` |
| E56 | **ProductionMetric** | Runtime measurement | `PMET-{name}` |

**Attributes:**

```typescript
interface Incident {
  id: string;                    // INC-2024-0147
  severity: "SEV1" | "SEV2" | "SEV3" | "SEV4";
  title: string;
  description: string;
  detected_at: timestamp;
  resolved_at?: timestamp;
  duration_minutes?: number;
  timeline: TimelineEntry[];
  root_cause?: RootCauseAnalysis;
  customer_impact: string;
  postmortem_url?: string;
}

interface RootCauseAnalysis {
  summary: string;
  contributing_factors: ContributingFactor[];
  corrective_actions: CorrectiveAction[];
  prevention_measures: PreventionMeasure[];
}

interface ContributingFactor {
  description: string;
  entity_id?: EntityId;          // Code, config, etc. that contributed
  confidence: number;            // 0.0 - 1.0
  verified: boolean;
}

interface BugReport {
  id: string;                    // BUG-5678
  reporter: string;
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  reproduction_steps: string[];
  expected_behavior: string;
  actual_behavior: string;
  status: "new" | "confirmed" | "in-progress" | "resolved" | "wont-fix";
  related_ac?: AcceptanceCriterionId;
}

interface UserFeedback {
  id: string;                    // FDBK-9012
  source: "support" | "survey" | "social" | "interview" | "analytics";
  sentiment: "positive" | "neutral" | "negative";
  category: "feature-request" | "complaint" | "praise" | "question";
  content: string;
  actionable: boolean;
  generated_story?: StoryId;     // If feedback spawned a story
}

interface ProductionMetric {
  id: string;                    // PMET-api-latency-p99
  name: string;
  description: string;
  current_value: number;
  unit: string;
  timestamp: timestamp;
  source: string;                // Monitoring system
  constraint_ref?: ConstraintId; // NFR this validates
  threshold_breach: boolean;
}
```

**Invariants:**
- Incidents require post-mortem within SLA
- Bug reports trace to failing acceptance criteria when possible
- Production metrics validate constraints in real-time
- Feedback-generated stories maintain traceability

---

## Layer 11: Legal — How We Comply

*The layer of restrictions. Export controls, geographic limits, use-case boundaries.*

| ID | Entity | Purpose | ID Format |
|----|--------|---------|-----------|
| E57 | **LegalRestriction** | Export/use/geographic restriction | `RESTRICT-{type}-{id}` |

**Attributes:**

```typescript
interface LegalRestriction {
  id: string;                    // RESTRICT-export-ITAR-001
  type: "export" | "geographic" | "use_case" | "industry";
  name: string;                  // e.g., "ITAR", "EAR", "GDPR", "no-military"
  description: string;
  jurisdiction: string[];        // e.g., ["US", "EU"]
  applies_to: string[];          // e.g., ["encryption", "healthcare", "minors"]
  severity: "blocking" | "warning" | "informational";
  regulation_url?: string;
  effective_date?: Date;
}
```

**Invariants:**
- Export restrictions checked before deployment target selection
- Geographic restrictions enforced at infrastructure provisioning
- Use-case restrictions validated during code generation
- All restrictions traced to authoritative regulation source

---

## Layer 12: Compliance & UX — How We Ensure Quality

*The layer of standards. Accessibility, design systems, user experience rules.*

| ID | Entity | Purpose | ID Format |
|----|--------|---------|-----------|
| E58 | **AccessibilityRequirement** | WCAG/Section 508 criterion | `A11Y-{standard}-{criterion}` |
| E59 | **UXGuideline** | Design system rule | `UX-{category}-{id}` |
| E60 | **DesignSystem** | Design token source | `DSYS-{name}` |

**Attributes:**

```typescript
interface AccessibilityRequirement {
  id: string;                    // A11Y-WCAG21-1.1.1
  standard: "WCAG21" | "WCAG22" | "Section508" | "ADA";
  level: "A" | "AA" | "AAA";
  criterion: string;             // e.g., "1.1.1", "2.4.7"
  name: string;                  // e.g., "Non-text Content", "Focus Visible"
  description: string;
  success_criteria: string[];
  applies_to: ("visual" | "auditory" | "motor" | "cognitive")[];
  component_types: string[];     // e.g., ["image", "button", "form"]
  testable: boolean;
  automated_testable: boolean;   // Can axe-core detect this?
  test_procedure?: string;
}

interface UXGuideline {
  id: string;                    // UX-spacing-button-min
  category: "spacing" | "typography" | "color" | "motion" | "layout" | "interaction";
  name: string;                  // e.g., "Button Minimum Height"
  description: string;
  rationale: string;             // Why this guideline exists
  rule: string;                  // e.g., "min-height: 44px", "contrast: 4.5:1"
  examples_correct: string[];
  examples_incorrect: string[];
  design_system_id?: DesignSystemId;
  token_reference?: string;      // e.g., "$spacing-md"
  severity: "error" | "warning" | "suggestion";
  automated_check: boolean;
}

interface DesignSystem {
  id: string;                    // DSYS-tailwind-custom
  name: string;                  // e.g., "Material", "Tailwind", "Custom"
  version: string;
  source_url?: string;           // Figma, Storybook, npm package
  color_tokens: Record<string, string>;
  spacing_tokens: Record<string, string>;
  typography_tokens: Record<string, string>;
  component_library?: string;    // npm package name
}
```

**Invariants:**
- UI stories automatically linked to applicable WCAG criteria
- All UI components validated against design system
- Accessibility violations block production deployment
- Design token usage enforced over hardcoded values

---

## Layer 13: Operations — How We Run (NEW IN V20.1)

*The layer of production reality. How the system behaves in the real world.*

| ID | Entity | Purpose | ID Format |
|----|--------|---------|-----------|
| E91 | **Service** | Deployable unit | `SVC-{name}` |
| E92 | **Deployment** | Release instance | `DEPLOY-{id}` |
| E93 | **SLO** | Service level objective | `SLO-{id}` |
| E94 | **ErrorBudget** | Remaining error allowance | `ERRBUDGET-{id}` |
| E95 | **Alert** | Monitoring trigger | `ALERT-{id}` |
| E96 | **Runbook** | Operational procedure | `RUNBOOK-{id}` |
| E97 | **SimulationRun** | Temporal test execution | `SIM-{id}` |

**Attributes:**

```typescript
interface Service {
  id: string;                    // SVC-api-gateway
  name: string;                  // Human-readable name
  version: string;               // Current deployed version
  health_status: "healthy" | "degraded" | "unhealthy";
  endpoints: string[];           // API endpoints exposed
  dependencies: ServiceId[];     // Other services this depends on
  owner: PersonId;               // Service owner
  repository: string;            // Source repository
  deployment_target: EnvironmentId;
}

interface Deployment {
  id: string;                    // DEPLOY-20251211-001
  service_id: ServiceId;
  environment_id: EnvironmentId;
  timestamp: Date;
  commit_sha: string;            // Git SHA deployed
  status: "pending" | "in_progress" | "succeeded" | "failed" | "rolled_back";
  initiated_by: PersonId | "automation";
  duration_seconds?: number;
  rollback_target?: DeploymentId;
}

interface SLO {
  id: string;                    // SLO-api-latency-p99
  service_id: ServiceId;
  name: string;                  // e.g., "API Latency P99"
  target: number;                // e.g., 200 (ms)
  window: "hourly" | "daily" | "weekly" | "monthly";
  measurement: string;           // e.g., "p99_latency_ms"
  current_value?: number;
  in_compliance: boolean;
}

interface ErrorBudget {
  id: string;                    // ERRBUDGET-api-2024-Q4
  service_id: ServiceId;
  slo_id: SLOId;
  total_budget: number;          // e.g., 0.1 (10% error rate allowed)
  consumed: number;              // e.g., 0.03 (3% consumed)
  remaining: number;             // e.g., 0.07 (7% remaining)
  window_start: Date;
  window_end: Date;
  exhausted: boolean;
}

interface Alert {
  id: string;                    // ALERT-high-cpu-api
  service_id: ServiceId;
  name: string;                  // e.g., "High CPU Usage"
  severity: "critical" | "warning" | "info";
  condition: string;             // e.g., "cpu_usage > 80%"
  state: "firing" | "resolved" | "pending";
  last_triggered?: Date;
  notification_channels: string[];
}

interface Runbook {
  id: string;                    // RUNBOOK-db-failover
  title: string;                 // e.g., "Database Failover Procedure"
  incident_type: string;         // e.g., "database_outage"
  steps: RunbookStep[];
  owner: PersonId;
  last_updated: Date;
  last_used?: Date;
  estimated_duration_minutes: number;
}

interface SimulationRun {
  id: string;                    // SIM-20251211-001
  start_time: Date;
  end_time?: Date;
  status: "running" | "completed" | "failed" | "aborted";
  cycles_completed: number;
  drift_metrics: DriftMetrics;
  gate_failures: GateFailure[];
  policy_violations: PolicyViolation[];
  semantic_alignment_trajectory: number[];
  pass: boolean;
}

interface DriftMetrics {
  total_drift: number;           // Aggregate drift percentage
  drift_by_entity_type: Record<string, number>;
  drift_by_relationship_type: Record<string, number>;
  max_single_cycle_drift: number;
}
```

**Invariants:**
- Services link to source repositories via Module
- Deployments link to Commits via commit_sha
- SLOs measure Services with defined targets
- ErrorBudgets track SLO compliance over time
- Alerts monitor Services and trigger Incidents
- Runbooks document resolution procedures for Incidents
- SimulationRuns validate Graph integrity over time
- All operations entities bidirectionally link to existing graph

---

## Layer 14: Runtime Reconciliation — What Actually Happened (NEW IN V20.6.0)

*The layer of observed behavior. Reconciles static claims with runtime reality.*

> **Layer additions are rare and require: (1) epistemic category justification, (2) updates to layer registry + statistics, (3) companion-doc parity.**

**Why a New Layer?**

Layer 13 (Operations) answers: "How is the system deployed and monitored?"
Layer 14 (Runtime Reconciliation) answers: "What actually happened when code executed?"

These are conceptually distinct:
- Operations = infrastructure observability (SLOs, alerts, deployments)
- Runtime Reconciliation = behavioral evidence (call traces, execution proof)

The Third Law demands observational truth as a first-class concept. Cramming it into Operations would conflate infrastructure concerns with epistemological evidence.

| ID | Entity | Purpose | ID Format | Status |
|----|--------|---------|-----------|--------|
| E84 | **ExecutionTrace** | Runtime observation session | `TRACE-{YYYYMMDD}-{seq}` | [DORMANT] |
| E85 | **RuntimeCall** | Observed function invocation | `RCALL-{trace_id}-{seq}` | [DORMANT] |

**Attributes:**

```typescript
interface ExecutionTrace {
  // Identity
  id: string;                    // TRACE-20251214-001
  
  // Temporal bounds
  start_time: Date;
  end_time: Date;
  observation_window_hours: number;
  
  // Provenance
  environment_id: EnvironmentId; // Links to E24
  commit_sha: string;            // Links to E50
  service_id?: ServiceId;        // Links to E91 (if applicable)
  
  // Source
  coverage_source: 'instrumentation' | 'profiler' | 'apm' | 'manual';
  
  // Coverage metrics (required for R114 derivation)
  coverage_completeness: number; // 0.0-1.0
  environment_scope: 'unit' | 'integration' | 'staging' | 'production';
  
  // Aggregates
  total_calls_observed: number;
  functions_covered: number;
  functions_not_observed: number;
}

interface RuntimeCall {
  // Identity
  id: string;                    // RCALL-TRACE001-00042
  
  // Parent trace
  trace_id: ExecutionTraceId;    // Links to E84
  
  // Call participants
  caller_function_id: FunctionId; // Links to E12
  callee_function_id: FunctionId; // Links to E12
  
  // Observation data
  timestamp: Date;
  call_count: number;            // Aggregated invocations within trace
  avg_duration_ms?: number;      // Performance data if available
}
```

**Invariants:**
- ExecutionTrace must link to valid Environment (E24) and Commit (E50)
- ExecutionTrace coverage_completeness must be ≥0.70 for R114 derivation
- ExecutionTrace observation_window_hours must be ≥1.0 for R114 derivation
- RuntimeCall must link to valid ExecutionTrace (E84)
- RuntimeCall caller_function_id and callee_function_id must exist in static graph (E12)
- RuntimeCall call_count must be > 0

**Activation:** Layer 14 entities are DORMANT until Track D.9. See `docs/integrations/EP-D-002_RUNTIME_RECONCILIATION_V20_6_1.md` for complete specification.

---

## Entity Summary

| Layer | Count | Entities | Purpose |
|-------|-------|----------|---------|
| 1. Requirements | 5 | E01-E05 | What we intend |
| 2. Design | 5 | E06-E10 | How we plan |
| 3. Implementation | 9 | E11-E19 | What we built |
| 4. Configuration | 7 | E20-E26 | How it adapts |
| 5. Verification | 6 | E27-E32 | How we prove |
| 6. Quality & Risk | 5 | E33-E37 | How we assure |
| 7. Documentation | 5 | E38-E42 | How we explain |
| 8. Governance | 6 | E43-E48 | How we constrain |
| 9. Provenance | 4 | E49-E52 | How it evolved |
| 10. Feedback | 4 | E53-E56 | How we learn |
| 11. Legal | 1 | E57 | How we comply |
| 12. Compliance/UX | 3 | E58-E60 | How we ensure quality |
| 13. Operations | 7 | E91-E97 | How we run |
| 14. Runtime Reconciliation | 2 | E84-E85 | What actually happened [DORMANT] |
| **TOTAL** | **67** (base) + **16** (extensions) = **83** | | |

---

# Part III: The Relationship Model

## 3.1 Relationship Metadata

Every relationship in the graph carries metadata describing its certainty and origin:

```typescript
interface RelationshipMetadata {
  // Certainty
  confidence: number;            // 0.0 - 1.0
  provenance: Provenance;        // How we know this
  
  // Lifecycle
  created_at: timestamp;
  created_by: string;            // System or person that created
  verified: boolean;             // Human or test confirmed
  verified_at?: timestamp;
  verified_by?: PersonId;
  
  // Validity
  expires_at?: timestamp;        // For hypotheses needing validation
  superseded_by?: RelationshipId;
  
  // Audit
  evidence?: string[];           // Supporting evidence
  notes?: string;
}

type Provenance = 
  | "explicit"      // Human-authored marker (100% confidence)
  | "structural"    // Static analysis (95-99% confidence)
  | "inferred"      // Semantic analysis (70-94% confidence)
  | "hypothesized"  // Runtime correlation (30-69% confidence)
  | "speculative";  // Pattern matching (<30% confidence)
```

This metadata enables:
- **Filtering by confidence**: Impact analysis can exclude low-confidence edges
- **Validation workflows**: Hypotheses queue for human verification
- **Audit trails**: Every connection is explainable
- **Decay management**: Unverified hypotheses expire

---

## 3.2 Relationship Categories

### Category 1: Hierarchical (7 relationships)

*Structural containment—the skeleton.*

| ID | Relationship | From | To | Confidence |
|----|--------------|------|-----|------------|
| R01 | **HAS_STORY** | Epic | Story | explicit |
| R02 | **HAS_AC** | Story | AcceptanceCriterion | explicit |
| R03 | **HAS_CONSTRAINT** | Story/Epic | Constraint | explicit |
| R04 | **CONTAINS_FILE** | Module | SourceFile | structural |
| R05 | **CONTAINS_ENTITY** | SourceFile | Function/Class/Interface | structural |
| R06 | **CONTAINS_SUITE** | TestFile | TestSuite | structural |
| R07 | **CONTAINS_CASE** | TestSuite | TestCase | structural |

---

### Category 2: Requirements → Design (6 relationships)

*From intent to architecture.*

| ID | Relationship | From | To | Confidence |
|----|--------------|------|-----|------------|
| R08 | **DESIGNED_IN** | Story | TechnicalDesign | explicit |
| R09 | **SPECIFIED_IN** | AcceptanceCriterion | TechnicalDesign | explicit |
| R10 | **DECIDED_BY** | Story | ArchitectureDecision | explicit |
| R11 | **DEFINES_SCHEMA** | Story | DataSchema | explicit |
| R12 | **DEFINES_INTERFACE** | Story | InterfaceContract | explicit |
| R13 | **REQUIRES_TABLE** | Story | DatabaseSchema | inferred |

---

### Category 3: Design → Implementation (4 relationships)

*From architecture to code.*

| ID | Relationship | From | To | Confidence |
|----|--------------|------|-----|------------|
| R14 | **IMPLEMENTED_BY** | TechnicalDesign | SourceFile | explicit |
| R15 | **REALIZED_BY** | InterfaceContract | Class/Function | structural |
| R16 | **DEFINED_IN** | DataSchema | SourceFile | structural |
| R17 | **MIGRATED_BY** | DatabaseSchema | Migration | structural |

---

### Category 4: Requirements → Implementation (3 relationships)

*Direct traceability—the critical path.*

| ID | Relationship | From | To | Confidence | Marker |
|----|--------------|------|-----|------------|--------|
| R18 | **IMPLEMENTS** | SourceFile | Story | explicit | `@implements STORY-XX.YY` |
| R19 | **SATISFIES** | Function/Class | AcceptanceCriterion | explicit | `@satisfies AC-XX.YY.ZZ` |
| R20 | **IMPLEMENTS_EPIC** | Module | Epic | explicit | `@implements EPIC-XX` |

These are the most critical relationships. Without them, traceability fails.

---

### Category 5: Implementation → Implementation (7 relationships)

*Code dependencies—the call graph.*

| ID | Relationship | From | To | Confidence |
|----|--------------|------|-----|------------|
| R21 | **IMPORTS** | SourceFile | SourceFile | structural |
| R22 | **CALLS** | Function | Function | structural |
| R23 | **EXTENDS** | Class | Class | structural |
| R24 | **IMPLEMENTS_INTERFACE** | Class | Interface | structural |
| R25 | **USES** | Function | ConfigKey/Constant | structural |
| R26 | **DEPENDS_ON** | Module | Module | structural |
| R27 | **DEPENDS_EXTERNAL** | Module | ExternalPackage | structural |

---

### Category 6: Implementation → Data (8 relationships)

*Code to infrastructure.*

| ID | Relationship | From | To | Confidence |
|----|--------------|------|-----|------------|
| R28 | **READS_FROM** | Function | DatabaseSchema | inferred |
| R29 | **WRITES_TO** | Function | DatabaseSchema | inferred |
| R30 | **MIGRATES** | Migration | DatabaseSchema | structural |
| R31 | **EXPOSES** | Function | APIEndpoint | structural |
| R32 | **CALLS_API** | Function | APIEndpoint | inferred |
| R33 | **USES_CONFIG** | Function | ConfigKey | structural |
| R34 | **REQUIRES_ENV** | SourceFile | EnvironmentVariable | structural |
| R35 | **GATED_BY** | Function | FeatureFlag | structural |

---

### Category 7: Requirements → Verification (3 relationships)

*Proof of intent.*

| ID | Relationship | From | To | Confidence | Marker |
|----|--------------|------|-----|------------|--------|
| R36 | **TESTED_BY** | Story | TestSuite | explicit | `describe('STORY-XX.YY: ...')` |
| R37 | **VERIFIED_BY** | AcceptanceCriterion | TestCase | explicit | `it('AC-XX.YY.ZZ: ...')` |
| R38 | **BENCHMARKED_BY** | Constraint | Benchmark | explicit | Benchmark config |

---

### Category 8: Implementation → Verification (4 relationships)

*Proof of reality.*

| ID | Relationship | From | To | Confidence |
|----|--------------|------|-----|------------|
| R39 | **CODE_TESTED_BY** | Function/Class | TestCase | inferred |
| R40 | **USES_FIXTURE** | TestCase | TestFixture | structural |
| R41 | **MOCKS** | TestCase | Mock | structural |
| R42 | **COVERS** | TestCase | SourceFile | structural |

---

### Category 9: Requirements → Risk (4 relationships)

*Assurance of intent.*

| ID | Relationship | From | To | Confidence |
|----|--------------|------|-----|------------|
| R43 | **GUARDED_BY** | Story | RiskCheckpoint | explicit |
| R44 | **BLOCKS_GATE** | Story | CertificationGate | explicit |
| R45 | **REQUIRED_FOR** | AcceptanceCriterion | CertificationGate | explicit |
| R46 | **MEASURED_BY** | Story | QualityMetric | explicit |

---

### Category 10: Requirements → Governance (4 relationships)

*Constraint of intent.*

| ID | Relationship | From | To | Confidence |
|----|--------------|------|-----|------------|
| R47 | **CONSTRAINED_BY** | Story | PolicyRule | explicit |
| R48 | **IN_DOMAIN** | PolicyRule | PolicyDomain | explicit |
| R49 | **REQUIRES_APPROVAL** | Story | Role | explicit |
| R50 | **OWNED_BY** | Epic | Person | explicit |

---

### Category 11: Implementation → Governance (6 relationships)

*Constraint of reality.*

| ID | Relationship | From | To | Confidence | Marker |
|----|--------------|------|-----|------------|--------|
| R51 | **ENFORCES** | Function | PolicyRule | explicit | `@enforces RULE-XX` |
| R52 | **RESTRICTED_BY** | APIEndpoint | PolicyRule | explicit | Config |
| R53 | **AUDITED_BY** | Function | PolicyRule | explicit | Config |
| R54 | **CONSUMES_BUDGET** | Story | BudgetConstraint | explicit | |
| R55 | **REQUIRES_ESTIMATE** | Story | ResourceEstimate | explicit | |
| R56 | **OPERATES_AT** | Module/PipelineStep | AutonomyLevel | explicit | |

---

### Category 12: Documentation (6 relationships)

*Explanation links.*

| ID | Relationship | From | To | Confidence | Marker |
|----|--------------|------|-----|------------|--------|
| R57 | **DOCUMENTED_IN** | Story | DocSection | explicit | `<!-- @documents STORY-XX -->` |
| R58 | **API_DOCUMENTED_IN** | APIEndpoint | APIDoc | structural | OpenAPI |
| R59 | **SCHEMA_DOCUMENTED_IN** | DatabaseSchema | DocSection | explicit | |
| R60 | **CLAIMS_IMPLEMENTATION** | DocSection | Story | explicit | |
| R61 | **CONTRACT_BACKED_BY** | ContractClause | PolicyRule | explicit | |
| R62 | **CONTRACT_REQUIRES** | ContractClause | Story | explicit | |

---

### Category 13: Provenance (9 relationships)

*History links.*

| ID | Relationship | From | To | Confidence |
|----|--------------|------|-----|------------|
| R63 | **INTRODUCED_IN** | Story | ReleaseVersion | explicit |
| R64 | **CHANGED_IN** | AcceptanceCriterion | ReleaseVersion | structural |
| R65 | **DEPRECATED_IN** | Story | ReleaseVersion | explicit |
| R66 | **IMPLEMENTED_IN** | Story | Commit | inferred |
| R67 | **MODIFIED_IN** | SourceFile | Commit | structural |
| R68 | **COMMIT_IN_PR** | Commit | PullRequest | structural |
| R69 | **PR_IN_RELEASE** | PullRequest | ReleaseVersion | structural |
| R70 | **GROUPS** | ChangeSet | Commit | explicit |
| R71 | **ADDRESSES** | ChangeSet | Story | explicit |

---

### Category 14: Feedback → Requirements (6 relationships)

*The learning loop—closing the circle.*

| ID | Relationship | From | To | Confidence |
|----|--------------|------|-----|------------|
| R72 | **REPORTED_AGAINST** | BugReport | Story/AC | explicit |
| R73 | **ROOT_CAUSE** | Incident | SourceFile/Function | hypothesized→verified |
| R74 | **CONTRIBUTED_TO** | SourceFile/Function | Incident | hypothesized |
| R75 | **TRIGGERS_REFINEMENT** | UserFeedback | Story | explicit |
| R76 | **VALIDATES_CONSTRAINT** | ProductionMetric | Constraint | structural |
| R77 | **INVALIDATES_AC** | Incident | AcceptanceCriterion | hypothesized→verified |

**Special handling for R73, R74, R77:**

These relationships begin as hypotheses and transition to verified:

```typescript
interface CausalRelationship extends RelationshipMetadata {
  // Initial hypothesis
  initial_confidence: number;
  hypothesis_source: "correlation" | "stack_trace" | "logs" | "human";
  
  // Verification
  verification_method?: "code_review" | "test" | "reproduction" | "expert";
  verified: boolean;
  verified_at?: timestamp;
  
  // If not verified, expires
  expires_at: timestamp;        // Default: created_at + 7 days
}
```

---

### Category 15: Security & Supply Chain (4 relationships)

*Safety of dependencies.*

| ID | Relationship | From | To | Confidence |
|----|--------------|------|-----|------------|
| R78 | **HAS_VULNERABILITY** | ExternalPackage | Vulnerability | structural |
| R79 | **LICENSED_AS** | ExternalPackage | License | structural |
| R80 | **VIOLATES_POLICY** | License | PolicyRule | structural |
| R81 | **REMEDIATES** | Commit | Vulnerability | explicit |

---

### Category 16: People & Roles (1 relationship)

*Human governance.*

| ID | Relationship | From | To | Confidence |
|----|--------------|------|-----|------------|
| R82 | **HAS_ROLE** | Person | Role | explicit |

---

### Category 17: Legal (3 relationships)

*License compliance and restrictions.*

| ID | Relationship | From | To | Confidence |
|----|--------------|------|-----|------------|
| R83 | **CONFLICTS_WITH** | License | License | structural |
| R84 | **HAS_RESTRICTION** | License | LegalRestriction | explicit |
| R85 | **REQUIRES_ATTRIBUTION** | License | SourceFile | explicit |

**Usage:**
- R83: Detect GPL/proprietary conflicts, LGPL linking issues
- R84: Trace export restrictions (ITAR, EAR) to licenses
- R85: Track which files need attribution in NOTICE.md

---

### Category 18: Accessibility (3 relationships)

*WCAG compliance traceability.*

| ID | Relationship | From | To | Confidence |
|----|--------------|------|-----|------------|
| R86 | **REQUIRES_A11Y** | Story | AccessibilityRequirement | explicit |
| R87 | **VIOLATES_A11Y** | SourceFile | AccessibilityRequirement | structural |
| R88 | **VALIDATED_BY_A11Y** | AccessibilityRequirement | TestCase | explicit |

**Usage:**
- R86: Link UI stories to applicable WCAG criteria
- R87: Track accessibility violations detected by axe-core
- R88: Connect WCAG criteria to validating tests

---

### Category 19: UX & Design (3 relationships)

*Design system compliance.*

| ID | Relationship | From | To | Confidence |
|----|--------------|------|-----|------------|
| R89 | **MUST_CONFORM_TO** | Story | UXGuideline | explicit |
| R90 | **VIOLATES_UX** | SourceFile | UXGuideline | structural |
| R91 | **USES_DESIGN_SYSTEM** | Module | DesignSystem | explicit |

**Usage:**
- R89: Require stories to follow specific design rules
- R90: Detect spacing, color, typography violations
- R91: Track which modules use which design systems

---

### Category 20: Operations (9 relationships) — NEW IN V20.1

*Runtime operations and simulation.*

| ID | Relationship | From | To | Confidence |
|----|--------------|------|-----|------------|
| R104 | **DEPLOYS_TO** | Service | Environment | structural |
| R105 | **MONITORS** | Alert | Service | structural |
| R106 | **TRIGGERED_BY** | Incident | Alert | inferred |
| R107 | **RESOLVES** | Commit | Incident | explicit |
| R108 | **MEASURES** | SLO | Service | structural |
| R109 | **CONSUMES** | Service | ErrorBudget | structural |
| R110 | **DOCUMENTS** | Runbook | Incident | explicit |
| R111 | **VALIDATES** | SimulationRun | Graph | structural |
| R112 | **SIMULATES** | SimulationRun | Service | structural |

**Usage:**
- R104: Track where services are deployed (staging, production, etc.)
- R105: Link alerts to the services they monitor
- R106: Trace incidents back to triggering alerts (inferred from timing)
- R107: Track which commits resolve which incidents
- R108: Link SLOs to the services they measure
- R109: Track service error budget consumption
- R110: Link runbooks to the incidents they document
- R111: Track which simulation runs validated which graph states
- R112: Track which services were included in simulation runs

**Linkage to Existing Graph:**
- E24 Environment ← R104 ← E91 Service
- E53 Incident ← R106 ← E95 Alert
- E53 Incident ← R110 ← E96 Runbook
- E50 Commit → R107 → E53 Incident

---

### Category 21: Runtime Reconciliation (2 relationships) — NEW IN V20.6.0 [DORMANT]

*Observational truth—reconciling static claims with runtime evidence.*

| ID | Relationship | From | To | Confidence | Status |
|----|--------------|------|-----|------------|--------|
| R113 | **ACTUALLY_CALLS** | Function | Function | 1.0 (observed) | [DORMANT] |
| R114 | **NEVER_EXECUTES** | Function | ExecutionTrace | min(0.95, trace.coverage) | [DORMANT] |

**Semantic Meaning:**
- R22 (CALLS) = "A could call B" (static possibility)
- R113 (ACTUALLY_CALLS) = "A did call B" (observed reality)
- R114 (NEVER_EXECUTES) = "F was not observed in Trace T" (NOT "F is dead code")

**Usage:**
- R113: Runtime-observed call edges with trace evidence
- R114: Functions not observed within trace scope (requires ≥0.70 coverage, ≥1.0 hour window)

**Linkage to Existing Graph:**
- E12 Function → R113 → E12 Function (observed calls)
- E12 Function → R114 → E84 ExecutionTrace (unobserved functions)

**Activation:** Category 21 relationships are DORMANT until Track D.9. See `docs/integrations/EP-D-002_RUNTIME_RECONCILIATION_V20_6_1.md` for complete specification.

---

## 3.3 Relationship Summary

| Category | Count | Purpose |
|----------|-------|---------|
| 1. Hierarchical | 7 | Structure |
| 2. Requirements → Design | 6 | Planning |
| 3. Design → Implementation | 4 | Realization |
| 4. Requirements → Implementation | 3 | Direct trace |
| 5. Implementation → Implementation | 7 | Dependencies |
| 6. Implementation → Data | 8 | Infrastructure |
| 7. Requirements → Verification | 3 | Proof of intent |
| 8. Implementation → Verification | 4 | Proof of reality |
| 9. Requirements → Risk | 4 | Assurance |
| 10. Requirements → Governance | 4 | Constraint of intent |
| 11. Implementation → Governance | 6 | Constraint of reality |
| 12. Documentation | 6 | Explanation |
| 13. Provenance | 9 | History |
| 14. Feedback → Requirements | 6 | Learning |
| 15. Security | 4 | Supply chain |
| 16. People & Roles | 1 | Human governance |
| 17. Legal | 3 | License compliance |
| 18. Accessibility | 3 | WCAG compliance |
| 19. UX & Design | 3 | Design system compliance |
| 20. Operations | 9 | Runtime & simulation |
| 21. Runtime Reconciliation | 2 | Observational truth [DORMANT] |
| **TOTAL** | **100** (base) + **14** (extensions) = **114** | |

---

# Part IV: Core Capabilities

The graph enables nine fundamental capabilities for autonomous operation.

## Capability 1: Forward Impact Analysis

*"When this changes, what else must change?"*

```cypher
// Full impact of changing AC-54.1.2
MATCH (ac:AcceptanceCriterion {id: 'AC-54.1.2'})

// Direct code impact
OPTIONAL MATCH (ac)<-[r1:SATISFIES]-(code)
WHERE r1.confidence >= 0.7

// Test impact  
OPTIONAL MATCH (ac)<-[r2:VERIFIED_BY]-(test)

// Documentation impact
OPTIONAL MATCH (ac)<-[:HAS_AC]-(story)-[r3:DOCUMENTED_IN]->(doc)

// Data impact
OPTIONAL MATCH (code)-[r4:READS_FROM|WRITES_TO]->(db)
WHERE r4.confidence >= 0.7

// API impact
OPTIONAL MATCH (code)-[r5:EXPOSES|CALLS_API]->(api)

// Policy impact
OPTIONAL MATCH (story)-[:CONSTRAINED_BY]->(policy)

// Gate impact
OPTIONAL MATCH (ac)-[:REQUIRED_FOR]->(gate)

RETURN {
  acceptance_criterion: ac,
  code_impact: collect(DISTINCT {entity: code, confidence: r1.confidence}),
  test_impact: collect(DISTINCT test),
  doc_impact: collect(DISTINCT doc),
  data_impact: collect(DISTINCT {entity: db, confidence: r4.confidence}),
  api_impact: collect(DISTINCT api),
  policy_impact: collect(DISTINCT policy),
  gate_impact: collect(DISTINCT gate)
}
```

## Capability 2: Backward Traceability

*"Why does this exist?"*

```cypher
// Trace code back to justifying requirement
MATCH (func:Function {id: 'FUNC-src/manifest.ts:generate'})
OPTIONAL MATCH (func)-[:SATISFIES]->(ac)-[:HAS_AC]-(story)-[:HAS_STORY]-(epic)
OPTIONAL MATCH (func)<-[:IMPLEMENTED_BY]-(tdd:TechnicalDesign)
OPTIONAL MATCH (story)-[:DECIDED_BY]->(adr:ArchitectureDecision)

RETURN {
  function: func,
  acceptance_criterion: ac,
  story: story,
  epic: epic,
  technical_design: tdd,
  architecture_decisions: collect(adr)
}
```

## Capability 3: Coverage Analysis

*"What's missing?"*

```cypher
// Unimplemented ACs
MATCH (ac:AcceptanceCriterion)
WHERE NOT EXISTS((ac)<-[:SATISFIES {confidence: >= 0.7}]-())
RETURN ac.id as gap, 'no_implementing_code' as gap_type

UNION

// Untested ACs
MATCH (ac:AcceptanceCriterion)
WHERE NOT EXISTS((ac)<-[:VERIFIED_BY]-())
RETURN ac.id as gap, 'no_verifying_test' as gap_type

UNION

// Orphan code (no requirement justification)
MATCH (file:SourceFile)
WHERE NOT EXISTS((file)-[:IMPLEMENTS]->())
  AND file.path STARTS WITH 'src/'
  AND NOT file.path CONTAINS '/test/'
RETURN file.id as gap, 'unjustified_code' as gap_type

UNION

// Unenforced Tier-1 policies
MATCH (rule:PolicyRule {tier: 1})
WHERE NOT EXISTS((rule)<-[:ENFORCES]-())
RETURN rule.id as gap, 'unenforced_policy' as gap_type
```

## Capability 4: Feedback Loop Queries

*"What has production taught us?"*

```cypher
// ACs invalidated by incidents
MATCH (inc:Incident)-[r:INVALIDATES_AC]->(ac)
WHERE r.verified = true
RETURN ac.id, inc.id, inc.severity, inc.root_cause.summary

// Constraints validated by production metrics
MATCH (pm:ProductionMetric)-[:VALIDATES_CONSTRAINT]->(c:Constraint)
RETURN c.id, c.threshold, pm.current_value, 
       CASE WHEN pm.current_value >= c.threshold THEN 'PASS' ELSE 'FAIL' END as status

// Feedback that generated new stories
MATCH (fb:UserFeedback)-[:TRIGGERS_REFINEMENT]->(story:Story)
RETURN fb.id, fb.content, story.id, story.title

// Unverified incident hypotheses needing attention
MATCH (inc:Incident)-[r:ROOT_CAUSE]->(code)
WHERE r.verified = false AND r.expires_at > datetime()
RETURN inc.id, code.id, r.confidence, r.expires_at
ORDER BY r.expires_at ASC
```

## Capability 5: Change Simulation

*"What if I change this?"*

```cypher
// Simulate deprecating a story - what becomes orphaned?
MATCH (s:Story {id: 'STORY-54.1'})

// Code that would lose its justification
OPTIONAL MATCH (s)<-[:IMPLEMENTS]-(file)
WHERE NOT EXISTS((file)-[:IMPLEMENTS]->(:Story WHERE id <> s.id))

// Tests that would lose their purpose
OPTIONAL MATCH (s)<-[:TESTED_BY]-(suite)
WHERE NOT EXISTS((suite)-[:TESTED_BY]->(:Story WHERE id <> s.id))

// Docs that would become stale
OPTIONAL MATCH (s)<-[:DOCUMENTED_IN]-(doc)

RETURN {
  story: s,
  orphaned_files: collect(DISTINCT file),
  orphaned_tests: collect(DISTINCT suite),
  stale_docs: collect(DISTINCT doc),
  total_impact: size(collect(DISTINCT file)) + size(collect(DISTINCT suite))
}
```

## Capability 6: Governance Verification

*"Are we compliant?"*

```cypher
// Policy enforcement status
MATCH (rule:PolicyRule)
OPTIONAL MATCH (rule)<-[:ENFORCES]-(enforcer)
OPTIONAL MATCH (rule)<-[:CONSTRAINED_BY]-(story)
RETURN rule.id, rule.tier, rule.description,
       CASE WHEN enforcer IS NOT NULL THEN 'ENFORCED' ELSE 'NOT_ENFORCED' END as status,
       collect(DISTINCT enforcer.id) as enforcers,
       collect(DISTINCT story.id) as constrained_stories
ORDER BY rule.tier, status

// License compliance
MATCH (pkg:ExternalPackage)-[:LICENSED_AS]->(lic:License)
OPTIONAL MATCH (lic)-[:VIOLATES_POLICY]->(rule:PolicyRule)
WHERE rule IS NOT NULL
RETURN pkg.name, lic.spdx_id, rule.id as violated_policy

// Who can approve this story?
MATCH (story:Story {id: 'STORY-54.1'})-[:REQUIRES_APPROVAL]->(role:Role)
MATCH (person:Person)-[:HAS_ROLE]->(role)
RETURN story.id, role.name, collect(person.name) as approvers

// What autonomy level does this module operate at?
MATCH (mod:Module {id: 'MOD-gnosis-core'})-[:OPERATES_AT]->(level:AutonomyLevel)
RETURN mod.name, level.level, level.name, level.human_oversight
```

## Capability 7: Security Posture

*"What are our vulnerabilities?"*

```cypher
// Critical vulnerabilities with blast radius
MATCH (pkg:ExternalPackage)-[:HAS_VULNERABILITY]->(vuln:Vulnerability)
WHERE vuln.severity IN ['critical', 'high']
  AND vuln.status = 'open'
MATCH (mod:Module)-[:DEPENDS_EXTERNAL]->(pkg)
OPTIONAL MATCH (mod)<-[:IMPLEMENTS_EPIC]-(epic)
RETURN vuln.cve_id, vuln.severity, pkg.name,
       collect(DISTINCT mod.name) as affected_modules,
       collect(DISTINCT epic.id) as affected_epics
ORDER BY CASE vuln.severity WHEN 'critical' THEN 1 ELSE 2 END
```

---

## Capability 8: License Compliance

*"Can we use this dependency? Are there conflicts?"*

```cypher
// Detect license conflicts in dependency graph
MATCH (pkg:ExternalPackage)-[:LICENSED_AS]->(lic:License)
MATCH (lic)-[:CONFLICTS_WITH]->(conflict:License)
MATCH (pkg2:ExternalPackage)-[:LICENSED_AS]->(conflict)
WHERE pkg <> pkg2
MATCH (mod:Module)-[:DEPENDS_EXTERNAL]->(pkg)
MATCH (mod)-[:DEPENDS_EXTERNAL]->(pkg2)
RETURN mod.name as module,
       pkg.name as package1, lic.spdx_id as license1,
       pkg2.name as package2, conflict.spdx_id as license2,
       "License conflict" as issue

// Check for export restrictions
UNION
MATCH (pkg:ExternalPackage)-[:LICENSED_AS]->(lic:License)
      -[:HAS_RESTRICTION]->(restrict:LegalRestriction)
WHERE restrict.type = 'export' AND restrict.severity = 'blocking'
MATCH (mod:Module)-[:DEPENDS_EXTERNAL]->(pkg)
RETURN mod.name as module,
       pkg.name as package1, lic.spdx_id as license1,
       restrict.name as package2, restrict.jurisdiction[0] as license2,
       "Export restriction" as issue
```

---

## Capability 9: Accessibility & UX Compliance

*"Does this UI meet WCAG? Does it follow our design system?"*

```cypher
// UI stories missing accessibility requirements
MATCH (s:Story)
WHERE s.tags CONTAINS 'ui'
  AND NOT EXISTS {
    MATCH (s)-[:REQUIRES_A11Y]->(:AccessibilityRequirement)
  }
RETURN s.id as story, "Missing accessibility requirements" as issue

// Active accessibility violations
UNION
MATCH (f:SourceFile)-[v:VIOLATES_A11Y]->(a:AccessibilityRequirement)
WHERE NOT EXISTS {
  MATCH (v)-[:RESOLVED_BY]->(:Commit)
}
RETURN f.path as story, 
       a.criterion + ": " + a.name as issue

// UX guideline violations
UNION
MATCH (f:SourceFile)-[v:VIOLATES_UX]->(ux:UXGuideline)
WHERE v.waived = false
RETURN f.path as story,
       "UX: " + ux.name + " (" + ux.category + ")" as issue
```

---

# Part V: Coverage Gates

The graph enforces hard gates that block releases when traceability is incomplete.

## 5.1 Gate Definitions

| Gate ID | Metric | Threshold | Blocks | Rationale |
|---------|--------|-----------|--------|-----------|
| G01 | Story → Code coverage | ≥99% | Release | Every story must have implementing code |
| G02 | AC → Code coverage | ≥95% | Release | Nearly every AC must be satisfied |
| G03 | Code → Story binding | 100% | Release | No orphan production code |
| G04 | Story → Test coverage | ≥99% | Release | Every story must be tested |
| G05 | AC → Test coverage | ≥95% | Release | Nearly every AC must be verified |
| G06 | Test → AC binding | 100% | Release | No orphan tests |
| G07 | API → Doc coverage | ≥95% | Release | Public APIs must be documented |
| G08 | Tier-1 policy enforcement | 100% | Release | All critical policies enforced |
| G09 | Critical vulnerabilities | 0 | Deploy | No critical vulns in prod |
| G10 | High confidence only | ≥70% | Cert | No low-confidence edges in certification evidence |
| G11 | Hypothesis validation | <7 days | Warning | Hypotheses must be verified or expire |
| G12 | License conflicts | 0 | Release | No unresolved license incompatibilities |
| G13 | UI story → A11y coverage | ≥95% | Release | UI stories linked to WCAG criteria |
| G14 | Accessibility violations | 0 | Deploy | No accessibility violations in production |
| G15 | UX guideline violations | 0 | Release | Components follow design system |

## 5.2 Gate Implementation

```typescript
interface CoverageGate {
  id: string;
  name: string;
  query: CypherQuery;
  threshold: number;
  operator: '>=' | '=' | '<=' | '<' | '>';
  blocks: 'release' | 'deploy' | 'certification' | 'warning';
  exclusions: ExclusionPattern[];
}

const gates: CoverageGate[] = [
  {
    id: 'G01',
    name: 'Story Code Coverage',
    query: `
      MATCH (s:Story)
      WHERE s.status = 'approved'
      OPTIONAL MATCH (s)<-[:IMPLEMENTS {confidence: >= 0.7}]-(f:SourceFile)
      WITH s, count(f) > 0 as has_code
      RETURN toFloat(sum(CASE WHEN has_code THEN 1 ELSE 0 END)) / count(s) as coverage
    `,
    threshold: 0.99,
    operator: '>=',
    blocks: 'release',
    exclusions: [
      { pattern: 'STORY-*.0', reason: 'Meta-stories excluded' }
    ]
  },
  // ... other gates
];
```

---

# Part VI: Stories and Acceptance Criteria

## Story 64.1: Entity Registry Foundation

**As a** traceability system  
**I want** a complete registry of all 67 entity types 
**So that** every artifact is trackable with proper typing

**Acceptance Criteria:**

| AC | Description | Priority |
|----|-------------|----------|
| AC-64.1.1 | All 67 entity types defined with TypeScript interfaces | P0 |
| AC-64.1.2 | Each entity type has unique ID format enforced | P0 |
| AC-64.1.3 | Required vs optional attributes specified | P0 |
| AC-64.1.4 | Entity validation on creation (type, format) | P0 |
| AC-64.1.5 | Entity registry API: `GET /api/entity-types` | P0 |
| AC-64.1.6 | Entity query API: `GET /api/entities/{type}` | P0 |
| AC-64.1.7 | Entity count per type for metrics | P1 |
| AC-64.1.8 | Schema versioning for evolution | P1 |

**Effort:** 3 days

---

## Story 64.2: Relationship Registry with Confidence

**As a** traceability system  
**I want** a complete registry of all 100 relationship types with metadata  
**So that** every connection is queryable with certainty information

**Acceptance Criteria:**

| AC | Description | Priority |
|----|-------------|----------|
| AC-64.2.1 | All 100 relationship types defined with cardinality | P0 |
| AC-64.2.2 | RelationshipMetadata schema implemented | P0 |
| AC-64.2.3 | Confidence scoring (0.0-1.0) on all relationships | P0 |
| AC-64.2.4 | Provenance tracking (explicit/structural/inferred/hypothesized) | P0 |
| AC-64.2.5 | Source/target entity type validation | P0 |
| AC-64.2.6 | Bidirectional traversal supported | P0 |
| AC-64.2.7 | Relationship query API with confidence filtering | P0 |
| AC-64.2.8 | Audit trail (created_at, created_by) | P1 |

**Effort:** 4 days

---

## Story 64.3: Explicit Marker Extraction

**As a** traceability system  
**I want** to extract explicit markers from source artifacts  
**So that** high-confidence relationships are captured

**Acceptance Criteria:**

| AC | Description | Priority |
|----|-------------|----------|
| AC-64.3.1 | Extract `@implements STORY-XX.YY` → R18 (confidence: 1.0) | P0 |
| AC-64.3.2 | Extract `@satisfies AC-XX.YY.ZZ` → R19 (confidence: 1.0) | P0 |
| AC-64.3.3 | Extract `@enforces RULE-XX` → R51 (confidence: 1.0) | P0 |
| AC-64.3.4 | Extract `describe('STORY-XX.YY')` → R36 (confidence: 1.0) | P0 |
| AC-64.3.5 | Extract `it('AC-XX.YY.ZZ')` → R37 (confidence: 1.0) | P0 |
| AC-64.3.6 | Extract `@tdd-section` → R14 (confidence: 1.0) | P1 |
| AC-64.3.7 | Extract doc markers → R57 (confidence: 1.0) | P1 |
| AC-64.3.8 | Malformed markers logged with location | P0 |
| AC-64.3.9 | Extraction <5 min for 100K LOC | P1 |
| AC-64.3.10 | Marker statistics reported | P1 |

**Effort:** 5 days

---

## Story 64.4: Structural Analysis Engine

**As a** traceability system  
**I want** to infer relationships from code structure  
**So that** the graph is populated without exhaustive annotation

**Acceptance Criteria:**

| AC | Description | Priority |
|----|-------------|----------|
| AC-64.4.1 | Parse imports → R21 (confidence: 0.99) | P0 |
| AC-64.4.2 | Parse function calls → R22 (confidence: 0.95) | P0 |
| AC-64.4.3 | Parse class inheritance → R23 (confidence: 0.99) | P0 |
| AC-64.4.4 | Parse interface implementation → R24 (confidence: 0.99) | P0 |
| AC-64.4.5 | Parse package.json → R27 (confidence: 0.99) | P0 |
| AC-64.4.6 | Parse route definitions → R31 (confidence: 0.95) | P0 |
| AC-64.4.7 | Parse SQL/ORM → R28, R29 (confidence: 0.85) | P1 |
| AC-64.4.8 | Parse migrations → R30 (confidence: 0.95) | P1 |
| AC-64.4.9 | Parse config access → R33 (confidence: 0.90) | P1 |
| AC-64.4.10 | Analysis <10 min for 100K LOC | P1 |

**Effort:** 8 days

---

## Story 64.5: Graph Query API

**As a** developer or Sophia  
**I want** to query the graph with confidence-aware filtering  
**So that** I can discover relationships at appropriate certainty levels

**Acceptance Criteria:**

| AC | Description | Priority |
|----|-------------|----------|
| AC-64.5.1 | Single-hop query: `GET /api/graph/{id}/relationships` | P0 |
| AC-64.5.2 | Multi-hop query: `POST /api/graph/traverse` | P0 |
| AC-64.5.3 | Confidence filter parameter: `?min_confidence=0.7` | P0 |
| AC-64.5.4 | Provenance filter: `?provenance=explicit,structural` | P0 |
| AC-64.5.5 | Impact query: `GET /api/graph/{id}/impact` | P0 |
| AC-64.5.6 | Coverage query: `GET /api/graph/coverage/{type}` | P0 |
| AC-64.5.7 | Orphan query: `GET /api/graph/orphans/{type}` | P0 |
| AC-64.5.8 | Response <500ms for single-entity | P0 |
| AC-64.5.9 | Response <5s for full impact | P1 |
| AC-64.5.10 | Cypher support for complex queries | P1 |

**Effort:** 5 days

---

## Story 64.6: Coverage Gates

**As a** certification system  
**I want** enforced coverage gates  
**So that** incomplete traceability blocks release

**Acceptance Criteria:**

| AC | Description | Priority |
|----|-------------|----------|
| AC-64.6.1 | G01: storyCodeCoverage ≥99% | P0 |
| AC-64.6.2 | G02: acCodeCoverage ≥95% | P0 |
| AC-64.6.3 | G03: codeStoryBinding = 100% | P0 |
| AC-64.6.4 | G04: storyTestCoverage ≥99% | P0 |
| AC-64.6.5 | G05: acTestCoverage ≥95% | P0 |
| AC-64.6.6 | G06: testACBinding = 100% | P0 |
| AC-64.6.7 | G08: tier1PolicyEnforcement = 100% | P0 |
| AC-64.6.8 | G10: Only confidence ≥0.7 in cert evidence | P0 |
| AC-64.6.9 | Gate failures block CI/CD | P0 |
| AC-64.6.10 | Exclusion patterns configurable | P1 |

**Effort:** 3 days

---

## Story 64.7: Forward Impact Analysis

**As a** developer or Sophia  
**I want** to calculate full impact of changes  
**So that** I understand blast radius before modifying

**Acceptance Criteria:**

| AC | Description | Priority |
|----|-------------|----------|
| AC-64.7.1 | Input: Any entity ID | P0 |
| AC-64.7.2 | Output: Affected entities by category | P0 |
| AC-64.7.3 | Include confidence for each impact | P0 |
| AC-64.7.4 | Filter by min_confidence | P0 |
| AC-64.7.5 | Code, test, doc, data, API impacts | P0 |
| AC-64.7.6 | Risk, policy, gate impacts | P0 |
| AC-64.7.7 | Configurable depth (1-hop to full) | P1 |
| AC-64.7.8 | JSON and Markdown output | P1 |
| AC-64.7.9 | Calculation <10 seconds | P0 |
| AC-64.7.10 | Include hypothesized impacts flagged | P1 |

**Effort:** 5 days

---

## Story 64.8: Change Simulation

**As a** developer or Sophia  
**I want** to simulate changes without executing  
**So that** I can preview impact safely

**Acceptance Criteria:**

| AC | Description | Priority |
|----|-------------|----------|
| AC-64.8.1 | `POST /api/simulate/change` endpoint | P0 |
| AC-64.8.2 | Simulate new requirement | P0 |
| AC-64.8.3 | Simulate requirement modification | P0 |
| AC-64.8.4 | Simulate deprecation (orphan detection) | P0 |
| AC-64.8.5 | No graph mutations during simulation | P0 |
| AC-64.8.6 | Include effort estimate | P1 |
| AC-64.8.7 | Include risk assessment | P1 |
| AC-64.8.8 | Simulation <30 seconds | P1 |
| AC-64.8.9 | Results cached for review | P1 |
| AC-64.8.10 | Transition to execution with approval | P2 |

**Effort:** 5 days

---

## Story 64.9: Drift Detection

**As a** certification system  
**I want** to detect unauthorized graph changes  
**So that** the graph stays synchronized

**Acceptance Criteria:**

| AC | Description | Priority |
|----|-------------|----------|
| AC-64.9.1 | Snapshot graph with Merkle hash after build | P0 |
| AC-64.9.2 | Compare consecutive snapshots | P0 |
| AC-64.9.3 | FAIL: Unexpected requirement removal | P0 |
| AC-64.9.4 | WARN: Unexpected requirement addition | P1 |
| AC-64.9.5 | FAIL: Broken relationships (dangling) | P0 |
| AC-64.9.6 | FAIL: Coverage regression | P0 |
| AC-64.9.7 | Drift report with specifics | P0 |
| AC-64.9.8 | Automatic check in CI/CD | P0 |
| AC-64.9.9 | Manual check API | P1 |
| AC-64.9.10 | Historical trend | P2 |

**Effort:** 3 days

---

## Story 64.10: Versioned Provenance

**As an** auditor  
**I want** to track artifact history  
**So that** I can trace evolution

**Acceptance Criteria:**

| AC | Description | Priority |
|----|-------------|----------|
| AC-64.10.1 | Track INTRODUCED_IN (R63) | P0 |
| AC-64.10.2 | Track CHANGED_IN (R64) | P0 |
| AC-64.10.3 | Track DEPRECATED_IN (R65) | P1 |
| AC-64.10.4 | Track IMPLEMENTED_IN (R66) | P0 |
| AC-64.10.5 | Track MODIFIED_IN (R67) | P0 |
| AC-64.10.6 | Track GROUPS and ADDRESSES for ChangeSets (R70, R71) | P0 |
| AC-64.10.7 | Query: "When introduced?" | P0 |
| AC-64.10.8 | Query: "What commits?" | P0 |
| AC-64.10.9 | Query: "What changed between versions?" | P1 |
| AC-64.10.10 | Provenance immutable | P0 |

**Effort:** 5 days

---

## Story 64.11: Graph Integrity Verification

**As a** certification system  
**I want** to verify graph completeness and consistency  
**So that** query results are trustworthy

**Acceptance Criteria:**

| AC | Description | Priority |
|----|-------------|----------|
| AC-64.11.1 | Verify entities have required attributes | P0 |
| AC-64.11.2 | Verify relationships have valid source/target | P0 |
| AC-64.11.3 | Verify no orphan entities (unless excluded) | P0 |
| AC-64.11.4 | Verify no circular hierarchies | P0 |
| AC-64.11.5 | Verify Merkle root | P0 |
| AC-64.11.6 | Verify entity counts match ground truth | P1 |
| AC-64.11.7 | Check <60 seconds | P1 |
| AC-64.11.8 | Issues report | P0 |
| AC-64.11.9 | Integrity API endpoint | P0 |
| AC-64.11.10 | Failure blocks certification | P0 |

**Effort:** 3 days

---

## Story 64.12: Feedback Loop Integration

**As a** learning system  
**I want** to integrate production feedback  
**So that** the system learns from reality

**Acceptance Criteria:**

| AC | Description | Priority |
|----|-------------|----------|
| AC-64.12.1 | Ingest Incident entities | P0 |
| AC-64.12.2 | Ingest BugReport entities | P0 |
| AC-64.12.3 | Ingest UserFeedback entities | P1 |
| AC-64.12.4 | Ingest ProductionMetric entities | P0 |
| AC-64.12.5 | Create REPORTED_AGAINST (R72) | P0 |
| AC-64.12.6 | Create ROOT_CAUSE (R73) as hypothesis | P0 |
| AC-64.12.7 | Create CONTRIBUTED_TO (R74) as hypothesis | P0 |
| AC-64.12.8 | Create VALIDATES_CONSTRAINT (R76) | P0 |
| AC-64.12.9 | Create INVALIDATES_AC (R77) as hypothesis | P0 |
| AC-64.12.10 | Integration lag <5 minutes | P1 |

**Effort:** 5 days

---

## Story 64.13: Hypothesis Lifecycle Management

**As a** learning system  
**I want** to manage hypothesized relationships  
**So that** guesses are verified or expire

**Acceptance Criteria:**

| AC | Description | Priority |
|----|-------------|----------|
| AC-64.13.1 | Hypotheses have expiration (default: 7 days) | P0 |
| AC-64.13.2 | Verification workflow for hypotheses | P0 |
| AC-64.13.3 | Verified hypotheses become permanent | P0 |
| AC-64.13.4 | Expired hypotheses are removed | P0 |
| AC-64.13.5 | Dashboard of pending hypotheses | P1 |
| AC-64.13.6 | Alert when hypotheses near expiration | P1 |
| AC-64.13.7 | Confidence adjustment on verification | P0 |
| AC-64.13.8 | Audit trail of hypothesis lifecycle | P1 |
| AC-64.13.9 | Hypotheses excluded from certification evidence | P0 |
| AC-64.13.10 | Query: "Hypotheses needing attention" | P0 |

**Effort:** 4 days

---

## Story 64.14: Security & Supply Chain

**As a** security-conscious system  
**I want** to track vulnerabilities and licenses  
**So that** supply chain risks are visible

**Acceptance Criteria:**

| AC | Description | Priority |
|----|-------------|----------|
| AC-64.14.1 | Ingest Vulnerability from CVE database | P0 |
| AC-64.14.2 | Ingest License from package metadata | P0 |
| AC-64.14.3 | Create HAS_VULNERABILITY (R78) | P0 |
| AC-64.14.4 | Create LICENSED_AS (R79) | P0 |
| AC-64.14.5 | Create VIOLATES_POLICY (R80) | P1 |
| AC-64.14.6 | Create REMEDIATES (R81) | P1 |
| AC-64.14.7 | G09: No critical vulns in prod | P0 |
| AC-64.14.8 | G11: No unapproved copyleft | P1 |
| AC-64.14.9 | Scan on dependency change | P0 |
| AC-64.14.10 | Security posture dashboard | P2 |

**Effort:** 5 days

---

## Story 64.15: Runtime Drift Monitoring

**As an** operations system  
**I want** to detect runtime drift from documented behavior  
**So that** production matches the graph

**Acceptance Criteria:**

| AC | Description | Priority |
|----|-------------|----------|
| AC-64.15.1 | Monitor API responses vs contracts | P1 |
| AC-64.15.2 | Monitor DB schema vs documented | P1 |
| AC-64.15.3 | Monitor config vs defaults | P1 |
| AC-64.15.4 | Monitor feature flags vs documented | P2 |
| AC-64.15.5 | Alert on contract violation | P1 |
| AC-64.15.6 | Alert on schema drift | P1 |
| AC-64.15.7 | Alert on config drift | P2 |
| AC-64.15.8 | Checks every 5 minutes | P2 |
| AC-64.15.9 | Drift creates Incident entity | P1 |
| AC-64.15.10 | Runtime drift dashboard | P2 |

**Effort:** 8 days

---

# Part VII: Implementation Roadmap

## Phase 1: Foundation (V2.7)
*Build the skeleton—entities, relationships, markers.*

| Story | Days | Cumulative |
|-------|------|------------|
| 64.1 Entity Registry | 3 | 3 |
| 64.2 Relationship Registry | 4 | 7 |
| 64.3 Marker Extraction | 5 | 12 |
| 64.4 Structural Analysis | 8 | 20 |
| **Phase 1 Total** | **20** | |

**Gate:** Graph can be populated from codebase

---

## Phase 2: Query & Gates (V2.8)
*Enable discovery and enforcement.*

| Story | Days | Cumulative |
|-------|------|------------|
| 64.5 Query API | 5 | 25 |
| 64.6 Coverage Gates | 3 | 28 |
| 64.7 Impact Analysis | 5 | 33 |
| **Phase 2 Total** | **13** | |

**Gate:** Graph is queryable with enforced coverage

---

## Phase 3: Intelligence (V2.9)
*Enable simulation and history.*

| Story | Days | Cumulative |
|-------|------|------------|
| 64.8 Change Simulation | 5 | 38 |
| 64.9 Drift Detection | 3 | 41 |
| 64.10 Versioned Provenance | 5 | 46 |
| 64.11 Integrity Verification | 3 | 49 |
| **Phase 3 Total** | **16** | |

**Gate:** Graph supports prediction and historical queries

---

## Phase 4: Learning Loop (V3.0)
*Close the circle.*

| Story | Days | Cumulative |
|-------|------|------------|
| 64.12 Feedback Integration | 5 | 54 |
| 64.13 Hypothesis Lifecycle | 4 | 58 |
| 64.14 Security & Supply Chain | 5 | 63 |
| **Phase 4 Total** | **14** | |

**Gate:** Graph learns from production

---

## Phase 5: Operational Excellence (Sophia V1)
*Full autonomous operation.*

| Story | Days | Cumulative |
|-------|------|------------|
| 64.15 Runtime Drift | 8 | 71 |
| **Phase 5 Total** | **8** | |

**Gate:** Complete nervous system operational

---

## Summary

| Phase | Version | Stories | Days |
|-------|---------|---------|------|
| Foundation | V2.7 | 4 | 20 |
| Query & Gates | V2.8 | 3 | 13 |
| Intelligence | V2.9 | 4 | 16 |
| Learning Loop | V3.0 | 3 | 14 |
| Operations | Sophia V1 | 1 | 8 |
| **TOTAL** | | **15** | **71** |

---

# Part VIII: Validation Checklist

When complete, the system must correctly answer:

## Forward Traceability
- [ ] What code implements STORY-54.1? (with confidence)
- [ ] What code satisfies AC-54.1.2? (with confidence)
- [ ] What tests verify AC-54.1.2?
- [ ] What docs describe EPIC-54?

## Backward Traceability
- [ ] Why does this function exist?
- [ ] What requirement justified this table?
- [ ] What ADR decided this approach?

## Impact Analysis
- [ ] What breaks if AC-54.1.2 changes? (filtered by confidence)
- [ ] What DB tables are affected?
- [ ] What gates are blocked?

## Coverage
- [ ] What ACs lack code?
- [ ] What code lacks justification?
- [ ] What policies are unenforced?

## Governance
- [ ] What policies constrain STORY-54.1?
- [ ] What code enforces RULE-TIER1-001?
- [ ] Who can approve STORY-54.1? (via HAS_ROLE)
- [ ] What autonomy level does this module operate at?

## Feedback Loop
- [ ] What bugs were reported against STORY-54.1?
- [ ] What incidents were caused by this code? (with confidence)
- [ ] What hypotheses need verification?

## Security
- [ ] What vulnerabilities affect our dependencies?
- [ ] What code is exposed to this CVE?
- [ ] What licenses need review?

## Provenance
- [ ] When was STORY-54.1 introduced?
- [ ] What changed between V2.65 and V2.7?
- [ ] What ChangeSet addressed STORY-54.1?

---

# Appendix A: Complete Entity Reference

| ID | Entity | Layer | ID Format |
|----|--------|-------|-----------|
| E01 | Epic | Requirements | `EPIC-{n}` |
| E02 | Story | Requirements | `STORY-{e}.{n}` |
| E03 | AcceptanceCriterion | Requirements | `AC-{e}.{s}.{n}` |
| E04 | Constraint | Requirements | `CNST-{type}-{n}` |
| E05 | Assumption | Requirements | `ASUM-{n}` |
| E06 | TechnicalDesign | Design | `TDD-{v}` |
| E07 | InterfaceContract | Design | `IFACE-{name}` |
| E08 | DataSchema | Design | `SCHEMA-{name}` |
| E09 | DatabaseSchema | Design | `DBTBL-{name}` |
| E10 | ArchitectureDecision | Design | `ADR-{n}` |
| E11 | SourceFile | Implementation | `FILE-{path}` |
| E12 | Function | Implementation | `FUNC-{file}:{name}` |
| E13 | Class | Implementation | `CLASS-{file}:{name}` |
| E14 | Interface | Implementation | `TYPE-{file}:{name}` |
| E15 | Module | Implementation | `MOD-{name}` |
| E16 | APIEndpoint | Implementation | `API-{method}-{path}` |
| E17 | PipelineStep | Implementation | `PIPE-{name}` |
| E18 | Migration | Implementation | `MIG-{v}` |
| E19 | ExternalPackage | Implementation | `PKG-{name}@{version}` |
| E20 | ConfigKey | Configuration | `CFG-{key}` |
| E21 | EnvironmentVariable | Configuration | `ENV-{name}` |
| E22 | FeatureFlag | Configuration | `FLAG-{name}` |
| E23 | Secret | Configuration | `SCRT-{name}` |
| E24 | Environment | Configuration | `ENVMT-{name}` |
| E25 | ResourceEstimate | Configuration | `RES-{id}` |
| E26 | BudgetConstraint | Configuration | `BUDGET-{id}` |
| E27 | TestFile | Verification | `TSTF-{path}` |
| E28 | TestSuite | Verification | `TSTS-{name}` |
| E29 | TestCase | Verification | `TC-{suite}:{name}` |
| E30 | TestFixture | Verification | `FIXTURE-{name}` |
| E31 | Benchmark | Verification | `BENCH-{name}` |
| E32 | Mock | Verification | `MOCK-{name}` |
| E33 | RiskCheckpoint | Quality & Risk | `RISK-{id}` |
| E34 | CertificationGate | Quality & Risk | `GATE-{v}` |
| E35 | QualityMetric | Quality & Risk | `METRIC-{name}` |
| E36 | CertificationReport | Quality & Risk | `CRPT-{id}` |
| E37 | Vulnerability | Quality & Risk | `VULN-{cve}` |
| E38 | DocSection | Documentation | `DOC-{path}#{s}` |
| E39 | APIDoc | Documentation | `APIDOC-{ep}` |
| E40 | UserGuide | Documentation | `GUIDE-{name}` |
| E41 | Runbook | Documentation | `RUNBOOK-{name}` |
| E42 | ContractClause | Documentation | `CLAUSE-{id}` |
| E43 | PolicyRule | Governance | `RULE-{tier}-{id}` |
| E44 | PolicyDomain | Governance | `DOMAIN-{name}` |
| E45 | AutonomyLevel | Governance | `AUTON-{n}` |
| E46 | Person | Governance | `PERSON-{id}` |
| E47 | Role | Governance | `ROLE-{name}` |
| E48 | License | Governance | `LIC-{spdx}` |
| E49 | ReleaseVersion | Provenance | `REL-{v}` |
| E50 | Commit | Provenance | `COMMIT-{sha}` |
| E51 | PullRequest | Provenance | `PR-{n}` |
| E52 | ChangeSet | Provenance | `CHGSET-{id}` |
| E53 | Incident | Feedback | `INC-{id}` |
| E54 | BugReport | Feedback | `BUG-{id}` |
| E55 | UserFeedback | Feedback | `FDBK-{id}` |
| E56 | ProductionMetric | Feedback | `PMET-{name}` |
| E57 | LegalRestriction | Legal | `RESTRICT-{type}-{id}` |
| E58 | AccessibilityRequirement | Compliance/UX | `A11Y-{standard}-{criterion}` |
| E59 | UXGuideline | Compliance/UX | `UX-{category}-{id}` |
| E60 | DesignSystem | Compliance/UX | `DSYS-{name}` |
| E91 | Service | Operations | `SVC-{name}` |
| E92 | Deployment | Operations | `DEPLOY-{id}` |
| E93 | SLO | Operations | `SLO-{id}` |
| E94 | ErrorBudget | Operations | `ERRBUDGET-{id}` |
| E95 | Alert | Operations | `ALERT-{id}` |
| E96 | Runbook | Operations | `RUNBOOK-{id}` |
| E97 | SimulationRun | Operations | `SIM-{id}` |
| E84 | ExecutionTrace | Runtime Reconciliation | `TRACE-{YYYYMMDD}-{seq}` | [DORMANT] |
| E85 | RuntimeCall | Runtime Reconciliation | `RCALL-{trace_id}-{seq}` | [DORMANT] |

**Total: 67 Entities (base) + 16 Extensions = 83 Entities**

---

# Appendix B: Complete Relationship Reference

| ID | Relationship | From → To | Category | Confidence |
|----|--------------|-----------|----------|------------|
| R01 | HAS_STORY | Epic → Story | Hierarchical | explicit |
| R02 | HAS_AC | Story → AC | Hierarchical | explicit |
| R03 | HAS_CONSTRAINT | Story → Constraint | Hierarchical | explicit |
| R04 | CONTAINS_FILE | Module → SourceFile | Hierarchical | structural |
| R05 | CONTAINS_ENTITY | SourceFile → Function/Class | Hierarchical | structural |
| R06 | CONTAINS_SUITE | TestFile → TestSuite | Hierarchical | structural |
| R07 | CONTAINS_CASE | TestSuite → TestCase | Hierarchical | structural |
| R08 | DESIGNED_IN | Story → TechnicalDesign | Req→Design | explicit |
| R09 | SPECIFIED_IN | AC → TechnicalDesign | Req→Design | explicit |
| R10 | DECIDED_BY | Story → ADR | Req→Design | explicit |
| R11 | DEFINES_SCHEMA | Story → DataSchema | Req→Design | explicit |
| R12 | DEFINES_INTERFACE | Story → InterfaceContract | Req→Design | explicit |
| R13 | REQUIRES_TABLE | Story → DatabaseSchema | Req→Design | inferred |
| R14 | IMPLEMENTED_BY | TechnicalDesign → SourceFile | Design→Impl | explicit |
| R15 | REALIZED_BY | InterfaceContract → Class/Func | Design→Impl | structural |
| R16 | DEFINED_IN | DataSchema → SourceFile | Design→Impl | structural |
| R17 | MIGRATED_BY | DatabaseSchema → Migration | Design→Impl | structural |
| R18 | IMPLEMENTS | SourceFile → Story | Req→Impl | explicit |
| R19 | SATISFIES | Function/Class → AC | Req→Impl | explicit |
| R20 | IMPLEMENTS_EPIC | Module → Epic | Req→Impl | explicit |
| R21 | IMPORTS | SourceFile → SourceFile | Impl→Impl | structural |
| R22 | CALLS | Function → Function | Impl→Impl | structural |
| R23 | EXTENDS | Class → Class | Impl→Impl | structural |
| R24 | IMPLEMENTS_INTERFACE | Class → Interface | Impl→Impl | structural |
| R25 | USES | Function → ConfigKey | Impl→Impl | structural |
| R26 | DEPENDS_ON | Module → Module | Impl→Impl | structural |
| R27 | DEPENDS_EXTERNAL | Module → ExternalPackage | Impl→Impl | structural |
| R28 | READS_FROM | Function → DatabaseSchema | Impl→Data | inferred |
| R29 | WRITES_TO | Function → DatabaseSchema | Impl→Data | inferred |
| R30 | MIGRATES | Migration → DatabaseSchema | Impl→Data | structural |
| R31 | EXPOSES | Function → APIEndpoint | Impl→Data | structural |
| R32 | CALLS_API | Function → APIEndpoint | Impl→Data | inferred |
| R33 | USES_CONFIG | Function → ConfigKey | Impl→Data | structural |
| R34 | REQUIRES_ENV | SourceFile → EnvVar | Impl→Data | structural |
| R35 | GATED_BY | Function → FeatureFlag | Impl→Data | structural |
| R36 | TESTED_BY | Story → TestSuite | Req→Verify | explicit |
| R37 | VERIFIED_BY | AC → TestCase | Req→Verify | explicit |
| R38 | BENCHMARKED_BY | Constraint → Benchmark | Req→Verify | explicit |
| R39 | CODE_TESTED_BY | Function/Class → TestCase | Impl→Verify | inferred |
| R40 | USES_FIXTURE | TestCase → TestFixture | Impl→Verify | structural |
| R41 | MOCKS | TestCase → Mock | Impl→Verify | structural |
| R42 | COVERS | TestCase → SourceFile | Impl→Verify | structural |
| R43 | GUARDED_BY | Story → RiskCheckpoint | Req→Risk | explicit |
| R44 | BLOCKS_GATE | Story → CertificationGate | Req→Risk | explicit |
| R45 | REQUIRED_FOR | AC → CertificationGate | Req→Risk | explicit |
| R46 | MEASURED_BY | Story → QualityMetric | Req→Risk | explicit |
| R47 | CONSTRAINED_BY | Story → PolicyRule | Req→Gov | explicit |
| R48 | IN_DOMAIN | PolicyRule → PolicyDomain | Req→Gov | explicit |
| R49 | REQUIRES_APPROVAL | Story → Role | Req→Gov | explicit |
| R50 | OWNED_BY | Epic → Person | Req→Gov | explicit |
| R51 | ENFORCES | Function → PolicyRule | Impl→Gov | explicit |
| R52 | RESTRICTED_BY | APIEndpoint → PolicyRule | Impl→Gov | explicit |
| R53 | AUDITED_BY | Function → PolicyRule | Impl→Gov | explicit |
| R54 | CONSUMES_BUDGET | Story → BudgetConstraint | Impl→Gov | explicit |
| R55 | REQUIRES_ESTIMATE | Story → ResourceEstimate | Impl→Gov | explicit |
| R56 | OPERATES_AT | Module/Pipeline → AutonomyLevel | Impl→Gov | explicit |
| R57 | DOCUMENTED_IN | Story → DocSection | Documentation | explicit |
| R58 | API_DOCUMENTED_IN | APIEndpoint → APIDoc | Documentation | structural |
| R59 | SCHEMA_DOCUMENTED_IN | DatabaseSchema → DocSection | Documentation | explicit |
| R60 | CLAIMS_IMPLEMENTATION | DocSection → Story | Documentation | explicit |
| R61 | CONTRACT_BACKED_BY | ContractClause → PolicyRule | Documentation | explicit |
| R62 | CONTRACT_REQUIRES | ContractClause → Story | Documentation | explicit |
| R63 | INTRODUCED_IN | Story → ReleaseVersion | Provenance | explicit |
| R64 | CHANGED_IN | AC → ReleaseVersion | Provenance | structural |
| R65 | DEPRECATED_IN | Story → ReleaseVersion | Provenance | explicit |
| R66 | IMPLEMENTED_IN | Story → Commit | Provenance | inferred |
| R67 | MODIFIED_IN | SourceFile → Commit | Provenance | structural |
| R68 | COMMIT_IN_PR | Commit → PullRequest | Provenance | structural |
| R69 | PR_IN_RELEASE | PullRequest → ReleaseVersion | Provenance | structural |
| R70 | GROUPS | ChangeSet → Commit | Provenance | explicit |
| R71 | ADDRESSES | ChangeSet → Story | Provenance | explicit |
| R72 | REPORTED_AGAINST | BugReport → Story/AC | Feedback | explicit |
| R73 | ROOT_CAUSE | Incident → SourceFile/Func | Feedback | hypothesized |
| R74 | CONTRIBUTED_TO | SourceFile/Func → Incident | Feedback | hypothesized |
| R75 | TRIGGERS_REFINEMENT | UserFeedback → Story | Feedback | explicit |
| R76 | VALIDATES_CONSTRAINT | ProductionMetric → Constraint | Feedback | structural |
| R77 | INVALIDATES_AC | Incident → AC | Feedback | hypothesized |
| R78 | HAS_VULNERABILITY | ExternalPackage → Vuln | Security | structural |
| R79 | LICENSED_AS | ExternalPackage → License | Security | structural |
| R80 | VIOLATES_POLICY | License → PolicyRule | Security | structural |
| R81 | REMEDIATES | Commit → Vulnerability | Security | explicit |
| R82 | HAS_ROLE | Person → Role | People | explicit |
| R83 | CONFLICTS_WITH | License → License | Legal | structural |
| R84 | HAS_RESTRICTION | License → LegalRestriction | Legal | explicit |
| R85 | REQUIRES_ATTRIBUTION | License → SourceFile | Legal | explicit |
| R86 | REQUIRES_A11Y | Story → AccessibilityReq | Accessibility | explicit |
| R87 | VIOLATES_A11Y | SourceFile → AccessibilityReq | Accessibility | structural |
| R88 | VALIDATED_BY_A11Y | AccessibilityReq → TestCase | Accessibility | explicit |
| R89 | MUST_CONFORM_TO | Story → UXGuideline | UX | explicit |
| R90 | VIOLATES_UX | SourceFile → UXGuideline | UX | structural |
| R91 | USES_DESIGN_SYSTEM | Module → DesignSystem | UX | explicit |
| R104 | DEPLOYS_TO | Service → Environment | Operations | structural |
| R105 | MONITORS | Alert → Service | Operations | structural |
| R106 | TRIGGERED_BY | Incident → Alert | Operations | inferred |
| R107 | RESOLVES | Commit → Incident | Operations | explicit |
| R108 | MEASURES | SLO → Service | Operations | structural |
| R109 | CONSUMES | Service → ErrorBudget | Operations | structural |
| R110 | DOCUMENTS | Runbook → Incident | Operations | explicit |
| R111 | VALIDATES | SimulationRun → Graph | Operations | structural |
| R112 | SIMULATES | SimulationRun → Service | Operations | structural |
| R113 | ACTUALLY_CALLS | Function → Function | Runtime Reconciliation | 1.0 (observed) | [DORMANT] |
| R114 | NEVER_EXECUTES | Function → ExecutionTrace | Runtime Reconciliation | min(0.95, trace.coverage) | [DORMANT] |

**Total: 100 Relationships (base) + 14 Extensions = 114 Relationships**

---

# Appendix C: Marker Specification

| Marker | Relationship | Confidence | Example |
|--------|--------------|------------|---------|
| `@implements STORY-XX.YY` | R18 | 1.0 | `// @implements STORY-54.1` |
| `@satisfies AC-XX.YY.ZZ` | R19 | 1.0 | `/** @satisfies AC-54.1.2 */` |
| `@enforces RULE-{tier}-{id}` | R51 | 1.0 | `/** @enforces RULE-TIER1-001 */` |
| `@tdd-section X.Y` | R14 | 1.0 | `// @tdd-section 5.1` |
| `describe('STORY-XX.YY: ...')` | R36 | 1.0 | `describe('STORY-54.1: Manifest')` |
| `it('AC-XX.YY.ZZ: ...')` | R37 | 1.0 | `it('AC-54.1.2: lists files')` |
| `<!-- @documents STORY-XX -->` | R57 | 1.0 | In markdown files |

---

# Appendix D: Gate Registry

| ID | Name | Track | Threshold | Type |
|----|------|-------|-----------|------|
| G01 | Story→Code | A+ | ≥99% | percentage |
| G03 | Code→Story | A+ | 0 orphans | count |
| G04 | Story→Test | A+ | ≥99% | percentage |
| G06 | Test→AC | A+ | 0 orphans | count |
| G-API | API Boundary | A+ | pass | boolean |
| G-HEALTH | System Health | B+ | pass | boolean |
| G-REGISTRY | BRD Registry | B+ | pass | boolean |
| G-DRIFT | Zero Drift | B+ | 0 changes | count |
| G-CLOSURE | Deterministic | B+ | identical | comparison |
| G-COMPATIBILITY | Prior Tests | C+ | 100% | percentage |
| G-SEMANTIC | Semantic | C+ | ≥80% | percentage |
| G-ALIGNMENT | Alignment | C+ | ≥80% | percentage |
| G-CONFIDENCE | Calibration | C+ | pass | boolean |
| G-POLICY | Policy | D+ | pass | boolean |
| G-AUTONOMY | Autonomy | D+ | pass | boolean |
| G-COMPLIANCE | Compliance | D+ | pass | boolean |
| G-AUDIT | Audit Trail | D+ | pass | boolean |
| G-SIMULATION | Simulation | D+ | pass | boolean |
| G-COGNITIVE | Cognitive Health | A+ | pass | boolean |
| G-OPS | Operations | D+ | pass | boolean |
| G-RUNTIME | Runtime Reconciliation | D.9+ | (Runtime ⊆ Static) OR (surprises classified) | boolean | [DORMANT] |

**Total: 20 Gates (active) + 1 Gate (dormant) = 21 Gates**

### New Gates in V20.1

**G-SIMULATION (Track D+)**
Validates temporal resilience through simulation testing.

| Criterion | Threshold |
|-----------|-----------|
| Cycles completed | ≥1000 |
| Drift per cycle | <0.1% |
| Policy violations | 0 |
| Semantic alignment | Never <75% |
| Gate failure rate | <5% |

**G-COGNITIVE (Track A+)**
Validates cognitive engine health for code generation.

| Criterion | Threshold |
|-----------|-----------|
| LLM connectivity | Verified |
| Response latency P99 | <5s |
| Token budget | Not exhausted |
| Fallback available | Yes |

**G-OPS (Track D+)**
Validates operations entities are correctly integrated.

| Criterion | Threshold |
|-----------|-----------|
| E91-E97 instantiated | All present |
| R104-R112 established | All present |
| Bidirectional traversal | Verified |
| Integration with E24, E53 | Verified |

**G-RUNTIME (Track D.9+) [DORMANT]**
Validates static-runtime reconciliation. Passes if (Runtime ⊆ Static) OR (all runtime surprises logged and classified).

| Criterion | Threshold |
|-----------|-----------|
| Runtime ⊆ Static | All observed calls exist in static graph |
| Surprises logged | All runtime surprises classified |
| Surprise taxonomy | LEGITIMATE_DYNAMIC, MISSING_STATIC_EDGE, INVESTIGATE, BUG |

**Activation:** G-RUNTIME is DORMANT until Track D.9. See `docs/integrations/EP-D-002_RUNTIME_RECONCILIATION_V20_6_1.md` for complete specification.

**Note:** G02 (AC→Code) and G05 (AC→Test) are available via Extension Protocol if finer-grained AC coverage is required.

---

# Epilogue: On the Completeness of Traceability

> **Classification: NON-NORMATIVE**  
> *This section is aspirational prose, not an architectural claim. The system's actual capabilities are defined by gates, tests, and verification specifications in the companion documents. Do not cite this epilogue as evidence of system behavior.*

This specification defines 83 entities (67 base + 16 extensions) across 14 layers, connected by 114 relationships (100 base + 14 extensions) across 21 categories. Every entity is reachable. Every relationship is bidirectionally traversable. Every connection carries confidence.

With this graph complete and correct:
- No requirement exists without implementation
- No code exists without justification
- No change occurs without known impact
- No hypothesis is mistaken for fact
- No incident occurs without traceable cause
- No drift occurs without detection
- No policy exists without enforcement
- No person acts without defined role
- No module operates without defined autonomy
- **No service runs without operational traceability** (V20.1)
- **No autonomy is granted without simulation validation** (V20.1)
- **No static claim is certain without runtime evidence** (V20.6.0)

**This is the traceability substrate.**

It connects artifacts with evidence anchors.
It queries relationships with confidence scores.
It audits changes with provenance trails.

Build it with the care it deserves.

---

**END OF SPECIFICATION**

**Final Statistics:**
- **Entities:** 67 (base) + 16 (extensions) = 83
- **Relationships:** 100 (base) + 14 (extensions) = 114
- **Categories:** 21
- **Layers:** 14
- **Stories:** 15 (Epic 64) + 3 (Epic 65) = 18
- **Acceptance Criteria:** 156 (Epic 64) + 21 (Epic 65) = 177
- **Coverage Gates:** 21 (20 active + 1 dormant)
- **Implementation Days:** 71

**Version:** 20.6.1 (Organ Alignment Edition)  
**Companion Documents:**
- BRD_V20_6_3_COMPLETE.md
- GNOSIS_TO_SOPHIA_MASTER_ROADMAP_V20_6_4.md
- UNIFIED_VERIFICATION_SPECIFICATION_V20_6_5.md
- CURSOR_IMPLEMENTATION_PLAN_V20_8_5.md (implements V20.6.4)
- EP-D-002_RUNTIME_RECONCILIATION_V20_6_1.md

*This is the DNA of autonomous software development. Everything else is expression.*
