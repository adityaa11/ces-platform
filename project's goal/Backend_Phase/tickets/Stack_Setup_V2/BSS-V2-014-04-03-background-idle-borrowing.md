# BSS-V2-014-04-03 — Atomic background idle-capacity borrowing

- **State:** `planned`; executable BSS-V2-006 successor. No GO, provider operation, route activation, or new admission lane is authorized.
- **Parent:** [BSS-V2-014-04 split map](BSS-V2-014-04-atomic-process-admission-and-borrowing.md).
- **Dependencies:** BSS-V2-014-04-02 CK `PASS`; approved BSS-V2-006 weighted-fairness and recovery predecessors.

## Exact scope

Extend only the already-proven atomic baseline path for a background attempt that exceeds its remaining baseline. Under the same domain lock and same process usage projection, admit the excess only when the pinned profile enables `mayBorrowIdleCapacity`, every effective process/class/domain resource fits, idle entitlement exists in other background peers, and eligible waiting lenders are not denied their entitlement. Existing in-flight borrower liabilities MUST be included in every resource-availability and borrowing calculation. An existing in-flight request alone MUST NOT prohibit another borrow when remaining process, background-class, domain, and concurrency resources permit it. Borrowing is a one-admission runtime opportunity; it never changes immutable request sizing, allocation, cap, process weight, or historical liability.

This child does not change process accounting schema, route/model authority, desired-plan publication, reader, selection algorithm, interactive priority, or recovery ownership. It adds no queue/scheduler/reservation/send lane and never borrows interactive protection or headroom.

## Binary Review Contract

| ID | PASS iff / direct negative | Required validation and evidence |
| --- | --- | --- |
| `RC-0140403-01` | An enabled borrower exceeds baseline only when another background peer's unused entitlement is proven from the same locked held/spent counters and all enforced resources fit. Existing borrower liabilities are included in every calculation, and a borrower already in flight is admitted again when remaining process/background-class/domain/concurrency vectors allow it. Disabled borrower, active lender demand, exhausted peer, or saturation of any enforced resource is denied/deferred. | Two-background-process positive/negative matrix including simultaneous allowed borrowing and each independent-resource saturation. |
| `RC-0140403-02` | No background request borrows interactive reserve or headroom. A returning lender receives fair subsequent admission without preempting in-flight borrower; weighted dominant-resource fairness and existing interactive priority remain correct. | Background/interactive contention and lender-return integration fixtures. |
| `RC-0140403-03` | Borrowing preserves route/model/policy/allocation revision fencing, exact physical liabilities, typed stale/replan behavior, and the sole atomic reservation/pg-boss/transport chain. | Revision/recovery fixture plus source-entrypoint inventory and zero forbidden-send assertion. |

## Freeze-time validation commands

```text
pnpm --filter @atlas/agents-bridge exec jiti tests/weighted-process-borrowing.integration.test.ts
pnpm --filter @atlas/agents-bridge exec jiti tests/policy-aware-runtime-admission-fairness.integration.test.ts
pnpm --filter @atlas/agents-bridge typecheck
```

## SecurityReadiness

- **Status:** `applicable`.
- `SR-0140403-T1`: atomic usage and lender-demand facts authorize a transient above-baseline admission.
- `SR-0140403-A1`: lender idle share/demand, borrower profile, class reserve, cap, and held/spent liabilities.
- `SR-0140403-C1`: prohibit virtual-time-only idle proof, cross-class/headroom loan, preemption, persistent borrowed entitlement, or alternate scheduler/send path.
- `SR-0140403-R1`: `RC-0140403-01..03` verify lender/borrower negatives, class boundaries/fairness, and preservation of atomic recovery/send authority.

## Hard stop

Stop if current lender demand cannot be proven under the existing lock, if the only available evidence is prior virtual cost, or if fairness recovery requires a new queue/scheduler. Do not make borrow-dependent request sizing eligible.
