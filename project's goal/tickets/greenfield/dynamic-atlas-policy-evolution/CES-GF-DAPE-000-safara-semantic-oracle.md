# CES-GF-DAPE-000 — Safara Semantic Oracle

**Stage:** Preparation
**Status:** Planned

## Objective

Define the reviewed semantic truth used to shape and test P0 before implementing
the extraction pipeline.

## Business and architectural reason

Contracts built only against small fixtures can appear correct while omitting
real business meaning. Safara must be a concrete oracle from the first ticket.

## Dependencies

- Accepted `CES-GF-ATLAS-005` ingestion baseline.

## Inputs

- Approved-to-use Safara source or redacted equivalent.
- Reviewed source text and the controlling DAPE architecture.

## Outputs

- Fixture source and normalized text.
- Expected structure, units, concepts, semantic records, business-rule
  inventory, coverage map, review decisions, and ApprovedProjectModel.
- A failing golden test that later P0 tickets progressively satisfy.

## Contract changes

No production contract; fixture schemas must name versions and stable identities.

## Package ownership

`fixtures/safara` and cross-package golden tests.

## Deterministic responsibilities

Concrete IDs, counts, source citations, constraints, hashes, and expected
coverage are reviewed and checked exactly.

## Agent responsibilities

None. An agent may assist inventory drafting but cannot define the oracle.

## Failure statuses

`input_error`, `incomplete_oracle`, `oracle_conflict`.

## Exit codes

Existing test-runner conventions; any mismatch fails CI.

## Backward-compatibility requirements

No source PDF is committed without authorization; existing fixtures remain.

## Required fixtures

At minimum: 9 numbered areas, 3 roles, 10 main rules, 12 inspection scenarios,
9 deliverables, and 10 acceptance criteria, plus detailed validations,
calculations, statuses, permissions, retention, filters, exports, readiness,
and finalization semantics.

## Unit tests

Fixture schema, identity uniqueness, source-reference, and hash validation.

## Integration tests

Golden test names concrete records such as registration quota, cites exact
units, preserves constraints, and requires coverage.

## Negative tests

Broad category presence, invented semantics, missing inventory entries, and
uncited records cannot satisfy the oracle.

## Completion evidence

Exact fixture paths, review record, expected counts/IDs, and initially failing
golden command.

## Explicit non-goals

Extraction implementation, provider calls, registries, or downstream products.

