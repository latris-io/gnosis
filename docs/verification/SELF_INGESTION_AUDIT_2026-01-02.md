# Self-Ingestion Verification Audit

**Generated:** 2026-01-02T00:15:27.218Z  
**Project ID:** 6df2f456-440d-4958-b475-d9808775ff69  
**Base Directory:** src  
**Verified Types:** R21, R23  
**Overall Result:** ✅ PASS

---

## Executive Summary

This report independently verifies Track A's extracted relationships against
ground truth computed directly from source code AST analysis.

**Methodology:**
- Ground truth extracted using ts-morph (independent of Track A extraction)
- Relationships queried via Graph API v1 (not direct DB access)
- Precision and recall computed per relationship type

**Scoring Rules:**
- Only edges where **both endpoints are present in the graph** are scored
- Edges from entities not in graph are excluded (indicates stale graph, not extraction error)
- External imports (node_modules) are excluded (out of scope)

---

## Summary Table (Scored Edges Only)

| Type | Scored Ground Truth | Extracted | Matches | Precision | Recall | Threshold | Result |
|------|---------------------|-----------|---------|-----------|--------|-----------|--------|
| R21 | 129 | 129 | 129 | 100.0% | 100.0% | P≥99% R≥99% | ✅ PASS |
| R23 | 0 | 0 | 0 | 100.0% | 100.0% | P≥99% R≥99% | ✅ PASS |

---

## Exclusions Summary

| Type | Missing Entity (not scored) | Unresolved Imports (external) |
|------|----------------------------|-------------------------------|
| R21 | 0 | 35 |
| R23 | 0 | 1 |

---

## R21 Details

**Precision:** 100.00%  
**Recall:** 100.00%  
**Unresolved Items:** 35

### ✅ No Discrepancies

### Unresolved Items (35)

These items could not be resolved and are excluded from verification:

