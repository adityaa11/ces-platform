# CES Atlas Workflow UI Ticket Plan

**Status:** Planned
**Authority:** [`CES_ATLAS_WORKFLOW_UI_CONTEXT.md`](../../../CES_ATLAS_WORKFLOW_UI_CONTEXT.md)
**Backend foundation:** ATLAS-HARD-021 through ATLAS-HARD-026.

This program owns the production human-review interface for backend-generated
Atlas workflow projections. It does not own workflow extraction, semantic
inference, canonical identity, approval eligibility, or approved-model
materialization.

## Delivery order

| Order | Ticket | Outcome | Depends on |
|---:|---|---|---|
| 1 | [ATLAS-UI-001](CES-GF-ATLAS-UI-001-workflow-review-workspace.md) | Domain-neutral three-pane review workspace | HARD-025–026 |
| 2 | [ATLAS-UI-002](CES-GF-ATLAS-UI-002-persistent-overview-workflow-detail.md) | Persistent main workflow with stacked selected detail | UI-001 |
| 3 | [ATLAS-UI-003](CES-GF-ATLAS-UI-003-focused-tabs-source-workspace.md) | Focused tabs and exact source evidence | HARD-025, UI-001–002 |
| 4 | [ATLAS-UI-004](CES-GF-ATLAS-UI-004-governed-workflow-approval-ui.md) | Governed review and immutable human decisions | HARD-026, UI-001–003 |
| 5 | [ATLAS-UI-005](CES-GF-ATLAS-UI-005-workflow-ui-qualification.md) | Production, accessibility, and cross-domain qualification | HARD-021–026, UI-001–004 |

## Program rules

- The main project workflow remains visible when a workflow is selected.
- Selected workflow detail opens below the main workflow.
- The main and selected workflow panels support minimize and restore.
- The right source workspace remains synchronized with the selected UI item.
- The frontend renders backend-owned projections and never invents semantic
  membership, order, branches, states, or approval eligibility.
- Production headings, theme, navigation, and default content remain
  domain-neutral.
- Fixture-specific terminology may exist only in test data or user-selected
  runtime project content.
- Mermaid is an export projection, not the UI data source or canonical model.
- Pending relationships remain visibly non-authoritative.
- Approved views load materialized approved projections.

## Final gate

ATLAS-UI-005 must pass before ATLAS-HARD-015 can close or the production
workflow approval UI can be accepted.

