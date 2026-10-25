# AA-BATCH-02 GO checkpoint

- **Ticket:** AA-002 — Server-side Admin guard and protected identity endpoint
- **Ticket authority:** `project's goal/Backend_Phase/tickets/Admin_Auth_Phase/AA-002-server-admin-guard-and-identity-endpoint.md`
- **Accepted predecessor:** AA-001 (`PASS`, commit `72006e8f`)
- **Review target:** `HEAD` (this committed AA-BATCH-02 checkpoint)
- **Ticket state:** `awaiting_review`

## Bounded implementation

- Added `createAtlasAdminGuard`, the one reusable server-side Admin API guard. It delegates session validity to Better Auth, then requires the persisted Better Auth `admin` role and AA-001's globally `SEALED` bootstrap marker.
- Added `GET /api/admin/identity`, which composes that guard and returns only the Better Auth user ID, email, name, and normalized `admin` role.
- Exposed the existing Better Auth database handle only to permit this Atlas API authorization read through its established application connection. No identity, credential, session, JWT, or bootstrap-provisioning authority was added.
- Added focused guard and request-level tests. The request test uses actual PostgreSQL-backed Better Auth cookies; it creates only disposable users and rolls back its test-only sealed-state fixture.

## Review Contract Closure

| Row | Ticket authority | Required proof | Evidence / validation | Status |
|---|---|---|---|---|
| RC-AA002-01 | Outcome; scope; AUTH-04–AUTH-06; `BOUNDARY-AA002-01`; `REV-READY-AA002-02` | The server guard resolves Better Auth sessions from request cookies and returns `401` for absent, malformed, expired, revoked, or otherwise invalid sessions. | `apps/atlas/lib/admin-guard.ts`; `apps/atlas/tests/admin-identity.integration.test.mjs` creates real Better Auth cookies against PostgreSQL and observes `401` for absent, malformed, expired, and signed-out (revoked) cookies. | PROVEN |
| RC-AA002-02 | Scope; acceptance criteria; `SEAM-AA002-01`; `TRUST-AA002-02` | A valid ordinary session is `403`; only a persisted Better Auth `admin` role with globally `SEALED` bootstrap state succeeds. A reserved/unsealed state cannot authorize an admin user. | `apps/atlas/lib/admin-guard.ts`; database-backed request test observes `403` for an ordinary cookie and for an `admin` role before the marker is sealed, then `200` only inside a rollback-only AA-001-compatible sealed-state fixture. | PROVEN |
| RC-AA002-03 | Outcome; scope; `SEAM-AA002-01`–`02`; `REV-READY-AA002-01` | One reusable server guard is composed by the protected identity route; its success response contains only ID, email, name, and normalized `admin` role. | `apps/atlas/app/api/admin/identity/route.ts`; `apps/atlas/tests/admin-guard.test.mjs` asserts reuse, `401`/`403`, exact success JSON, and no response cookie fields. | PROVEN |
| RC-AA002-04 | Scope exclusions; `COUPLING-AA002-01`–`02`; `REV-READY-AA002-03` | No custom tokens, email allowlists, frontend boundary, domain bypass, project/domain mutation, or exposure of password/hash/token/secret data is introduced; existing Better Auth lifecycle remains intact. | Changed-file inspection; exact identity response assertion; `corepack pnpm --filter @atlas/auth test` passed (3/3) and confirms normal sign-up, session restart, and sign-out lifecycle. | PROVEN |
| RC-AA002-05 | Validation | Focused request tests, existing auth lifecycle, migration registration, and directly affected typechecks are executed. | `node --test apps/atlas/tests/admin-guard.test.mjs apps/atlas/tests/admin-identity.integration.test.mjs` passed (3/3); `corepack pnpm --filter @atlas/db migration:check` passed; `corepack pnpm --filter @atlas/auth typecheck` passed. The repository-wide app typecheck was executed and still reports only pre-existing failures in unrelated UI, worker-runtime, and fixture source paths; it reports no AA-002 path error. | PROVEN |

Internal readiness: READY_FOR_CK

This is an implementation readiness checkpoint, not a self-issued PASS. AA-003 through AA-005 remain out of scope.
