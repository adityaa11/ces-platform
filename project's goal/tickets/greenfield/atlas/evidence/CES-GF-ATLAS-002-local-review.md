# CES-GF-ATLAS-002 Local Review Evidence

**Validated:** 24 July 2026  
**Status:** Implemented locally; hosted validation pending

## Delivered package

Package: `@company/ces-atlas-review`

- Accepts schema-validated Atlas candidate analysis, human review decisions,
  and clarification answers.
- Supports approved, rejected, corrected, superseded, and deferred decisions.
- Derives canonical candidate revisions and binds each decision to both the
  candidate revision and source content revision.
- Rejects missing, duplicate, unknown, or stale review decisions.
- Prevents corrections from changing immutable source provenance, agent
  metadata, candidate identity, or schema identity.
- Produces deterministic targeted questions for uncovered blocking and
  high-impact uncertainties or conflicts.
- Requires current human answers for every blocking clarification.
- Compiles approved candidates and approved Business Rules into the existing
  `RequirementPackageSchema`.
- Emits a revision-pinned `RequirementCollection` and deterministic review
  report.

## Human approval boundary

Agent-provider output remains limited to `candidate` or `needs_confirmation`
states by the ATLAS-001 provider boundary. ATLAS-002 accepts approval only
through explicit revision-bound human decisions. The review compiler has no
provider invocation or registry write API.

Corrections are attributed to the decision's `decided_by` identity, applied
only after the original candidate and source hashes are verified, and parsed
again through the complete candidate schema. Immutable provenance cannot be
corrected in place.

## Fail-closed evidence

Tests prove that:

- candidate or source revision changes invalidate prior decisions;
- stale clarification answers are rejected;
- unresolved blocking questions prevent collection approval;
- uncovered blocking facts receive deterministic synthesized questions;
- every candidate must receive a human decision;
- an approved Business Rule cannot reference an unapproved requirement;
- an empty approved Requirement Collection is rejected.

## Determinism and core handoff

Review decisions and clarification answers are normalized by stable identity
before hashing. Requirement entries and Business Rules are normalized by
logical identity. Reversing input decision order produces byte-identical output.

The end-to-end fixture starts with candidate Requirement and Business Rule IR,
applies human decisions, emits an approved collection and individual packages,
parses every emitted package unchanged with the existing core
`RequirementPackageSchema`, and verifies collection-to-package revision pins.

## Architecture evidence

The architecture dependency matrix permits Atlas review to depend only on:

- agent-provider result contracts;
- greenfield candidate contracts;
- Requirement Collection contracts;
- existing Requirement Package contracts.

The deterministic core has no dependency on Atlas review.

## Local validation

```text
corepack pnpm check

Typecheck: passed
Tests:     199 passed, 0 failed, 0 skipped
Test files: 28 passed
Build:     passed
```

## Remaining evidence

Hosted CI must pass on the committed ATLAS-002 implementation before
`CES-GF-ATLAS-003` begins.
