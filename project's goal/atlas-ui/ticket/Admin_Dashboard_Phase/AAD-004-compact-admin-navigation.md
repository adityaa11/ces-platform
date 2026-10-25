# AAD-004: Add compact Admin navigation

- **State:** proposed
- **Depends on:** [AAD-002](AAD-002-admin-shell-and-welcome-ui.md)
- **Application:** `apps/atlas`
- **Primary source:** [dashboard brief, sections 4–5 and 8](../../Atlas-admin-dashboard.md); [standalone prototype](../../Atlas_Admin_Dashboard_Standalone.html)

## Outcome

Add one presentation-only compact-navigation controller to the accepted Admin
shell. Below the approved compact breakpoint, the persistent desktop rail
becomes an accessible, focus-managed drawer without changing route authority,
identity authority, theme authority, or the desktop composition.

## Scope

- Add the menu control, overlay drawer, backdrop, and narrowly scoped client
  state to the AAD-002 Admin shell, using the prototype's 820 px compact
  transformation as the visual reference.
- Open and close the drawer from the menu control, backdrop, Escape, and the
  current Dashboard link. Keep the Dashboard as the only active destination;
  Provider Profiles remains non-navigating and Projects/Settings remain
  disabled.
- On open, keep keyboard navigation usable; on close, restore focus to the
  menu control when that is the sensible initiating control. Lock body scroll
  only while the drawer is open and restore it on every close and unmount path.
- Use existing semantic tokens and the shared theme provider. Supply visible
  focus, non-color open/selected/disabled cues, and reduced-motion behavior.
- Preserve a one-column compact main composition, usable controls, and the
  AAD-002 long-name containment contract.

## Explicitly out of scope

- Server authorization, route handling, identity lookup, sign-in redirect,
  theme persistence implementation, or modifications to public navigation.
- Desktop shell geometry, additional Admin destinations, data, metrics,
  charts, Provider Profiles, or broad accessibility remediation outside this
  shell.

## Acceptance criteria

- At compact widths, the desktop rail is not squeezed into the viewport: the
  menu opens a readable overlay drawer with a backdrop and the main content
  remains one column without horizontal overflow.
- Menu, backdrop, Escape, and current-page selection close the drawer as
  applicable; body scrolling and focus are restored after dismissal.
- Keyboard users can reach, operate, and identify the menu and drawer in both
  themes. The drawer state and disabled/coming-soon items are not conveyed by
  color alone.
- `prefers-reduced-motion` disables non-essential drawer motion. The compact
  implementation has no independent local storage, cookie, router, or
  identity state.

## Validation handoff

Add focused interaction coverage for closed/open state, backdrop and Escape
dismissal, focus restoration, current-page close, body-lock cleanup, disabled
destinations, and reduced-motion class behavior. Record the compact width and
rendered layout rule for AAD-008; do not substitute broad route or sign-in
tests for these interaction observations.
