# CES-GF-ATLAS-V2-004 - Recursive Knowledge Assembly

**Status:** Planned  
**Depends on:** ATLAS-V2-001 through ATLAS-V2-003

## Outcome

Compile semantic facts and graph selections into the permanent Main Workflow
and recursively navigable supporting graphs.

## Scope

- Build module-level overview nodes and evidence-backed relationships.
- Build graph-specific nodes and edges without flattening distinct semantics.
- Link repeated concepts by canonical identity across graphs.
- Create parent/child hierarchy, ordering, breadcrumbs, and evidence links.
- Allow recursive children at any semantically justified depth.
- Detect cycles, orphans, duplicates, and ungrounded edges.

## Acceptance

- HARD-027 golden structure is produced from facts, not copied labels.
- Main Workflow contains modules, not supporting decisions/states as peer boxes.
- Every child is discoverable from its parent and breadcrumb.
- A non-Safara PRD produces a structurally appropriate different hierarchy.
- No frontend inference is required to create relationships or children.

