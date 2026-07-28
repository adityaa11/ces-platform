# CES-GF-ATLAS-HARD-019 — Stable Canonical Record Identity

**Stage:** Canonical model and workflow projection refinement
**Status:** Proposed

## Objective

Separate provider-run candidate identity, stable proposed semantic identity,
and human-governed approved logical identity.

## Dependencies

- ATLAS-HARD-009, ATLAS-HARD-017, and ATLAS-HARD-018.

## Work

- Define `candidate_id`, stable `record_id`, and `approved_logical_id`.
- Derive record identity from project scope, semantic kind,
  language-independent semantic fingerprint, stable source lineage, and
  logical scope.
- Keep candidate IDs and retry observations only in provenance.
- Make wording, language, candidate order, duplicate discovery, retry, and
  workflow assignment identity-neutral.
- Surface identity collisions and migrations without silently replacing
  approved identities.

## Outputs

Stable identity contracts, provenance mappings, collision findings, migration
report, and deterministic fixtures.

## Acceptance criteria

- [ ] Duplicate candidates, ordering, and retry do not change `record_id`.
- [ ] Display-language changes do not change `record_id`.
- [ ] Equivalent multilingual statements can share one proposed identity.
- [ ] Workflow reassignment does not change `record_id`.
- [ ] Meaning-changing corrections produce reviewable identity changes.
- [ ] Approval never targets unstable projection IDs.

## Tests and evidence

Duplicate insertion, shuffling, retry, paraphrase, translation, reassignment,
collision, and meaning-change fixtures.

## Out of scope

Multilingual equivalence governance is handled by ATLAS-HARD-020.
