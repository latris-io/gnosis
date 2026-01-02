---
tdd:
  id: TDD-TRACKB-B1
  type: TechnicalDesign
  version: "1.0.0"
  status: planned
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
- [ ] Graph API v1 operational
- [ ] E11 SourceFile entities available in graph

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
| B.1.3 | Health check: manifest vs disk | — |
| B.1.4 | Health score via Graph API v2 | API |
| B.1.5 | G-HEALTH gate: fail if health < 100% | Gate |
| B.1.6 | Log manifest operations to shadow ledger | Shadow |

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

### Health Check

Compare stored manifest to current disk:
- Missing files = unhealthy
- Extra files = unhealthy
- Hash mismatch = unhealthy
- All match = 100% healthy

---

## Dependencies

| Dependency | Source |
|------------|--------|
| E11 SourceFile | Graph API v1 |
| E50 Commit | Graph API v1 |
| R67 MODIFIES | Graph API v1 |

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
- [ ] G-HEALTH gate passing
- [ ] Evidence artifacts produced
- [ ] Verifiers green
- [ ] TDD registered as E06 in graph (`TDD-TRACKB-B1`)
- [ ] TDD linked to implementation SourceFiles via R14
