# Atlas Sign-In and Authenticated Home Implementation Context

## Status

This is the single source of implementation context for the current `codex/new-atlas-backend` direction. It supersedes the earlier sign-in-only implementation context.

It defines the implementation context for:

1. wiring the existing `/sign-in` route to the approved Better Auth boundary;
2. establishing the normal Better Auth browser session;
3. introducing `/home` as the authenticated landing route;
4. rendering the existing Atlas project-library shell with the real authenticated user's name/email; and
5. showing a production-safe empty project library without fixture project data.

This is not a redesign of authentication architecture and does not introduce project persistence.

Primary references:

- `atlas-backend-production-baseline-mistral-synced.md`
- `atlas-core-architecture-checkpoint-v2-mistral-enriched-v2.md`
- `atlas-sign-up-implementation-context.md`
- `tickets/Stack_Setup/BSS-004-better-auth-persistence.md`
- completed `tickets/Sign_Up_Phase/*`
- current `apps/atlas/app/demo/page.tsx`
- current `apps/atlas/components/AppShell.tsx`
- current `apps/atlas/components/ProfileMenu.tsx`
- current `apps/atlas/components/ProjectLibrary.tsx`
- `home route.png`

The central rule is:

> Sign-in establishes Better Auth identity/session. `/home` consumes that real session identity while keeping project state empty until production project persistence is implemented.

## Visual reference legend

Whenever either source context refers to a blue or orange rectangle, it means the annotated regions in:

```text
project's goal/Backend_Phase/home route.png
```

The colors are annotation references, not product-state colors.

```text
blue rectangle
    = the Your projects/project-library region on the home-route reference image
    = project cards, project empty state, and project-library actions

orange rectangle
    = the bottom-left profile control on the home-route reference image
    = authenticated user's name/email and profile actions
```

The blue region must use production project data on `/home`; initially that data is `projects = []`. The same visual components may continue to use fixture data on `/demo`.

The orange region must use the current Better Auth session identity on `/home`; it must not use fixture session data or manually carried sign-up form values.

---

# 1. Why `/home` Exists

`/demo` is still a fixture-oriented route.

Its responsibility is to preserve:

```text
prototype scenarios
golden scenarios
stress fixtures
fixture-backed workflows
fixture-backed project states
```

A successfully authenticated production identity should therefore not enter `/demo` as its normal landing page.

The new separation is:

```text
/demo
    |
    +-- fixture/prototype/golden scenarios
    +-- deterministic UI regression material

/home
    |
    +-- real Better Auth session
    +-- real user name/email
    +-- production-shaped application shell
    +-- real project state when that backend exists
    +-- currently: empty project library
```

This keeps the backend transition explicit rather than making a real identity appear to own fixture projects.

---

# 2. Target Runtime Flow

```text
/sign-in
   |
   +-- email
   +-- password
   |
   v
POST /api/auth/sign-in/email
   |
   v
existing Atlas auth route
   |
   v
@atlas/auth
   |
   v
Better Auth
   |
   +-- verify existing credentials
   +-- persist/establish auth.session
   +-- return Better Auth Set-Cookie
   |
   v
authenticated browser
   |
   v
/home
   |
   +-- resolve current Better Auth session
   |
   +-- user.name
   +-- user.email
   |
   v
production-shaped Atlas project-library shell
   |
   v
projects = []
```

No fixture identity is used.

No fixture project is treated as belonging to the authenticated user.

---

# 3. Authentication Authority

The existing architecture remains authoritative:

```text
Better Auth
    |
    +-- identity
    +-- email/password credentials
    +-- users
    +-- accounts
    +-- sessions
    +-- session cookies

Atlas
    |
    +-- project authorization
    +-- memberships
    +-- workspace access
    +-- roles
    +-- trusted project state
```

The implementation must preserve:

> Better Auth establishes identity. Atlas establishes authorization.

A successful login only answers:

```text
Who is this browser?
```

It does not answer:

```text
Which projects can this user access?
What project role does this user have?
Which workspaces can this user open?
```

Those remain later Atlas responsibilities.

---

## 3.1 Approved Better Auth foundation

The sign-in implementation consumes the existing authentication foundation rather than recreating it.

`packages/atlas-auth` already creates Better Auth using:

