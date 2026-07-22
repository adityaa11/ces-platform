# CES-009 — Compile Adapter-Derived Implementation Packages

## Goal

Generate deterministic implementation artifacts from a resolved Policy Manifest, technical context, and selected adapter.

## Work

- Implement `compile-adapter --policy-manifest --project --adapter --output`.
- Implement `compile` as `resolve-policy → validate unblocked → compile-adapter` orchestration.
- Generate `implementation-plan.json`, `codex-task.md`, `test-manifest.json`, and `verification-manifest.json`.
- Use stable keys, arrays, Markdown sections, whitespace, UTF-8, and LF endings.
- Reject blocked/conflicting manifests before adapter invocation.
- Write `adapter-report.json` on gaps without presenting partial artifacts as successful.

## Acceptance criteria

- [ ] Laravel and fixture compilation consume one byte-identical source manifest.
- [ ] Their adapter outputs differ appropriately and validate against shared contracts.
- [ ] Each output identifies its source manifest, adapter, adapter version, and mapping version.
- [ ] Two compilations to separate directories are byte-for-byte identical.
- [ ] `compile` preserves the observable two-stage boundary and exit contracts.

## Required evidence

- [ ] Attach the shared source Policy Manifest and its SHA-256 hash.
- [ ] Attach both Laravel and fixture implementation-package directories generated from it.
- [ ] Attach schema-validation results for every generated artifact.
- [ ] Attach a byte-for-byte directory comparison from two independent compilations.
- [ ] Attach blocked-manifest and adapter-gap runs proving correct diagnostics, missing partial artifacts, and exit codes.

