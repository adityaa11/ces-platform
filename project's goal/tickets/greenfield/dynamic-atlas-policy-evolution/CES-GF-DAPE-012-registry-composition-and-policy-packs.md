# CES-GF-DAPE-012 — Registry Composition and Policy Packs

**Stage:** P2 registry foundation
**Status:** Planned

## Objective

Resolve immutable, pinned policy-pack compositions and reproduce current
behavior through a temporary compatibility pack.

## Business and architectural reason

The project compiler must target the intended multi-pack lock model once,
rather than duplicating registry/version logic.

## Dependencies

- DAPE-010 mappings and gaps.

## Inputs

Current registries/policies and pack/lock definitions.

## Outputs

Pack artifacts, composition and lock, dependency/conflict resolution, content
hash verification, and explicit upgrade proposal.

## Contract changes

Add registry-composition, registry-lock, policy-pack, ownership, dependency,
precedence, conflict, and compatibility schemas.

## Package ownership

New `policy-pack-schema`, `registry-composition`, and `registry-lock-schema`;
current policies move to `legacy-profile-picture-baseline@1.0.0`. Document that
generic validation, authorization, and logging policies later migrate to their
proper families through compatibility mappings.

## Deterministic responsibilities

Pack identity/version/hash, composition order, dependency resolution, conflicts,
lock reproducibility, and no silent upgrades.

## Agent responsibilities

None in resolution or lock mutation.

## Failure statuses

`registry_lock_error`, `registry_conflict`, `upgrade_required`, `input_error`.

## Exit codes

Invalid lock and conflicting composition receive distinct nonzero outcomes.

## Backward-compatibility requirements

All ten existing policy IDs, profile-picture fixture, and outputs remain valid.

## Required fixtures

Compatibility pack, future split families, multiple packs, missing dependency,
cycle, precedence conflict, hash mismatch, compatible/incompatible range, and
explicit upgrade.

## Unit tests

Resolution, order, dependency/conflict, hashes, immutability and lock equality.

## Integration tests

Old policy behavior compiles through the pinned initial pack unchanged.

## Negative tests

Unpinned/mutable content, duplicate ownership, silent upgrade, conflict and
hash mismatch fail.

## Completion evidence

Pack files, lock examples, commands, failure artifacts, deterministic rerun,
profile-picture compatibility.

## Explicit non-goals

Dynamic IDs, project compiler, research, or publication governance.
