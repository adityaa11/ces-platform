# ATLAS — ADMIN DASHBOARD FOUNDATION

**Status:** GO — Implementation Authorized  
**Target branch:** `codex/new-atlas-backend`  
**Application:** `apps/atlas`  
**Target route:** `/admin/dashboard`  
**Predecessor:** AA-006 `approved`  
**UI source:** `Atlas_Admin_Dashboard_Standalone.html`

## 1. Objective

Implement the first authenticated Atlas Admin Console page using the approved Admin Dashboard standalone HTML prototype.

The implementation must establish:

1. A protected `/admin/dashboard` page route.
2. A reusable Admin Console shell with the existing Atlas visual language.
3. A minimal Dashboard displaying `Welcome, [Admin Name]`.
4. Automatic navigation from `/admin/sign-in` to `/admin/dashboard` after successful Admin authentication and authorization.

This is a successor implementation to AA-006. Do not reopen or change its historical contract or checkpoint.

Proceed directly with bounded implementation after inspecting the existing repository integration points.

## 2. Existing Accepted Authorities

The branch already provides:

- Better Auth authentication and session management.
- Persisted Atlas Platform Super Admin authority.
- Durable Admin bootstrap state.
- `createAtlasAdminGuard()`.
- `createPersistedAdminAuthorizationReader()`.
- `GET /api/admin/identity`.
- `POST /api/auth/sign-in/email`.
- Existing Admin Sign-In UI and authenticated submission flow.
- Shared Atlas `ThemeProvider`.

Relevant source files:

```text
apps/atlas/app/admin/sign-in/page.tsx
apps/atlas/components/AdminSignIn.tsx
apps/atlas/components/admin-sign-in-submission.ts
apps/atlas/app/api/admin/identity/route.ts
apps/atlas/lib/admin-guard.ts
apps/atlas/lib/auth-server.ts
apps/atlas/components/ThemeProvider.tsx
apps/atlas/app/globals.css
```

Reuse these accepted authorities.

Do not create another authentication system, Admin session resolver, identity store, role source, or login endpoint.

## 3. Protected Dashboard Route

Create:

```text
apps/atlas/app/admin/dashboard/page.tsx
```

The page must be directly accessible through:

```text
/admin/dashboard
```

It must also render correctly after browser refresh and direct URL navigation.

### Server-side authorization

Before rendering the Admin Shell or Dashboard content:

1. Resolve the current request headers and Better Auth session.
2. Invoke the existing `createAtlasAdminGuard()` with the persisted authorization reader.
3. Verify the authenticated session, persisted `admin` role, and required sealed bootstrap authority.
4. Obtain the authenticated Admin identity.
5. Render the page only after authorization succeeds.

Expected authorization behavior:

| Condition | Required result |
|---|---|
| Missing session | Redirect to `/admin/sign-in` |
| Expired or revoked session | Redirect to `/admin/sign-in` |
| Valid ordinary-user session | Deny dashboard access |
| Persisted Admin authority unavailable | Deny dashboard access |
| Valid Super Admin session | Render Dashboard |
| Unexpected auth/database failure | Fail closed; do not render protected UI |

For forbidden sessions, preserve server-side denial semantics and use a supported forbidden response where available. Never render the protected shell or sensitive identity data before authorization.

The server-side guard is authoritative. Do not replace it with a client-side fetch, React state, middleware-only check, or email allowlist.

Follow the existing auth-service lifecycle, including Worker-specific resource cleanup.

Do not introduce a separate `/api/admin/dashboard` endpoint. This scope establishes a protected page route, not a new Admin API.

## 4. Admin Console Shell

Adapt the supplied `Atlas_Admin_Dashboard_Standalone.html` into React components using the existing Atlas application architecture.

Recommended structure:

```text
apps/atlas/
├── app/
│   └── admin/
│       ├── sign-in/
│       │   └── page.tsx        # Existing
│       └── dashboard/
│           └── page.tsx        # New, protected
│
└── components/
    └── admin/
        ├── AdminShell.tsx
        └── DashboardWelcome.tsx
```

These component names may be adjusted to follow existing repository conventions, but preserve one reusable shell and one protected dashboard route.

Do not install another UI framework or introduce a second Admin design system.

### Shell requirements

Preserve the standalone prototype's layout and visual identity:

- 64 px desktop topbar.
- 224 px desktop left sidebar.
- Atlas branding and Administration breadcrumb.
- Existing Atlas semantic color tokens.
- Light and dark themes.
- Active sidebar navigation indicator.
- Admin identity in the sidebar footer.
- Responsive mobile navigation.
- Visible keyboard focus and accessible navigation controls.

Sidebar structure:

```text
ADMINISTRATION

  Dashboard            [ACTIVE]
  Provider Profiles    [COMING SOON]

------------------------------

WORKSPACE

  Projects             [DISABLED]
  Settings             [DISABLED]

------------------------------

[Admin avatar]
[Authenticated Admin Name]
Platform Administrator
```

Dashboard is the only implemented Admin navigation destination in this scope.

Provider Profiles must remain visibly present but not navigate to an unimplemented route.

Do not implement Provider Profiles, fake a provider page, or embed its standalone prototype inside the dashboard.

Remove standalone-only indicators such as `UI PROTOTYPE`, local demo labels, and prototype disclaimers from the production UI.

### Admin identity

Derive the Admin display name from the server-authorized `AtlasAdminIdentity.name`.

Use that same authoritative identity for:

- Dashboard welcome text.
- Sidebar Admin name.
- Avatar initials.

Do not derive Admin identity from submitted email fields, environment variables, hardcoded account names, or browser storage.

### Theme behavior

Reuse `ThemeProvider` and the existing `atlas-theme` preference.

