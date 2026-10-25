# GO checkpoint: AA-BATCH-03

- Ticket / batch: `AA-003` / `AA-BATCH-03`
- Authorized implementation commit: `22cea9fb7097291c9fe29d3b3a68618b1556cd52`
- Frozen ticket: `project's goal/Backend_Phase/tickets/Admin_Auth_Phase/AA-003-bootstrap-coordinator-and-recovery.md`
- Accepted predecessor: AA-001 `PASS`, commit `72006e8f`; AA-002 is not an AA-003 dependency.
- Ticket state after this checkpoint: `awaiting_review`

## Bounded implementation

Added `createAtlasBootstrapCoordinator` to `@atlas/auth`. It is a private,
server-side factory with no route or CLI handler. Its provision operation locks
the singleton marker, rejects sealed/reserved/admin-conflict/email-collision
states, reserves one attempt, delegates identity and credential creation to
Better Auth's installed `auth.api.createUser`, rereads the user/account/role
rows, and seals only a verified active credentialed `admin` identity. Its only
recovery operation accepts the recorded attempt ID and can reread/verify/seal;
it never creates, resets, deletes, or overwrites an identity or credential.

The interruption hook is test-only and exposes the required distinct reserve,
identity-created, and pre-seal phases. Coordinator errors carry stable safe
codes without stack details; no password, credential hash, session material,
database secret, or raw provider failure is stored or returned.

## Review Contract Closure

| Row | Ticket authority | Required proof | Evidence / exact validation | Status |
|---|---|---|---|---|
| RC-AA003-01 | Outcome; scope; acceptance criterion 1; AUTH-07 | One durable `UNINITIALIZED -> RESERVED -> SEALED` attempt survives true concurrent contention; sealed replay creates nothing and cannot reopen. | `packages/atlas-auth/src/bootstrap-coordinator.ts`; PostgreSQL integration test races two `provision` calls, observes exactly one sealed attempt/identity, then observes `BOOTSTRAP_SEALED` replay rejection. | PROVEN |
| RC-AA003-02 | Outcome; scope; acceptance criterion 2; `BOUNDARY-AA003-01`; `REV-READY-AA003-02` | Better Auth alone creates the verified active credentialed identity and persisted `admin` role; the coordinator rereads user/account/role before sealing. | Coordinator invokes only `auth.api.createUser`; integration inspection observes one `auth.user` row with `emailVerified=true`, `banned=false`, `role=admin`, and a Better Auth credential account. No direct credential SQL or custom hash exists. | PROVEN |
| RC-AA003-03 | Scope; acceptance criteria 4–5; AUTH-09; `SEAM-AA003-01`; `TRUST-AA003-02`; `COUPLING-AA003-02`; `REV-READY-AA003-01` and `REV-READY-AA003-03` | Deterministic interruption after reserve, identity creation, and before seal leaves `RESERVED` non-authorizing state; only the original attempt may reconcile an existing verified identity and otherwise fails closed. | `packages/atlas-auth/tests/bootstrap-coordinator.integration.test.ts` injects all three boundaries. It observes durable reservations, no automatic second creation, rejects reconcile without a verified identity, and seals only the recorded attempt after post-creation interruptions. | PROVEN |
| RC-AA003-04 | Scope; acceptance criterion 6; AUTH-08 and AUTH-10 | Existing admin and unrelated-email collisions are rejected without elevation, overwrite, deletion, or duplicate administrator. | Integration test verifies concurrent loser rejection and independent ordinary-user email collision leaves role `user`; reservation also calls AA-001's missing-marker/admin conflict fence. | PROVEN |
| RC-AA003-05 | Scope exclusions; AUTH-12; `SEAM-AA003-02`; `COUPLING-AA003-01` | Coordinator remains private, adds no HTTP/public-registration authority, and existing application/service authentication stays unchanged. | Changed-file inspection: exports only a server-side coordinator factory; no route, handler, CLI, public sign-up call, session creation, or authorization bypass is added. `@atlas/auth` lifecycle proof confirms public sign-up remains an ordinary `user`; directly affected AA-002 API tests pass. | PROVEN |
| RC-AA003-06 | Acceptance criterion 7; AUTH-14; `ASSET-AA003-01`; `IDENTITY-AA003-01` | Coordinator metadata, errors, logs, and test artifacts omit plaintext password, hash, tokens, secrets, and internal stack details. | Integration test uses a sentinel password and asserts returned error/serialized marker do not contain it or coordinator stack paths; marker is limited to non-secret attempt ID/email/user correlation. Errors clear `stack` and expose a stable code only. | PROVEN |
| RC-AA003-07 | Validation | Actual PostgreSQL/Better Auth scenarios, auth/database typechecks, migration check, existing Better Auth lifecycle, and direct guard regression run. | `node --env-file=.env packages/atlas-db/scripts/migrate.mjs --check`: PASS. `corepack pnpm --filter @atlas/db typecheck`: PASS. `corepack pnpm --filter @atlas/auth typecheck`: PASS. With repository `.env` loaded into the process: `corepack pnpm --filter @atlas/auth test`: PASS (config 2/2, lifecycle 1/1, coordinator 1/1). `node --test apps/atlas/tests/admin-guard.test.mjs apps/atlas/tests/admin-identity.integration.test.mjs`: PASS (3/3). `git diff --check`: PASS. | PROVEN |

Internal readiness: READY_FOR_CK

This is an implementation readiness checkpoint, not a self-issued PASS. AA-004
and AA-005 remain out of scope. CK should review commit
`22cea9fb7097291c9fe29d3b3a68618b1556cd52` and this checkpoint.
