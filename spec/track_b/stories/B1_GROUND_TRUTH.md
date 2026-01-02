---
tdd:
  id: TDD-TRACKB-B1
  type: TechnicalDesign
  version: "1.0.0"
  status: implemented
  implements:
    files:
      - src/services/track_b/ground-truth/types.ts
      - src/services/track_b/ground-truth/file-scope.ts
      - src/services/track_b/ground-truth/manifest.ts
      - src/services/track_b/ground-truth/merkle.ts
      - src/services/track_b/ground-truth/health.ts
      - src/services/track_b/ground-truth/ledger.ts
      - src/services/track_b/ground-truth/index.ts
    # Note: scripts/** are excluded from E11 extraction by design.
    # CLI entrypoints are documented under "Operational CLI" section below
    # and are not included in implements.files (no R14 linkage possible).
---

# Story B.1: Ground Truth Engine

**Track:** B (Zero Drift)  
**Duration:** ~2 days  
**Gate:** G-HEALTH  
**TDD ID:** `TDD-TRACKB-B1`

---

## Purpose

Establish cryptographic proof of what files exist in the codebase, enabling detection of untracked or tampered files.

---

## Entry Criteria

- [ ] Track B entry criteria met (`spec/track_b/ENTRY.md`)
- [ ] File system accessible for manifest generation

---

## Scope

### In Scope

- File manifest generation with SHA256 hashes
- Merkle root computation for codebase state
- Health check comparing manifest to disk
- G-HEALTH gate implementation
- Shadow ledger logging for manifest operations

### Out of Scope

- Modification of Track A extraction logic
- Changes to existing entity schemas
- Direct database access

---

## Related Canonical Requirements (Optional; BRD-only)

None.

This Track B capability (Ground Truth Engine) is defined by the Roadmap Track B scope, not by a specific BRD requirement.

---

## Execution Obligations (Roadmap-defined)

| ID | Description | Pillar |
|----|-------------|--------|
| B.1.1 | Generate manifest with SHA256 per file | — |
| B.1.2 | Compute Merkle root of all hashes | — |
| B.1.3 | Health check: baseline vs disk | — |
| B.1.4 | Health score available via CLI (`scripts/ground-truth.ts check`) | — |
| B.1.5 | G-HEALTH gate: fail if health < 100% | Gate |
| B.1.6 | Log manifest operations to shadow ledger | Shadow |

**Note:** Health score exposed via Graph API v2 is deferred to B.6 (`GET /api/v2/health`).

**Important:** Execution Obligations (B.x.y) are planning checkpoints only; verification authority resides exclusively in gate outcomes and HGR approvals.

---

## Gate(s) Involved

- **G-HEALTH**: System health metrics nominal (fail if health < 100%)

---

## Evidence Artifacts

- `docs/verification/track_b/B1_GROUND_TRUTH_EVIDENCE.md`

---

## Implementation Constraints

- Access Track A data via Graph API v1 only
- Do not modify Track A locked surfaces
- Place implementation in `src/services/track_b/ground-truth/`
- Do NOT add `@satisfies AC-B.*` markers
- Do NOT add `@implements STORY-B.*` markers

---

## Technical Details

### Manifest Structure

```typescript
interface FileManifest {
  path: string;
  sha256: string;
  size: number;
  mtime: string;
}

interface GroundTruthManifest {
  generated_at: string;
  merkle_root: string;
  file_count: number;
  files: FileManifest[];
}
```

### Merkle Root Computation

- Sort files by path (deterministic)
- Compute SHA256 for each file
- Build Merkle tree
- Root = single hash representing entire codebase state

### Health Check (B.1 scope: baseline ↔ disk)

Compare stored baseline manifest to current disk:
- Missing files (in baseline, not on disk) = unhealthy
- Extra files (on disk, not in baseline) = unhealthy
- Hash mismatch = unhealthy
- Merkle root mismatch = unhealthy
- All match = 100% healthy

**Note:** Graph coverage validation (disk ↔ graph E11 entities) is **deferred to B.6 (Graph API v2)**. Graph API v1 does not expose an entity listing endpoint, and Track B cannot modify Track A locked surfaces (`src/http/**`). B.6 will add `/api/v2/entities` for this purpose.

---

## Dependencies

| Dependency | Source | Required for |
|------------|--------|--------------|
| File system | Node.js fs | Manifest generation |
| Crypto | Node.js crypto | SHA256/Merkle |

**Graph API v1 dependencies (read-only, not required for B.1 core health check):**

| Dependency | Source | Deferred to |
|------------|--------|-------------|
| E11 SourceFile listing | Graph API v2 | B.6 |

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

## Operational CLI

**CLI Entrypoint:** `scripts/ground-truth.ts`

> **Note:** This script is part of B.1 but not listed in `implements.files` because `scripts/**` are excluded from E11 extraction by design (see `src/extraction/providers/marker-provider.ts`). R14 linkage is not possible for scripts.

### Commands

```bash
# Set baseline (captures current repo state)
npx tsx scripts/ground-truth.ts set-baseline

# Check health (compares baseline to current disk)
PROJECT_ID=<uuid> npx tsx scripts/ground-truth.ts check

# Full check with Graph API (when available)
PROJECT_ID=<uuid> GRAPH_API_URL=http://localhost:3000 npx tsx scripts/ground-truth.ts check
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PROJECT_ID` | Yes (for `check`) | Canonical project UUID |
| `GRAPH_API_URL` | No | Graph API base URL (graph coverage deferred to B.6) |

---

## Definition of Done

- [ ] All Execution Obligations completed
- [ ] G-HEALTH gate passing
- [ ] Evidence artifacts produced
- [ ] Verifiers green
- [ ] TDD registered as E06 in graph (`TDD-TRACKB-B1`)
- [ ] TDD linked to implementation SourceFiles via R14
