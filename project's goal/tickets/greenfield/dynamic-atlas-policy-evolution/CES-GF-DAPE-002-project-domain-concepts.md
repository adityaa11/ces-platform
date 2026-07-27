# CES-GF-DAPE-002 — Project-Scoped Domain Concepts

**Stage:** P0 Atlas completeness
**Status:** Planned

## Objective

Represent arbitrary project actors, entities, fields, states, actions, events,
calculations, reports, and synonyms in a pinned project lexicon.

## Business and architectural reason

Business meaning must not be forced into static project-management enums.

## Dependencies

- DAPE-001 source-unit revision.

## Inputs

Pinned source units and candidate concept proposals.

## Outputs

Candidate lexicon, proposal queue, reviewed lexicon revision, synonym/merge
decisions, and uncertainties.

## Contract changes

Add versioned `DomainConcept`, lexicon, proposal, relationship, and review
schemas with project/revision IDs, source labels, status, and source units.

## Package ownership

New `domain-concept-schema`; deterministic normalization separate from later
domain-discovery agent registration.

## Deterministic responsibilities

ID syntax, canonical ordering, hashes, duplicate detection, proposal queue,
revision pinning, and reviewed merge application.

## Agent responsibilities

Propose concepts, aliases, and relationships; never confirm or silently merge.

## Failure statuses

`input_error`, `lexicon_conflict`, `unresolved_concept`,
`revision_mismatch`, `review_required`.

## Exit codes

Schema/input `2`; unresolved review and conflict receive distinct workflow
statuses without publishing a confirmed lexicon.

## Backward-compatibility requirements

Existing fixed values project through compatibility concepts; no global Safara
enum additions.

## Required fixtures

Safara concepts, synonyms, homonyms, duplicate proposals, conflicting parents,
and cross-section new-concept proposals.

## Unit tests

Stable IDs/hashes, deterministic merge proposals, revision and source checks.

## Integration tests

All sections use one pinned lexicon containing faithful Safara terminology.

## Negative tests

Silent concept creation, conflicting identities, stale merge, and missing
source provenance fail.

## Completion evidence

Schemas, packages, lexicon artifacts, review fixture, commands, rerun and
compatibility evidence.

## Explicit non-goals

Global ontology promotion, semantic extraction, or policy mapping.

