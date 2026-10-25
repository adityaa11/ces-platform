# ATLAS — ADMIN AUTH FOUNDATION + FIRST SUPER ADMIN CLI BOOTSTRAP

**Status:** GO — Implementation Authorized
**Target branch:** `codex/new-atlas-backend`
**Scope:** Backend authentication, admin authorization foundation, and first Super Admin provisioning.

## 1. Objective

Implement the authentication and authorization foundation for the future Atlas Administration Console, including a secure CLI mechanism to provision the first Super Admin.

The bootstrap must produce an immediately usable administrator account.

Expected operational flow:

```text
Authorized Infrastructure Operator
    |
    v
Atlas Admin Bootstrap CLI
    |
    v
Existing Better Auth Authority
    |
    v
Create User + Password Credentials
    |
    v
Assign Full Atlas Platform Admin Privileges
    |
    v
Seal Bootstrap State
    |
    v
BOOTSTRAP COMPLETED
    |
    v
Admin signs in using Better Auth
    |
    v
Valid Session + Full Admin Authorization
    |
    v
Ready for Atlas Admin Console
```

**Critical requirement:** The account must be fully active immediately after successful bootstrap. No invitation acceptance, account activation, email verification link, additional approval, or mandatory onboarding step is required.

The CLI does not need to log the administrator in automatically. The credentials must simply be ready for the existing Better Auth sign-in flow.

## 2. Implementation Authority and Repository Inspection

Before editing, inspect the actual repository and identify:

- Existing Better Auth configuration and version.
- Existing Better Auth database schema, adapters, migrations, and password credential support.
- Existing authentication and session resolution paths.
- Existing user role or permission representation.
- Existing server route and middleware conventions.
- Existing CLI/package execution conventions.
- Existing PostgreSQL migration and integration testing conventions.
- Existing administrative or privileged authorization mechanisms, if any.

Reuse existing authorities wherever possible.

Do not create new authentication infrastructure when Better Auth already provides the required capability.

The installed Better Auth version is authoritative. Do not assume a CLI feature from a newer or beta version is available locally.

If Better Auth already provides an appropriate admin-creation API or CLI mechanism, reuse it behind the Atlas-specific bootstrap guard.

Do not introduce a second identity store, password hashing service, session system, or independent login authority.

The inspection is part of this authorized implementation task. Proceed directly to implementation after establishing the existing integration points. Do not stop merely to request another GO.

## 3. Scope Boundaries

### In scope

**Admin Auth Foundation**

- Establish one persisted Super Admin authorization authority.
- Reuse existing Better Auth identity and session mechanisms.
- Provide reusable server-side authorization protection for Atlas Admin APIs.
- Ensure existing non-admin users cannot access Admin APIs.
- Establish the admin session/identity contract for future Admin UI integration.
- Preserve current application and service authentication behavior.

**First Super Admin Bootstrap**

- Add an executable Atlas CLI command.
- Provision a Better Auth user with email/password credentials.
- Assign full Atlas platform administrator privileges.
- Make the user immediately eligible for normal Better Auth sign-in.
- Prevent ordinary bootstrap from succeeding more than once.
- Support safe handling of interrupted bootstrap attempts.
- Provide integration tests and operational instructions.

### Out of scope

Do not implement:

- Admin Login UI.
- Admin Dashboard UI.
- Provider Profile UI integration.
- Public Admin Registration.
- Operator invitation or registration.
- Multiple admin role tiers.
- Permission management UI.
- Mandatory MFA enrollment.
- Account activation workflow.
- Password recovery UI.
- New authentication microservice.
- BSS provider configuration modifications.
- GHR, IDSER, Semantic, or other unrelated runtime changes.

Do not add a placeholder admin dashboard simply to demonstrate authentication.

## 4. Admin Authentication Foundation

### 4.1 Identity authority

Better Auth remains the single source of authority for:

- User identity.
- Password credentials.
- Password hashing and verification.
- Sign-in.
- Session creation.
- Session validation.
- Session expiration and revocation.

The Admin Console must use the same existing Better Auth infrastructure.

Do not introduce a separate `admin_users` identity table containing duplicate user accounts or credentials.

### 4.2 Admin authorization

For this initial implementation, define exactly one administrative privilege level:

**Atlas Platform Super Admin**

This privilege grants access to all current and future Atlas Admin modules.

Prefer reusing the Better Auth Admin plugin's persisted `admin` role if that role is not already serving a different authorization meaning.

