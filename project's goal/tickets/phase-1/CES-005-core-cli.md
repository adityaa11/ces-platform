# CES-005 — Phase 1: Deliver the Independent Core CLI

**Phase:** 1 — Deterministic Core and Reference Adapter
**Parent:** [CES-000](CES-000-parent-mvp.md)
**Status:** Done

## Goal

Expose validation and core policy resolution without loading a production adapter.

## Work

- Implement `validate-requirement` and `validate-project`.
- Implement `resolve-policy --requirement --project --output`.
- Parse the combined project file but pass only assurance context into core resolution.
- Produce normalized `requirement-package.json` and `policy-manifest.json`.
- Implement stable diagnostics and the agreed exit codes.
- Ensure compiled CLI output runs directly with Node.js.

## Acceptance criteria

- [x] Core commands work when the Laravel package is absent.
- [x] Validation errors identify the file and failing field without stack traces by default.
- [x] Blocked and conflicting resolution writes diagnostic output before failure.
- [x] CLI help documents inputs, outputs, and exit codes.
- [x] CLI integration tests exercise YAML and JSON inputs.

## Required evidence

- [x] Attach help output for all core commands and documented exit codes.
- [x] Attach successful compiled-CLI runs for validation and policy resolution.
- [x] Attach YAML and JSON integration-test results.
- [x] Attach a core CLI run performed with the Laravel adapter unavailable.
- [x] Attach blocked/conflict command output and the diagnostic files written before exit.

Evidence: [CES-005 verification record](../../evidence/phase-1/CES-005.md)

## Exclusions

- No adapter compilation or project-source verification.

