# SUS-003: Sign-up end-to-end and regression validation

- **State:** `planned`
- **Review batch:** `SUS-BATCH-03`
- **Depends on:** SUS-001 `PASS`, SUS-002 `PASS`
- **Baseline:** [Sign-Up Implementation Context](../../atlas-sign-up-implementation-context.md) §§19–26; [Backend Production Baseline](../../atlas-backend-production-baseline-mistral-synced.md) §§4–6, 12, 14, 21–22; AC-01–AC-12

## Outcome

Prove the complete browser-facing sign-up path against the existing Better Auth persistence foundation and freeze the regression evidence that the real identity/session transition does not grant Atlas project authorization or weaken existing app boundaries.

## Scope

- Add or update an application-level integration test in the repository's current test strategy, such as `apps/atlas/tests/auth-sign-up.test.mjs`, for `POST /api/auth/sign-up/email`.
- Use a unique temporary email and user-provided name; assert successful response, normal session `Set-Cookie`, and a subsequent `/api/auth/get-session` lookup returning the same user.
- Clean up the temporary user after the test using the established test database boundary; do not depend on a fixed reusable identity.
- Verify an invalid or failed sign-up remains a failure: no success redirect, no fake authenticated state, no password in output, and no internal server detail exposed.
- Verify the sign-up path does not create Atlas project, workspace, membership, role, permission, ownership, Master, or Initial Draft state; use the existing repository/test boundary rather than adding production queries to the app.
- Verify the separate `@atlas/fixtures` package remains the source of fixture-backed `/demo` and golden/test scenarios; the real sign-up identity/session path must not be implemented by importing fixture identities or moving fixture state into `auth.*`.
- Run the existing `@atlas/auth` lifecycle test unchanged, the app build, the rendered HTML/CSP suite, and directly affected tests.
- Record the final validation commands and evidence in the implementation commit/checkpoint; do not add sign-in, sign-out UI, reset-password, route guards, or unrelated fixture changes.

## Acceptance criteria

- A unique sign-up request through the application route creates a user through the existing `@atlas/auth` service and persists it under `auth.user`.
- The same request establishes a durable Better Auth session and returns its normal session cookie; the session remains readable through the existing handler/session endpoint.
- `/demo` is reached only after success and the test does not treat rendering or form submission alone as account creation.
- Invalid input and representative failed sign-up paths do not redirect or create fake authenticated state, expose internal details, or prevent retry.
- No sign-up test or implementation creates project/workspace/membership/role/permission state or treats fixture data as production identity truth.
- The fixture package remains separate from production authentication: `/sign-up` uses `@atlas/auth`, while `/demo` may continue using `@atlas/fixtures`.
- The existing BSS-004 lifecycle test continues to prove durable session and sign-out behavior without being weakened or replaced.
- Existing app rendering, strict CSP, build, and directly affected frontend checks continue to pass.
- The final result remains sign-up-only; mounted Better Auth endpoints are not treated as authorization to wire additional UI flows.

## Validation

- Run the application-level sign-up integration test against the supported local PostgreSQL/auth configuration and report when the environment is unavailable rather than weakening the test.
- Run the `@atlas/auth` lifecycle test and confirm its temporary identity is cleaned up.
- Run `pnpm --filter @atlas/app test` (or the repository-equivalent app validation command) and retain the rendered route/CSP assertions.
- Run the relevant build/lint/type checks required by the touched packages.
- Inspect the final diff for absence of new auth schema/migration, direct app-side password hashing, custom token/session persistence, project writes, or fixture-backed sign-up identity.

## Security Refactor Readiness

Status: applicable

### Inherited boundaries

- `BOUNDARY-SUS-003-01` BSS-004 is the source of truth for Better Auth identity and durable session persistence.
- `BOUNDARY-SUS-003-02` Atlas project authorization/state and fixtures remain separate from authentication identity.

### Trust boundaries

- `TRUST-SUS-003-01` The application route is the measured boundary from browser request to Better Auth persistence and cookie establishment.
- `TRUST-SUS-003-02` The test database/admin cleanup path is test-only and must not become an application authority or production code path.

### Sensitive assets and identity context

- `ASSET-SUS-003-01` Test credentials, session cookies, secrets, and database connection details must not be logged or exposed in browser assertions.
- `IDENTITY-SUS-003-01` End-to-end evidence must bind the returned session to the newly created user without introducing a parallel identity/session representation.

### Required seams

- `SEAM-SUS-003-01` The app-level test must exercise the browser-facing route, while the BSS-004 lifecycle test remains the package-level persistence proof.
- `SEAM-SUS-003-02` Temporary-user cleanup must remain outside the application auth authority so production behavior stays limited to identity/session establishment.

### Prohibited couplings

- `COUPLING-SUS-003-01` Do not weaken, skip, replace, or duplicate the approved auth lifecycle proof to make app validation pass.
- `COUPLING-SUS-003-02` Do not use the integration test to authorize project state, fixture ownership, route protection, or any later auth flow.

### Intentionally unresolved security policy

- `SEC-GAP-SUS-003-01` Full security-baseline review, abuse prevention, email verification, recovery, invitations, authorization, and route protection remain separately scoped.

### Mandatory review bindings

- `REV-READY-SUS-003-01`
  Ref: `SEAM-SUS-003-01`
  Question: Does the application test exercise the browser-facing route while preserving the BSS-004 lifecycle test as the persistence proof?
  Evidence: test files, commands, and results.
- `REV-READY-SUS-003-02`
  Ref: `SEAM-SUS-003-02`
  Question: Is test cleanup isolated from production auth/project authority and performed only for the unique temporary identity?
  Evidence: cleanup code and test-database boundary.
- `REV-READY-SUS-003-03`
  Ref: `COUPLING-SUS-003-02`
  Question: Does the final validation demonstrate identity/session establishment without project authorization or fixture truth leakage?
  Evidence: integration assertions and final diff review.

## Review checkpoint

- **Review question:** Does the browser-facing sign-up flow create a durable Better Auth identity/session and preserve the existing app, CSP, fixture, and authorization boundaries?
- **Combined acceptance:** The full sign-up request/session path is proven with unique-user cleanup, failure behavior is bounded, existing auth/app/CSP checks remain valid, and no project state or extra auth flow is introduced.
- **Commit to review:** Implementation commit recorded when `SUS-BATCH-03` enters `awaiting_review`.
