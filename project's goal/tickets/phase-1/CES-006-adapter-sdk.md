# CES-006 — Phase 1: Define the Versioned Adapter SDK

**Phase:** 1 — Deterministic Core and Reference Adapter
**Parent:** [CES-000](CES-000-parent-mvp.md)
**Status:** Done

## Goal

Create the only supported boundary through which an adapter consumes a Policy Manifest and technical context.

## Work

- Define versioned adapter metadata, mapping, support, diagnostic, and output contracts.
- Define Implementation Package, Test Manifest, and Verification Manifest schemas.
- Require deterministic mapping provenance for every implementation and verification item.
- Define adapter-gap collection and a stack-neutral `adapter-report.json`.
- Create an explicit adapter registry and compatibility checks.
- Prevent adapters from changing requirement facts, capabilities, traits, policies, or the source manifest.
- Document extension points that allow a future schema version to add component kinds and composition metadata without changing the Policy Manifest.

## Acceptance criteria

- [x] Adapter contract tests can run with no framework packages.
- [x] An unsupported mandatory policy produces a structured adapter gap.
- [x] Adapter gaps prevent successful implementation artifacts and map to exit code 5.
- [x] Adapter-derived schemas include adapter and mapping versions.
- [x] The SDK contains no Laravel-specific types or defaults.
- [x] The SDK does not implement Phase 4 component resolution, dependency solving, generic production fallback, downloading, marketplace, or approval behavior.

## Required evidence

- [x] Link the versioned Adapter SDK schemas and public API.
- [x] Attach passing adapter-contract and compatibility-test output.
- [x] Attach an example `adapter-report.json` containing an unsupported mandatory-policy gap.
- [x] Attach a scan proving the SDK contains no Laravel-specific defaults or terminology.
- [x] Show that no incomplete implementation artifacts are emitted on the gap path.
- [x] Attach an architecture note showing how future component metadata can be added through versioned SDK evolution without changing core policy contracts.

Evidence: [CES-006 verification record](../../evidence/phase-1/CES-006.md)

## Dependency rule

```text
adapter → Adapter SDK → core contracts
```

