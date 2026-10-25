# AAD-007: Review desktop Dashboard fidelity, theme, and accessibility

- **State:** proposed
- **Depends on:** [AAD-002](AAD-002-admin-shell-and-welcome-ui.md), [AAD-005](AAD-005-dashboard-route-authorization-tests.md)
- **Application:** `apps/atlas`
- **Primary source:** [dashboard brief, sections 4–5 and 8](../../Atlas-admin-dashboard.md); [dashboard standalone prototype](../../Atlas_Admin_Dashboard_Standalone.html)

## Outcome

Render and review the desktop Admin Dashboard against the supplied prototype
and the Atlas frontend baseline. This ticket owns desktop shell/welcome
fidelity and shared-theme accessibility only; compact drawer review is AAD-008.

## Scope

- Inspect authenticated desktop renders in light and dark themes, including
  long Admin names and 200% zoom or an equivalent constrained desktop width.
- Confirm theme selection continues to use the shared `ThemeProvider` and its
  existing `atlas-theme` persistence behavior; do not introduce a second
  preference mechanism while reviewing it.
- Review hierarchy, 64 px topbar, 224 px rail, bounded main width, welcome
  surface restraint, token reuse, type-role consistency, landmarks, labels,
  focus visibility, current-page state, disabled/coming-soon semantics, and
  contrast/non-color status cues.
- Apply the applicable desktop portions of the frontend review gate:
  VIS-001–009, VIS-011–015, plus the desktop composition portion of VIS-010.
- Record PASS, PASS WITH FINDINGS, or FAIL with viewport/theme evidence and
  exact commands. Correct only source-grounded desktop shell/welcome defects
  found within this ticket before its implementation checkpoint.

## Explicitly out of scope

- Compact menu/drawer opening, focus restoration, backdrop/Escape behavior,
  mobile reflow, or reduced-motion drawer transitions; AAD-008 owns them.
- New features or destinations, route/sign-in authority changes, broader
  application accessibility remediation, or visual redesign.

## Acceptance criteria

- Desktop views preserve the prototype's quiet, medium-density hierarchy:
  Administration context and the one welcome composition dominate while
  navigation and identity remain supporting context.
- Both themes use shared semantic tokens and retain readable contrast, visible
  focus, equivalent identity/selection/disabled meaning, and no prototype-only
  copy or sample identity.
- Long valid names and constrained desktop width remain understandable without
  clipping or horizontal overflow. The recorded review disposition is grounded
  in rendered evidence, not a successful build alone.

## Validation handoff

Record screenshot/viewport, theme, zoom, keyboard-focus, and semantic evidence
for independent review. Any compact observation is diagnostic only and must be
routed to AAD-008 rather than becoming a new desktop closure condition.
