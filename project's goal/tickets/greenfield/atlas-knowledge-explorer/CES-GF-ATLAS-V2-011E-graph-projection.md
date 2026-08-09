# CES-GF-ATLAS-V2-011E - Graph Projection from Semantic Model

**Status:** Planned
**Depends on:** ATLAS-V2-011D

## Outcome

Select and generate graph representations as evidence-qualified projections of
the semantic model, never as the semantic model itself.

## Scope

- Evaluate workflow, state-machine, decision, entity-lifecycle, dependency,
  audit-flow, and entity-relationship prerequisites per semantic subject.
- Project graph nodes from canonical concept identities and graph edges from
  semantic relationship identities.
- Preserve the traceability chain from each projection element through its
  semantic identity to source unit, PDF page, and exact original wording.
- Attach evidence to every projected node and edge.
- Publish an ordered list of available representations and a deterministic
  default without fixed tabs.
- Keep Main Workflow high-level and exclude internal atomic detail from it.

## Acceptance

- Unsupported graph types are absent.
- Multiple views reuse the same concepts rather than duplicating knowledge.
- Graph rendering can change without changing semantic identities or hierarchy.
- A non-workflow PRD is never presented as a business workflow.
- CES Standards can inspect the same semantic identities without being encoded
  as invented nodes or edges in Atlas graph projections.
