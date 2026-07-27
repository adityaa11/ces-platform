# CES-GF-DAPE-009 — Shared Identity and Traceability Chain

**Stage:** P1 shared lifecycle
**Status:** Planned

## Objective

Pin every downstream artifact to one ApprovedProjectModel revision and preserve
the complete source-to-verification identity chain.

## Business and architectural reason

No CES product may reread, reinterpret, or silently simplify business truth.

## Dependencies

- DAPE-008 P0 gate.

## Inputs

ApprovedProjectModel and existing downstream artifact contracts.

## Outputs

Traceability records/report linking source units, semantics, concepts, mappings,
policies, architecture, tasks, tests, evidence, and verification.

## Contract changes

Require project ID, model revision/hash, and source semantic IDs downstream.

## Package ownership

New `traceability-engine`; each producer owns its artifact and trace links.

## Deterministic responsibilities

Reference validation, traversal, stale/mixed revision detection, ordering and
hashes.

## Agent responsibilities

None in identity assignment; agents may present trace explanations.

## Failure statuses

`revision_mismatch`, `traceability_gap`, `input_error`, `conflict`.

## Exit codes

Traceability and revision failures are distinct from product execution errors.

## Backward-compatibility requirements

Legacy artifact identities project into the new chain without changing existing
hash semantics where avoidable.

## Required fixtures

Complete Safara chain, legacy chain, stale model, mixed revision, dangling and
rewritten IDs.

## Unit tests

Every edge/reference, traversal, hash, ordering, and revision check.

## Integration tests

One approved record is traceable end-to-end across all existing product
boundaries.

## Negative tests

Independent PRD interpretation, mixed revisions, missing semantic IDs, and
graph-as-authority fail.

## Completion evidence

Contracts, package/file list, reports, commands, failure artifacts, rerun and
compatibility evidence.

## Explicit non-goals

Semantic mapping decisions or product behavior changes.

