# SIN-004: Sign-in to home end-to-end and regression validation

- **State:** `awaiting_review`
- **Review batch:** `SIN-BATCH-04`
- **Depends on:** SIN-001 `PASS`, SIN-002 `PASS`, SIN-003 `PASS`
- **Baseline:** [Sign-In and Authenticated Home Implementation Context](../../atlas-sign-in-home-implementation-context.md) §§21–28; [Backend Phase README](../../README.md) review and authority rules; BSS-004 lifecycle proof; completed SUS validation

## Outcome

Prove the complete browser-facing sign-in-to-home path against the existing Better Auth persistence foundation and freeze evidence that the new authenticated landing route does not leak fixture state, invent project authorization, add a token architecture, or regress the approved sign-up/demo/auth foundations.

## Scope

- Add or update an application-level integration test in the repository's current strategy, such as `apps/atlas/tests/auth-sign-in.test.mjs`, for `POST /api/auth/sign-in/email`.
- Create a unique temporary identity through the approved Better Auth sign-up boundary or established test setup, discard/setup-isolate any existing session, and sign in with the real email/password contract.
- Assert successful sign-in response, normal Better Auth `Set-Cookie`, a subsequent session lookup returning the same user name/email, and successful access to `/home` with that identity.
- Assert `/home` renders zero project cards and the empty state for a user without production project persistence.
- Assert `/home` does not request or populate `/api/local-fixtures`, create fixture records, expose fixture memberships, infer a project role, or expose project/workspace authorization.
- Assert invalid credentials remain a failure: no `/home` success navigation, no authenticated rendering, no new user, no password in output, and no raw internal error details.
- Assert `/demo` remains available as fixture authority and representative fixture scenarios still render/use their existing fixture data after the shared component changes.
- Keep cleanup test-only and limited to the unique temporary identity; do not add production cleanup/admin paths or fixed reusable test accounts.
- Run the existing `@atlas/auth` lifecycle test unchanged, the application build, rendered HTML/CSP suite, sign-up regression checks, fixture regressions, and directly affected tests.
- Record commands and evidence in the implementation checkpoint; do not add sign-out UI, password reset, route-wide authorization, project persistence, or unrelated fixture changes.

## Acceptance criteria

- A unique existing Better Auth user can sign in through the application route, receive a durable normal session cookie, and resolve the same identity through session lookup.
- Successful sign-in reaches `/home`, not `/demo`, and `/home` displays the persisted session name/email.
- A user with no production project persistence sees zero project cards and the established empty project state.
- The authenticated home flow does not fetch, hydrate, create, share, or mutate `/api/local-fixtures` state.
- No project membership, role, workspace access, ownership, Master, Initial Draft, or other Atlas authorization state is created by authentication or home rendering.
- Invalid credentials and representative failure paths remain bounded and retryable without raw internal details or password exposure.
- The existing BSS-004 lifecycle test remains the package-level proof for durable session/sign-out behavior and is not weakened, replaced, or duplicated as a shortcut.
- The approved sign-up behavior remains valid, including its current destination until a separate scope change is authorized.
- `/demo` remains a separate fixture/golden-scenario route and existing fixture regression evidence remains valid.
- No custom JWT, bearer token, refresh token, browser token persistence, custom cookie, OAuth, MFA, or new auth schema/migration is introduced.
- App build, strict CSP, rendered HTML, directly affected tests, and relevant lint/type checks pass.

## Validation

- Run the application-level integration test against supported local PostgreSQL/auth configuration. If the environment is unavailable, report that limitation; do not weaken the assertions or silently replace the integration test with a fixture-only test.
- Run the established `@atlas/auth` lifecycle test unchanged and confirm temporary identities are cleaned up.
- Run the app test/build command and retain sign-in, home, sign-up, rendered HTML, and CSP evidence.
- Exercise representative `/demo` fixture scenarios after shared component changes, including an empty-library scenario and a project-bearing scenario where the existing fixture behavior is expected.
- Inspect the final diff for direct auth-table queries in app code, password/hash handling, custom token/session persistence, fixture authority leakage, project writes, and unauthorized scope expansion.

### Checkpoint evidence

