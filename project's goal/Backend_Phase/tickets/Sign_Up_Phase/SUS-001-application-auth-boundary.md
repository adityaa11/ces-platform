# SUS-001: Application authentication boundary

- **State:** `awaiting_review`
- **Review batch:** `SUS-BATCH-01`
- **Depends on:** BSS-004 `approved`
- **Baseline:** [Sign-Up Implementation Context](../../atlas-sign-up-implementation-context.md) §§1–2, 6–8, 15–17, 20–21, 25–26; [Backend Production Baseline](../../atlas-backend-production-baseline-mistral-synced.md) §§2–5, 12, 14, 21–22; [Core Architecture Checkpoint](../../atlas-core-architecture-checkpoint-v2-mistral-enriched-v2.md) core principle and cross-cutting authority boundary

## Outcome

Expose the already-approved `@atlas/auth` Better Auth service through the Atlas web application's server boundary so a browser request to `/api/auth/*` reaches the existing handler with its identity, cookie, origin, and error semantics intact.

## Scope

- Add `"@atlas/auth": "workspace:*"` to `apps/atlas/package.json`.
- Add the server-owned auth instance at `apps/atlas/lib/auth-server.ts` using `createAtlasAuthFromEnvironment()`.
- Add `apps/atlas/app/api/auth/[...all]/route.ts` as a thin adapter to the shared `auth.handler(request)` for the methods required by the mounted Better Auth catch-all route.
- Preserve Better Auth's existing trusted-origin validation, cookie/session lifecycle, and response headers; do not transform credentials or create a second session.
- Add focused boundary coverage or an equivalent test harness proving the route delegates to the established handler and does not instantiate a new database/auth service per request.

Do not add authentication business logic, direct auth-table queries, project authorization, project creation, fixture identities, custom JWTs, custom cookies, or client-facing UI behavior in this ticket.

## Acceptance criteria

- `apps/atlas` depends directly on `@atlas/auth`; it does not duplicate Better Auth configuration, schema definitions, migrations, or password/session handling.
- The server auth instance is constructed at the application/server boundary and is reusable by route handlers rather than created per request.
- `/api/auth/*` delegates to the existing Better Auth handler, including the sign-up endpoint needed by the next ticket.
- The adapter preserves normal Better Auth success/failure responses and `Set-Cookie` behavior without exposing secrets or raw server exceptions.
- The route creates no `atlas.project`, `atlas.project_member`, `atlas.workspace`, role, permission, or fixture-backed identity state.
- The existing `/sign-up`, `/sign-in`, `/reset-password`, and `/demo` routes remain renderable; no UI flow outside this ticket's server boundary is changed.

## Validation

- Run the app build and lint checks relevant to the changed server boundary.
- Exercise the route with a focused request-level test or equivalent harness using the existing auth configuration and verify that the response comes from the approved Better Auth service.
- When database-backed validation is available, prove the handler can return a normal sign-up response with a session cookie; cleanup must use a unique temporary identity and must not rely on a reusable test account.
- Confirm no new auth schema/table/migration or Atlas authorization write path is introduced.
- Keep the existing BSS-004 lifecycle test unchanged and passing; it remains the foundation proof for durable sessions and sign-out invalidation.

## Security Refactor Readiness

Status: applicable

### Inherited boundaries

- `BOUNDARY-SUS-001-01` Better Auth owns authentication persistence and identity/session lifecycle through the approved BSS-004 `auth.*` boundary.
- `BOUNDARY-SUS-001-02` Atlas owns project authorization and project state; this route is not an authorization grant.

### Trust boundaries

- `TRUST-SUS-001-01` Browser HTTP request crosses into the Atlas server route and then into the Better Auth handler.
- `TRUST-SUS-001-02` Server-controlled environment configuration crosses into the shared auth service; client input must not control secrets, database configuration, provider choice, or auth policy.

### Sensitive assets and identity context

- `ASSET-SUS-001-01` Passwords, session cookies, authentication headers, and Better Auth secrets are sensitive and must remain handler-controlled.
- `IDENTITY-SUS-001-01` Preserve request origin, cookies, headers, and response `Set-Cookie` semantics so later policy can bind to the authenticated session without a second token system.

### Required seams

- `SEAM-SUS-001-01` A single reusable server auth instance is the attachment point for later configuration, observability, and security policy.
- `SEAM-SUS-001-02` The route remains a narrow request-to-handler adapter so later policy can be reviewed at the HTTP boundary without rewriting authentication persistence.

### Prohibited couplings

- `COUPLING-SUS-001-01` Do not add direct database/auth-table access or a second Better Auth configuration in `apps/atlas`.
- `COUPLING-SUS-001-02` Do not introduce custom JWTs, bearer-token storage, custom session tables/cookies, project authorization, or fixture-backed identity state.

### Intentionally unresolved security policy

- `SEC-GAP-SUS-001-01` Additional abuse/rate-limit, account recovery, email verification, and broader security-baseline policy remain future work; this ticket preserves the attachment points without inventing that policy.

### Mandatory review bindings

- `REV-READY-SUS-001-01`
  Ref: `SEAM-SUS-001-01`
  Question: Does the implementation use one server-owned auth instance rather than constructing auth/database state per request?
  Evidence: server boundary code and focused request/build test.
- `REV-READY-SUS-001-02`
  Ref: `SEAM-SUS-001-02`
  Question: Does the route delegate to Better Auth without absorbing credential, session, or project-authorization logic?
  Evidence: route diff and request/response behavior.
- `REV-READY-SUS-001-03`
  Ref: `COUPLING-SUS-001-02`
  Question: Are custom token/session paths and project-state writes absent?
  Evidence: changed-file review plus auth/project boundary tests.

## Review checkpoint

- **Review question:** Does the Atlas web app expose the approved Better Auth handler through one server-owned boundary without duplicating authentication or taking project authority?
- **Combined acceptance:** The workspace dependency, shared server instance, and catch-all route are present; Better Auth owns credentials/session behavior; and no Atlas project state or custom auth persistence is introduced.
- **Commit to review:** `cdda74d` (`feat(auth): expose Better Auth application boundary`).
