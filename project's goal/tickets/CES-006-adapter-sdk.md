# CES-006 — Define the Versioned Adapter SDK

## Goal

Create the only supported boundary through which an adapter consumes a Policy Manifest and technical context.

## Work

- Define versioned adapter metadata, mapping, support, diagnostic, and output contracts.
- Define Implementation Package, Test Manifest, and Verification Manifest schemas.
- Require deterministic mapping provenance for every implementation and verification item.
- Define adapter-gap collection and a stack-neutral `adapter-report.json`.
- Create an explicit adapter registry and compatibility checks.
- Prevent adapters from changing requirement facts, capabilities, traits, policies, or the source manifest.

## Acceptance criteria

- [ ] Adapter contract tests can run with no framework packages.
- [ ] An unsupported mandatory policy produces a structured adapter gap.
- [ ] Adapter gaps prevent successful implementation artifacts and map to exit code 5.
- [ ] Adapter-derived schemas include adapter and mapping versions.
- [ ] The SDK contains no Laravel-specific types or defaults.

## Required evidence

- [ ] Link the versioned Adapter SDK schemas and public API.
- [ ] Attach passing adapter-contract and compatibility-test output.
- [ ] Attach an example `adapter-report.json` containing an unsupported mandatory-policy gap.
- [ ] Attach a scan proving the SDK contains no Laravel-specific defaults or terminology.
- [ ] Show that no incomplete implementation artifacts are emitted on the gap path.

## Dependency rule

```text
adapter → Adapter SDK → core contracts
```

