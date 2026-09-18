# SIN-003: Authenticated home route and route-aware navigation

- **State:** `approved`
- **Review batch:** `SIN-BATCH-03`
- **Depends on:** SIN-002 `PASS`
- **Baseline:** [Sign-In and Authenticated Home Implementation Context](../../atlas-sign-in-home-implementation-context.md) §§7–12, 16–19, 21–28; [Backend Phase README](../../README.md) authority rules; AC-04–AC-12 and AC-14

## Outcome

Add `/home` as a server-resolved authenticated landing route. It must consume the current Better Auth session, render the shared Atlas shell in explicit production mode with an empty project list, show the real user's name/email, keep project/workspace navigation disabled without a selected project, and prevent production shell links from falling back to `/demo`.

## Scope

- Add `apps/atlas/app/home/page.tsx` as a server route that resolves the current Better Auth session through the existing server authentication boundary and request cookies/headers.
- If a session exists, pass only the session-backed `user.name` and `user.email` into the production-shaped home composition and pass `projects=[]` until production project persistence exists.
- If no session exists, redirect to `/sign-in` according to the application route strategy; do not render authenticated identity or fixture project state first.
- Make `AppShell` accept an explicit route context/base route, such as `homeHref="/home"` or `routeMode="production" | "fixture"`, so brand and Projects navigation point to `/home` on `/home` and `/demo` on `/demo`.
- Preserve fixture workspace navigation and `demoHref` behavior for `/demo`; do not globally replace `/demo` in shared helpers.
- Render disabled Main Workflow, Project Facts, CES Result, Changes Done, and Sources controls on empty production home when no project/workspace is selected. Do not create a fake project to enable them.
- Update `ProfileMenu` so the production home profile area displays session-backed name/email without an owner/editor/viewer label when no membership context exists.
- Do not expose a misleading production `Logout -> /sign-in` link that merely navigates without invalidating the Better Auth session. Hide/mark it unavailable in production mode unless a separate approved sign-out boundary is explicitly added; preserve fixture behavior where it remains part of the prototype.
- Keep the search control visible if desired, but its empty result set must not be filled with fixture projects.

This ticket does not implement project authorization, project creation, project sharing, sign-out endpoint/UI, global route guards, or any workflow data. The `/home` guard is only an authenticated landing-route guard.

## Acceptance criteria

- An authenticated request to `/home` renders the existing Atlas project-library shell in production mode with the session user's persisted `name` and `email`.
- `/home` never obtains identity from query parameters, localStorage, fixture scenarios, hard-coded names, or hard-coded emails.
- An unauthenticated `/home` request does not render authenticated identity and redirects to `/sign-in` using the chosen route strategy.
- The production profile control does not invent a project role, membership, ownership, or access label and does not present a fake logout action.
- The production project area starts with `projects=[]`, zero cards, and the empty state; workspace/project navigation remains disabled without a selected project.
- Atlas brand and Projects links inside `/home` resolve to `/home`; `/demo` continues to resolve and navigate within fixture authority.
- No `/home` code path fetches or mutates `/api/local-fixtures`, imports fixture session identity as runtime authority, or treats the user's successful authentication as project authorization.
- Sign-in success from SIN-001 lands on `/home`; sign-up remains governed by the frozen SUS behavior until a separate scope change is approved.

## Validation

- Add a focused authenticated-home test or equivalent server/render test using a unique Better Auth identity/session and assert the returned name/email, empty project state, and absence of fixture cards.
- Add an unauthenticated-home assertion proving the route redirects or otherwise returns the chosen public sign-in response without authenticated identity.
- Assert production brand/Projects links point to `/home` and representative `/demo` links still point to fixture routes.
- Assert no production profile role label or fake logout path is rendered when membership/sign-out context is absent.
- Assert all project/workspace navigation controls are disabled or unavailable for the empty state.
- Run sign-in request/session validation, existing sign-up checks, `/demo` fixture regressions, rendered HTML/CSP checks, app build, and directly affected lint/type tests.

