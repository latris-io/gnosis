# A2 Foundation Checklist (Relationship Registry)

**Classification:** Governance Artifact  
**Track:** A  
**Phase:** A2 (Relationship Registry)  
**Purpose:** Verify A2 relationships are structurally valid, evidence-anchored, and cross-store consistent before A3-A5 build on them.

---

## A2-V1: Endpoint Validity (by relationship type)

**Purpose:** Ensure all relationship endpoints match canonical type definitions.

### Canonical Endpoint Type Table

Source: `A2_RELATIONSHIP_REGISTRY.md` (canonical)  
Observed counts: 2025-12-20

| Code | Name | Expected From | Expected To | Observed Count |
|------|------|---------------|-------------|----------------|
| R01 | HAS_STORY | E01 (Epic) | E02 (Story) | 351 |
| R02 | HAS_AC | E02 (Story) | E03 (AC) | 2849 |
| R03 | HAS_CONSTRAINT | E03 (AC) | E04 (Constraint) | 0 (E04=0) |
| R04 | CONTAINS_FILE | E15 (Module) | E11 (SourceFile) | 34 |
| R05 | CONTAINS_ENTITY | E11 (SourceFile) | E12/E13 (Func/Class) | 145 |
| R06 | CONTAINS_SUITE | E27 (TestFile) | E28 (TestSuite) | 62 |
| R07 | CONTAINS_CASE | E28 (TestSuite) | E29 (TestCase) | 147 |
| R14 | IMPLEMENTED_BY | E06 (TechDesign) | E11 (SourceFile) | 27 |
| R16 | DEFINED_IN | E12/E13 (Func/Class) | E11 (SourceFile) | 145 |
| R63 | INTRODUCED_IN | E11 (SourceFile) | E50 (Commit) | 29 |
| R67 | MODIFIED_IN | E11 (SourceFile) | E50 (Commit) | 56 |
| R70 | GROUPS | E52 (ChangeSet) | E50 (Commit) | 1 |

**Note:** R03 count is 0 because E04 (Constraint) count is 0.

### Bad Endpoint Query Template

For each relationship type, run:

```sql
SELECT COUNT(*) AS bad_count
FROM relationships r
JOIN entities fe ON fe.id = r.from_entity_id
JOIN entities te ON te.id = r.to_entity_id
WHERE r.relationship_type = '{CODE}'
  AND NOT (fe.entity_type IN ({EXPECTED_FROM}) AND te.entity_type IN ({EXPECTED_TO}));
```

### Endpoint Validation Checklist

- [ ] R01 bad_count = 0 (E01 → E02)
- [ ] R02 bad_count = 0 (E02 → E03)
- [ ] R03 bad_count = 0 (E03 → E04)
- [ ] R04 bad_count = 0 (E15 → E11)
- [ ] R05 bad_count = 0 (E11 → E12/E13)
- [ ] R06 bad_count = 0 (E27 → E28)
- [ ] R07 bad_count = 0 (E28 → E29)
- [ ] R14 bad_count = 0 (E06 → E11)
- [ ] R16 bad_count = 0 (E12/E13 → E11)
- [ ] R63 bad_count = 0 (E11 → E50)
- [ ] R67 bad_count = 0 (E11 → E50)
- [ ] R70 bad_count = 0 (E52 → E50)

**Pass condition:** All bad_count = 0.

---

## A2-V2: Relationship Evidence Anchor Ground Truth

**Purpose:** Ensure relationships are backed by real source evidence.

### Sample Query

```sql
SELECT 
  instance_id,
  relationship_type,
  source_file,
  line_start,
  line_end
FROM relationships
WHERE relationship_type IN ('R16', 'R63', 'R67')
ORDER BY random()
LIMIT 5;
```

### Manual Verification

For each sampled relationship:
1. Open `source_file`
2. Navigate to `line_start`
3. Confirm the relationship claim is visible in code

- [ ] Relationship 1: Evidence matches extracted claim
- [ ] Relationship 2: Evidence matches extracted claim
- [ ] Relationship 3: Evidence matches extracted claim
- [ ] Relationship 4: Evidence matches extracted claim
- [ ] Relationship 5: Evidence matches extracted claim

**Pass condition:** All sampled relationships have valid evidence.

