# CES-GF-ATLAS-UI-003 — Focused Workflow Tabs and Source Workspace

**Stage:** Atlas workflow review UI
**Status:** Planned

## Objective

Let reviewers inspect each selected workflow through focused backend-owned
views while keeping exact source evidence visible beside it.

## Dependencies

- ATLAS-HARD-025, ATLAS-UI-001, and ATLAS-UI-002.

## Work

- Add workflow-detail tabs:
  - Flow;
  - Rules;
  - Validations;
  - Permissions;
  - States;
  - Evidence;
  - Approval.
- Hide a tab only when the backend projection explicitly reports it empty.
- Load workflow-specific slices instead of downloading the complete semantic
  inventory.
- In the source workspace:
  - show the source-document list;
  - open the selected document and page;
  - show the exact original-language statement;
  - highlight the exact source unit and text span;
  - show bounding boxes when available;
  - label translations and canonical wording as interpretation aids.
- Keep traceability visible through document, source unit, atomic claim,
  canonical record, workflow, and operation.
- Synchronize graph, tab item, and source selections without frontend semantic
  inference.

## Acceptance criteria

- [ ] Every non-empty focused projection has a corresponding tab.
- [ ] Selecting a node, edge, rule, validation, permission, or state opens its
      exact evidence.
- [ ] Original wording is visually distinct from translations and canonical
      wording.
- [ ] Page, section, source-unit identity, and text span are displayed.
- [ ] Bounding boxes are shown when projection data provides them.
- [ ] One workflow can load without downloading every project record.
- [ ] Missing evidence is shown as an approval exception, not silently hidden.
- [ ] Cross-tab and source synchronization is tested.

## Out of scope

Human decisions and approval materialization are completed by ATLAS-UI-004.