```text
Better Auth 1.6.32
Drizzle adapter
PostgreSQL
emailAndPassword.enabled = true
```

Its persistence boundary is already:

```text
auth.user
auth.session
auth.account
auth.verification
```

The application auth route is already mounted at:

```text
apps/atlas/app/api/auth/[...all]/route.ts
```

and delegates through:

```text
apps/atlas/lib/auth-server.ts
apps/atlas/lib/auth-route.ts
```

Use the existing Better Auth endpoint:

```text
POST /api/auth/sign-in/email
```

Do not duplicate Better Auth configuration, create a second auth route, query the auth tables directly from the browser, or add a new auth migration for sign-in.

The existing session lifecycle is:

```text
database-backed auth.session
        +
Better Auth session cookie
        +
/api/auth/get-session
```

No custom session identifier, cookie, or session service is required.

---

# 4. JWT Decision

JWT is not required for this phase.

The current Atlas browser architecture already has:

```text
Better Auth session cookie
        +
PostgreSQL-backed auth.session
        +
Better Auth session lookup
```

Do not introduce:

```text
custom JWT
access token
refresh token
JWKS
Bearer token persistence
localStorage auth
sessionStorage auth
custom authentication cookie
```

The absence of JWT is intentional.

A JWT should be introduced only if a concrete future consumer cannot use the existing Better Auth session boundary.

---

# 5. Sign-In Form

The current `/sign-in` presentation remains useful but its primary action is still fixture behavior.

Replace:

```text
Sign in -> /demo
```

with a real form submission:

```text
SignInForm
   |
   +-- email
   +-- password
   |
   v
POST /api/auth/sign-in/email
```

Recommended implementation surface:

```text
apps/atlas/components/SignInForm.tsx
apps/atlas/components/sign-in-submission.ts
```

Keep `AuthScreen` as the shared presentation boundary.

The frontend may validate only obvious usability requirements:

```text
email present
email structurally valid
password present
```

Better Auth remains authoritative for credential correctness.

The browser request should be same-origin JSON with:

```text
Content-Type: application/json
credentials: same-origin
```

The form performs browser-level orchestration only: collect input, validate obvious requirements, prevent duplicate submission, submit, map bounded failures, and navigate after success. It must not become an authentication authority.

Application code must not compare password hashes, read stored password material, persist or log passwords, put passwords in URLs, store them in browser persistence, or send them to Agents Bridge or a model/provider.

---

# 6. Successful Sign-In

Success is:

```text
Better Auth credential verification succeeds
        |
        v
Better Auth session created/established
        |
        v
Set-Cookie returned
        |
        v
browser receives normal session cookie
        |
        v
navigate to /home
```

Do not navigate before the auth response succeeds.

Do not create a second session.

Do not synthesize authentication state in React.

---

# 7. `/home` Route

Add:

```text
apps/atlas/app/home/page.tsx
```

`/home` is the first production-shaped authenticated application route.

Its initial responsibility is deliberately narrow:

```text
resolve current authenticated session
        |
        +-- name
        +-- email
        |
        v
render the existing project-library visual shell
        |
        v
show zero production projects
```

The route must not obtain its identity from:

```text
query parameters
localStorage
fixture scenarios
hard-coded names
hard-coded emails
```

The authoritative user comes from the Better Auth session.

---

# 8. Session-Aware `/home`

`/home` must resolve the current Better Auth session using the existing server authentication boundary and request cookies/headers.

Conceptually:

```text
incoming /home request
        |
        v
request cookies
        |
        v
existing Atlas auth service
        |
        v
Better Auth session lookup
        |
        +-- session exists -> render home
        |
        +-- no session -> redirect /sign-in
```

This is a route-entry identity guard, not project authorization.

It is acceptable for `/home` to require an authenticated session because the route itself represents the authenticated application landing surface.

Do not interpret this as permission to implement global project/workspace route guards in this ticket.

---

# 9. Real User Identity in the Orange Profile Area

The orange-marked profile control currently receives fixture session data from `/demo`.

For `/home`, it must display:

```text
session.user.name
session.user.email
```

These are the same identity values persisted by the Better Auth account created during sign-up and returned again when that identity signs in.

Example:

