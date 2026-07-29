# CES-GF-ATLAS-HARD-019 — Stable Canonical Record Identity

**Stage:** Canonical model and workflow projection refinement
**Status:** Proposed

## Objective

Separate provider-run candidate identity, stable proposed semantic identity,
and human-governed approved logical identity.

## Dependencies

- ATLAS-HARD-009, ATLAS-HARD-017, and ATLAS-HARD-018.

## Work

- Define the identity boundary explicitly:
  - `candidate_id` identifies one Atlas extraction observation and remains
    provenance-only;
  - `record_id` is the DAPE-compatible, revision-scoped canonical semantic
    identity inside one immutable proposal revision, not a parallel Atlas
    semantic namespace;
  - `approved_logical_id` is the governed longitudinal identity that preserves
    canonical DAPE semantic lineage across accepted revisions.
- Derive record identity from project scope, semantic kind,
  language-independent semantic fingerprint, stable source lineage, and
  logical scope.
- Define stable source lineage so page numbers, source-unit ordering, and other
  physical locations remain provenance inputs but do not replace semantic
  identity when equivalent content moves.
- Keep candidate IDs and retry observations only in provenance.
- Make wording, language, candidate order, duplicate discovery, retry, and
  workflow assignment identity-neutral.
- Make proposed `record_id` values revision-scoped and include their proposal
  revision in the identity contract and DAPE revision-tuple mapping.
- Preserve `approved_logical_id` across meaning-preserving document revisions
  and page or source-unit movement.
- Create an explicit semantic revision or reviewed successor identity for
  meaning-changing revisions.
- Where a separate external identifier is unavoidable, store an explicit,
  directional mapping to the authoritative DAPE semantic identity rather than
  treating both identifiers as equal canonical identities.
- Surface identity collisions and migrations without silently replacing
  approved identities.

## Outputs

Stable identity contracts, provenance mappings, collision findings, migration
report, and deterministic fixtures.

## Acceptance criteria

- [ ] Duplicate candidates, ordering, and retry within the same immutable
      proposal revision do not change `record_id`.
- [ ] Display-language changes within the same proposal revision do not change
      `record_id`.
- [ ] Equivalent multilingual statements share `approved_logical_id` only
      after accepted equivalence review; any corrected proposal remains a new
      immutable revision.
- [ ] Workflow reassignment does not change `record_id`.
- [ ] `record_id` is the DAPE-compatible canonical semantic identity or has one
      explicit directional mapping to it; Atlas does not create a second equal
      canonical identity namespace.
- [ ] Moving an equivalent requirement to another page or source unit does not
      replace its `approved_logical_id`.
- [ ] Source revision changes update provenance without silently changing
      semantic identity when meaning is preserved.
- [ ] `record_id` is explicitly revision-scoped and `approved_logical_id`
      preserves continuity across accepted meaning-preserving revisions.
- [ ] Candidate rediscovery does not redefine approved logical identity.
- [ ] Meaning-changing corrections produce reviewable identity changes.
- [ ] Meaning-changing revisions create an explicit semantic revision or
      successor identity rather than silently reusing the old meaning.
- [ ] Approval never targets unstable projection IDs.

## Tests and evidence

Duplicate insertion, shuffling, retry, paraphrase, translation, reassignment,
page movement, equivalent source revision, collision, semantic succession, and
meaning-change fixtures.

## Out of scope

Multilingual equivalence governance is handled by ATLAS-HARD-020.
