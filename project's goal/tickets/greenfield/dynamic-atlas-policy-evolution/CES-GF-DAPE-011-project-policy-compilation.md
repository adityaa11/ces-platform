# CES-GF-DAPE-011 — Project-Level Policy Compilation

**Priority:** P1 — Shared model  
**Status:** Planned

## Goal

Compile a deterministic project Policy Manifest from the approved model,
reviewed mappings, assurance context, and pinned registries.

## Work

- Add project-level compilation input and manifest fields.
- Include model, requirement, rule, mapping, capability, trait, policy,
  registry, and gap identities.
- Preserve the current single-Requirement-Package path.
- Fail on unreviewed mappings, unresolved blocking gaps, or unpinned registry
  inputs.
- Add deterministic project compilation and incremental projection tests.

## Acceptance criteria

- [ ] Pinned equivalent inputs produce byte-identical manifests.
- [ ] No raw or unreviewed agent output reaches the policy engine.
- [ ] Existing compilation fixtures retain compatible output.
- [ ] Every obligation explains which approved semantic record triggered it.

## Depends on

- `CES-GF-DAPE-010`

