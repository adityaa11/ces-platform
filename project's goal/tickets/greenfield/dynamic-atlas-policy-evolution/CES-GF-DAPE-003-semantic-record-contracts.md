# CES-GF-DAPE-003 — Domain-Open Semantic Record Contracts

**Stage:** P0 Atlas completeness
**Status:** Planned

## Objective

Define structurally controlled, domain-open semantic records and relationships.

## Business and architectural reason

Actor-action-resource alone cannot preserve validations, formulas, permissions,
states, workflows, reports, scenarios, deliverables, or nonfunctional meaning.

## Dependencies

- DAPE-002 reviewed lexicon contract.

## Inputs

Pinned source-unit and lexicon revisions.

## Outputs

Candidate records, relationships, conflicts, uncertainties, revision hashes,
and explicit compatibility-projection results.

## Contract changes

Add a discriminated union for functional requirement, business rule,
permission, validation, calculation, state model, workflow, data, report,
acceptance criterion, deliverable, and nonfunctional requirement.

## Package ownership

New `semantic-record-schema`; greenfield contracts retain legacy projections.

## Deterministic responsibilities

Schema/version validation, identity, hashing, ordering, reference integrity,
relationship validation, and lossless/lossy projection classification.

## Agent responsibilities

Propose records with explicit/inferred origin and candidate review state only.

## Failure statuses

`input_error`, `unsupported_candidate`, `conflict`, `revision_mismatch`,
`projection_gap`.

## Exit codes

Input/schema `2`; unsupported/distorted candidate blocks workflow publication.

## Backward-compatibility requirements

Existing candidate and Requirement Package contracts remain readable and gain
explicit compatibility projections.

## Required fixtures

Safara examples for every kind, multi-record source units, multi-unit records,
relationships, inference, conflicts, and projection gaps.

## Unit tests

Every variant, hash/order, relationships, references, and compatibility.

## Integration tests

Concrete Safara formula, permission, state, validation, readiness, report,
scenario, and deliverable preserve their oracle identities.

## Negative tests

Unknown kinds, dangling concepts/units, approved agent output, unrelated
citations, fabricated facts, invalid relationships, and generic catch-all
records fail.

## Completion evidence

Schema/API files, fixtures, commands, expected artifacts and errors,
deterministic rerun, compatibility suite.

## Explicit non-goals

Agent orchestration, coverage completion, review, or policy mapping.

