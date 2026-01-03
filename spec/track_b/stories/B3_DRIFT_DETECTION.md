---
tdd:
  id: TDD-TRACKB-B3
  type: TechnicalDesign
  version: "1.0.0"
  status: complete
  implements:
    files:
      - src/services/track_b/drift-detection/types.ts
      - src/services/track_b/drift-detection/http-client.ts
      - src/services/track_b/drift-detection/merkle.ts
      - src/services/track_b/drift-detection/snapshot.ts
      - src/services/track_b/drift-detection/diff.ts
      - src/services/track_b/drift-detection/gate.ts
      - src/services/track_b/drift-detection/ledger.ts
      - src/services/track_b/drift-detection/signals.ts
      - src/services/track_b/drift-detection/index.ts
---

# Story B.3: Drift Detection

**Track:** B (Zero Drift)  
**Duration:** ~2 days  
**Gate:** G-DRIFT  
**TDD ID:** `TDD-TRACKB-B3`

---

## Purpose

Detect changes between graph snapshots to identify regressions, unexpected mutations, or structural drift.

---

## Entry Criteria

- [ ] B.1 Ground Truth Engine complete
- [ ] B.2 BRD Registry complete
- [ ] **B.6.1 Graph API v2 Enumeration complete**
- [ ] `GRAPH_API_V2_URL` environment variable configured

---

## Scope

### In Scope

- Graph snapshot creation with Merkle roots
- Diff computation (adds, deletes, mutations)
- G-DRIFT gate implementation
- Drift reporting via Graph API v2
- Shadow ledger logging for drift detection

### Out of Scope

- Modification of Track A extraction logic
- Changes to existing entity schemas
- Direct database access

---

## Related Canonical Requirements (Optional; BRD-only)

None.

This Track B capability (Drift Detection) is defined by the Roadmap Track B scope, not by a specific BRD requirement.

---

## Execution Obligations (Roadmap-defined)

| ID | Description | Pillar |
|----|-------------|--------|
| B.3.1 | Create GraphSnapshot with Merkle root | — |
| B.3.2 | Diff snapshots: adds, deletes, mutations | — |
| B.3.3 | G-DRIFT gate: fail if unexpected changes | Gate |
| B.3.4 | Drift report via Graph API v2 | API |
| B.3.5 | Log drift detection to shadow ledger | Shadow |
| B.3.6 | Capture semantic signals for suspicious drift | Corpus |

**Important:** Execution Obligations (B.x.y) are planning checkpoints only; verification authority resides exclusively in gate outcomes and HGR approvals.

---

## Gate(s) Involved

- **G-DRIFT**: Zero drift detected between ingestions (fail if unexpected changes)

---

## Evidence Artifacts

- `docs/verification/track_b/B3_DRIFT_DETECTION_EVIDENCE.md`

---

## Implementation Constraints

- Access Track A data via **HTTP calls** to `GRAPH_API_URL` (v1) and `GRAPH_API_V2_URL` (v2)
- Use v2 enumeration with pagination for whole-graph snapshots
- Do NOT import from Track A locked surfaces
- Do not modify Track A locked surfaces
- Ledger writes to `shadow-ledger/<project_id>/ledger.jsonl` with `track: "B"`, `story: "B.3"`
- Evidence must record: `GRAPH_API_URL`, `GRAPH_API_V2_URL`, `PROJECT_ID`
- Place implementation in `src/services/track_b/drift-detection/`
- Do NOT add `@satisfies AC-B.*` markers
- Do NOT add `@implements STORY-B.*` markers

---

## Technical Details

### GraphSnapshot

```typescript
interface GraphSnapshot {
  id: string;
  created_at: string;
  commit_sha: string;
  entity_merkle_root: string;
  relationship_merkle_root: string;
  entity_count: number;
  relationship_count: number;
}
```

### Diff Computation

Compare two snapshots:
- Entities added (new IDs)
- Entities deleted (missing IDs)
- Entities mutated (same ID, different hash)
- Relationships added/deleted/mutated

### Drift Report

```typescript
interface DriftReport {
  snapshot_a: string;
  snapshot_b: string;
  drift_detected: boolean;
  summary: {
    entities_added: number;
    entities_deleted: number;
    entities_mutated: number;
    relationships_added: number;
    relationships_deleted: number;
    relationships_mutated: number;
  };
  details: DriftItem[];
}
```

---

## Dependencies

| Dependency | Source |
|------------|--------|
| All entities | `GRAPH_API_V2_URL/api/v2/entities` (paginated) |
| All relationships | `GRAPH_API_V2_URL/api/v2/relationships` (paginated) |
| E50 Commit | `GRAPH_API_URL` (v1 traversal, if needed) |

**Note:** Use pagination (`limit`/`offset`). Enumerate all pages until `has_more=false` for complete snapshot.

---

## Running the v2 Server

The v2 enumeration endpoints require a running server:

```bash
# Set environment variables
export $(grep -v '^#' .env | xargs)
export GRAPH_API_V2_PORT=3001

# Start v2 server (background)
npx tsx src/track_b/http/server.ts &

# Verify it's running
curl http://localhost:3001/health
```

The v1 server (`src/http/server.ts`) runs on port 3000 (if needed for traversal).

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
- [ ] G-DRIFT gate passing
- [ ] Evidence artifacts produced
- [ ] Verifiers green
- [ ] TDD registered as E06 in graph (`TDD-TRACKB-B3`)
- [ ] TDD linked to implementation SourceFiles via R14
