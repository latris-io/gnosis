# BRD Format Specification

**Version:** 1.0.0  
**Created:** 2026-01-01  
**Status:** CANONICAL  
**Purpose:** Explicit format rules for BRD documents to ensure deterministic parsing  
**Companion to:** `docs/BRD_V20_6_4_COMPLETE.md`  
**Parser Implementation:** `src/extraction/parsers/brd-parser.ts`

---

## 1. Purpose

This document makes the implicit BRD parsing schema explicit. It ensures:

1. **Determinism** — Future BRD authors produce parseable documents
2. **Validation** — Format violations are detectable before extraction
3. **Traceability** — Every entity extracted maps to a defined pattern
4. **Forward compatibility** — New sections can be added without breaking parsing

**Governing principle:** If the parser doesn't support a format, it doesn't exist for extraction purposes.

---

## 2. Scope

This specification covers:

- Heading hierarchy and patterns
- Epic/Story section structure
- Acceptance Criteria formats (table and bullet)
- User Story format
- Constraint format
- ID conventions and validation
- Forbidden patterns

**Out of scope:** Content semantics, business requirements, prioritization.

---

## 3. Document-Level Requirements

### 3.1 File Location

| Requirement | Level | Description |
|-------------|-------|-------------|
| Path | MUST | `docs/BRD_V20_6_4_COMPLETE.md` (or version-equivalent) |
| Encoding | MUST | UTF-8 |
| Line endings | SHOULD | LF (Unix-style) |

### 3.2 Expected Entity Counts (BRD V20.6.4)

| Entity | Expected Count | Validation |
|--------|----------------|------------|
| E01 Epic | 65 | Hard-fail if mismatch (unless `ALLOW_BRD_COUNT_DRIFT=1`) |
| E02 Story | 397 | Hard-fail if mismatch |
| E03 AcceptanceCriterion | 3,147 | Hard-fail if mismatch |
| E04 Constraint | 0 | Expected zero in current BRD |

---

## 4. Heading Hierarchy and Sectioning

### 4.1 Epic Heading Pattern

**Pattern (regex):** `^#{2,}\s+Epic\s+(\d+)\s*:(.*)$` (case-insensitive)

| Component | Level | Description |
|-----------|-------|-------------|
| Hash prefix | MUST | Two or more `#` characters (typically `###`) |
| Keyword | MUST | Literal "Epic" (case-insensitive) |
| Spacing | MUST | At least one whitespace after hashes |
| Epic number | MUST | Integer (e.g., `1`, `64`) |
| Colon | MUST | `:` separator before title |
| Title | MUST | Non-empty text after colon |

**Examples:**
```markdown
### Epic 1: Getting Started & Setup
### Epic 64: Core Traceability
## Epic 65: Operations & Simulation
```

**Extracted as:** `EPIC-{number}` (e.g., `EPIC-64`)

### 4.2 Story Heading Pattern

**Pattern (regex):** `^#{3,}\s+Story\s+(\d+)\.(\d+)\s*:(.*)$` (case-insensitive)

| Component | Level | Description |
|-----------|-------|-------------|
| Hash prefix | MUST | Three or more `#` characters (typically `####`) |
| Keyword | MUST | Literal "Story" (case-insensitive) |
| Spacing | MUST | At least one whitespace after hashes |
| Story ID | MUST | `{epic}.{story}` format (e.g., `64.1`) |
| Colon | MUST | `:` separator before title |
| Title | MUST | Non-empty text after colon |

**Examples:**
```markdown
#### Story 1.1: Easy Initial Setup
#### Story 64.5: Graph API v1
```

**Extracted as:** `STORY-{epic}.{story}` (e.g., `STORY-64.5`)

### 4.3 Subsection Conventions

After a Story heading, the following subsections MAY appear:

| Subsection | Expected Content |
|------------|------------------|
| Acceptance Criteria | AC table or bullet list |
| User Story | "As a / I want / So that" triad |
| Notes | Informational text (not extracted) |
| Constraints | CNST-formatted definitions (rare) |

The parser does NOT require specific subsection headings; it pattern-matches content directly.

