# Track A Lock Hash — Tamper-Evident Artifact

**Generated:** 2026-01-02  
**Purpose:** Tamper-evident verification of Track A locked surface integrity

---

## Baseline Reference

| Field | Value |
|-------|-------|
| **Blessed Tag** | `track-a5-green` |
| **Blessed SHA** | `93ba7872885e1449004959eb8c79870da144f983` |
| **Lock Scope** | Option B (Comprehensive) |
| **Authority** | HGR-1.1 Extension Packet |

---

## Lock Hash

```
84bc0d055cdb8df55a9b75b839d4dfa502b6c409019fe2158463ce09aba78ba1
```

---

## Computation Method

**Command (deterministic, null-delimited, CI-friendly):**

```bash
find \
  src/schema/track-a \
  src/extraction \
  src/services/entities \
  src/services/relationships \
  src/services/sync \
  src/db \
  migrations \
  src/markers \
  src/ledger \
  src/pipeline \
  src/ops \
  src/api/v1 \
  src/services/graph \
  src/http \
  scripts/verification \
  spec/track_a \
  test/fixtures \
  -type f -print0 2>/dev/null | \
  sort -z | \
  xargs -0 shasum -a 256 2>/dev/null | \
  shasum -a 256
```

**Output format:** `<hash>  -`

---

## Locked Surface Paths (Comprehensive — Option B)

| Category | Path |
|----------|------|
| Core Track A (A1-A3) | `src/schema/track-a/` |
| | `src/extraction/` |
| | `src/services/entities/` |
| | `src/services/relationships/` |
| | `src/services/sync/` |
| | `src/db/` |
| | `migrations/` |
| Markers (A3) | `src/markers/` |
| Ledger | `src/ledger/` |
| Pipeline (A4) | `src/pipeline/` |
| | `src/ops/` |
| Graph API (A5) | `src/api/v1/` |
| | `src/services/graph/` |
| | `src/http/` |
| Verification + Specs | `scripts/verification/` |
| | `spec/track_a/` |
| | `test/fixtures/` |

---

## Verification Instructions

To verify Track A lock integrity:

1. **Checkout the blessed baseline:**
   ```bash
   git checkout track-a5-green
   ```

2. **Run the hash command above**

3. **Compare output to recorded hash:**
   ```
   Expected: 84bc0d055cdb8df55a9b75b839d4dfa502b6c409019fe2158463ce09aba78ba1
   ```

4. **If mismatch:** Track A surfaces have been modified since lock. Investigate via:
   ```bash
   git diff track-a5-green..HEAD -- <locked_paths>
   ```

---

## Change Detection

Any modification to locked surfaces will:
1. Change this hash
2. Trigger CI failure via `scripts/verify-track-a-lock.ts`
3. Require CODEOWNERS approval (@latris-io)
4. Require CID with `REOPEN_TRACK_A: true`

---

**END OF TRACK A LOCK HASH ARTIFACT**

