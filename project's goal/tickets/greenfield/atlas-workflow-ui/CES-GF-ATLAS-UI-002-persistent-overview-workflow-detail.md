# CES-GF-ATLAS-UI-002 — Persistent Project Overview and Workflow Detail

**Stage:** Atlas workflow review UI
**Status:** Planned

## Objective

Keep the main project workflow visible while opening the selected workflow
detail below it, so reviewers retain whole-project context.

## Dependencies

- ATLAS-UI-001.

## Work

- Render the project overview at the top of the center workspace.
- Selecting a workflow in the left panel must:
  - keep the project overview mounted and visible;
  - highlight the selected workflow and its relevant path in the overview;
  - open the selected workflow detail below the overview;
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
Click workflow in left navigation
-> main project workflow remains visible
-> selected workflow is highlighted in the main workflow
-> selected workflow detail opens below the main workflow
-> selecting a node or edge updates the source workspace
```

## Acceptance criteria

- [ ] Selecting a workflow never replaces or unmounts the project overview.
- [ ] Selected workflow detail appears below the overview.
- [ ] The overview can be minimized and restored without losing selection.
- [ ] The detail can be minimized, restored, and closed.
- [ ] Selected workflow and relevant overview path are visibly highlighted.
- [ ] Proposed, pending, approved, and rejected relationships cannot be
      visually confused.
- [ ] The frontend does not infer overview or detail edges.
- [ ] Interaction tests cover selection, minimize, restore, close, and source
      synchronization.

## Out of scope

Rules, controls, source evidence, and approval tabs are completed by
ATLAS-UI-003 and ATLAS-UI-004.
