# Atlas Sign-Up Implementation Context

## Status

This document defines the implementation context for wiring the existing Atlas `/sign-up` route to the production-shaped authentication foundation already established in `codex/new-atlas-backend`.

This is an implementation context, not a redesign of authentication architecture.

The implementation must build on the approved Better Auth foundation established by BSS-004 and preserve the architecture boundaries defined by:

- `project's goal/Backend_Phase/atlas-backend-production-baseline-mistral-synced.md`
- `project's goal/Backend_Phase/atlas-core-architecture-checkpoint-v2-mistral-enriched-v2.md`

The central rule for this work is:

> Sign-up establishes user identity and a durable authenticated session. It does not establish Atlas project authorization or create Atlas project state.

This context is intentionally limited to sign-up only.

Sign-in, sign-out UI, password reset, route protection, and authorization flows are outside this implementation scope.

---

# 1. Architectural References

## 1.1 Production baseline

The backend production baseline establishes:

> Better Auth establishes identity.

It also establishes the separation:

```text
PostgreSQL

auth.*
+-- user
+-- session
+-- account
+-- verification

atlas.*
+-- project
+-- project_member
+-- workspace
+-- revisions
+-- knowledge
+-- approval
+-- publication
```

Therefore:

```text
Better Auth
    |
    v
Identity

Atlas
    |
    v
Authorization + Project State
```

These responsibilities must remain separate.

The production baseline explicitly establishes:

> Better Auth continues to own authentication persistence; Atlas owns project authorization.

Sign-up must therefore terminate at authenticated identity/session establishment.

It must not silently create:

```text
atlas.project
atlas.project_member
atlas.workspace
workspace membership
project roles
project permissions
fixture-backed project ownership
Master
Initial Draft
```

Those belong to later Atlas application flows.

## 1.2 Core architecture checkpoint

The core architecture checkpoint keeps authorization and trusted state under Atlas authority.

Authentication is therefore a prerequisite for later Atlas operations, not a mechanism that grants project authority by itself.

The intended boundary remains:

```text
User
 |
 v
Authentication
 |
 v
Identity Established
 |
 v
Atlas Authorization
 |
 v
Authorized Project Operations
```

This implementation covers only:

```text
User
 |
 v
Authentication
 |
 v
Identity Established
```

The implementation must not collapse authentication and authorization into one operation.

---

# 2. Existing Approved Foundation

BSS-004 has already established the authentication persistence foundation.

The implementation currently provides:

```text
packages/atlas-auth
```

with:

```ts
createAtlasAuth(...)
createAtlasAuthFromEnvironment(...)
```

Better Auth is already configured with:

```ts
emailAndPassword: {
  enabled: true
}
```

and uses the existing Drizzle-backed PostgreSQL adapter.

Authentication persistence already targets:

```text
auth.user
auth.session
auth.account
auth.verification
```

The database migration already exists:

```text
packages/atlas-db/migrations/0001_bss004_better_auth.sql
```

The existing BSS-004 lifecycle test already proves:

```text
sign-up
    |
    v
user persisted
    |
    v
session created
    |
    v
application service recreated
    |
    v
session remains valid
    |
    v
sign-out
    |
    v
session invalidated
```

Therefore this feature must reuse the existing authentication service.

Do not create another authentication implementation inside `apps/atlas`.

Do not duplicate Better Auth configuration.

Do not create separate user/session tables.

Do not introduce fixture-backed authentication.

---

# 3. Current UI State

The existing route is:

```text
apps/atlas/app/sign-up/page.tsx
```

and currently renders:

```tsx
<AuthScreen mode="sign-up" />
```

The current shared component is:

```text
apps/atlas/components/AuthScreen.tsx
```

The current sign-up screen visually contains:

```text
Email
Password
Create account
```

but it does not submit an authentication request.

The current action is effectively:

```text
Create account
    |
    v
/demo
```

because the button is implemented as a navigation link.

Therefore the current route represents only a UI fixture.

No account is created.

No session is established.

No request reaches `@atlas/auth`.

---

# 4. Implementation Objective

Replace the fixture-only sign-up behavior with:

