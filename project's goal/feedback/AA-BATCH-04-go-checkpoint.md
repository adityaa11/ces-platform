# GO checkpoint: AA-BATCH-04

- Ticket / batch: `AA-004` / `AA-BATCH-04`
- Authorized implementation commit: `6492643c`
- Frozen ticket: `project's goal/Backend_Phase/tickets/Admin_Auth_Phase/AA-004-first-super-admin-bootstrap-cli.md`
- Accepted predecessor: AA-003 `PASS`, commit `b95cf047` (implementation `22cea9fb`)
- Ticket state after this checkpoint: `awaiting_review`

## Bounded implementation

Added the root-native `pnpm atlas admin bootstrap --email <email> --name <name>`
entrypoint. It validates non-secret metadata, requires an interactive masked
`Initial password` / `Confirm password` pair, and retains that password only
in memory while calling exactly one AA-003 `provision` operation. It has no
HTTP handler, SQL, Better Auth API call, state transition, custom hashing, or
credential persistence path of its own.

`pnpm atlas admin reconcile --attempt-id <attempt-id>` is the only recovery
surface. It accepts an explicit attempt ID and delegates only to AA-003's
existing reconcile operation; it has no `force`, `reset`, release, or new
provisioning mode. CLI errors are stable bounded operational messages without
stacks or sensitive values. Success output is emitted only after AA-003
reports `SEALED` and gives the configured normal Better Auth sign-in endpoint.

## Review Contract Closure

| Row | Ticket authority | Required proof | Evidence / exact validation | Status |
|---|---|---|---|---|
| RC-AA004-01 | Outcome; scope; acceptance criteria 1–2; AUTH-01; `SEAM-AA004-01`; `REV-READY-AA004-01` | The repository-native command delegates one fresh bootstrap to AA-003 and results in exactly one verified, active, credentialed Better Auth `admin` identity with a sealed marker, without an HTTP server. | `package.json`; `packages/atlas-auth/src/atlas-cli.ts`; `packages/atlas-auth/src/admin-bootstrap-cli.ts`; PostgreSQL integration in `packages/atlas-auth/tests/admin-bootstrap-cli.integration.test.ts` invokes the CLI command function, inspects `auth.user`, credential account, and bootstrap state. | PROVEN |
| RC-AA004-02 | Acceptance criterion 3; AUTH-02; baseline §§5.3 and 8 | Credentials created through the CLI are immediately eligible for ordinary Better Auth sign-in. | The AA-004 PostgreSQL integration calls the normal `POST /api/auth/sign-in/email` Better Auth handler after CLI creation and observes HTTP `200`, with no HTTP server started. | PROVEN |
| RC-AA004-03 | Scope; acceptance criterion 4; `COUPLING-AA004-01`; `ASSET-AA004-01`; `REV-READY-AA004-02` | Passwords are interactive/masked where supported, cannot be arguments or environment input, and do not appear in output, errors, logs, or test evidence. | The terminal prompt uses TTY raw mode with no echo; `admin-bootstrap-cli.test.ts` asserts a sentinel password is absent from success and failure transcripts, rejects password flags before service creation, covers mismatch and noninteractive-safe errors, and the live native command rejects non-TTY use. | PROVEN |
| RC-AA004-04 | Scope; acceptance criteria 5 and 6; `BOUNDARY-AA004-01`; `COUPLING-AA004-02`; `REV-READY-AA004-03` | Sealed/reserved/collision/reconciliation messages preserve AA-003 outcomes with no reset or duplicate-provisioning capability. | `admin-bootstrap-cli.ts` maps only AA-003's stable outcomes. Unit tests exercise `PROVISIONING_FAILED`, explicit attempt-ID reconciliation, and reject `--force`; changed-file inspection confirms no persistence, Better Auth creation, or state-transition code in the CLI. | PROVEN |
| RC-AA004-05 | Scope; acceptance criterion 6; baseline §5.4; AUTH-14; `SEAM-AA004-02` | Success output appears only after `SEALED`, gives operational status and normal sign-in guidance, and reveals no password, hash, session, token, secret, or stack trace. | `successOutput` runs only after the coordinator returns `SEALED`; unit and PostgreSQL tests assert sentinel-password redaction. The success transcript contains only allowed email, role, status, checks, and `POST <BETTER_AUTH_URL>/api/auth/sign-in/email` guidance. | PROVEN |
| RC-AA004-06 | Validation | Argument validation, mismatch, invalid-policy safe handling, masking abstraction, noninteractive behavior, redaction, controlled coordinator outcomes, native invocation, PostgreSQL/Better Auth AUTH-01/AUTH-02 evidence, and auth typecheck pass. | `corepack pnpm --filter @atlas/auth typecheck`: PASS. With repository `.env` loaded into the PowerShell process, `corepack pnpm --filter @atlas/auth test`: PASS — config 2/2, lifecycle 1/1, AA-003 coordinator 1/1, CLI unit 3/3, CLI PostgreSQL/Better Auth integration 1/1. `corepack pnpm atlas admin bootstrap --email admin@example.test --name Atlas`: expected non-TTY rejection, no provisioning. `git diff --check 6492643c^ 6492643c`: PASS. | PROVEN |
| RC-AA004-07 | Validation wording: directly affected auth/app typechecks | Application typecheck is required only where AA-004 affects application code; unrelated repository-wide errors cannot expand this ticket. | AA-004 modifies only root command/auth package/test/ticket paths and introduces no app import, route, or build contract. Diagnostic `corepack pnpm --filter @atlas/app exec tsc -p tsconfig.json --noEmit` fails on existing unrelated app/fixture/worker paths (for example `app/demo/page.tsx`, `components/SourcesWorkspace.tsx`, `packages/atlas-fixtures/src/index.ts`, and Cloudflare worker types); none overlap AA-004. Per ticket-set review controls, this is verification context, not AA-004 repair scope. | NOT_APPLICABLE |

Internal readiness: READY_FOR_CK

This is an implementation readiness checkpoint, not a self-issued `PASS`.
AA-005 remains out of scope. CK should review commit `6492643c` and this
checkpoint.
