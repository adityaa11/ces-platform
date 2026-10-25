# Review: AA-BATCH-04

- Ticket / batch: `AA-004` / `AA-BATCH-04`
- Reviewed commit: `6492643c0befd6a87189049fc5da8ffbf9983013`
- GO checkpoint commit: `4b62389779a2085311d4c3cc2ce400f0b1c9c151`
- Frozen ticket: `project's goal/Backend_Phase/tickets/Admin_Auth_Phase/AA-004-first-super-admin-bootstrap-cli.md`
- Ticket state at review: `awaiting_review`
- Review type: first CK review
- GO checkpoint: `project's goal/feedback/AA-BATCH-04-go-checkpoint.md`
- Accepted predecessor: AA-003 `PASS`, commit `b95cf047` (implementation `22cea9fb`)
- Result: `CHANGES_REQUIRED`

## Preconditions and review boundary

The explicitly named ticket resolves uniquely. Its state is `awaiting_review`,
and the GO checkpoint records implementation commit
`6492643c0befd6a87189049fc5da8ffbf9983013`. The reviewed implementation commit
is an ancestor of the current checkout. The primary worktree contains
unrelated dirty and untracked material, but no dirty path overlaps any of the
eight paths changed by the reviewed AA-004 commit; the review target is
therefore unambiguous.

This review covers AA-004 and the explicit AA-003, Better Auth, and AUTH-14
boundaries it consumes. AA-005 remains out of scope.

## Review Contract assessment

| Row | Ticket authority | Required proof | Status | CK result |
|---|---|---|---|---|
| RC-AA004-01 | Outcome; scope; acceptance criteria 1–2; AUTH-01; `SEAM-AA004-01`; `REV-READY-AA004-01` | The repository-native command delegates one fresh bootstrap to AA-003 and results in exactly one verified, active, credentialed Better Auth `admin` identity with a sealed marker, without an HTTP server. | PROVEN | — |
| RC-AA004-02 | Acceptance criterion 3; AUTH-02; baseline §§5.3 and 8 | Credentials created through the CLI are immediately eligible for ordinary Better Auth sign-in. | PROVEN | — |
| RC-AA004-03 | Scope; acceptance criterion 4; `COUPLING-AA004-01`; `ASSET-AA004-01`; `REV-READY-AA004-02` | Password input is interactive and masked where supported, accepts valid terminal input reliably, cannot be supplied as an argument or environment value, and does not appear in output or errors. | UNRESOLVED | CK-001.a |
| RC-AA004-04 | Scope; acceptance criteria 5 and 6; `BOUNDARY-AA004-01`; `COUPLING-AA004-02`; `REV-READY-AA004-03` | Sealed/reserved/collision/reconciliation messages preserve AA-003 outcomes with no reset or duplicate-provisioning capability. | PROVEN | — |
| RC-AA004-05 | Scope; acceptance criterion 6; baseline §5.4; AUTH-14; `SEAM-AA004-02` | Success output appears only after `SEALED`, gives operational status and normal sign-in guidance, and reveals no password, hash, session, token, secret, or stack trace. | PROVEN | — |
| RC-AA004-06 | Validation | Argument validation, mismatch, invalid-policy safe handling, masking abstraction, noninteractive behavior, redaction, controlled coordinator outcomes, native invocation, PostgreSQL/Better Auth AUTH-01/AUTH-02 evidence, and auth typecheck pass. | UNRESOLVED | CK-001.a |
| RC-AA004-07 | Validation wording: directly affected auth/app typechecks | Application typecheck is required only where AA-004 affects application code; unrelated repository-wide errors cannot expand this ticket. | NOT_APPLICABLE | — |

## Evidence and validation

- `corepack pnpm --filter @atlas/auth typecheck`: PASS.
- With repository `.env` values loaded into the PowerShell process,
  `corepack pnpm --filter @atlas/auth test`: PASS — config 2/2, lifecycle 1/1,
  AA-003 coordinator 1/1, AA-004 CLI unit 3/3, and AA-004 PostgreSQL/Better
  Auth integration 1/1.
