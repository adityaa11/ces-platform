# CES-GF-ATLAS-HARD-020 — Multilingual Canonical Representation

**Stage:** Canonical model and workflow projection refinement
**Status:** Proposed

## Objective

Preserve authoritative original-language evidence while supporting configured
canonical language, display language, and reviewable cross-language
equivalence.

## Dependencies

- ATLAS-HARD-018 and ATLAS-HARD-019.

## Work

- Add original and canonical statement/language contracts.
- Treat translations as interpretations, never source evidence.
- Produce reviewable `translation_equivalent` proposals with confidence,
  rationale, provenance, and review status.
- Add a project terminology registry.
- Prevent silent cross-language merge and language-dependent identity.

## Outputs

Multilingual records, equivalence proposals, terminology registry, and
language-policy metadata.

## Acceptance criteria

- [ ] Original wording remains exact and source-grounded.
- [ ] Generated translations create no source references.
- [ ] Canonical and display languages are explicit and configurable.
- [ ] Cross-language equivalence is reviewed before consolidation.
- [ ] Display-language changes preserve stable record IDs.
- [ ] Uncertain terminology remains review-required.

## Tests and evidence

Indonesian/English equivalence, non-equivalence, aliases, ambiguous
translation, display switching, and evidence-lineage fixtures.

## Out of scope

Workflow structure and assignment are handled by ATLAS-HARD-021 and
ATLAS-HARD-022.
