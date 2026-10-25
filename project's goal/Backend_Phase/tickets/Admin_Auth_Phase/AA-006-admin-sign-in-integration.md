# AA-006: Admin Sign-In authentication integration

- **State:** `awaiting_review`
- **Review batch:** `AA-BATCH-06`
- **Depends on:** AA-001, AA-002, AA-003, AA-004, AA-005 `PASS`; ASI-001 through ASI-004 `PASS`
- **Baseline:** [Admin Auth Foundation](../../atlas-admin-auth-foundation.md); [AA-005 auth round-trip regression and runbook](AA-005-auth-round-trip-regression-and-runbook.md); [Admin Sign-In Phase](../../../atlas-ui/ticket/Admin_Sign_In_Phase/README.md)
- **Source context:** [AA × ASI Admin Sign-In integration context](../../../atlas-ui/AA-ASI-Intergration.md)

## Outcome

Connect the existing ASI `/admin/sign-in` surface to the accepted AA Better
Auth sign-in and server-side Admin identity boundaries. A valid credential
sign-in must be followed by a successful protected Admin identity response
before the UI can display authenticated Admin confirmation.

This ticket is an integration bridge. It does not create or modify an
authentication authority, identity store, session mechanism, Admin role,
bootstrap coordinator, bootstrap CLI, or protected Admin endpoint.

## Scope

- Submit the existing Admin form to `POST /api/auth/sign-in/email` using the
  established Better Auth contract and same-origin session handling.
- After sign-in success, call `GET /api/admin/identity` with `no-store` and
  accept success only for the existing minimal identity contract with
  `role: "admin"`.
- Preserve the existing ASI validation, password visibility, theme, responsive,
  keyboard, focus, and accessible feedback behavior.
- Keep the operator on `/admin/sign-in`; Admin Home, dashboard, and future
  Admin navigation remain separate work.
- Show generic, retryable feedback for invalid credentials, `401`, malformed
  identity, network failures, and server failures.
- On a `403` identity response, best-effort call the existing Better Auth
  sign-out endpoint, while denying Admin success regardless of cleanup result.
- Keep credential and session handling ephemeral: no browser storage, UI token
  state, or credential/session logging.
- Keep the Admin authorization reader on the auth-only database entry point so
  worker execution does not initialize unrelated database subsystems.

The operator-authorized local development bootstrap credentials are test
execution context only. They are read from the local root `.env` at runtime by
temporary development tooling, never become required application
configuration, and are not an AA/ASI contract or production provisioning
requirement.

## Explicit non-goals

- Do not add `/api/admin/sign-in` or any duplicate authentication endpoint.
- Do not add password verification, JWT, or a separate Admin session system.
- Do not change Better Auth role semantics, AA bootstrap state, coordinator,
  recovery behavior, CLI production behavior, or public sign-in/sign-up.
- Do not add Admin registration, Admin Home, dashboard, provider profiles,
  model management, BSS configuration, MFA, recovery policy, or role
  management.
- Do not reset or reopen a sealed bootstrap marker for tests.
- Do not modify approved AA/ASI historical checkpoints to incorporate local
  development credential authorization.

## Acceptance criteria

- Clicking **Sign in to Admin Console** performs the real Better Auth sign-in
  request after existing client validation.
- Better Auth success alone never displays Admin success.
- A CLI-bootstrapped Super Admin can complete sign-in and protected identity
  verification using the existing AA authorities.
- Ordinary users, invalid credentials, missing/expired/revoked sessions, and
  malformed or failed identity responses cannot obtain Admin success state.
- A successful Admin identity response displays only permitted identity data
  and does not redirect away from `/admin/sign-in`.
- A `403` response triggers best-effort sign-out without weakening denial.
- Repeated clicks do not create concurrent sign-in submissions.
- Credentials and session tokens are not persisted or logged by the browser
  integration.
- Public authentication routes and the existing ASI visual/accessibility
  contract remain unchanged.