The standalone prototype's independent theme JavaScript must not be copied as a second application-level theme authority.

Any client-side state should be limited to presentation concerns such as sidebar visibility.

Scope new CSS selectors to Admin Console components. Do not alter unrelated public authentication, workspace, or demo UI selectors.

## 5. Dashboard Content

The first Dashboard must remain intentionally minimal.

Expected structure:

```text
Administration / Dashboard

ATLAS / ADMINISTRATION

Dashboard
Atlas Admin Console

--------------------------------------

ADMINISTRATION WORKSPACE

Welcome, [Authenticated Admin Name].

Welcome to the Atlas administration console.
```

Implement the approved standalone welcome-card composition, including its visual hierarchy, typography, spacing, subtle accent, and responsive behavior.

Do not introduce:

- Dashboard statistics or KPIs.
- Provider capacity data.
- BSS runtime information.
- Project counters.
- Mock operational metrics.
- Placeholder charts.
- Additional cards without an approved UI requirement.

The Dashboard should render successfully without calling any BSS or project-management API.

## 6. Post-Sign-In Navigation

Modify the existing:

```text
apps/atlas/components/AdminSignIn.tsx
```

Currently, a successful AA-006 submission produces an authorized result and displays an Admin confirmation while remaining on `/admin/sign-in`.

Extend that successful path so it navigates to:

```text
/admin/dashboard
```

Required sequence:

```text
Admin enters credentials
        |
        v
Existing client-side validation
        |
        v
POST /api/auth/sign-in/email
        |
        v
Better Auth session established
        |
        v
GET /api/admin/identity
        |
        v
Response 200 + valid role: "admin"
        |
        v
Authorized result
        |
        v
router.replace("/admin/dashboard")
        |
        v
Dashboard independently verifies
server-side Admin authority
        |
        v
Render Admin Shell + Welcome
```

Use the repository's existing navigation conventions and supported Vinext/Next navigation APIs.

Only an authorized AA-006 result may initiate Dashboard navigation.

Do not redirect when:

- Credentials are invalid.
- Better Auth sign-in fails.
- Admin identity verification returns `401`.
- Admin identity verification returns `403`.
- The returned identity is malformed.
- Verification fails due to a network or server error.

Preserve AA-006's existing best-effort sign-out behavior for an identity `403` response.

Preserve its duplicate-submission protection, generic error feedback, credential handling, and session-cookie behavior.

The dashboard must independently enforce authorization even when navigation originated from the verified sign-in flow.

## 7. Isolation Boundaries

The public and Admin applications remain separate navigation surfaces.

Do not:

- Add an Admin login button to public navigation.
- Modify `/sign-in`, `/sign-up`, or `/home`.
- Redirect ordinary Atlas users to Admin Dashboard.
- Create public Admin registration.
- Create another role or session system.
- Change CLI bootstrap or Admin provisioning.
- Reopen AA-001 through AA-006.
- Modify existing BSS, GHR, IDSER, or Semantic runtime code.

Do not place an unconditional Admin guard on a parent layout that also wraps `/admin/sign-in`, because the login page must remain reachable without an authenticated session.

Keep this implementation limited to Dashboard presentation, protected routing, and the successor post-login redirect.

## 8. Validation and Acceptance

### Route and authorization

Verify:

1. `/admin/dashboard` resolves as a valid page route.
2. A valid Super Admin session renders the Dashboard.
3. The welcome name matches the persisted authenticated Admin identity.
4. Direct navigation without a session cannot render the Dashboard.
5. An expired or revoked session cannot render the Dashboard.
6. An ordinary user cannot access the Dashboard.
7. A failed authorization read does not fall back to a fake Admin identity.
8. Refreshing an authorized Dashboard preserves access through the existing session.

### Sign-in navigation

Verify:

1. Successful Better Auth sign-in alone does not trigger navigation.
2. Successful Admin identity verification triggers navigation to `/admin/dashboard`.
3. Failed or unauthorized identity verification stays on the sign-in page.
4. The existing `403` sign-out cleanup remains intact.
5. Duplicate sign-in submissions do not trigger competing requests or navigation.
6. Public sign-in behavior remains unchanged.

### UI and accessibility

Verify:

1. Desktop shell matches the standalone visual reference.
2. Dashboard is the active sidebar item.
3. Provider Profiles is visible but inactive.
4. Mobile navigation can open and close.
5. Light and dark themes use the shared Atlas theme authority.
6. Theme choice persists according to existing application behavior.
7. Layout does not overflow at narrow viewport widths.
8. Keyboard navigation, focus visibility, accessible labels, and reduced-motion behavior remain correct.
9. No standalone prototype text or fake metrics remain in production.

### Regression

Run the focused existing AA-006 authentication and Admin authorization tests, new Dashboard route/navigation tests, and affected public authentication tests.

Run the application production build and changed-file ESLint.

Record actual results. Do not claim PASS for tests that were not executed. Keep unrelated pre-existing repository failures separately identified.

## 9. Completion Boundary

Implementation is complete when:

- `/admin/dashboard` exists.
- Dashboard authorization is enforced server-side using the existing guard.
- The approved Admin Shell is implemented.
- Dashboard displays the real authenticated Admin name.
- Admin Sign-In redirects to Dashboard after verified authorization.
- Unauthorized sessions cannot view Dashboard content.
- Existing Admin/public authentication behavior remains intact.
- Focused tests and build validation pass.

Do not implement Provider Profiles or any further Admin modules in this ticket.

**Proceed with GO implementation within this bounded scope. After implementation, provide the changed-file summary, validation results, implementation commit, and checkpoint for independent review. Do not self-approve the ticket.**