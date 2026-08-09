# CES-GF-ATLAS-V2-011C - Semantic Hierarchy Assembly

**Status:** Completed
**Depends on:** ATLAS-V2-011B

## Outcome

Assemble extracted concepts into one recursive semantic hierarchy that is
independent from graph types and directly supports navigation.

## Scope

- Build `Main Workflow -> Module -> Concept -> Nested Concept` ownership.
- Determine parentage through section ownership, explicit containment, semantic
  references, and evidence—not graph membership or display convenience.
- Publish ordered child identities and complete ancestry for breadcrumbs.
- Allow concepts with no graph view and subjects with multiple graph views.
- Detect cycles, unreachable nodes, artificial filler hierarchy, and ambiguous
  ownership before publication.

## Acceptance

- Breadcrumbs can reach every concept from Main Workflow.
- Graph names do not appear as semantic hierarchy levels.
- Documentation headings are not published as children unless their wording is
  independently supported as a business or engineering concept.
- Selecting a module exposes its actual concepts before any representation.
- Hierarchy labels remain exact source wording.

## Completion evidence

- Knowledge bundles now include a validated graph-neutral semantic model and
  recursively navigable concept knowledge nodes.
- Modules own semantic children and reference graph representations separately;
  visualization nodes can no longer be semantic children.
- Assembly derives evidence-grounded parentage from exact parent hints, canonical
  section ownership, and module references, with cycles and unreachable data gated.
