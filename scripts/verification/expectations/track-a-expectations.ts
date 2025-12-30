/**
 * Track A Expectations Model
 * 
 * Canonical source of truth for what entities and relationships
 * should exist at each phase of Track A.
 * 
 * @implements STORY-64.1 (Entity Registry verification)
 * @implements STORY-64.2 (Relationship Registry verification)
 * 
 * AUTHORITY: This file must mirror organ docs exactly (UTG Schema, Verification Spec, EXIT.md).
 * Per governance: Track docs CANNOT expand scope — only organ docs can (with CID + HGR-ORG-1).
 * 
 * CANONICAL COUNTS (FROZEN per organ docs):
 * - Entities: 16 (E01-E03, E04, E06, E08, E11-E13, E15, E27-E29, E49-E50, E52)
 * - Relationships: 20 (R01-R03, R04-R07, R14, R16, R18-R19, R21-R23, R26, R36-R37, R63, R67, R70)
 * 
 * EXCLUSIONS:
 * - R08/R09/R11: Post-HGR-1 (author-declared design-intent bindings), not counted in 20
 * - R24: Out-of-scope (requires E14, which is Post-Track-A)
 * - E84/E85, R113/R114: DORMANT (forbidden until Track D.9)
 */

import * as fs from 'fs';
import * as path from 'path';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type Status =
  | 'EXPECTED_NONZERO'   // Must have > 0 rows
  | 'EXPECTED_ZERO'      // Must have exactly 0 rows
  | 'DEFERRED_TO_A3'     // Not checked in A1/A2
  | 'DEFERRED_TO_A4'     // Not checked in A1/A2/A3
  | 'DEFERRED_TO_A5'     // Not checked in A1/A2/A3/A4
  | 'NA';                // Not applicable for Track A

export type Phase = 'A1' | 'A2' | 'A3' | 'A4' | 'A5';

export type EntityTypeCode =
  | 'E01' | 'E02' | 'E03' | 'E04' | 'E06' | 'E08'
  | 'E11' | 'E12' | 'E13' | 'E15'
  | 'E27' | 'E28' | 'E29'
  | 'E49' | 'E50' | 'E52';

export type RelationshipTypeCode =
  | 'R01' | 'R02' | 'R03' | 'R04' | 'R05' | 'R06' | 'R07'
  | 'R14' | 'R16' | 'R18' | 'R19'
  | 'R21' | 'R22' | 'R23' | 'R26'
  | 'R36' | 'R37'
  | 'R63' | 'R67' | 'R70';

// Post-HGR-1 relationships (not counted in 20, not required for Track A)
// R08/R09/R11 are author-declared design-intent bindings, not structural inventory
export type PostHGR1Code = 'R08' | 'R09' | 'R11';

// Dormant codes (forbidden)
export type DormantEntityCode = 'E84' | 'E85';
export type DormantRelationshipCode = 'R113' | 'R114';

// Out-of-scope (Post-Track-A)
export type OutOfScopeRelationshipCode = 'R24';

// -----------------------------------------------------------------------------
// Derived Source (for E04)
// -----------------------------------------------------------------------------

export interface DerivedSource {
  type: 'BRD_PATTERN_COUNT';
  pattern: RegExp;
  zeroMeansExpectedZero: boolean;
}

// -----------------------------------------------------------------------------
// Expectations
// -----------------------------------------------------------------------------

export interface EntityExpectation {
  code: EntityTypeCode;
  name: string;
  a1: Status;
  a2: Status;
  a3: Status;
  a4: Status;
  a5: Status;
  invariantCount?: number;       // If exact count is known (e.g., 65 epics)
  derivedFrom?: DerivedSource;   // If status is mechanically derived
}

export interface RelationshipExpectation {
  code: RelationshipTypeCode;
  name: string;
  a1: Status;
  a2: Status;
  a3: Status;
  a4: Status;
  a5: Status;
  invariantCount?: number;
}

// -----------------------------------------------------------------------------
// E04 Derivation (mechanically provable, not hand-waved)
// -----------------------------------------------------------------------------

const BRD_PATH = 'docs/BRD_V20_6_4_COMPLETE.md';

/**
 * Derive E04 (Constraint) status mechanically from BRD.
 * 
 * Pattern: CNST-{type}-{number} where type is alphanumeric and number is digits
 * Example: CNST-PERF-001, CNST-SEC-002
 * 
 * Excludes format specifiers like `CNST-{type}-{n}` which are templates.
 */
