# CES-GF-POL-007 - CES Canonical Vocabulary

**Status:** Implemented; pending review
**Review class:** REVIEW_GATE
**Depends on:** Accepted POL-006

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

## Implementation evidence

- `@company/ces-policy-canonical-vocabulary` defines stable concept identity,
  meaning version, semantic kind, lifecycle, aliases, raw mappings, and review
  decisions independently of every external source schema.
- The representative catalog demonstrates many-to-many normalization while
  keeping obligations, concerns, and verification contexts distinct.
- Merge, split, alias, and retirement are governed decision kinds; the initial
  catalog records proposed merge, split, and alias decisions without inventing
  approval evidence or a retirement event.
- Validation requires raw support and rationale for every canonical concept and
  rejects unknown canonical or raw references.
- Tests prove that source renumbering creates a successor mapping revision
  without changing stable canonical meaning.
- Composite raw identity is preserved as source release plus raw concept ID in
  validation, duplicate detection, and targeted renumbering.
- Mapping and lifecycle helpers require a distinct successor revision with
  exact predecessor linkage; same-revision mutation is rejected.
