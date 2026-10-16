# GO Checkpoint — BSS-V2-006-03A-02

- **Ticket:** `BSS-V2-006-03A-02` — Exact physical-window reconciliation
- **Batch:** `BSS-V2-BATCH-06-03A-02`
- **Authority:** explicit user command `GO BSS-V2-006-03A-02`; frozen ticket at `project's goal/Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-006-03A-02-exact-window-reconciliation.md`.
- **Predecessor:** `BSS-V2-006-03A-01` CK `PASS`, recorded in `project's goal/feedback/BSS-V2-BATCH-06-03A-01-29c7ef3-verification.md`.
- **State:** `awaiting_review`; this is an implementation readiness record, not a CK decision.

## Bounded implementation

- Added the domain-owned `provider_window_usage_ledger`, with immutable per-dimension physical-window identity and bounded usage states.
- Routed interactive admission and typed terminal feedback through that ledger. Known TPM use refunds only held units or preserves a non-negative deficit; RPM/RPD and omitted/unknown TPM remain conservatively charged.
- Kept the predecessor claim fence: a definitely-not-sent report is rejected after the durable transport claim, while may-have-started retains unknown usage and concurrency until a terminal confirmation.
- Added compatibility for the accepted unbound 006-01/02 generic path only when its process has no eligible route. Route-capable work continues to require server-qualified binding before reservation; the generic path remains unclaimable by the 03A worker.
- Registered only migrations `0047`, `0048`, `0052`, `0053`, and `0054`. Pressure/wakeup migrations `0049`–`0051` and `0055`, and their worker, remain outside this checkpoint.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence / exact validation | Status |
| --- | --- | --- | --- |
| `RC-02-01` | Frozen row: same-window known under-use refunds only held units; over-use retains a non-negative deficit that blocks fitting later admission. | Ledger settlement at `packages/atlas-db/migrations/0047_bssv200603a_physical_window_accounting.sql`; under-use/admission and over-use/deficit cases in `packages/atlas-db/tests/provider-route-bound-operational-runtime.integration.test.ts` (`retains exact physical-window usage` and `retains overuse deficits`). | `PROVEN` |
| `RC-02-02` | Frozen row: known and omitted dimensions settle independently; omission is never zero; request/RPD and unknown TPM remain charged. | Typed ingress settlement in migration `0047`; `settles mixed usage conservatively and honors the durable claim fence` observes known TPM, omitted RPM/RPD, and may-have-started unknown TPM. | `PROVEN` |
| `RC-02-03` | Frozen row: definitely-not-sent releases once only before the durable claim; may-have-started remains conservative until completion. | Migration `0047` tests the durable claim table before release; the mixed-disposition integration scenario proves release before claim, rejection after claim, and retained `consumed_unknown` liabilities. | `PROVEN` |
| `RC-02-04` | Frozen row: RPM/TPM/RPD have distinct physical identities/expiry; incompatible reset/restart fails closed and old compatible-plan liabilities persist once. | Migrations `0047`, `0053`, and `0054`; the reconciliation integration scenario observes 60s RPM, 120s TPM, and 1-day RPD windows, compatible activation retaining exactly 5 TPM, and incompatible active-policy admission returning `unavailable`. | `PROVEN` |

## SecurityReadiness

- `SR-02-LEDGER` — applicable: all liabilities remain keyed by quota domain, capacity-policy version, dimension, and physical window; no route ledger was introduced.
- `SR-02-UNKNOWN` — applicable: untrusted/unknown transport states cannot optimistically release charge or concurrency.
- `RB-03` — satisfied by persisted-window, compatible activation, incompatible-policy, and direct predecessor regression tests.
- Unresolved security policy remains unchanged: provider policy selection and later pressure/probe/wakeup behavior are out of scope.

## Validation evidence

Executed against a fresh disposable PostgreSQL database after applying the exact migration list:

```text
corepack pnpm --filter @atlas/db migrate                                                        PASS
corepack pnpm --filter @atlas/db exec jiti tests/provider-route-bound-operational-runtime.integration.test.ts  PASS (4 tests)
corepack pnpm --filter @atlas/db exec jiti tests/provider-work-reservation-window.integration.test.ts           PASS (1 test)
corepack pnpm --filter @atlas/db exec jiti tests/fair-admission-atomic-dispatch.integration.test.ts             PASS (1 test)
corepack pnpm --filter @atlas/db exec jiti tests/provider-route-bound-admission.integration.test.ts             PASS (1 test)
corepack pnpm --filter @atlas/db migration:check                                                                  PASS
corepack pnpm --filter @atlas/db typecheck                                                                        PASS
corepack pnpm --filter @atlas/agents-bridge typecheck                                                             PASS
git diff --check                                                                                                  PASS
```

Internal readiness: READY_FOR_CK