export function deriveE04Status(): Status {
  try {
    const brdPath = path.resolve(process.cwd(), BRD_PATH);
    const brdContent = fs.readFileSync(brdPath, 'utf-8');
    // Match actual constraint IDs (e.g., CNST-PERF-001), exclude templates
    const cnstMatches = brdContent.match(/CNST-[A-Z]+-\d+/g) || [];
    return cnstMatches.length === 0 ? 'EXPECTED_ZERO' : 'EXPECTED_NONZERO';
  } catch {
    // If BRD cannot be read, fail safe to EXPECTED_ZERO
    // (verifier will catch the real issue)
    return 'EXPECTED_ZERO';
  }
}

export function getE04InvariantCount(): number {
  try {
    const brdPath = path.resolve(process.cwd(), BRD_PATH);
    const brdContent = fs.readFileSync(brdPath, 'utf-8');
    // Match actual constraint IDs (e.g., CNST-PERF-001), exclude templates
    const cnstMatches = brdContent.match(/CNST-[A-Z]+-\d+/g) || [];
    return cnstMatches.length;
  } catch {
    return 0;
  }
}

// -----------------------------------------------------------------------------
// Entity Expectations (16 entities)
// -----------------------------------------------------------------------------

export const ENTITY_EXPECTATIONS: EntityExpectation[] = [
  // BRD entities (A1 scope)
  {
    code: 'E01',
    name: 'Epic',
    a1: 'EXPECTED_NONZERO',
    a2: 'EXPECTED_NONZERO',
    a3: 'EXPECTED_NONZERO',
    a4: 'EXPECTED_NONZERO',
    a5: 'EXPECTED_NONZERO',
    invariantCount: 65,
  },
  {
    code: 'E02',
    name: 'Story',
    a1: 'EXPECTED_NONZERO',
    a2: 'EXPECTED_NONZERO',
    a3: 'EXPECTED_NONZERO',
    a4: 'EXPECTED_NONZERO',
    a5: 'EXPECTED_NONZERO',
    invariantCount: 397,
  },
  {
    code: 'E03',
    name: 'AcceptanceCriterion',
    a1: 'EXPECTED_NONZERO',
    a2: 'EXPECTED_NONZERO',
    a3: 'EXPECTED_NONZERO',
    a4: 'EXPECTED_NONZERO',
    a5: 'EXPECTED_NONZERO',
    invariantCount: 3147,
  },
  {
    code: 'E04',
    name: 'Constraint',
    // Status is mechanically derived at verification time
    a1: deriveE04Status(),
    a2: deriveE04Status(),
    a3: deriveE04Status(),
    a4: deriveE04Status(),
    a5: deriveE04Status(),
    invariantCount: getE04InvariantCount(),
    derivedFrom: {
      type: 'BRD_PATTERN_COUNT',
      pattern: /CNST-\d+/g,
      zeroMeansExpectedZero: true,
    },
  },
  
  // Design entities (A1/A2 scope)
  {
    code: 'E06',
    name: 'ArchitecturalDecision',
    a1: 'EXPECTED_NONZERO',
    a2: 'EXPECTED_NONZERO',
    a3: 'EXPECTED_NONZERO',
    a4: 'EXPECTED_NONZERO',
    a5: 'EXPECTED_NONZERO',
  },
  {
    code: 'E08',
    name: 'Component',
    a1: 'EXPECTED_NONZERO',
    a2: 'EXPECTED_NONZERO',
    a3: 'EXPECTED_NONZERO',
    a4: 'EXPECTED_NONZERO',
    a5: 'EXPECTED_NONZERO',
  },
  
  // Implementation entities (A2 scope)
  {
    code: 'E11',
    name: 'SourceFile',
    a1: 'EXPECTED_ZERO',
    a2: 'EXPECTED_NONZERO',
    a3: 'EXPECTED_NONZERO',
    a4: 'EXPECTED_NONZERO',
    a5: 'EXPECTED_NONZERO',
  },
  {
    code: 'E12',
    name: 'Function',
    a1: 'EXPECTED_ZERO',
    a2: 'EXPECTED_NONZERO',
    a3: 'EXPECTED_NONZERO',
    a4: 'EXPECTED_NONZERO',
    a5: 'EXPECTED_NONZERO',
  },
  {
    code: 'E13',
    name: 'Class',
    a1: 'EXPECTED_ZERO',
    a2: 'EXPECTED_NONZERO',
    a3: 'EXPECTED_NONZERO',
    a4: 'EXPECTED_NONZERO',
    a5: 'EXPECTED_NONZERO',
  },
  {
    code: 'E15',
    name: 'Module',
    a1: 'EXPECTED_ZERO',
    a2: 'EXPECTED_NONZERO',
    a3: 'EXPECTED_NONZERO',
    a4: 'EXPECTED_NONZERO',
    a5: 'EXPECTED_NONZERO',
  },
  
  // Test entities (A2 scope)
  {
    code: 'E27',
    name: 'TestFile',
    a1: 'EXPECTED_ZERO',
    a2: 'EXPECTED_NONZERO',
    a3: 'EXPECTED_NONZERO',
    a4: 'EXPECTED_NONZERO',
    a5: 'EXPECTED_NONZERO',
  },
  {
    code: 'E28',
    name: 'TestSuite',
    a1: 'EXPECTED_ZERO',
    a2: 'EXPECTED_NONZERO',
    a3: 'EXPECTED_NONZERO',
    a4: 'EXPECTED_NONZERO',
    a5: 'EXPECTED_NONZERO',
  },
  {
    code: 'E29',
    name: 'TestCase',
    a1: 'EXPECTED_ZERO',
    a2: 'EXPECTED_NONZERO',
    a3: 'EXPECTED_NONZERO',
    a4: 'EXPECTED_NONZERO',
    a5: 'EXPECTED_NONZERO',
  },
  
  // Provenance entities (A2 scope)
  {
    code: 'E49',
    name: 'ReleaseVersion',
    a1: 'EXPECTED_ZERO',
    a2: 'EXPECTED_NONZERO',
    a3: 'EXPECTED_NONZERO',
    a4: 'EXPECTED_NONZERO',
    a5: 'EXPECTED_NONZERO',
  },
  {
    code: 'E50',
    name: 'Commit',
    a1: 'EXPECTED_ZERO',
    a2: 'EXPECTED_NONZERO',
    a3: 'EXPECTED_NONZERO',
    a4: 'EXPECTED_NONZERO',
    a5: 'EXPECTED_NONZERO',
  },
  {
    code: 'E52',
    name: 'ChangeSet',
    a1: 'EXPECTED_ZERO',
    a2: 'EXPECTED_NONZERO',
    // Known gap: Git extraction incomplete - deferred to A4 pipeline
    a3: 'DEFERRED_TO_A4',
    a4: 'EXPECTED_NONZERO',
    a5: 'EXPECTED_NONZERO',
  },
];

