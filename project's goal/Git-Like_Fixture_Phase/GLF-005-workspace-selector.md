# GLF-005: Workspace selector

- **State:** planned
- **Review batch:** BATCH-21
- **Depends on:** GLF-003, GLF-004
- **Baseline:** Architecture Checkpoint sections 17, 22.5–22.6, 24; UI/UX Prototype PRD sections 5–6, 9.1, 9.4; Fixture Data-Intent Contract

## Outcome

Build a clear, accessible workspace selector from the GLF-003 branch data and
visually verify its selected-HEAD and PRD-lens separation.

## Scope

- Use fixture branch records as the selector's only options.
- Persist selected workspace/branch context alongside project and route state.
- Display workspace name, selected HEAD, and HEAD revision execution provenance
  as branch context, not as a document filter or approval control.
- Keep the PRD lens separate in purpose, state, and labeling.
- Reuse the existing visual system and verify responsive and accessible states.

## Acceptance criteria

- A user can select Master or the incremental workspace from fixture data.
- The selected workspace, HEAD, and execution provenance are visible and
  unambiguous.
- Switching workspace preserves project context and does not overwrite PRD-lens
  selection/mode.
- The control is keyboard operable with accessible name, visible focus, and a
  usable narrow-layout presentation.
- This ticket does not yet migrate all knowledge surfaces; GLF-006 does that.

## Validation

- Render Master and incremental selection at desktop, narrow, and mobile widths.
- Inspect hover, focus-visible, open, selected, and disabled states in supported themes.
- Verify route/shared-state behavior and PRD-lens independence with focused tests.
- Record visual validation and apply the frontend review gate before review.
