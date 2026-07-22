# CES-010 — Phase 1: Implement Initial Verification

**Phase:** 1 — Deterministic Core and Reference Adapter
**Parent:** [CES-000](CES-000-parent-mvp.md)
**Status:** Planned

## Goal

Verify generated contracts and limited adapter-specific implementation evidence without claiming unsupported semantic proof.

## Work

- Implement `verify --manifest --project-root`.
- Validate schemas, versions, source-manifest identity, required files, and adapter support.
- Run deterministic adapter-provided evidence, file, simple-pattern, and prohibited-pattern checks.
- Verify evidence references point to real files; do not trust declarations alone.
- Support configured test execution and machine-readable results through adapter rules.
- Support `passed`, `failed`, `not_applicable`, `human_review_required`, `unsupported`, and `blocked`.
- Keep semantic checks as explicit human-review findings.

## Acceptance criteria

- [ ] Missing evidence and prohibited patterns fail deterministic checks.
- [ ] Laravel evidence comments are discoverable without a client runtime dependency.
- [ ] Semantic authorization and transaction claims are reported for human review.
- [ ] Human review does not fail by default but can be gated by assurance policy.
- [ ] Verification failures return exit code 6 and produce a readable report.

## Required evidence

- [ ] Attach a passing verification report with references to real source and test files.
- [ ] Attach failing reports for missing evidence, prohibited patterns, and failed tests.
- [ ] Attach a report containing `human_review_required` and show the default successful exit behavior.
- [ ] Attach an assurance-gated run showing configured human-review failure behavior.
- [ ] Attach the exit-code-6 command output and its persisted verification report.

## Exclusions

- No sophisticated AST analysis or automated semantic proof.