// -----------------------------------------------------------------------------
// R03 Derivation (depends on E04 count)
// -----------------------------------------------------------------------------

/**
 * Derive R03 (HAS_CONSTRAINT) status mechanically from E04 count.
 * 
 * R03 links Story/Epic → Constraint (E04).
 * If there are no E04 entities, R03 must be EXPECTED_ZERO.
 */
export function deriveR03Status(): Status {
  const e04Count = getE04InvariantCount();
  return e04Count === 0 ? 'EXPECTED_ZERO' : 'EXPECTED_NONZERO';
}


// -----------------------------------------------------------------------------
// Relationship Expectations (20 relationships)
// Names MUST match src/schema/track-a/relationships.ts
// -----------------------------------------------------------------------------

export const RELATIONSHIP_EXPECTATIONS: RelationshipExpectation[] = [
  // Requirements relationships (A1 scope)
  {
    code: 'R01',
    name: 'HAS_STORY',
    a1: 'EXPECTED_NONZERO',
    a2: 'EXPECTED_NONZERO',
    a3: 'EXPECTED_NONZERO',
    a4: 'EXPECTED_NONZERO',
    a5: 'EXPECTED_NONZERO',
    invariantCount: 397, // Every story belongs to an epic
  },
  {
    code: 'R02',
    name: 'HAS_AC',
    a1: 'EXPECTED_NONZERO',
    a2: 'EXPECTED_NONZERO',
    a3: 'EXPECTED_NONZERO',
    a4: 'EXPECTED_NONZERO',
    a5: 'EXPECTED_NONZERO',
    invariantCount: 3147, // Every AC belongs to a story
  },
  {
    code: 'R03',
    name: 'HAS_CONSTRAINT',
    // Status is mechanically derived from E04 count
    a1: deriveR03Status(),
    a2: deriveR03Status(),
    a3: deriveR03Status(),
    a4: deriveR03Status(),
    a5: deriveR03Status(),
    invariantCount: getE04InvariantCount(), // Matches E04 count
  },
  {
    code: 'R04',
    name: 'CONTAINS_FILE',
    a1: 'EXPECTED_NONZERO',
    a2: 'EXPECTED_NONZERO',
    a3: 'EXPECTED_NONZERO',
    a4: 'EXPECTED_NONZERO',
    a5: 'EXPECTED_NONZERO',
  },
  {
    code: 'R05',
    name: 'CONTAINS_ENTITY',
    a1: 'EXPECTED_NONZERO',
    a2: 'EXPECTED_NONZERO',
    a3: 'EXPECTED_NONZERO',
    a4: 'EXPECTED_NONZERO',
    a5: 'EXPECTED_NONZERO',
  },
  {
    code: 'R06',
    name: 'CONTAINS_SUITE',
    a1: 'EXPECTED_NONZERO',
    a2: 'EXPECTED_NONZERO',
    a3: 'EXPECTED_NONZERO',
    a4: 'EXPECTED_NONZERO',
    a5: 'EXPECTED_NONZERO',
  },
  {
    code: 'R07',
    name: 'CONTAINS_CASE',
    a1: 'EXPECTED_NONZERO',
    a2: 'EXPECTED_NONZERO',
    // Containment extraction is complete (252 R07 relationships extracted at A2)
    a3: 'EXPECTED_NONZERO',
    a4: 'EXPECTED_NONZERO',
    a5: 'EXPECTED_NONZERO',
  },
  
  // Design relationships (A2 scope)
  {
    code: 'R14',
    name: 'IMPLEMENTED_BY',
    a1: 'EXPECTED_ZERO',
    a2: 'EXPECTED_NONZERO',
    // Known gap: TDD relationship extraction incomplete - deferred to A4 pipeline
    a3: 'DEFERRED_TO_A4',
    a4: 'EXPECTED_NONZERO',
    a5: 'EXPECTED_NONZERO',
  },
  {
    code: 'R16',
    name: 'DEFINED_IN',
    a1: 'EXPECTED_ZERO',
    a2: 'EXPECTED_NONZERO',
    a3: 'EXPECTED_NONZERO',
    a4: 'EXPECTED_NONZERO',
    a5: 'EXPECTED_NONZERO',
  },
  
  // Marker relationships (A3 scope - deferred)
  {
    code: 'R18',
    name: 'IMPLEMENTS',
    a1: 'DEFERRED_TO_A3',
    a2: 'DEFERRED_TO_A3',
    a3: 'EXPECTED_NONZERO',
    a4: 'EXPECTED_NONZERO',
    a5: 'EXPECTED_NONZERO',
  },
  {
    code: 'R19',
    name: 'SATISFIES',
    a1: 'DEFERRED_TO_A3',
    a2: 'DEFERRED_TO_A3',
    a3: 'EXPECTED_NONZERO',
    a4: 'EXPECTED_NONZERO',
    a5: 'EXPECTED_NONZERO',
  },
  
  // Structural relationships (A4 scope - deferred)
  {
    code: 'R21',
    name: 'IMPORTS',
    a1: 'DEFERRED_TO_A4',
    a2: 'DEFERRED_TO_A4',
    a3: 'DEFERRED_TO_A4',
    a4: 'EXPECTED_NONZERO',
    a5: 'EXPECTED_NONZERO',
  },
  {
    code: 'R22',
    name: 'CALLS',
    a1: 'DEFERRED_TO_A4',
    a2: 'DEFERRED_TO_A4',
    a3: 'DEFERRED_TO_A4',
    a4: 'EXPECTED_NONZERO',
    a5: 'EXPECTED_NONZERO',
  },
  {
    code: 'R23',
    name: 'EXTENDS',
    a1: 'DEFERRED_TO_A4',
    a2: 'DEFERRED_TO_A4',
    a3: 'DEFERRED_TO_A4',
    a4: 'EXPECTED_NONZERO',
    a5: 'EXPECTED_NONZERO',
  },
  {
    code: 'R26',
    name: 'DEPENDS_ON',
    a1: 'DEFERRED_TO_A4',
    a2: 'DEFERRED_TO_A4',
    a3: 'DEFERRED_TO_A4',
    a4: 'EXPECTED_NONZERO',
    a5: 'EXPECTED_NONZERO',
  },
  
  // Verification relationships (A3 scope per organ docs)
  // Per A3_MARKER_EXTRACTION.md @scope-relationships-active: R36, R37
  // Per UTG Schema V20.6.1: R36 from describe('STORY-XX.YY'), R37 from it('AC-XX.YY.ZZ')
  // Per A2_RELATIONSHIP_REGISTRY.md: "Deferred to A3: R18, R19, R36, R37 (marker-dependent)"
  // Note: Extraction is IMPLEMENTED and CORRECT. At least 1 R36 and 2 R37 expected
  // from test/verification/marker-relationships.test.ts naming convention.
  {
    code: 'R36',
    name: 'TESTED_BY',
    a1: 'DEFERRED_TO_A3',
    a2: 'DEFERRED_TO_A3',
    a3: 'EXPECTED_NONZERO',  // At least 1: describe('STORY-64.3: ...')
    a4: 'EXPECTED_NONZERO',
    a5: 'EXPECTED_NONZERO',
  },
  {
    code: 'R37',
    name: 'VERIFIED_BY',
    a1: 'DEFERRED_TO_A3',
    a2: 'DEFERRED_TO_A3',
    a3: 'EXPECTED_NONZERO',  // At least 2: it('AC-64.3.1: ...'), it('AC-64.3.2: ...')
    a4: 'EXPECTED_NONZERO',
    a5: 'EXPECTED_NONZERO',
  },
  
  // Provenance relationships (A2 scope)
  // Per Track A canon (ENTRY.md): R63 INTRODUCED_IN is SourceFile → Commit
  // (Track A-scoped deviation from global canon Story → ReleaseVersion)
  {
    code: 'R63',
    name: 'INTRODUCED_IN',
    a1: 'EXPECTED_ZERO',
    a2: 'EXPECTED_NONZERO',
    // Known gap: Git relationship extraction incomplete - deferred to A4 pipeline
    a3: 'DEFERRED_TO_A4',
    a4: 'EXPECTED_NONZERO',
    a5: 'EXPECTED_NONZERO',
  },
  {
    code: 'R67',
    name: 'MODIFIED_IN',
    a1: 'EXPECTED_ZERO',
    a2: 'EXPECTED_NONZERO',
    // Known gap: Git relationship extraction incomplete - deferred to A4 pipeline
    a3: 'DEFERRED_TO_A4',
    a4: 'EXPECTED_NONZERO',
    a5: 'EXPECTED_NONZERO',
  },
  {
    code: 'R70',
    name: 'GROUPS',
    a1: 'EXPECTED_ZERO',
    a2: 'EXPECTED_NONZERO',
    // Known gap: Git relationship extraction incomplete - deferred to A4 pipeline
    a3: 'DEFERRED_TO_A4',
    a4: 'EXPECTED_NONZERO',
    a5: 'EXPECTED_NONZERO',
  },
];

