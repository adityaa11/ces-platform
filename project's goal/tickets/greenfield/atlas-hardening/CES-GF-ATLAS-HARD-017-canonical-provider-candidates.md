# CES-GF-ATLAS-HARD-017 — Canonical Provider Candidates and Routing

**Stage:** Corrective Atlas hardening
**Status:** Planned

## Objective

Make Agents Bridge emit generic `AtlasCandidate` records directly and route
bounded extractors using registered section purposes and semantic kinds rather
than the legacy requirement/business-rule envelope.

## Dependencies

- ATLAS-HARD-003 through ATLAS-HARD-007.
- ATLAS-HARD-016.

## Work

- Add a canonical Bridge contract carrying source units, classifications,
  revision tuple, extractor identity, and generic candidates.
- Support all registered and organization-defined kinds plus grounded
  `unknown`.
- Execute broad discovery before registry-selected category extractors.
- Merge append-only output deterministically while preserving duplicates,
  conflicts, uncertainty, unknowns, and partial failure.
- Normalize and deduplicate only after generic discovery.
- Generate findings and retries from canonical candidates and source coverage.
- Retain legacy input only through an explicit loss-detecting adapter.

## Outputs

Candidate inventory, extractor ledger, merge report, coverage, findings, retry
history, and explicit legacy-projection losses.

## Acceptance criteria

- [ ] Production Bridge output is generic `AtlasCandidate`, not two legacy
      arrays.
- [ ] Calculations, terminology, reporting, acceptance scenarios, states,
      permissions, procedures, organization kinds, and unknowns remain distinct.
- [ ] Every candidate cites supplied canonical source-unit IDs.
- [ ] Extractor selection is registry-driven and domain-neutral.
- [ ] Partial category failure cannot appear complete.
- [ ] Retry scope contains only unresolved findings and affected source units.
- [ ] Legacy conversion is one-way, explicit, and absent from canonical logic.
- [ ] Novel-kind fixtures pass without core changes.

## Tests and evidence

All built-in categories, organization extension, unknown kind, mixed-purpose
sections, duplicate/conflict, unsupported evidence, partial failure, bounded
retry, legacy-loss reporting, and deterministic merge.

## Out of scope

User-facing command cutover is handled by ATLAS-HARD-018.

