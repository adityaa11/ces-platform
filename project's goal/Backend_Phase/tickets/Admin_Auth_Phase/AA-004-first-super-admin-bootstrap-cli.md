# AA-004: First Super Admin bootstrap CLI

- **State:** `approved`
- **Review batch:** `AA-BATCH-04`
- **Depends on:** AA-003 `PASS`
- **Baseline:** [Admin Auth Foundation](../../atlas-admin-auth-foundation.md) §§5.1–5.2, 5.4, 8, 11–13

## Outcome

Expose AA-003's approved private coordinator through one repository-native command that an authorized infrastructure operator can use to create the initial Super Admin without an Admin UI or running HTTP server.

## Scope

- Add the repository-native executable command, conceptually `pnpm atlas admin bootstrap --email admin@example.com --name "Atlas Administrator"`, following existing package/script conventions.
- Require and validate email and name arguments. Prompt only for `Initial password` and `Confirm password`; never accept a password as an argument, environment variable, or persisted command option.
- Hide password input where supported, reject mismatch, invalid Better Auth policy, missing arguments, and non-interactive misuse with bounded non-secret errors.
- Pass the accepted values only in memory to AA-003's coordinator and surface its sealed/replay/reserved/collision outcome without recreating reservation, identity, credential, or reconciliation logic in the CLI.
- Print the foundation's success checklist only after the coordinator reports persisted verification and `SEALED`; include the configured normal Better Auth sign-in endpoint guidance but never a password, hash, cookie, token, secret, or stack trace.
- Provide a clearly named same-attempt reconciliation invocation only if AA-003 exposes it; it must identify the existing attempt and must not imply force/reset or general bootstrap reopening.

Do not add public registration, hidden HTTP bootstrap, automatic login/session creation, Admin UI, direct SQL credential creation, custom password hashing, or an alternate recovery implementation.

## Acceptance criteria

- The documented bootstrap command works from the repository-native package entrypoint with database/configuration available and without an Admin UI or HTTP server.
- A fresh CLI run delegates exactly once to AA-003 and produces one verified, active `admin` Better Auth identity; this is AUTH-01.
- The created credentials are immediately eligible for the ordinary Better Auth sign-in mechanism; this is AUTH-02. AA-005 owns the issued-cookie-to-protected-route proof.
- Passwords are masked when supported and never appear in arguments, help, output, errors, logs, snapshots, or command history fixtures.
- Replay, reservation, collision, and recovery messages preserve AA-003 semantics and never expose an unsafe bypass.
- Success output gives the required operational status and normal sign-in guidance only after durable sealing.

## Validation

- Test argument validation, password mismatch, invalid-policy handling, terminal masking abstraction, non-interactive behavior, and output redaction without recording a real password.
- Run the native command against PostgreSQL and Better Auth for a fresh unique identity; verify AUTH-01 and AUTH-02 without starting the HTTP server.
- Prove that the CLI calls the coordinator rather than reimplementing privileged persistence or Better Auth credential operations.
- Exercise bounded replay, collision, reserved/reconciliation reporting, and success output against controlled coordinator states.
- Add AUTH-14 assertions for CLI stderr/stdout/help/log snapshots and run directly affected auth/app typechecks.

## Security Refactor Readiness

Status: applicable

### Inherited boundaries

- `BOUNDARY-AA004-01` AA-003 owns first-operator reservation, provisioning, verification, sealing, and same-attempt recovery.
- `BOUNDARY-AA004-02` Better Auth remains the credential and session authority; the CLI is only an infrastructure invocation surface.

### Trust boundaries

- `TRUST-AA004-01` An authorized infrastructure operator supplies command metadata and interactive password material to a local CLI.
- `TRUST-AA004-02` CLI output crosses to an operator terminal and must remain non-secret.

### Sensitive assets and identity context

- `ASSET-AA004-01` Password input, console buffers, errors, output, and test snapshots must not reveal credential or session material.
- `IDENTITY-AA004-01` The command may report the requested email and resulting role, but cannot treat email as authorization.

### Required seams

- `SEAM-AA004-01` One native command delegates privileged work to AA-003 without embedding a second provisioning path.
- `SEAM-AA004-02` The CLI's bounded messages expose operational state without leaking implementation secrets.

### Prohibited couplings

- `COUPLING-AA004-01` Do not transport passwords through command arguments, environment configuration, logs, or a frontend/HTTP channel.
- `COUPLING-AA004-02` Do not duplicate coordinator state transitions or offer force/reset semantics in the CLI.

### Intentionally unresolved security policy

- `SEC-GAP-AA004-01` Operator-host assurance, shell-history policy beyond excluding password arguments, and broader audit policy remain outside this ticket.

### Mandatory review bindings

- `REV-READY-AA004-01`
  Ref: `SEAM-AA004-01`
  Question: Does the command exclusively delegate privileged bootstrap work to AA-003?
  Evidence: CLI implementation, dependency spy/integration test, and changed-file review.
- `REV-READY-AA004-02`
  Ref: `COUPLING-AA004-01`
  Question: Is password/session material absent from all CLI input/output and test evidence surfaces?
  Evidence: redaction tests and artifact inspection.
- `REV-READY-AA004-03`
  Ref: `COUPLING-AA004-02`
  Question: Are recovery and replay messages bounded to AA-003's existing state without reset or duplicate-provisioning behavior?
  Evidence: CLI state-output tests and coordinator integration results.

## Review checkpoint

- **Review question:** Can an infrastructure operator invoke exactly one approved bootstrap coordinator through a password-safe native CLI with no web-facing provisioning path?
- **Implementation commit:** `6492643c`
