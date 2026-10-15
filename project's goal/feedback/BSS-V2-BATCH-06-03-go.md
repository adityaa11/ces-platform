# GO checkpoint — BSS-V2-006-03

- **Ticket:** `BSS-V2-006-03` — Provider feedback, usage reconciliation, runtime clamp and plan convergence
- **Batch:** `BSS-V2-BATCH-06-03`
- **Ticket authority:** `project's goal/Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-006-03-provider-usage-runtime-clamp-plan-convergence.md`
- **Dependencies consumed:** BSS-V2-006-02 CK PASS (`51765ba`); BSS-V2-001 provider-neutral capability boundary.
- **Review target commit:** `9aac0ae` (`feat(admission): implement BSS 006-03 feedback convergence`).

## Bounded implementation

- Adds the secret-free typed `ProviderOperationalFeedback` normalizer at the Bridge capability boundary.
- Adds Bridge-owned durable outcome fences, retained actual/unknown usage, domain-scoped runtime pressure, bounded 429 cooldown, plan wakeups/fairness rebase, qualified BSS-V2-005 revision requests, and explicit structural-replan requests.
- Does not add a provider call, a product consumer, BSS-V2-007 cost/provenance analytics, a new broker, a direct BSS-V2-005 plan write, or a retry under an old reservation.

## Review Contract Closure

| Row | Ticket authority / required proof | Evidence and exact validation | Status |
| --- | --- | --- | --- |
| RC-BSSV2-00603-01 | Actual usage reconciles a reservation once; under-use refunds, over-use remains a deficit, and transmitted request/RPD remain counted. | `provider_work_outcome_reconciliation` unique feedback fence and `provider_runtime_usage_hold` in migration `0037`; actual/duplicate fixture asserts `rpm/rpd` retained, `tpm` actual and concurrency zero. `pnpm --filter @atlas/db test:provider-feedback-pressure-plan-convergence` PASS. | PROVEN |
| RC-BSSV2-00603-02 | Definitely untransmitted releases all; uncertain transport releases concurrency while retaining conservative usage until a proven boundary. | Same fixture proves zero hold for untransmitted and full retained unknown hold; `release_provider_runtime_usage_hold` refuses release without a known elapsed window boundary in `0039`. DB test PASS. | PROVEN |
| RC-BSSV2-00603-03 | Lower limits/Retry-After are durable, bounded, domain-scoped clamps that never raise plan capacity. | `provider_runtime_pressure`, effective-capacity min helper and route/domain validation in `0037`; restart fixture observes persisted pressure and an unrelated domain remains unchanged. DB test PASS. | PROVEN |
| RC-BSSV2-00603-04 | Metadata-free 429 creates bounded cooldown; later work is a fresh reservation, never a hidden same-reservation retry. | `record_unknown_provider_pressure` bounds cooldown to 1–300 seconds; admission returns no work while blocked. Existing BSS-V2-006-02 regression proves one claimed reservation cannot transport twice and a retry requires new attempt/reservation. DB test + `test:fair-admission-atomic-dispatch` PASS. | PROVEN |
| RC-BSSV2-00603-05 | New desired plan causes one domain wakeup, blocks only future work on decrease, enables next-boundary convergence, and preserves in-flight identity. | activation trigger rebases waiting work only, appends one `plan:<revision>` wakeup and preserves existing reservation plan/revision; fixture asserts all three. DB test PASS. | PROVEN |
| RC-BSSV2-00603-06 | Policy change creates a new fairness epoch and runtime metadata is separate from BSS-V2-007 analytics. | activation trigger resets domain fairness epoch; all new tables remain `bridge.*` runtime state and no BSS-V2-007 table/API is touched. Fixture asserts `plan-v2:2`; DB test PASS. | PROVEN |
| RC-BSSV2-00603-07 | Typed lower feedback clamps only its verified domain/dimension; ambiguous data cannot invent numeric limits. | dimension/route validation plus min-only helper; test asserts zero-TPM denial and unrelated-domain capacity unchanged. DB test PASS. | PROVEN |
| RC-BSSV2-00603-08 | 429 with/without metadata survives restart, keeps queue state durable, permits no busy retry, and never reuses the reservation. | persisted pressure/hold restart observation; bounded cooldown and no-dispatch background fixture; predecessor replay regression. DB test + fair-admission regression PASS. | PROVEN |
| RC-BSSV2-00603-09 | Qualified permanent lower policy is a request to BSS-V2-005, not a direct plan mutation; new plan wakes runtime. | `provider_capacity_revision_request` accepts only qualified source types and fixture proves it leaves active plan at `plan-v2`; activation/wakeup fixture proves runtime adoption. DB test PASS. | PROVEN |
| RC-BSSV2-00603-10 | Bad, wrong-domain, duplicate, stale, or structurally unfit feedback cannot lift pressure/double reconcile/spin work. | TS normalizer rejects raw/invalid feedback; DB route validation and feedback uniqueness; plan trigger terminalizes structurally unfit work and creates one replan request. Bridge boundary test + DB test PASS. | PROVEN |
| RC-BSSV2-00603-11 | Under pressure, interactive admission is bounded unavailable/expired while background waits and unknown transmitted usage is not zero-refunded. | Clamp fixture returns interactive `unavailable`; cooldown leaves background work waiting with zero admitted transport; unknown-hold assertion. DB test PASS. | PROVEN |

## Validation record

All commands passed on 2026-10-16:

- `pnpm --filter @atlas/db migrate`
- `pnpm --filter @atlas/db test:provider-feedback-pressure-plan-convergence`
- `pnpm --filter @atlas/db test:fair-admission-atomic-dispatch`
- `pnpm --filter @atlas/db typecheck`
- `pnpm --filter @atlas/agents-bridge exec jiti tests/provider-capabilities-boundary.test.ts`
- `pnpm --filter @atlas/agents-bridge typecheck`
- `git diff --check`

Internal readiness: READY_FOR_CK
