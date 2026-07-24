# CES-GF-ATLAS-003 — Atlas: System-Intent Graph

**Phase:** 3B — Atlas Graph and Core Handoff  
**Parent:** Greenfield Product Suite  
**Status:** Planned

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

- [ ] Every graph edge has a reason and source.
- [ ] Invalid or dangling edges fail with structured diagnostics.
- [ ] Equivalent graph inputs emit byte-identical JSON and Markdown.
- [ ] Graph presentation does not modify approved artifacts.
- [ ] Approved requirements enter the existing core without graph-specific fields.

## Required evidence

- [ ] Positive and negative graph fixtures.
- [ ] Determinism tests.
- [ ] Core handoff demonstration.

## Out of scope

- Web visualization.
- Runtime topology discovery.
- Architecture recommendation.
