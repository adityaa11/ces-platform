# CES-GF-FND-001 — Greenfield Foundation: Close the Baseline Gate

**Phase:** 0 — Preserve and Baseline Current Work  
**Parent:** Greenfield Product Suite  
**Status:** Planned

## Goal

Establish a trustworthy Phase 1 and Phase 2 baseline before any greenfield
product milestone is represented as complete.

## Work

- Diagnose and correct the bootstrap-runner timeout and process-tree test failures.
- Run the complete typecheck, test, and build workflow on the supported toolchain.
- Revalidate the hosted repository workflow on the exact accepted commit.
- Record core contract versions and backward-compatibility expectations.
- Retain the profile-picture scenario as a deterministic regression fixture.
- Update the authoritative implementation status from evidence.

## Acceptance criteria

- [ ] `corepack pnpm check` passes without skipped regression tests.
- [ ] Timeout, cancellation, bounded-output, and process-tree tests pass reliably.
- [ ] Hosted CI passes on the same commit.
- [ ] Phase 1 and Phase 2 contract versions are recorded.
- [ ] Existing deterministic artifact comparisons remain byte-identical.

## Required evidence

- [ ] Local command output and commit identity.
- [ ] Hosted workflow link and commit identity.
- [ ] Regression-test results for runner hardening and determinism.

## Out of scope

- Atlas, Architect, Assurance, or Forge implementation.
- New adapters or requirement vocabulary.
- Release publication unless separately approved.
