# GLF-005: Workspace selector

- **State:** planned
- **Review batch:** BATCH-21
- **Depends on:** GLF-003, GLF-004-01
- **Baseline:** Architecture Checkpoint sections 17, 22.5–22.6, 24; UI/UX Prototype PRD sections 5–6, 9.1, 9.4; Fixture Data-Intent Contract

## Outcome

Build the clear, accessible workspace-switcher UI used by the Atlas shell.
The component receives a workspace view model and selection callback; it does
not own fixture data, routing, persistence, or branch truth.

## Scope

- Implement the sidebar trigger representing the current selected workspace,
  including its independent lifecycle-status metadata and concise recency.
- Implement the switcher overlay with its contextual header, search and filter
  controls, grouped workspace inventory, row metadata, audit-context footer,
  and close behavior, based on the approved calibrated reference.
- Treat the current selection as selection state, not as an `active workspace`
  lifecycle status. Published, Review, Draft, Processing, and similar labels
  remain separate semantic status metadata.
- Provide reusable row, status, and selection states from an injected view
  model. Do not create component-local workspace records or infer identity from
  display text.
- Keep the New workspace action boundary present but defer its modal and
  fixture handoff to GLF-005-02.
- Reuse the existing visual system and verify responsive, theme, and accessible
  states.

## Acceptance criteria

- The sidebar trigger and a selected row consistently represent the current
  selected workspace without conflating it with lifecycle status.
- The overlay presents a searchable/filterable, meaningfully grouped workspace
  inventory with visible status, PRD count, base-workspace, creator, and
  modified metadata.
- Rows expose selected, hover, focus-visible, disabled/unavailable, and status
  states without relying on color alone.
- The control is keyboard operable with accessible name, focus management,
  dismissal, and a usable narrow-layout presentation.
- The component accepts displayed HEAD and execution-provenance fields but does
  not resolve or persist them itself.
- This ticket does not wire golden fixtures, modify PRD-lens selection/mode,
  create workspaces, or migrate knowledge surfaces; GLF-005-01, GLF-005-02,
  and GLF-006 respectively own those concerns.

## Validation

- Render the reference-derived component at desktop, narrow, and mobile widths.
- Inspect hover, focus-visible, open, selected, unavailable, and status states
  in supported themes.
- Verify component accessibility and callback behavior with an injected
  workspace view model.
- Record visual validation and apply the frontend review gate before review.

## Decision log

- 11 September 2026: GLF-005 was split so the reusable visual component can
  be reviewed before golden-fixture wiring. The current selected workspace is
  represented as selection state; it is not an `active workspace` lifecycle
  category.
