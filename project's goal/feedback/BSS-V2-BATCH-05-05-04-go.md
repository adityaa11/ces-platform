# GO checkpoint — BSS-V2-005-05-04

- **Ticket:** `BSS-V2-005-05-04` — Durable wakeup convergence integration
- **Batch:** `BSS-V2-BATCH-05-05-04`
- **State:** `awaiting_review`
- **Date:** 2026-10-17
- **Review target commit:** `e76e43f1ae858ae13aea492e0f567fa15c022920` (`test(admission): prove durable wakeup convergence`)
- **Authority:** frozen ticket `BSS-V2-005-05-04-durable-wakeup-convergence-integration.md`, its explicit `BSS-V2-005-05` split map, and the accepted BSS-V2-005-04/006-03A activation and wakeup seams.

## Dependency gate

The required predecessors are CK `PASS`: BSS-V2-005-01..04; BSS-V2-005-05-01 (`BSS-V2-BATCH-05-05-01-1520341-verification.md`), `-02` (`BSS-V2-BATCH-05-05-02-067a06d-verification.md`), and `-03` (`BSS-V2-BATCH-05-05-03-e4d07b5-verification.md`); and BSS-V2-006-03A-01..06 (`29c7ef3`, `7ed97f1`, `bb3b514`, `a00ffd2`, `46e46d3`, and `36246f2` review/verification records). BSS-V2-006-04 remains downstream and was not consumed.

## Bounded implementation

Added `apps/agents-bridge/tests/durable-wakeup-convergence.integration.test.ts`. It uses the existing qualified `publish_converged_desired_admission_profile` path, which delegates to the BSS-V2-005-04 atomic activation seam. The production Bridge composition registers the actual pg-boss wakeup consumer and calls `provider-wakeup-worker.ts` / `bridge.consume_active_plan_wakeup`.

The fixture proves both allowed revision origins: a qualified versioned process/workload-policy change and a separately qualified, provenance-bound lower capacity-profile revision. It observes one durable job and one effective worker claim per activation, unchanged input without a new activation or wakeup, and a replay job with no second effective claim. It also proves the existing membership-based `owner_replan_required` behavior for waiting work whose immutable process version changed; revalidation of exact-membership waiting work under the lower capacity profile; activation fairness reset; and preservation of the reserved attempt's original plan/activation identity. The production outbound transport is a counter-only failure seam and remains at zero; no provider-admitted job is queued.

No registry, snapshot, planner, publisher, trigger, worker, fairness engine, runtime admission service, provider feedback/pressure behavior, consumer API, provider transport, semantic effect, or Atlas-truth path was changed.

## Review Contract Closure

| Row | Ticket authority | Required proof | Evidence / validation locator | Exact validation command and outcome | Status |
| --- | --- | --- | --- | --- | --- |
| `RC-00505-03` | Frozen `RC-00505-03` | Qualified effective process/workload-policy revision publishes and activates once through the 005-04 fence; identical input causes no new publication/activation/wakeup. | New durable fixture publishes v1 then qualified semantic v2 under the same capacity profile, observes activation 2 and exactly one `active-plan:2` job; repeated v2 input is `unchanged` at revision 2 with only two dispatches total. The accepted concurrent stale-writer proof remains in `packages/atlas-db/tests/authorized-desired-plan-convergence.integration.test.ts`. | `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/durable-wakeup-convergence.integration.test.ts` — PASS (1 test); `corepack pnpm --filter @atlas/db exec jiti tests/authorized-desired-plan-convergence.integration.test.ts` — PASS (1 test). | `PROVEN` |
| `RC-00505-05` | Frozen `RC-00505-05` | Each activation creates one effective durable pg-boss delivery consumed by the actual worker; replay has no second effect; waiting/in-flight/fairness observations hold. | New fixture starts `createProductionBridgeWorker`, observes its single active `bridge-provider-work-wakeup-v1` consumer, waits for completed pg-boss jobs plus claimed durable dispatches, and asserts replay safety, waiting-work outcomes, fairness epoch reset, preserved reserved-attempt identity, zero admitted jobs, and zero outbound sends. Existing 03A direct consumer regression remains `packages/atlas-db/tests/plan-wakeup-convergence.integration.test.ts` and `apps/agents-bridge/tests/provider-wakeup-worker.integration.test.ts`. | New fixture — PASS (1 test); `corepack pnpm --filter @atlas/db exec jiti tests/plan-wakeup-convergence.integration.test.ts` — PASS (1 test; expected `25P01` cleanup warning after explicit rollback); `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/provider-wakeup-worker.integration.test.ts` — PASS (1 test). | `PROVEN` |
| `RC-00505-07` | Frozen `RC-00505-07` | A separately authorized/provenance-bound lower capacity-profile revision recomputes, activates, and uses the same durable worker; no operational intent mints capacity authority. | New fixture inserts only qualified-observation capacity profiles, publishes `capacity-v2` (lower TPM) at expected revision 2, observes activation 3 and exactly one `active-plan:3` durable job, then observes exact-membership waiting work rebased through the real worker. The publisher's qualified-capacity/intent negatives remain exercised by the accepted convergence integration test. | New fixture — PASS (1 test); authorized convergence regression — PASS (1 test). | `PROVEN` |
| `RC-00505-12` | Frozen `RC-00505-12` | Both authorized revision sources traverse deterministic planning, immutable activation, and actual durable consumption with correct waiting/in-flight/fairness state; no second planner/runtime or 006-04 claim. | New fixture is the terminal composed proof: both sources use the same `publish_converged_desired_admission_profile` / 005-04 trigger / `provider-wakeup-worker.ts` / `consume_active_plan_wakeup` chain. Its only worker double is outbound transport, whose count is zero; no admitted execution job is present. It does not expose or claim any BSS-V2-006-04 consumer interface. | New fixture — PASS (1 test); `corepack pnpm --filter @atlas/db migration:check` — PASS; `corepack pnpm --filter @atlas/db typecheck` — PASS; `corepack pnpm --filter @atlas/agents-bridge typecheck` — PASS; `git diff --check` — PASS. | `PROVEN` |

Internal readiness: `READY_FOR_CK`

This is GO evidence only, not a CK `PASS`. Control returns to CK for the independent final review.
