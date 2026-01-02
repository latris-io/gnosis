---
tdd:
  id: TDD-TRACKB-B7
  type: TechnicalDesign
  version: "1.0.0"
  status: planned
---

# Story B.7: Semantic Corpus Export

**Track:** B (Zero Drift)  
**Duration:** ~0.5 day  
**Gate:** Corpus quality  
**TDD ID:** `TDD-TRACKB-B7`

---

## Purpose

Export semantic signals collected during extraction and verification for future training purposes.

---

## Entry Criteria

- [ ] B.6 Graph API v2 complete
- [ ] ≥100 semantic signals captured (A + B total)
- [ ] Semantic corpus files intact (`semantic-corpus/*/signals.jsonl`)

---

## Scope

### In Scope

- Reading semantic signals from corpus files
- Validating signal quality and completeness
- Exporting in training-ready format
- Corpus statistics via Graph API v2
- Shadow ledger logging for export operations

### Out of Scope

- Modification of Track A corpus logic
- Training model implementation
- Direct database access

---

## Related Canonical Requirements (Optional; BRD-only)

None.

This Track B capability (Semantic Corpus Export) is defined by the Roadmap Track B scope, not by a specific BRD requirement.

---

## Execution Obligations (Roadmap-defined)

| ID | Description | Pillar |
|----|-------------|--------|
| B.7.1 | Read semantic signals from corpus files | — |
| B.7.2 | Validate signal quality and completeness | — |
| B.7.3 | Export in training-ready format | — |
| B.7.4 | Provide corpus statistics via Graph API v2 | API |
| B.7.5 | Log export operations to shadow ledger | Shadow |

**Important:** Execution Obligations (B.x.y) are planning checkpoints only; verification authority resides exclusively in gate outcomes and HGR approvals.

---

## Gate(s) Involved

- **Corpus quality**: ≥100 signals, no duplicates, valid references

---

## Evidence Artifacts

- `docs/verification/track_b/B7_SEMANTIC_CORPUS_EVIDENCE.md`

---

## Implementation Constraints

- Access Track A data via Graph API v1 only
- Do not modify Track A locked surfaces
- Place implementation in `src/services/track_b/corpus-export/`
- Do NOT add `@satisfies AC-B.*` markers
- Do NOT add `@implements STORY-B.*` markers

---

## Technical Details

### Semantic Signal Structure

```typescript
interface SemanticSignal {
  id: string;
  signal_type: 'CORRECT' | 'INCORRECT' | 'PARTIAL' | 'ORPHAN_MARKER' | 'AMBIGUOUS';
  source_entity_id: string;
  target_entity_id?: string;
  context: string;
  confidence: number;
  captured_at: string;
  captured_by: 'EXTRACTION' | 'REVIEW' | 'VERIFICATION';
}
```

### Quality Validation

- Minimum 100 signals required
- No duplicate signals
- All referenced entities exist
- Confidence scores in valid range

### Export Format

```json
{
  "corpus_version": "1.0.0",
  "export_date": "2026-01-02T12:00:00Z",
  "signal_count": 150,
  "signals": [
    { ... }
  ],
  "statistics": {
    "by_type": { "CORRECT": 80, "INCORRECT": 30, ... },
    "by_source": { "EXTRACTION": 100, "REVIEW": 50 },
    "avg_confidence": 0.85
  }
}
```

---

## Dependencies

| Dependency | Source |
|------------|--------|
| Semantic corpus files | `semantic-corpus/*/signals.jsonl` |
| All entities | Graph API v1 |

---

## Required Verifiers

```bash
npm run verify:organ-parity
npm run verify:scripts-boundary
npm run lint:markers
npm test
npx tsx scripts/verify-track-a-lock.ts
```

---

## Definition of Done

- [ ] All Execution Obligations completed
- [ ] Corpus exported and validated
- [ ] Evidence artifacts produced
- [ ] Verifiers green
- [ ] TDD registered as E06 in graph (`TDD-TRACKB-B7`)
- [ ] TDD linked to implementation SourceFiles via R14

