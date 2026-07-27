# CES-GF-DAPE-007 — Approved Project Model and Legacy Projections

**Stage:** P0 Atlas completeness
**Status:** Planned

## Objective

Atomically publish one immutable ApprovedProjectModel and derive graphs and
legacy Requirement artifacts from it.

## Business and architectural reason

All CES products need one approved business truth; projections cannot become
competing canonical interpretations.

## Dependencies

- DAPE-006 completed human review.

## Inputs

Reviewed lexicon, semantic records/relationships, source mappings, coverage,
clarifications, decisions, and revision tuple.

## Outputs

ApprovedProjectModel and publication manifest first; independently statused
Requirement Collection/Package and graph projections, projection-gap report,
and downstream handoff status.

## Contract changes

Add approved-project-model, publisher, projection, lock, and ownership schemas.

## Package ownership

New `approved-project-model-schema` and `project-model-publisher`; existing
review/graph/core packages consume derived projections.

## Deterministic responsibilities

Publication gate, canonical serialization, IDs/hashes, immutable revision, and
atomic replacement. Projection follows publication and records `complete`,
`partial`, `blocked`, or `not_applicable` independently.

## Agent responsibilities

None in publication or projection.

## Failure statuses

`incomplete_coverage`, `unsupported_candidate`, `review_required`,
`clarification_required`, `conflict`, `projection_gap`, `publication_error`.
Projection gaps do not change an already published canonical model status.

## Exit codes

Success only after all publication conditions; each blocking class remains
distinguishable.

## Backward-compatibility requirements

Existing Requirement consumers remain valid when projections are complete.
Lossy semantics are explicit gaps that may block legacy handoff but never
canonical publication.

## Required fixtures

Safara model, legacy profile-picture projection, projection gap, stale lock,
partial output, and atomic replacement.

## Unit tests

Gate predicates, canonical hashes, immutability, ownership, projections, gaps.

## Integration tests

Equivalent reviewed input publishes identical canonical models. Unsupported
calculation or state semantics still publish canonically while legacy
projection is partial and legacy core handoff is blocked.

## Negative tests

Incomplete coverage, unsupported record, mixed revision, agent metadata in
business truth, projection gaps blocking canonical publication, silent loss,
and stale artifacts fail.

## Completion evidence

Exact artifacts/packages, schema versions, commands, failure samples,
deterministic rerun and compatibility results.

## Explicit non-goals

Semantic-to-policy mapping, Architect interpretation, or registry evolution.
