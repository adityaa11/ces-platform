# Atlas Sign-Out Implementation Context

## Status

This document defines the implementation context for adding a real sign-out flow to the production-shaped Atlas authenticated shell after completion of the SUS and SIN ticket sets.

Baseline branch inspected:

- `codex/new-atlas-backend`
- inspected HEAD: `d5c7715` (`docs(auth): approve SIN-004 checkpoint`)

This is a bounded follow-up to the approved authentication work. It does not redesign the authentication architecture.

The central rule is:

> Sign-out must invalidate the current Better Auth session before Atlas navigates the user to `/sign-in`.

A navigation-only "logout" is not sign-out.

The existing Better Auth boundary already exposes the required sign-out endpoint through the mounted application auth route. This implementation therefore wires the production account menu to the approved endpoint; it does not create a second authentication service or a competing sign-out mechanism.

## Canonical execution and validation environment

All runnable sign-out implementation and validation work follows the [Backend Phase canonical Docker Compose environment](README.md#canonical-docker-compose-implementation-and-validation-environment). Source edits remain in the shared worktree, but dependency installation, builds, tests, lint/type checks, migrations, and application-level sign-out evidence run inside the Compose-built Atlas container. Host-local pnpm dependency links are not authoritative.

Prepare and verify the database service before running ticket checks:

```sh
docker compose up -d postgres
docker compose ps
```

For a full browser-facing environment, use `docker compose up -d --build` and verify the service health with `docker compose ps`. For package and ticket validation, use clean one-off containers such as:

```sh
docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/app test
docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/auth test
```

The `ps` result is a prerequisite/readiness signal, not the test result. Checkpoint evidence must record the container command, service health, test counts, explicit skips, and any Docker availability limitation without weakening database-backed assertions.

---

# 1. Approved Foundation Being Reused

The completed backend phase already establishes the following authority split:

~~~text
Better Auth
    |
    +-- identity
    +-- credentials
    +-- sessions
    +-- session cookies

Atlas
    |
    +-- project authorization
    +-- project membership
    +-- roles
    +-- project/workspace state

@atlas/fixtures
    |
    +-- demo/prototype/golden/regression state
~~~

The following approved work is directly relevant.

## 1.1 BSS-004

`project's goal/Backend_Phase/tickets/Stack_Setup/BSS-004-better-auth-persistence.md`

BSS-004 already requires and proves:

- Better Auth persists users and sessions in PostgreSQL;
- sign-up, sign-in, session lookup, and sign-out are part of the auth boundary;
- sign-out invalidates the existing session;
- Atlas authorization remains separate.

The package-level lifecycle proof already exists in:

`packages/atlas-auth/tests/lifecycle.test.ts`

That test exercises:

~~~text
sign-up
    |
    v
session created
    |
    v
service recreated
    |
    v
session still valid
    |
    v
POST /api/auth/sign-out
    |
    v
session invalid
~~~

This proof must remain intact and must not be replaced by a weaker UI-only test.

## 1.2 SUS ticket set

The approved SUS set established the browser-facing Better Auth route and real account/session creation.

The mounted route is:

`apps/atlas/app/api/auth/[...all]/route.ts`

The route delegates to the existing Atlas auth service and already exposes Better Auth's route surface.

Therefore sign-out must reuse:

`POST /api/auth/sign-out`

Do not add another auth route containing custom sign-out business logic.

## 1.3 SIN ticket set

The approved SIN set established:

~~~text
/sign-in
    |
    v
POST /api/auth/sign-in/email
    |
    v
Better Auth session
    |
    v
/home
~~~

It also established `/home` as a session-resolved production-shaped authenticated route.

`/home` currently renders:

- the current Better Auth user's persisted name;
- the current Better Auth user's persisted email;
- zero production projects until production project persistence is implemented;
- no invented owner/editor/viewer role;
- no fixture project hydration.

SIN-003 deliberately hid the fake production logout because the previous `Logout -> /sign-in` link did not invalidate the Better Auth session.

This sign-out implementation is the explicit follow-up that closes that gap.

---

# 2. Current Repository State

The relevant current implementation is:

~~~text
apps/atlas/app/api/auth/[...all]/route.ts
apps/atlas/lib/auth-server.ts
apps/atlas/app/home/page.tsx
apps/atlas/components/ProjectLibrary.tsx
apps/atlas/components/AppShell.tsx
apps/atlas/components/ProfileMenu.tsx
apps/atlas/tests/auth-home.integration.test.mjs
packages/atlas-auth/tests/lifecycle.test.ts
~~~

## 2.1 Current production home behavior

`apps/atlas/app/home/page.tsx` resolves the Better Auth session on the server.

If no authenticated user exists:

~~~text
/home
    |
    v
redirect /sign-in
~~~

If a session exists:

~~~text
/home
    |
    v
ProjectLibrary
    |
    +-- mode = production
    +-- projects = []
    +-- user = session-backed name/email
~~~

That route behavior must remain unchanged.

## 2.2 Current account menu behavior

`apps/atlas/components/ProfileMenu.tsx` currently contains a prototype-only action:

~~~text
Logout -> /sign-in
~~~

That is only navigation.

It does not invalidate the Better Auth session.

The SIN work therefore makes `ProjectLibrary` pass:

~~~text
showSignOut = false
~~~

for production mode and keeps the prototype action only in fixture mode.

The new implementation must not simply turn that link back on for `/home`.

The production control must become a real button backed by the Better Auth sign-out request.

---

# 3. Implementation Objective

The required production flow is:

~~~text
Authenticated /home
    |
    v
Open account/profile menu
    |
    v
Click "Sign out"
    |
    v
POST /api/auth/sign-out
    |
    v
Better Auth invalidates current session
    |
    v
successful response
    |
    v
replace navigation with /sign-in
~~~

After success:

~~~text
old session cookie / old session identifier
    |
    v
/api/auth/get-session
    |
    v
null
~~~

and:

~~~text
old session
    |
    v
/home
    |
    v
redirect /sign-in
~~~

The user record itself must remain intact.

Sign-out means session termination, not account deletion.

---

# 4. Canonical Sign-Out HTTP Route

The canonical sign-out route is already available:

~~~http
POST /api/auth/sign-out
~~~

through:

`apps/atlas/app/api/auth/[...all]/route.ts`

No new `/sign-out` page is required.

No new custom API route is required.

No direct database session deletion should be added to `apps/atlas`.

The request must travel through the same approved boundary as sign-up and sign-in:

~~~text
browser
    |
    v
/api/auth/sign-out
    |
    v
existing Atlas Better Auth handler
    |
    v
Better Auth
    |
    v
auth.session persistence
~~~

The UI should use a same-origin browser request.

Representative shape:

~~~ts
fetch("/api/auth/sign-out", {
  method: "POST",
  credentials: "same-origin",
})
~~~

Do not manually construct an `Origin` header in browser code.

Do not bypass the existing trusted-origin configuration.

---

# 5. Sign-Out Client Behavior

The production account-menu action must be a button, not a navigation link.

Expected lifecycle:

~~~text
Idle
 |
 v
Click Sign out
 |
 v
Signing out
 |
 +-- disable button
 +-- prevent duplicate submissions
 +-- clear prior bounded error
 |
 v
POST /api/auth/sign-out
 |
 +---------------------------+
 |                           |
 v                           v
2xx success                 failure / network error
 |                           |
 v                           v
session invalidated        remain on current screen
 |                           |
 v                           +-- re-enable button
router.replace              +-- show safe error
("/sign-in")                +-- allow retry
~~~

Navigation must happen only after a successful sign-out response.

The implementation must never do this:

~~~text
click
    |
    v
navigate /sign-in
    |
    v
assume signed out
~~~

That is the exact fake-logout behavior the SIN set intentionally prohibited.

---

# 6. Submission Boundary

The existing sign-up and sign-in implementations use small submission helpers:

~~~text
sign-up-submission.ts
sign-in-submission.ts
~~~

The sign-out flow should follow the same bounded pattern.

Recommended supporting file:

`apps/atlas/components/sign-out-submission.ts`

Its responsibility should be limited to:

- one in-flight sign-out request at a time;
- return the actual response when available;
- navigate only when the response is successful;
- return a bounded failure result on request/network failure;
- contain no database logic;
- contain no project logic;
- contain no cookie parsing or manual cookie mutation.

Representative interface:

~~~ts
createSignOutSubmission(
  request,
  navigate,
)
~~~

The exact shape may differ if the existing component can remain simpler, but the same behavioral seam must remain independently testable.

---

# 7. Production Account Menu UI

The requested sign-out control belongs in the expanded profile/account menu at the bottom-left of the Atlas shell, in the section highlighted in the supplied `/home` screenshot.

The current expanded menu contains:

~~~text
Theme
Light / Dark

Account settings
Unavailable in prototype
~~~

The target production menu becomes:

~~~text
Theme
Light / Dark

Account settings
Unavailable in prototype

----------------
Sign out
~~~

## 7.1 Placement

The sign-out action must:

- appear as the last account-menu action;
- sit below the current Account settings unavailable row;
- use a visual divider or spacing that separates account preferences from session termination;
- be present in both desktop popover and mobile account sheet because both render the same `ProfileMenu` actions;
- remain inside the existing account/profile menu rather than introducing a new sidebar card.

## 7.2 Visual behavior

The control should match the current Atlas menu language:

- full-width menu-row behavior;
- same typography scale as other account actions;
- same border radius and hover/focus language;
- clear keyboard focus state;
- no large primary CTA treatment;
- no confirmation dialog unless a later product requirement explicitly adds one.

Recommended labels:

~~~text
idle:       Sign out
in flight:  Signing out...
~~~

Sign-out is not data deletion, so a destructive red treatment is not required.

A subtle icon may be used if it matches the existing shell icon language, but the text label must remain explicit.

## 7.3 Failure state

If sign-out fails:

- keep the user on the current authenticated surface;
- keep the account menu open so the failure is visible;
- re-enable the button;
- display a concise retryable message.

Recommended fallback:

~~~text
Atlas couldn't sign you out right now. Try again.
~~~

The error should use `role="alert"` or equivalent accessible live feedback.

Do not render raw Better Auth response details.

---

# 8. Production vs Fixture Behavior

This change must preserve the fixture-to-real boundary established by SUS and SIN.

Current behavior distinguishes:

~~~text
/demo
    -> fixture authority

/home
    -> production-shaped authenticated authority
~~~

The sign-out behavior must also be explicit.

Recommended shared component contract:

~~~text
signOutMode =
    "session"          production authenticated shell
    "fixture-link"     existing prototype/demo navigation behavior
    "hidden"           surfaces where no sign-out action belongs
~~~

Equivalent naming is acceptable.

The important rule is that one ambiguous boolean must not accidentally make `/demo` use production session semantics or make `/home` fall back to navigation-only logout.

For `/home`:

~~~text
signOutMode = session
~~~

For `/demo`:

~~~text
signOutMode = fixture-link
~~~

if the existing prototype logout is intentionally preserved.

Do not force `/demo` through Better Auth sign-out merely because the shared component is reused. `/demo` may be rendered without a real authenticated session and remains fixture authority.

---

# 9. ProfileMenu Responsibilities

`ProfileMenu` is already a client component and is the correct presentation boundary for the requested control.

It may own:

- `isSigningOut`;
- bounded `signOutError`;
- the click handler;
- menu-open behavior;
- the `useRouter` navigation callback.

It must not own:

- session database queries;
- direct auth-table access;
- manual cookie deletion;
- account deletion;
- project authorization;
- fixture/production authority decisions that belong to the parent route mode.

The menu should receive an explicit sign-out behavior from the shell/project-library boundary.

---

# 10. Post-Sign-Out Navigation

After Better Auth returns a successful sign-out response:

~~~text
router.replace("/sign-in")
~~~

is preferred over pushing a second authenticated-history entry.

The navigation must occur only after sign-out success.

Do not rely on a client-side boolean such as:

~~~text
isAuthenticated = false
~~~

as the authority.

The authoritative proof is the Better Auth session no longer resolving.

The existing `/home` server guard then remains the second line of behavior:

~~~text
stale/invalid session request to /home
    |
    v
no Better Auth user
    |
    v
redirect /sign-in
~~~

---

# 11. Session Semantics

This implementation signs out the current browser session.

It does not implement:

- sign out all devices;
- session list/management UI;
- revoke another device;
- account deactivation;
- account deletion.

Do not broaden the current request into global session management.

If global sign-out is required later, it must receive its own product/security context.

---

# 12. Cookie and Browser-State Rules

Better Auth remains the owner of session-cookie lifecycle.

Atlas client code must not add:

~~~text
document.cookie session manipulation
localStorage auth tokens
sessionStorage auth tokens
custom JWT cleanup
custom refresh-token cleanup
custom session identifiers
~~~

The sign-out response is responsible for the Better Auth session/cookie behavior.

Do not duplicate it in JavaScript.

Do not log:

- session cookies;
- request Cookie headers;
- auth secrets;
- database credentials;
- raw authentication headers.

---

# 13. Authentication vs Authorization Boundary

Sign-out changes authentication state only.

It must not mutate Atlas project state.

The flow must not delete or alter:

~~~text
atlas.project
atlas.project_member
atlas.workspace
project roles
workspace roles
Master
Initial Draft
publication state
fixture projects
fixture memberships
~~~

Correct authority transition:

~~~text
authenticated identity/session
        |
        v
sign out
        |
        v
no current authenticated session
~~~

Not:

~~~text
sign out
        |
        v
delete Atlas data
~~~

---

# 14. Frozen SUS and SIN Behavior

This context does not reopen the approved SUS or SIN contracts except where the production profile menu was intentionally waiting for real sign-out.

Preserve:

~~~text
successful sign-in -> /home
/home without session -> /sign-in
/home identity -> Better Auth session name/email
/home projects -> []
/demo -> fixture/golden authority
~~~

The approved SUS sign-up destination remains governed by the frozen SUS scope until it receives its own explicit follow-up change.

Do not silently change sign-up navigation while implementing sign-out.

---

# 15. Existing Test That Must Change Intentionally

`apps/atlas/tests/auth-home.integration.test.mjs` currently asserts that production `/home` does not render the old fake `Logout` action.

That assertion was correct for SIN-003/SIN-004 because real sign-out was out of scope.

This implementation must update that regression deliberately.

The new expected production state is:

~~~text
no fake navigation-only Logout link
real Sign out button present
~~~

The test should distinguish the new real control from the old prototype link.

Do not simply delete the assertion without replacing it with positive evidence.

---

# 16. Application-Level Sign-Out Validation

Add a focused application integration test, for example:

`apps/atlas/tests/auth-sign-out.integration.test.mjs`

or extend the current auth/home integration test if keeping one complete auth lifecycle file is cleaner.

The application-level proof should:

1. create a unique temporary Better Auth user using the approved test setup;
2. establish a real session through the current sign-in route;
3. request `/home` with that session;
4. assert the production account menu contains the real `Sign out` control;
5. call `POST /api/auth/sign-out` with the established session cookie;
6. assert the response succeeds;
7. call `/api/auth/get-session` with the old session identifier/cookie and assert that no session resolves;
8. request `/home` with the old session and assert redirect to `/sign-in`;
9. verify the user account itself still exists until test cleanup;
10. clean up only the unique temporary user through the existing test-only database boundary.

The test must not add a production admin cleanup route.

---

# 17. Client Behavior Validation

Add focused coverage for the client submission seam or equivalent behavior.

Prove:

~~~text
success
    -> exactly one sign-out request
    -> navigate exactly once

non-2xx response
    -> no navigation
    -> retry allowed

network failure
    -> no navigation
    -> retry allowed

double click while in flight
    -> one request
~~~

If the implementation does not create a standalone helper, equivalent behavior must still be testable at the component boundary.

---

# 18. Regression Validation

The final sign-out ticket set must continue to run the existing auth/application checks.

At minimum preserve:

- the unchanged `@atlas/auth` lifecycle test;
- sign-up regression tests;
- sign-in regression tests;
- authenticated-home integration tests;
- `/demo` fixture regressions;
- rendered HTML/CSP checks;
- app build;
- directly affected lint/type checks.

Do not weaken or delete the package-level BSS-004 sign-out proof just because application-level sign-out now exists.

The two layers prove different boundaries:

~~~text
@atlas/auth lifecycle test
    -> auth persistence/session invalidation

application sign-out integration
    -> browser-facing route + production menu + post-sign-out navigation
~~~

---

# 19. Failure and Edge Cases

The implementation must handle the following bounded cases.

## 19.1 Duplicate click

Only one sign-out request may be active.

The control is disabled while signing out.

## 19.2 Non-2xx response

Do not navigate.

Show bounded retryable feedback.

## 19.3 Network failure

Do not assume the user is signed out.

Remain on the current screen and allow retry.

## 19.4 Already-invalid session

Do not invent local authenticated state.

If a subsequent server navigation determines that the session is absent, `/home` already redirects to `/sign-in`.

The implementation does not need to create a separate session-reconciliation architecture for this ticket.

## 19.5 Browser back navigation

Because the server session is invalid after successful sign-out, any later request to `/home` must fail the existing session guard and redirect to `/sign-in`.

Client history must not be treated as authentication authority.

---

# 20. Security Boundaries

## 20.1 Method

Use POST for sign-out.

Do not implement sign-out as a GET navigation link.

## 20.2 Existing origin protections

Reuse Better Auth's configured trusted-origin behavior.

Do not relax `BETTER_AUTH_TRUSTED_ORIGINS` or auth configuration to make sign-out pass.

## 20.3 Session authority

Only Better Auth invalidation constitutes sign-out.

A route change, React state change, menu close, or cookie-looking UI change is insufficient.

## 20.4 Sensitive data

Never expose or log:

~~~text
session cookie
Cookie header
BETTER_AUTH_SECRET
DATABASE_URL
password
raw internal exception
~~~

## 20.5 Account preservation

Sign-out must not delete:

~~~text
auth.user
auth.account
~~~

It invalidates the current session only.

---

# 21. Files Expected to Change

Primary implementation surface:

~~~text
apps/atlas/components/ProfileMenu.tsx
apps/atlas/components/AppShell.tsx
apps/atlas/components/ProjectLibrary.tsx
apps/atlas/app/globals.css
~~~

Recommended new support:

~~~text
apps/atlas/components/sign-out-submission.ts
~~~

Expected test surface:

~~~text
apps/atlas/tests/auth-home.integration.test.mjs
apps/atlas/tests/auth-sign-out.integration.test.mjs
~~~

or an equivalent bounded consolidation.

Normally unchanged:

~~~text
apps/atlas/app/api/auth/[...all]/route.ts
apps/atlas/lib/auth-server.ts
packages/atlas-auth/src/index.ts
packages/atlas-db/*
auth schema/migrations
~~~

The existing route already exposes the required Better Auth endpoint.

A change to auth schema, Better Auth configuration, or database migration is a scope-expansion signal and should stop the ticket for review unless a concrete defect proves it necessary.

---

# 22. Explicit Non-Goals

This implementation does not include:

- sign out all devices;
- session-management page;
- OAuth;
- MFA;
- email verification;
- password reset;
- password change;
- account deletion;
- account deactivation;
- project persistence;
- project membership;
- RBAC;
- invitations;
- global route middleware;
- new JWT/access-token/refresh-token architecture;
- sign-up destination changes;
- fixture-to-production project migration.

Do not absorb those concerns into the sign-out ticket set.

---

# 23. Acceptance Criteria

## AC-01 - Real sign-out endpoint

Production sign-out calls the existing:

~~~text
POST /api/auth/sign-out
~~~

through the approved Better Auth route.

## AC-02 - No duplicate auth implementation

No custom sign-out database logic, second auth service, second session store, or new auth schema is introduced.

## AC-03 - Real menu control

The expanded production account menu contains a `Sign out` button in the user-highlighted account-action section below Account settings.

## AC-04 - Button, not link

The production action is not a simple `/sign-in` navigation link.

## AC-05 - In-flight protection

The action prevents duplicate requests while sign-out is in progress.

## AC-06 - Navigation only after success

Atlas navigates to `/sign-in` only after a successful sign-out response.

## AC-07 - Bounded failure

A failed sign-out remains on the current surface, re-enables the control, and shows safe retryable feedback.

## AC-08 - Session invalidation

After successful sign-out, the previous Better Auth session no longer resolves.

## AC-09 - Home protection after sign-out

After successful sign-out, a request to `/home` using the old session redirects to `/sign-in`.

## AC-10 - Account preserved

Sign-out does not delete the Better Auth user/account.

## AC-11 - No Atlas-state mutation

Sign-out creates, deletes, or changes no Atlas project/workspace/membership/role/publication state.

## AC-12 - Fixture isolation

`/demo` remains fixture authority and is not accidentally forced into the production session-sign-out flow.

## AC-13 - No browser auth store

No localStorage, sessionStorage, custom cookie, JWT, bearer token, or client-owned session state is added.

## AC-14 - Existing auth lifecycle preserved

The BSS-004 lifecycle test continues to pass unchanged.

## AC-15 - Production home regression updated deliberately

The existing "no fake Logout" evidence is replaced with proof that `/home` renders a real sign-out control and no navigation-only logout.

## AC-16 - Responsive account menu

The action is available through the same profile action set on desktop and mobile account-menu presentations.

---

# 24. Planning Constraints for Ticket Generation

When Codex decomposes this context into tickets, ticket boundaries should preserve the implementation order rather than rediscover the auth architecture.

A reasonable dependency shape is:

~~~text
production sign-out interaction seam
        |
        v
ProfileMenu/AppShell wiring
        |
        v
application integration validation
        |
        v
regression checkpoint
~~~

Ticket generation must not perform a new broad authentication architecture scan and then invent a replacement route.

The following facts are frozen inputs:

~~~text
sign-out endpoint = POST /api/auth/sign-out
auth authority = Better Auth
post-success destination = /sign-in
authenticated landing route = /home
production account identity = Better Auth session
fixture route = /demo
project authorization = out of scope
~~~

The ticket set should reference these facts directly.

---

# 25. Definition of Done

The completed implementation should be explainable in one sentence:

> An authenticated Atlas user can open the existing account menu on `/home`, press `Sign out`, have Better Auth invalidate the current session through `POST /api/auth/sign-out`, and reach `/sign-in` only after that invalidation succeeds, while the user account, Atlas project authority, fixture boundary, and approved SUS/SIN architecture remain unchanged.