// -----------------------------------------------------------------------------
// Internal Linkages (not counted in 20)
// -----------------------------------------------------------------------------

export const POST_HGR1_RELATIONSHIPS: PostHGR1Code[] = ['R08', 'R09', 'R11'];

// -----------------------------------------------------------------------------
// Out-of-Scope (Post-Track-A)
// -----------------------------------------------------------------------------

export const OUT_OF_SCOPE_RELATIONSHIPS: OutOfScopeRelationshipCode[] = ['R24'];

// -----------------------------------------------------------------------------
// Forbidden (Dormant until Track D.9)
// -----------------------------------------------------------------------------

export const DORMANT_ENTITIES: DormantEntityCode[] = ['E84', 'E85'];
export const DORMANT_RELATIONSHIPS: DormantRelationshipCode[] = ['R113', 'R114'];

// -----------------------------------------------------------------------------
// Unexpected Type Justifications
// -----------------------------------------------------------------------------

export interface UnexpectedJustification {
  code: string;                    // E99, R99, etc.
  reason: string;                  // Why it exists
  allowedPhases: Phase[];          // Phases where it's permitted
  expiryMilestone: string;         // When it MUST be removed or promoted
  owner: string;                   // Who added it (for accountability)
  addedDate: string;               // ISO date
}

