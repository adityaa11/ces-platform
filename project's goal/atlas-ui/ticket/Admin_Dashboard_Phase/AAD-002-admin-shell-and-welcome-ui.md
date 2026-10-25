# AAD-002: Build the reusable Admin shell and welcome workspace

- **State:** proposed
- **Depends on:** [AAD-001](AAD-001-protected-dashboard-route.md)
- **Application:** `apps/atlas`
- **Primary source:** [dashboard brief, sections 4–5](../../Atlas-admin-dashboard.md); [standalone prototype](../../Atlas_Admin_Dashboard_Standalone.html)

## Outcome

Adapt the approved standalone composition into reusable React presentation
components for a server-authorized Admin identity. Deliver the first minimal
Admin workspace without importing standalone scripts, static identity, mock
content, or a second theme authority.

## Scope

- Add a reusable, Admin-scoped shell and welcome component, following local
  naming conventions (for example `components/admin/AdminShell.tsx` and
  `components/admin/DashboardWelcome.tsx`). Receive authorized identity as
  typed data; do not fetch it in the client.
- Reproduce the approved desktop shell: 64 px topbar; 224 px left rail;
  Atlas mark and Administration/Dashboard breadcrumb; shared light/dark
  controls; header avatar; active Dashboard navigation; and the footer
  identity block showing `Platform Administrator`.
- Render only the approved sidebar shape: active Dashboard; visible,
  non-navigating `Provider Profiles` marked coming soon; disabled Projects
  and Settings. Dashboard is the sole implemented destination.
- Render the intentionally minimal main composition: `ATLAS /
  ADMINISTRATION`, `Dashboard`, `Atlas Admin Console`, and one welcome
  surface containing `ADMINISTRATION WORKSPACE`, `Welcome, [Admin Name].`,
  and `Welcome to the Atlas administration console.`
- Implement compact navigation as presentation-only client state. At the
  approved compact breakpoint, use a menu button, overlay drawer, dismissible
  backdrop, Escape close, and body-scroll lock. Closing must restore sensible
  focus to the menu button; opening must keep keyboard navigation usable.
- Add Admin-scoped CSS using existing semantic tokens and established type
  roles. Preserve both themes through the shared provider. Include
  focus-visible, hover, selected, disabled, open, and reduced-motion states.

## Responsive and accessibility contract

- Desktop uses the persistent rail; compact layouts use a drawer plus one
  main column. The transformation happens before controls or type are reduced
  below readable/usable sizes.
- The content region must remain bounded rather than stretching sparse welcome
  content indefinitely. The welcome heading wraps with `overflow-wrap` or an
  equivalent policy for realistic long Admin names.
- Use semantic `header`, `aside`, `nav`, `main`, links/buttons, accessible
  names, `aria-current="page"`, and appropriate disabled semantics. The
  coming-soon destinations must not masquerade as live navigation.
- The drawer's visible state must have a non-color cue, keyboard dismissal,
  visible focus, and a readable overlay in both themes. Honor
  `prefers-reduced-motion`.

## Explicitly out of scope

- New dashboard data, cards, KPIs, charts, provider capacity, BSS runtime
  information, project counters, or any secondary Admin page.
- Independent `localStorage`/cookie theme code, prototype DOM scripts,
  hard-coded light/dark colors, new UI framework, global selector broadening,
  or public-shell edits.
- Authentication/authorization changes and post-sign-in navigation changes.

## Acceptance criteria

- The authenticated Admin name and initials appear consistently in the
  welcome heading, header avatar, and sidebar footer from the one
  server-authorized identity input.
- Desktop and compact compositions match the prototype's hierarchy, shell
  proportions, restrained welcome accent, surfaces, and information density;
  prototype labels/disclaimer/sample identity are absent.
- Changing theme calls the established `ThemeProvider`; both themes preserve
  equivalent hierarchy, selection, focus, hover, disabled, and open-drawer
  states.
- At narrow widths there is no horizontal overflow, critical copy or control
  clipping, or inaccessible navigation. Long names remain reachable and
  understandable.
- The shell is reusable without embedding a fake provider page or a second
  dashboard surface.

## Validation handoff

Record component boundaries, token/type roles reused, desktop/compact layout
rules, and an initial list of visual/a11y states for AAD-004 and AAD-005.
