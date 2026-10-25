# GO checkpoint: AAD-006

- **Ticket / batch:** `AAD-006` / `Admin Dashboard Phase`
- **Frozen ticket:** `project's goal/atlas-ui/ticket/Admin_Dashboard_Phase/AAD-006-verified-sign-in-navigation-tests.md`
- **State:** `awaiting_review`
- **Accepted predecessor:** AAD-003 `PASS` (`project's goal/feedback/AAD-003-786def0-review.md`)

## Bounded implementation

This checkpoint adds the focused navigation evidence AAD-003 handed off. The
existing Admin submission authority remains unchanged. `auth-boundary.test.mjs`
now executes the complete submission-result matrix: invalid credentials,
sign-in and identity network failures, identity `401`, `403` cleanup,
malformed identity, server failure, and duplicate coalescing. The browser
suite exercises the rendered form with intercepted established endpoints:
only a valid `{ kind: "authorized" }` identity causes one Dashboard navigation
request; every failed/denied/malformed outcome remains at `/admin/sign-in`;
the in-flight control is disabled and makes one request sequence; and public
sign-in/sign-up entry routes retain their existing destinations.

The existing real-credential browser check was updated to expect the Dashboard
replacement and protected Dashboard content after verified sign-in. It cannot
complete in the current local service because the configured test Admin
credentials receive the accepted generic sign-in failure before identity
verification. This is recorded as an environment limitation, not treated as
a product behavior failure; the focused submission and rendered-browser
interception evidence above prove the ticket's component/router contract
without changing bootstrap, credentials, session, or public-auth authority.

## Review Contract Closure

| Row | Ticket authority | Required proof | Evidence / validation | Status |
| --- | --- | --- | --- | --- |
| `RC-AAD006-01` | Outcome; Scope bullet 2; Acceptance criterion 1 | Credentials, Better Auth success, and valid `{ kind: "authorized" }` identity occur before exactly one `router.replace("/admin/dashboard")`. Better Auth success alone cannot navigate. | `AdminSignIn.tsx` retains the sole literal `router.replace` in its authorized branch; `auth-boundary.test.mjs` proves ordered POST then identity GET and result kinds. `tests/browser/admin-sign-in-navigation.spec.mjs` fulfills the ordered endpoints with a valid Admin identity and observes exactly one `/admin/dashboard` request. | `PROVEN` |
| `RC-AAD006-02` | Scope bullet 3; Acceptance criterion 2 | Invalid credentials, validation failure, identity `401`, identity `403` plus best-effort sign-out, malformed identity, network/server error, and duplicate submit remain on Admin sign-in with generic feedback. | `auth-boundary.test.mjs` executes every submission outcome, including `403` cleanup and promise coalescing. Browser cases assert invalid credentials, `401`, `403`, malformed identity, and `500` stay at `/admin/sign-in`; the rendered pending control is disabled and makes one POST/GET sequence. Existing local-form browser assertions retain client validation and focus behavior. | `PROVEN` |
| `RC-AAD006-03` | Scope bullet 4; Acceptance criterion 3 | Public `/sign-in`, `/sign-up`, and their existing navigation stay unchanged. | `tests/browser/admin-sign-in-navigation.spec.mjs` visits each public route, asserts its established heading and submit control, preserves its URL, and confirms no Admin entry link. `tests/auth-boundary.test.mjs` continues to prove public sign-in's `/home` navigation and public sign-up's established success navigation. | `PROVEN` |
| `RC-AAD006-04` | Validation handoff | Record router/submission locations, result matrix, public-auth regressions, commands, actual results, and any environment limitation. | This checkpoint names `AdminSignIn.tsx`, `admin-sign-in-submission.ts`, `tests/auth-boundary.test.mjs`, `tests/browser/admin-sign-in-navigation.spec.mjs`, and `tests/browser/admin-sign-in-local-form.spec.mjs`; commands and the real-credential limitation are recorded below. | `PROVEN` |

## Validation

```text
corepack pnpm --filter @atlas/app exec node --test tests/auth-boundary.test.mjs
# PASS: 10 tests, 0 failures

corepack pnpm --filter @atlas/app exec eslint tests/auth-boundary.test.mjs tests/browser/admin-sign-in-local-form.spec.mjs tests/browser/admin-sign-in-navigation.spec.mjs
# PASS

corepack pnpm --filter @atlas/app exec playwright test tests/browser/admin-sign-in-navigation.spec.mjs
# PASS: 4 tests, 0 failures

corepack pnpm --filter @atlas/app build
# PASS: production build; route inventory includes /admin/dashboard and /admin/sign-in

corepack pnpm --filter @atlas/app exec playwright test tests/browser/admin-sign-in-local-form.spec.mjs
# ENVIRONMENT LIMITATION: FAIL — configured local Admin credentials returned generic sign-in failure, so no verified session was available for this real-credential check.
```

No application authentication, identity endpoint, session, public-auth, or
Dashboard authorization code changed. The real-credential check is isolated
to the unavailable local accepted Admin session; all ticket-specific component,
submission, mocked-endpoint browser, public-auth regression, lint, and build
evidence is passing.

Internal readiness: READY_FOR_CK.
