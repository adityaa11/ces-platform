# CES-016 — Phase 1: Complete Registry Content Identity

**Phase:** 1 — Deterministic Core and Reference Adapter
**Parent:** [CES-000](CES-000-parent-mvp.md)
**Status:** Planned

## Goal

Make compilation identity sensitive to normalized capability, trait, and policy registry content as well as declared versions.

## Work

- Calculate stable capability-registry, trait-registry, and policy-registry hashes.
- Record all three hashes in the Policy Manifest.
- Include normalized requirement/assurance input, all registry hashes, resolved vocabulary, and obligations in `compilation_id`.
- Normalize semantically unordered registry collections before hashing.
- Allow test injection of registry variants without changing production defaults.

## Acceptance criteria

- [ ] Mutating any definition, resolver rule, policy rule, or parameter binding changes compilation identity without a version change.
- [ ] Reordering equivalent registry content does not change hashes or output.
- [ ] Identical content and versions reproduce byte-identical manifests.

## Required evidence

- [ ] Attach before/after hashes for every mutation category.
- [ ] Attach ordering-invariance and repeat-compilation tests.
- [ ] Attach the updated profile-picture Policy Manifest.
