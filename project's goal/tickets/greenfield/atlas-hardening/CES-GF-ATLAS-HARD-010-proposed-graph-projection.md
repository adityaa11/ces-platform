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
- Support arbitrary directed relationships, including branches, joins, loops,
  parallel paths, optional steps, actor lanes, decisions, state transitions,
  documents, uncertainties, and unknown nodes.
- Resolve graph node behavior through the pinned kind registry; an unknown node
  renders as source-grounded and review-required rather than failing projection.
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
- [ ] Linear, conditional, parallel, cyclic, and disconnected review-required
      graph shapes project without domain-specific code.
- [ ] Unknown node and relationship kinds retain source evidence and issues.
- [ ] The graph input uses generic semantic nodes and relationships rather than
      Safara-specific workflow fields.
- [ ] Proposed graph artifacts cannot enable downstream execution.
- [ ] Node/edge ordering and rendered projections are deterministic.

## Tests and evidence

Linear, branch/join, parallel, loop, optional-step, actor-lane, state-transition,
unknown-node, pending, approved, correction, ambiguity, conflict, unsupported,
source-missing, broken-link, authority-escalation, and deterministic fixtures.

## Out of scope

Production UI implementation and approval decision storage.