For the initial implementation, `admin` may represent Atlas Platform Super Admin.

If the existing repository already contains a suitable platform administrator role, reuse that role instead.

Do not create two separate persisted roles that both independently represent the same Super Admin authority.

Do not use hardcoded emails, environment-variable email allowlists, or Better Auth `adminUserIds` as an alternative authorization source.

The role must be persisted and associated with the Better Auth user ID.

### 4.3 Authorization guard

Implement one reusable server-side guard that:

1. Resolves the existing Better Auth session.
2. Rejects absent, expired, revoked, or otherwise invalid sessions.
3. Resolves the authenticated user.
4. Evaluates persisted administrator privileges.
5. Rejects users without the required authority.
6. Allows valid Super Admin requests to proceed.

Expected behavior:

```text
No session
    -> 401 Unauthorized

Invalid or expired session
    -> 401 Unauthorized

Valid session, ordinary user
    -> 403 Forbidden

Valid session, Super Admin
    -> Authorized
```

Use the repository's existing session resolver and request middleware conventions.

Do not create a separate admin token or JWT protocol.

Keep the authorization check at the server API boundary, not only in frontend middleware.

The guard must be reusable by all future Admin Atlas modules.

If the initial repository does not yet contain administrative module routes, expose one small protected admin identity/session endpoint using existing routing conventions so that future Admin UI integration and current integration tests have a concrete authorization boundary.

That endpoint should return only minimal non-sensitive identity information, such as:

```json
{
  "user": {
    "id": "better-auth-user-id",
    "email": "admin@example.com",
    "name": "Atlas Administrator"
  },
  "role": "admin"
}
```

This is an illustrative contract. Align exact types and response conventions with the repository.

Do not expose password hashes, raw session tokens, or internal secrets.

### 4.4 Full administrative privileges

A successfully bootstrapped Super Admin must be recognized as authorized for every Atlas Admin module, including future modules such as:

- Dashboard.
- Project administration.
- Provider Profiles.
- Model Management.
- BSS configuration.
- Operational configuration.
- Operator administration.
- Other administrative modules introduced later.

This does not mean bypassing existing domain authority.

For example, Super Admin may initiate an administrative BSS operation, but the operation must still follow existing BSS validation, publication, approval, and activation contracts.

Administrative privilege must not bypass domain-level safety or data-integrity rules.

Do not modify unrelated background-worker, service-to-service, GHR, or BSS runtime authentication paths to accommodate browser admin access.

## 5. CLI Bootstrap

### 5.1 Command

Provide a repository-native executable command conceptually equivalent to:

```bash
pnpm atlas admin bootstrap \
  --email admin@example.com \
  --name "Atlas Administrator"
```

The exact package script and command implementation should follow the existing monorepo conventions.

The CLI must work without the Admin UI or HTTP server being started, provided the required database and configuration are available.

### 5.2 Credential input

The CLI must securely prompt for:

```text
Initial password:
Confirm password:
```

Passwords must not be included in command-line arguments.

Requirements:

- Hide password input when supported by the terminal.
- Apply the existing Better Auth password policy.
- Reject mismatching or invalid passwords.
- Never log or print plaintext passwords.
- Do not persist credentials in shell history.
- Do not introduce custom password hashing.

Password hashing and credential persistence must use Better Auth's supported server-side mechanisms.

### 5.3 Account provisioning

The resulting account must have:

```text
Email: specified through CLI
Name: specified through CLI
Password: securely provided
Email verified: true
Account status: active
Platform role: Super Admin
Sign-in eligible: immediately
```

Mark the email verified as part of this trusted infrastructure provisioning operation.

Do not require an email-verification link or activation email.

Use Better Auth's existing schema and credential creation path.

Do not create identity or password records through direct SQL if an appropriate Better Auth API is available.

Do not use a regular public sign-up endpoint as the privileged bootstrap mechanism.

If the installed Better Auth version exposes a suitable server-side administrator creation API, prefer it.

Avoid upgrading Better Auth solely to obtain a convenience CLI command unless technically necessary.

### 5.4 Successful output

After successful provisioning, display:

```text
ATLAS ADMIN BOOTSTRAP

[PASS] Database connectivity
[PASS] Authentication configuration
[PASS] Bootstrap eligibility
[PASS] Exclusive bootstrap reservation
[PASS] Administrator identity created
[PASS] Super Admin privilege assigned
[PASS] Credentials ready for sign-in
[PASS] Bootstrap state sealed

SUCCESS

Atlas Super Admin is ready.

Email: admin@example.com
Role: Super Admin
Status: Active

Use the configured Better Auth sign-in endpoint
to authenticate with these credentials.
```

Never display the password or session token.

Only print success after the persisted result has been verified.

## 6. One-Time Bootstrap Authority

Bootstrap must only provision the first Super Admin.

Provide durable PostgreSQL-backed bootstrap state using the existing Atlas migration conventions.

The bootstrap marker is infrastructure state, not a second identity authority.

It may persist:

```text
bootstrap_key
state
attempt_id
initial_user_id
started_at
completed_at
```

Exact schema and constraints should follow existing database conventions.

Use three conceptual states:

```text
UNINITIALIZED
    |
    v
RESERVED
    |
    v
SEALED
```

### UNINITIALIZED

No completed first-operator bootstrap exists.

The CLI may attempt provisioning after checking existing platform admin identities and the database state.

Existing ordinary users must not be elevated or deleted.

If existing administrator authority conflicts with the missing bootstrap record, fail closed rather than creating another administrator.

### RESERVED

An exclusive bootstrap attempt has been recorded.

A second concurrent attempt must be rejected.

The reservation must be durable.

Do not automatically release it merely because the first CLI process crashed.

### SEALED

The initial Super Admin has been created and the bootstrap result verified.

All subsequent normal bootstrap attempts must fail.

Deleting, disabling, or renaming the original account must never reopen first-operator bootstrap.

No `--force` or `--reset` override should bypass the one-time guarantee.

### Concurrency and failure handling

Use PostgreSQL constraints and transactions or an equivalent exclusive coordination mechanism to prevent concurrent successful bootstraps.

Account creation through Better Auth and Atlas bootstrap persistence may not share a single database transaction.

Do not assume cross-component atomicity without proof.

If a process fails after creating the Better Auth identity but before sealing bootstrap:

- Do not create another administrator automatically.
- Preserve enough state to identify the original attempt.
- Prevent unresolved bootstrap identities from exercising administrative permissions.
- Allow a controlled reconciliation of that same attempt.
- Avoid deleting or recreating valid credentials without an explicit recovery decision.

Administrative access should require both valid administrator authority and a completed global bootstrap state while this initial system is being established.

The bootstrap marker must not permanently restrict future legitimately authorized administrators to the original bootstrap user ID.

## 7. Public Registration and Authentication Boundaries

Atlas Admin must not expose public administrator registration.

Regular public sign-up must never grant administrator privileges.

If existing Atlas user-facing sign-up functionality is present, preserve its behavior unless changing it is explicitly required for this task.

Do not globally disable unrelated application registration simply because the Admin Console is invitation-only.

Ensure that no public HTTP request can invoke the privileged first-operator provisioning operation.

Bootstrap must be available only through an authorized infrastructure execution context with database access.

Do not introduce a hidden HTTP bootstrap endpoint.

Do not rely on frontend visibility or route naming for security.

## 8. Immediate Login Requirement

The following must be true after a successful CLI run:

```text
Bootstrap completed
       |
       v
Administrator credentials are valid
       |
       v
Existing Better Auth sign-in succeeds
       |
       v
Session is persisted
       |
       v
Protected Admin endpoint returns success
```

No further database modification, role promotion, invitation acceptance, activation, or approval should be necessary.

The future Admin Login UI should only need to consume the existing Better Auth sign-in and session APIs.

It must not require changes to the bootstrap mechanism.

Mandatory MFA is not part of this initial delivery. Preserve compatibility with adding MFA enforcement later without creating another authentication authority.

## 9. Database and Migration Requirements

Use the existing Atlas PostgreSQL migration pipeline.

Before adding any schema:

- Inspect whether Better Auth Admin plugin fields already exist.
- Inspect whether administrative roles already exist.
- Inspect any existing bootstrap or installation-state table.
- Reuse compatible structures instead of duplicating them.

Add only the minimal schema required for the first-operator bootstrap and missing authorization support.

Never store plaintext passwords, duplicate password hashes, or raw session tokens in bootstrap persistence.

Do not alter BSS persistence, capacity snapshots, provider profiles, or GHR handoff schemas.

## 10. Integration Tests

Run integration tests against the actual database-backed Better Auth configuration.

Required scenarios:

**AUTH-01 — Initial bootstrap**

Given a fresh eligible installation, running the CLI creates one verified, active Super Admin.

**AUTH-02 — Immediate authentication**

The bootstrapped credentials successfully authenticate through the existing Better Auth sign-in mechanism.

**AUTH-03 — Administrative access**

The resulting session successfully accesses a protected Atlas Admin endpoint.

**AUTH-04 — No session**

An unauthenticated request is rejected.

**AUTH-05 — Ordinary user**

A valid Better Auth session belonging to a non-admin user is rejected from Admin APIs.

**AUTH-06 — Expired or revoked session**

Expired or revoked sessions cannot access Admin APIs.

**AUTH-07 — Bootstrap replay**

Running the bootstrap command again fails without creating additional users or changing credentials.

**AUTH-08 — Concurrent bootstrap**

Two concurrent bootstrap attempts cannot both obtain provisioning authority.

**AUTH-09 — Interrupted bootstrap**

A failure between reservation, identity provisioning, and finalization does not result in duplicate Super Admin accounts or an unauthorized usable admin.

**AUTH-10 — Existing identity collision**

Attempting bootstrap with an email already associated with an unrelated existing identity fails safely and does not elevate that account.

**AUTH-11 — Privilege durability**

Restarting the application and database clients does not remove or silently alter the bootstrapped administrator privilege or sealed bootstrap state.

**AUTH-12 — No public privilege escalation**

Public registration, ordinary user updates, and unauthenticated requests cannot grant Super Admin privileges.

**AUTH-13 — Domain isolation**

Existing non-admin and service-to-service authentication behavior is not regressed.

**AUTH-14 — Credential secrecy**

Password material is absent from CLI logs, output, SQL bootstrap metadata, and error messages.

**AUTH-15 — Real sign-in round trip**

Demonstrate an end-to-end flow using the actual Better Auth sign-in API and its issued session cookie, followed by a protected Admin API request.

Mock-only verification is insufficient for the final authentication and bootstrap acceptance.

## 11. Definition of Done

Implementation is complete only when:

1. The Atlas CLI can create the first Super Admin.
2. Its credentials are ready for immediate login.
3. Better Auth authenticates those credentials without special handling.
4. One persisted administrator privilege authority is established.
5. Admin APIs enforce authentication and authorization server-side.
6. The Super Admin session is authorized.
7. Ordinary users and unauthenticated requests are rejected.
8. Second or concurrent bootstrap attempts are rejected.
9. Interrupted attempts have safe, documented recovery behavior.
10. Existing application authentication and domain runtime paths remain functional.
11. Migration, typecheck, and integration tests pass.
12. The implementation includes a concise operator runbook.

The runbook must contain:

- Prerequisites.
- Exact repository-native CLI invocation.
- Required environment configuration.
- Password input behavior.
- Example successful output.
- How to verify sign-in through Better Auth.
- How to verify authorization.
- Expected behavior on repeat invocation.
- Recovery instructions for interrupted attempts.

## 12. Implementation Constraints

- One Better Auth authority.
- One persisted administrator role authority.
- One reusable server authorization guard.
- One first-operator bootstrap path.
- No legacy compatibility lane.
- No parallel authentication path.
- No custom password or session implementation.
- No automatic background bootstrap on application startup.
- No duplicate Super Admin provisioning.
- No browser session dependencies for CLI execution.
- No changes to existing domain approval or operational authorities.
- No UI implementation in this scope.

Do not introduce a generic authentication framework or configurable RBAC engine when a single Super Admin role is sufficient.

Prefer the smallest implementation that satisfies all acceptance criteria.

## 13. Execution Instruction

**GO — Implement this scope directly.**

Start by inspecting the actual repository, then implement the required changes using established Atlas conventions.

Do not stop after planning or producing a design proposal.

Do not create a separate planning ticket set unless an existing repository governance rule explicitly requires it.

Preserve existing behavior and report any substantive incompatibility discovered during execution.

At completion, provide:

- Implementation summary.
- Files changed.
- Database migrations added.
- CLI invocation.
- Actual Better Auth integration path used.
- Exact Super Admin authorization representation.
- Integration test results.
- Remaining limitations, if any.
- Commit hash and implementation checkpoint.

The primary success evidence is:

**A Super Admin created through the Atlas CLI can immediately sign in through Better Auth and successfully access the protected Atlas Admin API, without any additional activation or authorization step.**
