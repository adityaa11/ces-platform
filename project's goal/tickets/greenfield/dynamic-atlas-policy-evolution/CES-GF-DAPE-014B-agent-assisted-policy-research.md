# CES-GF-DAPE-014B — Agent-Assisted Policy Research

**Stage:** P3 policy evolution
**Status:** Planned

## Objective

Compare approved engineering needs with existing policy semantics and produce
the smallest citation-backed proposal through the controlled source contract.

## Business and architectural reason

The default must be reuse or minimal change—not automatic policy creation—and
research must remain evidence-bound and human-governed.

## Dependencies

- DAPE-014A controlled retrieval.

## Inputs

Approved semantic mappings/gaps, existing definitions/triggers/dependencies/
evidence/verification, and controlled standards snapshots/citations.

## Outputs

Coverage analysis and research bundles recommending reuse, trigger/parameter/
evidence clarification, compatible/breaking revision, merge/deprecation, new
policy, implementation/architecture/verification only, clarification, or not
applicable.

## Contract changes

Add policy-coverage analysis, research uncertainty, semantic comparison, and
policy-change proposal schemas referencing immutable citations.

## Package ownership

Policy coverage analyzer, standards research agent/contracts, existing-policy
inspection, and proposal schema; governance remains DAPE-015.

## Deterministic responsibilities

Inventory existing semantics, validate citations/snapshots and proposal shape,
calculate diffs, and replay fixtures.

## Agent responsibilities

Search only through DAPE-014A, compare overlap, explain uncertainty, and
propose. It cannot fetch arbitrary URLs, approve, publish, weaken/delete
automatically, or claim compliance/certification.

## Failure statuses

`policy_gap`, `capability_gap`, `research_required`,
`unsupported_proposal`, `review_required`, `citation_invalid`.

## Exit codes

Research, citation, semantic-gap and invalid-proposal outcomes remain distinct.

## Backward-compatibility requirements

Existing policies remain authoritative; normal CI uses deterministic snapshots.

## Required fixtures

Full/partial coverage, missing trigger/parameter/evidence, merge, deprecation,
new-policy and no-policy outcomes with pinned sources.

## Unit tests

Existing-policy inspection, outcome validation, citation binding, proposal
diff, uncertainty and offline replay.

## Integration tests

Safara manifest-snapshot need inspects current policies and produces an
evidence-bounded reviewed proposal without publication.

## Negative tests

Default-new-policy, arbitrary URL, fabricated/unpinned citation, unsupported
claim, automatic weakening/publication and certification language fail.

## Completion evidence

Analyzer/agent/contracts, research fixtures, exact commands, proposal and
failure bundles, offline CI and review handoff.

## Explicit non-goals

Retrieval infrastructure, proposal approval, registry publication, or upgrade.

