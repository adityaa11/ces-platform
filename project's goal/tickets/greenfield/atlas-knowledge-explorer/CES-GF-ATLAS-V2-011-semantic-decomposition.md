# CES-GF-ATLAS-V2-011 - Semantic Decomposition

**Status:** In Progress — V2-011A through V2-011F complete; V2-011G live generic qualification remains
**Depends on:** ATLAS-V2-010F
**Priority:** Blocking

## Outcome

Turn Atlas from a shallow module-and-graph browser into an evidence-grounded
semantic debugger. Given a selected module, Atlas exhaustively inspects its
relevant PRD evidence, decomposes it into source-supported semantic concepts
and relationships, constructs a recursive semantic model, and only then
generates applicable graph representations.

## Required architecture

```text
PDF evidence -> semantic extraction -> business capability detection
             -> semantic decomposition -> engineering intent detection
             -> relationship extraction -> recursive semantic model
                                            |-> graph selection -> graph projections
                                            `-> CES Standards consumers
```

The semantic hierarchy and graph representations are separate. A module owns
semantic concepts; a semantic subject exposes zero or more graph views. Graph
types must never be used as substitutes for semantic children.
CES Standards may consume the same semantic model but must not alter source
truth, manufacture Atlas concepts, or become a prerequisite for viewing Atlas.

## Invariants

- Exhaustive with respect to evidence, never creative beyond evidence.
- Original labels and evidence preserve the document language exactly.
- Standardized relationship descriptions may use English.
- Main Workflow remains a high-level project view and permanently visible.
- Nested concepts and breadcrumbs are backend-owned and recursively navigable.
- Every concept, relationship, and graph element traces to exact source units.
- Documentation headings help locate evidence but do not define semantic truth.
- Unsupported representations are absent, not emitted as empty fixed tabs.
- Extraction and qualification remain generic; Safara is never production logic.

## Expected UI result

The existing Explore / Main Workflow / PDF Evidence layout remains. Selecting a
module opens below Main Workflow: source coverage, module overview, evidenced
nested concepts, available representations, the selected graph, and synchronized
PDF evidence. Selecting a nested concept extends the breadcrumb and repeats the
same detail model recursively.

## Delivery sequence

Execute V2-011A through V2-011G in order. No compatibility semantic model,
workflow-only shortcut, or renderer-owned hierarchy may be introduced.
