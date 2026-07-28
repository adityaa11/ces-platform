# CES-GF-ATLAS-HARD-010 — Proposed Graph Projection

**Stage:** Atlas hardening proposal
**Status:** Implemented

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

- [x] A graph is available before any approval decision.
- [x] Proposed and approved graphs use one shared projection contract.
- [x] Every graph item resolves to proposal and source identities.
- [x] Review and exception states remain precise in the backend contract.
- [x] Linear, conditional, parallel, cyclic, and disconnected review-required
      graph shapes project without domain-specific code.
- [x] Unknown node and relationship kinds retain source evidence and issues.
- [x] The graph input uses generic semantic nodes and relationships rather than
      Safara-specific workflow fields.
- [x] Proposed graph artifacts cannot enable downstream execution.
- [x] Node/edge ordering and rendered projections are deterministic.

## Tests and evidence

Linear, branch/join, parallel, loop, optional-step, actor-lane, state-transition,
unknown-node, pending, approved, correction, ambiguity, conflict, unsupported,
source-missing, broken-link, authority-escalation, and deterministic fixtures.

## Completion evidence

- Added a lifecycle-neutral workflow projection contract to the existing Atlas
  graph package and a `ProposedProjectModel` adapter.
- Supports arbitrary directed relationships, loops, branches, joins, parallel
  paths, extensible kinds, unknown nodes, findings, and source evidence.
- Derives precise node review summaries and enforces lifecycle authority.
- Graph and architecture tests: 13 passed; package typecheck passed.

## Out of scope

Production UI implementation and approval decision storage.
