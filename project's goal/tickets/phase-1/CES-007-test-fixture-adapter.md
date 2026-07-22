# CES-007 — Phase 1: Build the Framework-Neutral Test-Fixture Adapter

**Phase:** 1 — Deterministic Core and Reference Adapter
**Parent:** [CES-000](CES-000-parent-mvp.md)
**Status:** Planned

## Goal

Prove that CES policy output is portable and that Laravel is not the core's internal model.

The test-fixture adapter exists only to prove Policy Manifest portability, Adapter SDK correctness, framework independence of the CES core, and deterministic adapter compilation.

It is test-only. It must not be selected for production project compilation, and it is not the Phase 4 production generic-guidance fallback.

## Work

- Implement every initial mandatory policy mapping with generic pattern names.
- Produce generic implementation, test, and verification guidance.
- Implement at least one deliberate unsupported-policy fixture for gap tests.
- Register the adapter only through the Adapter SDK and registry.
- Mark its adapter metadata as a test fixture and require explicit test mode before selection.

## Acceptance criteria

- [ ] The adapter consumes the profile-picture Policy Manifest unchanged.
- [ ] Its outputs contain generic patterns and no Laravel terminology.
- [ ] Its documentation and package metadata explicitly mark it as test-only and unsafe as production guidance.
- [ ] Production compilation rejects the fixture adapter unless explicit test mode is active.
- [ ] Its output is never described as approved production guidance.
- [ ] Core schemas and resolution code need no modification.
- [ ] Adapter contract and gap tests pass.
- [ ] Removing every production adapter still leaves core and fixture tests green.
- [ ] Laravel and fixture compilation consume the same unchanged Policy Manifest.

## Required evidence

- [ ] Attach the fixture implementation package generated from the shared Policy Manifest.
- [ ] Attach adapter contract-test and deliberate adapter-gap test output.
- [ ] Attach a scan proving fixture output contains no Laravel terminology.
- [ ] Attach a core-and-fixture test run with production adapters unavailable.
- [ ] Attach a package/documentation check proving the fixture cannot be mistaken for the future production `generic-guidance` adapter.
- [ ] Attach fixture metadata showing its test-only classification.
- [ ] Attach rejected production-mode and accepted test-mode selection results.
- [ ] Attach source-manifest hashes from Laravel and fixture compilation proving identical input.

