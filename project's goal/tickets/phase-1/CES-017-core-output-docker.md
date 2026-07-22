# CES-017 — Phase 1: Finalize Core Output and Mounted Docker Contract

**Phase:** 1 — Deterministic Core and Reference Adapter
**Parent:** [CES-000](CES-000-parent-mvp.md)
**Status:** Done

## Goal

Finalize the independent Stage A output contract and prove the project-pinned two-stage workflow in a mounted container workspace.

## Work

- Change `resolve-policy --output` to accept a directory and write `requirement-package.json` plus `policy-manifest.json` on success, blocked, and conflict paths.
- Make combined compilation expose an observable deterministic layout:
  - `core/requirement-package.json`
  - `core/policy-manifest.json`
  - `adapters/<id>/implementation-plan.json`
  - `adapters/<id>/implementation-task.md`
  - `adapters/<id>/test-manifest.json`
  - `adapters/<id>/verification-manifest.json`
- Use the project-pinned adapter contract from CES-015.
- Extend repository CI to run mounted compilation and assert every artifact, host writability, identity, and absence of container-only paths.

## Acceptance criteria

- [x] Independent core resolution always writes both normalized core artifacts before exit.
- [x] YAML and JSON inputs generate byte-identical normalized Stage A output.
- [x] Mounted Docker compilation requires no separate adapter argument.
- [x] The mounted output follows the final `core/` and `adapters/<id>/` layout.
- [x] Expected files are host-writable and contain no container-only absolute paths.

## Required evidence

- [x] Attach successful, blocked, and conflicting Stage A directories with exit codes.
- [x] Attach mounted Docker command output and complete artifact listing.
- [x] Attach repository CI output proving the mounted smoke test fails on any missing artifact.

## Note

CES-012 already proved image build, CLI startup, and mounted read/write behavior. This ticket hardens the newly approved output and project-pinning contract.
