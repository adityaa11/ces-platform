# CES-GF-ATLAS-V2-001 - Recursive Knowledge Contract

**Status:** Planned  
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

- The golden fixture validates without renderer-specific fields.
- A structurally different non-Safara fixture validates.
- The contract can represent every graph kind in the supporting-graphs context.
- No fixed tabs, one-level detail limit, Mermaid source, React Flow shape, or
  ELK layout is part of semantic truth.
- V1 model-review contracts are not extended to implement v2.
- Evidence can represent several non-contiguous PDF regions without merging or
  rewriting their exact original text.
- Missing coordinates are explicit and never replaced by guessed highlights.
