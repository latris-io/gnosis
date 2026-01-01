// src/services/graph/provenance.ts
// NO @satisfies markers — this is data, not behavioral code
// Markers belong on behavioral boundaries (graph-service, traversal-service, routes)
//
// Source authority: UTG Schema V20.6.1 Appendix B (canonical organ doc)
// R113/R114: DORMANT only — NO provenance category in UTG — OMITTED

export type ProvenanceCategory =
  | 'explicit'
  | 'structural'
  | 'inferred'
  | 'hypothesized'
  | 'speculative';

/**
 * Single source of truth for valid provenance categories.
 * Used by validation in programmatic API layer.
 */
export const VALID_PROVENANCE_CATEGORIES: ProvenanceCategory[] = [
  'explicit',
  'structural',
  'inferred',
  'hypothesized',
  'speculative',
];

/**
 * ORGAN-DERIVED mapping from UTG Schema V20.6.1 Appendix B.
 * Maps R-codes (R01–R112) to their provenance categories.
 *
 * R113/R114 are DORMANT only and have no provenance category in UTG — OMITTED.
 * Unknown R-codes return undefined from getProvenance().
 */
export const RELATIONSHIP_PROVENANCE: Record<string, ProvenanceCategory> = {
  // Hierarchical (R01-R07)
  R01: 'explicit',    // HAS_STORY
  R02: 'explicit',    // HAS_AC
  R03: 'explicit',    // HAS_CONSTRAINT
  R04: 'structural',  // CONTAINS_FILE
  R05: 'structural',  // CONTAINS_ENTITY
  R06: 'structural',  // CONTAINS_SUITE
  R07: 'structural',  // CONTAINS_CASE

  // Req→Design (R08-R13)
  R08: 'explicit',    // DESIGNED_IN
  R09: 'explicit',    // SPECIFIED_IN
  R10: 'explicit',    // DECIDED_BY
  R11: 'explicit',    // DEFINES_SCHEMA
  R12: 'explicit',    // DEFINES_INTERFACE
  R13: 'inferred',    // REQUIRES_TABLE

  // Design→Impl (R14-R17)
  R14: 'explicit',    // IMPLEMENTED_BY
  R15: 'structural',  // REALIZED_BY
  R16: 'structural',  // DEFINED_IN
  R17: 'structural',  // MIGRATED_BY

  // Req→Impl (R18-R20)
  R18: 'explicit',    // IMPLEMENTS
  R19: 'explicit',    // SATISFIES
  R20: 'explicit',    // IMPLEMENTS_EPIC

  // Impl→Impl (R21-R27)
  R21: 'structural',  // IMPORTS
  R22: 'structural',  // CALLS
  R23: 'structural',  // EXTENDS
  R24: 'structural',  // IMPLEMENTS_INTERFACE
  R25: 'structural',  // USES
  R26: 'structural',  // DEPENDS_ON
  R27: 'structural',  // DEPENDS_EXTERNAL

  // Impl→Data (R28-R35)
  R28: 'inferred',    // READS_FROM
  R29: 'inferred',    // WRITES_TO
  R30: 'structural',  // MIGRATES
  R31: 'structural',  // EXPOSES
  R32: 'inferred',    // CALLS_API
  R33: 'structural',  // USES_CONFIG
  R34: 'structural',  // REQUIRES_ENV
  R35: 'structural',  // GATED_BY

  // Req→Verify (R36-R38)
  R36: 'explicit',    // TESTED_BY
  R37: 'explicit',    // VERIFIED_BY
  R38: 'explicit',    // BENCHMARKED_BY

  // Impl→Verify (R39-R42)
  R39: 'inferred',    // CODE_TESTED_BY
  R40: 'structural',  // USES_FIXTURE
  R41: 'structural',  // MOCKS
  R42: 'structural',  // COVERS

  // Req→Risk (R43-R46)
  R43: 'explicit',    // GUARDED_BY
  R44: 'explicit',    // BLOCKS_GATE
  R45: 'explicit',    // REQUIRED_FOR
  R46: 'explicit',    // MEASURED_BY

  // Req→Gov (R47-R50)
  R47: 'explicit',    // CONSTRAINED_BY
  R48: 'explicit',    // IN_DOMAIN
  R49: 'explicit',    // REQUIRES_APPROVAL
  R50: 'explicit',    // OWNED_BY

  // Impl→Gov (R51-R56)
  R51: 'explicit',    // ENFORCES
  R52: 'explicit',    // RESTRICTED_BY
  R53: 'explicit',    // AUDITED_BY
  R54: 'explicit',    // CONSUMES_BUDGET
  R55: 'explicit',    // REQUIRES_ESTIMATE
  R56: 'explicit',    // OPERATES_AT

  // Documentation (R57-R62)
  R57: 'explicit',    // DOCUMENTED_IN
  R58: 'structural',  // API_DOCUMENTED_IN
  R59: 'explicit',    // SCHEMA_DOCUMENTED_IN
  R60: 'explicit',    // CLAIMS_IMPLEMENTATION
  R61: 'explicit',    // CONTRACT_BACKED_BY
  R62: 'explicit',    // CONTRACT_REQUIRES

  // Provenance (R63-R71)
  R63: 'explicit',    // INTRODUCED_IN
  R64: 'structural',  // CHANGED_IN
  R65: 'explicit',    // DEPRECATED_IN
  R66: 'inferred',    // IMPLEMENTED_IN
  R67: 'structural',  // MODIFIED_IN
  R68: 'structural',  // COMMIT_IN_PR
  R69: 'structural',  // PR_IN_RELEASE
  R70: 'explicit',    // GROUPS
  R71: 'explicit',    // ADDRESSES

  // Feedback (R72-R77)
  R72: 'explicit',       // REPORTED_AGAINST
  R73: 'hypothesized',   // ROOT_CAUSE
  R74: 'hypothesized',   // CONTRIBUTED_TO
  R75: 'explicit',       // TRIGGERS_REFINEMENT
  R76: 'structural',     // VALIDATES_CONSTRAINT
  R77: 'hypothesized',   // INVALIDATES_AC

  // Security (R78-R81)
  R78: 'structural',  // HAS_VULNERABILITY
  R79: 'structural',  // LICENSED_AS
  R80: 'structural',  // VIOLATES_POLICY
  R81: 'explicit',    // REMEDIATES

  // People (R82)
  R82: 'explicit',    // HAS_ROLE

  // Legal (R83-R85)
  R83: 'structural',  // CONFLICTS_WITH
  R84: 'explicit',    // HAS_RESTRICTION
  R85: 'explicit',    // REQUIRES_ATTRIBUTION

  // Accessibility (R86-R88)
  R86: 'explicit',    // REQUIRES_A11Y
  R87: 'structural',  // VIOLATES_A11Y
  R88: 'explicit',    // VALIDATED_BY_A11Y

  // UX (R89-R91)
  R89: 'explicit',    // MUST_CONFORM_TO
  R90: 'structural',  // VIOLATES_UX
  R91: 'explicit',    // USES_DESIGN_SYSTEM

  // NOTE: UTG Appendix B contains NO R92–R103 entries.
  // This range is intentionally skipped in the mapping.
  // The UTG jumps from R91 (UX) directly to R104 (Operations).

  // Operations (R104-R112)
  R104: 'structural', // DEPLOYS_TO
  R105: 'structural', // MONITORS
  R106: 'inferred',   // TRIGGERED_BY
  R107: 'explicit',   // RESOLVES
  R108: 'structural', // MEASURES
  R109: 'structural', // CONSUMES
  R110: 'explicit',   // DOCUMENTS
  R111: 'structural', // VALIDATES
  R112: 'structural', // SIMULATES

  // R113/R114 OMITTED — DORMANT only, no provenance category in UTG
};

/**
 * Get the provenance category for a relationship type (R-code).
 * Returns undefined if the R-code is unknown or dormant.
 */
export function getProvenance(rCode: string): ProvenanceCategory | undefined {
  return RELATIONSHIP_PROVENANCE[rCode];
}

/**
 * Check if a relationship type matches any of the allowed provenance categories.
 * Returns false if the R-code is unknown (treats unknown as excluded).
 */
export function matchesProvenance(
  rCode: string,
  allowed: ProvenanceCategory[]
): boolean {
  const prov = getProvenance(rCode);
  return prov !== undefined && allowed.includes(prov);
}

