# Story B.1: Ground Truth Engine

**Track:** B (Zero Drift)  
**Duration:** ~2 days  
**Gate:** G-HEALTH

---

## User Story

**As a** traceability system  
**I want** cryptographic proof of what files exist  
**So that** untracked or tampered files are detected

---

## Acceptance Criteria

| AC | Description | Pillar |
|----|-------------|--------|
| AC-B.1.1 | Generate manifest with SHA256 per file | — |
| AC-B.1.2 | Compute Merkle root of all hashes | — |
| AC-B.1.3 | Health check: manifest vs disk | — |
| AC-B.1.4 | Health score via Graph API v2 | API |
| AC-B.1.5 | G-HEALTH gate: fail if health < 100% | Gate |
| AC-B.1.6 | Log manifest operations to shadow ledger | Shadow |

---

## Technical Details

### Manifest Generation

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

## Definition of Done

- [ ] Manifest generation implemented
- [ ] Merkle root computation working
- [ ] Health check operational
- [ ] Graph API v2 endpoint added
- [ ] G-HEALTH gate implemented
- [ ] Shadow ledger logging added
- [ ] Tests passing
- [ ] Markers present (@implements, @satisfies)

