# CES-GF-ATLAS-UI-002 — Persistent Project Overview and Workflow Detail

**Stage:** Atlas workflow review UI
**Status:** Planned

## Objective

Keep the integrated project graph visible while opening the selected supported
model projection or concept detail below it, so reviewers retain whole-project
and cross-model context.

## Dependencies

- ATLAS-UI-001.

## Work

- Render the integrated semantic graph at the top of the center workspace.
- Add supported model tabs: Integrated, Workflow, Dependencies, States,
  Decisions, and Actors. Hide unsupported tabs according to backend data.
- Selecting a model, workflow, or concept in the left panel must:
  - keep the integrated graph mounted and visible;
  - highlight the selected canonical concept and relevant relationships;
  - open the selected model projection or concept detail below the integrated
    graph;
  - preserve the right-side source workspace.
- Add minimize and restore controls for the project overview.
- In minimized form, show a compact project summary and selected workflow/path.
- Add minimize, restore, and close controls for selected workflow detail.
- Keep selection, zoom, pan, and minimization state stable while inspecting
  evidence.
- Render proposed edges differently from approved edges; pending edges must not
  look authoritative.
- Provide a non-visual, ordered graph summary for accessibility.

## Required interaction

```text
Click supported model or concept in left navigation
-> integrated project graph remains visible
-> the shared canonical concept is highlighted
-> selected model projection or concept detail opens below
-> selecting a node or edge updates the source workspace
```

## Acceptance criteria

- [ ] Selecting any supported model never replaces or unmounts the integrated
      project graph.
- [ ] Selected model projection or concept detail appears below the integrated
      graph.
- [ ] The overview can be minimized and restored without losing selection.
- [ ] The detail can be minimized, restored, and closed.
- [ ] Shared canonical selection remains synchronized across the integrated
      graph and every applicable model projection.
- [ ] Proposed, pending, approved, and rejected relationships cannot be
      visually confused.
- [ ] The frontend does not infer overview or detail edges.
- [ ] Interaction tests cover selection, minimize, restore, close, and source
      synchronization.

## Out of scope

Rules, controls, source evidence, and approval tabs are completed by
ATLAS-UI-003 and ATLAS-UI-004.
