# CES-GF-DAPE-006 — Coverage-Aware Human Review

**Stage:** P0 Atlas completeness
**Status:** Planned

## Objective

Let reviewers correct meaning and omissions while preserving revision-bound
source, candidate, concept, and coverage integrity.

## Business and architectural reason

Review limited to model-produced candidates cannot recover rules the model
never exposed.

## Dependencies

- DAPE-005 coverage and precision reports.

## Inputs

Candidates, lexicon, source units, coverage/critic diagnostics, uncertainties,
conflicts, and all revision hashes.

## Outputs

Decisions to approve/reject/correct/merge/split/defer/create-from-source,
concept confirmations, exclusions with reasons, clarification answers, and
review report.

## Contract changes

Expand review decisions and immutable revision bindings; add split/merge/create
and coverage-disposition review contracts.

## Package ownership

`atlas-review` owns human decision compilation and atomic reviewed artifacts.

## Deterministic responsibilities

Stale checks, correction application, identity/reference remapping, coverage
recalculation, ordering, hashes, and atomic publication.

## Agent responsibilities

May explain diagnostics or draft corrections; never assign reviewer identity or
approval.

## Failure statuses

`review_required`, `clarification_required`, `conflict`,
`incomplete_coverage`, `unsupported_candidate`, `revision_mismatch`.

## Exit codes

Review pending remains distinct from invalid decisions and blocking coverage.

## Backward-compatibility requirements

Current approve/reject/correct/defer decisions remain valid where semantics are
unchanged.

## Required fixtures

Missing-record creation, split, merge, corrected concept, stale revisions,
approved exclusion, blocking clarification, and reviewer identity.

## Unit tests

All decisions, remapping, stale checks, deterministic hashes and publication.

## Integration tests

Safara publication moves from blocked to reviewable only after the reviewer
adds/splits missing semantics and resolves every blocking unit.

## Negative tests

Silent exclusion, agent approval, unrelated source creation, stale correction,
and unresolved normative unit fail.

## Completion evidence

Review schemas, fixtures, CLI commands, before/after coverage, failure
artifacts, rerun and legacy-review evidence.

## Explicit non-goals

Automatic approval, policy mapping, or ApprovedProjectModel publication.

