# CES-004 — Phase 1: Compile the Stack-Agnostic Policy Manifest

**Phase:** 1 — Deterministic Core and Reference Adapter
**Parent:** [CES-000](CES-000-parent-mvp.md)
**Status:** Done

## Goal

Resolve capabilities, traits, business rules, uncertainties, and assurance context into one deterministic Policy Manifest.

## Work

- Create the versioned initial policy registry using `FILE_CONTENT_VERIFICATION` as the canonical ID.
- Implement deterministic rule matching, policy closure, parameter propagation, and provenance merging.
- Implement mandatory, conditional, and prohibited requirement levels.
- Implement resolved, blocked, and conflict resolution states.
- Detect incompatible parameters and mandatory/prohibited conflicts.
- Generate content-derived IDs from normalized inputs, registry content, and declared versions.
- Write diagnostic manifests even when resolution is blocked or conflicting.

## Acceptance criteria

- [x] The complete profile-picture example produces resolved initial obligations.
- [x] Omitting the replaced-resource lifecycle fact blocks `REPLACED_RESOURCE_LIFECYCLE`.
- [x] Compatible duplicate policies merge evidence; incompatible parameters fail.
- [x] A mandatory/prohibited combination becomes a conflict.
- [x] The manifest contains no technical context or adapter terminology.
- [x] Repeated normalized inputs generate byte-identical manifests.

## Required evidence

- [x] Attach the successful profile-picture Policy Manifest and its input/registry hashes.
- [x] Attach a blocked lifecycle manifest and show exit code 3.
- [x] Attach conflict and incompatible-parameter diagnostics and show exit code 4.
- [x] Attach test output proving duplicate-evidence merging and byte-identical recompilation.
- [x] Attach a scan proving the Policy Manifest contains no adapter or framework terminology.

Evidence: [CES-004 verification record](../../evidence/phase-1/CES-004.md)

## Exit behavior

- Blocked obligation: write manifest and return code 3.
- Policy or registry conflict: write manifest and return code 4.

