# CES-GF-DAPE-005 — Coverage, Precision, Critic, and Targeted Retry

**Stage:** P0 Atlas completeness
**Status:** Planned

## Objective

Block incomplete or unsupported extraction using deterministic recall and
precision checks plus independent criticism and bounded targeted retry.

## Business and architectural reason

Schema-valid output may omit rules, distort meaning, fabricate facts, or cite
unrelated source units.

## Dependencies

- DAPE-004 merged bounded extraction.

## Inputs

All source units, candidates, relationships, lexicon, revision tuple, and
current coverage map.

## Outputs

Coverage map/report, precision diagnostics, critic report, retry requests and
history, and final blocking status.

## Contract changes

Add dispositions `covered`, `context_only`, `duplicate`, `uncertain`,
`conflicting`, `excluded_with_reason`, `uncovered`; critic and retry contracts;
unsupported/distorted candidate diagnostics.

## Package ownership

New `atlas-coverage`; critic is a registered agent but final calculation is
deterministic.

## Deterministic responsibilities

Normative coverage accounting, mapping integrity, unsupported/distortion
blocks, retry selection/limits, and completion status.

## Agent responsibilities

Identify likely omissions, over-combination, distortion, unsupported facts,
false context classification, duplicates, and targeted retries; never certify.

## Failure statuses

`incomplete_coverage`, `unsupported_candidate`, `conflict`, `provider_error`,
`execution_error`, `review_required`.

## Exit codes

Incomplete coverage and unsupported candidates receive distinct nonzero
workflow outcomes from provider or input errors.

## Backward-compatibility requirements

Legacy extraction may run but cannot satisfy the new publication gate.

## Required fixtures

Missing Safara rules, unrelated citations, one generic record covering many
units, over-combined bullets, inferred facts, false context, retry exhaustion.

## Unit tests

Disposition transitions, counts, one-to-many/many-to-one mappings, precision
checks, retry bounds, deterministic ordering.

## Integration tests

The prior five-requirement/four-rule Safara result fails; targeted retry changes
only requested units and eventually matches the oracle or requires review.

## Negative tests

Agent self-certification, attach-all provenance, silent context/exclusion,
unsupported facts, and unlimited retries fail.

## Completion evidence

Contracts, fixtures, reports, exact commands/statuses, failure artifacts,
rerun and legacy behavior evidence.

## Explicit non-goals

Human approval, model publication, or policy coverage.

