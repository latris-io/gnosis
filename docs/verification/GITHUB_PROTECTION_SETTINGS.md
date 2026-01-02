# GitHub Branch Protection Settings

**Purpose:** Document required GitHub settings to enforce Track A lock  
**Target Branch:** `main`

---

## Design Goal

- Track B work should merge **without requiring approval** for non-locked paths
- Track A locked paths should require **CODEOWNERS approval**
- CI status checks should be required for all merges

---

## Recommended Settings

### 1. Branch Protection Rules (Settings → Branches → Add rule)

| Setting | Value | Reason |
|---------|-------|--------|
| **Branch name pattern** | `main` | Protect main branch |
| **Require a pull request before merging** | ✅ Enabled | Enforce PR workflow |
| **Require approvals** | ❌ Disabled (or set to 0) | Track B merges without approval |
| **Require review from Code Owners** | ✅ Enabled | **Critical:** Only locked paths require approval |
| **Dismiss stale pull request approvals** | ✅ Enabled | Ensure fresh review for locked paths |
| **Require status checks to pass** | ✅ Enabled | Block merges on CI failure |
| **Status checks that are required** | `parity` | Organ Parity workflow job |
| **Require branches to be up to date** | ⚠️ Optional | Can slow down merges |
| **Require conversation resolution** | ⚠️ Optional | Nice to have |
| **Require signed commits** | ❌ Optional | Not required for governance |
| **Include administrators** | ✅ Enabled | Admins follow same rules |
| **Restrict pushes** | ❌ Disabled | Allow direct pushes (PRs enforced by policy) |
| **Allow force pushes** | ❌ Disabled | Prevent history rewriting |
| **Allow deletions** | ❌ Disabled | Prevent branch deletion |

---

### 2. CODEOWNERS Configuration

File: `.github/CODEOWNERS`

The CODEOWNERS file is already configured with:
- All Track A locked paths owned by `@latris-io`
- Any PR touching these paths will require approval from `@latris-io`

---

### 3. Tag Protection Rules (Settings → Tags → New rule)

| Pattern | Protection |
|---------|------------|
| `track-a*-green` | Protect from deletion/modification |
| `hgr-*` | Protect from deletion/modification |

---

### 4. Required Status Checks

The following status checks must pass:

| Check | Workflow | Job |
|-------|----------|-----|
| `parity` | `.github/workflows/organ-parity.yml` | `parity` |

This job runs:
1. `scripts/verify-track-a-lock.ts` — Track A lock enforcement
2. `npm run verify:organ-parity` — Organ document parity
3. `scripts/verify-cid-for-organ-changes.ts` — CID enforcement
4. `npm run verify:scripts-boundary` — G-API boundary

---

## Verification Checklist

After configuring GitHub settings, verify:

- [ ] Create a PR touching a non-locked file (e.g., `README.md`)
  - Expected: Merges without approval once CI passes
  
- [ ] Create a PR touching a locked file (e.g., `src/extraction/providers/ast-provider.ts`)
  - Expected: Requires @latris-io approval
  - Expected: CI fails with "Track A lock" message unless CID provided

- [ ] Create a PR with a valid CID reference touching locked files
  - Expected: CI passes if CID exists and contains `REOPEN_TRACK_A: true`
  - Expected: Still requires @latris-io approval

- [ ] Attempt to delete `track-a5-green` tag
  - Expected: Blocked by tag protection

---

## How Track B Work Merges Without Friction

1. Developer creates PR for Track B work (e.g., new service under `src/services/foo/`)
2. CI runs and passes (no locked surfaces touched)
3. PR merges **without requiring human approval** (no CODEOWNERS match)

## How Track A Reopening Works

1. Developer creates CID document with `REOPEN_TRACK_A: true`
2. Developer creates PR referencing CID in title/body/commit
3. CI runs `verify-track-a-lock.ts` which validates CID
4. @latris-io reviews and approves (CODEOWNERS requirement)
5. PR merges after approval + CI pass

---

## Notes

- This configuration allows **parallel development** on Track B without blocking on approvals
- Track A modifications are **exceptional** and require formal CID + approval
- All merges still require CI to pass (no exceptions)

---

**END OF GITHUB PROTECTION SETTINGS**

