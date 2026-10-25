# AAD-006: Prove verified Admin sign-in navigation

- **State:** approved
- **Depends on:** [AAD-003](AAD-003-verified-sign-in-dashboard-handoff.md)
- **Application:** `apps/atlas`
- **Primary source:** [dashboard brief, sections 6 and 8](../../Atlas-admin-dashboard.md)

## Outcome

Provide focused automated evidence that only the accepted Admin identity
verification result replaces `/admin/sign-in` with `/admin/dashboard`, while
all denied and failure outcomes preserve the existing sign-in behavior.

## Scope

- Extend the existing Admin sign-in submission and component/browser suites
  using the established router convention.
- Prove that Better Auth sign-in success alone does not navigate and that only
  `{ kind: "authorized" }` causes exactly one
  `router.replace("/admin/dashboard")` call.
- Cover invalid credentials, validation failure, identity `401`, identity
  `403` with existing best-effort sign-out, malformed identity, network/server
  error, and duplicate submit. Each remains on the Admin sign-in page.
- Run directly affected public sign-in/sign-up/home regressions to demonstrate
  this Admin-only change did not alter public authentication navigation.

## Explicitly out of scope

- Direct Dashboard authorization, denied route rendering, protected markup,
  dashboard data requests, shell UI, drawer behavior, or visual review.
- Changes to Better Auth, identity/session endpoints, bootstrap authority, or
  public-auth implementation.

## Acceptance criteria

- The tested sequence is credentials, Better Auth result, Admin identity
  verification, then one Dashboard replacement only for verified Admin
  identity.
- Every failed, denied, malformed, and duplicate outcome remains on
  `/admin/sign-in` with the accepted generic feedback and retained 403 cleanup.
- Public routes retain their existing navigation behavior.
- Commands and actual results are recorded; focused failure behavior cannot be
  replaced by a generic suite pass.

## Validation handoff

Record the router and submission test locations, result matrix, public-auth
regressions, and any environment limitation for independent review.
