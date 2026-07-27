# CES-GF-DAPE-002 — Project-Scoped Domain Concepts

**Priority:** P0 — Atlas completeness  
**Status:** Planned

## Goal

Represent arbitrary project-domain actors, entities, states, fields, events,
and synonyms without adding them to global TypeScript enums.

## Work

- Add `domain-concept-schema` and a versioned candidate domain lexicon.
- Define stable project-scoped concept IDs, kinds, labels, aliases, and source
  provenance.
- Add deterministic normalization plus duplicate and synonym proposals.
- Require human confirmation for merges and canonical terminology.
- Keep concepts project-scoped unless separately promoted through governance.

## Acceptance criteria

- [ ] Safara represents pilgrim, finance, operations, payment, departure
      schedule, readiness, and manifest without project-management aliases.
- [ ] Conflicting or duplicate concepts cannot silently merge.
- [ ] Every concept retains source-unit provenance.
- [ ] Existing fixed-vocabulary fixtures remain valid through compatibility
      projection.

## Depends on

- `CES-GF-DAPE-001`

