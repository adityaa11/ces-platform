# AAD-001: Establish the server-authorized Admin Dashboard route

- **State:** approved
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

## GO validation record

### Changed shared components and primitives

| Component / primitive | Why changed | Routes and features using it | Intentional variants |
|---|---|---|---|
| None | AAD-001 adds only its own server page and does not change shared presentation primitives. | `/admin/dashboard` | AAD-002 owns the reusable Admin shell. |

### Rendered-state inspection

| Component / screen | Interaction states checked | Themes checked | Breakpoints checked | Text rhythm checked | Accessibility behavior checked | Result / evidence |
|---|---|---|---|---|---|---|
| AAD-001 protected placeholder | Not applicable: no client interaction or shell is introduced. | Not applicable. | Not applicable. | Not applicable. | Semantic `main`/`h1` placeholder only; AAD-002/AAD-007 own visual and interactive review. | `apps/atlas/tests/admin-dashboard-route.test.mjs` and the production route inventory confirm the route composition. |

### Design-quality check

- **Reference or approved pattern used:** The existing server-page and auth-service lifecycle pattern from `apps/atlas/app/home/page.tsx` and the accepted Admin guard.
- **Visual direction:** Deliberately deferred to AAD-002; the placeholder prevents duplicating the future shell.
- **Hierarchy, density, navigation, whitespace, and control-placement result:** Not applicable to this route-boundary ticket.
- **Known limitations or intentional omissions:** No shared Admin shell, theme control, navigation, or sign-in redirect is implemented here.

### Regression learning

- **Any visual defect found after an earlier check:** None; no new visual component is in scope.
- **Previously missed state:** None.
- **New mandatory state for this component:** AAD-005 must exercise the route's success, redirect, forbidden, and fail-closed server outcomes with real route-level coverage.
