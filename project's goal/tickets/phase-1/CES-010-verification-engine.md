# CES-010 — Phase 1: Implement Initial Verification

**Phase:** 1 — Deterministic Core and Reference Adapter
**Parent:** [CES-000](CES-000-parent-mvp.md)
**Status:** Done

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

- [x] Missing evidence and prohibited patterns fail deterministic checks.
- [x] Laravel evidence comments are discoverable without a client runtime dependency.
- [x] Semantic authorization and transaction claims are reported for human review.
- [x] Human review does not fail by default but can be gated by assurance policy.
- [x] Verification failures return exit code 6 and produce a readable report.

## Required evidence

- [x] Attach a passing verification report with references to real source and test files.
- [x] Attach failing reports for missing evidence, prohibited patterns, and failed tests.
- [x] Attach a report containing `human_review_required` and show the default successful exit behavior.
- [x] Attach an assurance-gated run showing configured human-review failure behavior.
- [x] Attach the exit-code-6 command output and its persisted verification report.

Evidence: [CES-010 verification record](../../evidence/phase-1/CES-010.md)

## Exclusions

- No sophisticated AST analysis or automated semantic proof.

