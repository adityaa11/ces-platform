# Review: BATCH-12 - Unselected project navigation state

- Reviewed commit: `3ac11d3ca4e9da1c4eb6d4ceb5443544e3b03bb3`
- Ticket: `AUI-013`
- Baseline: [Atlas UI/UX Prototype PRD](../Atlas_UI_UX_Prototype_PRD.md) sections 2.1, 4.1, 7, 9.1, and 9.4; [AUI-012 reference sidebar composition](../atlas-ui/AUI-012-reference-sidebar-composition.md); [AUI-013 acceptance criteria and validation](../atlas-ui/AUI-013-unselected-project-navigation-state.md)
- Result: `PASS`
- Review round: 2 (remediation review)

## Findings

No Blocker or Important in-scope findings remain.

The prior F-001 navigation defect is resolved. At 1280px, selecting the ready project from both the project card and project switcher produces workspace links retaining `projectId=safara`; clicking Project Facts resolves to `/demo?projectId=safara&view=facts` and renders `Project Facts`. Direct PRD-lens routes also retain `projectId`, `prd`, and `lens` while changing only `view`.

## Validation

- `pnpm test` passed: fixture tests, production build, and application tests all passed.
- `pnpm lint` passed.
- Desktop `/demo` inspection confirmed `No project selected`, four visibly disabled non-navigable project rows, and restored navigation after both selection controls.
- Compact 531px inspection confirmed the drawer exposes the unselected state, all four disabled rows, profile control, and selected-project shell; Escape dismissal restored focus to the hamburger trigger.
- Existing uncommitted working-tree changes were not evaluated.

## Decision

BATCH-12 passes the review gate. AUI-013 now satisfies the unselected shell state, non-navigable project destinations, and ready-project restoration requirements without regressing existing route or PRD-lens context.