- `3af7950` (`test(auth): cover complete sign-in home flow`) expands the real-server Better Auth integration test to create a unique identity, sign in through `POST /api/auth/sign-in/email`, verify the returned cookie/session and `/home` identity, preserve a genuinely empty production library, bound invalid credentials, check anonymous `/home`, and confirm empty/project-bearing `/demo` fixture paths. Test-only cleanup deletes and then verifies removal of only the unique identity.
- `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/app test`: build completed; 17 tests passed, 0 failed, and the existing worker-runtime test was explicitly environment-gated.
- `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/auth test`: 3 tests passed, including the unchanged durable-session/sign-out lifecycle proof.
- `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/app lint`: the existing three unrelated lint errors in `RuntimeFixtureRoute.tsx` and `vite.config.ts` remain unchanged; this checkpoint does not modify either file.
- `git diff --check` passed before the implementation commit. The review checkpoint must identify the reviewed `HEAD`; do not mark the batch `PASS` from an uncommitted or fixture-only result.

## Security Refactor Readiness

Status: applicable

### Inherited boundaries

- `BOUNDARY-SIN-004-01` BSS-004 remains the authority for Better Auth identity/session persistence and lifecycle evidence.
- `BOUNDARY-SIN-004-02` Atlas project authorization and `@atlas/fixtures` demo/golden state remain outside authentication and `/home` identity rendering.

### Trust boundaries

- `TRUST-SIN-004-01` The integration test measures the application route from browser-shaped request through Better Auth to the session-backed home route.
- `TRUST-SIN-004-02` Test-only database cleanup is isolated from production app authority and touches only the unique temporary identity.

### Sensitive assets and identity context

- `ASSET-SIN-004-01` Test credentials, session cookies, database connection details, and auth secrets must not appear in logs or browser assertions.
- `IDENTITY-SIN-004-01` The evidence must bind the returned session to the same persisted user name/email without introducing a parallel identity representation.

### Required seams

- `SEAM-SIN-004-01` Application integration coverage exercises the browser-facing route while BSS-004 remains the persistence/session lifecycle proof.
- `SEAM-SIN-004-02` Negative assertions preserve the production/fixture and identity/authorization boundaries for future project work.
- `SEAM-SIN-004-03` Test-only cleanup remains outside the application auth and project authorities.

### Prohibited couplings

- `COUPLING-SIN-004-01` Do not weaken, skip, replace, or duplicate the approved auth lifecycle proof to make this flow pass.
- `COUPLING-SIN-004-02` Do not use the integration test as permission to add project state, fixture ownership, route-wide auth, or another auth flow.

### Intentionally unresolved security policy

- `SEC-GAP-SIN-004-01` Full security-baseline review, abuse prevention, recovery, email verification, MFA, invitations, authorization, and route-protection policy remain future work.

### Mandatory review bindings

- `REV-READY-SIN-004-01`
  Ref: `SEAM-SIN-004-01`
  Question: Does application-level evidence exercise sign-in and `/home` while preserving the BSS-004 lifecycle proof?
  Evidence: test files, commands, and results.
- `REV-READY-SIN-004-02`
  Ref: `SEAM-SIN-004-03`
  Question: Is cleanup isolated to the unique temporary identity and kept out of production authority?
  Evidence: cleanup code and test database boundary.
- `REV-READY-SIN-004-03`
  Ref: `COUPLING-SIN-004-02`
  Question: Does the final validation prove identity/session establishment without project authorization, fixture leakage, or unrelated auth expansion?
  Evidence: integration assertions, fixture regression results, and final diff review.

## Review checkpoint

- **Review question:** Does the complete sign-in-to-home flow establish a durable Better Auth session and preserve the app, CSP, sign-up, fixture, and authorization boundaries?
- **Combined acceptance:** Unique-user sign-in succeeds through the application route, `/home` shows the same session-backed identity in a genuinely empty production state, invalid sign-in is bounded, `/demo` remains fixture authority, and all existing foundation checks remain valid.
- **Implementation and validation commits:** `3af7950` (`test(auth): cover complete sign-in home flow`); the documentation checkpoint commit records its validated `awaiting_review` state.
