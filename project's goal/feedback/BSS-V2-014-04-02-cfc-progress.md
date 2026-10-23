# CFC checkpoint — BSS-V2-014-04-02

- **Remediation base:** `0b86f156`.
- **Authorizing CK artifact:** [BSS-V2-014-04-02-5e3cf7a review](BSS-V2-014-04-02-5e3cf7a-review.md).
- **Continuation:** the interrupted, uncommitted CFC authorized for the same frozen closure target; no prior remediation commit or CK handoff existed.
- **Authorized frozen clauses:** `CK-001.a`, `CK-001.b`, and `CK-001.c` only.
- **Remediation commit:** this bounded checkpoint commit (`fix(bss-v2): close atomic admission evidence`).
- **State:** `awaiting_review`.

## Frozen finding closure matrix

| Clause | Ticket authority / frozen oracle | Remediation evidence | Required command and outcome | Oracle |
| --- | --- | --- | --- | --- |
| `CK-001.a` | `RC-0140402-01`: every effective-dimension, process baseline/cap, class-pool, protected-interactive-reserve, and physical-domain saturation is rejected inside the existing locked transaction with no reservation, pg-boss job, or provider send. | `apps/agents-bridge/tests/weighted-process-baseline-admission.integration.test.ts` now seeds exact multi-process allocations and asserts denied TPM, concurrency, explicit-cap, class-pool, protected-reserve, and physical-domain vectors. Each denial has zero reservation, ledger, dispatch, job, claim, and send-path counters. The existing exact within-baseline tuple/claim assertion remains. | `docker compose -p atlas-canonical-perception run --rm --no-deps atlas corepack pnpm --filter @atlas/agents-bridge exec jiti tests/weighted-process-baseline-admission.integration.test.ts` — **PASS**, 1/1. `docker compose -p atlas-canonical-perception run --rm --no-deps atlas corepack pnpm --filter @atlas/db migration:check` — **PASS**. `docker compose -p atlas-canonical-perception run --rm --no-deps atlas corepack pnpm --filter @atlas/agents-bridge typecheck` — **PASS**. | **PASS** |
| `CK-001.b` | `RC-0140402-02`: incomplete claimed tuples fail before dispatch; the named revision/recovery fixture preserves historical plan/reservation/claim identity and liabilities and routes incompatible waiting work through the existing typed recovery path. | `apps/agents-bridge/src/provider-operational-runtime.ts` exports the existing claim parser for direct fixture use; `provider-admitted-worker.integration.test.ts` rejects every frozen required tuple field before outbound dispatch. `durable-wakeup-convergence.integration.test.ts` binds the published bigint authority at every historical bind site and snapshots exact attempt, reservation, complete claim tuple, and transport-claim liability before both process and capacity revisions. It proves the snapshot unchanged, retains the historical reservation, and observes the existing `owner_replan_required` intent for incompatible waiting work. | `docker compose -p atlas-canonical-perception run --rm --no-deps atlas corepack pnpm --filter @atlas/agents-bridge exec jiti tests/provider-admitted-worker.integration.test.ts` — **PASS**, 2/2. `docker compose -p atlas-canonical-perception run --rm --no-deps atlas corepack pnpm --filter @atlas/agents-bridge exec jiti tests/durable-wakeup-convergence.integration.test.ts` — **PASS**, 1/1. | **PASS** |
| `CK-001.c` | `RC-0140402-03`: approved Anoman exclusion reserves no RPD admission ledger row while RPM/TPM/concurrency remain exact; missing, revoked, and mismatched approval fail closed before reservation/job/send. | The focused admission fixture retains its approved-positive zero-RPD-ledger assertion and adds savepoint-isolated missing-approval, revoked-approval, and mismatched-approval vectors. Each calls the same atomic admission seam and observes zero reservation, ledger, dispatch, job, claim, and send-path counters. | `docker compose -p atlas-canonical-perception run --rm --no-deps atlas corepack pnpm --filter @atlas/agents-bridge exec jiti tests/weighted-process-baseline-admission.integration.test.ts` — **PASS**, 1/1. | **PASS** |

## Direct regressions checked

- The targeted worker fixture still proves the existing sole admitted-job claim and outbound tuple path (2/2 passing).
- The durable wakeup fixture still proves the real worker's single durable recovery path and zero provider send during plan convergence (1/1 passing).
- The focused admission fixture remains inside the existing bind → admission → reservation → pg-boss → claim path; it adds no production admission, resolver, queue, scheduler, borrowing, provider-operation, or transport lane.
- `git diff --check` over this remediation's authorized files passed with no whitespace errors.

Internal readiness: **READY_FOR_CK**.

CFC makes no PASS determination. CK must verify only frozen `CK-001.a` through
`CK-001.c`, this remediation diff, the evidence named above, and direct
regressions introduced by the remediation. No review-contract row, admission
behavior, or acceptance criterion was expanded.
