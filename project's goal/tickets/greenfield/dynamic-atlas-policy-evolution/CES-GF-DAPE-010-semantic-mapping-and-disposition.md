# CES-GF-DAPE-010 — Multi-Channel Semantic Mapping and Gaps

**Stage:** P1 shared lifecycle
**Status:** Planned

## Objective

Give each approved semantic record simultaneous reviewed mappings, explicit
gaps, notes, and a deterministic terminal status.

## Business and architectural reason

A quota rule may affect capabilities, traits, policies, architecture,
implementation, and verification at the same time; one exclusive disposition
loses meaning.

## Dependencies

- DAPE-009 identity chain.

## Inputs

ApprovedProjectModel and available registry identities/revisions.

## Outputs

`SemanticDisposition` records with mapping arrays, gap arrays, notes, rationale,
review evidence, and `handled`, `partially_handled`, `blocked`, or
`not_applicable`.

## Contract changes

Add semantic mapping, capability/policy/adapter/evidence gap schemas and
multi-channel disposition contract.

## Package ownership

New `semantic-mapping-schema` and mapper; deterministic validation separate
from mapping-advisor agent.

## Deterministic responsibilities

Validate target IDs, revisions, coverage of all approved records, terminal
status, ordering and hashes.

## Agent responsibilities

Propose mappings/gaps and rationale; never rewrite semantics, approve mappings,
or invent registry IDs.

## Failure statuses

`mapping_gap`, `policy_gap`, `capability_gap`, `adapter_gap`,
`clarification_required`, `review_required`.

## Exit codes

Blocked/partial mappings remain distinguishable; clarification normally blocks
approval rather than becoming a handled disposition.

## Backward-compatibility requirements

Existing capability/policy mappings project into mapping arrays.

## Required fixtures

Safara quota multi-channel mapping, implementation-only, architecture-only,
verification-only, gaps, not-applicable reason, and clarification.

## Unit tests

Multi-channel validation, target revision, gap/status calculation, complete
record inventory.

## Integration tests

Every Safara semantic record receives mappings/gaps and no record disappears.

## Negative tests

Singular disposition, unknown target, silent drop, invented policy, handled
with blocking gap, and unreviewed mapping fail.

## Completion evidence

Schemas/packages, fixtures, reports, commands, errors, rerun and legacy mapping
evidence.

## Explicit non-goals

Registry-pack publication or policy compilation.

