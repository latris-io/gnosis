# Track B: Zero Drift

**Duration:** ~8 days (+20% contingency = ~10 days)  
**Question Answered:** "Is my memory sound?"  
**Ingestion:** #2  
**Oracle:** Gnosis (self-validates) — Bootstrap scripts retired after HGR-2

---

## Purpose

Achieve zero drift guarantee: ground truth, BRD registry, drift detection, closure verification. After Track B, Gnosis becomes the oracle.

---

## Scope

Track B adds **capabilities** on the Track A substrate, not new entities/relationships.

| Capability | Purpose | Depends On |
|------------|---------|------------|
| Ground Truth Engine | Know what files exist with hash integrity | E11, E50, R67 |
| BRD Registry | Structured requirements queryable from graph | E01-E04, R01-R03 |
| Drift Detection | Compare state at T₁ vs T₂ | E49, E50, E52, R63, R67, R70 |
| Closure Check | Re-ingestion produces identical graph | All Track A |
| Shadow Ledger Migration | Move external ledger into graph | E50, E52, R70 |
| Graph API v2 | Extended query capabilities | Graph API v1 |
| Semantic Corpus Export | Export training signals | Semantic corpus |

---

## Track B Gates (4 additional)

| Gate | Purpose |
|------|---------|
| G-HEALTH | System health metrics nominal |
| G-REGISTRY | BRD registry complete and queryable |
| G-DRIFT | Zero drift detected between ingestions |
| G-CLOSURE | Re-ingestion produces identical graph |

**After Track B:** 8 total gates (4 from Track A + 4 from Track B)

---

## Stories

| Story | Name | Duration | Description |
|-------|------|----------|-------------|
| B.1 | Ground Truth Engine | ~2 days | Cryptographic proof of file existence |
| B.2 | BRD Registry | ~2 days | Parse and store BRD as graph entities |
| B.3 | Drift Detection | ~2 days | Detect changes between builds |
| B.4 | Closure Check | ~1 day | Verify deterministic ingestion |
| B.5 | Shadow Ledger Migration | ~1 day | Move ledger into graph |
| B.6 | Graph API v2 | ~1 day | Extended query capabilities |
| B.7 | Semantic Corpus Export | ~1 day | Export training signals |

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

Track B accesses Track A data **only** through Graph API v1.

---

## References

- Roadmap: `docs/GNOSIS_TO_SOPHIA_MASTER_ROADMAP_V20_6_4.md` → Track B section
- Entry criteria: `spec/track_b/ENTRY.md`
- Exit criteria: `spec/track_b/EXIT.md`
- Story cards: `spec/track_b/stories/B*.md`
- Human gate: `spec/track_b/HUMAN_GATE_HGR2.md`

