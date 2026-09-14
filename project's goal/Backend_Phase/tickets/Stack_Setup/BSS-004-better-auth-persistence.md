# BSS-004: Better Auth persistence

- **State:** `planned`
- **Review batch:** BSS-BATCH-04
- **Depends on:** BSS-003
- **Baseline:** [Production Baseline](../../atlas-backend-production-baseline.md) §§2, 3, 4, 12, 21

## Outcome

Use Better Auth with its Drizzle adapter to persist user identity and sessions in PostgreSQL's authentication schema.

## Scope

- Add Better Auth configuration to the Atlas application server/API boundary.
- Generate and apply Better Auth's authentication schema through the established migration process.
- Configure sign-up, sign-in, session lookup, and sign-out endpoints needed to establish identity.
- Load secrets and allowed origins from environment configuration; document variable names in `.env.example` without real values.
- Keep Atlas project membership, roles, and resource authorization in Atlas-owned services and schemas.

## Acceptance criteria

- Better Auth uses the Drizzle adapter and persists users, sessions, accounts, and verification records in the `auth` schema.
- A test can create a user, establish a session, read that session on a subsequent request, and invalidate it on sign-out.
- Better Auth tables are not placed in or treated as Atlas domain tables.
- An unauthenticated request has no implicit project access; project authorization remains a separate Atlas responsibility.
- Missing production secrets or invalid origins fail safely and do not expose secret values in logs or responses.
- Existing fixture-driven UI routes remain available for the prototype; this ticket does not implement production project RBAC or replace fixture screens.

## Validation

- Run migrations against an empty database and exercise the authentication lifecycle in integration tests.
- Verify stored sessions survive an application restart and sign-out invalidates the session.
- Test missing-secret and invalid-origin startup/configuration behavior.
- Run workspace type-check, build, and tests.

## Review checkpoint

- **Review question:** Does Better Auth persist identity and sessions in its own PostgreSQL schema without taking ownership of Atlas authorization?
- **Combined acceptance:** Authentication tables remain in `auth`, the tested session lifecycle is durable, and project membership/authorization remain outside Better Auth.
- **Commit to review:** Pending implementation commit.
