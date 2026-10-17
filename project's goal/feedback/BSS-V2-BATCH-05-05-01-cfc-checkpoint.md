# CFC checkpoint — BSS-V2-005-05-01

- **Ticket:** BSS-V2-005-05-01 — Registered process policy and generic planner preservation
- **Batch:** BSS-V2-BATCH-05-05-01
- **CFC base:** `0baac95279e789f82335c15e21d431762792825f`
- **Frozen CK artifact:** `project's goal/feedback/BSS-V2-BATCH-05-05-01-89f60e2-review.md`
- **State:** `awaiting_review`

## Authorized closure progress

| Frozen clause | Ticket authority | Repair and evidence locator | Required command and outcome | Frozen oracle | Status |
| --- | --- | --- | --- | --- | --- |
| `CK-001.a` | `RC-00505-01`: invalid or unqualified registry capability fails closed; registry must not bypass route authority. | `apps/agents-bridge/src/process-workload-catalogue.ts` carries qualified route capability identity into registered-policy resolution. `apps/agents-bridge/tests/registered-process-policy.test.ts`, `RC-00505-01`, proves a chat policy on a semantic-qualified route throws `ProcessWorkloadCatalogueError`, then proves the same policy resolves with a chat-qualified route. | `pnpm --filter @atlas/agents-bridge exec jiti tests/registered-process-policy.test.ts` — passed, 5/5. | Passed: an active policy resolves only when every eligible route is qualified for the policy capability; cross-capability route resolution throws and produces no resolved policy. | `PROVEN` |

## Direct regression checks

- `pnpm --filter @atlas/agents-bridge exec jiti tests/capacity-planner.test.ts` — passed, 3/3.
- `pnpm --filter @atlas/agents-bridge typecheck` — passed.
- `git diff --check` — passed.
- `apps/agents-bridge/src/capacity-planner.ts` remains unchanged; no publication, snapshot, wakeup, reservation, provider, or consumer behavior was added.

Internal readiness: `READY_FOR_CK`.

This checkpoint is a bounded CFC handoff for CK verification of `CK-001.a` only; it does not issue a `PASS`.