```text
/sign-up
   |
   v
User enters account information
   |
   v
Submit
   |
   v
Atlas auth HTTP boundary
   |
   v
@atlas/auth
   |
   v
Better Auth
   |
   v
Drizzle adapter
   |
   v
PostgreSQL auth.*
   |
   +-- user
   |
   +-- account
   |
   +-- session
   |
   v
Authenticated browser session
   |
   v
/demo
```

The existing `/demo` destination may remain the immediate post-sign-up destination for this implementation.

The destination does not imply that `/demo` has become authorization-protected.

Route protection is outside this implementation context.

---

# 5. Required Sign-Up Fields

The existing Better Auth email sign-up contract requires:

```text
name
email
password
```

The current sign-up UI only provides:

```text
email
password
```

Therefore the sign-up form must add:

```text
Name
```

Do not generate an artificial name from:

```text
email local-part
random IDs
"Atlas User"
empty strings
```

The identity record should contain a user-provided name.

Expected form:

```text
Name
[________________________]

Email
[________________________]

Password
[________________________]

[ Create account ]
```

---

# 6. Authentication HTTP Boundary

Atlas currently has the authentication package but does not expose it through the web application's route surface.

Create an Atlas application authentication route using the existing `@atlas/auth` service.

Recommended route:

```text
apps/atlas/app/api/auth/[...all]/route.ts
```

The route must delegate requests into the existing Better Auth handler.

Conceptually:

```text
Browser
   |
   v
/api/auth/*
   |
   v
Atlas route handler
   |
   v
@atlas/auth
   |
   v
Better Auth handler
```

The route must not contain authentication business logic.

Its responsibility is adaptation only.

Conceptually:

```text
request
   |
   v
auth.handler(request)
   |
   v
response
```

The existing BSS-004 lifecycle test already exercises the same underlying handler directly.

The web route should expose that existing handler rather than reproduce its behavior.

Although mounting the Better Auth catch-all route may make other Better Auth endpoints technically reachable, this implementation must wire and validate only the sign-up flow.

Do not implement sign-in UI behavior as part of this work.

---

# 7. Server Authentication Instance

The application should create the Better Auth service once at the application/server boundary.

Suggested location:

```text
apps/atlas/lib/auth-server.ts
```

Conceptually:

```ts
import { createAtlasAuthFromEnvironment } from "@atlas/auth";

const service = createAtlasAuthFromEnvironment();

export const auth = service.auth;
```

The important invariant is:

> Do not construct a new database/auth service for every HTTP request.

The route handler should consume the shared server-side auth instance.

Example responsibility boundary:

```text
auth-server.ts
    |
    +-- configuration
    +-- auth service lifetime

route.ts
    |
    +-- HTTP delegation only
```

Do not expose `auth-server.ts` to client components.

---

# 8. Application Package Dependency

`apps/atlas` currently does not depend directly on:

```text
@atlas/auth
```

Add the workspace dependency:

```json
"@atlas/auth": "workspace:*"
```

to:

```text
apps/atlas/package.json
```

Do not duplicate Better Auth configuration inside `apps/atlas`.

The dependency direction should remain:

```text
apps/atlas
    |
    v
@atlas/auth
    |
    v
@atlas/db
```

not:

```text
apps/atlas
    |
    +--> Better Auth database configuration
    |
    +--> auth table definitions
    |
    +--> direct auth database queries
```

---

# 9. Client Sign-Up Form

Create a dedicated client-side sign-up component.

Suggested file:

```text
apps/atlas/components/SignUpForm.tsx
```

This component owns browser interaction only:

```text
field state
submission state
request
success redirect
user-facing error state
```

It must not contain database logic or project logic.

The component should submit:

```http
POST /api/auth/sign-up/email
Content-Type: application/json
```

with:

```json
{
  "name": "...",
  "email": "...",
  "password": "..."
}
```

The browser should use the same-origin Better Auth endpoint.

Successful Better Auth sign-up will establish the session using the authentication cookie returned by the server.

Do not store authentication tokens manually in:

```text
localStorage
sessionStorage
React state
URL parameters
custom cookies
```

Cookie/session lifecycle remains Better Auth's responsibility.

---

# 10. AuthScreen Integration

Keep `AuthScreen` as the shared authentication-page presentation boundary.

Do not turn sign-up implementation into a rewrite of:

