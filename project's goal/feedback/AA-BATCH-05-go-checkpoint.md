# GO checkpoint: AA-BATCH-05

- Ticket / batch: `AA-005` / `AA-BATCH-05`
- Frozen ticket: `project's goal/Backend_Phase/tickets/Admin_Auth_Phase/AA-005-auth-round-trip-regression-and-runbook.md`
- Implementation commit: `3e1e8bb048f78854e7cb7e540fc46273b35db189`
- Ticket state: `awaiting_review`
- Accepted predecessors: AA-002 `PASS` (`1ba8b5ce`), AA-003 `PASS`
  (`b95cf047`), AA-004 `PASS` (`027221c4`)

## Bounded implementation

Added `apps/atlas/tests/admin-auth-round-trip.integration.test.mjs`. With the
configured PostgreSQL database and Better Auth handler, it runs the approved
CLI implementation against a unique temporary identity, sends the actual
Better Auth sign-in request, obtains its non-logged session cookie, and passes
that cookie to the protected Admin identity handler. It then closes and
recreates the application/database client before repeating authorization and
checks the persisted role and global marker are `admin` and `SEALED`.

Added `docs/admin-bootstrap-runbook.md`, covering required configuration,
native command, masked password behavior, safe success output, sign-in and
authorization verification, sealed repeat behavior, and same-attempt-only
reconciliation. No persistence, guard, coordinator, CLI, public registration,
or service authority changed.

## Recorded integration context

- Changed files in `3e1e8bb0`: the AA-005 integration test, the runbook, the
  AA-005 ticket record, and the Admin Auth ticket-set README.
- Environment prerequisites: `DATABASE_URL`, `BETTER_AUTH_SECRET`, and
  `BETTER_AUTH_URL`, with `BETTER_AUTH_TRUSTED_ORIGINS` when it differs, plus
  `ATLAS_APP_PASSWORD` for the `atlas_app` integration client. Values were
  loaded locally and are not recorded here.
- Actual path: `pnpm atlas admin bootstrap` implementation →
  `createAtlasBootstrapCoordinator` → Better Auth
  `POST /api/auth/sign-in/email` handler → issued `better-auth` session cookie
  → `createAdminIdentityHandler` for `GET /api/admin/identity`.
- Role representation: Better Auth `auth.user.role = 'admin'`, paired with
  `atlas.admin_bootstrap_state.state = 'SEALED'`; no new role or state schema
  was added. The required AA-001 migrations
  `0109_aa001_admin_authority_and_bootstrap_state`,
  `0110_aa001_bootstrap_reservation_fence`, and
  `0111_aa001_bootstrap_conflict_and_sealed_fence` were already applied.

## Review Contract Closure

| Row | Ticket authority | Required proof | Evidence / exact validation | Status |
|---|---|---|---|---|
| `RC-AA005-01` | Outcome; scope 1; acceptance 1–2; AUTH-03, AUTH-15; `SEAM-AA005-01`; `REV-READY-AA005-01`; `COUPLING-AA005-01` | An AA-004 CLI-created identity signs in through the real Better Auth HTTP handler; its issued cookie alone reaches the protected Admin endpoint and returns minimal admin identity. | `apps/atlas/tests/admin-auth-round-trip.integration.test.mjs`; `corepack pnpm --filter @atlas/app exec node --test tests/admin-auth-round-trip.integration.test.mjs` — PASS (1/1). The test never logs its password or raw cookie. | PROVEN |
| `RC-AA005-02` | Outcome; scope 2; acceptance 3; AUTH-11; `IDENTITY-AA005-01` | Recreate application/database client without changing identity or credentials; the same cookie remains authorized and persisted role/state remain `admin`/`SEALED`. | Same AA-005 integration test — PASS; it closes the first service, creates a new configured service, repeats the protected request, and reads the persisted rows. | PROVEN |
| `RC-AA005-03` | Scope 3–4; acceptance 2 and 4; AUTH-01–AUTH-14 evidence map; `BOUNDARY-AA005-01` | Re-run affected predecessor suites and verify every owner in the README evidence matrix has committed PostgreSQL/Better Auth proof. | `corepack pnpm --filter @atlas/db test:admin-bootstrap-state` — PASS (1/1); `corepack pnpm --filter @atlas/db test:permissions` — PASS (1/1); `corepack pnpm --filter @atlas/auth test` — PASS (config 2/2, lifecycle 1/1, AA-003 1/1, AA-004 unit 4/4, AA-004 integration 1/1); `corepack pnpm --filter @atlas/app exec node --test tests/admin-guard.test.mjs tests/admin-identity.integration.test.mjs tests/auth-boundary.test.mjs` — PASS (10/10). The README owner map plus AA-001 through AA-004 PASS artifacts provide the committed evidence for AUTH-01 through AUTH-14. | PROVEN |
| `RC-AA005-04` | Scope 3; acceptance 5; AUTH-13; `BOUNDARY-AA005-02`; `REV-READY-AA005-02` | Existing non-admin and service authentication remain independent and green; the final diff does not alter their authorities. | AA-002 real ordinary-session `403` coverage is included in the 10/10 app command above. `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/service.test.ts` — PASS (7/7). `git diff --check 3e1e8bb0^ 3e1e8bb0` — PASS; the bounded diff adds only AA-005 test, runbook, and ticket records. | PROVEN |
| `RC-AA005-05` | Scope 5; acceptance 6; Definition of Done; `SEAM-AA005-02`; `REV-READY-AA005-03`; `ASSET-AA005-01` | Concise operator runbook gives prerequisites, environment, native invocation, non-secret output, normal verification, sealed repeat behavior, and same-attempt recovery without force/reset instructions or secrets. | `docs/admin-bootstrap-runbook.md`; manual redaction review confirms it uses placeholders only and contains no password, hash, cookie, token, database URL, secret, or stack trace. | PROVEN |
| `RC-AA005-06` | Validation | Actual PostgreSQL/Better Auth configuration, migration status, affected typechecks, validations, output inspection, and bounded diff check are recorded. | `corepack pnpm --filter @atlas/db migrate` — PASS (already up to date); `corepack pnpm --filter @atlas/db migration:check` — PASS; `corepack pnpm --filter @atlas/db typecheck` — PASS; `corepack pnpm --filter @atlas/auth typecheck` — PASS. `corepack pnpm --filter @atlas/app exec tsc -p tsconfig.json --noEmit` reports only pre-existing unrelated app/fixture/worker errors, including the same auth-server worker-type errors recorded by AA-002; no AA-005 file is named. | PROVEN |

## Limitations

The repository-wide Atlas app typecheck is not green because of pre-existing,
unrelated application, fixture, and worker errors. This checkpoint does not
repair those paths: the new AA-005 harness is JavaScript, all directly
affected auth/database typechecks and integration suites pass, and no reported
error names an AA-005 changed path.

Internal readiness: READY_FOR_CK

This is an implementation readiness checkpoint, not a self-issued `PASS`.
CK should review implementation commit `3e1e8bb0` and this checkpoint.
