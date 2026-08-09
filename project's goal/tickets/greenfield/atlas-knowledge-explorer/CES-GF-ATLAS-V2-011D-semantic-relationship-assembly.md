# CES-GF-ATLAS-V2-011D - Semantic Relationship Assembly

**Status:** Planned
**Depends on:** ATLAS-V2-011C

## Outcome

Resolve source-supported relationships between semantic concepts as canonical
model data rather than renderer-created graph edges.

## Scope

- Resolve direction, endpoints, relationship kind, confidence, and evidence.
- Preserve distinct relationships while merging only proven equivalent concepts.
- Support relationships across modules and hierarchy levels without changing
  navigation ownership.
- Keep original concept labels and use controlled English relationship semantics.
- Leave ambiguous endpoints review-required instead of guessing.

## Acceptance

- Every relationship endpoint resolves to a canonical semantic concept.
- Every relationship has exact evidence and deterministic identity.
- Same-meaning multilingual concepts are not duplicated without evidence.
- No edge is created merely because it is typical for the domain.
