# CES-GF-ATLAS-003 — Atlas: System-Intent Graph

**Phase:** 3B — Atlas Graph and Core Handoff  
**Parent:** Greenfield Product Suite  
**Status:** Implemented locally

**Evidence:** [`evidence/CES-GF-ATLAS-003-local-intent-graph.md`](evidence/CES-GF-ATLAS-003-local-intent-graph.md)

## Goal

Render approved requirements and their relationships as stable machine-readable
and human-readable system intent.

## Work

- Build graph nodes from approved sources, requirements, rules, and uncertainties.
- Support the approved relationship vocabulary with reasons and provenance.
- Detect duplicate, dangling, cyclic, and conflicting relationships.
- Emit deterministic JSON, Markdown, and Mermaid views.
- Add requirement-to-capability traceability after core resolution.
- Preserve logical IDs and revision hashes in graph nodes.

## Acceptance criteria

- [x] Every graph edge has a reason and source.
- [x] Invalid or dangling edges fail with structured diagnostics.
- [x] Equivalent graph inputs emit byte-identical JSON and Markdown.
- [x] Graph presentation does not modify approved artifacts.
- [x] Approved requirements enter the existing core without graph-specific fields.

## Required evidence

- [x] Positive and negative graph fixtures.
- [x] Determinism tests.
- [x] Core handoff demonstration.

## Out of scope

- Web visualization.
- Runtime topology discovery.
- Architecture recommendation.
