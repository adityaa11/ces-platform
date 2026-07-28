# CES-GF-ATLAS-HARD-021 — First-Class Workflows and Operations

**Stage:** Canonical model and workflow projection refinement
**Status:** Proposed

## Objective

Extend `ProposedProjectModel` with explicit source-grounded workflows and
operations instead of requiring the frontend to infer structure from generic
semantic record nodes.

## Dependencies

- ATLAS-HARD-009 and ATLAS-HARD-017 through ATLAS-HARD-020.

## Work

- Add workflows, operations, actors, summaries, decisions, states,
  transitions, branches, loops, and dependencies.
- Preserve incomplete and competing interpretations.
- Derive structure from canonical claims and records without
  workflow-specific extractors.
- Keep Safara workflow names and topology in qualification fixtures.
- Pin derivation contracts and provenance.

## Outputs

Workflow and operation collections in `proposed-project-model.json`, findings,
and revision metadata.

## Acceptance criteria

- [ ] Workflows and operations have stable IDs and source lineage.
- [ ] Arbitrary directed workflow shapes are supported.
- [ ] Unknown or competing structures remain review-required.
- [ ] Detailed semantic records remain preserved.
- [ ] Production logic contains no Safara-specific routing.
- [ ] The frontend need not invent workflows or operations.

## Tests and evidence

Linear, branching, joining, looping, parallel, optional, incomplete,
multi-actor, heading-free, multilingual, and novel-domain workflows.

## Out of scope

Record-to-workflow assignment is handled by ATLAS-HARD-022.
