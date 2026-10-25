# AAD-001: Establish the server-authorized Admin Dashboard route

- **State:** proposed
- **Depends on:** AA-006; [phase contract](README.md)
- **Application:** `apps/atlas`
- **Primary source:** [dashboard brief, sections 1–3 and 7](../../Atlas-admin-dashboard.md)

## Outcome

Create `/admin/dashboard` as a directly navigable, refresh-safe server page
whose authorization boundary is identical in authority to the accepted Admin
identity endpoint. The page must not render protected UI or identity-derived
content until persisted Super Admin authority succeeds.

## Scope

- Add `apps/atlas/app/admin/dashboard/page.tsx` using the application's
  server-page conventions.
- Resolve `headers()`, acquire `getAtlasAuthService()`, then invoke
  `createAtlasAdminGuard(service.auth.api.getSession,
  createPersistedAdminAuthorizationReader(service.db))` before rendering.
- Pass only the returned `AtlasAdminIdentity` into the presentation boundary
  that AAD-002 will supply. A minimal protected placeholder is acceptable only
  while AAD-002 is incomplete; it must not duplicate shell markup.
- Redirect missing, expired, revoked, or session-resolution-failed requests
  to `/admin/sign-in`. Preserve a server-side forbidden result for an
  authenticated caller without persisted Admin authority. Unexpected database
  or service failures fail closed and must never render a fallback identity.
- Ensure Worker-backed requests close the auth service in `finally`, matching
  the existing route and protected home-page lifecycle.

## Explicitly out of scope

- Client-side route protection, a dashboard identity fetch, middleware-only
  authorization, email allowlisting, new endpoint, or new Admin role/session
  implementation.
- Shell styling, navigation drawer behavior, theme controls, redirect after
  sign-in, provider UI, metrics, or BSS/project data.
- Applying an Admin guard to a parent layout that would also protect
  `/admin/sign-in`.

## Acceptance criteria

- Direct `GET /admin/dashboard` and a refresh with a valid persisted Super
  Admin session render the protected route.
- No session, expired session, revoked session, or failed session lookup
  redirects to `/admin/sign-in` without rendering Admin content.
- A valid ordinary-user session or unavailable/unsealed persisted Admin
  authority receives a server-side denial and never sees the shell, Admin
  name, avatar initials, or protected welcome content.
- The page reads the authorized identity exactly through the established guard
  and uses no mock, browser-stored, submitted, or environment-derived Admin
  identity.
- Worker-specific resources are released on every result path.

## Validation handoff

Add or identify the smallest server-route tests necessary for AAD-005 to
exercise the success, redirect, forbidden, and fail-closed paths. Record the
actual source files changed and any framework-specific forbidden behavior.
