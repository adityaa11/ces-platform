# CES-GF-ATLAS-UI-002 — Persistent Project Overview and Model Detail

**Stage:** Atlas model review UI
**Status:** In progress — persistent overview implemented; enriched artifact-backed detail remains

## Objective

Keep the integrated project graph visible while opening the selected supported
model projection or concept detail below it, so reviewers retain whole-project
and cross-model context.

## Dependencies

- ATLAS-UI-000 and ATLAS-UI-001.

## Work

- Render the integrated semantic graph at the top of the center workspace.
- Keep the overview deliberately bounded. It may contain major workflow,
  shared-data, context-provider, significant decision/state, and cross-model
  bridge nodes, but not every detailed node from every projection.
- Add eligible model tabs: Integrated, Activity Flow, Workflow, BPMN Candidate,
  Functions, Dependencies, States, Decisions, Actor Goals, Sequence, and
  Conceptual Data. Their availability and review-only state come from backend
  support status.
- Load only the integrated summary initially. Fetch partitioned semantic layers
  and model detail progressively from the backend-owned index.
- Selecting a model, workflow, or concept in the left panel must:
  - keep the integrated graph mounted and visible;
  - highlight the selected canonical concept and relevant relationships;
  - open the selected model projection or concept detail below the integrated
    graph;
  - preserve the right-side source workspace.
- Synchronize projections through canonical concept IDs. A concept may appear
  in several model views, but selection must treat those appearances as one
  semantic identity rather than duplicate concepts.
- Keep a supported model separate when no evidence-backed canonical bridge
  exists. Do not fabricate edges to force every projection into one connected
  component.
- Use only backend overview eligibility, priority, role, inclusion reason, and
  default visibility metadata to construct the initial overview.
- Enforce backend-published initial node/edge/payload budgets and display
  truncation plus progressively available layers without silently dropping
  content.
- Pin ELK engine/profile/options metadata and canonical input ordering for
  reproducible layout.
- Add minimize and restore controls for the project overview.
- In minimized form, show a compact project summary and selected workflow/path.
- Add minimize, restore, and close controls for selected workflow detail.
- Keep selection, zoom, pan, and minimization state stable while inspecting
  evidence.
- Render proposed edges differently from approved edges; pending edges must not
  look authoritative.
- Provide a non-visual, ordered graph summary for accessibility.

## Enriched lower-detail amendment

The existing metadata-only selected-detail card is not sufficient. Selecting
an overview node must enrich the lower panel from Atlas artifacts that already
exist; it must not replace, resize away, or semantically modify the persistent
project overview.

The production detail adapter and revision-pinned Next.js Route Handler must
resolve the selected canonical ID through:

- `proposed-workflow-index.json` and the indexed `flow.json` for workflow
  operations and governed internal edges;
- `proposed-workflow-detail-graphs.json` as the deterministic workflow-detail
  compatibility source during migration;
- `proposed-rules-controls-index.json` and its workflow-specific slices;
- the project-overview workspace for incoming and outgoing project-level
  relationships;
- `proposed-model-projection-index.json` and eligible model artifacts for
  supported top-level model selections;
- the governed evidence endpoint for selected node, edge, operation, and tab
  content.

The detail heading must reflect the selected semantic role. A workflow opens
workflow detail, a context provider opens context-provider detail, shared data
opens consumer detail, and decisions or states open their corresponding
detail. The UI must not label every selection as “Selected model detail.”

When operations exist without a governed internal edge, render the operations
as separate nodes and explicitly state that no source-grounded ordering is
established. Never add an arrow based on array order, wording, page order, or
visual convenience.

## Required interaction

```text
Click supported model or concept in left navigation
-> integrated project graph remains visible
-> the shared canonical concept is highlighted
-> selected model projection or concept detail opens below
-> selecting a node or edge updates the source workspace
```

## Prototype-validated behavior

- [x] Selecting any supported model never replaces or unmounts the integrated
      project graph.
- [x] Selected model projection or concept detail appears below the integrated
      graph.
- [x] The overview can be minimized and restored without losing selection.
- [x] The detail can be minimized, restored, and closed.
- [x] Shared canonical selection remains synchronized across the integrated
      graph and every applicable model projection.
- [x] Initial rendering does not download the complete integrated semantic
      graph; layer expansion is progressive and revision-pinned.
- [x] Proposed, pending, approved, and rejected relationships cannot be
      visually confused.
- [x] The frontend does not infer overview or detail edges.
- [x] Interaction tests cover selection, minimize, restore, close, and source
      synchronization.

## Production acceptance

- [ ] The integrated overview and every focused model projection are rendered
      with React Flow from backend nodes/edges and positioned with ELK.js only.
- [ ] A shared canonical ID highlights across overview, workflow, decision,
      state, actor-goal, dependency, sequence, and conceptual-data projections
      wherever that ID is genuinely present.
- [ ] A high-detail multi-model fixture proves the overview stays readable and
      does not collapse into an all-nodes mega-graph.
- [x] Projection constructs are selectable but never highlighted as canonical
      concepts unless the backend supplies a separate canonical identity.
- [ ] Selecting any governed node or edge opens its exact evidence and
      governance details.
- [ ] Selecting an overview workflow/context/data/decision/state node loads a
      revision-pinned enriched detail payload beneath the still-mounted
      overview.
- [ ] The lower panel shows backend operations, governed internal edges,
      incoming/outgoing overview relationships, semantic role, review state,
      and available focused slices.
- [ ] A workflow with operations but zero internal edges renders honest
      unconnected operations plus an explicit “ordering not established”
      state; UI-invented edges equal zero.
- [ ] Detail titles and controls reflect the backend semantic role rather than
      calling every selected concept a model.
- [ ] Detail loading, stale, unavailable, explicitly empty, and partial states
      are distinct and tested.
- [ ] Selecting, minimizing, restoring, or closing detail does not remount or
      lose zoom/selection state in the main overview.

## Out of scope

Rules, controls, source evidence, and approval tabs are completed by
ATLAS-UI-003 and ATLAS-UI-004.

## Implementation evidence

- The production center pane now renders UI-000 projection-local node/edge
  identities with React Flow and uses the pinned backend direction and input
  ordering as deterministic ELK layout inputs; no topology is inferred.
- The integrated overview remains mounted when a navigation item is selected.
  Selection opens a separate detail panel below it, synchronizes by canonical
  identity, and updates evidence references on the right.
- Overview and detail minimize/restore controls preserve selection; detail can
  also be closed. Projection-only constructs remain selectable without gaining
  a canonical highlight.
- Pending edges are animated/dashed and approved edges are visually solid;
  an ordered non-visual graph summary remains available.
- Production typecheck/build passes and nine focused boundary/interaction
  tests pass.

- The integrated `#project-overview` remains mounted while indexed model or
  workflow detail loads into `#selected-detail` beneath it.
- Detail index requests are revision-pinned with `If-Match` and fail closed on
  missing, stale, or mismatched responses.
- A state-preserving controller owns selection plus overview/detail minimize,
  restore, and close behavior.
- Relationship status is supplied by the backend contract and has distinct
  proposed, pending, approved, and rejected presentation; rejected detail
  edges are not rendered as graph truth.
- Seven UI foundation/interaction tests pass and application typecheck passes.
