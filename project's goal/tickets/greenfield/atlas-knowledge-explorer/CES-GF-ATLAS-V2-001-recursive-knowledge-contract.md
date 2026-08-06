# CES-GF-ATLAS-V2-001 - Recursive Knowledge Contract

**Status:** Implemented
**Depends on:** HARD-027 golden qualification

## Outcome

Define the sole canonical v2 contract for a permanent Main Workflow and an
unbounded, cycle-free hierarchy of supporting knowledge graphs.

## Scope

- Stable project, concept, graph, node, edge, evidence, and revision identity.
- Module-only Main Workflow membership.
- Recursive parent/child links and breadcrumbs.
- Renderer-neutral graph descriptors and capabilities.
- Explicit availability, confidence, provenance, and review state.
- Revision-pinned PDF evidence descriptors containing document identity, page,
  exact text span, zero or more normalized page bounding boxes, language,
  extraction/OCR confidence, and coordinate availability.
- Schema validation for missing parents, broken links, cycles, and duplicate
  semantic identities.

## Acceptance

- [x] The golden fixture validates without renderer-specific fields.
- [x] A structurally different non-Safara fixture validates.
- [x] The contract accepts open registered graph-kind IDs, including every
  graph kind in the supporting-graphs context.
- [x] No fixed tabs, one-level detail limit, Mermaid source, React Flow shape, or
  ELK layout is part of semantic truth.
- [x] V1 model-review contracts are not extended to implement v2.
- [x] Evidence can represent several non-contiguous PDF regions without merging or
  rewriting their exact original text.
- [x] Missing coordinates are explicit and never replaced by guessed highlights.

Implemented by the independent `@company/ces-atlas-knowledge-contracts`
package. The package has no dependency on the quarantined v1 graph or
model-review contracts.
