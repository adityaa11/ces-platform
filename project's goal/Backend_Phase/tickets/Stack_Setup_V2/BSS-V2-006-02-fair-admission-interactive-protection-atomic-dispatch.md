# BSS-V2-006-02: Fair multi-resource admission, interactive protection, and atomic single-attempt dispatch

- **State:** `planned`
- **Review batch:** `BSS-V2-BATCH-06-02`
- **Dependencies:** BSS-V2-006-01 CK `PASS`
- **Parent:** [BSS-V2-006](BSS-V2-006-capability-admission-interactive-protection.md)
- **Planning authority:** [Provider admission/staged semantic context](../../atlas-provider-admission-staged-semantic-pipeline-implementation-context.md) §§21.2-21.3

## Outcome

Implement per-quota-domain admission with hard interactive reserve, weighted dominant-resource background fairness without historical borrowing debt, fairness keys, resource fit, atomic reservation and pg-boss dispatch.

## Required scheduling behavior

- Background cannot consume hard interactive reserve.
- Interactive checks global effective capacity and is not queued behind background fairness.
- Background uses durable weighted dominant-resource virtual usage.
- Quota-domain virtual time is based on currently backlogged eligible lanes; an idle lane becoming backlogged is rebased to at least that baseline.
- Within a lane use durable least-recently-admitted fairness key + stable tie-break.
- Temporarily unfit work may be skipped without losing eligibility.
- No preemption of active provider calls.
- One reservation authorizes at most one outbound transport attempt; hidden adapter/SDK retry is forbidden on an admitted path.
- Admission + reservation + admitted state + pg-boss job enqueue are one transaction.

## Review Contract

| Row | Required behavior | Binary closure oracle |
| --- | --- | --- |
| RC-BSSV2-00602-01 | No admitted work exceeds RPM/TPM/RPD/concurrency state. | PASS iff each dimension denies one-more admission and denied work has zero transport. |
| RC-BSSV2-00602-02 | Background saturation preserves full hard interactive reserve. | PASS iff healthy protected interactive work can reserve despite large background backlog. |
| RC-BSSV2-00602-03 | Background lanes receive weighted multi-resource fairness with work-conserving borrowing and no historical borrowing debt. | PASS iff heavy/light lanes converge, idle capacity is borrowable, a late lane is rebased to domain virtual time, and no fitting lane starves. |
| RC-BSSV2-00602-04 | One process cannot monopolize across fairness keys. | PASS iff A(large)/B(small)/C(small) rotate durable keys while borrowing remains elastic when competitors are absent. |
| RC-BSSV2-00602-05 | One reservation/attempt authorizes at most one fake outbound transport attempt. | PASS iff any retry requires a new explicit attempt/reservation and a double-send under one reservation is rejected. |
| RC-BSSV2-00602-06 | Reservation + admitted state + pg-boss enqueue commit atomically. | PASS iff rollback exposes none and crash/retry cannot double-dispatch. |

## Hard stop

Deterministic fake execution only; no actual usage reconciliation or 429 adaptation yet.

## Security Refactor Readiness

**Status:** `applicable`.

- **Trust boundary:** sole waiting -> reservation -> executable-job transition.
- **Identity context:** domain, active plan/fairness epoch, work/attempt, service class, lane, fairness key/turn, envelope, reservation, job.
- **Extension seams:** serialization, protection, dominant cost, domain virtual time/rebase, key fairness, atomic dispatch.
- **Prohibited couplings:** admission bypass, background borrow of hard reserve, FIFO/magic scalar, process-local fairness, hidden transport retry.
- **Verification seams:** dimension boundaries, interactive saturation, late-join fairness, key fairness, single-attempt transport, rollback.
- **Review bindings:** CK verifies the pre-transport transaction, hard protection, debt-free fairness and one-attempt rule.

## Workflow evidence

Close all rows with deterministic load/late-join/borrow/retry-negative/rollback fixtures and `READY_FOR_CK`.
