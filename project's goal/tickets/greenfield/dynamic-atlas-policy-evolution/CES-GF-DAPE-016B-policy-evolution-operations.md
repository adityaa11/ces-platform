# CES-GF-DAPE-016B — Policy-Evolution Operations

**Stage:** Evolution operations
**Status:** Planned

## Objective

Expose governed registry upgrades, semantic diffs, stale evidence, adapter and
task impacts, architecture revisit conditions, and migration guidance.

## Business and architectural reason

Approved registry evolution must be operationally understandable and must never
silently change stable projects.

## Dependencies

- DAPE-015 governance and impact analysis.
- DAPE-016A shared-model adoption.

## Inputs

Old/new immutable registries, project locks, impact reports, model and evidence
revisions.

## Outputs

Upgrade views, migration plans, stale-evidence reports, task/test regeneration
plans, and explicit project-lock proposals.

## Contract changes

Version upgrade, migration, and revisit-status artifacts.

## Package ownership

Registry impact, Assurance, adapters, Forge, Verification, and Architect views.

## Deterministic responsibilities

Diff and affected-artifact calculation use pinned versions and hashes.

## Agent responsibilities

Explain or propose migrations; never update locks or evidence automatically.

## Failure statuses

`upgrade_required`, `registry_conflict`, `adapter_gap`, `evidence_stale`,
`migration_blocked`.

## Exit codes

Distinct nonzero codes for invalid locks, blocked migrations, and stale required
evidence.

## Backward-compatibility requirements

Projects remain on their current lock until explicit approved upgrade.

## Required fixtures

Additive, breaking, weakening, adapter-gap, and stale-evidence upgrades.

## Unit tests

Diff classification and affected-project/artifact calculations.

## Integration tests

Approved pack upgrade propagates expected task, test, evidence, and revisit
effects without mutating the prior project state.

## Negative tests

Silent lock update, missing approval, mutation, and incomplete impact fail.

## Completion evidence

Before/after locks, semantic diff, migration report, commands, rerun evidence.

## Explicit non-goals

Automatic project migration or automatic approval.

