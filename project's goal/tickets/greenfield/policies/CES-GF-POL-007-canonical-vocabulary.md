# CES-GF-POL-007 - CES Canonical Vocabulary

**Status:** Proposed
**Depends on:** POL-006

## Outcome

Normalize overlapping raw source concepts into stable, versioned CES concepts
without adopting any external source schema.

## Scope

- Canonical concept identity, meaning, semantic kind, lifecycle, and version.
- Many-to-many mappings to raw concepts with mapping rationale.
- Separation of obligation concepts, concerns, verification contexts, and
  evidence expectations.
- Review workflow for merge, split, alias, and retirement decisions.

## Acceptance contract

- Every canonical concept has supported raw-source mappings and rationale.
- Source renumbering can update a mapping without changing stable CES meaning.
- Semantically distinct objects are not merged only because terms overlap.
- Duplicate synonyms do not create duplicate canonical concepts.
- Mapping and lifecycle changes are versioned and never silently mutate an
  approved baseline.

## Explicit non-goals

- Freezing the policy taxonomy or deciding project applicability.
- Defining Atlas bindings, capability implementation, scoring, or UI.
- Treating mapping count as evidence of importance.
