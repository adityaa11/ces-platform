# Atlas Admin Sign-In Phase

- **State:** proposed
- **Target application:** `apps/atlas`
- **Target route:** `/admin/sign-in`
- **Implementation boundary:** presentation-only Admin Console sign-in UI

## Source authority

This ticket set is source-grounded in the following supplied artifacts only:

1. [Implementation brief](../../atlas-admin-sign-in-ui.md) — route, scope, non-goals, validation, and completion boundary.
2. [Standalone prototype](../../atlas-admin-login-standalone.html) — approved structure, copy, interaction behavior, visual measurements, and responsive rules.
3. [Light desktop preview](../../atlas-admin-login-light-preview.png) — approved light-theme visual calibration.
4. [Dark mobile preview](../../atlas-admin-login-mobile-preview.png) — approved compact-screen visual calibration.

When the artifacts differ in role, use the implementation brief for product
scope and prohibitions, the standalone prototype for UI behavior and copy, and
the rendered previews for visual fidelity. Existing application code is an
integration constraint, not a replacement product specification.

## Phase outcome

An operator who enters `/admin/sign-in` sees an Atlas Admin Console login
surface that reproduces the approved prototype in light and dark themes and at
desktop and mobile widths. The page accepts local input, validates required
fields and email formatting, toggles password visibility, and displays a
non-success informational result after locally valid submission.

It never authenticates, creates a session, redirects, calls an API, exposes an
Admin entry point in public navigation, or creates any other Admin route.

## Ticket order

| Order | Ticket | Outcome |
| --- | --- | --- |
| 1 | [ASI-001](ASI-001-isolated-admin-sign-in-ui.md) | Directly renderable Admin route, approved visual frame, and shared-theme presentation. |
| 2 | [ASI-002](ASI-002-admin-sign-in-local-form-behavior.md) | Local form behavior only: validation, password visibility, and neutral informational result. |
| 3 | [ASI-003](ASI-003-admin-sign-in-ui-boundary-tests.md) | Automated route, theme-authority, and public-navigation isolation proof. |
| 4 | [ASI-004](ASI-004-admin-sign-in-visual-accessibility-review.md) | Rendered desktop/mobile and light/dark accessibility and fidelity review. |

## One-flow sizing decision

The original implementation ticket joined two independently reviewable
surfaces: the route's responsive visual frame and all client-side credential
form states. It also deferred its executable boundary evidence to a later
ticket. That made a single correction cycle ambiguous: a visual calibration
finding and a local-form behavior finding could both require changes to the
same large implementation scope.

ASI-001 and ASI-002 therefore divide the work at the only stable UI seam:
presentation/theme frame first, then local form behavior. ASI-003 is evidence
only and does not alter product behavior; ASI-004 is a final rendered quality
gate. The split preserves every requirement in the supplied sources, but gives
each ticket one implementation or review concern, a finite evidence set, and
a clear correction boundary.

## Frontend contract for this phase

This is a **State 2 / established-language** addition: reuse Atlas semantic
theme tokens, typography roles, ThemeProvider ownership, and calm operational
character. Do not derive a separate Admin design system.

| Concern | Contract |
| --- | --- |
| Product and user | Restricted, infrequent platform-administration entry surface for authorized operators. |
| Information pattern | A single bounded sign-in form: identity/context → task purpose → credentials → one primary action → quiet access boundary. |
| Visual hierarchy | Atlas/Admin Console identity first; `Welcome back.` and its explanation second; the form and one Sign in action dominate; access notices and footer remain quiet. |
| Density | Intentionally sparse. One form card is meaningful because it bounds the single authentication task; no nested cards or dashboard content. |
| Theme | Consume existing Atlas tokens and the existing ThemeProvider. Do not add an Admin-specific theme state, cookie, or localStorage key. The saved Atlas preference remains authoritative. |
| Typography | Reuse `--font-sans` and established semantic type roles. The prototype's kicker/overline, heading, body, field label, control, and footer copy remain distinct and readable; wrapping precedes shrinking. |
| Geometry and surfaces | Preserve the prototype's restrained 9 px control / 16 px card geometry, border-led grouping, and purposeful card shadow. The grid and concentric rings remain quiet supporting context, not primary content. |
| Responsive transformation | Desktop uses the full header context and footer metadata around a centered max-width form. At compact widths, hide the `Private access` indicator and right footer metadata, keep the theme controls, reduce shell/card padding, and preserve a one-column readable form without horizontal overflow. |
| Accessibility | Native labels and inputs; visible focus; keyboard-operable theme and password controls; explicit status and field-error announcements; non-color error communication; reduced-motion treatment. Target WCAG 2.2 AA. |

## Shared invariants

- Create only `apps/atlas/app/admin/sign-in/page.tsx` and tightly related
  Admin-specific presentation files. Do not create `/admin`, `/admin/dashboard`,
  or `/admin/providers`.
- Do not reuse the ordinary `AuthScreen` or `SignInForm` unchanged: those
  belong to public authentication and perform real authentication behavior.
- Do not broaden existing global selectors such as `.auth-page`, `.auth-card`,
  `.sign-in-form`, `.topbar`, or `.brand`. The standalone prototype uses
  generic class names; production adaptation must scope or prefix its Admin
  styles so public pages do not regress.
- Preserve the existing ThemeProvider and `atlas-theme` persistence behavior.
  The prototype's `atlas-admin-login-theme` key is preview-only and must not
  ship.
- The standalone's dark initial rendering is a visual reference, not authority
  to alter the application-wide initial-theme policy. A previously selected
  Atlas light/dark preference must render as selected; without one, retain the
  existing application behavior.
- No requests to `/api/auth/sign-in/email` or `/api/admin/identity`; no Better
  Auth client call, session lookup, cookie mutation, mock identity, credential
  logging, credential storage, or protected-route navigation.
- No public registration prompt, external identity provider controls, third
  party branding, remote assets, new CSS framework, or unrelated shell edits.

## Review gate

ASI-004 must record PASS, PASS WITH FINDINGS, or FAIL against the frontend
review dimensions: Atlas visual-language conformance, hierarchy, token and
surface discipline, typography, one-action hierarchy, interaction states,
responsive composition, accessibility, density, decoration purpose, and
light/dark theme parity. A successful build alone cannot close this phase.
