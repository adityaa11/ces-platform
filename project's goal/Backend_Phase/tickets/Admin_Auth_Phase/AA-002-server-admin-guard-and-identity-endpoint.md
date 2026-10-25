# AA-002: Server-side Admin guard and protected identity endpoint

- **State:** `approved`
- **Review batch:** `AA-BATCH-02`
- **Depends on:** AA-001 `PASS`
- **Baseline:** [Admin Auth Foundation](../../atlas-admin-auth-foundation.md) §§4.3–4.4, 7–8, 12

## Outcome

Provide one reusable server-side guard for future Atlas Admin APIs and expose one minimal protected admin identity endpoint as the concrete authorization boundary for integration tests and future Admin UI work.

## Scope

- Resolve the existing Better Auth session using the repository's current session resolver and request headers/cookies.
- Reject absent, expired, revoked, or otherwise invalid sessions with `401 Unauthorized`.
- Require completed global bootstrap state and a persisted Better Auth `admin` role for Atlas Platform Super Admin access.
- Reject valid ordinary-user sessions with `403 Forbidden`.
- Allow a valid Super Admin session only after bootstrap state is `SEALED`.
- Add a protected endpoint such as `GET /api/admin/identity` following current Atlas route conventions.
- Return only minimal identity data: Better Auth user ID, email, name, and the normalized `admin` role; never return password hashes, raw session tokens, or secrets.
- Keep the guard at the server API boundary and make its result reusable by later Admin modules.
- Preserve existing application, worker, service-to-service, and domain authorization paths.

Do not add frontend middleware as the security boundary, custom JWTs/admin tokens, hardcoded admin emails, a second session protocol, domain-authority bypasses, or Admin UI.

## Acceptance criteria

- The endpoint returns `401` for no cookie, malformed cookie, expired session, revoked session, or otherwise invalid Better Auth session.
- The endpoint returns `403` for a valid ordinary Better Auth session.
- The endpoint returns success with minimal identity data for a valid Super Admin session after bootstrap is sealed.
- A valid `admin` user cannot access the endpoint while bootstrap is only `RESERVED`.
- The guard is a reusable server function or equivalent boundary component rather than endpoint-specific duplicated checks.
- The endpoint does not expose sensitive auth fields or mutate project/domain state.
- Existing `/api/auth/*`, `/home`, worker, service, and domain authorization behavior is unchanged.

## Validation

- Add focused request-level tests for `401`, `403`, and success behavior. This ticket owns AUTH-04 through AUTH-06; the final CLI-issued-cookie success assertion is deliberately owned by AA-005.
- Exercise AUTH-04 through AUTH-06 against the actual PostgreSQL-backed Better Auth configuration and a real Better Auth session cookie; focused doubles are regression support, not final acceptance evidence.
- Verify revoked and expired sessions are rejected.
- A test-only sealed-state/role fixture may establish the accepted AA-001 persistence precondition for this guard test, but may not recreate bootstrap provisioning logic or substitute for AA-003/AA-004 evidence.
- Verify the endpoint response contains no password/hash/token/secret fields.
- Run directly affected app/auth typechecks and existing auth lifecycle tests.

## Security Refactor Readiness

Status: applicable

### Inherited boundaries

- `BOUNDARY-AA002-01` Better Auth remains the source of session identity and session validity.
- `BOUNDARY-AA002-02` Domain-specific validation, approval, publication, and activation authorities remain unchanged and are not bypassed by Super Admin access.

### Trust boundaries

- `TRUST-AA002-01` Browser request headers/cookies cross the Atlas server API boundary into Better Auth session resolution.
- `TRUST-AA002-02` Resolved identity and persisted role/bootstrap state cross into an authorization decision.

### Sensitive assets and identity context

- `ASSET-AA002-01` Session cookies, user identity data, role state, and bootstrap state are security-sensitive.
- `IDENTITY-AA002-01` The authenticated Better Auth user ID must remain available to downstream admin handlers for audit and future policy attachment.

### Required seams

- `SEAM-AA002-01` One guard function is the attachment point for future Admin API modules and later policy checks.
- `SEAM-AA002-02` The API response boundary provides a narrow place to enforce response minimization and observability without exposing auth internals.

### Prohibited couplings

- `COUPLING-AA002-01` Do not authorize from email, frontend state, URL naming, environment allowlists, or `adminUserIds`.
- `COUPLING-AA002-02` Do not make Admin access imply domain-operation approval or service-worker authority.

### Intentionally unresolved security policy

- `SEC-GAP-AA002-01` Audit logging, MFA enforcement, rate limiting, and fine-grained admin permissions remain future policy layers.

### Mandatory review bindings

- `REV-READY-AA002-01`
  Ref: `SEAM-AA002-01`
  Question: Do all protected Admin requests compose one reusable guard rather than duplicate or weaken authorization checks?
  Evidence: guard implementation and protected endpoint tests.
- `REV-READY-AA002-02`
  Ref: `BOUNDARY-AA002-01`
  Question: Are invalid, expired, and revoked Better Auth sessions rejected at the API boundary?
  Evidence: real session-cookie tests and revocation/expiry cases.
- `REV-READY-AA002-03`
  Ref: `COUPLING-AA002-02`
  Question: Does Super Admin access preserve domain-level safety and existing service authentication?
  Evidence: changed-file review and regression tests.

## Review checkpoint

- **Review question:** Does the API boundary enforce Better Auth session validity, completed bootstrap state, and persisted Super Admin authority with the required `401`/`403` behavior?
- **Implementation commit:** recorded in the AA-BATCH-02 GO checkpoint; awaiting CK review.
