# CFC checkpoint — BSS-V2-006-02

- **Ticket:** `BSS-V2-006-02` — Fair multi-resource admission, interactive protection, and atomic single-attempt dispatch
- **Batch:** `BSS-V2-BATCH-06-02`
- **Remediation base:** `35c0d34d112d7e22fee6c2c568c2f2c62a6ca542`
- **Frozen CK artifact:** `project's goal/feedback/BSS-V2-BATCH-06-02-35c0d34-review.md`
- **HMN authorization consumed:** `HMN-BSS-V2-006-02-001`
- **Checkpoint state:** `awaiting_review`

## CFC progress matrix

| Frozen clause | Status | Closure evidence | Required command and outcome | Frozen oracle |
| --- | --- | --- | --- | --- |
| `CK-001.a` | PROVEN | `0036_bssv200602_cfc_fair_admission_closure.sql` selects background lanes with `GREATEST(stored_usage, domain_virtual_time)`; the focused fixture advances one lane, reactivates another, and observes persisted baseline-or-higher usage. | `node --env-file=../../.env ./node_modules/jiti/lib/jiti-cli.mjs tests/fair-admission-atomic-dispatch.integration.test.ts` — PASS (1 test). | PASS: reactivated lane has no stale idle credit and the focused fixture passes. |
| `CK-002.a` | PROVEN | Focused fixture independently exhausts RPM, TPM, RPD, and concurrency; it also makes five background items backlogged, admits only background capacity, and admits protected interactive work. Denied work has zero dispatch rows. | Focused integration command — PASS (1 test). | PASS: four dimension boundaries and saturated-background protected-interactive assertion pass with zero denied transport. |
| `CK-002.b` | PROVEN | Focused fixture checks A-large/A-small/B-small/C-small durable key turns, sole-lane full-background borrowing, fitting work selected ahead of an unfit competitor, and both existing-lane reactivation and fresh queues. | Focused integration command — PASS (1 test). | PASS: persisted-state fairness observations all pass. |
| `CK-002.c` | PROVEN | Focused fixture injects failures at attempt-state, reservation, pg-boss job, and dispatch-row steps and observes no residual reservation/job/dispatch. It verifies transport-claim replay rejection and an explicit second attempt with a distinct reservation. | Focused integration command — PASS (1 test). | PASS: failure leaves no partial admission; replay has at most one job/transport per attempt; retry uses a new attempt. |
| `CK-002.d` | PROVEN | `bridge.admit_interactive_provider_work_attempt` returns `admitted`, `unavailable`, or `deadline_expired` at the BSS boundary. Focused scenarios cover expiry, cancellation, server-derived class, full concurrency, stale activation, background saturation, and zero forbidden dispatch. | Focused integration command — PASS (1 test). | PASS: each named negative returns a bounded permitted result/fitting admission and has zero forbidden late transport/capacity bypass. |

## Direct regression checks

```text
node --env-file=../../.env ./node_modules/jiti/lib/jiti-cli.mjs tests/fair-admission-atomic-dispatch.integration.test.ts  PASS (1 test, 0 failures, 0 skipped)
corepack pnpm --filter @atlas/db typecheck                                                                    PASS
node --env-file=.env packages/atlas-db/scripts/migrate.mjs --check                                            PASS
git diff --check                                                                                               PASS
```

The only implementation change is a forward migration that corrects active-epoch
candidate selection and adds the bounded interactive admission function. It
does not alter BSS-V2-005 planner/hard-reserve interfaces or BSS-V2-006-01
durable foundation contracts.

Internal readiness: READY_FOR_CK
