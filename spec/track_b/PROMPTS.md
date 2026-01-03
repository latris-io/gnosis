# Track B Implementation Prompts

**Track:** B (Zero Drift)  
**Purpose:** Cursor implementation prompts for each Track B story

---

## General Track B Rules

Before implementing any Track B story:

1. **Read the story card completely** (`spec/track_b/stories/B*.md`)
2. **Track A is READ-ONLY** — access via HTTP calls to Graph API endpoints
3. **Use HTTP calls (fetch/axios):**
   - v1: `GRAPH_API_URL` for traversal/relationships-by-id
   - v2: `GRAPH_API_V2_URL` for enumeration (after B.6.1)
4. **DO NOT import from Track A locked surfaces** (no `import from 'src/api/v1/*'`)
5. **Place Track B code in:** `src/services/track_b/*`, `src/api/v2/*`, `src/track_b/http/*`
6. **Ledger writes go to:** `shadow-ledger/<project_id>/ledger.jsonl` with `track: "B"` field
7. **Evidence must record:** both API URLs if both were used
8. **Place Track B verification artifacts in `docs/verification/track_b/`**

---

## Marker Guidance (CRITICAL)

**Track B does NOT use AC-B.* or STORY-B.* markers:**

- Do NOT add `@satisfies AC-B.*` markers — these are not BRD-canonical ACs
- Do NOT add `@implements STORY-B.*` markers — these are not BRD stories
- Execution Obligations (B.x.y) are planning checkpoints only, NOT marker targets

**When to use canonical markers:**

- If a Track B TDD lists "Related Canonical Requirements" with existing BRD IDs
- Then the implementation file MUST use `@implements STORY-*` or `@satisfies AC-*`
- Only use markers for EXISTING BRD identifiers

**Gate verification replaces AC-based verification in Track B.**

---

## Verification Authority

Execution Obligations (B.x.y) are planning checkpoints only; verification authority resides exclusively in gate outcomes and HGR approvals.

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
- Do NOT add @satisfies AC-B.* markers
- Do NOT add @implements STORY-B.* markers
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
- Reuse existing BRD parser if compatible (call via ops layer)
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

Read the complete story card: spec/track_b/stories/B5_SHADOW_LEDGER.md

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
- Add v2 endpoints in src/api/v2/
- Document all new endpoints
```

---

## B.7 Semantic Corpus Export Prompt

```
You are implementing Story B.7: Semantic Corpus Export.

Read the complete story card: spec/track_b/stories/B7_SEMANTIC_CORPUS.md

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

## Evidence Artifact Naming

Track B evidence artifacts should follow this pattern:

```
docs/verification/track_b/
  B_CLOSEOUT_PACKET_<YYYY-MM-DD>.md
  TDD_REGISTRY_VERIFICATION.md
  REQUIREMENT_TDD_CODE_MAPPING.md
  B1_GROUND_TRUTH_EVIDENCE.md
  B2_BRD_REGISTRY_EVIDENCE.md
  ...
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
7. npx tsx scripts/verify-track-a-lock.ts

All must pass. Track A gates must remain green.
```
