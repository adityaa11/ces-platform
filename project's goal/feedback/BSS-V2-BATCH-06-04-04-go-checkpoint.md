# BSS-V2-BATCH-06-04-04 GO checkpoint

- **Ticket:** `BSS-V2-006-04-04` — Interactive admitted-work lifecycle
- **Ticket state:** `awaiting_review`
- **Review batch:** `BSS-V2-BATCH-06-04-04`
- **Authorized implementation commit:** `3c606d46127d4986a749f142e6385e49c73292f5` (`feat(admission): add interactive admitted work lifecycle`)
- **Dependency gate:** `BSS-V2-006-04-03` CK `PASS`, recorded by `project's goal/feedback/BSS-V2-BATCH-06-04-03-28b2fd0-verification.md` and approval commit `580f74a3`.

## Bounded implementation

`ProviderWorkAdmission/v1` now admits both server-bound service classes. An
interactive principal must supply a positive deadline; the database persists it
as both admission and execution deadline while preserving the background
request shape. Principal registration continues to select the quota domain,
process, route, and service class. The shared route-aware reservation, pg-boss
dispatch, claimed-send, normalized feedback, and durable outcome paths remain
the only execution route.

Migration `0074_bssv20060404_interactive_admitted_work_lifecycle` makes an
interactive request that cannot fit terminal rather than orphaned waiting work,
settles expiry before a claim without an outbound call, and makes cancellation
terminal in the public outcome even if late feedback arrives. A late claimed
429 still records its scoped pressure and settled usage; cancellation does not
refund possibly transmitted work or permit a replay send.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence / command | Status |
| --- | --- | --- | --- |
| `RC-BSSV2-00604-09` | The ticket requires real PostgreSQL/pg-boss saturation of background plus fitting and unfit interactive work, with hard protected capacity and zero late send for unfit/expired work. | `apps/agents-bridge/tests/interactive-provider-work-admission.integration.test.ts` creates a one-unit background lane, consumes it, admits a fitting interactive attempt through global protected capacity, makes an over-capacity interactive attempt terminal with no job, then expires a dispatched interactive job before a replacement worker claims it. It asserts durable reservation/claim/send state. `corepack pnpm --filter @atlas/agents-bridge test:interactive-provider-work-admission` — PASS. | `PROVEN` |
| `RC-BSSV2-00604-10` | The ticket requires cancellation before/after claim, timeout/deadline, restart, late delivery, and mid-run 429 evidence that no expired work resurrects, double-dispatches, refunds possible use, or strands the consumer. | The same isolated Bridge fixture stops before cancellation, restarts a new worker for expired/cancelled queue deliveries, blocks an in-flight fake transport, cancels it, then releases a terminal 429. It proves terminal cancelled public state, one claim/send, settled RPM use, and pressure persistence. `corepack pnpm --filter @atlas/agents-bridge test:interactive-provider-work-admission` — PASS. | `PROVEN` |
| `RC-BSSV2-00604-12b` | The ticket requires an independent chat-like fixture through exactly the generic API and claimed-send path, with server-selected class and isolated quota domain. | The fixture authenticates distinct background/interactive principals against one generic API and asserts the persisted interactive process/service class despite a caller-supplied `serviceClass` field. Both sends use `createProductionBridgeWorker` and the shared claimed transport. `corepack pnpm --filter @atlas/agents-bridge test:interactive-provider-work-admission` — PASS. | `PROVEN` |
| `SR-0404-T1`, `SR-0404-C1`, `SR-0404-R1` | Authenticated caller/deadline; no caller class elevation/deadline resurrection; durable fences and protected capacity inspectable by CK. | Principal-derived SQL arguments, required interactive deadline, immutable replay deadline comparison, public cancelled outcome precedence, and durable integration assertions in the focused fixture. The focused and adjacent admission-worker suite passed. | `PROVEN` |

## Validation

Executed with the local Compose PostgreSQL service at the isolated Bridge
role; the fake transport is the only provider substitute.

```text
corepack pnpm --filter @atlas/db migrate  PASS (applied 0074_bssv20060404_interactive_admitted_work_lifecycle)
corepack pnpm --filter @atlas/db migration:check  PASS
corepack pnpm --filter @atlas/agents-bridge test:interactive-provider-work-admission  PASS (1 test)
corepack pnpm --filter @atlas/agents-bridge test:provider-admitted-worker  PASS (4 focused test files)
corepack pnpm --filter @atlas/agents-bridge typecheck  PASS
corepack pnpm --filter @atlas/db typecheck  PASS
git diff --check  PASS
```

Internal readiness: READY_FOR_CK

This is implementation readiness, not a self-issued CK `PASS`. Control returns
to independent CK for `BSS-V2-006-04-04`.
