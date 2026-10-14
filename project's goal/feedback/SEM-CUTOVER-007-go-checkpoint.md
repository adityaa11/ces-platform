# GO checkpoint — SEM-CUTOVER-007

- **Ticket:** `SEM-CUTOVER-007` — canonical offline stepwise worker composition and durable composite staging
- **Batch:** `SEM-CUTOVER`
- **Frozen ticket:** `project's goal/Backend_Phase/tickets/Semantic_Cutover_Phase/SEM-CUTOVER-007-offline-stepwise-worker-composition.md`
- **Authority consumed:** continued initial `GO SEM-CUTOVER-007`, citing `HMN-SEM-CUTOVER-007-002` (`RETURN_TO_GO`)
- **Ticket/checkpoint state:** `awaiting_review`
- **Implementation commit:** `2ffda7904300f802a9dc772f6da0fe6880e72a8b` (`test(sem-007): prove composed worker durable staging`)

## Bounded implementation

The SEM-007-owned implementation remains offline-only and test-injected. It adds
the explicit worker selection seam in `apps/agents-bridge/src/semantic-worker.ts`
and the permitted helper
`apps/agents-bridge/src/semantic-offline-stepwise-composition.ts`. The worker
verifies that redeemed context scope and normalized-document identity exactly
match the injected bounded context before invoking the approved
`createSemanticCompositeReplay()` path. The composition helper builds the
approved source packet and relationship request, dispatches only through the
provider-neutral multipart fake, performs the qualified REL-03 → SEM-006 →
SEM-005 preparation, and stages one immutable composite winner.

The worker composition root `apps/agents-bridge/src/worker-main.ts` was not
changed: no live route or production admission path was activated. The
SEM-007 integration selects the injected path through the existing test worker
handler only. The pre-existing uncommitted changes in
`semantic-worker.ts`, `semantic-worker.test.ts`, and the new helper were
preserved.

## Review Contract Closure

| Row | Frozen requirement | Evidence / validation | Status |
| --- | --- | --- | --- |
| `RC-007-01` | One explicit versioned worker path handles bounded deterministic text-only and image-bearing fixtures without legacy fallback. | `semantic-worker.integration.test.ts` runs text-only and image-bearing ordinary/mixed/deferred fixtures through the injected selection. The neutral dispatch receives the exact source/asset identity and bytes; the ordinary provider counter remains `{}`. | `PROVEN` |
| `RC-007-02` | Exact provider-neutral multipart source/media authorization and bounded negatives. | The SEM-007 integration checks exact image source-part identity, SHA-256 and bytes. `multipart-provider-capabilities.test.ts` proves unsupported media, wrong route/profile/deadline, media/bounds, oversize, and unknown image TPM rejection before authorization/transport; unknown TPM is `RESOURCE_ENVELOPE_BLOCKED`. The worker unit proves a forged media grant has zero provider/SQL effects. | `PROVEN` |
| `RC-007-03` | Approved REL-03 → SEM-006 → SEM-005 qualification handles ordinary, mixed and fully deferred/null outcomes and rejects forged evidence before stage. | SEM-007 PostgreSQL staging asserts ordinary and mixed canonical results are non-null and fully deferred is SQL `NULL`. `semantic-relationship-interoperability-bridge.test.ts` passes the approved strict handoff/accounting cases, including ordinary/mixed/deferred projection, forged source identity, malformed slot state, missing asset, foreign revision, duplicate/omitted owned slots, and immutable preparation checks. Worker integration additionally rejects substituted normalized context before dispatch/stage. | `PROVEN` |
| `RC-007-04` | SEM-007-owned worker integration proves actual durable staging, immutable replay, fencing, cancellation, restart and delivery/ack recovery. | The focused integration uses the real registered migration and fresh PostgreSQL `sem007_go_20261014_222713`, records the actual database identity, persists winners, reloads exact hashes/sidecar/source, rejects a stale lease, synchronizes child/`pg_stat_activity` cancellation before SIGTERM and observes rollback, synchronizes post-commit child termination and fresh replay recovery, and records non-inert delivery-failure/ack-loss attempts without repeating provider execution. | `PROVEN` |
| `RC-007-05` | Denied routes have zero provider, admission and job effects with non-inert positive controls. | SEM-007 integration denies an unrecognized route and unknown image TPM with zero dispatches and zero durable stage rows. Positive worker/job/provider effect tables increment for successful text/image paths; the focused evidence prints non-empty job counts and `provider-structured={}`. | `PROVEN` |
| `RC-007-06` | Canonical staged RUN-003 D1 remains `perceived`, with zero semantic jobs/provider calls and unchanged reconciliation. | Read-only approved PERC-RESET-008 evidence at `9f31026` records the effective `staged-fair-local-v1` route, perceived members, zero semantic executions/jobs/provider calls, and unchanged reconciliation. `perception-integration.test.ts` passes its two live isolated checks and `route-registry.test.ts` passes its nine route/admission checks. No SEM-007 code touches perception authority, admission, or reconciliation. | `PROVEN` |

