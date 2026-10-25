# AA-003: First Super Admin bootstrap CLI

- **State:** `planned`
- **Review batch:** `AA-BATCH-03`
- **Depends on:** AA-001 `PASS`
- **Baseline:** [Admin Auth Foundation](../../atlas-admin-auth-foundation.md) §§1, 5–8, 10, 11–13

## Outcome

Provide a repository-native, infrastructure-only CLI that provisions the first Atlas Platform Super Admin through the existing Better Auth authority and leaves the account immediately eligible for normal sign-in.

## Scope

- Add the repository-native executable command following the monorepo's package/script conventions, conceptually:

  ```bash
  pnpm atlas admin bootstrap --email admin@example.com --name "Atlas Administrator"
  ```

- Require email and name as arguments; prompt interactively for `Initial password` and `Confirm password` without accepting passwords as arguments.
- Hide password input where the terminal supports it, reject mismatches and Better Auth policy violations, and never log or print plaintext passwords.
- Acquire an exclusive durable bootstrap reservation before privileged provisioning.
- Fail closed for `SEALED`, an existing reservation belonging to another attempt, an existing conflicting platform-admin identity, or an email collision with an unrelated identity.
- Create the user and password credential through the installed Better Auth server-side API/internal authority, not public HTTP sign-up and not custom hashing/direct credential SQL when the Better Auth API is available.
- Set the identity to verified and active, assign the persisted `admin` role, verify the persisted result, and seal bootstrap state only after verification succeeds.
- Ensure a successful run does not start or depend on the Admin UI or HTTP server.
- Print the required success checklist without password or session-token material, and print success only after persisted verification.
- Define a controlled same-attempt reconciliation path for `RESERVED` state. It may not silently release reservations, delete/recreate valid credentials, or provide `--force`/`--reset` bypasses.

Do not create sessions automatically, disable public registration globally, add a hidden HTTP bootstrap route, elevate an existing ordinary user, or modify unrelated service/domain authentication.

## Acceptance criteria

- A fresh eligible installation yields exactly one verified, active Better Auth user with a credential account and persisted role `admin`.
- The credentials authenticate through the normal Better Auth sign-in endpoint immediately after successful CLI completion.
- The CLI is safe against replay and concurrent invocation; at most one attempt can seal bootstrap.
- A failure after reservation does not automatically create a second administrator or expose an unresolved admin identity through the Admin guard.
- An interrupted attempt remains durably visible and has documented controlled reconciliation for the same attempt.
- Existing unrelated email identities are not elevated, deleted, or overwritten.
- CLI output and errors contain no plaintext password, password hash, raw session token, database secret, or internal stack trace.
- The final success output contains the required operational status and configured sign-in endpoint guidance.

## Validation

- Test password prompting, mismatch, invalid-policy, non-interactive, and argument-validation behavior without logging secrets.
- Run the CLI against PostgreSQL for fresh bootstrap, replay, email collision, concurrent invocation, and interrupted-attempt scenarios.
- Verify the resulting `auth.user`, `auth.account`, and bootstrap rows using a test-only administrative connection.
- Prove immediate normal Better Auth sign-in and session establishment.
- Prove that a reserved but unsealed attempt cannot access the protected Admin endpoint.
- Run auth/database typechecks and migration checks.

## Security Refactor Readiness

Status: applicable

### Inherited boundaries

- `BOUNDARY-AA003-01` Better Auth server-side APIs own identity creation, password hashing, credential verification, and session behavior.
- `BOUNDARY-AA003-02` PostgreSQL bootstrap state owns only first-operator coordination; it is not an identity authority.

### Trust boundaries

- `TRUST-AA003-01` An authorized infrastructure operator supplies CLI arguments and interactive password input.
- `TRUST-AA003-02` The CLI crosses into Better Auth and PostgreSQL with privileged database/configuration access but must not expose that authority over HTTP.

### Sensitive assets and identity context

- `ASSET-AA003-01` Initial password, derived hash, Better Auth secret, database credentials, and session cookies/tokens are sensitive.
- `IDENTITY-AA003-01` Attempt ID, requested email, and Better Auth user ID must be correlated without persisting password material.

### Required seams

- `SEAM-AA003-01` Reservation, provisioning, verification, and sealing remain separate observable phases because Better Auth and bootstrap persistence may not share a transaction.
- `SEAM-AA003-02` Same-attempt reconciliation remains an explicit operator action with no reset/force escape hatch.

### Prohibited couplings

- `COUPLING-AA003-01` Do not use public sign-up, direct password hashing, direct password SQL, or an independent credential store.
- `COUPLING-AA003-02` Do not expose bootstrap as an HTTP endpoint or make frontend reachability part of its security.

### Intentionally unresolved security policy

- `SEC-GAP-AA003-01` Operator identity/host attestation, MFA for infrastructure operators, and full audit-retention policy remain outside this ticket.

### Mandatory review bindings

- `REV-READY-AA003-01`
  Ref: `SEAM-AA003-01`
  Question: Does the implementation handle the non-atomic Better Auth/database boundary without duplicate or unauthorized admin creation?
  Evidence: transaction/state tests and interrupted-process evidence.
- `REV-READY-AA003-02`
  Ref: `COUPLING-AA003-01`
  Question: Does credential creation remain inside Better Auth's supported server-side path?
  Evidence: CLI code, auth API path, and persisted credential verification.
- `REV-READY-AA003-03`
  Ref: `SEAM-AA003-02`
  Question: Is recovery explicit and bounded to the original attempt, with no force/reset bypass?
  Evidence: CLI help, runbook, recovery tests, and state transitions.

## Review checkpoint

- **Review question:** Can an infrastructure operator provision one immediately usable Super Admin without public signup, secret leakage, replay, or unsafe recovery behavior?
- **Implementation commit:** not yet implemented.
