# CES-GF-ATLAS-HARD-003 — Broad Candidate Extraction

**Stage:** Atlas hardening extraction
**Status:** Planned

## Objective

Separate high-recall discovery of normative source statements from final
classification, normalization, deduplication, and workflow assignment.

## Dependencies

- ATLAS-HARD-001 and ATLAS-HARD-002.
- Completed DAPE-004 bounded-role foundation.

## Work

- Add a source-unit-bounded discovery contract that may emit provisional or
  unknown categories.
- Require every candidate to cite one or more valid canonical source units.
- Pin source, lexicon, schema, prompt, provider, and model revisions.
- Keep discovery output append-only through later classification and retry.
- Prevent candidates from being treated as approved semantic records.

## Outputs

Deterministically ordered candidate inventory with source anchors, provisional
kind, confidence, extraction role, and revision tuple.

## Acceptance criteria

- [ ] Candidate discovery does not require final classification.
- [ ] Every candidate has resolvable canonical source evidence.
- [ ] Small technical requirements are not filtered by headline importance.
- [ ] Unsupported provider claims are blocked or explicitly flagged.
- [ ] Equivalent provider output normalizes to deterministic candidate order.
- [ ] Discovery cannot approve, publish, or mutate source units.

## Tests and evidence

Safara high-recall fixture, unknown-category fixture, unsupported claim,
missing/foreign citation, duplicate wording, provider failure, and deterministic
normalization tests.

## Out of scope

Final classification, deduplication, completeness certification, and approval.
