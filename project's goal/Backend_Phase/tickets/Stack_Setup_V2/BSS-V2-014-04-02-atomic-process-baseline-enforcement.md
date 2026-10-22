# BSS-V2-014-04-02 — Atomic process baseline and cap enforcement

- **State:** `planned`; executable BSS-V2-006 successor. No GO, borrowing, provider operation, or route activation is authorized.
- **Parent:** [BSS-V2-014-04 split map](BSS-V2-014-04-atomic-process-admission-and-borrowing.md).
- **Dependencies:** BSS-V2-014-04-01 CK `PASS`, BSS-V2-014-02-02 CK `PASS`, and approved BSS-V2-006 fairness/recovery predecessors.

## Exact scope

Inside the existing domain-locked `admit_next_provider_work_attempt` → `admit_route_aware_provider_work_attempt` transaction, consume the immutable allocation and `ProcessCapacityWindowUsage/v1` to enforce exact active plan/process/profile/route/model authority, each process baseline, explicit cap, class pool, protected interactive reserve, and physical domain quota. `bridge.bind_provider_work_route` and `bridge.provider_work_route_binding` must pin the complete `-02-01` tuple—`routeId`, `providerId`, `modelOrProcessorId`, `adapterVersion`, `qualificationRef`, `qualificationVersion`, and `authorityVersion`—not merely a route id. `bridge.require_provider_work_route_before_reservation`, `bridge.reserve_provider_operational_windows`, and `bridge.claim_provider_admitted_transport` must validate or carry that same immutable identity, with the final transport claim exposing the exact claimed tuple. Enforce RPM, TPM, concurrency and every other effective dimension independently. An attempt above its baseline is denied/deferred in this child; borrowing is exclusively `-04-03`.

Preserve existing fairness, reservation/job/transport ordering and `0084` recovery. Stale or oversized waiting work follows the existing typed replan/stop pathway; historical held/claimed liabilities retain their original plan identity.

## Binary Review Contract

| ID | PASS iff / direct negative | Required validation and evidence |
| --- | --- | --- |
| `RC-0140402-01` | Exact active plan, process/profile, complete route authority tuple/version, sizing identity, process RPM/TPM/concurrency baseline, explicit cap, class pool, interactive protection, and domain quota are independently checked in one SQL transaction. Saturating any one creates no reservation, job, or send. | Isolated PostgreSQL admission matrix with exact counters. |
| `RC-0140402-02` | A stale, forged, revoked, or mismatched route/model/adapter/qualification/authority-version/policy/allocation identity cannot reserve or reach transport. The `-02-01` published tuple, `-02-02` binding, attempt binding, reservation, and final claim are byte-for-byte/field-for-field equal. Revision preserves old held/claimed liabilities; incompatible waiting work is typed `REPLAN_REQUIRED`/`UNFIT` through the existing recovery path. | Cross-ticket `-02-01/-02-02/-04-02` publication-to-claim fixture, revision/recovery fixture, and zero forbidden-send assertion. |
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
- `SR-0140402-T1`: immutable allocation and complete route/model authority cross into atomic reservation and sole transport claim.
- `SR-0140402-A1`: process baseline/cap, usage projection, activation identity, complete route authority tuple, and physical liabilities.
- `SR-0140402-C1`: prohibit off-lock checks, above-baseline admission, route/model fallback, new reservation/send paths, and rebase of historical liabilities.
- `SR-0140402-R1`: `RC-0140402-01..04` verify all-resource atomic negatives, authority/recovery fences, RPD policy, and sole-path evidence.

## Hard stop

Stop if a process baseline/cap cannot be checked against reconciled facts under the existing lock, if the complete route authority tuple cannot remain pinned through final transport claim, or if a route/model gate must be deferred until after reservation. Do not add borrowing or a compensating scheduler.
