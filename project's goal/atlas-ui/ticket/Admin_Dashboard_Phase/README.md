# Atlas Admin Dashboard Phase

- **State:** proposed
- **Target branch:** `codex/new-atlas-backend`
- **Application:** `apps/atlas`
- **Route:** `/admin/dashboard`
- **Predecessor:** AA-006 Admin authentication and persisted Super Admin authority

## Source authority

This ticket set is grounded only in the supplied dashboard artifacts:

1. [Dashboard implementation brief](../../Atlas-admin-dashboard.md) — route
   authority, scope, non-goals, validation, and completion boundary.
2. [Dashboard standalone prototype](../../Atlas_Admin_Dashboard_Standalone.html)
   — approved shell geometry, content composition, responsive transformation,
   and interaction reference.

The brief governs security, behavior, scope, and acceptance. The prototype
governs visual composition only. Existing accepted application authorities
remain authoritative for authentication, identity, theme, routing, and worker
resource cleanup.

## Delivery order

| Ticket | Outcome | Depends on |
| --- | --- | --- |
| [AAD-001](AAD-001-protected-dashboard-route.md) | Server-authorized protected dashboard route | AA-006 |
| [AAD-002](AAD-002-admin-shell-and-welcome-ui.md) | Reusable desktop Admin shell and authorized welcome composition | AAD-001 |
| [AAD-003](AAD-003-verified-sign-in-dashboard-handoff.md) | Redirect only after verified Admin identity | AAD-001 |
| [AAD-004](AAD-004-compact-admin-navigation.md) | Focus-managed compact drawer for the accepted Admin shell | AAD-002 |
| [AAD-005](AAD-005-dashboard-route-authorization-tests.md) | Focused route authorization and protected-render evidence | AAD-001, AAD-002 |
| [AAD-006](AAD-006-verified-sign-in-navigation-tests.md) | Focused verified-sign-in redirect and public-auth regression evidence | AAD-003 |
| [AAD-007](AAD-007-desktop-dashboard-visual-accessibility-review.md) | Desktop visual, theme, and accessibility review | AAD-002, AAD-005 |
| [AAD-008](AAD-008-compact-navigation-visual-accessibility-review.md) | Compact-navigation visual and accessibility review | AAD-004, AAD-005 |

AAD-002 and AAD-003 may proceed in parallel once AAD-001 provides the route
contract. AAD-004 and AAD-005 may proceed after AAD-002; AAD-006 may proceed
after AAD-003. AAD-007 and AAD-008 are separate final review lanes: neither
may widen its remediation into the other's desktop or compact interaction
contract.

## Workflow sizing and preservation

Each ticket has one implementation or evidence concern so its Review Contract
can be frozen, reviewed, and—if necessary—remediated in one bounded
`GO -> CK -> CFC -> CK` path. HMN remains the explicit human/planning escape
hatch only after that bounded path stops; it is not a delivery stage to bundle
into a ticket.

| Original concern | Preserved by |
| --- | --- |
| AAD-002 desktop shell, authorized identity, shared themes, and welcome surface | AAD-002, then desktop evidence in AAD-007 |
| AAD-002 responsive drawer, focus, backdrop, Escape, body lock, and reduced motion | AAD-004, then compact evidence in AAD-008 |
| AAD-004 direct-route authorization, denied paths, protected-render absence, identity, and no data fetch | AAD-005 |
| AAD-004 verified sign-in redirect, non-navigation failures, duplicate submission, and public-auth regression | AAD-006 |
| AAD-005 desktop/theme/long-name review | AAD-007 |
| AAD-005 compact drawer, keyboard, focus, motion, and narrow-width review | AAD-008 |

No acceptance requirement was removed. The split only assigns each requirement
to the smallest component, interaction, or evidence seam that can be reviewed
and corrected without reopening unrelated work.

## Shared implementation contract

### Security and identity

- The dashboard page, not a client fetch or middleware-only check, must call
  `createAtlasAdminGuard()` with `createPersistedAdminAuthorizationReader()`.
- Resolve the request headers and Better Auth session server-side before
  rendering any Admin shell or identity-derived content. A missing, expired,
  or revoked session redirects to `/admin/sign-in`; a valid but unauthorized
  session remains denied server-side with the framework-supported forbidden
  response.
- Use `AtlasAdminIdentity.name` from the authorized guard result for every
  instance of the Admin name and for avatar initials. Never source it from a
  submitted email, browser storage, environment variable, or prototype value.
- Reuse `getAtlasAuthService()` and preserve the existing Worker-specific
  `service.close()` lifecycle in a `finally` block.

### Frontend contract

The Admin Console is a calm, precise, medium-density administrative workspace.
Its information pattern is a **minimal workspace welcome surface**, not a
metric dashboard or operational telemetry console. Context and identity are
quiet; the `Dashboard` heading and one welcome composition dominate.

- Reuse the shared Atlas semantic tokens and type roles from `globals.css`.
  Do not create a parallel Admin color, typography, or theme system.
- Use the existing `ThemeProvider` and `atlas-theme` preference. Prototype
  theme JavaScript and `localStorage` handling are reference-only.
- On desktop preserve the 64 px topbar, 224 px sidebar, and bounded main
  content area. On compact screens, transform the sidebar into a controlled
  drawer with a backdrop; do not squeeze the desktop rail into the viewport.
- Keep the welcome surface bounded and readable. Long Admin names must wrap
  without clipping, while identity in the compact sidebar footer may truncate
  visually only if the complete name remains programmatically available.
- Use native controls and links where applicable. Drawer open/close, Escape,
  backdrop, focus-visible, current-page, disabled/coming-soon, and
  reduced-motion states are all part of the contract.

### Scope boundaries

- Do not create an Admin API, second authentication system, role source,
  session resolver, email allowlist, Admin registration path, provider page,
  BSS/runtime data, project counters, KPIs, charts, or mock operations data.
- Do not modify public `/sign-in`, `/sign-up`, `/home`, CLI bootstrap,
  provisioning, BSS, GHR, IDSER, or Semantic runtime work.
- Do not copy prototype-only content or behavior into production: `UI
  PROTOTYPE`, preview/sample identity, `Platform Admin · UI preview`, the
  prototype disclaimer, static hash navigation, or independent theme script.
- Scope new CSS to Admin Console components; do not broaden generic public
  selectors.

## Phase completion

The phase is ready for independent review only when the protected route,
reusable desktop shell and compact drawer, real authorized identity, verified
sign-in redirect, focused authorization and navigation evidence, production
build/lint results, and both rendered frontend review lanes have all been
recorded. A successful build alone is insufficient.
