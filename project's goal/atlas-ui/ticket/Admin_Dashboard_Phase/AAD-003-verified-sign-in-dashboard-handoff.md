# AAD-003: Navigate to Dashboard only after verified Admin authorization

- **State:** awaiting_review
- **Depends on:** [AAD-001](AAD-001-protected-dashboard-route.md)
- **Application:** `apps/atlas`
- **Primary source:** [dashboard brief, section 6](../../Atlas-admin-dashboard.md)

## Outcome

Extend the accepted AA-006 Admin sign-in success path so an already verified
Admin identity replaces `/admin/sign-in` with `/admin/dashboard`. The
Dashboard remains independently protected by AAD-001.

## Scope

- Modify `apps/atlas/components/AdminSignIn.tsx` using the repository's
  existing `next/navigation` router convention.
- Retain `createAdminSignInSubmission()` as the authority for the ordered
  `POST /api/auth/sign-in/email` then `GET /api/admin/identity` flow, including
  duplicate-submission coalescing, generic feedback, and best-effort sign-out
  after identity `403`.
- When and only when `submit()` returns `{ kind: "authorized" }`, call
  `router.replace("/admin/dashboard")`. Do not render or preserve a misleading
  local success state in place of navigation.
- Preserve the existing loading control state until the verified result is
  known. Failed validation, sign-in failure, 401, 403, malformed identity,
  and network/server failure stay on the Admin sign-in page with the accepted
  non-sensitive feedback.

## Explicitly out of scope

- Changes to Better Auth, `/api/auth/sign-in/email`, `/api/admin/identity`,
  Admin role/bootstrap data, session cookie policy, or sign-out endpoint.
- Client-side Dashboard authorization, passing identity in router state,
  query strings, local/session storage, or any navigation for ordinary users.
- Public sign-in behavior or navigation, sign-up behavior, shell/UI redesign,
  or additional Admin destinations.

## Acceptance criteria

- The sequence is exactly: credentials submitted; Better Auth session result;
  Admin identity verification; verified `role: "admin"` identity; then
  `router.replace("/admin/dashboard")`.
- Only the authorized result initiates navigation. All denied, malformed, and
  error outcomes remain on `/admin/sign-in`; the existing identity-403
  sign-out cleanup is retained.
- Duplicate submission cannot produce competing requests or more than one
  navigation attempt.
- The target route independently repeats server authorization; direct
  navigation never relies on this client flow.
- No credentials or Admin identity are persisted/logged beyond the existing
  secure session mechanism.

## Validation handoff

Update the old sign-in expectation that deliberately remained on
`/admin/sign-in`. Supply AAD-006 with evidence for success redirect, failed
verification non-navigation, and duplicate-submission behavior.