```text
sign-up
name = "Nadia Hartono"
email = "nadia@example.com"

later sign-in
email = "nadia@example.com"
password = ...

Better Auth session
    |
    +-- user.name = "Nadia Hartono"
    +-- user.email = "nadia@example.com"

ProfileMenu
    |
    +-- Nadia Hartono
    +-- nadia@example.com
```

Do not carry the sign-up form values forward manually.

The database-backed Better Auth identity is the source of truth.

---

# 10. Do Not Invent a Project Role

The current UI types use:

```ts
{
  name: string;
  email: string;
  role: "owner" | "editor" | "viewer";
}
```

That shape is valid for fixture scenarios where project membership already exists.

It is not valid for a newly authenticated user with zero projects.

A new account has:

```text
identity
```

but does not yet have:

```text
project role
project membership
workspace role
```

Therefore `/home` must not invent:

```text
role = owner
```

merely to satisfy the current component type.

Recommended refactor:

```text
AuthenticatedUser
    name
    email

ProjectMembershipContext
    role
```

Keep project role separate from base authenticated identity.

For profile presentation, `name` and `email` are sufficient.

If `ProfileMenu` currently renders:

```text
owner access
editor access
viewer access
```

that project-role label should be omitted when no project membership context exists.

---

# 11. Empty Project Library

The blue-marked project area on `/home` should initially contain no project cards.

Desired state:

```text
projects = []
```

and the existing empty state may render:

```text
No projects yet
Create a project to begin reviewing your PRDs.
```

However, the current `ProjectLibrary` cannot be reused unchanged.

It currently contains fixture behavior:

```text
if no non-owner fixture scenario:
    fetch("/api/local-fixtures")
    populate cards
```

Therefore this would be wrong:

```tsx
<ProjectLibrary
  user={realUser}
  projects={[]}
/>
```

because the client can later hydrate fixture projects into the production `/home` screen.

The implementation must explicitly separate:

```text
fixture project-library mode
```

from:

```text
production project-library mode
```

---

# 12. Recommended ProjectLibrary Boundary

Do not fork the entire UI just to create `/home`.

Reuse the visual components, but make the data source explicit.

Representative direction:

```ts
type ProjectLibraryMode =
  | "fixture"
  | "production";
```

or an equivalent explicit contract.

Example:

```tsx
<ProjectLibrary
  mode="production"
  user={sessionUser}
  projects={[]}
/>
```

Production mode must not:

```text
fetch /api/local-fixtures
import fixture identity as runtime authority
hydrate fixture project cards
write fixture projects
create fixture memberships
share fixture projects
```

Fixture mode must preserve the current `/demo` behavior.

The goal is:

```text
shared presentation
different authority/data source
```

not:

```text
duplicated UI
```

---

# 13. Project Creation on `/home`

The current `ProjectLibrary` includes fixture-backed project creation.

It calls:

```text
createFixtureProject(...)
POST /api/local-fixtures
```

That must not become the implementation behind `/home`.

Until production project creation has its own backend context/ticket, `/home` must not use fixture project creation as if it were production behavior.

Therefore either:

```text
hide/disable + New project on production mode
```

or:

```text
render the control only if the upcoming production project-creation boundary is explicitly implemented
```

Do not let a real authenticated user create `/api/local-fixtures` records from `/home`.

This preserves the fixture-to-real migration discipline.

---

# 14. Project Sharing on `/home`

The current project-library sharing flow is fixture/local-state behavior.

With:

```text
projects = []
```

there are no share actions anyway.

Do not wire fixture memberships or fixture invitations into `/home`.

Project sharing remains a later production authorization feature.

---

# 15. AppShell Route Reuse

`AppShell` can be reused, but it currently hard-codes `/demo` in several places:

```text
Atlas brand href
Projects navigation href
project/workspace navigation helpers
```

For `/home`, the shell must not accidentally navigate the authenticated user back to `/demo`.

Make the application root/base route explicit.

Representative direction:

```tsx
<AppShell
  homeHref="/home"
  ...
/>
```

or:

```text
routeMode = fixture | production
```

For production home:

```text
Atlas brand -> /home
Projects -> /home
```

For `/demo`:

```text
Atlas brand -> /demo
Projects -> /demo
```

Do not globally replace `/demo`; preserve the fixture route.

---

# 16. Workspace Navigation on Empty Home

