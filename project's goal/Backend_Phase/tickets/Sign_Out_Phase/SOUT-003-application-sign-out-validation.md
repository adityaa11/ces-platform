# SOUT-003: Application sign-out validation

- **State:** `planned`
- **Review batch:** `SOUT-BATCH-03`
- **Depends on:** SOUT-001 `PASS`, SOUT-002 `PASS`
- **Baseline:** [Sign-Out Implementation Context](../../atlas-sign-out-implementation-context.md) §§3–4, 10, 13–18, 20–25; [BSS-004 Better Auth persistence](../Stack_Setup/BSS-004-better-auth-persistence.md); [Backend Phase README](../../README.md) lifecycle and authority rules; AC-01, AC-08–AC-12, AC-14, and AC-15

## Outcome

Prove the complete browser-facing production sign-out path against the existing Better Auth persistence boundary. The evidence must show that the current session is invalidated before `/sign-in` navigation, `/home` rejects the old session afterward, and the Better Auth account and Atlas/fixture authorities remain intact.

## Scope

- Add `apps/atlas/tests/auth-sign-out.integration.test.mjs` or extend the existing auth/home integration file when that keeps one coherent application lifecycle test.
- Create a unique temporary Better Auth user through the approved test setup, establish a real session through the existing application sign-in route, and request `/home` with that session.
- Assert the production account menu contains the real `Sign out` button and no navigation-only logout link.
- Exercise `POST /api/auth/sign-out` with the established session cookie/identifier through the mounted application route and assert a successful response.
- Reuse the old session cookie/identifier to assert `/api/auth/get-session` returns no current session and `/home` redirects to `/sign-in`.
- Verify the user/account remains present until test cleanup; cleanup may touch only the unique temporary identity through the existing test-only database boundary.
- Update the existing production-home regression deliberately if needed: replace the old “no fake Logout” assertion with positive proof of the real button and absence of the old link.
- Keep the package-level `packages/atlas-auth/tests/lifecycle.test.ts` unchanged; it remains the BSS-004 proof of persistence and session invalidation.
- Do not add a production admin cleanup route, direct app-side session deletion, project-state queries/writes, fixture identity use, or test-only shortcuts that bypass the application auth route.

## Acceptance criteria

- A unique temporary user can sign in through the existing application route and receive a normal Better Auth session cookie.
- The authenticated `/home` response contains the real production `Sign out` control and no navigation-only logout link.
- The application-facing `POST /api/auth/sign-out` succeeds for the current session.
- The old session no longer resolves through `/api/auth/get-session`, and `/home` with the old session redirects to `/sign-in`.
- The Better Auth user/account remains intact until test cleanup; sign-out does not delete or mutate the account.
- No Atlas project, workspace, membership, role, permission, Master, Initial Draft, publication, or fixture state is created, deleted, or changed by sign-out.
- The existing BSS-004 lifecycle test remains unchanged and passing; application evidence complements rather than replaces it.
- Test cleanup is unique-user, test-only, and does not add production authority.

## Validation

- Start the supported PostgreSQL environment with `docker compose up -d postgres`, confirm `docker compose ps` reports `healthy`, and run the application integration test in the Compose-built Atlas container.
- Run the application test suite with `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/app test`; retain the sign-out integration evidence and explicit test counts.
- Run the unchanged `@atlas/auth` lifecycle test with `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/auth test` and retain evidence for durable session invalidation.
- Run the directly affected app build and rendered HTML/CSP checks in the same clean Compose environment.
- If Docker is unavailable, report the exact limitation; do not replace the integration proof with a fixture-only test or treat `docker compose ps` alone as validation.
- Verify the test asserts session invalidation before or independently of navigation and does not inspect secrets or emit cookie values.
- Inspect the final diff for direct auth-table queries in app code, production cleanup paths, project/fixture writes, account deletion, and weakened assertions.

## Security Refactor Readiness

Status: applicable

### Inherited boundaries

- `BOUNDARY-SOUT-003-01` BSS-004 owns durable Better Auth identity/session persistence and package-level invalidation proof.
- `BOUNDARY-SOUT-003-02` The application route is a browser-facing adapter; Atlas project authorization and `@atlas/fixtures` remain separate authorities.

### Trust boundaries

- `TRUST-SOUT-003-01` The integration test measures browser-shaped application traffic through the mounted auth handler rather than calling a private database/session API.
- `TRUST-SOUT-003-02` Test-only cleanup is isolated from production authority and is limited to the unique temporary identity.

### Sensitive assets and identity context

- `ASSET-SOUT-003-01` Temporary credentials, session cookies, auth secrets, database connection details, and raw auth headers must not appear in logs or assertions.
- `IDENTITY-SOUT-003-01` Evidence must bind sign-out to the same session-backed user while proving the account remains after session invalidation.

### Required seams

- `SEAM-SOUT-003-01` Application-level integration evidence covers route/menu/navigation behavior while BSS-004 remains the persistence/lifecycle proof.
- `SEAM-SOUT-003-02` Unique-user cleanup remains outside application auth authority so production behavior stays session-only.

### Prohibited couplings

- `COUPLING-SOUT-003-01` Do not weaken, replace, or duplicate the BSS-004 lifecycle test as a shortcut for application validation.
- `COUPLING-SOUT-003-02` Do not use sign-out validation to add account deletion, project cleanup, fixture cleanup, route-wide authorization, or another auth mechanism.

### Intentionally unresolved security policy

- `SEC-GAP-SOUT-003-01` Global device/session management, abuse controls, recovery, MFA, authorization, and the full security baseline remain future work.

### Mandatory review bindings

- `REV-READY-SOUT-003-01`
  Ref: `SEAM-SOUT-003-01`
  Question: Does application evidence exercise the mounted sign-out route, production menu, session invalidation, and `/home` protection while preserving BSS-004?
  Evidence: integration test, package lifecycle result, and command output.
- `REV-READY-SOUT-003-02`
  Ref: `SEAM-SOUT-003-02`
  Question: Is cleanup isolated to the unique temporary identity and kept out of production auth/project authority?
  Evidence: cleanup code and test-database boundary.
- `REV-READY-SOUT-003-03`
  Ref: `COUPLING-SOUT-003-02`
  Question: Does sign-out change only current authentication state and leave account, Atlas state, and fixture state untouched?
  Evidence: negative assertions, changed-file review, and database/test evidence.

## Review checkpoint

- **Review question:** Does the browser-facing flow invalidate the current Better Auth session, preserve the account, and protect `/home` after sign-out?
- **Combined acceptance:** A unique user signs in through the application, the real production control is present, the approved POST invalidates the old session, `/home` rejects it afterward, the account survives until cleanup, and no Atlas/fixture authority is mutated.
- **Implementation checkpoint:** No implementation is authorized yet. Record the commit when `SOUT-BATCH-03` enters `awaiting_review`.