```text
/sign-in
/reset-password
```

The implementation should make sign-up behavior mode-specific.

Conceptually:

```tsx
<AuthScreen mode="sign-up">
  <SignUpForm />
</AuthScreen>
```

or an equivalent internal composition.

The important requirement is:

```text
sign-up
    -> real form submission

sign-in
    -> existing behavior unchanged

reset-password
    -> existing behavior unchanged
```

unless a small structural refactor is required to make the shared component cleaner.

Do not wire sign-in or password reset as part of this task.

---

# 11. Submit Behavior

Expected lifecycle:

```text
Idle
 |
 v
User completes form
 |
 v
Submit
 |
 v
Submitting
 |
 +-- disable submit control
 |
 +-- prevent duplicate submission
 |
 v
POST /api/auth/sign-up/email
 |
 +-----------------------+
 |                       |
 v                       v
Success                 Failure
 |                       |
 v                       v
session cookie       show safe error
 |                       |
 v                       v
redirect /demo       remain /sign-up
```

The button must be a real form submission control:

```html
<button type="submit">
```

not a navigation link.

---

# 12. Successful Sign-Up

A sign-up is successful only after the authentication endpoint returns success.

Then:

```text
response accepted
    |
    v
Better Auth session cookie established
    |
    v
navigate to /demo
```

Do not navigate to `/demo` before receiving a successful response.

Do not treat UI submission alone as account creation.

Do not create a second custom session after Better Auth succeeds.

---

# 13. Error Handling

Authentication failures must remain user-facing but bounded.

Examples include:

```text
invalid input
password policy failure
email already registered
database/authentication failure
invalid request origin
unexpected server failure
```

The UI should:

```text
remain on /sign-up
stop loading state
restore submit availability
display a concise error message
```

Do not display:

```text
database connection strings
SQL messages
stack traces
internal exception names
auth secrets
raw environment configuration
```

A safe generic fallback is acceptable:

```text
We couldn't create your account. Check your details and try again.
```

More specific validation feedback may be displayed when the response safely represents a user-correctable input error.

---

# 14. Client Validation

Client validation improves UX but is not authoritative.

At minimum:

```text
name required
email required
valid email input type
password required
```

The server/Better Auth contract remains authoritative.

Do not reproduce a second independent authentication rule engine in the frontend.

The browser may use HTML semantics such as:

```html
required
autocomplete="name"
autocomplete="email"
autocomplete="new-password"
```

---

# 15. Security Boundaries

This implementation must preserve the security assumptions already established by BSS-004.

## 15.1 Credentials

Never log:

```text
password
BETTER_AUTH_SECRET
session cookie
raw authentication headers
```

## 15.2 Trusted origins

Existing configuration already validates:

```text
BETTER_AUTH_URL
BETTER_AUTH_TRUSTED_ORIGINS
```

Do not bypass this validation for development convenience.

## 15.3 Password handling

Passwords must flow directly:

```text
browser
   |
   v
Better Auth endpoint
   |
   v
Better Auth password handling
```

Atlas application code must not persist or hash passwords independently.

## 15.4 Session handling

Session state remains owned by Better Auth.

Atlas must not introduce:

```text
custom JWTs
duplicate session tables
frontend bearer-token persistence
fixture session identities
```

for this implementation.

## 15.5 Authorization

Successful authentication means:

```text
this user has an authenticated identity
```

It does not mean:

```text
this user owns every project
this user can access Safara
this user is an editor
this user belongs to Master
this user may publish
this user may approve changes
```

Those are Atlas authorization decisions.

---

# 16. Project Creation Boundary

Sign-up must not automatically create a project.

Correct separation:

```text
SIGN UP
User identity
    |
    v
Authenticated session
```

Later:

```text
NEW PROJECT
Authenticated identity
    |
    v
Atlas authorization checks
    |
    v
Create Atlas project state
```

Do not combine these flows.

This distinction is important because future users may enter Atlas through:

```text
self-registration
project invitation
organization invitation
shared project membership
administrative provisioning
```

Automatically coupling identity creation to project creation would make those flows harder to support.

---

# 17. Fixture Boundary

The production baseline establishes:

> Fixtures remain tests and golden scenarios, not production truth.

The `/demo` route may remain fixture-backed.

