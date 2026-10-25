# AAD-005: Review Dashboard fidelity, responsive fit, and accessibility

- **State:** proposed
- **Depends on:** [AAD-002](AAD-002-admin-shell-and-welcome-ui.md), [AAD-003](AAD-003-verified-sign-in-dashboard-handoff.md), [AAD-004](AAD-004-dashboard-route-and-navigation-tests.md)
- **Application:** `apps/atlas`
- **Primary source:** [dashboard standalone prototype](../../Atlas_Admin_Dashboard_Standalone.html); [dashboard brief, sections 4–5 and 8](../../Atlas-admin-dashboard.md)

## Outcome

Render and review the completed Admin Dashboard against the supplied prototype
and the Atlas frontend quality baseline. Close the UI work only with a
recorded PASS, PASS WITH FINDINGS, or FAIL—not merely a passing build.

## Scope

- Inspect authenticated desktop and compact renders in light and dark themes.
  Include reciprocal theme/viewport combinations rather than assuming the
  prototype's starting dark state proves parity.
- Review page hierarchy, shell geometry, main-width behavior, welcome-surface
  restraint, token reuse, type-role consistency, long Admin names, narrow
  reflow, 200% zoom or equivalent constrained width, and horizontal overflow.
- Exercise menu default/open/close states, backdrop close, Escape close,
  focus movement/restoration, current-page navigation, coming-soon/disabled
  items, theme selection, visible focus, and reduced-motion behavior.
- Verify semantic landmarks, accessible names, current/disabled state,
  keyboard order, non-color cues, contrast, and the absence of prototype-only
  copy or unauthenticated content.

## Review criteria

| Gate | Pass condition |
| --- | --- |
| Hierarchy | Administration context is clear; `Dashboard` and the one welcome composition dominate; navigation and identity remain supporting context. |
| Visual language | Shared Atlas semantic tokens, type roles, geometry, and calm workspace density are preserved; no separate Admin design system appears. |
| Responsive composition | Desktop rail becomes a usable drawer on compact widths; the main content remains one readable column without squeezed rail, clipping, or horizontal scrolling. |
| Theme parity | Light/dark hierarchy, contrast, focus, selected/disabled/open states, and overlay meaning are equivalent and use shared theme authority. |
| Interaction/accessibility | Keyboard navigation, focus-visible, native semantics, accessible labels, current-page state, disabled semantics, escape/backdrop behavior, and reduced motion are correct. |
| Scope | There are no metrics, charts, mock data, provider page, prototype badges/disclaimer, static preview identity, or public navigation regression. |

## Explicitly out of scope

- New feature design or a visual redesign beyond source-grounded defect fixes.
- Authorization or navigation changes except a narrow correction required to
  satisfy an acceptance criterion.
- Broader application accessibility remediation outside this phase's Admin
  route and components.

## Acceptance criteria

- Rendered desktop and compact views preserve the prototype's layout intent:
  64 px topbar, 224 px desktop rail, bounded main content, quiet navigation,
  and a single restrained welcome surface.
- Both themes remain readable, semantically equivalent, and visibly focused;
  all valid names/copy stay reachable at narrow widths and constrained zoom.
- Mobile menu behavior is operable entirely by keyboard, respects reduced
  motion, and neither traps focus nor leaves the body locked after dismissal.
- The review records PASS, PASS WITH FINDINGS, or FAIL against the criteria;
  visual differences, commands, screenshots/viewport evidence, and remaining
  non-blocking findings are documented for independent review.
