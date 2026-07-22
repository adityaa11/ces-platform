# CES-005 — Deliver the Independent Core CLI

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

- [ ] Core commands work when the Laravel package is absent.
- [ ] Validation errors identify the file and failing field without stack traces by default.
- [ ] Blocked and conflicting resolution writes diagnostic output before failure.
- [ ] CLI help documents inputs, outputs, and exit codes.
- [ ] CLI integration tests exercise YAML and JSON inputs.

## Required evidence

- [ ] Attach help output for all core commands and documented exit codes.
- [ ] Attach successful compiled-CLI runs for validation and policy resolution.
- [ ] Attach YAML and JSON integration-test results.
- [ ] Attach a core CLI run performed with the Laravel adapter unavailable.
- [ ] Attach blocked/conflict command output and the diagnostic files written before exit.

## Exclusions

- No adapter compilation or project-source verification.

