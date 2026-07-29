# CES Atlas Workflow UI Ticket Plan

**Status:** Planned
**Authority:** [`CES_ATLAS_WORKFLOW_UI_CONTEXT.md`](../../../CES_ATLAS_WORKFLOW_UI_CONTEXT.md)
**Backend foundation:** ATLAS-HARD-021 through ATLAS-HARD-027.

This program owns the production human-review interface for the backend
integrated semantic graph and supported model projections. It does not own
model classification, workflow extraction, semantic
inference, canonical identity, approval eligibility, or approved-model
materialization.

## Delivery order

| Order | Ticket | Outcome | Depends on |
|---:|---|---|---|
| 1 | [ATLAS-UI-001](CES-GF-ATLAS-UI-001-workflow-review-workspace.md) | Domain-neutral three-pane review workspace | HARD-025–026 |
| 2 | [ATLAS-UI-002](CES-GF-ATLAS-UI-002-persistent-overview-workflow-detail.md) | Persistent main workflow with stacked selected detail | UI-001 |
| 3 | [ATLAS-UI-003](CES-GF-ATLAS-UI-003-focused-tabs-source-workspace.md) | Focused tabs and exact source evidence | HARD-025, UI-001–002 |
| 4 | [ATLAS-UI-004](CES-GF-ATLAS-UI-004-governed-workflow-approval-ui.md) | Governed review and immutable human decisions | HARD-026, UI-001–003 |
| 5 | [ATLAS-UI-005](CES-GF-ATLAS-UI-005-workflow-ui-qualification.md) | Integrated multi-model UI, accessibility, and cross-domain qualification | HARD-021–027, UI-001–004 |
| 6 | [ATLAS-REL-001](CES-GF-ATLAS-REL-001-integrated-atlas-release-gate.md) | Integrated backend and UI release qualification | HARD-015, UI-005 |

## Program rules

- The integrated project graph remains visible when a supported model or
  concept is selected.
- Selected model projection or concept detail opens below the integrated graph.
- The integrated and selected-detail panels support minimize and restore.
- The right source workspace remains synchronized with the selected UI item.
- The frontend renders backend-owned projections and never invents semantic
  membership, order, branches, states, or approval eligibility.
- Accepted same-meaning multilingual representations render as one governed
  semantic concept while all exact original document text remains available as
  evidence. Pending members remain separate and reviewable.
- Production headings, theme, navigation, and default content remain
  domain-neutral.
- Fixture-specific terminology may exist only in test data or user-selected
  runtime project content.
- Mermaid is an export projection, not the UI data source or canonical model.
- Activity-flow, workflow, BPMN-candidate, functional-decomposition,
  dependency, state, decision, actor-goal, sequence-interaction, and
  conceptual-data views are projections of shared canonical identities.
- Normal tabs require `supported`; partial and human-review results are visibly
  review-only; insufficient, conflicting, and not-applicable kinds do not
  produce normal diagram tabs.
- The integrated graph initially loads a bounded summary and progressively
  fetches partitioned semantic layers.
- Pending relationships remain visibly non-authoritative.
- Approved views load materialized approved projections.

## Final gate

ATLAS-HARD-015 independently qualifies the backend. ATLAS-UI-005 independently
qualifies the UI. ATLAS-REL-001 is the final integrated production release
gate and depends on both.
