# CES-GF-ATLAS-HARD-003 — Broad Candidate Extraction

**Stage:** Atlas hardening extraction
**Status:** Implemented

## Objective

Separate high-recall discovery of normative source statements from final
classification, normalization, deduplication, and workflow assignment.

## Dependencies

- ATLAS-HARD-001 and ATLAS-HARD-002.
- Completed DAPE-004 bounded-role foundation.

## Work

- Add a source-unit-bounded discovery contract that may emit provisional or
  unknown categories.
- Introduce one generic `AtlasCandidate` provider contract with candidate ID,
  statement, provisional kind, source-unit IDs, confidence, extraction role,
  classification status, and pinned provider metadata.
- Migrate compatibility adapters away from provider output restricted to
  `candidate_requirements` and `candidate_business_rules`; narrow legacy arrays
  may be projections but cannot be the canonical discovery contract.
- Require every candidate to cite one or more valid canonical source units.
- Pin source, lexicon, schema, prompt, provider, and model revisions.
- Keep discovery output append-only through later classification and retry.
- Prevent candidates from being treated as approved semantic records.

## Outputs

Deterministically ordered candidate inventory with source anchors, provisional
kind, confidence, extraction role, and revision tuple.

## Acceptance criteria

- [x] Candidate discovery does not require final classification.
- [x] The canonical provider contract accepts candidates that are neither
      requirements nor business rules.
- [x] Legacy narrow provider output is converted through an explicit,
      loss-detecting compatibility adapter.
- [x] Every candidate has resolvable canonical source evidence.
- [x] Small technical requirements are not filtered by headline importance.
- [x] Unsupported provider claims are blocked or explicitly flagged.
- [x] Equivalent provider output normalizes to deterministic candidate order.
- [x] Discovery cannot approve, publish, or mutate source units.

## Tests and evidence

Safara high-recall fixture, unrelated-domain and novel-kind fixtures,
unsupported claim, missing/foreign citation, lossy legacy-adapter case,
duplicate wording, provider failure, and deterministic normalization tests.

## Completion evidence

- Added the generic, immutable `AtlasCandidate` and candidate-inventory
  contracts without removing legacy DAPE envelopes.
- Pinned source, lexicon, semantic schema, semantic-kind registry, prompt,
  provider, model, and provider-contract identities.
- Added explicit evidence-review state and loss-detecting legacy migration.
- Focused role-contract and architecture tests passed; package typecheck passed.

## Out of scope

Final classification, deduplication, completeness certification, and approval.
