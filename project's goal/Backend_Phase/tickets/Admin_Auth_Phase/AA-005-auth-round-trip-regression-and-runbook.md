# AA-005: Auth round-trip regression evidence and operator runbook

- **State:** `awaiting_review`
- **Review batch:** `AA-BATCH-05`
- **Depends on:** AA-002, AA-003, AA-004 `PASS`
- **Baseline:** [Admin Auth Foundation](../../atlas-admin-auth-foundation.md) §§8, 10–13 and Definition of Done

## Outcome

Provide the final database-backed evidence and concise operator runbook that connect the approved CLI, Better Auth sign-in, issued session cookie, and protected Admin endpoint while confirming state durability and affected authentication-boundary isolation.

## Scope

- Execute one clean real flow: AA-004 native CLI bootstrap, ordinary Better Auth sign-in, capture/use the issued session cookie without exposing it, and `GET` the AA-002 protected identity endpoint. This proves AUTH-03 and AUTH-15.
- Restart the application and database clients without altering the test identity; prove the persisted `admin` role and `SEALED` bootstrap state still authorize the real signed-in session path. This proves AUTH-11.
- Run the directly affected existing non-admin and service-to-service authentication regression checks, and inspect the bounded final diff for a change to their authorities. This proves AUTH-13.
- Verify committed evidence for every AUTH-01 through AUTH-14 owner in the README matrix and rerun the affected predecessor test suites rather than replacing them with mock-only end-to-end evidence.
- Add a concise operator runbook: prerequisites, exact command, required environment, password behavior, safe successful output, normal sign-in and authorization verification, repeat behavior, and explicit same-attempt interrupted-bootstrap recovery.
- Record commands, environment prerequisites, test results, changed files, migration names, actual Better Auth integration path, role representation, limitations, reviewed commit, and implementation checkpoint.

This is a bounded evidence and documentation checkpoint. Do not redesign the role, guard, coordinator, CLI, public registration, or domain/service authorization. Do not replace real round-trip evidence with mocks or weaken predecessor tests.

## Acceptance criteria

- A successful native CLI run followed by the actual Better Auth sign-in API yields an issued session cookie that accesses the protected Admin identity endpoint with minimal non-sensitive data.
- The run demonstrates `401`/`403` behavior remains covered by AA-002 and records those test results; the final privileged success path must be a real cookie round trip, not a seeded session substitute.
- Application/database-client restart preserves the sealed state and persisted role without reopening bootstrap or changing credentials.
- All AUTH-01 through AUTH-15 IDs have committed PostgreSQL/Better Auth evidence in their assigned batches; no required case is silently skipped.
- Existing non-admin and service-to-service authentication remains green within the ticket's directly affected regression boundary.
- The runbook lets an infrastructure operator perform, verify, repeat, and safely recover the documented one-time procedure without implementation-only secrets or force/reset instructions.

## Validation

- Use the actual configured PostgreSQL database and Better Auth handler; use unique temporary identities and safe test-only cleanup.
- Execute and record the real CLI → sign-in API → cookie → protected endpoint flow, plus restart/durability proof and directly affected auth/service regression commands.
- Re-run AA-002 through AA-004 focused suites and check their AUTH evidence map against the README; report a missing or environment-blocked required scenario as a release blocker rather than skipping it.
- Inspect output, logs, test artifacts, and runbook examples to confirm they contain no password, password hash, raw cookie/token, database secret, or internal stack trace.
- Run migration, typecheck, and affected integration checks required by the predecessor tickets; record exact commands and outcomes against the reviewed commit.

## Security Refactor Readiness

Status: applicable

### Inherited boundaries

- `BOUNDARY-AA005-01` AA-001 through AA-004 own the accepted persistence, guard, coordinator, and CLI implementations; this ticket verifies their composition without replacing them.
- `BOUNDARY-AA005-02` Existing application and service authentication remain independent regression surfaces.

### Trust boundaries

- `TRUST-AA005-01` The final evidence crosses CLI, PostgreSQL, Better Auth sign-in, cookie issuance, and the Admin API boundary.
- `TRUST-AA005-02` Test cleanup and observation credentials remain test-only and never become production authorization paths.

### Sensitive assets and identity context

- `ASSET-AA005-01` Test passwords, cookies, logs, database URLs, and bootstrap metadata must remain ephemeral and redacted.
- `IDENTITY-AA005-01` Evidence binds the issued session to the CLI-created Better Auth user ID, persisted `admin` role, and sealed bootstrap state.

### Required seams

- `SEAM-AA005-01` The final harness exercises Better Auth's real sign-in HTTP contract and cookie handling.
- `SEAM-AA005-02` The runbook exposes safe operator-visible states and recovery without becoming an alternate implementation contract.

### Prohibited couplings

- `COUPLING-AA005-01` Do not substitute mocks, seeded sessions, or fixture-only behavior for the final sign-in/cookie/Admin-API proof.
- `COUPLING-AA005-02` Do not make cleanup identities, test hooks, or regression fixtures part of production authentication behavior.

### Intentionally unresolved security policy

- `SEC-GAP-AA005-01` Production monitoring, audit retention, MFA, rate limiting, and broader security-baseline controls remain future work.

### Mandatory review bindings

- `REV-READY-AA005-01`
  Ref: `SEAM-AA005-01`
  Question: Does final evidence use the actual Better Auth sign-in API, issued cookie, and protected Admin API after CLI bootstrap?
  Evidence: non-secret integration assertions and exact command output.
- `REV-READY-AA005-02`
  Ref: `BOUNDARY-AA005-02`
  Question: Do directly affected non-admin and service authentication regressions remain independent and green?
  Evidence: regression commands/results and bounded changed-file review.
- `REV-READY-AA005-03`
  Ref: `SEAM-AA005-02`
  Question: Does the runbook describe bounded explicit recovery with no reset/force behavior or secret disclosure?
  Evidence: committed runbook and AA-003/AA-004 recovery evidence.

## Review checkpoint

- **Review question:** Does real CLI bootstrap → Better Auth sign-in → issued cookie → protected Admin access, plus durability, regression evidence, and the runbook, prove the completed foundation without changing its authorities?
- **Implementation commit:** pending GO checkpoint commit.
