# BSS-V2-014-04-02 — Atomic process baseline and cap enforcement

- **State:** `planned`; executable BSS-V2-006 successor. No GO, borrowing, provider operation, or route activation is authorized.
- **Parent:** [BSS-V2-014-04 split map](BSS-V2-014-04-atomic-process-admission-and-borrowing.md).
- **Dependencies:** BSS-V2-014-04-01 CK `PASS`, BSS-V2-014-02-02 CK `PASS`, and approved BSS-V2-006 fairness/recovery predecessors.

## Exact scope

Inside the existing domain-locked `admit_next_provider_work_attempt` → `admit_route_aware_provider_work_attempt` transaction, consume the immutable allocation and `ProcessCapacityWindowUsage/v1` to enforce exact active plan/process/profile/route/model authority, each process baseline, explicit cap, class pool, protected interactive reserve, and physical domain quota. Enforce RPM, TPM, concurrency and every other effective dimension independently. An attempt above its baseline is denied/deferred in this child; borrowing is exclusively `-04-03`.

Preserve existing fairness, reservation/job/transport ordering and `0084` recovery. Stale or oversized waiting work follows the existing typed replan/stop pathway; historical held/claimed liabilities retain their original plan identity.

## Binary Review Contract

| ID | PASS iff / direct negative | Required validation and evidence |
| --- | --- | --- |
| `RC-0140402-01` | Exact active plan, process/profile, route/model authority, sizing identity, process RPM/TPM/concurrency baseline, explicit cap, class pool, interactive protection, and domain quota are independently checked in one SQL transaction. Saturating any one creates no reservation, job, or send. | Isolated PostgreSQL admission matrix with exact counters. |
| `RC-0140402-02` | Stale/forged route/model/policy/allocation identity cannot reserve or reach transport. Revision preserves old held/claimed liabilities; incompatible waiting work is typed `REPLAN_REQUIRED`/`UNFIT` through the existing recovery path. | Revision/recovery fixture plus zero forbidden-send assertion. |
| `RC-0140402-03` | Authorized Anoman excluded RPD performs no RPD admission check or RPD ledger reservation while RPM/TPM/concurrency remain exact. Missing/revoked/mismatched exclusion approval fails closed without fallback. | WCA-15 positive/negative atomic-admission fixtures. |
| `RC-0140402-04` | The existing atomic admission/reservation/pg-boss/transport chain remains sole authority. No borrowing, new queue, scheduler, reservation family, direct transport, or provider call is introduced. | Source-entrypoint inventory and non-admission/zero-send checks. |

## Freeze-time validation commands

```text
pnpm --filter @atlas/db migration:check
pnpm --filter @atlas/agents-bridge exec jiti tests/weighted-process-baseline-admission.integration.test.ts
pnpm --filter @atlas/agents-bridge exec jiti tests/provider-admitted-worker.integration.test.ts
pnpm --filter @atlas/agents-bridge typecheck
```

## SecurityReadiness

- **Status:** `applicable`.
- `SR-0140402-T1`: immutable allocation and route/model authority cross into atomic reservation.
- `SR-0140402-A1`: process baseline/cap, usage projection, activation identity, and physical liabilities.
- `SR-0140402-C1`: prohibit off-lock checks, above-baseline admission, route/model fallback, new reservation/send paths, and rebase of historical liabilities.
- `SR-0140402-R1`: `RC-0140402-01..04` verify all-resource atomic negatives, authority/recovery fences, RPD policy, and sole-path evidence.

## Hard stop

Stop if a process baseline/cap cannot be checked against reconciled facts under the existing lock, or if a route/model gate must be deferred until after reservation. Do not add borrowing or a compensating scheduler.
