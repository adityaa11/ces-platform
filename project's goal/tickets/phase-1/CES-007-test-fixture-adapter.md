# CES-007 — Phase 1: Build the Framework-Neutral Test-Fixture Adapter

**Phase:** 1 — Deterministic Core and Reference Adapter
**Parent:** [CES-000](CES-000-parent-mvp.md)
**Status:** Planned

## Goal

Prove that CES policy output is portable and that Laravel is not the core's internal model.

## Work

- Implement every initial mandatory policy mapping with generic pattern names.
- Produce generic implementation, test, and verification guidance.
- Implement at least one deliberate unsupported-policy fixture for gap tests.
- Register the adapter only through the Adapter SDK and registry.

## Acceptance criteria

- [ ] The adapter consumes the profile-picture Policy Manifest unchanged.
- [ ] Its outputs contain generic patterns and no Laravel terminology.
- [ ] Core schemas and resolution code need no modification.
- [ ] Adapter contract and gap tests pass.
- [ ] Removing every production adapter still leaves core and fixture tests green.

## Required evidence

- [ ] Attach the fixture implementation package generated from the shared Policy Manifest.
- [ ] Attach adapter contract-test and deliberate adapter-gap test output.
- [ ] Attach a scan proving fixture output contains no Laravel terminology.
- [ ] Attach a core-and-fixture test run with production adapters unavailable.