However, sign-up identity must be real.

Therefore the temporary mixed state is acceptable:

```text
Real authentication identity
        |
        v
Fixture-backed demo UI
```

as long as the implementation does not pretend fixture project identities or memberships were created by sign-up.

This feature is the transition from:

```text
fixture account entry
```

to:

```text
real identity entry
```

without prematurely replacing the rest of the fixture-driven application.

---

# 18. Files Expected to Change

Primary implementation surface:

```text
apps/atlas/package.json

apps/atlas/app/api/auth/[...all]/route.ts       NEW

apps/atlas/lib/auth-server.ts                   NEW

apps/atlas/components/SignUpForm.tsx            NEW

apps/atlas/components/AuthScreen.tsx
```

Potential test updates:

```text
apps/atlas/tests/rendered-html.test.mjs
```

Potential additional integration test:

```text
apps/atlas/tests/auth-sign-up.test.mjs
```

or an equivalent test location consistent with the current repository test strategy.

Do not modify unless a demonstrated implementation requirement exists:

```text
packages/atlas-auth/src/index.ts
packages/atlas-db authentication schema
0001_bss004_better_auth.sql
Atlas project/domain schemas
Agents Bridge
Atlas Core knowledge architecture
```

BSS-004 already owns the authentication foundation.

This feature should consume it.

---

# 19. Expected Repository Shape

After implementation:

```text
apps/atlas
|
+-- app
|   |
|   +-- api
|   |   |
|   |   +-- auth
|   |       |
|   |       +-- [...all]
|   |           |
|   |           +-- route.ts
|   |
|   +-- sign-up
|       |
|       +-- page.tsx
|
+-- components
|   |
|   +-- AuthScreen.tsx
|   |
|   +-- SignUpForm.tsx
|
+-- lib
    |
    +-- auth-server.ts
```

Authentication ownership remains:

```text
packages/atlas-auth
```

Persistence ownership remains:

```text
packages/atlas-db
```

---

# 20. Runtime Flow

The complete sign-up request path should be easy to explain:

```text
Browser
  |
  | GET /sign-up
  v
Atlas Web App
  |
  v
SignUpForm
  |
  | POST /api/auth/sign-up/email
  v
Atlas Auth Route
  |
  v
@atlas/auth
  |
  v
Better Auth
  |
  v
Drizzle Adapter
  |
  v
PostgreSQL
  |
  +-- auth.user
  +-- auth.account
  +-- auth.session
  |
  v
Set-Cookie
  |
  v
Browser authenticated
  |
  v
/demo
```

There should be no path through:

```text
Agents Bridge
Mistral
Atlas reasoning skills
document processing
Atlas project truth
workspace revisions
```

Authentication is deterministic application infrastructure and requires no model reasoning.

---

# 21. Validation Strategy

Validation must cover both the already-tested auth foundation and the newly introduced sign-up application wiring.

## 21.1 Existing authentication lifecycle

The existing `@atlas/auth` lifecycle test must continue to pass.

It already proves:

```text
sign-up persists user
session is durable
session lookup succeeds
sign-out invalidates session
```

Do not weaken or replace that test.

The fact that the existing package-level lifecycle test also exercises sign-out does not expand this implementation scope. Sign-out UI wiring remains out of scope.

## 21.2 Sign-up page rendering

The rendered `/sign-up` route should still return successfully.

Verify that the page contains:

```text
Create your Atlas account
Name
Email
Password
Create account
```

Verify the page no longer implements the create-account action as:

```html
<a href="/demo">
```

The create-account control must submit the form.

## 21.3 Application auth endpoint

An application-level integration test should prove that the browser-facing route reaches the existing Better Auth service.

Conceptually:

```text
POST /api/auth/sign-up/email
        |
        v
200 success
        |
        v
Set-Cookie exists
        |
        v
GET /api/auth/get-session
        |
        v
same user returned
```

Session lookup is used here only to verify the result of sign-up.

It does not mean session-aware UI or route protection are included in this task.

Use a unique test email and clean up the temporary user after the test.

Do not depend on a fixed reusable test identity.

## 21.4 Failure path

At minimum verify:

```text
invalid payload does not redirect
failed sign-up does not behave as authenticated success
password is never rendered in error output
server error details are not exposed to the browser
```