---

## 5. Canonical Identifier Rules

### 5.1 ID Formats

| Entity | ID Format | Pattern | Example |
|--------|-----------|---------|---------|
| Epic | `EPIC-{n}` | `/^EPIC-\d+$/` | `EPIC-64` |
| Story | `STORY-{epic}.{story}` | `/^STORY-\d+\.\d+$/` | `STORY-64.5` |
| Acceptance Criterion | `AC-{epic}.{story}.{ac}` | `/^AC-\d+\.\d+\.\d+$/` | `AC-64.5.1` |
| Constraint | `CNST-{TYPE}-{n}` | `/^CNST-[A-Z]+-\d+$/` | `CNST-SEC-1` |

### 5.2 Uniqueness Rules

| Rule | Level | Description |
|------|-------|-------------|
| Epic uniqueness | MUST | No duplicate `EPIC-{n}` IDs |
| Story uniqueness | MUST | No duplicate `STORY-{epic}.{story}` IDs |
| AC uniqueness | MUST | No duplicate `AC-{epic}.{story}.{ac}` IDs |
| Constraint uniqueness | MUST | No duplicate `CNST-{TYPE}-{n}` IDs |

**Violation behavior:** Parser extracts first occurrence; duplicates silently overwrite (UB).

### 5.3 Canonical Authority Rule

> **Only canonical if present in BRD.**
>
> An AC ID is only valid for `@satisfies` markers if it exists in `docs/BRD_V20_6_4_COMPLETE.md`.
> See `spec/track_a/ENTRY.md` → AC Numbering Convention.

Implementation acceptance IDs (internal checkpoints) MUST NOT be used in code markers.

---

## 6. Story Section Format

### 6.1 Required Fields

| Field | Level | Description |
|-------|-------|-------------|
| Heading | MUST | Story heading per §4.2 |
| Acceptance Criteria | MUST | At least one AC (table or bullet) |

### 6.2 Allowed Fields

| Field | Level | Description |
|-------|-------|-------------|
| User Story | SHOULD | "As a / I want / So that" triad |
| Notes | MAY | Informational text (ignored by parser) |
| Priority | MAY | P0/P1/P2 (in AC table column) |
| Constraints | MAY | CNST-formatted definitions |

### 6.3 Example

```markdown
#### Story 64.1: Entity Registry Foundation

**As a** Gnosis system,
**I want** to extract and store all entity types,
**So that** I have a complete structural inventory.

| AC ID | Description | Priority |
|-------|-------------|----------|
| AC-64.1.1 | All 56 entity types defined with TypeScript interfaces | P0 |
| AC-64.1.2 | Each entity type has unique ID format enforced | P0 |
```

---

## 7. Acceptance Criteria Formats

The parser supports **two** AC formats. Authors SHOULD use one consistently within a story.

### 7.1 Table-Based AC Format (Preferred)

**Pattern (regex):** `^\|\s*AC-(\d+)\.(\d+)\.(\d+)\s*\|(.*)$` (case-insensitive)

| Component | Level | Description |
|-----------|-------|-------------|
| Leading pipe | MUST | `\|` at line start |
| AC ID | MUST | `AC-{epic}.{story}.{ac}` with hyphen |
| Separator | MUST | `\|` after ID |
| Description | MUST | Non-empty text |
| Trailing content | MAY | Additional columns (priority, etc.) |

**Required column names:** None enforced by parser.

**Example:**
```markdown
| AC ID | Description | Priority |
|-------|-------------|----------|
| AC-64.1.1 | All 56 entity types defined | P0 |
| AC-64.1.2 | Each entity type has unique ID format | P0 |
```

**Extracted:**
- `AC-64.1.1` → description: "All 56 entity types defined"
- `AC-64.1.2` → description: "Each entity type has unique ID format"

**Multi-line cells:** NOT supported. Each AC MUST be on a single line.

### 7.2 Bullet-Based AC Format

**Pattern (regex):** `^\s*-\s*AC(\d+)\s*:(.*)$` (case-insensitive)

