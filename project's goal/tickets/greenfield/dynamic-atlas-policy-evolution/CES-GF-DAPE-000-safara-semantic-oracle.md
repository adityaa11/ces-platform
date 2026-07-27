# CES-GF-DAPE-000 — Contract-Neutral Safara Semantic Oracle

**Stage:** Preparation
**Status:** Ready

## Objective

Define a contract-neutral, human-reviewed inventory of Safara business meaning
before production source-unit, lexicon, semantic-record, or project-model
schemas exist.

## Business and architectural reason

The oracle must shape later contracts without circularly freezing their final
serialization. It answers what meaning must survive, not how packages encode it.

## Dependencies

- Accepted `CES-GF-ATLAS-005` ingestion baseline.

## Inputs

- Approved-to-use Safara source or redacted equivalent.
- Reviewed normalized text and DAPE architecture.

## Outputs

- `semantic-oracle.yaml`
- `expected-source-spans.yaml`
- `expected-concepts.yaml`
- `expected-business-rules.yaml`
- `expected-acceptance-items.yaml`
- `oracle-review-record.yaml`
- Projection checklist for DAPE-001, DAPE-002, DAPE-003, and DAPE-007.

Each entry uses a stable human oracle key, page/section/text anchors, category,
expected meaning, and mandatory flag. It does not use production serialization.

## Contract changes

Add only a fixture-local oracle schema. Production packages do not consume it.

## Package ownership

`fixtures/safara`; later owning packages create versioned projections from it.

## Deterministic responsibilities

Validate oracle keys, source anchors, expected constraints, category counts,
mandatory flags, and human review identity.

## Agent responsibilities

An agent may assist inventory drafting but cannot define or approve the oracle.

## Failure statuses

`input_error`, `incomplete_oracle`, `oracle_conflict`.

## Exit codes

Existing test-runner conventions; any oracle mismatch fails CI.

## Backward-compatibility requirements

Do not commit a confidential source without authorization. Existing fixtures
remain unchanged.

## Required fixtures

At minimum: 9 numbered areas, 3 roles, 10 primary rules, 12 inspection
scenarios, 9 deliverables, and 10 acceptance criteria, plus detailed fields,
statuses, calculations, permissions, retention, reports, exports, readiness,
and finalization semantics.

## Unit tests

Oracle format, key uniqueness, source-anchor validation, category counts, and
review record.

## Integration tests

Concrete oracle meaning such as registration quota retains exact source anchors
and constraints. Later ticket tests project it into their own contracts.

## Negative tests

Premature production artifacts, broad category-only assertions, invented
meaning, missing entries, and unanchored meaning cannot satisfy the oracle.

## Completion evidence

Fixture paths, review record, counts/keys, and the commands validating the
contract-neutral inventory.

## Explicit non-goals

Production source-unit IDs, domain/semantic schemas, ApprovedProjectModel
serialization, extraction, provider calls, or downstream registries.