## 21.5 Existing UI suite

The current rendered HTML/CSP suite must continue passing.

Sign-up implementation must not weaken the existing CSP requirements.

In particular, do not solve authentication by introducing:

```text
inline script injection
unsafe-eval
unsafe-inline
external authentication scripts
```

The existing same-origin application architecture does not require them.

---

# 22. Acceptance Criteria

## AC-01 - Real account creation

Submitting `/sign-up` creates a user through the existing `@atlas/auth` Better Auth service.

## AC-02 - Durable persistence

The user is persisted in the existing:

```text
auth.user
```

schema boundary.

No new user table is introduced.

## AC-03 - Session establishment

Successful sign-up establishes a Better Auth session and returns its normal session cookie.

## AC-04 - Post-sign-up navigation

The browser navigates to:

```text
/demo
```

only after sign-up succeeds.

## AC-05 - Required identity fields

The UI collects:

```text
name
email
password
```

and does not synthesize fake identity data.

## AC-06 - Safe failure behavior

Failed account creation:

```text
does not redirect
does not create fake authenticated state
does not expose internal server details
allows the user to retry
```

## AC-07 - Authentication ownership

No authentication persistence is added outside the established Better Auth / `auth.*` boundary.

## AC-08 - Authorization separation

Sign-up does not create:

```text
project membership
workspace membership
project role
project permissions
project ownership
```

## AC-09 - No architecture regression

The implementation does not modify or weaken:

```text
Atlas trusted-state authority
Agents Bridge isolation
DocumentStore boundaries
reasoning boundaries
revision semantics
publication semantics
```

## AC-10 - Existing auth lifecycle remains valid

The existing BSS-004 lifecycle tests continue to pass.

## AC-11 - Existing frontend checks remain valid

The application builds and the current rendered HTML/CSP tests continue to pass.

## AC-12 - Scope remains sign-up only

The implementation must not wire:

```text
/sign-in
/reset-password
sign-out UI
route guards
project authorization
```

even if the mounted Better Auth backend handler technically exposes supporting auth endpoints.

---

# 23. Explicit Non-Goals

Do not implement as part of this context:

```text
sign-in UI wiring
sign-out UI
password reset wiring
email verification
OAuth / social login
project creation
workspace creation
project membership
RBAC
route protection
invitation acceptance
organization support
profile editing
multi-factor authentication
session-management UI
Agents Bridge integration
Mistral integration
```

Each should be independently scoped when required.

---

# 24. Implementation Order

Recommended implementation sequence:

```text
1. Add @atlas/auth dependency to apps/atlas
        |
        v
2. Add server auth singleton/boundary
        |
        v
3. Mount /api/auth/[...all]
        |
        v
4. Add SignUpForm client component
        |
        v
5. Add Name field
        |
        v
6. Replace /demo link behavior with submit behavior
        |
        v
7. Redirect after successful session creation
        |
        v
8. Add failure/loading UX
        |
        v
9. Add/adjust sign-up tests
        |
        v
10. Run auth + app validation suites
```

Do not start by changing the database schema.

The database/auth foundation already exists.

Do not wire sign-in as part of step 3. The catch-all route is infrastructure reuse, not permission to expand UI scope.

---

# 25. Non-Negotiable Guardrails

The implementation must preserve these invariants:

> Better Auth establishes identity. Atlas establishes authorization.

> Authentication persistence belongs to `auth.*`; Atlas project state belongs to `atlas.*`.

> Signing up is not equivalent to joining or creating a project.

> The browser never owns authentication truth.

> Session cookies remain controlled by Better Auth.

> Passwords are never persisted, logged, or transformed by Atlas application code.

> The existing BSS-004 authentication foundation is consumed, not reimplemented.

> Fixtures may remain behind `/demo`, but identity entering through `/sign-up` becomes real.

> This implementation wires sign-up only. Sign-in remains a separate implementation task.

---

# 26. Definition of Done

The implementation should be explainable in one sentence:

> The existing Atlas sign-up screen now creates a real Better Auth identity and durable PostgreSQL-backed session through the approved BSS-004 boundary, then enters the existing demo surface without granting or inventing any Atlas project authorization.