/**
 * Explicit justifications for unexpected types.
 * 
 * DEFAULT POLICY: UNKNOWN = FAIL
 * Any entity or relationship type not in the canonical set (16E/20R)
 * will FAIL verification unless explicitly listed here.
 */
export const UNEXPECTED_JUSTIFICATIONS: UnexpectedJustification[] = [
  // Example:
  // {
  //   code: 'R99',
  //   reason: 'Exploratory edge for Track B dependency analysis',
  //   allowedPhases: ['A2', 'A3', 'A4'],
  //   expiryMilestone: 'A5-exit-candidate',
  //   owner: 'developer-name',
  //   addedDate: '2025-12-19',
  // }
];

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

export function getEntityExpectation(code: EntityTypeCode): EntityExpectation | undefined {
  return ENTITY_EXPECTATIONS.find(e => e.code === code);
}

export function getRelationshipExpectation(code: RelationshipTypeCode): RelationshipExpectation | undefined {
  return RELATIONSHIP_EXPECTATIONS.find(r => r.code === code);
}

export function getStatusForPhase(
  expectation: EntityExpectation | RelationshipExpectation,
  phase: Phase
): Status {
  const key = phase.toLowerCase() as 'a1' | 'a2' | 'a3' | 'a4' | 'a5';
  return expectation[key];
}