---

## A2-V3: Cross-Store Parity (MANDATORY)

**Purpose:** Ensure Neo4j is an exact mirror of Postgres relationships.

### A2-V3a: Total Count Parity

**Postgres:**
```sql
SELECT COUNT(*) AS pg_total FROM relationships;
```

**Neo4j:**
```cypher
MATCH ()-[r:RELATIONSHIP {project_id: $projectId}]->()
RETURN count(r) AS neo4j_total
```

- [ ] pg_total = neo4j_total

### A2-V3b: Per-Type Count Parity

**Postgres:**
```sql
SELECT relationship_type, COUNT(*) AS count
FROM relationships
GROUP BY relationship_type
ORDER BY relationship_type;
```

**Neo4j:**
```cypher
MATCH ()-[r:RELATIONSHIP {project_id: $projectId}]->()
RETURN r.relationship_type AS code, count(*) AS c
ORDER BY code
```

- [ ] All relationship_type counts match between Postgres and Neo4j

### A2-V3c: Property Model Lock

**Purpose:** Ensure Neo4j uses the correct property model (prevents regression).

**Check 1:** Relationship types in Neo4j
```cypher
CALL db.relationshipTypes()
```

- [ ] Returns ONLY `RELATIONSHIP` (no R01, R02, etc. as graph types)

**Check 2:** R-codes stored as property
```cypher
MATCH ()-[r:RELATIONSHIP {project_id: $projectId}]->()
RETURN r.relationship_type AS code, count(*) AS c
ORDER BY code
```

- [ ] All expected R-codes present (R01, R02, R04-R07, R14, R16, R63, R67, R70)

**Pass condition:** Postgres total == Neo4j total AND per-type match AND property model correct.

---

## A2-V4: Evidence Anchor Completeness

**Purpose:** Ensure code-derived relationships have valid evidence anchors.

### Query

```sql
SELECT relationship_type, COUNT(*) AS missing_evidence
FROM relationships
WHERE relationship_type IN ('R16','R63','R67')
  AND (source_file IS NULL OR source_file='' OR line_start IS NULL OR line_start < 1)
GROUP BY relationship_type
ORDER BY relationship_type;
```

- [ ] R16 missing_evidence = 0
- [ ] R63 missing_evidence = 0
- [ ] R67 missing_evidence = 0

**Pass condition:** All counts = 0.

**Note:** R01/R02 are BRD-derived (document parsing), their evidence anchors point to the BRD document, not source code.

---

## A2-V5: Determinism Micro-Check

**Purpose:** Ensure relationship derivation is deterministic (no ordering-based nondeterminism).

### Procedure

1. Pick 1-2 source files for containment derivation
2. Record current relationship instance_ids:
   ```sql
   SELECT instance_id
   FROM relationships
   WHERE source_file LIKE '%/src/db/postgres.ts'
     AND relationship_type IN ('R05', 'R16');
   ```
3. Re-run relationship derivation for those files (**dry-run mode — do not write to DB**)
4. Compare new instance_ids to recorded values

**Method:** Run provider in dry-run mode that outputs derived instance_ids to stdout/JSON, then compare to existing DB values.

**Pass condition:** instance_ids are identical before/after.

- [ ] Relationship instance_ids stable for test file 1
- [ ] Relationship instance_ids stable for test file 2

---

## Human Sign-Off

```
A2 Foundation Verification

Date: _______________
Reviewer: _______________

A2-V1 Endpoint Validity:
  [ ] All 12 relationship types pass endpoint checks (bad_count = 0)

A2-V2 Evidence Anchor Ground Truth:
  [ ] Manual spot-check passed (5 samples)

A2-V3 Cross-Store Parity:
  [ ] Total counts match (PG = Neo4j)
  [ ] Per-type counts match
  [ ] Property model correct (RELATIONSHIP type only, R-codes as properties)

A2-V4 Evidence Anchor Completeness:
  [ ] R16/R63/R67 all have valid evidence anchors

A2-V5 Determinism:
  [ ] Relationship instance_ids stable

Overall Status: [ ] PASS  [ ] FAIL

Notes:
_______________________________________________
_______________________________________________

Signed: _______________
```

---

**END OF A2 FOUNDATION CHECKLIST**
