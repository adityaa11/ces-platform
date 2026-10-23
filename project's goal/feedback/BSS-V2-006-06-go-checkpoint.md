# GO checkpoint — BSS-V2-006-06

- **Ticket / batch:** `BSS-V2-006-06` / standalone bounded admission cutover.
- **Authorized action:** explicit `GO BSS-V2-006-06` on 2026-10-23.
- **Committed review target:** `99c452a316516c7673863e5e8d47c29dcd8402ca` (`feat(bss-v2): cut over public admission authority`).
- **Ticket authority:** [frozen ticket](../Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-006-06-public-admission-authority-cutover.md), including frozen `RC-00606-01` through `RC-00606-04` only.
- **Dependencies consumed:** CK `PASS` evidence for `BSS-V2-006-04-02` (`BSS-V2-BATCH-06-04-02-6d00987-verification.md`), `BSS-V2-006-04-06` (`BSS-V2-BATCH-06-04-06-c99da45-verification.md`), and `BSS-V2-014-04-02` (`BSS-V2-014-04-02-e4d4dae-verification.md`). `BSS-V2-014-04-03` was neither read as a dependency nor modified.

## Bounded implementation

`0102_bssv200606_public_admission_authority_cutover.sql` evolves only the existing `bridge.admit_provider_work_admission_v1` consumer. Inside its existing authenticated/idempotent transaction it resolves one publisher-issued bigint before any attempt, admission, reservation, dispatch, claim, or transport artifact:

- An active calculated-v2 plan accepts only its exact immutable `desired_admission_profile_route_binding_v2` row and its complete qualified/capacity/process tuple.
- A historical plan selects exactly one complete publisher authority matching the active capacity-associated route tuple; zero or multiple candidates reject.
- The existing `bridge.bind_provider_work_route(text,integer,bigint)` receives that value directly. No route-text binder, compatibility fallback, public endpoint, resolver, scheduler, reservation family, worker, queue, or transport lane was added.

The required fairness fixture was corrected to publish and pass the same immutable bigint authority to its existing historical bind calls. The focused public fixture adds a calculated-v2 API matrix and retains the prior authenticated ingress/replay/attempt/reservation/pg-boss/claim/fake-transport evidence.

## Review Contract Closure

| Row | Ticket authority / required proof | Evidence / exact validation | Status |
| --- | --- | --- | --- |
| `RC-00606-01` | Preserve the authenticated server-selected `ProviderWorkAdmission/v1` ingress, idempotency/replay, attempt fence, response semantics, and its existing admission → reservation → pg-boss → claim → transport chain. | `apps/agents-bridge/tests/provider-work-admission.integration.test.ts` exercises the actual HTTP endpoint with Bridge/PostgreSQL/pg-boss and verifies replay identity, attempt, reservation, job, claim, and once-only fake transport. `pnpm --filter @atlas/agents-bridge exec jiti tests/provider-work-admission.integration.test.ts` — PASS (2/2). | `PROVEN` |
| `RC-00606-02` | Resolve exactly one published bigint. Calculated-v2 admission requires its exact desired-plan route binding and complete domain/process/route/model/adapter/qualification/capability tuple; missing, foreign, stale, revoked, ambiguous, mismatched, and incomplete input reject before artifacts. | Named `RC-00606-02 authority matrix admits only the immutable calculated-v2 route binding` in `apps/agents-bridge/tests/provider-work-admission.integration.test.ts` admits the valid v2 binding and covers each named negative, including an ambiguous historical pair. Each negative asserts zero reservation, dispatch, pg-boss job, and claim/transport artifact. It also proves the route-text regprocedure is absent and bigint binder is present. Command above — PASS (2/2). | `PROVEN` |
| `RC-00606-03` | Historical `plan-v1` fairness remains on the existing bigint binder; no text overload, compatibility mechanism, or fallback is restored, and historical success cannot relax calculated-v2 authority. | `packages/atlas-db/tests/policy-aware-runtime-admission-fairness.integration.test.ts` now captures the publisher authority bigint and supplies it to the existing binder. `pnpm --filter @atlas/db exec jiti tests/policy-aware-runtime-admission-fairness.integration.test.ts` — PASS (1/1). The focused matrix additionally rejects incomplete calculated-v2 authority with zero artifacts. | `PROVEN` |
| `RC-00606-04` | Reject authority before reservation/dispatch/job/claim/transport; retain one ingress, bigint binder, route-aware transaction, reservation family, job/consumer, claim, and outbound input. | Source/SQL/TypeScript inventory: one endpoint in `apps/agents-bridge/src/app.ts`; one public SQL consumer in migration `0102`; one active bigint binder in migration `0100` (the test proves `to_regprocedure(...text)` is null); one route-aware admission transaction and reservation/`bridge-provider-admitted-execution-v1` dispatch in migration `0101`; one claim in `bridge.claim_provider_admitted_transport`; one outbound input in `apps/agents-bridge/src/provider-operational-runtime.ts`. Focused zero-artifact matrix and existing worker fixture confirm the operational boundaries. `pnpm --filter @atlas/agents-bridge exec jiti tests/provider-admitted-worker.integration.test.ts` — PASS (2/2). | `PROVEN` |

## Frozen validation record

All commands used `DATABASE_URL=postgresql://atlas:atlas_local_dev_only@localhost:5432/atlas_dev` and the local Bridge role password from `.env`:

```text
pnpm --filter @atlas/db migration:check
# PASS: Atlas database migration check passed

pnpm --filter @atlas/agents-bridge exec jiti tests/provider-work-admission.integration.test.ts
# PASS: 2/2 (existing public ingress chain + named RC-00606-02 matrix)

pnpm --filter @atlas/agents-bridge exec jiti tests/provider-admitted-worker.integration.test.ts
# PASS: 2/2

pnpm --filter @atlas/db exec jiti tests/policy-aware-runtime-admission-fairness.integration.test.ts
# PASS: 1/1

pnpm --filter @atlas/agents-bridge typecheck
# PASS
```

No frozen-scope expansion, predecessor change, `BSS-V2-014-04-03` change, compatibility path, or new execution lane was required.

Internal readiness: READY_FOR_CK

## CK review request

Please perform independent CK review of committed target `99c452a316516c7673863e5e8d47c29dcd8402ca` against the frozen `RC-00606-01..04` closure ledger above. This checkpoint is a GO readiness record only; it does not issue a CK decision.