| Component | Level | Description |
|-----------|-------|-------------|
| Bullet | MUST | `-` with optional leading whitespace |
| AC keyword | MUST | `AC` (no hyphen) followed by number |
| Colon | MUST | `:` separator |
| Description | MUST | Non-empty text |

**Context requirement:** Bullet ACs MUST appear within a Story section. The parser uses the current story context to construct the full AC ID.

**Example (within Story 64.1):**
```markdown
- AC1: All 56 entity types defined with TypeScript interfaces
- AC2: Each entity type has unique ID format enforced
```

**Extracted:**
- `AC-64.1.1` (from context + `AC1`)
- `AC-64.1.2` (from context + `AC2`)

### 7.3 Format Drift Detection

The parser detects and **rejects** table rows with malformed AC IDs:

| Valid | Invalid | Reason |
|-------|---------|--------|
| `\| AC-64.1.1 \|` | `\| AC64.1.1 \|` | Missing hyphen |
| `\| AC-64.1.1 \|` | `\| AC 64.1.1 \|` | Space instead of hyphen |

**Behavior:** Hard-fail unless `ALLOW_BRD_FORMAT_DRIFT=1` is set.

---

## 8. User Story Format

### 8.1 Triad Pattern

The parser recognizes the "As a / I want / So that" triad:

| Component | Pattern | Level |
|-----------|---------|-------|
| As a/an | `^\*\*As (a\|an)\*\*` or `^As (a\|an)\s+` | SHOULD |
| I want | `^\*\*I want\*\*` or `^I want\s+` | SHOULD |
| So that | `^\*\*So that\*\*` or `^So that\s+` | SHOULD |

**Important:** Patterns are anchored at line start to avoid false positives (e.g., "**Asynchronous**").

### 8.2 Examples

**Bold format (preferred):**
```markdown
**As a** Gnosis system,
**I want** to extract all entity types,
**So that** I have a complete inventory.
```

**Plain format (accepted):**
```markdown
As a Gnosis system,
I want to extract all entity types,
So that I have a complete inventory.
```

---

## 9. Constraint Section Format

### 9.1 Supported Patterns

Constraints MUST use explicit `CNST-{TYPE}-{N}` identifiers:

**Heading format:**
```markdown
### Constraint CNST-SEC-1: Authentication required for all API calls
### CNST-PERF-2: Response time under 200ms
```

**Inline format:**
```markdown
**CNST-ARCH-3:** System must support horizontal scaling
```

**Pattern (heading):** `^#{2,}\s+(?:Constraint\s+)?(CNST-[A-Z]+-\d+)\s*:\s*(.+)$`
**Pattern (inline):** `^\*\*(CNST-[A-Z]+-\d+)\*\*\s*:\s*(.*)$`

### 9.2 Non-Entity Patterns (Ignored)

Section headings like `## Constraints` or `### Security Constraints` are **NOT** extracted as entities. Only explicit `CNST-{TYPE}-{N}` identifiers create E04 entities.

### 9.3 Expected Count

BRD V20.6.4 contains **0** CNST-formatted constraints. This format is defined for future use.

---

## 10. Supported Variants and Normalization Rules

### 10.1 Whitespace Normalization

| Context | Rule |
|---------|------|
| Heading whitespace | Multiple spaces normalized (SHOULD use single space) |
| Description whitespace | Leading/trailing trimmed |
| Empty lines | Ignored |

### 10.2 Punctuation Tolerance

| Element | Tolerance |
|---------|-----------|
| Epic/Story colon | Required; no space before (SHOULD) |
| AC table pipes | Required; spaces around optional |
| User story commas | Optional |

### 10.3 Case Sensitivity

| Element | Case Rule |
|---------|-----------|
| Keywords (Epic, Story, AC) | Case-insensitive |
| CNST type | Uppercase enforced on extraction |
| Content | Preserved as-is |

---

## 11. Forbidden / Unsupported Patterns

### 11.1 Hard Failures (Parser Rejects)

