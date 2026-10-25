# AA-001: Admin authority and durable bootstrap state

- **State:** `planned`
- **Review batch:** `AA-BATCH-01`
- **Depends on:** BSS-004 `approved`
- **Baseline:** [Admin Auth Foundation](../../atlas-admin-auth-foundation.md) §§2, 4.1–4.2, 6, 9, 12; [BSS-004 Better Auth persistence](../Stack_Setup/BSS-004-better-auth-persistence.md)

## Outcome

Extend the existing Better Auth integration with exactly one persisted Atlas Platform Super Admin authority and the minimal PostgreSQL-backed state needed to coordinate first-operator bootstrap.

## Scope

- Enable the installed Better Auth `admin` plugin from the existing `@atlas/auth` configuration.
- Add the Better Auth plugin's persisted user role field to the existing `auth.user` schema and migration path; `admin` is the only Atlas administrative role introduced by this ticket.
- Keep Better Auth responsible for identity, password credentials, password hashing, sign-in, sessions, expiry, and revocation.
- Add one Atlas-owned bootstrap-state table or equivalent singleton structure with durable `UNINITIALIZED`, `RESERVED`, and `SEALED` states, an exclusive attempt identity, timestamps, and enough non-secret attempt metadata for same-attempt recovery.
- Add PostgreSQL constraints/indexes needed for singleton state and exclusive reservation.
- Update the repository-native migration registry and Drizzle/auth schema definitions using existing conventions.
- Preserve the existing `auth.*` ownership and restricted application-role grants.

Do not add `admin_users`, duplicate credentials, password hashes, raw session tokens, email allowlists, `adminUserIds`, a generic RBAC engine, or any public bootstrap endpoint.

## Acceptance criteria

- Existing ordinary Better Auth users remain valid and receive the normal non-admin role.
- The only persisted authority used for Atlas Super Admin is the Better Auth user role `admin`, associated with the Better Auth user ID.
- Bootstrap state is durable across process/database-client restart and cannot contain plaintext passwords or session tokens.
- The schema prevents two concurrent reservations from both becoming authoritative.
- `SEALED` cannot be reopened by deleting, disabling, or renaming the original user.
- A missing bootstrap marker combined with an existing platform-admin identity is detected as a fail-closed conflict rather than silently creating another administrator.
- Existing Better Auth lifecycle tests and non-admin application/service database boundaries remain intact.
- The migration applies through the existing `@atlas/db` migration command and is included in `migration:check`.

## Validation

- Run the auth and database package typechecks.
- Apply the migration against PostgreSQL and run `corepack pnpm --filter @atlas/db migration:check`.
- Inspect the resulting columns, constraints, grants, and migration marker.
- Run the existing Better Auth lifecycle test and focused schema/permission tests.
- Verify that no password material or session token is present in the new migration or bootstrap table definition.

## Security Refactor Readiness

Status: applicable

### Inherited boundaries

- `BOUNDARY-AA001-01` Better Auth remains the sole identity, credential, and session authority through the accepted `auth.*` schema.
- `BOUNDARY-AA001-02` Atlas owns only the bootstrap coordination state and the meaning of the persisted `admin` role as Atlas Platform Super Admin.

### Trust boundaries

- `TRUST-AA001-01` A privileged infrastructure migration changes persistent authorization and bootstrap state.
- `TRUST-AA001-02` Better Auth user/session persistence crosses from the auth adapter into PostgreSQL under the existing database-role boundary.

### Sensitive assets and identity context

- `ASSET-AA001-01` Passwords, password hashes, session tokens, Better Auth secrets, and bootstrap attempt metadata must remain protected.
- `IDENTITY-AA001-01` The Better Auth user ID is the stable identity key joining persisted role state and later session authorization.

### Required seams

- `SEAM-AA001-01` The auth plugin configuration and schema mapping remain the single attachment point for future admin operations.
- `SEAM-AA001-02` Bootstrap state exposes a durable state transition boundary that later CLI reconciliation and guard logic can use without direct identity duplication.

### Prohibited couplings

- `COUPLING-AA001-01` Do not create a parallel identity, credential, session, or admin-user table.
- `COUPLING-AA001-02` Do not make email, environment configuration, `adminUserIds`, or frontend visibility an authorization source.

### Intentionally unresolved security policy

- `SEC-GAP-AA001-01` MFA, rate limiting, audit retention, recovery, and future multi-tier role policy remain outside this foundation ticket.

### Mandatory review bindings

- `REV-READY-AA001-01`
  Ref: `BOUNDARY-AA001-01`
  Question: Does Better Auth remain the only identity/credential/session authority?
  Evidence: auth configuration, migration, schema mapping, and lifecycle test.
- `REV-READY-AA001-02`
  Ref: `SEAM-AA001-02`
  Question: Is bootstrap coordination durable, exclusive, and free of credential/session secrets?
  Evidence: migration constraints, database inspection, and focused state tests.
- `REV-READY-AA001-03`
  Ref: `COUPLING-AA001-01`
  Question: Are duplicate identity and authorization stores absent?
  Evidence: changed-file review and database schema inventory.

## Review checkpoint

- **Review question:** Does this batch establish exactly one persisted admin authority and one durable bootstrap-state authority without changing Better Auth ownership?
- **Implementation commit:** not yet implemented.
