# CES-GF-FND-002 — Greenfield Foundation: Contracts, Identity, and Vocabulary

**Phase:** 3 — Shared Greenfield Contracts  
**Parent:** Greenfield Product Suite  
**Depends on:** CES-GF-FND-001
**Status:** Planned

## Goal

Add the minimum backward-compatible contracts needed for multiple greenfield
requirements without weakening the existing deterministic core.

## Work

- Define a versioned Requirement Collection that references individually valid
  Requirement Packages.
- Separate persistent logical IDs from immutable normalized revision hashes.
- Generalize actors, actions, resources, states, and relationships through
  controlled, versioned vocabularies.
- Define source-document, source-reference, project-intent, candidate, review,
  and inference metadata contracts.
- Define deterministic normalization, ordering, and collection identity.
- Update the fail-closed architecture dependency matrix only for proven packages.

## Acceptance criteria

- [ ] Existing Phase 1 requirement fixtures remain valid without migration.
- [ ] A collection can contain multiple approved Requirement Packages.
- [ ] Editing a requirement preserves its logical ID and changes its revision hash.
- [ ] Unknown vocabulary values fail with structured diagnostics.
- [ ] Candidate artifacts cannot be parsed as approved core inputs.
- [ ] Collection output is byte-identical for semantically equivalent ordering.

## Required evidence

- [ ] Versioned schemas and valid/invalid fixtures.
- [ ] Backward-compatibility and determinism tests.
- [ ] Architecture-boundary tests for every new package edge.

## Out of scope

- Natural-language extraction.
- Policy-registry expansion beyond needs proven by the demonstration.
- Brownfield reconstruction.
