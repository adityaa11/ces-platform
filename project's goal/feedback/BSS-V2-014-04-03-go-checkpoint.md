# GO checkpoint — BSS-V2-014-04-03 (validation authority blocked)

- **Ticket / batch:** `BSS-V2-014-04-03` / `BSS-V2-014`
- **Authorized action:** explicit `GO BSS-V2-014-04-03` on 2026-10-23.
- **Ticket state:** `planned`; implementation is committed but cannot advance to review.
- **Ticket authority:** [frozen ticket](../Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-014-04-03-background-idle-borrowing.md).
- **Predecessor:** `BSS-V2-014-04-02` CK `PASS` at `e4d4dae` ([verification](BSS-V2-014-04-02-e4d4dae-verification.md)).

## Bounded implementation

- Added migration `0101_bssv20140403_background_idle_borrowing`, which retains the existing domain advisory lock, route-aware admission, reservation, pg-boss dispatch, and transport-claim chain.
- A background process exceeding its immutable baseline now requires its pinned `mayBorrowIdleCapacity` flag, its own cap/class/resource fit, and sufficient currently idle allocation from background peers with no eligible waiting demand. The calculation uses the same held/spent process-window projection as admission.
- The existing fair selector excludes a borrower that cannot borrow under those facts, so a waiting lender remains eligible for later admission; no in-flight work is preempted or rebased.
- Added the focused two-background-process fixture at `apps/agents-bridge/tests/weighted-process-borrowing.integration.test.ts`.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence / exact outcome | Status |
| --- | --- | --- | --- |
| `RC-0140403-01` | Frozen ticket § Binary Review Contract: enabled background borrowers may exceed baseline only from another peer’s verified same-lock idle entitlement; liabilities remain included; disabled, lender demand, and resource failures deny. | `pnpm --filter @atlas/agents-bridge exec jiti tests/weighted-process-borrowing.integration.test.ts` — PASS (1/1). The fixture proves two simultaneous borrower reservations, disabled-borrow zero artifacts, waiting-lender denial, and subsequent lender admission. `weighted-process-baseline-admission.integration.test.ts` — PASS (1/1), covering independent baseline/cap/class/reserve/domain saturation without operational artifacts. | `PROVEN` |
| `RC-0140403-02` | Frozen ticket § Binary Review Contract: no interactive reserve/headroom loan; returning lender has fair subsequent admission without preempting borrower. | `weighted-process-borrowing.integration.test.ts` — PASS (1/1): full protected interactive request admits after the borrower, and the waiting lender is admitted later while borrower reservations remain in flight. | `PROVEN` |
| `RC-0140403-03` | Frozen ticket § Binary Review Contract: preserve revision/recovery fencing, physical liabilities, and sole reservation/pg-boss/transport chain. | `durable-wakeup-convergence.integration.test.ts` — PASS (1/1); `provider-admitted-worker.integration.test.ts` — PASS (2/2). Migration source inventory shows only the existing `admit_route_aware_provider_work_attempt` / `admit_next_provider_work_attempt` path and its existing pg-boss dispatch insertion; no alternate send or claim entrypoint was added. | `PROVEN` |
| `RC-0140403-VAL` | Frozen ticket § Freeze-time validation commands requires `pnpm --filter @atlas/agents-bridge exec jiti tests/policy-aware-runtime-admission-fairness.integration.test.ts`. | That file does not exist in `@atlas/agents-bridge`; it is located in `@atlas/db`. Executing it there fails before admission in its old v1 route-authority setup: `qualified route authority is foreign, revoked, or mismatched for its quota domain`. The ticket names no accepted alternative proof. | `BLOCKED_AUTHORITY` |

## Validation

```text
DATABASE_URL=… pnpm --filter @atlas/db migration:check
# PASS — Atlas database migration check passed

DATABASE_URL=… pnpm --filter @atlas/agents-bridge exec jiti tests/weighted-process-borrowing.integration.test.ts
# PASS — 1/1

DATABASE_URL=… pnpm --filter @atlas/agents-bridge exec jiti tests/weighted-process-baseline-admission.integration.test.ts
# PASS — 1/1

DATABASE_URL=… pnpm --filter @atlas/agents-bridge exec jiti tests/durable-wakeup-convergence.integration.test.ts
# PASS — 1/1

DATABASE_URL=… pnpm --filter @atlas/agents-bridge exec jiti tests/provider-admitted-worker.integration.test.ts
# PASS — 2/2

pnpm --filter @atlas/agents-bridge typecheck
# PASS — tsc -p tsconfig.json

git diff --check
# PASS — no whitespace errors
```

The frozen ticket’s `policy-aware-runtime-admission-fairness` command names the agents-bridge package, but the fixture resides in `packages/atlas-db`; run at its actual package it currently fails before admission in its older v1 route-authority setup (`qualified route authority is foreign, revoked, or mismatched`). This is a validation-authority issue, not an unrecorded regression, but GO cannot substitute a different validation command or mark the ticket ready.

Internal readiness: NOT_READY — human/planning authority must correct the frozen validation command or explicitly accept an alternative proof before CK handoff.
