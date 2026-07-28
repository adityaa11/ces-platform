# CES-GF-ATLAS-HARD-018 — Atomic Claims and Claim-Level Coverage

**Stage:** Canonical model and workflow projection refinement
**Status:** Proposed

## Objective

Decompose canonical source units into source-grounded atomic claims so Atlas
measures completeness per normative obligation instead of marking a partially
represented source unit complete.

## Dependencies

- ATLAS-HARD-001, ATLAS-HARD-005 through ATLAS-HARD-007, and ATLAS-HARD-017.

## Work

- Persist deterministic atomic claims with exact spans and source-unit lineage.
- Map each claim to candidate and canonical record IDs.
- Require one disposition: `represented`, `duplicate`, `not_applicable`,
  `ambiguous`, `conflicting`, `unsupported`, `uncovered`, or
  `human_review_required`.
- Drive findings and bounded retry from unresolved claims.
- Keep decomposition domain-neutral, uncertainty-preserving, and revision-pinned.

## Outputs

`atomic-claims.json`, claim-level `source-coverage.json`, findings, and revision
metadata.

## Acceptance criteria

- [ ] Every normative claim has exactly one valid disposition.
- [ ] One represented claim cannot hide sibling uncovered claims.
- [ ] Claim spans resolve to canonical source units.
- [ ] Uncertain decomposition remains review-required.
- [ ] Uncovered claims block HARD-015 qualification.
- [ ] Replay is deterministic for pinned inputs and revisions.

## Tests and evidence

Compound lists, tables, multi-obligation prose, duplicates, ambiguous
boundaries, conflicts, retry closure, and deterministic replay.

## Out of scope

Canonical record identity is handled by ATLAS-HARD-019.