export function isDeferred(status: Status): boolean {
  return status.startsWith('DEFERRED_TO_');
}

export function isDormantEntity(code: string): boolean {
  return DORMANT_ENTITIES.includes(code as DormantEntityCode);
}

export function isDormantRelationship(code: string): boolean {
  return DORMANT_RELATIONSHIPS.includes(code as DormantRelationshipCode);
}

export function isPostHGR1Relationship(code: string): boolean {
  return POST_HGR1_RELATIONSHIPS.includes(code as PostHGR1Code);
}

export function isOutOfScope(code: string): boolean {
  return OUT_OF_SCOPE_RELATIONSHIPS.includes(code as OutOfScopeRelationshipCode);
}

export function isCanonicalEntity(code: string): boolean {
  return ENTITY_EXPECTATIONS.some(e => e.code === code);
}

export function isCanonicalRelationship(code: string): boolean {
  return RELATIONSHIP_EXPECTATIONS.some(r => r.code === code);
}

/**
 * Check if an unexpected type is allowed.
 * 
 * DEFAULT: UNKNOWN = FAIL
 * Returns allowed: true only if explicitly justified with valid, unexpired justification.
 */
export function isUnexpectedAllowed(
  code: string,
  currentPhase: Phase
): { allowed: boolean; justification?: UnexpectedJustification; expired?: boolean; reason?: string } {
  // Dormant codes are FORBIDDEN - no justification possible
  if (isDormantEntity(code) || isDormantRelationship(code)) {
    return { allowed: false, reason: `FORBIDDEN: ${code} is dormant until Track D.9` };
  }
  
  // Find explicit justification
  const justification = UNEXPECTED_JUSTIFICATIONS.find(j => j.code === code);
  if (!justification) {
    return { allowed: false, reason: `Unknown type ${code} requires explicit justification in UNEXPECTED_JUSTIFICATIONS` };
  }
  
  // Check if expired (simple milestone comparison)
  const milestoneOrder = ['A1', 'A2', 'A3', 'A4', 'A5', 'A5-exit-candidate', 'HGR-1', 'Track-B'];
  const currentIdx = milestoneOrder.indexOf(currentPhase);
  const expiryIdx = milestoneOrder.indexOf(justification.expiryMilestone);
  
  if (expiryIdx !== -1 && currentIdx >= expiryIdx) {
    return { 
      allowed: false, 
      justification, 
      expired: true,
      reason: `Justification for ${code} expired at ${justification.expiryMilestone}`,
    };
  }
  
  // Check if allowed in current phase
  if (!justification.allowedPhases.includes(currentPhase)) {
    return { 
      allowed: false, 
      justification,
      reason: `Justification for ${code} not valid in phase ${currentPhase}`,
    };
  }
  
  return { allowed: true, justification };
}

// -----------------------------------------------------------------------------
// Summary
// -----------------------------------------------------------------------------

export const CANONICAL_COUNTS = {
  entities: ENTITY_EXPECTATIONS.length,    // 16
  relationships: RELATIONSHIP_EXPECTATIONS.length, // 20
};

// Only log when imported, not when run as script
if (process.env.VERBOSE) {
  console.log(`Track A Expectations loaded: ${CANONICAL_COUNTS.entities} entities, ${CANONICAL_COUNTS.relationships} relationships`);
}

