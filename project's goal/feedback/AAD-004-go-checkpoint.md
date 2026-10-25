# GO checkpoint: AAD-004 / Admin Dashboard Phase

- **Ticket:** `AAD-004`
- **Ticket authority:** `project's goal/atlas-ui/ticket/Admin_Dashboard_Phase/AAD-004-compact-admin-navigation.md`
- **Consumed predecessor:** AAD-002 `PASS`, recorded in `project's goal/feedback/AAD-002-60f6357-review.md`.
- **Implementation review target:** `HEAD` at this committed checkpoint
- **Ticket state:** `awaiting_review`

## Bounded implementation

Converted the accepted Admin shell's navigation into one presentation-only,
client-managed compact drawer at the prototype's 820 px breakpoint:

- The existing desktop 64 px topbar and 224 px rail remain unchanged above the
  breakpoint. At compact widths the rail becomes a fixed overlay drawer with a
  semantic-token backdrop; the main content switches to the existing single
  column with compact padding and no desktop minimum width.
- The native menu control opens the drawer and exposes its expanded state. The
  backdrop, Escape key, menu control, and current Dashboard destination close
  it. Opening sends focus to Dashboard; closing from dismissal paths restores
  it to the initiating menu control. A compact-only focus trap keeps keyboard
  interaction in the open drawer.
- Body scrolling is locked only while the drawer is open and is cleaned up on
  every close, viewport transition, and component unmount path. Provider
  Profiles remains non-navigating and Projects/Settings remain native disabled
  controls.
- The compact state uses no storage, cookie, route, data, or identity state.
  It preserves `AdminThemeControls` and Atlas semantic tokens. Open, active,
  and unavailable states retain labels, `aria-expanded`, `aria-current`, or
  disabled/coming-soon text in addition to visual styling. Motion is disabled
  under `prefers-reduced-motion`.

The only implementation paths are `AdminShell`, its Admin-scoped CSS, and
focused source interaction tests. Server authorization, authorized identity,
theme persistence, public navigation, and desktop shell geometry are not
modified.

## Review Contract Closure

| Row | Ticket authority | Required proof | Evidence / validation | Status |
|---|---|---|---|---|
| `RC-AAD004-01` | Outcome; Scope bullet 1; Acceptance criterion 1 | Below 820 px, the desktop rail becomes a readable overlay drawer with a backdrop while the main composition stays one column without the desktop minimum width. | `apps/atlas/app/globals.css` compact media rule fixes the drawer beneath the topbar, constrains it to `min(17.5rem, calc(100vw - 3.375rem))`, and removes `.admin-shell`'s desktop minimum width; `tests/admin-dashboard-compact-navigation.test.mjs` checks the exact compact rule. | `PROVEN` |
| `RC-AAD004-02` | Scope bullets 1–2; Acceptance criterion 2 | Menu, backdrop, Escape, and current Dashboard selection close the drawer; focus and body scrolling are restored; keyboard operation remains contained while open. | `apps/atlas/components/admin/AdminShell.tsx` owns the menu ref, drawer state, focus transfer/trap, Escape listener, all dismissal handlers, and `admin-navigation-locked` cleanup. `tests/admin-dashboard-compact-navigation.test.mjs` proves those interaction hooks are present; focused suite passes. | `PROVEN` |
| `RC-AAD004-03` | Scope bullets 3–5; Acceptance criterion 3 | Keyboard users can identify and operate the drawer in both themes, while selected/open/unavailable states are not color-only. | Native labeled menu/backdrop controls, `aria-expanded`, `aria-controls`, `aria-hidden`/`inert` when compact-closed, `aria-current`, `aria-disabled`, native disabled destinations, and existing shared semantic-token theme controls are in `AdminShell.tsx` / `globals.css`; existing dashboard UI assertions and compact focused assertions pass. | `PROVEN` |
| `RC-AAD004-04` | Scope bullets 3–5; Acceptance criterion 4; explicitly out of scope | Drawer motion respects reduced-motion and introduces no local persistence, router, or identity authority. | `@media (prefers-reduced-motion: reduce)` removes drawer transitions; focused source check rejects local storage, theme persistence, and hard-coded theme colors in the compact CSS. Bounded diff contains no route, guard, identity, or theme-provider change. | `PROVEN` |
| `RC-AAD004-05` | Validation handoff | Focused coverage records open/close, backdrop, Escape, focus restoration, current-page close, body-lock cleanup, disabled destinations, reduced motion, and the compact rendered-layout rule for AAD-008. | `apps/atlas/tests/admin-dashboard-compact-navigation.test.mjs` covers the required interaction and CSS observations. The recorded compact rule is `@media (max-width: 820px)` with a fixed overlay rail and `min-width: 0` shell. | `PROVEN` |

Validation commands and outcomes:

```text
corepack pnpm --filter @atlas/app exec node --test tests/admin-dashboard-route.test.mjs tests/admin-dashboard-route-level.test.mjs tests/admin-dashboard-ui.test.mjs tests/admin-dashboard-compact-navigation.test.mjs
# PASS: 9 tests, 0 failures

corepack pnpm --filter @atlas/app exec eslint components/admin/AdminShell.tsx tests/admin-dashboard-ui.test.mjs tests/admin-dashboard-compact-navigation.test.mjs
# PASS

corepack pnpm --filter @atlas/app build
# PASS: production route inventory includes /admin/dashboard

git diff --check -- apps/atlas/components/admin/AdminShell.tsx apps/atlas/app/globals.css apps/atlas/tests/admin-dashboard-ui.test.mjs apps/atlas/tests/admin-dashboard-compact-navigation.test.mjs "project's goal/atlas-ui/ticket/Admin_Dashboard_Phase/AAD-004-compact-admin-navigation.md" "project's goal/feedback/AAD-004-go-checkpoint.md"
# PASS
```

## Frontend inspection note

The available local browser inspection endpoint at
`http://localhost:3001/admin/dashboard` did not respond in this workspace, and
the dashboard route correctly requires an authenticated Admin session. No
visual result is claimed from that unavailable surface. AAD-008 remains the
ticket-owned rendered compact navigation and accessibility review lane; the
820 px layout rule above is its implementation handoff.

Internal readiness: READY_FOR_CK
