# CES-GF-DAPE-008 — Safara Golden Regression and Staged CLI

**Stage:** P0 completion gate
**Status:** Planned

## Objective

Prove the entire P0 pipeline against the pre-reviewed Safara oracle and expose
stable staged CLI commands.

## Business and architectural reason

P0 is complete only when realistic semantics are complete, precise,
review-correctable, deterministic, and publishable.

## Dependencies

- DAPE-007 publisher.
- DAPE-000 oracle.

## Inputs

Safara fixture/oracle, deterministic fixture-provider outputs, project intent,
and review decisions.

## Outputs

End-to-end structure, lexicon, candidates, coverage/precision, review,
ApprovedProjectModel, projections, and graphs.

## Contract changes

Add `atlas analyze`, `coverage`, `questions`, `approve`, and `graph`; retain
`run`, `resume`, and `inspect`.

## Package ownership

CLI orchestrates existing package authorities; it does not reimplement them.

## Deterministic responsibilities

Atomic staged artifact layout, status/exit mapping, hashes, rerun equality, and
oracle comparison.

## Agent responsibilities

Fixture roles exercise contracts; optional real-provider quality is separate
and cannot alter the oracle.

## Failure statuses

All P0 statuses: `success`, `incomplete_coverage`, `unsupported_candidate`,
`review_required`, `clarification_required`, `conflict`, `provider_error`,
`input_error`, `execution_error`.

## Exit codes

Document exact distinct CLI exit codes and preserve existing codes where
compatible.

## Backward-compatibility requirements

Current Atlas commands/artifacts remain supported; Phase 1/2 and
profile-picture regressions pass.

## Required fixtures

Full DAPE-000 tree and failing variants for every P0 status.

## Unit tests

CLI parsing/statuses, paths, atomic output, and artifact version checks.

## Integration tests

Verify concrete Safara identities/counts/citations across 9 areas, 3 roles, 10
main rules, 12 scenarios, 9 deliverables, 10 acceptance criteria, and detailed
semantics; repeated runs are byte-identical.

## Negative tests

Broad category-only assertions, omission, hallucination, stale review, generic
coverage, and partial publication fail.

## Completion evidence

Exact commands/files/packages, golden and failure artifacts, CI output,
deterministic rerun, migration and compatibility evidence.

## Explicit non-goals

Policy packs, standards research, Architect changes, Forge, or visualization.