## Validation

- Run the targeted Admin browser suite covering route isolation, theme/storage
  authority, public routes, validation/focus, real sign-in, and identity
  verification.
- Run focused AA/admin unit tests covering authorized, unauthorized, forbidden,
  ordinary-user, malformed-identity, sign-out-cleanup, and duplicate-submit
  behavior.
- Run the app production build and changed-file ESLint.
- Use the intended local PostgreSQL development database only for the
  operator-authorized real round trip; never print credential values, password
  hashes, cookies, session tokens, or database secrets.
- Confirm a pre-existing `SEALED` bootstrap state is reused and never reset.
- Record any repo-wide pre-existing lint/type limitations separately without
  widening this ticket into unrelated cleanup.

## Security Refactor Readiness

Status: applicable

### Inherited boundaries

- `BOUNDARY-AA006-01` Better Auth remains the identity and session authority.
- `BOUNDARY-AA006-02` AA-002 remains the sole server-side Admin authorization
  boundary for the protected identity response.
- `BOUNDARY-AA006-03` AA-001 through AA-005 and ASI-001 through ASI-004 remain
  accepted predecessors; this ticket composes them without reopening them.

### Trust boundaries

- `TRUST-AA006-01` Browser-entered credentials cross only the existing Better
  Auth sign-in endpoint.
- `TRUST-AA006-02` Admin success crosses only after the server-side identity
  endpoint returns the accepted admin role contract.
- `TRUST-AA006-03` Local operator bootstrap credentials cross a temporary
  development test runner only and never enter production application config.

### Sensitive assets and identity context

- `ASSET-AA006-01` Passwords, password hashes, session cookies, tokens,
  database URLs, and bootstrap metadata remain redacted and ephemeral.
- `IDENTITY-AA006-01` UI confirmation is derived from the protected identity
  response, not from entered email, browser role state, or sign-in status alone.

### Required seams

- `SEAM-AA006-01` Keep the Better Auth sign-in, identity, and sign-out HTTP
  contracts directly observable to focused tests.
- `SEAM-AA006-02` Keep Admin authorization server-side so future Admin routes
  can reuse the same guard without client-owned authority.
- `SEAM-AA006-03` Keep local development credential injection outside the
  production authentication path.

### Prohibited couplings

- `COUPLING-AA006-01` Do not infer Admin authority from email, client state,
  Better Auth success, or browser-supplied role data.
- `COUPLING-AA006-02` Do not persist credentials, expose cookies/tokens, or
  add logging that captures sensitive authentication material.
- `COUPLING-AA006-03` Do not make operator `.env` keys mandatory runtime
  configuration or change bootstrap safety rules.

### Intentionally unresolved security policy

- `SEC-GAP-AA006-01` Production MFA, rate limiting, audit retention, recovery,
  and broader Admin Console policy remain future work.

### Mandatory review bindings

- `REV-READY-AA006-01` Ref: `BOUNDARY-AA006-02`. Does Admin success require the
  protected server identity contract, including `role: "admin"`?
- `REV-READY-AA006-02` Ref: `ASSET-AA006-01`. Do source, tests, output, and
  browser state exclude password, hash, cookie, token, and secret leakage?
- `REV-READY-AA006-03` Ref: `SEAM-AA006-03`. Does temporary local credential
  injection remain outside production authentication behavior and avoid
  bootstrap reset/reopen behavior?

## Review checkpoint

- **Review question:** Does the existing Admin Sign-In surface compose the accepted AA authentication and authorization boundaries without introducing a second authority, leaking sensitive material, or changing public authentication behavior?
- **Implementation commit:** `c1dc7b4132a8685cede1588ece9e0383a091aa17` (`feat(atlas): integrate admin sign-in with AA`)
- **GO checkpoint:** [AA × ASI integration GO checkpoint](../../../feedback/AA-ASI-Intergration-go-checkpoint.md)
