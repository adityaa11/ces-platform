# BSS-V2-014-04 — Atomic process admission and borrowing — split map

- **State:** `planned`; non-executable BSS-V2-006 family/traceability map. It is not GO, CK, CFC, HMN, migration, admission, or provider authority.
- **Parent:** [BSS-V2-014 ticket set](BSS-V2-014-weighted-capacity-ticket-set.md).
- **Authority:** [implementation context r2](../../atlas-bss-weighted-capacity-implementation-context-DRAFT-r2.md) §§3.1A, 6, 8.1, and 9–10.
- **Dependencies:** BSS-V2-014-02-02 CK `PASS`, BSS-V2-014-01 allocation contract, and approved BSS-V2-006-05-04/05/06 fairness, recovery, and regression authority.

## Why the original leaf cannot complete one review flow

The original leaf combined a new durable per-process accounting projection, the first baseline/cap rejection decision inside the atomic transaction, and exceptional above-baseline borrowing/fairness recovery. These are three separately diagnosable operational seams. A ledger reconciliation correction must not reopen an admission-policy review, and a borrowing/fairness CFC must not risk the baseline no-borrow proof. All three retain the same domain lock, transaction, reservation family, pg-boss job, and transport claim.

## Executable children and dependency fence

| Order | Child | Sole implementation/proof seam | Requires |
| --- | --- | --- | --- |
| D1 | [BSS-V2-014-04-01](BSS-V2-014-04-01-process-window-usage-projection.md) | Prefer read-derived process usage from authoritative reservation/window facts; any necessary persistence stays in the same lifecycle transaction; no admission decision | `-02-02` CK `PASS` |
| D2 | [BSS-V2-014-04-02](BSS-V2-014-04-02-atomic-process-baseline-enforcement.md) | Process baseline/cap/class and complete route-authority revision gates in the existing atomic admission through final claim; no borrowing | `-04-01` CK `PASS` |
| D3 | [BSS-V2-014-04-03](BSS-V2-014-04-03-background-idle-borrowing.md) | Verified-idle background borrowing and lender-return fairness in that same atomic transaction | `-04-02` CK `PASS` |

Only `-04-03` CK `PASS`, after both prior children, completes this family. Any CFC correction belongs to the child owning the failed binary row and does not re-open an independently passed predecessor.

## Preserved frozen authority

- The sole execution path remains `admit_next_provider_work_attempt` → `admit_route_aware_provider_work_attempt` → exact reservation/window ledger → pg-boss admitted job → transport claim.
- Process accounting is a read-derived projection of authoritative reservation/window facts unless a concrete SQL limitation proves persistence necessary. A persisted form may mutate only inside the same authorized reservation/window lifecycle transaction; it is not a second quota ledger, writer, worker, reconciliation transaction, out-of-lifecycle trigger, scheduler, queue, send lane, or physical-liability source.
- Enforced dimensions are independent; approved Anoman `rpd: unknown/not_enforced` creates neither a numeric process allocation nor a process/provider RPD window row. Missing/revoked/mismatched approval fails closed.
- Background cannot borrow interactive protection or headroom. Held/claimed work is never rebased, recalled, or preempted; recovery remains the existing `0084` pathway.

## Original review-contract coverage

`RC-01404-01` is discharged by `RC-0140402-01`; `RC-01404-02` by `RC-0140401-01..03`; `RC-01404-03/04` by `RC-0140403-01..03`; `RC-01404-05` by `RC-0140401-03` and `RC-0140402-03`; and `RC-01404-06` by `RC-0140402-02/04` plus `RC-0140403-03`. This preserves every original acceptance condition while assigning projection, baseline enforcement, and above-baseline fairness to exactly one CK leaf.

## Family SecurityReadiness

- **Status:** `applicable`.
- `SR-01404-T1`: immutable allocation/model identity → existing atomic reservation authority.
- `SR-01404-A1`: baseline/cap, process usage, lender demand, reservation identity, concurrency seats, and held/spent liabilities.
- `SR-01404-C1`: no off-transaction accounting, virtual-time-only proof of idle share, cross-class loan, TPM/seat conversion, preemption, or supplemental send.
- `SR-01404-R1`: `-04-01` proves exact reconciliation, `-04-02` proves no-borrow atomic denial and revision fencing, and `-04-03` proves borrowing/fairness negatives.

## Hard stop

Stop the affected child for HMN/new planning authority if required accounting cannot reconcile under the existing transaction fence, lender demand cannot be observed under that lock, or the proposed remedy requires a second scheduler/queue/reservation/send lane. Do not merge children merely to make an integration test convenient.
