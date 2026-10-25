# ASI-002: Prove the Admin Sign-In UI stays local and isolated

- **State:** proposed
- **Depends on:** [ASI-001](ASI-001-isolated-admin-sign-in-ui.md)
- **Application:** `apps/atlas`
- **Primary source:** [implementation brief, sections 3 and 6–9](../../atlas-admin-sign-in-ui.md); [standalone interaction reference](../../atlas-admin-login-standalone.html)

## Outcome

Add focused automated coverage demonstrating that `/admin/sign-in` is a
directly renderable, local-only UI surface that shares Atlas theme behavior and
does not alter public authentication or navigation behavior.

## Scope

- Add or extend the smallest applicable rendered-route, component, and browser
  tests for the new page.
- Verify direct GET rendering and refresh behavior for `/admin/sign-in`.
- Verify the screen's required accessible labels, Admin Console identity,
  local validation, password toggle, theme controls, and UI-only result.
- Verify submission has no authentication side effect: no fetch/XHR to either
  prohibited endpoint, no navigation, no session/cookie creation, and no
  password persistence or logging behavior.
- Verify no ordinary public page acquires Admin Console navigation or public
  registration copy from this work.
- Verify the existing Atlas light/dark preference continues to control the
  Admin UI through the shared provider/persistence mechanism.

## Explicitly out of scope

- Testing real login, roles, authorization, dashboard access, or provider
  management.
- Adding mock auth, fake credentials, test-only admin sessions, or backend
  endpoints merely to test this presentation page.
- Broad rewrites of unrelated auth tests.

## Acceptance criteria

- A direct response for `/admin/sign-in` contains the Admin Console page and
  does not redirect to a public page or protected Admin destination.
- Tests demonstrate no call to `/api/auth/sign-in/email` or
  `/api/admin/identity` while validating, toggling password visibility,
  switching theme, or submitting locally valid fields.
- Empty email/password and malformed email expose the expected textual,
  associated errors; valid local values expose only the UI-only information
  message and keep the operator on `/admin/sign-in`.
- Theme actions use the existing `atlas-theme` behavior, not
  `atlas-admin-login-theme`; persisted light and dark selections render
  consistently for the route.
- Existing public sign-in/sign-up route tests remain green and do not identify
  Admin Console navigation or altered submission behavior.

## Validation

- Run the directly affected app lint/typecheck/build validations supported by
  the repository.
- Run the focused new tests and affected existing auth/theme rendered tests.
- Report unrelated pre-existing failures separately without changing unrelated
  modules to make the phase pass.
