# AA-003: Bootstrap coordinator and controlled recovery

- **State:** `awaiting_review`
- **Review batch:** `AA-BATCH-03`
- **Depends on:** AA-001 `PASS`
- **Baseline:** [Admin Auth Foundation](../../atlas-admin-auth-foundation.md) §§5.3, 6–7, 9–13

## Outcome

Provide one server-side, infrastructure-only coordinator that makes the non-atomic first-Super-Admin transition safe: reserve one attempt, provision through Better Auth, verify the persisted result, and seal the state. The coordinator is the only authority the later CLI may use for bootstrap or explicit same-attempt reconciliation.

## Scope

- Add a narrow server-side coordinator whose inputs are an operator-supplied email, name, and in-memory password; it must not expose an HTTP route or start a server.
- Atomically acquire the durable `UNINITIALIZED -> RESERVED` attempt before privileged provisioning, and reject `SEALED`, another attempt's reservation, an existing platform-admin conflict, or an unrelated email collision.
- Use the installed Better Auth server-side authority to create the verified, active user and password credential, then assign the persisted `admin` role. Do not use public sign-up, direct credential SQL, custom hashing, or a second identity store.
- Treat Better Auth creation and Atlas bootstrap persistence as non-atomic: persist enough non-secret correlation data to verify the original attempt, verify its user/credential/role result, and transition only that attempt to `SEALED`.
- Make unresolved `RESERVED` state non-authorizing: neither its identity nor any other identity may reach the Admin guard until successful verification and sealing.
- Provide one explicit, controlled reconciliation operation for the recorded attempt. It may complete only the original correlated attempt after re-verifying persisted state; it may not silently release a reservation, create another identity, delete/recreate credentials, or offer `--force`/`--reset` semantics.
- Keep the coordinator private to the infrastructure execution context and leave public registration, existing application authentication, and service-to-service authentication unchanged.

Do not implement command-line parsing or terminal prompting in this ticket; AA-004 is the only operator interface. Do not add Admin UI, a hidden HTTP bootstrap route, session creation, domain-authority bypasses, or role-management features.

## Acceptance criteria

- At most one attempt can reserve and seal bootstrap state, including under concurrent invocations.
- A successful coordinator call leaves exactly one Better Auth user that is verified, active, credentialed through Better Auth, and has persisted role `admin`; it seals only after rereading and verifying that result.
- Replay after `SEALED` does not create users, alter credentials, or reopen bootstrap.
- An interruption at each boundary (after reserve; after identity creation; before seal) leaves durable, non-authorizing `RESERVED` state and never causes automatic duplicate provisioning.
- Controlled reconciliation acts only on the original attempt and either safely seals its verified existing identity or fails closed with durable diagnostic state.
- An unrelated existing email identity is never elevated, overwritten, or deleted.
- No public registration, ordinary user update, or unauthenticated action can reach coordinator authority or grant `admin`.
- Coordinator metadata, errors, logs, and test artifacts contain no plaintext password, password hash, raw session token, database secret, or internal stack trace.

## Validation

- Against the actual PostgreSQL/Better Auth configuration, prove AUTH-07 through AUTH-10 and AUTH-12, including true concurrent reservation contention and deterministic interruption injection at each named transition boundary.
- Exercise initial coordinator provisioning with a unique test identity and inspect the resulting user, account, role, and bootstrap rows through a test-only administrative connection.
- Expose the durable state information that AA-002's guard consumes; AA-005 owns the actual CLI-created reserved/then-sealed identity and protected-route composition proof, so this ticket does not duplicate guard behavior.
- Add secrecy assertions over coordinator output, errors, logs, and persisted bootstrap metadata for AUTH-14.
- Run affected auth/database typechecks, migration checks, and the existing Better Auth lifecycle proof.

## Security Refactor Readiness

Status: applicable

### Inherited boundaries

- `BOUNDARY-AA003-01` Better Auth server-side APIs remain the sole identity, credential, password-hashing, session, and sign-in authority.
- `BOUNDARY-AA003-02` AA-001 bootstrap persistence coordinates first-operator state only; it does not become an identity or credential store.

### Trust boundaries

- `TRUST-AA003-01` A privileged infrastructure caller crosses from the coordinator into Better Auth and PostgreSQL without exposing that capability over HTTP.
- `TRUST-AA003-02` Non-atomic Better Auth and bootstrap-persistence writes must be reconciled by attempt identity, not assumed atomic.

### Sensitive assets and identity context

- `ASSET-AA003-01` The supplied password, derived hash, Better Auth configuration, database credentials, and any session material are sensitive.
- `IDENTITY-AA003-01` Attempt ID, requested email, and Better Auth user ID must correlate one attempt without persisting password material.

### Required seams

- `SEAM-AA003-01` Reservation, provision, verification, seal, and explicit reconciliation remain observable distinct phases.
- `SEAM-AA003-02` The private coordinator is the only seam AA-004 may call; no HTTP or public-registration path can substitute for it.

### Prohibited couplings

- `COUPLING-AA003-01` Do not use public sign-up, direct password SQL/hashing, an independent credential store, or a second authorization identity.
- `COUPLING-AA003-02` Do not turn an interrupted reservation into an automatic reset, deletion, or new identity creation.

### Intentionally unresolved security policy

- `SEC-GAP-AA003-01` Infrastructure-operator attestation, audit-retention policy, and MFA enforcement remain future policy layers.

### Mandatory review bindings

- `REV-READY-AA003-01`
  Ref: `SEAM-AA003-01`
  Question: Do the non-atomic phases prevent duplicate or usable unresolved administrators and permit only same-attempt recovery?
  Evidence: PostgreSQL/Better Auth transition tests, interruption evidence, and reconciliation tests.
- `REV-READY-AA003-02`
  Ref: `BOUNDARY-AA003-01`
  Question: Does credential and identity creation remain entirely in the installed Better Auth server-side path?
  Evidence: coordinator implementation, persisted credential verification, and changed-file review.
- `REV-READY-AA003-03`
  Ref: `COUPLING-AA003-02`
  Question: Is recovery explicit, correlated, and free of force/reset or destructive credential behavior?
  Evidence: coordinator API/tests and persisted-state inspection.

## Review checkpoint

- **Review question:** Does one private coordinator make the required non-atomic first-operator state transition and recovery safe without creating a parallel authentication authority?
- **Implementation commit:** `22cea9fb7097291c9fe29d3b3a68618b1556cd52`
