# CES-GF-DAPE-013 — Extensible Registry Identities and Triggers

**Stage:** P2 registry foundation
**Status:** Planned

## Objective

Validate capability, trait, policy, evidence, and verification identities
against pinned registries and separate definition, trigger, and obligation.

## Business and architectural reason

Closed source enums cannot remain the complete CES engineering vocabulary, but
dynamic IDs must remain controlled and reproducible.

## Dependencies

- DAPE-012 pack composition and locks.

## Inputs

Pinned registry composition and current closed-ID contracts.

## Outputs

Registry-validated IDs, separate definition/trigger/dependency/evidence/
verification artifacts, generalized Safara semantics, compatibility adapters.

## Contract changes

Syntactic RegistryId plus loaded-registry membership; independent versions for
definitions, triggers, dependencies, adapter mappings, implementation guidance,
evidence, verification methods, and standards mappings. A standards-mapping
update does not change core CES policy meaning.

## Package ownership

Capability/policy registries and resolver retain authority; new trigger and
composition packages provide loaded context.

## Deterministic responsibilities

Membership, pin/hash, trigger evaluation, dependency/conflict resolution,
obligation derivation and version checks.

## Agent responsibilities

May propose identities or mappings; cannot inject unknown IDs into compilation.

## Failure statuses

`registry_lock_error`, `registry_conflict`, `mapping_gap`, `policy_gap`,
`capability_gap`, `adapter_gap`.

## Exit codes

Registry identity/lock errors are distinct from valid semantic gaps.

## Backward-compatibility requirements

Existing constants and public contracts remain as compatibility surfaces with
identical fixture behavior.

## Required fixtures

Old IDs, additive new IDs, unknown IDs, trigger-only change, policy-definition
change, generalized transaction/state/audit/privacy/snapshot semantics.

## Unit tests

Syntax/membership, pinning, triggers, separate versions, dependencies and
compatibility adapters.

## Integration tests

Safara mappings validate against loaded packs while old fixtures remain stable.

## Negative tests

Unknown/unpinned IDs, closed-enum authority, trigger-definition conflation,
missing adapter/evidence and incompatible versions fail or remain explicit.

## Completion evidence

Schemas/packages, registry fixtures, commands, errors, deterministic rerun and
public-contract compatibility.

## Explicit non-goals

Project compilation, standards research, or registry publication.
