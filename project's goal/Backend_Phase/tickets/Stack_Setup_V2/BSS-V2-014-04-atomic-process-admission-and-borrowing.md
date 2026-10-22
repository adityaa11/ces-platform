# BSS-V2-014-04 — Atomic process baselines, caps, and background borrowing

- **State:** `planned`; BSS-V2-006 successor. No GO, implementation, migration, provider operation, or route activation is authorized.
- **Parent:** [BSS-V2-014 ticket set](BSS-V2-014-weighted-capacity-ticket-set.md).
- **Dependencies:** BSS-V2-014-01 allocation contract and BSS-V2-014-02 publication CK `PASS`; approved BSS-V2-006-05-04 policy-aware fairness, BSS-V2-006-05-05 recovery, and BSS-V2-006-05-06 regression authority. It does not depend on IDSER environment repair.

## Exact scope

Extend the existing domain-locked atomic path `admit_next_provider_work_attempt` → `admit_route_aware_provider_work_attempt` with process-level checks. It remains the sole fairness/reservation/pg-boss/claimed-transport path.

For every active attempt and each effective enforced dimension, the transaction must independently verify:

1. exact active plan, process/profile, route/model authority, and request sizing identity;
2. process remaining baseline and explicit process cap;
3. background-class remaining capacity (or interactive protection for interactive work);
4. domain physical quota, held/spent window liabilities, exact concurrency seats, pressure, cancellation, and existing fairness eligibility.

Add `ProcessCapacityWindowUsage/v1` as a transactionally maintained projection of existing reservation/window facts, keyed by reservation, process profile, effective dimension, and window identity. It must reconcile exactly to the existing domain ledger; it is not a second quota ledger or scheduler. Omitted dimensions have no process projection or provider window row.

When a background attempt exceeds its remaining baseline, it may proceed only if the exact active profile enables `mayBorrowIdleCapacity`, all enforced process/class/domain checks still fit, the projection proves idle entitlement of other background peers, and eligible waiting lenders are not deprived. No borrowing crosses into interactive protection or headroom. A returning lender affects future grants only; no admitted work is preempted. Borrowing does not enlarge immutable request sizing.

## Affected existing interfaces and required change

| Existing interface | Required successor change |
| --- | --- |
| `admit_next_provider_work_attempt` / `admit_route_aware_provider_work_attempt` | Add process baseline/cap/borrow checks inside the existing domain lock and transaction, before existing reservation/job creation. |
| Existing reservation/window accounting | Write/reconcile `ProcessCapacityWindowUsage/v1` from the same reservation facts and preserve spent TPM until reset and concurrency release semantics. |
| `backgroundLanes` / weighted virtual-time selection | Consume the same immutable allocation weight as `-01`; preserve interactive priority and dominant-resource fairness. |
| Recovery/replan path | Preserve `0084`-style historical-liability behavior; an incompatible waiting request returns typed `REPLAN_REQUIRED`/`UNFIT`, never a silent resend or infinite wait. |

## Binary Review Contract

| ID | PASS iff / direct negative | Required validation and evidence |
| --- | --- | --- |
| `RC-01404-01` | Process RPM, TPM, concurrency baseline, explicit cap, background class, and domain quota are independently enforced within one SQL transaction. Saturating any one enforced resource creates no reservation, job, or send. | Isolated PostgreSQL admission fixture with exact reservation/window/job counts. |
| `RC-01404-02` | Process projection totals reconcile exactly to existing domain held/spent ledger across reserve, completion, release, reset, cancellation, retry, ack loss, and restart. TPM remains spent until reset; releasing a seat does not refund TPM. | Integration test with per-window reconciliation query and recovery fixtures. |
| `RC-01404-03` | Enabled borrower can exceed its baseline only when idle background peer share is proven under the same lock; disabled borrower, active lender, exhausted peer, or non-fitting resource is denied/deferred. | Two-background-process positive/negative matrix. |
| `RC-01404-04` | No background request borrows interactive reserve or headroom. Returning lender receives fair subsequent admission without preempting an in-flight borrower; existing interactive priority and weighted fairness remain correct. | Background/interactive contention and lender-return integration fixtures. |
| `RC-01404-05` | Anoman's authorized excluded RPD produces no RPD process/window ledger or admission check while RPM/TPM/concurrency remain exact. Missing/revoked/mismatched exclusion approval fails closed with no fallback. | WCA-15 positive and negative DB admission fixtures. |
| `RC-01404-06` | Route/model/policy/allocation revisions retain old held/claimed liabilities; stale or oversized waiting work is replanned/stopped through the existing recovery path. No alternate queue, scheduler, reservation family, direct transport, or provider call exists. | Revision/recovery fixture; source-entrypoint inventory and zero forbidden-send assertion. |

## Freeze-time validation commands

```text
pnpm --filter @atlas/db migration:check
pnpm --filter @atlas/agents-bridge exec jiti tests/weighted-process-admission.integration.test.ts
pnpm --filter @atlas/agents-bridge exec jiti tests/weighted-process-borrowing.integration.test.ts
pnpm --filter @atlas/agents-bridge exec jiti tests/provider-admitted-worker.integration.test.ts
pnpm --filter @atlas/agents-bridge typecheck
```

## SecurityReadiness

- **Status:** `applicable`.
- `SR-01404-T1`: immutable allocation/model identity crosses into the existing atomic reservation authority.
- `SR-01404-A1`: process baseline/cap, per-window held/spent projection, lender demand, reservation identity, and concurrency seats are sensitive runtime assets.
- `SR-01404-C1`: prohibit per-process accounting outside the transaction, weighted-fairness-only proof of idle share, cross-class borrowing, per-slot TPM limits, and direct/supplemental sends.
- `SR-01404-R1`: `RC-01404-01..06` require role-constrained SQL integration evidence, reconciliation totals, negative no-send counters, and recovery proof.

## Hard stop

Stop if process accounting cannot reconcile to the existing domain ledger in the same transaction, if lender demand cannot be observed under the existing lock, or if preserving recovery needs a second scheduler/queue/reservation lane. Do not approximate concurrency from RPM, free spent TPM on completion, preempt work, or invent RPD accounting for the authorized Anoman exclusion.
