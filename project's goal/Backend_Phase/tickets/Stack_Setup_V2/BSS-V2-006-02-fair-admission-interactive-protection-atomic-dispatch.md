# BSS-V2-006-02: Fair multi-resource admission, interactive protection, and atomic dispatch

- **State:** `planned`
- **Review batch:** `BSS-V2-BATCH-06-02`
- **Dependencies:** BSS-V2-006-01 CK `PASS`
- **Parent:** [BSS-V2-006](BSS-V2-006-capability-admission-interactive-protection.md)

## Outcome

Implement the per-quota-domain admission transaction that enforces hard interactive reserve, weighted dominant-resource background fairness, caller fairness keys, resource fit, atomic reservation and pg-boss executable dispatch.

## Required scheduling behavior

- Background cannot consume hard interactive reserve.
- Interactive checks global effective capacity and is not queued behind background fairness.
- Background lane selection uses durable weighted dominant-resource virtual usage.
- Within a lane use durable least-recently-admitted fairness key plus stable tie-break.
- Temporarily unfit work may be skipped without losing eligibility.
- Do not preempt active provider calls.
- Admission, reservation, and job enqueue are one transaction.

## Review Contract

| Row | Required behavior | Binary closure oracle |
| --- | --- | --- |
| RC-BSSV2-00602-01 | No admitted work exceeds current global RPM/TPM/RPD/concurrency resource state. | PASS iff controlled boundaries deny one-more admission in each dimension and denied work never reaches executable transport. |
| RC-BSSV2-00602-02 | Background saturation preserves the complete configured hard interactive reserve. | PASS iff a large background backlog cannot consume protected request/token/day/concurrency headroom and a protected interactive fixture can still reserve when global capacity is otherwise healthy. |
| RC-BSSV2-00602-03 | Background processes receive durable weighted multi-resource fairness with work-conserving borrowing. | PASS iff request-heavy/token-heavy lane fixtures converge by weighted dominant cost, an idle lane wastes no background capacity, and no backlogged fitting lane starves. |
| RC-BSSV2-00602-04 | One process cannot monopolize its lane across fairness keys. | PASS iff A(large backlog)/B(small)/C(small) fixtures rotate durable fairness keys while allowing elastic borrowing when competitors are absent. |
| RC-BSSV2-00602-05 | Reservation + admitted state + pg-boss execution enqueue commit atomically. | PASS iff rollback exposes none, crash/retry cannot double-dispatch one attempt, and capacity is not released before durable terminal/reconcile state. |

## Hard stop

Use deterministic fake execution; do not yet claim correctness for actual provider usage reconciliation or 429/Retry-After adaptation.

## Security Refactor Readiness

**Status:** `applicable`.

- **Inherited boundaries:** `BOUNDARY-BSSV2-00602-DURABLE-STATE` consumes only BSS-V2-006-01 waiting/window/reservation state; `BOUNDARY-BSSV2-00602-DESIRED-PLAN` enforces the current plan ceiling; `BOUNDARY-BSSV2-00602-PGBOSS` authorizes executable work only through atomic pg-boss enqueue.
- **Trust boundary:** `TRUST-BSSV2-00602-ADMISSION` is the sole transition from waiting work to a resource reservation and executable job under one quota-domain serialization transaction.
- **Sensitive assets:** `ASSET-BSSV2-00602-CAPACITY-STATE` covers current windows, protected headroom, reservations, and fairness turns; access must remain operationally scoped and secret/source-free.
- **Identity context:** `IDENTITY-BSSV2-00602-DECISION` binds quota domain, active plan, work/attempt, service class, process lane, fairness key/turn, resource envelope, reservation, and pg-boss job.
- **Extension seams:** `SEAM-BSSV2-00602-SERIALIZATION`, `SEAM-BSSV2-00602-PROTECTION`, `SEAM-BSSV2-00602-DOMINANT-COST`, `SEAM-BSSV2-00602-FAIR-TURN`, and `SEAM-BSSV2-00602-ATOMIC-DISPATCH` preserve future policy attachment.
- **Prohibited couplings:** `COUPLING-BSSV2-00602-ADMISSION-BYPASS` forbids executable transport without reservation; `COUPLING-BSSV2-00602-BACKGROUND-BORROW-RESERVE` forbids lending hard protection; `COUPLING-BSSV2-00602-FIFO-SCALAR` forbids one FIFO/magic resource scalar; `COUPLING-BSSV2-00602-PROCESS-LOCAL-FAIRNESS` forbids in-memory durable turns.
- **Verification seams:** `VERIFY-BSSV2-00602-DIMENSION-BOUNDARIES`, `VERIFY-BSSV2-00602-INTERACTIVE-SATURATION`, `VERIFY-BSSV2-00602-MULTIRESOURCE-FAIRNESS`, `VERIFY-BSSV2-00602-KEY-FAIRNESS`, and `VERIFY-BSSV2-00602-ROLLBACK` cover the transaction and all scheduler invariants.
- **Unresolved security policy:** `SEC-GAP-BSSV2-00602-PRODUCTION-POLICY` leaves numeric reserves, weights, caps, and fairness-scope selection to versioned profiles.
- **Review bindings:** `REV-READY-BSSV2-00602-01` verifies the sole pre-transport transaction and per-dimension ceilings; `REV-READY-BSSV2-00602-02` verifies hard interactive protection and no background borrowing; `REV-READY-BSSV2-00602-03` verifies durable multi-resource/fairness-key scheduling, atomic rollback, and no bypass.

## Workflow evidence

Implementation must close every Review Contract row with deterministic controlled-load and rollback fixtures, record exact Compose commands/counts plus reservation/job observations in a compact closure ledger, then reach `READY_FOR_CK`. This ticket grants no GO by itself.
