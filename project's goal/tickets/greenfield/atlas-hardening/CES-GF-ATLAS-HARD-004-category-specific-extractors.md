# CES-GF-ATLAS-HARD-004 — Category-Specific Extractors

**Stage:** Atlas hardening extraction
**Status:** Implemented

## Objective

Implement or qualify bounded extraction roles for each semantic category while
sharing the canonical DAPE source, lexicon, and semantic contracts.

## Dependencies

- ATLAS-HARD-003.
- Completed DAPE-004 bounded role and deterministic merge contracts.

## Work

- Provide bounded roles for capability, workflow, business rule, validation,
  role/permission, state/lifecycle, calculation, reporting, acceptance
  scenario, and terminology extraction.
- Register extractor capabilities by supported semantic kinds and contract
  versions rather than selecting them through a closed domain-specific switch.
- Define input/output schemas, allowed categories, evidence requirements,
  failure statuses, and pinned revisions for every role.
- Merge role output deterministically without allowing an agent to own source
  identity, stable IDs, deduplication, or approval.
- Surface cross-role duplicates and contradictions for later handling.
- Carry unclassified and unknown broad-discovery candidates through merge even
  when no category-specific extractor claims them.

## Outputs

Registered extractor contracts, merged candidate artifact, role diagnostics,
and revision metadata.

## Acceptance criteria

- [x] Every extractor has a bounded, versioned input/output schema.
- [x] Each output remains source-grounded and identifies its extractor.
- [x] All roles use the same pinned source/lexicon/schema revision tuple.
- [x] Merge order is deterministic and does not silently resolve conflicts.
- [x] Extractors cannot approve records or write authoritative registries.
- [x] Partial provider failure is explicit and cannot appear complete.
- [x] Unknown candidates survive every category pass unchanged and remain
      reviewable.
- [x] A registered organization-specific extractor can be added without
      modifying unrelated extractor implementations.

## Tests and evidence

Per-role and registered-extension fixtures, unclaimed unknown candidate,
cross-role duplicate/conflict fixtures, revision mismatch, missing evidence,
provider failure, and merge-order determinism.

## Completion evidence

- Added a hashed registry for ten bounded CES extractor capabilities and
  versioned organization-specific extensions.
- Added revision-bound extractor-run and deterministic merge contracts.
- Merge preserves the immutable candidate inventory, reports unclaimed unknowns,
  rejects unsupported assignments, and makes partial failures incomplete.
- Focused role-contract and architecture tests: 12 passed.
- Package TypeScript build passed.

## Out of scope

Coverage certification, targeted retry, human review, and graph publication.