- The AA-004 PostgreSQL integration inspected the created Better Auth identity,
  credential account, role, verification/active state, and sealed bootstrap
  marker, then called the ordinary Better Auth sign-in handler and observed
  HTTP `200` without starting an HTTP server.
- The actual repository-native command was run interactively against
  PostgreSQL and Better Auth with a uniquely named review identity. It reached
  the sealed success output, and the identity/marker were then removed/reset
  to the pre-review uninitialized state.
- The native command in a non-TTY rejected password entry with the bounded
  message `Interactive password input requires a TTY.` and exited nonzero
  before service creation.
- `git diff --check 6492643c^ 6492643c`: PASS.
- Changed-file inspection confirms the CLI delegates privileged work to the
  AA-003 coordinator and contains no persistence, Better Auth credential
  creation, state-transition, reset, or force path of its own.
- A direct PTY probe using a single input write containing password characters
  followed by a line terminator did not advance from `Initial password:`. The
  prompt remained pending until cancellation; sending the password and line
  terminator as separate input events did advance normally.

## Findings

### CK-001 — TTY prompt does not process multi-character input chunks

The ticket requires a working repository-native bootstrap command, interactive
masked password input, and validation of the terminal masking abstraction
(`AA-004` scope and acceptance criteria 1 and 4; validation items 1 and 2;
`COUPLING-AA004-01`; `REV-READY-AA004-02`). In
`packages/atlas-auth/src/admin-bootstrap-cli.ts:76-87`, `onData` compares the
entire `data` chunk with `"\r"`, `"\n"`, `"\u0003"`, and backspace values.
When a TTY delivers password characters and Enter in one chunk, the chunk is
appended as password material instead of being processed character by
character, so the prompt does not resolve. The direct PTY probe reproduced
this behavior on the reviewed commit.

The observable correction is to process each character/code point in every
TTY data chunk, recognizing line termination, cancellation, and backspace
within the chunk, while retaining masking and secret-free output. Add or
extend a PTY-level test that sends password plus Enter in one chunk and proves
that both prompts resolve and a valid native bootstrap reaches the coordinator
and sealed success output without exposing the password.

## Frozen Finding Closure Matrix

| Clause | Exact ticket authority | Unsatisfied evidence | Observable closure condition | Binary closure oracle | Direct-regression boundary |
|---|---|---|---|---|---|
| CK-001.a | AA-004 scope bullets 14–16; acceptance criteria 1 and 4; validation items 1–2; `COUPLING-AA004-01`; `REV-READY-AA004-02` | `packages/atlas-auth/src/admin-bootstrap-cli.ts:76-87` treats a complete TTY `data` chunk as one token. A PTY input chunk containing password characters followed by Enter left the prompt pending until cancellation. | The native `pnpm atlas admin bootstrap ...` prompt processes a chunk containing password input plus `\r`, `\n`, or `\r\n`, resolves the prompt without hanging, preserves masked/no-echo input, and reaches the coordinator/sealed success path for valid input; no password appears in output or errors. | PASS iff a committed PTY/native validation demonstrates the required combined-chunk input reaches the coordinator and sealed success output, the prompt does not hang or include the line terminator in the password, and the existing non-TTY, mismatch, redaction, and coordinator tests still pass. | Only AA-004 terminal prompt input handling and directly affected password-safety/noninteractive behavior; do not reopen AA-003 coordinator semantics or require AA-005 round-trip proof. |

## Scope-change observations

None. The defect is implementation-repairable within the frozen AA-004 ticket;
no ticket amendment, new provider/runtime/deployment target, architecture or
product decision, policy decision, or predecessor reopening is required.

## Decision

`CHANGES_REQUIRED`. The committed AA-004 implementation satisfies the
coordinator delegation, database/Better Auth, outcome-boundary, redaction, and
success-output obligations, but the frozen ticket's password-safe native CLI
contract remains unproven and fails for a valid multi-character TTY input
chunk. Control returns to human/planning authority for the single frozen
`CK-001.a` remediation target. This first CK result does not authorize CFC,
AA-005, or another workflow cycle.
