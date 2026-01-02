# Story B.7: Semantic Corpus Export

**Track:** B (Zero Drift)  
**Duration:** ~1 day  
**Gate:** —

---

## User Story

**As a** traceability system  
**I want** to export my semantic signals  
**So that** they can be used for training

---

## Acceptance Criteria

| AC | Description | Pillar |
|----|-------------|--------|
| AC-B.7.1 | Read semantic signals from corpus files | — |
| AC-B.7.2 | Validate signal quality and completeness | — |
| AC-B.7.3 | Export in training-ready format | — |
| AC-B.7.4 | Provide corpus statistics via Graph API v2 | API |
| AC-B.7.5 | Log export operations to shadow ledger | Shadow |

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

## Definition of Done

- [ ] Corpus reading implemented
- [ ] Quality validation passing
- [ ] Export format documented
- [ ] Statistics endpoint added
- [ ] Shadow ledger logging added
- [ ] Tests passing
- [ ] Markers present