Because `/home` initially has:

```text
projects = []
selectedProject = none
workspace = none
```

the existing disabled behavior is appropriate:

```text
Main Workflow disabled
Project Facts disabled
CES Result disabled
Changes Done disabled
Sources disabled
```

This accurately represents:

```text
authenticated user
        +
no project selected
        +
no production projects
```

No fake project needs to be created to activate the navigation.

---

# 17. Search Bar

The existing search box may remain visible.

With zero projects:

```text
search result set = empty
```

It does not need backend search behavior in this ticket.

Do not add fixture search data merely to make the control appear functional.

---

# 18. Profile Menu and Logout Caveat

The current `ProfileMenu` contains:

```text
Logout -> /sign-in
```

but that link does not invalidate the Better Auth session.

That is acceptable in a fixture prototype but misleading on a real `/home` route.

Do not expose a fake logout action on `/home`.

For this ticket, choose one explicit behavior:

```text
hide/mark logout unavailable
```

unless sign-out is separately brought into scope.

If sign-out is implemented later, it must call the existing Better Auth:

```text
/api/auth/sign-out
```

and then navigate to `/sign-in`.

Simply linking to `/sign-in` is not sign-out.

---

# 19. `/demo` Remains Untouched as Fixture Authority

Do not delete `/demo`.

Do not convert it into `/home`.

Do not replace its scenario system.

`/demo` remains useful for:

```text
golden UI scenarios
stress fixtures
review fixtures
workflow fixtures
regression coverage
prototype state combinations
```

The architecture becomes:

```text
                 shared UI components
                 /                  \
                /                    \
           /demo                     /home
             |                         |
      fixture authority          real auth identity
      fixture projects           production projects
                                 currently []
```

This is the intended incremental transition.

---

# 20. Sign-Up Relationship

The completed SUS ticket set currently sends successful sign-up to `/demo`.

This sign-in/home implementation does not need to reopen the already-approved SUS set merely to implement correct sign-in.

However, once `/home` is accepted as the canonical authenticated landing page, the product direction should ultimately be:

```text
successful sign-up -> /home
successful sign-in -> /home
```

Changing the already-approved sign-up destination should be recorded as a small explicit follow-up scope change rather than silently modifying frozen SUS history.

The existing sign-up identity/session implementation itself remains valid.

---

# 21. Expected Files to Change

Primary sign-in surface:

```text
apps/atlas/components/AuthScreen.tsx
apps/atlas/components/SignInForm.tsx                 NEW
apps/atlas/components/sign-in-submission.ts          NEW
```

Authenticated home:

```text
apps/atlas/app/home/page.tsx                         NEW
```

Shared UI boundaries likely requiring production-safe reuse:

```text
apps/atlas/components/AppShell.tsx
apps/atlas/components/ProfileMenu.tsx
apps/atlas/components/ProjectLibrary.tsx
```

Potential supporting shared identity type:

```text
apps/atlas/... authenticated-user type or equivalent
```

Potential tests:

```text
apps/atlas/tests/auth-sign-in.integration.test.mjs   NEW
apps/atlas/tests/auth-home.integration.test.mjs      NEW/equivalent
apps/atlas/tests/rendered-html.test.mjs              UPDATE IF REQUIRED
```

Infrastructure that should normally remain unchanged:

```text
apps/atlas/lib/auth-server.ts
apps/atlas/lib/auth-route.ts
apps/atlas/app/api/auth/[...all]/route.ts
packages/atlas-auth/src/index.ts
Better Auth schema/migrations
```

---

# 22. Sign-In Validation

Use a unique temporary user.

Recommended flow:

```text
create identity through approved Better Auth sign-up boundary
        |
        v
discard setup session
        |
        v
POST /api/auth/sign-in/email
        |
        v
assert success
        |
        v
assert Better Auth Set-Cookie
        |
        v
get-session using returned cookie
        |
        v
assert same user name/email
```

Invalid credentials must:

```text
not redirect to /home
not establish authenticated success
not create another user
not expose password
not expose database/internal errors
```

---

# 23. `/home` Validation

A focused route/component test should prove:

```text
authenticated session
        |
        v
/home renders
        |
        +-- real session user name
        +-- real session user email
        +-- zero project cards
        +-- empty project state
```

