# Story B.6: Graph API v2

**Track:** B (Zero Drift)  
**Duration:** ~1 day  
**Gate:** —

---

## User Story

**As a** traceability system  
**I want** extended query capabilities  
**So that** Track B features are accessible via API

---

## Acceptance Criteria

| AC | Description | Pillar |
|----|-------------|--------|
| AC-B.6.1 | Health score endpoint | API |
| AC-B.6.2 | Drift report endpoint | API |
| AC-B.6.3 | Registry query endpoint | API |
| AC-B.6.4 | Closure status endpoint | API |
| AC-B.6.5 | Ledger query endpoint | API |

---

## Technical Details

### API v2 Endpoints

```typescript
// Health
GET /api/v2/health
→ { score: number, details: HealthDetail[] }

// Drift
GET /api/v2/drift/:snapshotA/:snapshotB
→ DriftReport

POST /api/v2/drift/check
→ { drift_detected: boolean, report_id: string }

// Registry
GET /api/v2/registry/status
→ RegistryComparison

GET /api/v2/registry/brd
→ { version: string, hash: string, counts: {...} }

// Closure
GET /api/v2/closure/status
→ { last_check: string, passed: boolean }

POST /api/v2/closure/verify
→ { passed: boolean, differences: Difference[] }

// Ledger
GET /api/v2/ledger/entries?limit=100&offset=0
→ { entries: LedgerEntry[], total: number }

GET /api/v2/ledger/epochs
→ { epochs: Epoch[] }
```

### Design Principles

- Build on v1 patterns (programmatic API + optional HTTP)
- Do not modify v1 endpoints
- New module: `src/api/v2/`
- Services: `src/services/track_b/`

---

## Dependencies

| Dependency | Source |
|------------|--------|
| Graph API v1 | `src/api/v1/` |
| B.1 Ground Truth | Health data |
| B.3 Drift Detection | Drift data |
| B.2 BRD Registry | Registry data |
| B.4 Closure Check | Closure data |
| B.5 Ledger Migration | Ledger data |

---

## Definition of Done

- [ ] All v2 endpoints implemented
- [ ] Documentation added
- [ ] v1 endpoints unchanged
- [ ] Tests passing
- [ ] Markers present

