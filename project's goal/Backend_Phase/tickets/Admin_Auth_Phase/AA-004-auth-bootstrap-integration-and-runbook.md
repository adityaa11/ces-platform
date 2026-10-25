# AA-004: Auth bootstrap integration evidence and operator runbook

- **State:** `planned`
- **Review batch:** `AA-BATCH-04`
- **Depends on:** AA-001, AA-002, AA-003 `PASS`
- **Baseline:** [Admin Auth Foundation](../../atlas-admin-auth-foundation.md) §§10–11 and Definition of Done

## Outcome

Provide the real database-backed acceptance evidence and concise operator instructions proving that the first Super Admin can sign in through Better Auth and access the protected Admin API without an additional activation or authorization step.

## Scope

- Add integration coverage for AUTH-01 through AUTH-15 using the actual configured PostgreSQL database and Better Auth handler.
- Cover fresh bootstrap, immediate authentication, authorized access, no session, ordinary user, expired/revoked session, replay, concurrency, interruption, identity collision, privilege durability, public privilege escalation, domain isolation, credential secrecy, and the real sign-in-cookie round trip.
- Use unique temporary identities and safe cleanup; do not rely on fixed reusable admin accounts or mock-only final acceptance.
- Verify no password material appears in CLI logs/output, SQL bootstrap metadata, errors, or test artifacts.
- Verify existing non-admin and service-to-service authentication behavior remains functional.
- Add a concise operator runbook containing prerequisites, exact repository-native invocation, required environment, password behavior, successful output, sign-in verification, authorization verification, repeat behavior, and interrupted-attempt recovery.
- Record commands, environment prerequisites, test results, changed files, migration names, actual Better Auth integration path, role representation, limitations, commit hash, and implementation checkpoint at completion.

Do not add Admin UI, broaden the test suite into unrelated domain/runtime work, weaken existing tests to accommodate this set, or replace real round-trip evidence with mocks.

## Acceptance criteria

- AUTH-01 through AUTH-15 are either passing with evidence or have a documented environment-specific reason that is itself a release blocker; no required case is silently skipped.
- A successful CLI run followed by normal Better Auth sign-in returns a session cookie that accesses the protected admin identity endpoint.
- No session and ordinary-user requests fail with the required status codes; expired/revoked sessions cannot access the endpoint.
- Replay and concurrent attempts cannot produce additional users, modify credentials, or reopen sealed state.
- Interrupted bootstrap leaves no unauthorized usable admin and provides a controlled same-attempt recovery path.
- Public registration and ordinary user updates cannot grant `admin` authority.
- Existing auth, domain, and service boundaries remain green within the directly affected validation scope.
- The runbook is sufficient for an infrastructure operator unfamiliar with implementation internals.

## Validation matrix

| ID | Required proof |
|---|---|
| AUTH-01 | Fresh eligible installation creates one verified, active Super Admin. |
| AUTH-02 | Bootstrapped credentials authenticate through normal Better Auth sign-in. |
| AUTH-03 | Resulting session accesses the protected Admin endpoint. |
| AUTH-04 | No session returns `401`. |
| AUTH-05 | Ordinary user returns `403`. |
| AUTH-06 | Expired/revoked sessions cannot access Admin APIs. |
| AUTH-07 | Replay fails without extra user or credential changes. |
| AUTH-08 | Concurrent attempts cannot both reserve/seal. |
| AUTH-09 | Interrupted attempt is durable, non-authorizing, and recoverable by explicit same-attempt action. |
| AUTH-10 | Existing identity collision fails safely without elevation. |
| AUTH-11 | Restart preserves role and sealed state. |
| AUTH-12 | Public registration, ordinary updates, and anonymous requests cannot escalate privilege. |
| AUTH-13 | Existing non-admin/service authentication behavior is not regressed. |
| AUTH-14 | Password material is absent from output, logs, metadata, and errors. |
| AUTH-15 | Real sign-in API cookie round trip reaches the protected Admin API. |

## Security Refactor Readiness

Status: applicable

### Inherited boundaries

- `BOUNDARY-AA004-01` AA-001 through AA-003 define the accepted persistence, authorization, and CLI boundaries being verified.
- `BOUNDARY-AA004-02` Existing application and service authentication remain independent regression surfaces.

### Trust boundaries

- `TRUST-AA004-01` The integration test crosses the real CLI/database/auth/session/API sequence.
- `TRUST-AA004-02` Test cleanup and observation credentials must remain outside production authorization paths.

### Sensitive assets and identity context

- `ASSET-AA004-01` Test passwords, session cookies, logs, database URLs, and bootstrap metadata must remain redacted and ephemeral.
- `IDENTITY-AA004-01` Evidence must bind the issued session to the bootstrapped Better Auth user ID and persisted `admin` role.

### Required seams

- `SEAM-AA004-01` The test harness must exercise the real Better Auth HTTP contract and cookie handling.
- `SEAM-AA004-02` The runbook must describe operator-visible state transitions and safe recovery without exposing implementation secrets.

### Prohibited couplings

- `COUPLING-AA004-01` Do not substitute mocks for the final authentication/authorization round trip.
- `COUPLING-AA004-02` Do not make test cleanup or fixture identities part of production auth behavior.

### Intentionally unresolved security policy

- `SEC-GAP-AA004-01` Continuous production monitoring, audit retention, MFA, and broader abuse/security-baseline controls remain future work.

### Mandatory review bindings

- `REV-READY-AA004-01`
  Ref: `SEAM-AA004-01`
  Question: Does the final evidence use the actual Better Auth sign-in API, issued cookie, and protected Admin API?
  Evidence: integration test output and captured non-secret request/status assertions.
- `REV-READY-AA004-02`
  Ref: `ASSET-AA004-01`
  Question: Is credential and session material absent from logs, metadata, errors, and artifacts?
  Evidence: secrecy tests and artifact inspection.
- `REV-READY-AA004-03`
  Ref: `SEAM-AA004-02`
  Question: Does the runbook describe bounded, explicit recovery without reset/force behavior?
  Evidence: committed runbook and interrupted-attempt test.

## Review checkpoint

- **Review question:** Does the complete flow satisfy the primary success evidence and all required negative/security scenarios against the actual Better Auth/PostgreSQL stack?
- **Implementation commit:** not yet implemented.
