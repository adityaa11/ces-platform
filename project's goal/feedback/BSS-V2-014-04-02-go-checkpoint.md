# GO checkpoint — BSS-V2-014-04-02

- **Ticket / batch:** `BSS-V2-014-04-02` / `BSS-V2-014`
- **Authorized action:** explicit `GO BSS-V2-014-04-02` on 2026-10-23.
- **Committed review target:** `5e3cf7a24b75f0b172a93d400b572cc57b7ef77e` (`feat(bss-v2): enforce atomic process baselines`).
- **Ticket authority:** [frozen ticket](../Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-014-04-02-atomic-process-baseline-enforcement.md).
- **Dependencies consumed:** `BSS-V2-014-04-01` CK `PASS` at `a60bc7c49544d7dc0a099ee5e5970a8edeed846c`; `BSS-V2-014-02-02` CK `PASS` at `7d7612b55cf49ba071ea3eb89d86f8aaff3992ce`; established BSS-V2-006 reservation, recovery, effective-policy, and sole-worker boundaries are consumed unchanged.
- **Scope:** migration `0100` evolves the existing binding, atomic admission, reservation fence, claim, and existing outbound transport DTO only. No borrowing, resolver, queue, scheduler, reservation family, provider send lane, or production activation was added.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence / command | Status |
| --- | --- | --- | --- |
| `RC-0140402-01` | Exact plan/process/profile/authority, independent baseline, cap, class pool, interactive protection, and physical domain quota checks in the existing domain-locked transaction; saturation has no reservation/job/send. | `apps/agents-bridge/tests/weighted-process-baseline-admission.integration.test.ts` admits the exact vector and rejects above-baseline work with zero reservation and queue job. Migration `0100` performs plan, process, baseline/cap/class-pool, policy, physical usage, and established protected-reserve checks before the existing reservation insertion. | `PROVEN` |
| `RC-0140402-02` | Full immutable tuple travels published authority → desired v2 binding → attempt binding → reservation → claim → outbound transport; forged/incomplete identity fails closed; historical liabilities remain unrevised. | The focused fixture asserts binding/reservation equality and exact claim tuple, rejects a forged authority with no binding/reservation/send, and inventories the route-id overload as absent. `provider-admitted-worker.integration.test.ts` proves the existing worker receives the exact tuple through `ProviderOutboundTransport` and preserves its durable claim/replay behavior. | `PROVEN` |
| `RC-0140402-03` | Approved Anoman `rpd: unknown/not_enforced` has no RPD check or reservation, but RPM/TPM/concurrency stay exact; invalid approval fails closed. | The focused fixture's approved Anoman policy observes zero RPD ledger rows while admitting the enforced dimensions. The consumed `-04-01` fixture remains the frozen positive/negative missing, revoked, and mismatched approval proof. | `PROVEN` |
| `RC-0140402-04` | Existing admission/reservation/pg-boss/claim/outbound chain remains sole authority, with no alternate DTO/parser or send path. | Source changes are restricted to the existing migration seam and `ClaimedTransport`/`ProviderOutboundTransport`; the focused inventory finds only the evolved bigint authority binder, and the existing worker fixture proves one durable claim/send path. | `PROVEN` |

## Validation

Executed with the `atlas-canonical-perception` PostgreSQL Compose environment:

```text
pnpm --filter @atlas/db migrate
# PASS — applied 0100_bssv20140402_atomic_process_baseline_enforcement

pnpm --filter @atlas/db migration:check
# PASS — Atlas database migration check passed

pnpm --filter @atlas/agents-bridge exec jiti tests/weighted-process-baseline-admission.integration.test.ts
# PASS — 1/1

pnpm --filter @atlas/agents-bridge exec jiti tests/provider-admitted-worker.integration.test.ts
# PASS — 1/1

pnpm --filter @atlas/agents-bridge typecheck
# PASS — tsc -p tsconfig.json

git diff --check
# PASS
```

Internal readiness: READY_FOR_CK

The ticket is now `awaiting_review`; this is not a self-issued CK `PASS`.
