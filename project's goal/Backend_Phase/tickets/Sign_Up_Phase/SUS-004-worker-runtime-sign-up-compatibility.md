# SUS-004: Worker-runtime sign-up compatibility

- **State:** `awaiting_review`
- **Review batch:** `SUS-BATCH-04`
- **Depends on:** SUS-001 through SUS-003 `approved`; an approved scope change for runtime compatibility
- **Baseline:** [Sign-Up Implementation Context](../../atlas-sign-up-implementation-context.md) §§19–26; [SUS-003](SUS-003-sign-up-end-to-end-validation.md); [Atlas Backend Production Baseline](../../atlas-backend-production-baseline-mistral-synced.md) §§4–6, 12, 14, 21–22; AC-01–AC-12

## Outcome

Make the existing `/api/auth/sign-up/email` path execute successfully in Atlas's supported Vinext worker-style runtime without weakening CSP or the authentication/authorization boundary. Close the validation gap that let the prior Node/Jiti route tests pass while the running dev server returned HTTP 500 with `Code generation from strings disallowed for this context`.

## Scope

- Identify the exact dependency and initialization path that attempts runtime code generation while handling the mounted Better Auth request in Vinext's worker context.
- Select and implement a worker-compatible remediation: configure or replace only the incompatible validation/runtime integration, or use supported precompiled/static validation where the dependency supports it.
- Preserve the single server-owned `@atlas/auth` service, the narrow app route adapter, Better Auth ownership of credentials and session cookies, and the existing `auth.*` database boundary.
- Add an automated runtime-level regression test that sends a real HTTP sign-up request through the supported Vinext worker server or an equivalent worker execution harness. It must not import and call `POST(...)` directly as the sole proof.
- Run that proof with the supported local PostgreSQL/auth configuration. If required services are unavailable, report the validation as blocked; do not mark the ticket passed or the runtime regression covered.
- Verify a successful request returns the normal Better Auth cookie and a session lookup identifies the new user; verify a malformed request fails safely without a session or internal error output.
- Add a focused guard that detects the worker-runtime incompatibility before a user-facing sign-up attempt regresses.

Do not introduce `unsafe-eval`, relax the CSP, monkey-patch global code-generation APIs, move authentication into the browser, add custom tokens/cookies, alter project authorization, or expand into sign-in, recovery, verification, or route protection.

## Acceptance criteria

- A valid browser-equivalent `POST /api/auth/sign-up/email` through the supported Vinext worker runtime does not return a code-generation/runtime error and returns Better Auth's normal success response and session cookie.
- A subsequent request through that same runtime and cookie can read the newly created Better Auth session.
- Invalid sign-up input through that runtime remains a bounded failure: no session cookie, no authenticated session, no password/secret/SQL/stack trace in the response, and no project or authorization state.
- The selected remediation has an explicit compatibility rationale tied to the concrete failing dependency and does not use CSP or `eval` exceptions as a workaround.
- The app route remains a thin request-to-handler adapter and `@atlas/auth` remains the sole owner of Better Auth configuration and persistence.
- The existing Node-level boundary, auth lifecycle, rendered HTML, CSP, and app tests still pass; the new runtime-level test is required additional evidence, not a replacement.
- The runtime proof runs against an available supported database/auth configuration. An unavailable configuration leaves the ticket `blocked` or `awaiting_review`; it cannot produce a PASS checkpoint.

## Validation

- Reproduce the reported failure against the supported Vinext dev/server worker runtime and retain the request status plus the minimal non-sensitive error evidence.
- Add and run a real HTTP runtime test against that server/harness using a unique temporary account; assert sign-up, returned cookie, `get-session`, invalid input behavior, and cleanup.
- Run `pnpm --filter @atlas/app test`, `pnpm --filter @atlas/auth test`, and the relevant build/lint/type checks. Record skipped database-dependent tests separately from executed runtime proof.
- Inspect the final diff for CSP weakening, `unsafe-eval`, `new Function`, `eval`, browser credential/session persistence, custom auth state, direct app-side auth-table writes, and Atlas authorization/project writes.

## Security Refactor Readiness

Status: applicable

### Inherited boundaries

- `BOUNDARY-SUS-004-01` Better Auth and `@atlas/auth` remain the sole authority for identity, credentials, session cookies, and `auth.*` persistence.
- `BOUNDARY-SUS-004-02` Atlas authorization/project state and fixture data remain outside sign-up authentication.

### Trust boundaries

- `TRUST-SUS-004-01` Browser-equivalent HTTP traffic enters the Vinext worker runtime before reaching the app's narrow auth adapter and Better Auth handler.
- `TRUST-SUS-004-02` The compatibility remediation must not turn a worker-runtime limitation into client-controlled code execution or a CSP exception.

### Sensitive assets and identity context

- `ASSET-SUS-004-01` Passwords, secrets, generated validation code, session cookies, and database configuration remain server-controlled and absent from responses/log assertions.
- `IDENTITY-SUS-004-01` The normal Better Auth response/cookie and session semantics must be preserved through the actual worker runtime.

### Required seams

- `SEAM-SUS-004-01` Keep runtime compatibility localized to the incompatible dependency/configuration boundary; do not broaden the browser-facing route.
- `SEAM-SUS-004-02` Keep a real worker-runtime HTTP test separate from direct Node module tests.

### Prohibited couplings

- `COUPLING-SUS-004-01` Do not bypass CSP or permit dynamic source evaluation to make Better Auth work.
- `COUPLING-SUS-004-02` Do not create browser-owned authentication state, app-owned auth persistence, or Atlas authorization/project writes.

### Mandatory review bindings

- `REV-READY-SUS-004-01`
  Ref: `SEAM-SUS-004-01`
  Question: Does the fix remove the demonstrated worker runtime failure without introducing dynamic-code or CSP exceptions?
  Evidence: failing dependency analysis, changed configuration/code, CSP inspection, and runtime test.
- `REV-READY-SUS-004-02`
  Ref: `SEAM-SUS-004-02`
  Question: Does the test exercise actual Vinext worker HTTP execution rather than only directly importing the route module?
  Evidence: test harness/server invocation and request assertions.
- `REV-READY-SUS-004-03`
  Ref: `BOUNDARY-SUS-004-01`
  Question: Are Better Auth cookie/session semantics and the auth/project authority boundary preserved?
  Evidence: successful and failed runtime requests, session lookup, cleanup, and final diff.

## Review checkpoint

- **Review question:** Does the real Vinext worker runtime complete sign-up safely while preserving CSP and the approved Better Auth/Atlas authority boundaries?
- **Combined acceptance:** A worker-runtime HTTP request establishes and reads a durable Better Auth session on success, fails safely on invalid input, and has no dynamic-code/CSP bypass or Atlas authorization side effects.
- **Commit to review:** Recorded when `SUS-BATCH-04` enters `awaiting_review`.