### Exact validation evidence

All commands below ran from `C:\Workspace\atlas\ces-platform` unless the
command explicitly changes to `apps/agents-bridge`.

| Command | Outcome |
| --- | --- |
| `CREATE DATABASE sem007_go_20261014_222713` followed by `pnpm --filter @atlas/db migrate` with `DATABASE_URL=postgresql://atlas:***@localhost:5432/sem007_go_20261014_222713` | PASS — real registered migrations applied through `0025_rel03_semantic_composite_stage`; database identity observed by the worker test: `database=sem007_go_20261014_222713 user=atlas server=18.6`. |
| `pnpm --filter @atlas/agents-bridge typecheck` | PASS — `tsc -p tsconfig.json`, exit 0. |
| `pnpm --filter @atlas/agents-bridge exec jiti tests/semantic-worker.test.ts` | PASS — 8/8, 0 failed, 0 skipped. |
| `pnpm --filter @atlas/agents-bridge exec jiti tests/multipart-provider-capabilities.test.ts` | PASS — 7/7, 0 failed, 0 skipped. |
| `pnpm --filter @atlas/agents-bridge exec jiti tests/semantic-relationship-interoperability-bridge.test.ts` | PASS — 8/8, 0 failed, 0 skipped. |
| `pnpm --filter @atlas/agents-bridge exec jiti tests/route-registry.test.ts` | PASS — 9/9, 0 failed, 0 skipped. |
| `pnpm --filter @atlas/agents-bridge exec jiti tests/perception-integration.test.ts` | PASS — 2/2, 0 failed, 0 skipped. |
| `$env:DATABASE_URL='postgresql://atlas:***@localhost:5432/sem007_go_20261014_222713'; $env:AGENTS_BRIDGE_PASSWORD='***'; $env:ATLAS_APP_PASSWORD='***'; $env:SEM007_ONLY='1'; pnpm --filter @atlas/agents-bridge test:semantic-integration` | PASS — SEM-007 integration 1/1; the pre-existing legacy production semantic-worker test was explicitly skipped by `SEM007_ONLY=1`, 0 failures. `SEM007_EVIDENCE` recorded child cancellation marker, child post-commit marker, PostgreSQL 18.6 identity, worker jobs `{text-only:1, ordinary:1, mixed:1, deferred:1, delivery-failure:3, ack-loss:3, crash:1}`, and `provider-structured={}`. |
| `git diff --check -- apps/agents-bridge/src/semantic-worker.ts apps/agents-bridge/src/semantic-offline-stepwise-composition.ts apps/agents-bridge/tests/semantic-worker.test.ts apps/agents-bridge/tests/semantic-worker.integration.test.ts` | PASS. |

The exact SEM-007 proof is in
`apps/agents-bridge/tests/semantic-worker.integration.test.ts`, including
the isolated schema objects, exact winner/hash assertions, child-process
diagnostics, `pg_stat_activity` synchronization, lease fence, pre-commit
rollback, post-commit restart, delivery failure, acknowledgement loss, and
non-inert effect counters. The integration printed
`provider-structured={}`, proving the fake path did not invoke the ordinary
provider adapter. The sidecar assertion also proves transient
`preparationContext` is absent from persisted output.

The historical REL-03 predecessor cancellation rerun remains recorded as
`PREDECESSOR_HARNESS_OBSERVATION_GAP` in
`SEM-CUTOVER-007-hmn-002.md`. It was not rerun or labelled PASS here and is
not an additional SEM-007 acceptance row.

No REL-03, Atlas authority, provider adapter, production admission, migration,
schema, or reconciliation implementation was changed. Pre-existing unrelated
modified and untracked worktree paths were preserved and not staged.

## Shadow CK review disposition

All six frozen Review Contract rows are `PROVEN` on the evidence above. There
are no unproven rows and no owner-defect counterexample. This is a GO handoff
only; it is not an automatic CK invocation or a CK PASS.

Internal readiness: READY_FOR_CK
