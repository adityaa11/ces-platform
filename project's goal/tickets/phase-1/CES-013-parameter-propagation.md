# CES-013 — Phase 1: Preserve Concrete Policy Parameters

**Phase:** 1 — Deterministic Core and Reference Adapter
**Parent:** [CES-000](CES-000-parent-mvp.md)
**Status:** Done

## Goal

Preserve concrete file constraints from the Requirement Package through policy resolution, adapter mappings, implementation/test/verification manifests, and the rendered implementation task.

## Work

- Add a canonical `FILE_MEDIA_TYPE_ALLOWLIST` policy, or an equivalently explicit stack-agnostic obligation, with `allowed_media_types` parameters.
- Propagate obligation parameters through every adapter-derived guidance item without allowing adapters to alter them.
- Render exact byte limits and media types in implementation tasks, tests, and verification checks.
- Regenerate Laravel and fixture evidence from the same Policy Manifest.

## Acceptance criteria

- [x] The Policy Manifest contains `maximum_bytes: 5242880` and `allowed_media_types: [image/jpeg, image/png]`.
- [x] Both adapters preserve those parameters unchanged.
- [x] Implementation plans and tasks state the exact limit and allowlist.
- [x] Test and verification manifests retain the same concrete values.
- [x] Parameter conflicts remain deterministic policy conflicts.

## Required evidence

- [x] Attach updated Policy Manifest and adapter-derived artifacts.
- [x] Attach propagation tests for every stage.
- [x] Attach an incompatible-parameter failure with exit code 4.

## Exclusions

- No framework policy in the core and no free-form adapter reinterpretation of values.
