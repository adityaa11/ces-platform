# CES-GF-DAPE-015 — Registry Governance, Publication, Diff, and Impact

**Stage:** P3 policy evolution
**Status:** Planned

## Objective

Govern, approve, immutably publish, compare, migrate, and assess registry
changes through explicit auditable roles.

## Business and architectural reason

Agent proposals must not mutate stable knowledge, weaken controls, or silently
change projects.

## Dependencies

- DAPE-014 controlled proposals.

## Inputs

Proposal/research record, current immutable versions, governance roles and
decision, project locks, mappings, adapters, tasks, tests and evidence.

## Outputs

Governance decision, new immutable version, semantic diff/version class,
migration plan, affected-project/artifact report, and explicit upgrade option.

## Contract changes

Add governance-role/decision, publication, semantic-diff, migration,
weakening-review, and impact-analysis contracts.

## Package ownership

New `registry-governance`, `registry-versioning`, `policy-semantic-diff`,
`registry-migration`, and `registry-impact-analysis`.

## Deterministic responsibilities

Approval authorization, immutable version/hash, patch/minor/major
classification, old-version preservation, impact and stale-evidence analysis.

## Agent responsibilities

Explain proposals/diffs and draft migrations; cannot approve, sign, publish, or
update project locks.

## Failure statuses

`review_required`, `publication_error`, `registry_conflict`,
`upgrade_required`, `migration_blocked`, `evidence_stale`.

## Exit codes

Unauthorized/unapproved publication, invalid diff, blocked migration and impact
failure remain distinct.

## Backward-compatibility requirements

Old registry versions remain addressable and unchanged; projects upgrade only
through approved lock changes.

## Required fixtures

Patch/minor/major, additive policy/trigger/evidence, merge/removal/weakening,
adapter gap, stale evidence, architecture revisit and multiple affected projects.

## Unit tests

Role authorization, publication immutability, version classification,
weakening elevation, migration and impact calculations.

## Integration tests

An approved new pack version identifies changed manifests, adapters, tasks,
tests, evidence and revisit conditions without mutating old versions/projects.

## Negative tests

Agent/self approval, in-place mutation, silent upgrade, unjustified weakening,
incomplete impact and missing migration fail.

## Completion evidence

Role/contracts/packages, before/after immutable artifacts, diffs, impact and
migration reports, commands, failures and reproducibility.

## Explicit non-goals

Automatic upgrade, implementation changes, or certification.

