# Track B Implementation Prompts

**Track:** B (Zero Drift)  
**Purpose:** Cursor implementation prompts for each Track B story

---

## General Track B Rules

Before implementing any Track B story:

1. **Read the story card completely** (`spec/track_b/stories/B*.md`)
2. **Track A is READ-ONLY** — access only via Graph API v1
3. **Use `src/api/v1/*` or `src/services/graph/*`** for all graph reads
4. **DO NOT import from Track A locked surfaces**
5. **Place Track B code in new directories** (e.g., `src/services/track_b/*`)
6. **Place Track B verification artifacts in `docs/verification/track_b/`**

---

## B.1 Ground Truth Engine Prompt

```
You are implementing Story B.1: Ground Truth Engine.

Read the complete story card: spec/track_b/stories/B1_GROUND_TRUTH.md

Implement a ground truth engine that:
1. Generates file manifests with SHA256 hashes per file
2. Computes Merkle root of all file hashes
3. Provides health check (manifest vs disk)
4. Exposes health score via Graph API v2
5. Implements G-HEALTH gate (fail if health < 100%)
6. Logs manifest operations to shadow ledger

Constraints:
- Access Track A entities via Graph API v1 only
- Create new service in src/services/track_b/ground-truth/
- Add markers: @implements STORY-B.1, @satisfies AC-B.1.*
```

---

## B.2 BRD Registry Prompt

```
You are implementing Story B.2: BRD Registry.

Read the complete story card: spec/track_b/stories/B2_BRD_REGISTRY.md

Implement a BRD registry that:
1. Parses markdown BRD → extracts epics/stories/ACs
2. Stores BRD version with content hash
3. Compares BRD stories to graph stories via API
4. Implements G-REGISTRY gate (fail on mismatch)
5. Logs BRD parsing to shadow ledger

Constraints:
- Reuse existing BRD parser if compatible
- Query Track A BRD entities via Graph API v1
- Add new registry service in src/services/track_b/brd-registry/
```

---

## B.3 Drift Detection Prompt

```
You are implementing Story B.3: Drift Detection.

Read the complete story card: spec/track_b/stories/B3_DRIFT_DETECTION.md

Implement drift detection that:
1. Creates GraphSnapshot with Merkle root
2. Diffs snapshots: adds, deletes, mutations
3. Implements G-DRIFT gate (fail if unexpected changes)
4. Exposes drift report via Graph API v2
5. Logs drift detection operations to shadow ledger

Constraints:
- Query current graph state via Graph API v1
- Store snapshots for comparison
- No direct DB access
```

---

## B.4 Closure Check Prompt

```
You are implementing Story B.4: Closure Check.

Read the complete story card: spec/track_b/stories/B4_CLOSURE_CHECK.md

Implement closure verification that:
1. Re-runs extraction pipeline
2. Compares resulting graph to stored graph
3. Implements G-CLOSURE gate (fail if graphs differ)
4. Reports exact differences if any
5. Logs closure check to shadow ledger

Constraints:
- Must use same extraction as Track A (via ops layer)
- Compare via entity/relationship instance IDs
- Zero tolerance for non-determinism
```

---

## B.5 Shadow Ledger Migration Prompt

```
You are implementing Story B.5: Shadow Ledger Migration.

Read the complete story card: spec/track_b/stories/B5_SHADOW_LEDGER_MIGRATION.md

Implement ledger migration that:
1. Reads shadow ledger JSONL files
2. Creates graph entities for ledger entries
3. Validates 100% migration completeness
4. Provides queryable ledger via Graph API v2
5. Maintains original ledger as backup

Constraints:
- Do not delete original ledger files
- Create new entities under Track B namespace
- Verify round-trip fidelity
```

---

## B.6 Graph API v2 Prompt

```
You are implementing Story B.6: Graph API v2.

Read the complete story card: spec/track_b/stories/B6_GRAPH_API_V2.md

Extend Graph API with:
1. Health score endpoint
2. Drift report endpoint
3. Registry query endpoint
4. Closure status endpoint
5. Ledger query endpoint

Constraints:
- Build on Graph API v1 patterns
- Do not modify v1 endpoints
- Add v2 endpoints in new module
- Document all new endpoints
```

---

## B.7 Semantic Corpus Export Prompt

```
You are implementing Story B.7: Semantic Corpus Export.

Read the complete story card: spec/track_b/stories/B7_SEMANTIC_CORPUS_EXPORT.md

Implement corpus export that:
1. Reads semantic signals from corpus files
2. Validates signal quality and completeness
3. Exports in training-ready format
4. Provides corpus statistics via Graph API v2
5. Logs export operations to shadow ledger

Constraints:
- ≥100 signals required (Track A + B)
- Export format must be documented
- Quality threshold must be configurable
```

---

## Verification Prompt (All Stories)

After implementing any Track B story:

```
Run the following verification:

1. npm run test:sanity
2. npm test
3. npm run verify:organ-parity
4. npm run verify:scripts-boundary
5. npm run lint:markers
6. TRACK_A_PHASE=A4 npm run verify:track-milestone

All must pass. Track A gates must remain green.
```