Also prove that `/home` does not:

```text
hydrate /api/local-fixtures
display fixture projects
display fixture session identity
invent project membership
invent project role
```

An unauthenticated `/home` request should not render authenticated application identity.

It should return/redirect to the public sign-in flow according to the route strategy chosen by the implementation.

---

# 24. Acceptance Criteria

## AC-01 - Real sign-in

`/sign-in` authenticates existing email/password credentials through the approved Better Auth boundary.

## AC-02 - Better Auth session

Successful sign-in establishes the normal Better Auth PostgreSQL-backed browser session.

## AC-03 - Home destination

Successful sign-in navigates to:

```text
/home
```

not `/demo`.

## AC-04 - Session-owned identity

`/home` obtains the displayed user from the current Better Auth session.

## AC-05 - Real profile data

The profile area displays the authenticated user's persisted:

```text
name
email
```

## AC-06 - No fake role

`/home` does not synthesize owner/editor/viewer project membership for a user with no project context.

## AC-07 - Empty production project state

A newly authenticated user with no production project persistence sees zero project cards.

## AC-08 - No fixture hydration

`/home` does not fetch or populate `/api/local-fixtures`.

## AC-09 - No fixture project mutations

`/home` cannot create/share/update fixture projects as production state.

## AC-10 - Shared UI reuse

The authenticated route reuses the established project-library shell/components rather than cloning the demo UI wholesale.

## AC-11 - Demo isolation

`/demo` remains a separate fixture/golden-scenario route.

## AC-12 - Production navigation

Brand/project navigation rendered inside `/home` does not send the user into `/demo`.

## AC-13 - No JWT expansion

No JWT/access-token/refresh-token browser architecture is introduced.

## AC-14 - No project authorization invention

Authentication does not create project membership, workspace access, role, ownership, Master, or Initial Draft state.

## AC-15 - Existing foundations remain green

BSS-004, completed SUS behavior, build, CSP, and directly affected tests remain valid.

---

# 25. Explicit Non-Goals

Do not implement as part of this context:

```text
production project persistence
production project creation
production project sharing
project membership
RBAC
workspace authorization
real Main Workflow data
real Project Facts data
real CES data
real Changes Done data
JWT/JWKS
OAuth
MFA
password reset
email verification
global session management UI
Agents Bridge authentication changes
Mistral integration
```

---

# 26. Recommended Implementation Order

```text
1. Preserve approved BSS/SUS auth foundation
        |
        v
2. Add SignInForm + sign-in submission helper
        |
        v
3. Authenticate through /api/auth/sign-in/email
        |
        v
4. Add /home server route
        |
        v
5. Resolve Better Auth session on /home
        |
        v
6. Refactor shared user presentation to name/email without fake project role
        |
        v
7. Add explicit production mode/data-source boundary to ProjectLibrary
        |
        v
8. Prevent /api/local-fixtures hydration in production mode
        |
        v
9. Prevent fixture create/share behavior in production mode
        |
        v
10. Make AppShell root navigation aware of /home vs /demo
        |
        v
11. Render /home with real user + projects=[]
        |
        v
12. Redirect successful sign-in to /home
        |
        v
13. Add sign-in and authenticated-home tests
        |
        v
14. Run existing auth/app/CSP/fixture regressions
```

---

# 27. Non-Negotiable Guardrails

> `/demo` is fixture authority; `/home` is the production-shaped authenticated landing surface.

> Better Auth owns identity and session state.

> The authenticated user's name/email come from Better Auth session identity, not from fixtures or browser persistence.

> A user identity is not a project membership.

> Do not invent `owner`, `editor`, or `viewer` solely to make current UI types compile.

> `projects = []` on `/home` must remain truly empty; fixture auto-hydration is forbidden.

> Reuse presentation components, not fixture authority.

> A production-authenticated user must never silently inherit fixture projects.

> JWT is unnecessary for the current browser/session architecture.

> Successful sign-in enters `/home`, not `/demo`.

---

# 28. Definition of Done

The implementation should be explainable in one sentence:

> An existing Atlas user can sign in through the approved Better Auth boundary, land on `/home` with their real session-backed name and email, and see the established Atlas project-library shell in a genuinely empty production state without fixture projects, fake project roles, custom JWTs, or invented Atlas authorization.
