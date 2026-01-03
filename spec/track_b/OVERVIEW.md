# Track B: Zero Drift

**Duration:** ~8 days (+20% contingency = ~10 days)  
**Question Answered:** "Is my memory sound?"  
**Ingestion:** #2  
**Oracle:** Gnosis (self-validates) — Bootstrap scripts retired after HGR-2

---

## Purpose

Achieve zero drift guarantee: ground truth, BRD registry, drift detection, closure verification. After Track B, Gnosis becomes the oracle.

---

## Conceptual Ladder

```
Track A (Graph Foundation) → Track B (Zero Drift) → Track C (Semantic Understanding) → Track D (Runtime) → Sophia
```

Track B builds **capabilities** on the Track A substrate without adding new entities or relationships to the core schema.

---

## What Track B IS

- Ground truth engine with cryptographic integrity
- BRD registry with version tracking
- Drift detection between ingestions
- Closure verification (determinism proof)
- Shadow ledger migration to graph
- Graph API v2 with extended capabilities
- Semantic corpus export for future training

## What Track B IS NOT

- Track B does **NOT** add new entity types to the graph schema
- Track B does **NOT** add new relationship types
- Track B does **NOT** modify Track A extraction logic
- Track B does **NOT** require reopening Track A locked surfaces

---

## Identifier Convention

**Track B does NOT introduce new canonical requirement identifiers:**

- No `AC-B.*` identifiers — AC-* are BRD-canonical only
- No `STORY-B.*` identifiers — Story IDs are BRD-canonical only
- Track B uses **Execution Obligations** numbered `B.x.y` from the Roadmap
- Gate IDs (`G-HEALTH`, `G-REGISTRY`, `G-DRIFT`, `G-CLOSURE`) are canonical

**Verification Authority:** Execution Obligations (B.x.y) are planning checkpoints only; verification authority resides exclusively in gate outcomes and HGR approvals.

---

## Track B Gates

Track B introduces 4 additional gates on top of the existing Track A gate set:

| Gate | Purpose |
|------|---------|
| G-HEALTH | System health metrics nominal |
| G-REGISTRY | BRD registry complete and queryable |
| G-DRIFT | Zero drift detected between ingestions |
| G-CLOSURE | Re-ingestion produces identical graph |

---

## Stories

| Story | Name | Duration | Gate | Sequence |
|-------|------|----------|------|----------|
| B.1 | Ground Truth Engine | ~2 days | G-HEALTH | 1 |
| B.2 | BRD Registry | ~2 days | G-REGISTRY | 2 |
| **B.6.1** | **Graph API v2 Enumeration** | **~0.5 day** | **API** | **3** |
| B.3 | Drift Detection | ~2 days | G-DRIFT | 4 |
| B.4 | Closure Check | ~1 day | G-CLOSURE | 5 |
| B.5 | Shadow Ledger Migration | ~1 day | HGR-2 prereq | 6 |
| B.6.2 | Graph API v2 Remaining | ~0.5 day | API boundary | 7 |
| B.7 | Semantic Corpus Export | ~0.5 day | Corpus quality | 8 |

**Note:** B.6 split per CID-2026-01-03. B.6.1 enables entity enumeration for B.3/B.4.

---

## Key Constraint: Track A Read-Only

Track B **MUST NOT** modify Track A locked surfaces:

- `src/extraction/**`
- `src/services/entities/**`, `src/services/relationships/**`, `src/services/sync/**`
- `src/db/**`, `migrations/**`
- `src/schema/track-a/**`
- `src/pipeline/**`, `src/ops/**`
- `src/api/v1/**`, `src/services/graph/**`, `src/http/**`
- `scripts/verification/**`
- `docs/verification/**` (except `docs/verification/track_b/**`)

Track B accesses Track A data via **HTTP calls** to Graph API endpoints:
- **v1** (`GRAPH_API_URL`): traversal, relationships-by-id
- **v2** (`GRAPH_API_V2_URL`): enumeration (after B.6.1 per CID-2026-01-03)

---

## Graph API v2 Placement

Graph API v2 is implemented OUTSIDE Track A locked surfaces:

- `src/api/v2/**` — new API layer
- `src/services/track_b/**` — Track B services

Graph API v2 **consumes** Graph API v1 (does not modify it).

---

## UVS Compliance

Track B spec structure and filenames align with the Track B inventory defined in UNIFIED_VERIFICATION_SPECIFICATION_V20.6.6.

---

## References

- Roadmap: `docs/GNOSIS_TO_SOPHIA_MASTER_ROADMAP_V20_6_4.md` → Track B section
- Entry criteria: `spec/track_b/ENTRY.md`
- Exit criteria: `spec/track_b/EXIT.md`
- Story cards: `spec/track_b/stories/B*.md`
- Human gate: `spec/track_b/HUMAN_GATE_HGR2.md`
