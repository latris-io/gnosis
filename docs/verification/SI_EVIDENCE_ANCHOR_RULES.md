# SI Evidence Anchor Rules

## Purpose

This document defines the formal acceptance rules for evidence anchors used in self-ingestion (SI) verification. These rules prevent SI failure for non-truth reasons (e.g., line drift, stale evidence).

## Scope

Track A through A2 only. These rules apply to relationships that require evidence anchors.

---

## 1. Which Relationships Require Evidence

| Type | Evidence Required | Anchor Fields |
|------|-------------------|---------------|
| R16 (DEFINED_IN) | YES | source_file, line_start, line_end |
| R63 (INTRODUCED_IN) | YES | source_file (sentinel ok), line_start |
| R67 (MODIFIED_IN) | YES | source_file (sentinel ok), line_start |
| R01, R02 (BRD) | Informational | source_file, line_start |
| R04, R05, R06, R07 | Derived | source_file only |
| R70 | Derived | N/A |

---

## 2. Evidence Completeness (E-ANCHOR-1)

A relationship is **evidence-complete** if:
- `source_file` is non-null and non-empty
- `line_start` is non-null and >= 1
- `line_end` is non-null and >= `line_start`

**Verification query:**
```sql
SELECT relationship_type, COUNT(*) AS incomplete
FROM relationships
WHERE relationship_type IN ('R16','R63','R67')
  AND (source_file IS NULL OR source_file = ''
       OR line_start IS NULL OR line_start < 1
       OR line_end IS NULL OR line_end < line_start)
GROUP BY relationship_type;
-- Expected: 0 rows
```

---

## 3. Evidence Validity (E-ANCHOR-2)

| Type | Validity Check |
|------|----------------|
| R16 (DEFINED_IN) | File exists AND entity name found in file (search-based) |
| R63/R67 (git-derived) | `.git:1` sentinel acceptable; validate via `git cat-file -t {sha}` |
| R01/R02 (BRD) | BRD file exists; line number informational only |

---

## 4. Line Drift Tolerance (E-ANCHOR-3)

**Do NOT use numeric line windows** (e.g., "within N lines"). Instead use search-based validation.

### Current State (no file hash tracking)

For R16 relationships:
1. Extract entity name from `from_instance_id` (e.g., `FUNC-src/db/postgres.ts:getClient` → `getClient`)
2. Search file for entity declaration using regex patterns:
   - `function\s+{name}\s*\(`
   - `const\s+{name}\s*=`
   - `async\s+function\s+{name}\s*\(`
   - `class\s+{name}\s*[{<]`
3. If entity name found anywhere in file: **VALID** (line drift tolerated)
4. If entity name not found: **INVALID** (entity deleted/renamed)

### Future State (with file hash tracking)

When `file_content_hash` is tracked in evidence:
- If hash unchanged: line numbers must match exactly (±2 lines for parser normalization)
- If hash differs: fall back to search-based validation

---

## 5. Shadow Ledger Coverage

### Covered Mutation Paths

| Path | Location | Ledger Logged |
|------|----------|---------------|
| Entity CREATE | `entity-service.ts:141` | YES |
| Entity UPDATE | `entity-service.ts:150` | YES |
| Relationship CREATE | `relationship-service.ts:224` | YES |
| Relationship UPDATE | `relationship-service.ts:233` | YES |

### Excluded Mutation Paths (By Design)

| Path | Location | Ledger Logged | Justification |
|------|----------|---------------|---------------|
| Neo4j entity sync | `sync-service.ts:21` | NO | Derived mirror |
| Neo4j relationship sync (MERGE) | `sync-service.ts:89` | NO | Derived mirror |
| Neo4j relationship sync (replace) | `sync-service.ts:211` | NO | Derived mirror |

**Design Decision:**

> Shadow ledger covers PostgreSQL mutations only. Neo4j is a derived mirror and its sync operations are NOT logged. Neo4j state is always reconstructible from PostgreSQL via the sync functions.

This is acceptable because:
1. PostgreSQL is the authoritative store
2. Neo4j is a read-optimized mirror
3. Neo4j state can be fully reconstructed by running `replaceRelationshipsInNeo4j()`
4. All authoritative mutations go through entity-service and relationship-service, which log

---

## 6. Semantic Corpus

### Expected State at End of A2

- Minimum 50 signals (per AC-64.1.18)
- CORRECT signals from all extraction providers:
  - BRDProvider (E01, E02, E03, E04)
  - FilesystemProvider (E06, E11, E27)
  - ASTProvider (E08, E12, E13, E28, E29)
  - GitProvider (E49, E50)
  - ChangesetProvider (E52)

### Verification

```bash
wc -l semantic-corpus/signals.jsonl
# Expected: >= 50

grep -c '"type":"CORRECT"' semantic-corpus/signals.jsonl
# Expected: > 0
```

---

## 7. Failure Conditions

### Blocking (must fix before A3)

- R16/R63/R67 with incomplete evidence
- R16 where entity name not found in file
- Semantic corpus < 50 signals
- Shadow ledger file missing or malformed

### Acceptable (governance debt)

- Neo4j sync not logged (documented design decision)
- File content hash not tracked (Track B+ feature)
- Search-based drift validation not automated (manual acceptable for A3)

---

## Document Metadata

- **Created:** 2025-12-21
- **Applies to:** Track A through A2
- **Author:** Cursor (SI Readiness Audit)
- **Status:** ACTIVE
