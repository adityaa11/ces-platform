# CFC checkpoint: SEM-CUTOVER-007A

- Ticket: `SEM-CUTOVER-007A` — canonical stepwise extraction runtime cutover
- Invocation: first bounded CFC remediation pass, explicitly authorized by the user
- Reviewed base: `2c48dff0dd21454d63ca79e70aa1897ef9a66ef1`
- Frozen CK authority: `project's goal/feedback/SEM-CUTOVER-007A-2c48dff-review.md`
- State: `awaiting_review`

## Scope protection

This pass repairs only frozen clauses `CK-001.a`, `CK-002.a`, and `CK-003.a`.
The first CK review marked all other SEM-CUTOVER-007A contract rows proven;
they were not reopened. No provider activation, schema, reconciliation, D1,
publication, Master, deployment, or unrelated dirty-worktree paths are part
of this remediation.

## Frozen finding closure matrix

| Clause | Original frozen closure oracle | Root cause and repair | Evidence and outcome | Status |
| --- | --- | --- | --- | --- |
| `CK-001.a` | Fake transport owns both returned `value` and `provenance`; no fixture context carries provider output/provenance; fake and loopback share the same qualified processing. | The offline context previously contained `rawResponse` and `providerProvenance`. Those fields are removed. Its fake dispatch now returns `{ value, provenance }`, and the common engine consumes the transport result. | `apps/agents-bridge/tests/semantic-worker.integration.test.ts` builds response/provenance only in `sem007FakeTransport`; the ordinary loopback assertion remains in the same suite. `corepack pnpm --filter @atlas/agents-bridge test:semantic` passed (10 tests). Full integration passed 2/2. | `PROVEN` |
| `CK-002.a` | Unsupported or unknown-TPM ordinary image work fails before media redemption, provider dispatch, or staging; qualified image work redeems once and retains wire-integrity proof. | Ordinary runtime had hydrated assets before common-engine preflight. It now builds a metadata-only authorized request and runs route/capability/resource preflight before `client.media()`. The normal engine repeats preflight with redeemed bytes before dispatch. | The ordinary PostgreSQL worker scenario records unknown-TPM media redemptions `0`, provider calls `0`, composite stages `0`, and one bounded failure; its qualified control redeems exactly once and preserves the exact multipart image wire. Full integration passed 2/2. | `PROVEN` |
| `CK-003.a` | Supplied worker signal/deadline control fake execution; cancellation/deadline cause zero dispatch/stage effects; no fresh controller or synthetic deadline remains. | Offline dependencies now receive the worker signal and bounded deadline. The queue derives the deadline from its established `timeoutSeconds` execution bound, passes it through `worker-main`, and the composition preflight uses it directly. The fresh controller and `+ 1_000` synthetic deadline are removed. | The injected worker fixture asserts the fake transport receives the identical worker signal. PostgreSQL integration asserts cancelled and expired inputs have zero fake dispatches and zero composite stages; positive fake counters remain non-inert. Full integration passed 2/2. | `PROVEN` |

## Changed paths

| Path | Purpose |
| --- | --- |
| `apps/agents-bridge/src/provider-capabilities.ts` | Permit metadata-only pre-redemption request preflight while retaining redeemed-byte validation. |
| `apps/agents-bridge/src/semantic-offline-stepwise-composition.ts` | Make fake transport own result/provenance and consume real signal/deadline. |
| `apps/agents-bridge/src/semantic-stepwise-runtime.ts` | Preflight authorized image metadata before grant redemption. |
| `apps/agents-bridge/src/semantic-worker.ts` | Propagate the worker signal to injected stepwise execution. |
| `apps/agents-bridge/src/worker.ts`, `apps/agents-bridge/src/worker-main.ts` | Propagate the worker-job deadline authority. |
| `apps/agents-bridge/tests/semantic-worker.test.ts`, `apps/agents-bridge/tests/semantic-worker.integration.test.ts` | Prove transport ownership, boundary effects, and ordinary denied-image ordering. |

## Validation evidence

All commands ran from `C:\Workspace\atlas\ces-platform`. The database suite
used the repository `.env`; no environment values are recorded here.

| Command | Outcome |
| --- | --- |
| `corepack pnpm --filter @atlas/contracts typecheck` | PASS |
| `corepack pnpm --filter @atlas/core typecheck` | PASS |
| `corepack pnpm --filter @atlas/db typecheck` | PASS |
| `corepack pnpm --filter @atlas/skills typecheck` | PASS |
| `corepack pnpm --filter @atlas/agents-bridge typecheck` | PASS |
| `corepack pnpm --filter @atlas/skills test` | PASS, 18/18 |
| `corepack pnpm --filter @atlas/skills exec jiti tests/stepwise-source-packet.test.ts` | PASS, 8/8 |
| `corepack pnpm --filter @atlas/agents-bridge test:semantic` | PASS, 10/10 combined |
| `node --env-file=.env packages/atlas-db/scripts/migrate.mjs --check` | PASS |
| `powershell -NoProfile -ExecutionPolicy Bypass -File .codex-tools/sem-cutover-007a-cfc-integration-runner.ps1 -EvidenceDir .codex-tools/sem-cutover-007a-cfc-integration-final-20261015-175043` | PASS, exit `0`, 2/2, 0 skipped, 68.9 s |

The durable full-integration command, stdout, stderr, and exit status are in
`.codex-tools/sem-cutover-007a-cfc-integration-final-20261015-175043/`.
The suite recorded both fake and loopback prompt/source/schema wire evidence,
the PostgreSQL identity, cancellation/recovery observations, the new ordinary
denied-image negative assertions, and the qualified-image positive assertion.

## Internal readiness

`READY_FOR_CK`.

This is one bounded remediation checkpoint, not a CFC or CK `PASS`. Independent
CK must verify only the three frozen clauses, this remediation diff, and direct
regressions introduced by it.
