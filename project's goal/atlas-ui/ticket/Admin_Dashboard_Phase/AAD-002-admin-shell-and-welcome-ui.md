# AAD-002: Build the desktop Admin shell and welcome workspace

- **State:** approved
- **Depends on:** [AAD-001](AAD-001-protected-dashboard-route.md)
- **Application:** `apps/atlas`
- **Primary source:** [dashboard brief, sections 4–5](../../Atlas-admin-dashboard.md); [standalone prototype](../../Atlas_Admin_Dashboard_Standalone.html)

## Outcome

Adapt the approved desktop standalone composition into reusable React
presentation components for a server-authorized Admin identity. Deliver the
first minimal Admin workspace without importing standalone scripts, static
identity, mock content, or a second theme authority. Compact navigation is a
separate AAD-004 concern.

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
- Add Admin-scoped CSS using existing semantic tokens and established type
  roles. Preserve both themes through the shared provider. Include the desktop
  focus-visible, hover, selected, and disabled states; AAD-004 owns the
  compact open/drawer and reduced-motion interaction states.

## Responsive and accessibility contract

- Desktop uses the persistent rail, topbar, and bounded content region. The
  exact compact transformation is deliberately deferred to AAD-004 rather
  than being improvised here.
- The content region must remain bounded rather than stretching sparse welcome
  content indefinitely. The welcome heading wraps with `overflow-wrap` or an
  equivalent policy for realistic long Admin names.
- Use semantic `header`, `aside`, `nav`, `main`, links/buttons, accessible
  names, `aria-current="page"`, and appropriate disabled semantics. The
  coming-soon destinations must not masquerade as live navigation.

## Explicitly out of scope

- New dashboard data, cards, KPIs, charts, provider capacity, BSS runtime
  information, project counters, or any secondary Admin page.
- Independent `localStorage`/cookie theme code, prototype DOM scripts,
  hard-coded light/dark colors, new UI framework, global selector broadening,
  or public-shell edits.
- Authentication/authorization changes, post-sign-in navigation changes,
  compact drawer state, menu/backdrop controls, body-scroll locking, or
  compact focus management.

## Acceptance criteria

- The authenticated Admin name and initials appear consistently in the
  welcome heading, header avatar, and sidebar footer from the one
  server-authorized identity input.
- The desktop composition matches the prototype's hierarchy, 64 px topbar,
  224 px rail, restrained welcome accent, surfaces, and information density;
  prototype labels/disclaimer/sample identity are absent.
- Changing theme calls the established `ThemeProvider`; both themes preserve
  equivalent desktop hierarchy, selection, focus, hover, and disabled states,
  and retain the provider's existing preference-persistence behavior.
- Long names remain reachable and understandable in the welcome surface; the
  shell is structured so AAD-004 can add a compact layout without duplicating
  identity or navigation markup.
- The shell is reusable without embedding a fake provider page or a second
  dashboard surface.

## Validation handoff

Record component boundaries, reused token/type roles, desktop width bounds,
and render assertions for the authorized identity, landmarks, live Dashboard
link, non-live destinations, and absence of prototype copy. Hand the compact
layout seam to AAD-004 and desktop review evidence to AAD-007.
