# Change Impact Declaration (CID) Template

**Version:** 1.0.0
**Authority:** GOVERNANCE_PHASED_PLAN.md §7

---

## CID Format

```
CID-{YYYY}-{NNN}
```

Example: `CID-2025-001`

---

## Template

When making organ doc changes, include this in your commit message:

```
CID-YYYY-NNN: [Brief description]

Organ Doc(s): [file(s) being changed]
Change Type: [semantic | cosmetic | structural]
Impact: [none | low | medium | high]

Changes:
- [specific change 1]
- [specific change 2]

Justification: [why this change is needed]
```

---

## Example

```
CID-2025-001: Fix version drift in organ docs

Organ Doc(s): GNOSIS_TO_SOPHIA_MASTER_ROADMAP_V20_6_4.md,
              UNIFIED_VERIFICATION_SPECIFICATION_V20_6_6.md
Change Type: cosmetic
Impact: none

Changes:
- Fix Roadmap end-marker: V20.6.3 → V20.6.4
- Fix VerSpec end-marker: V20.6.4 → V20.6.5

Justification: End-markers must match header versions per
ORGAN_VERSIONING_RULES.md Rule 1
```

---

## Phase Requirements

| Phase | CID Required | Additional |
|-------|--------------|------------|
| 0 | Semantic changes only | Commit message |
| 1 | All organ changes | + CID_LOG.md entry |
| 2 | All organ changes | + HGR-ORG-1 approval |

---

**END OF CID_TEMPLATE V1.0.0**

