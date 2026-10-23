# BSS-V2-014-04-01 — Reconciled process-capacity window-usage projection

- **State:** `approved` following CK `PASS` for remediation commit `a60bc7c`; **Review batch:** `BSS-V2-014`. Executable BSS-V2-006 successor. No admission-policy change, borrowing, provider operation, or route activation is authorized.
- **Parent:** [BSS-V2-014-04 split map](BSS-V2-014-04-atomic-process-admission-and-borrowing.md).
- **Dependencies:** BSS-V2-014-02-02 CK `PASS`; approved BSS-V2-006 reservation/window, recovery, and effective-policy predecessors. `-04-02` may consume this result only after its reconciliation contract passes.

## Exact scope

Prefer a read-derived `ProcessCapacityWindowUsage/v1` projection from the existing authoritative reservation/window ledger. If a persisted projection is demonstrably necessary, it MUST be mutated atomically within the same existing reservation/window lifecycle transaction that mutates its authoritative facts. No independent writer, worker, reconciliation transaction, trigger path outside the authorized lifecycle, or alternative accounting authority may create, update, or reconcile it. It is keyed by reservation, exact process/profile, effective dimension, and window identity, and records held/spent semantics sufficient for later baseline decisions.

This child makes no admission eligibility, baseline/cap, lane-order, borrowing, or send decision. It adds no quota ledger, queue, scheduler, transport, or new accounting source. Excluded dimensions have no projection row.

## Binary Review Contract

| ID | PASS iff / direct negative | Required validation and evidence |
| --- | --- | --- |
| `RC-0140401-01` | For each effective dimension, the read-derived projection—or a persisted projection updated in the same lifecycle transaction—reconciles exactly to the existing domain held/spent ledger through reserve, completion, release, reset, cancellation, retry, ack loss, and restart. TPM remains spent until reset; seat release does not refund TPM. | Isolated PostgreSQL lifecycle integration fixture plus reconciliation query and transaction-boundary assertion. |
| `RC-0140401-02` | Every projection row has the exact reservation, process/profile, window, dimension, and plan identity; foreign/stale/missing identity, duplicate projection, or reconciliation mismatch fails transactionally with no partial row. | Negative SQL fixtures and rollback/count assertions. |
| `RC-0140401-03` | Anoman's authorized excluded RPD creates no process-usage or provider-window RPD row; RPM/TPM/concurrency remain projected. Missing/revoked/mismatched exclusion approval fails closed before a projection is accepted. | WCA-15 positive/negative DB projection fixture. |
| `RC-0140401-04` | The projection is read-derived from existing reservation/window facts, unless a documented concrete SQL limitation proves persistence necessary. Any persisted form is mutated only in the same authorized lifecycle transaction; no independent writer, worker, reconciliation transaction, out-of-lifecycle trigger, counter, admission authority, ledger, queue, scheduler, job, transport, or provider call exists. | Source/DDL and trigger/transaction entrypoint inventory, lifecycle mutation trace, and zero-effect counters. |

## Freeze-time validation commands

```text
pnpm --filter @atlas/db migration:check
pnpm --filter @atlas/agents-bridge exec jiti tests/process-capacity-window-usage.integration.test.ts
pnpm --filter @atlas/agents-bridge exec jiti tests/provider-admitted-worker.integration.test.ts
pnpm --filter @atlas/agents-bridge typecheck
```

## SecurityReadiness

- **Status:** `applicable`.
- `SR-0140401-T1`: authoritative reservation/window facts cross into a non-authoritative per-process projection.
- `SR-0140401-A1`: process/profile, reservation/window identity, held/spent units, and effective-dimension mask.
- `SR-0140401-C1`: prohibit out-of-transaction writes, invented RPD, a second ledger, or eligibility decisions.
- `SR-0140401-R1`: `RC-0140401-01..04` verify lifecycle reconciliation, identity negatives, excluded-RPD behavior, and sole-source proof.

## Hard stop

Stop if a read-derived projection cannot reconcile, or if a persisted form cannot be mutated in the same authorized reservation/window lifecycle transaction. Do not introduce a second accounting source, writer, worker, reconciliation transaction, out-of-lifecycle trigger, mutable counter, delayed best-effort path, or alternate admission transaction. Do not approximate TPM from seat release or invent RPD rows.