## Security Refactor Readiness

Status: planning-review-required

### Inherited boundaries

- `BOUNDARY-SIN-003-01` Better Auth session lookup is the identity source for `/home`; the browser and route parameters are not identity authorities.
- `BOUNDARY-SIN-003-02` `/home` route authentication is not Atlas project authorization. Project membership, role, workspace access, and trusted project state remain future Atlas-owned decisions.

### Trust boundaries

- `TRUST-SIN-003-01` The incoming `/home` request crosses the server route into the Better Auth session lookup using request cookies/headers.
- `TRUST-SIN-003-02` Session identity crosses into shared UI as name/email only; project capabilities must come from a later explicit Atlas authorization context.

### Sensitive assets and identity context

- `ASSET-SIN-003-01` Session cookies and auth headers remain server-controlled and must not be exposed to client state or rendered output.
- `IDENTITY-SIN-003-01` The profile area must reflect the current Better Auth user and remain independent of fixture session data and project roles.

### Required seams

- `SEAM-SIN-003-01` The server session-resolution boundary is the attachment point for future route policy without adding client-owned auth truth.
- `SEAM-SIN-003-02` Explicit shell route context allows production navigation and fixture navigation to coexist without rewriting fixture helpers.
- `SEAM-SIN-003-03` Separate profile identity from project capability so later Atlas authorization can supply membership context at the project boundary.

### Prohibited couplings

- `COUPLING-SIN-003-01` Do not query auth tables directly from the browser or encode session identity in query parameters/localStorage.
- `COUPLING-SIN-003-02` Do not turn route authentication into implicit project ownership, role assignment, workspace access, or fixture project hydration.
- `COUPLING-SIN-003-03` Do not claim sign-out by navigating to `/sign-in` without calling the approved Better Auth sign-out endpoint.

### Intentionally unresolved security policy

- `SEC-GAP-SIN-003-01` Global route protection, sign-out UI, session-management UI, project authorization, RBAC, membership/invitation policy, and security-baseline controls remain separately scoped.

### Planning finding

- `FINDING-SIN-003-01` The existing `/home`-relevant components contain hard-coded `/demo` links, fixture role requirements, and a non-invalidating logout link. The route-context and production profile behavior are required before `/home` can be accepted as a trustworthy authenticated landing surface.

### Mandatory review bindings

- `REV-READY-SIN-003-01`
  Ref: `SEAM-SIN-003-01`
  Question: Does `/home` use the existing server Better Auth session boundary and protect only route entry without inventing project authorization?
  Evidence: route code and authenticated/unauthenticated tests.
- `REV-READY-SIN-003-02`
  Ref: `SEAM-SIN-003-02`
  Question: Are production and fixture navigation selected explicitly, with `/demo` behavior preserved?
  Evidence: shell diff and link/render assertions.
- `REV-READY-SIN-003-03`
  Ref: `COUPLING-SIN-003-03`
  Question: Is fake logout absent from production home unless a real Better Auth sign-out call is in scope?
  Evidence: production profile render and changed-file review.

## Review checkpoint

- **Review question:** Does `/home` consume the real Better Auth session and render an empty production shell with route-correct navigation, real profile identity, no fake role/logout, and no fixture leakage?
- **Combined acceptance:** Authenticated users see the session-backed name/email and zero production projects; unauthenticated users do not see authenticated state; `/home` stays in production route context; `/demo` remains fixture authority.
- **Implementation commits:** `0d23b26` (`feat(auth): add authenticated home route`); remediation `6c95a5a` (`test(auth): cover authenticated home route`) resolves F-001 with a real Better Auth session/cookie against a started Atlas server, verifies the authenticated empty production shell and `/home` navigation, and proves anonymous `/home` redirects to `/sign-in`. Docker app validation passed: 17 tests passed, 1 worker-runtime test was intentionally environment-gated. The three unchanged app lint errors remain tracked outside this checkpoint.
