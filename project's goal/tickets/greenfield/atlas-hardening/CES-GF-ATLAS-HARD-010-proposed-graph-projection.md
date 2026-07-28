# CES-GF-ATLAS-HARD-010 — Proposed Graph Projection

**Stage:** Atlas hardening proposal
**Status:** Planned

## Objective

Project a complete workflow graph from `ProposedProjectModel` before approval
using the same deterministic projection boundary as approved models.

## Dependencies

- ATLAS-HARD-009.
- Completed DAPE-007 projection contracts and existing Atlas graph behavior.

## Work

- Define a shared lifecycle-aware graph input for proposed and approved models.
- Project workflow nodes, edges, contained semantic items, source-document
  links, findings, review states, and approval summary.
- Derive node state from contained item states.
- Mark every proposed graph clearly as non-authoritative and non-executable.
- Preserve model revision/hash and deterministic node/edge ordering.

## Outputs

`proposed-workflow-graph.json` and supported Markdown/Mermaid views carrying
proposal identity and review metadata.

## Acceptance criteria

- [ ] A graph is available before any approval decision.
- [ ] Proposed and approved graphs use one shared projection contract.
- [ ] Every graph item resolves to proposal and source identities.
- [ ] Review and exception states remain precise in the backend contract.
- [ ] Proposed graph artifacts cannot enable downstream execution.
- [ ] Node/edge ordering and rendered projections are deterministic.

## Tests and evidence

Pending, approved, correction, ambiguity, conflict, unsupported, source-missing,
mixed-node, broken-link, authority-escalation, and deterministic graph fixtures.

## Out of scope

Production UI implementation and approval decision storage.
