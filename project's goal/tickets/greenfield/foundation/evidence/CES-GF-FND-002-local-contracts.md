# CES-GF-FND-002 Local Contract Evidence

**Validated:** 24 July 2026  
**Status:** Validated in CI

## Delivered boundaries

### Approved Requirement Collection

Package: `@company/ces-requirement-collection-schema`

- Versioned `RequirementCollection` and approval contracts.
- Persistent logical requirement IDs.
- Immutable SHA-256 Requirement Package revisions.
- Deterministic collection normalization and revision identity.
- Duplicate logical-ID and path rejection.
- Collection revision integrity validation.
- Referenced package identity and revision validation.

### Pre-approval greenfield contracts

Package: `@company/ces-greenfield-contracts`

- Source references with content hashes and bounded line ranges.
- Explicit artifact origin and review states.
- Agent inference provenance and confidence.
- Candidate Requirement and Business Rule contracts.
- Review decisions bound to source and candidate revisions.
- Requirement relationships.
- Stack-neutral Project Intent.

Candidate records use a separate root contract and are rejected by the existing
approved Requirement Package parser.

### Backward-compatible vocabulary

- Requirement schema version remains `1.0.0`.
- Requirement vocabulary advances to `1.1.0`.
- Business Rule vocabulary advances to `1.1.0`.
- Existing profile-picture inputs remain valid.
- Project-management actors, operations, resources, scopes, states, and rule
  classes are controlled and stack-neutral.

## Architecture

The fail-closed dependency matrix contains the two new packages and only these
edges:

```text
requirement-collection-schema -> requirement-schema
greenfield-contracts -> business-rule-schema
greenfield-contracts -> requirement-schema
```

The approved Requirement Package contract does not depend on collections or
candidate contracts.

## Local validation

```text
corepack pnpm check

Typecheck: passed
Tests:     174 passed, 0 failed, 0 skipped
Test files: 24 passed
Build:     passed
```

Coverage includes deterministic ordering, revision changes, duplicate
rejection, stale collection revisions, package-reference validation, candidate
isolation, source ranges, corrected review decisions, Project Intent strictness,
state transitions, architecture boundaries, and all existing Phase 1 and Phase
2 regressions.

## Hosted validation

The repository workflow passed for FND-002 commit `b4bac82`:

- Run: [`30103309530`](https://github.com/adityaa11/ces-platform/actions/runs/30103309530)
- Job: [`repository-check` (`89514514085`)](https://github.com/adityaa11/ces-platform/actions/runs/30103309530/job/89514514085)
- Result: succeeded

FND-002 is accepted. `CES-GF-ATLAS-001` may begin.
