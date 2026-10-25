# ASI-002: Complete local Admin Sign-In form behavior

- **State:** proposed
- **Depends on:** [ASI-001](ASI-001-isolated-admin-sign-in-ui.md)
- **Application:** `apps/atlas`
- **Primary source:** [implementation brief, sections 5–6 and 9](../../atlas-admin-sign-in-ui.md); [standalone interaction reference](../../atlas-admin-login-standalone.html)

## Outcome

Complete the Admin sign-in form's client-local behavior without changing its
visual frame, route boundary, theme authority, or any public/authentication
surface. A valid local submission communicates only the approved neutral
UI-only result; it never signs an operator in.

## Scope

- Add component-local state and handlers to the Admin-specific component
  established by ASI-001. Do not move this behavior into `AuthScreen`,
  `SignInForm`, shared authentication utilities, or a global provider.
- On submit, prevent the browser default and validate required email/password
  values plus email format. Render readable, associated text errors; set
  `aria-invalid`; and move focus to the first invalid field.
- Clear a field's own error while it is edited, and clear the local result on
  either field edit. Never store, log, serialize, or transmit either value.
- Implement password show/hide. Its accessible name, pressed state, icon, and
  input type must change together, then focus returns to the password input.
- Reveal the existing neutral informational result only after locally valid
  submission. Its copy must explicitly say that this is a UI-only prototype
  and that credentials were not sent or stored; it must not imply successful
  sign-in.
- Add the smallest focused behavior tests available in the app for empty,
  malformed, and valid local submissions; error clearing; password visibility;
  and the absence of request/navigation/authentication behavior.

## Explicitly out of scope

- Layout, typography, token, background, header/footer, or responsive
  redesign of ASI-001's approved visual frame.
- Changing the shared ThemeProvider or its `atlas-theme` persistence behavior.
- Any authentication transport, Better Auth call, session lookup or
  authentication-cookie mutation, role check, redirect, mock user, protected
  route, API endpoint, or password persistence. The pre-existing theme
  provider remains allowed to persist its `atlas-theme` preference.
- Broad test-suite or public-auth changes. Cross-route and theme-authority
  evidence belongs to ASI-003.

## Acceptance criteria

- Empty email/password and malformed email expose associated, non-color-only
  errors; valid local values expose only the neutral UI-only result and keep
  the operator on `/admin/sign-in`.
- The password visibility control remains keyboard operable and keeps its
  accessible state, icon, and input type synchronized.
- The only new client-side state is local to the Admin sign-in UI. No
  fetch/XHR, authentication helper, session/authentication-cookie mutation,
  credential log, credential storage, or navigation is introduced; the shared
  ThemeProvider's existing `atlas-theme` persistence is unchanged.
- Focus order and visible-focus treatment remain usable. The visual frame
  remains materially unchanged from ASI-001 except for its specified error,
  password-visible, and informational states.
- Focused tests prove these behaviors without real credentials, fake
  authentication, or a backend dependency.

## Validation handoff

Record the local states exercised, focused test command/results, and any
source-grounded deviation. Hand the completed local behavior to
[ASI-003](ASI-003-admin-sign-in-ui-boundary-tests.md) and
[ASI-004](ASI-004-admin-sign-in-visual-accessibility-review.md).
