Human Governance Review – HGR-1 (Truth Substrate Freeze)

Purpose

HGR-1 certifies that the Track A truth substrate (A1–A3) is:

correct

complete

evidence-anchored

replayable

internally consistent

and frozen as an immutable baseline

This gate does not certify:

operational pipelines (A4)

API surface completeness (A5)

self-ingestion or oracle transition (HGR-2)

HGR-1 is the final human-verified checkpoint before Track B begins.

Scope of HGR-1
Included

Track A.1 — Entity Registry

Track A.2 — Relationship Registry

Track A.3 — Marker & Test Extraction

Ledger, corpus, epoch, and parity verification

Deterministic replay / idempotent rebuild

Explicitly Excluded

Track A.4 — Structural Analysis Pipeline

Track A.5 — Graph API v1

Track B — Self-ingestion / closure

Oracle transition (HGR-2)

Canonical Baseline Identification

The following identifiers must be recorded and preserved:

Baseline Git Tag: hgr-1-baseline

Baseline Commit SHA: d6c2c9e2171eb2c3019f1b2cd2a3eba96e1e33ab *(from .si-universe.env)*

Canonical Epoch ID: *(to be recorded at gate execution)*

BRD Hash: bc1c78269d7b5192ddad9c06c1aa49c29abcf4a60cdaa039157a22b5c8c77977 *(from .si-universe.env)*

Execution Timestamp: *(to be recorded at gate execution)*

These values define the immutable truth baseline.

Entity Verification (A1)
Required Entity Types (Track A)
Code	Entity
E01	Epic
E02	Story
E03	AcceptanceCriterion
E04	Constraint
E06	TechnicalDesign
E08	DataSchema
E11	SourceFile
E12	Function
E13	Class
E15	Module
E27	TestFile
E28	TestSuite
E29	TestCase
E49	ReleaseVersion
E50	Commit
E52	ChangeSet
Canonical BRD Registry Counts (MUST MATCH EXACTLY)
Entity	Expected
E01 Epics	65
E02 Stories	397
E03 Acceptance Criteria	3,147

Any mismatch is a hard failure of HGR-1.

Relationship Verification (A2–A3)
Relationship Types Required at HGR-1 (must be nonzero)

Code	Relationship
R01	HAS_STORY
R02	HAS_AC
R04	CONTAINS_FILE
R05	CONTAINS_ENTITY
R06	CONTAINS_SUITE
R07	CONTAINS_CASE
R16	DEFINED_IN
R18	IMPLEMENTS
R19	SATISFIES
R36	TESTED_BY
R37	VERIFIED_BY

Relationship Types Allowed to be Zero

Code	Relationship	Reason
R03	HAS_CONSTRAINT	May be zero if no constraints defined
R14	IMPLEMENTED_BY	Deferred to A4 pipeline activation

Deferred / Reserved Relationship Codes

The following codes are valid identifiers but not required or populated at HGR-1:

R08, R09, R11 (design-intent bindings)
R14 (IMPLEMENTED_BY — deferred to A4 pipeline activation)
R21, R22, R23, R24, R26 (structural AST analysis)
R63, R67, R70 (provenance/grouping)

Their absence at HGR-1 is expected.

Evidence Anchor Verification

For all entities and relationships:

source_file is present

line_start > 0

line_end ≥ line_start

extracted_at is present

Bad entity anchors: 0
Bad relationship anchors: 0

Any violation is a hard failure.

Ledger / Corpus / Epoch Verification
Ledger

Project-scoped ledger file exists

Append-only semantics verified

All CREATE / UPDATE / DECISION entries present

Ledger entries reference valid epoch IDs

Semantic Corpus

Project-scoped corpus exists

Non-authoritative (structural signals only)

Corruption here does not invalidate truth, but must be detectable

Epoch Metadata

Epoch file exists for baseline

Fields present:

epoch_id

project_id

repo_sha

runner_sha

brd_hash

started_at

completed_at

status

Parity Verification
Cross-Store Parity (Project-Scoped)

PostgreSQL entity count == Neo4j node count

PostgreSQL relationship count == Neo4j edge count

Key relationship types (R01, R02, R07, R18, R19, R36, R37) must match exactly.

Any mismatch is a hard failure.

Deterministic Replay Verification

A pristine rebuild must demonstrate:

Fresh epoch creation

Zero duplicate CREATEs

Idempotent behavior (no new entities or relationships)

All invariants preserved

Replay success confirms determinism and replayability.

Human Attestation

By approving HGR-1, the reviewer attests that:

Track A.1–A.3 truth substrate is correct and complete

Evidence and audit artifacts are present and consistent

The baseline is frozen and immutable

No oracle transition has occurred

Track B may proceed using this baseline

Outcome

PASS: Baseline is locked; proceed to Track A4 / Track A5 and Track B

FAIL: Resolve discrepancies before any further development

Notes

HGR-1 is not reversible, but corrections may occur via explicit, governed epochs later.

Oracle transition occurs at HGR-2, not here.

This document reflects the executed state as of the baseline tag.

END OF HUMAN_GATE_HGR-1