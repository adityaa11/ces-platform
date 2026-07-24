# CES-GF-FORGE-002 — Forge: Safe Laravel Baseline Scaffold

**Phase:** 4C — Forge Baseline Scaffold  
**Parent:** Greenfield Product Suite  
**Status:** Planned

## Goal

Generate one safe production-oriented Laravel baseline from the approved
architecture, Policy Manifest, and existing Laravel adapter.

## Work

- Place Laravel scaffold templates under adapter ownership.
- Define generated-replaceable, generated-mergeable, generated-once, and
  user-owned file behavior.
- Record template, adapter, scaffold, and source-manifest identities.
- Detect user modifications before regeneration.
- Fail safely when an update would overwrite user-owned work.
- Generate baseline tests and verification hooks required by the adapter.

## Acceptance criteria

- [ ] The scaffold is generated only for an approved compatible Laravel context.
- [ ] Every generated file has ownership and provenance metadata.
- [ ] Regeneration cannot silently overwrite user-owned changes.
- [ ] Unsupported policies remain visible adapter gaps.
- [ ] Generated baseline and tests pass their declared validation workflow.

## Required evidence

- [ ] Clean-generation, regeneration, conflict, and rollback fixtures.
- [ ] Laravel adapter compatibility tests.
- [ ] Generated-project verification report.

## Out of scope

- Next.js/Supabase, Spring, or Go scaffolds.
- Deployment and infrastructure provisioning.
- Complete application code generation.