| Type | From | Target | File | Line | Reason |
|------|------|--------|------|------|--------|
| UNRESOLVED_IMPORT | `FILE-src/db/migrate.ts` | fs/promises | src/db/migrate.ts | 3 | External package (not in project) |
| UNRESOLVED_IMPORT | `FILE-src/db/migrate.ts` | path | src/db/migrate.ts | 4 | External package (not in project) |
| UNRESOLVED_IMPORT | `FILE-src/db/neo4j-migrate.ts` | fs/promises | src/db/neo4j-migrate.ts | 3 | External package (not in project) |
| UNRESOLVED_IMPORT | `FILE-src/db/neo4j-migrate.ts` | path | src/db/neo4j-migrate.ts | 4 | External package (not in project) |
| UNRESOLVED_IMPORT | `FILE-src/extraction/evidence-path.ts` | path | src/extraction/evidence-path.ts | 8 | External package (not in project) |
| UNRESOLVED_IMPORT | `FILE-src/extraction/evidence.ts` | child_process | src/extraction/evidence.ts | 6 | External package (not in project) |
| UNRESOLVED_IMPORT | `FILE-src/ledger/epoch-service.ts` | fs/promises | src/ledger/epoch-service.ts | 26 | External package (not in project) |
| UNRESOLVED_IMPORT | `FILE-src/ledger/epoch-service.ts` | path | src/ledger/epoch-service.ts | 27 | External package (not in project) |
| UNRESOLVED_IMPORT | `FILE-src/ledger/epoch-service.ts` | crypto | src/ledger/epoch-service.ts | 28 | External package (not in project) |
| UNRESOLVED_IMPORT | `FILE-src/ledger/epoch-service.ts` | child_process | src/ledger/epoch-service.ts | 29 | External package (not in project) |
| UNRESOLVED_IMPORT | `FILE-src/ledger/semantic-corpus.ts` | fs/promises | src/ledger/semantic-corpus.ts | 40 | External package (not in project) |
| UNRESOLVED_IMPORT | `FILE-src/ledger/semantic-corpus.ts` | path | src/ledger/semantic-corpus.ts | 41 | External package (not in project) |
| UNRESOLVED_IMPORT | `FILE-src/ledger/shadow-ledger.ts` | fs/promises | src/ledger/shadow-ledger.ts | 56 | External package (not in project) |
| UNRESOLVED_IMPORT | `FILE-src/ledger/shadow-ledger.ts` | path | src/ledger/shadow-ledger.ts | 57 | External package (not in project) |
| UNRESOLVED_IMPORT | `FILE-src/ops/track-a.ts` | path | src/ops/track-a.ts | 83 | External package (not in project) |
| UNRESOLVED_IMPORT | `FILE-src/pipeline/incremental.ts` | child_process | src/pipeline/incremental.ts | 13 | External package (not in project) |
| UNRESOLVED_IMPORT | `FILE-src/pipeline/orchestrator.ts` | child_process | src/pipeline/orchestrator.ts | 10 | External package (not in project) |
| UNRESOLVED_IMPORT | `FILE-src/services/entities/entity-service.ts` | crypto | src/services/entities/entity-service.ts | 9 | External package (not in project) |
| UNRESOLVED_IMPORT | `FILE-src/services/relationships/relationship-service.ts` | crypto | src/services/relationships/relationship-service.ts | 15 | External package (not in project) |
| UNRESOLVED_IMPORT | `FILE-src/extraction/providers/ast-provider.ts` | fs/promises | src/extraction/providers/ast-provider.ts | 9 | External package (not in project) |
| UNRESOLVED_IMPORT | `FILE-src/extraction/providers/ast-provider.ts` | path | src/extraction/providers/ast-provider.ts | 10 | External package (not in project) |
| UNRESOLVED_IMPORT | `FILE-src/extraction/providers/ast-relationship-provider.ts` | fs/promises | src/extraction/providers/ast-relationship-provider.ts | 19 | External package (not in project) |
| UNRESOLVED_IMPORT | `FILE-src/extraction/providers/ast-relationship-provider.ts` | path | src/extraction/providers/ast-relationship-provider.ts | 20 | External package (not in project) |
| UNRESOLVED_IMPORT | `FILE-src/extraction/providers/brd-provider.ts` | fs/promises | src/extraction/providers/brd-provider.ts | 7 | External package (not in project) |
| UNRESOLVED_IMPORT | `FILE-src/extraction/providers/brd-provider.ts` | path | src/extraction/providers/brd-provider.ts | 8 | External package (not in project) |
| UNRESOLVED_IMPORT | `FILE-src/extraction/providers/changeset-provider.ts` | child_process | src/extraction/providers/changeset-provider.ts | 11 | External package (not in project) |
| UNRESOLVED_IMPORT | `FILE-src/extraction/providers/containment-derivation-provider.ts` | path | src/extraction/providers/containment-derivation-provider.ts | 8 | External package (not in project) |
| UNRESOLVED_IMPORT | `FILE-src/extraction/providers/filesystem-provider.ts` | fs/promises | src/extraction/providers/filesystem-provider.ts | 8 | External package (not in project) |
| UNRESOLVED_IMPORT | `FILE-src/extraction/providers/filesystem-provider.ts` | path | src/extraction/providers/filesystem-provider.ts | 9 | External package (not in project) |
| UNRESOLVED_IMPORT | `FILE-src/extraction/providers/git-provider.ts` | child_process | src/extraction/providers/git-provider.ts | 7 | External package (not in project) |

*... and 5 more*

---

## R23 Details

**Precision:** 100.00%  
**Recall:** 100.00%  
**Unresolved Items:** 1

### ✅ No Discrepancies

### Unresolved Items (1)

These items could not be resolved and are excluded from verification:

| Type | From | Target | File | Line | Reason |
|------|------|--------|------|------|--------|
| UNRESOLVED_EXTENDS | `CLASS-src/api/v1/relationships.ts:ValidationError` | Error | src/api/v1/relationships.ts | 30 | Could not resolve base class declaration |

---

## Methodology Notes

### R21 IMPORTS
- Ground truth: All import declarations resolving to project source files
- Excluded: node_modules imports (external packages)
- Edge key: from SourceFile instance_id → to SourceFile instance_id

### R23 EXTENDS
- Ground truth: Class inheritance where base class is in project
- Excluded: External base classes (e.g., from libraries)
- Edge key: from Class instance_id → to Class instance_id

### R22 CALLS (Verifiable Subset)
- Ground truth: Direct function calls where callee resolves to project function
- Excluded: Method calls, dynamic calls, unresolvable symbols
- Note: This is a conservative subset; actual call graph may be larger
- Edge key: from Function instance_id → to Function instance_id

---

**END OF REPORT**
