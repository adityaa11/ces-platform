# ASI-003: Prove the Admin Sign-In UI stays local and isolated

- **State:** approved
- **Depends on:** [ASI-001](ASI-001-isolated-admin-sign-in-ui.md), [ASI-002](ASI-002-admin-sign-in-local-form-behavior.md)
- **Application:** `apps/atlas`
- **Primary source:** [implementation brief, sections 3 and 6–9](../../atlas-admin-sign-in-ui.md); [standalone interaction reference](../../atlas-admin-login-standalone.html)

## Outcome

Add focused automated evidence that `/admin/sign-in` remains a directly
renderable, local-only UI surface, uses Atlas's existing theme authority, and
does not alter public authentication or navigation behavior.

## Scope

- Add or extend the smallest applicable rendered-route and browser tests for
  the completed page; preserve ASI-002's focused component-local behavior
  tests instead of duplicating them.
- Verify direct GET rendering and refresh behavior for `/admin/sign-in`.
- Verify that the page exposes the required Admin Console identity and that
  the shared `atlas-theme` light/dark preference controls the route. Prove it
  does not use the standalone's `atlas-admin-login-theme` key.
- Verify local valid submission does not call either prohibited endpoint, does
  not navigate, does not establish an authentication session or cookie, and
  does not persist or log a password. The existing `atlas-theme` preference
  cookie remains permitted only when the operator changes theme.
- Verify the existing public sign-in/sign-up and landing/home presentation
  does not acquire Admin Console navigation, registration copy, or an altered
  ordinary sign-in submission path.

## Explicitly out of scope

- Visual-calibration, full keyboard/a11y matrix, screenshot comparison, and
  responsive review; those belong to ASI-004.
- Testing real login, roles, authorization, dashboard access, provider
  management, mock authentication, fake credentials, or backend endpoints.
- Reworking ASI-001's visual frame or ASI-002's local behavior while adding
  tests, except for a narrow defect fix required to make an acceptance
  assertion true.

## Acceptance criteria

- A direct response for `/admin/sign-in` contains the Admin Console page and
  does not redirect to a public page or protected Admin destination; a refresh
  keeps that result.
- Tests demonstrate no call to `/api/auth/sign-in/email` or
  `/api/admin/identity` while changing theme or completing any local form
  behavior. No session or authentication cookie is created by the form; the
  existing `atlas-theme` preference cookie is the sole allowed persistence
  caused by a theme action.
- Existing `atlas-theme` behavior, rather than `atlas-admin-login-theme`,
  controls persisted light and dark presentation for the route.
- Existing public sign-in/sign-up route tests remain green and find no Admin
  Console navigation or changed ordinary authentication behavior.
- Run the directly affected app lint/typecheck/build validations and the
  focused tests supported by the repository. Report unrelated pre-existing
  failures separately; do not repair unrelated modules to make this ticket
  pass.

## Validation handoff

Record direct-route/refresh evidence, the theme-persistence assertion,
prohibited-side-effect evidence, public-route regression evidence, commands,
and results for [ASI-004](ASI-004-admin-sign-in-visual-accessibility-review.md).
