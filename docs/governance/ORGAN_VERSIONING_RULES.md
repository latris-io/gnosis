# Organ Document Versioning Rules

**Version:** 1.0.0
**Authority:** GOVERNANCE_PHASED_PLAN.md §6

---

## Version Format

All organ docs use semantic versioning: `V{major}.{minor}.{patch}`

Example: `V20.6.3`

---

## Parity Requirements

### Rule 1: Header-EndMarker Parity

The version in the document header MUST match the version in the end-marker.

```markdown
<!-- Header -->
**Version:** 20.6.3

<!-- End-marker -->
**END OF DOCUMENT V20.6.3**
```

### Rule 2: Filename-Header Parity

The version in the filename MUST match the header version.

```
File: BRD_V20_6_4_COMPLETE.md
Header: **Version:** 20.6.4
```

### Rule 3: No Forward References

No organ doc may reference a version of another organ doc that does not exist.

```markdown
<!-- FORBIDDEN -->
- BRD V20.7.0 §Epic 64  (V20.7.0 does not exist)

<!-- ALLOWED -->
- BRD V20.6.3 §Epic 64  (V20.6.3 exists)
```

### Rule 4: Cross-Reference Accuracy

When referencing another organ doc, use its actual current version.

| Document | Current Version |
|----------|-----------------|
| BRD | V20.6.4 |
| UTG Schema | V20.6.1 |
| Verification Spec | V20.6.6 |
| Roadmap | V20.6.4 |
| Cursor Plan | V20.8.5 |
| EP-D-002 | V20.6.1 |

---

## Verification

Run: `npm run verify:organ-parity`

---

**END OF ORGAN_VERSIONING_RULES V1.0.0**