| Pattern | Reason | Behavior |
|---------|--------|----------|
| Bullet AC outside story context | No epic.story to construct ID | `throw Error` |
| Table AC without hyphen (`AC64.1.1`) | Format drift | `throw Error` (unless `ALLOW_BRD_FORMAT_DRIFT=1`) |
| Count mismatch | Extraction integrity | `throw Error` (unless `ALLOW_BRD_COUNT_DRIFT=1`) |
| No epics found | Empty BRD | `throw Error` |
| No stories found | Empty BRD | `throw Error` |

### 11.2 Silently Ignored

| Pattern | Reason |
|---------|--------|
| Heading without Epic/Story keyword | Not an extractable entity |
| Text without AC pattern | Not an extractable entity |
| `## Constraints` section heading | Not a CNST entity definition |
| Nested tables | Not supported |
| Multi-line table cells | Not supported |

### 11.3 Undefined Behavior (UB)

| Pattern | Result |
|---------|--------|
| Duplicate Epic IDs | Last occurrence wins |
| Duplicate Story IDs | Last occurrence wins |
| Duplicate AC IDs | Last occurrence wins |
| Heading level skips (## → ####) | May cause incorrect context |

---

## 12. Forward Compatibility

### 12.1 Adding New Sections

New sections SHOULD:

1. Use distinct heading patterns that don't match Epic/Story patterns
2. Avoid table rows starting with `| AC-`
3. Avoid bullet lines matching `- ACN:`
4. Document new patterns before parser updates

### 12.2 Parser Behavior for Unknown Patterns

The parser ignores content it doesn't recognize. New sections are safe if they:

1. Don't match existing extraction patterns
2. Don't appear in positions that break context (e.g., mid-story)

---

## 13. Examples Appendix

### 13.1 Complete Epic + Story + AC Table Example

```markdown
### Epic 64: Core Traceability

Core traceability infrastructure for the Gnosis system.

#### Story 64.1: Entity Registry Foundation

**As a** Gnosis system,
**I want** to extract and store all entity types,
**So that** I have a complete structural inventory.

| AC ID | Description | Priority |
|-------|-------------|----------|
| AC-64.1.1 | All 56 entity types defined with TypeScript interfaces | P0 |
| AC-64.1.2 | Each entity type has unique ID format enforced | P0 |
| AC-64.1.3 | Required vs optional attributes specified for each entity | P0 |
| AC-64.1.4 | Entity validation on creation (type check, format check) | P0 |
```

**Extracted entities:**
- `EPIC-64` (E01)
- `STORY-64.1` (E02)
- `AC-64.1.1`, `AC-64.1.2`, `AC-64.1.3`, `AC-64.1.4` (E03)

### 13.2 Bullet AC Example (Context-Dependent)

```markdown
#### Story 5.3: Code Quality Feedback

- AC1: Generated code passes linting
- AC2: Generated code follows project style guide
- AC3: Cyclomatic complexity within threshold
```

**Extracted entities (within Story 5.3 context):**
- `AC-5.3.1`, `AC-5.3.2`, `AC-5.3.3` (E03)

### 13.3 Constraint Example (Explicit CNST Format)

```markdown
### Constraint CNST-SEC-1: All API endpoints require authentication

**CNST-PERF-1:** P95 latency must be under 200ms
```

**Extracted entities:**
- `CNST-SEC-1` (E04)
- `CNST-PERF-1` (E04)

---

## 14. Environment Variables

| Variable | Effect |
|----------|--------|
| `ALLOW_BRD_COUNT_DRIFT=1` | Warn instead of fail on count mismatch |
| `ALLOW_BRD_FORMAT_DRIFT=1` | Warn instead of fail on format drift (hyphenless ACs) |

These are **escape hatches** for development/migration. Production extraction SHOULD NOT use them.

---

## 15. References

| Document | Purpose |
|----------|---------|
| `docs/BRD_V20_6_4_COMPLETE.md` | Canonical BRD content |
| `src/extraction/parsers/brd-parser.ts` | Parser implementation |
| `src/extraction/providers/brd-provider.ts` | Extraction provider |
| `spec/track_a/ENTRY.md` | AC Numbering Convention |
| `test/sanity/brd.test.ts` | BRD validation tests |

---

**END OF BRD FORMAT SPECIFICATION**

