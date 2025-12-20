# A1 Foundation Checklist (Entity Registry)

**Classification:** Governance Artifact  
**Track:** A  
**Phase:** A1 (Entity Registry)  
**Purpose:** Verify A1 entities are real, stable, and deterministic before A3-A5 build on them.

---

## A1-V1: Entity Ground Truth (Reality Check)

**Purpose:** Ensure extracted entities correspond to real code, not hallucinations.

### A1-V1a: E11 File Existence

```sql
SELECT instance_id, attributes->>'file_path' AS path
FROM entities
WHERE entity_type = 'E11'
ORDER BY random()
LIMIT 5;
```

**Manual verification:**
- [ ] File 1 exists on disk at recorded path (case-sensitive)
- [ ] File 2 exists on disk at recorded path (case-sensitive)
- [ ] File 3 exists on disk at recorded path (case-sensitive)
- [ ] File 4 exists on disk at recorded path (case-sensitive)
- [ ] File 5 exists on disk at recorded path (case-sensitive)

**Pass condition:** All 5 files exist.

### A1-V1b: E12/E13 AST Existence

```sql
SELECT 
  e.instance_id,
  e.name,
  e.entity_type,
  e.source_file,
  e.line_start,
  e.line_end
FROM entities e
WHERE e.entity_type IN ('E12','E13')
ORDER BY random()
LIMIT 5;
```

**Manual verification:**
- [ ] Entity 1: Open file, confirm function/class exists at recorded location
- [ ] Entity 2: Open file, confirm function/class exists at recorded location
- [ ] Entity 3: Open file, confirm function/class exists at recorded location
- [ ] Entity 4: Open file, confirm function/class exists at recorded location
- [ ] Entity 5: Open file, confirm function/class exists at recorded location

**Pass condition:** All 5 entities exist in AST at recorded locations.

---

## A1-V2: Determinism Micro-Check

**Purpose:** Ensure instance_ids are stable across re-extraction.

### Procedure

1. Pick 1-2 source files (e.g., `src/db/postgres.ts`)
2. Record current instance_ids:
   ```sql
   SELECT instance_id
   FROM entities
   WHERE source_file LIKE '%/src/db/postgres.ts';
   ```
3. Re-run extraction for those files only (dry-run mode)
4. Compare new instance_ids to recorded values

**Pass condition:** instance_ids are identical before/after.

**HALT condition:** If instance_ids differ, Track A must stop. Everything downstream breaks.

- [ ] Instance IDs stable for test file 1
- [ ] Instance IDs stable for test file 2

---

## A1-V3: Entity Coverage Sanity

**Purpose:** Ensure BRD counts match exactly, no duplicates, no NULL critical fields.

### A1-V3a: BRD Counts

```sql
SELECT entity_type, COUNT(*) AS count
FROM entities
WHERE entity_type IN ('E01', 'E02', 'E03')
GROUP BY entity_type
ORDER BY entity_type;
```

**Expected values:**
| Entity Type | Name | Expected Count |
|-------------|------|----------------|
| E01 | Epic | 65 |
| E02 | Story | 351 |
| E03 | AcceptanceCriterion | 2849 |

- [ ] E01 count = 65
- [ ] E02 count = 351
- [ ] E03 count = 2849

### A1-V3b: No Duplicate instance_ids

```sql
SELECT instance_id, COUNT(*)
FROM entities
GROUP BY instance_id
HAVING COUNT(*) > 1;
```

**Pass condition:** 0 rows returned.

- [ ] No duplicate instance_ids

### A1-V3c: No NULL Critical Fields

```sql
SELECT COUNT(*) AS null_instance_ids
FROM entities
WHERE instance_id IS NULL;
```

**Pass condition:** 0.

- [ ] null_instance_ids = 0

### A1-V3d: E11 Path Integrity — Missing Path

```sql
SELECT COUNT(*) AS missing_file_path
FROM entities
WHERE entity_type='E11'
  AND COALESCE(attributes->>'file_path','') = '';
```

**Pass condition:** 0.

- [ ] missing_file_path = 0

### A1-V3e: E11 Path Integrity — Duplicates

```sql
SELECT attributes->>'file_path' AS path, COUNT(*)
FROM entities
WHERE entity_type='E11'
GROUP BY attributes->>'file_path'
HAVING COUNT(*) > 1;
```

**Pass condition:** 0 rows returned.

- [ ] No duplicate file paths

---

## Human Sign-Off

```
A1 Foundation Verification

Date: _______________
Reviewer: _______________

A1-V1 Entity Ground Truth:
  [ ] E11 file existence verified
  [ ] E12/E13 AST existence verified

A1-V2 Determinism:
  [ ] Instance IDs stable

A1-V3 Coverage Sanity:
  [ ] BRD counts match (65/351/2849)
  [ ] No duplicate instance_ids
  [ ] No NULL critical fields
  [ ] E11 path integrity (no missing, no duplicates)

Overall Status: [ ] PASS  [ ] FAIL

Notes:
_______________________________________________
_______________________________________________

Signed: _______________
```

---

**END OF A1 FOUNDATION CHECKLIST**
