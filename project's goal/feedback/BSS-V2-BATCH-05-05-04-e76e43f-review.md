# CK review — BSS-V2-005-05-04

- **Ticket:** `BSS-V2-005-05-04` — Durable wakeup convergence integration
- **Batch:** `BSS-V2-BATCH-05-05-04`
- **Ticket state:** `awaiting_review`
- **Frozen ticket:** `project's goal/Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-005-05-04-durable-wakeup-convergence-integration.md`
- **GO checkpoint:** `project's goal/feedback/BSS-V2-BATCH-05-05-04-go.md`
- **Reviewed commit:** `e76e43f1ae858ae13aea492e0f567fa15c022920` (`test(admission): prove durable wakeup convergence`)
- **Review type:** first consolidated review
- **Result:** `PASS`

## Review target and authority

The active-ticket tuple is unambiguous: the frozen ticket is `awaiting_review`,
the GO checkpoint records `e76e43f1ae858ae13aea492e0f567fa15c022920`, and that
commit is present in the committed history. The later `dfed8dd` commit records
the reconciled ticket state and does not change the implementation target. The
worktree contains unrelated modified and untracked files, but none overlaps the
reviewed integration fixture, ticket, GO checkpoint, or named validation paths;
the review target is therefore unambiguous.

The frozen ticket's four Review Contract rows, its explicit real PostgreSQL/
pg-boss/Bridge-worker boundary, its approved 005-04 and 006-03A seams, and the
CK-approved sibling evidence are the complete acceptance authority. The review
does not extend into 006-04 consumer interfaces, provider admission, provider
transport, semantic effects, Atlas truth, deployment, or a second runtime path.

The GO dependency gate records CK `PASS` for BSS-V2-005-01..04,
BSS-V2-005-05-01..03, and BSS-V2-006-03A-01..06. Those records were inspected;
no awaiting-review predecessor was used as an approval substitute.

## Review Contract outcomes

| Row | Status | Evidence |
| --- | --- | --- |
| `RC-00505-03` | `PROVEN` | `apps/agents-bridge/tests/durable-wakeup-convergence.integration.test.ts:83-119` publishes the qualified process/workload-policy revision through `bridge.publish_converged_desired_admission_profile`, observes activation revision 2 and one durable wakeup, and proves identical input returns `unchanged` without a third dispatch. The CK-approved sibling convergence evidence in `packages/atlas-db/tests/authorized-desired-plan-convergence.integration.test.ts:77-96` proves genuinely concurrent changed-input writers produce one published winner and one stale result without lost updates. |
| `RC-00505-05` | `PROVEN` | The new fixture uses `createProductionBridgeWorker` at `apps/agents-bridge/tests/durable-wakeup-convergence.integration.test.ts:43-49`, observes the single active `bridge-provider-work-wakeup-v1` consumer at `:80-81`, and proves one durable delivery/claim plus replay safety at `:96-123`. Waiting-work membership, fairness reset, and in-flight plan identity are asserted at `:112-115` and `:125-138`; the CK-approved `provider-work-reservation-window.integration.test.ts` regression passed for the preserved physical-window liability. No admitted provider job or outbound send is asserted at `:139-140`. |
| `RC-00505-07` | `PROVEN` | Qualified capacity profiles and active process/workload bindings are inserted at `apps/agents-bridge/tests/durable-wakeup-convergence.integration.test.ts:84-92`. The lower, provenance-bound `capacity-v2` revision traverses the same publication fence and real worker at `:125-140`. The accepted convergence test rejects a pseudo `capacity_revision_request` as a missing qualified capacity profile and proves transient pressure creates no convergence intent at `packages/atlas-db/tests/authorized-desired-plan-convergence.integration.test.ts:46-74` and `packages/atlas-db/tests/plan-wakeup-convergence.integration.test.ts:46-47`. |
| `RC-00505-12` | `PROVEN` | The composed fixture is terminal evidence for both revision origins: deterministic planning, 005-04 activation, the existing durable trigger, `provider-wakeup-worker.ts`, and `bridge.consume_active_plan_wakeup` all execute in one production Bridge composition. The committed diff adds only the integration fixture; no second planner, broker, admission runtime, 006-04 interface, provider send, semantic effect, or Atlas-truth path is introduced. |

## Validation and evidence

- The first direct invocation without environment loading self-skipped because `DATABASE_URL` was unset; it was not counted as evidence.
- `node --env-file=../../.env ./node_modules/jiti/lib/jiti-cli.mjs tests/durable-wakeup-convergence.integration.test.ts` from `apps/agents-bridge` — **PASS**, 1/1, 0 skipped.
- With the repository `.env` loaded, `corepack pnpm --filter @atlas/db exec jiti tests/authorized-desired-plan-convergence.integration.test.ts` — **PASS**, 1/1.
- With the repository `.env` loaded, `corepack pnpm --filter @atlas/db exec jiti tests/plan-wakeup-convergence.integration.test.ts` — **PASS**, 1/1; the expected `25P01` cleanup warning was emitted after explicit rollback.
- With the repository `.env` loaded, `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/provider-wakeup-worker.integration.test.ts` — **PASS**, 1/1.
- With the repository `.env` loaded, `corepack pnpm --filter @atlas/db exec jiti tests/provider-work-reservation-window.integration.test.ts` — **PASS**, 1/1.
- With the repository `.env` loaded, `corepack pnpm --filter @atlas/db migration:check` — **PASS**.
- `corepack pnpm --filter @atlas/db typecheck` — **PASS**.
- `corepack pnpm --filter @atlas/agents-bridge typecheck` — **PASS**.
- `git diff e76e43f^ e76e43f --check` — **PASS**.

## Frozen Finding Closure Matrix

No `CK-###` findings were identified. All four ticket-derived Review Contract
rows are proven, so there are no closure clauses to freeze.

## Scope-change observations

None. No ticket change, product or policy decision, new provider/runtime/
deployment target, architecture decision, or predecessor reopening is needed.

## Decision

`PASS`. The committed checkpoint satisfies all four frozen Review Contract rows,
the required real-worker and durable-delivery boundary, the negative
no-provider/no-truth side-effect boundary, and the recorded validation.
