# GO Checkpoint — BSS-V2-006-03A-06

- **Ticket:** `BSS-V2-006-03A-06` — Operational resilience and boundary closure
- **Batch:** `BSS-V2-BATCH-06-03A-06`
- **Authority:** explicit user command `GO BSS-V2-006-03A-06`; frozen ticket at `project's goal/Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-006-03A-06-operational-resilience-and-boundary-closure.md`.
- **Predecessors:** 03A-01 through 03A-05 are CK `PASS`; 03A-05 is recorded in `project's goal/feedback/BSS-V2-BATCH-06-03A-05-46e46d3-review.md`.
- **State:** `awaiting_review`; this checkpoint is GO evidence, not a CK decision.

## Bounded implementation

- Added forward migration `0066_bssv200603a_missing_route_binding_closure`. The common 03A-05 admission function now rejects a missing immutable route binding before a reservation or pg-boss job can exist. It keeps both service classes on the same admission path and does not add a route, provider, numeric ledger, public API, or scheduler.
- Extended the actual Bridge admitted-worker integration fixture. Its only double is the outbound HTTP transport port. It proves transactional rollback, stopped-worker restart before claim, serialized concurrent admission, duplicate/lost-ack replay, crash after claim, one durable terminal outcome, real active-plan wakeup consumption, role denial, and persisted feedback redaction.

## Implementation-side state-transition table

| Operation | Owner | Before → after | Fence / ledger key | Retry and recovery condition |
| --- | --- | --- | --- | --- |
| Admission | common Bridge SQL authority | `waiting` → `reserved` → `dispatched` | immutable route binding; domain advisory lock; reservation and dispatch identity | rollback removes all reservation/job effects; concurrent call observes one admitted result |
| Transport claim | admitted Bridge worker | `dispatched` → claimed send | reservation ID / `provider_transport_claim` | restart-before-claim consumes existing job; replay after claim cannot send again |
| Terminal feedback | qualified adapter ingress | claimed → `reconciled` | feedback ID and one terminal event per reservation | duplicate is idempotent; post-send failure records conservative `may_have_started` |
| Plan wakeup | same Bridge worker | active-plan dispatch → claimed/consumed | `(quota_domain_id, wakeup_key)` | replay cannot create a second effective wakeup or a second scheduler |

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence / exact validation | Status |
| --- | --- | --- | --- |
| `RC-06-01` | Actual PostgreSQL/pg-boss at-most-once send and idempotent terminal accounting across rollback, crash, acknowledgement loss, replay, and concurrent feedback/admission. | `apps/agents-bridge/tests/provider-admitted-worker.integration.test.ts` drives the production worker against a fresh PostgreSQL database: rollback leaves zero job, replayed terminal feedback races a new admission safely, restart-before-claim sends once, competing admission produces one dispatch, duplicate/lost-ack replay sends no second request, and crash-after-claim records exactly one conservative terminal outcome. | `PROVEN` |
| `RC-06-02` | Non-inert persisted reservation/job/claim/send/outcome/usage/pressure/wakeup rows, with no manual scheduler/accounting substitute. | The worker test observes actual `pgboss.job`, `provider_work_dispatch`, `provider_transport_claim`, feedback event, and `provider_work_wakeup_dispatch` rows. `provider-route-bound-operational-runtime.integration.test.ts` proves the exact physical-window usage, pressure, recovery, and conservative unknown path; `plan-wakeup-convergence.integration.test.ts` proves durable wakeup/rebase. | `PROVEN` |
| `RC-06-03` | Bridge role and redaction boundaries reject untrusted mutation and retain no raw sensitive provider data. | Worker integration proves `atlas_app` cannot claim, ingest, or read feedback rows and asserts persisted feedback lacks raw headers, bodies, prompts, sources, credentials, authorization, secrets, and tokens. Route-bound admission regression proves forged routes and untrusted/raw/unknown feedback fail before unsafe state changes. | `PROVEN` |
| `RC-06-04` | Fresh migration/bootstrap, typechecks, direct 005/006 regressions, and diff check pass; no live provider request, secondary broker, analytics, or Atlas-truth write. | Fresh database `atlas_bssv200603a06_go` migrated through `0066` then passed migration check, all named 005/006/03A suites, both DB/Bridge typechecks, and `git diff --check`. The production fixture uses only the content-free deterministic transport port and asserts the route-specific fake send count. | `PROVEN` |

## Evidence matrix mapping

| Evidence | Proof locator |
| --- | --- |
| `E01`–`E05` | `packages/atlas-db/tests/provider-route-bound-operational-runtime.integration.test.ts` plus `provider-route-bound-admission.integration.test.ts` |
| `E06` | `packages/atlas-db/tests/plan-wakeup-convergence.integration.test.ts` and `apps/agents-bridge/tests/provider-wakeup-worker.integration.test.ts` |
| `E07` | `packages/atlas-db/tests/background-route-aware-admission.integration.test.ts` |
| `E08` | `apps/agents-bridge/tests/provider-admitted-worker.integration.test.ts` |
| `E09` | Worker role/redaction assertions; route-bound admission negatives; fresh migration/typechecks and focused predecessor suites below |

## Validation evidence

Executed against a fresh disposable PostgreSQL database, `atlas_bssv200603a06_go`, after applying the committed migration list through `0066`:

```text
DATABASE_URL=postgresql://atlas:***@localhost:5432/atlas_bssv200603a06_go \
  corepack pnpm --filter @atlas/db migrate                              PASS
DATABASE_URL=postgresql://atlas:***@localhost:5432/atlas_bssv200603a06_go \
  corepack pnpm --filter @atlas/db migration:check                      PASS
corepack pnpm --filter @atlas/db exec jiti tests/provider-capacity-catalogue.integration.test.ts                 PASS (1 test)
corepack pnpm --filter @atlas/db exec jiti tests/process-workload-catalogue.integration.test.ts                  PASS (1 test)
corepack pnpm --filter @atlas/agents-bridge exec jiti tests/capacity-planner.test.ts                              PASS (3 tests)
corepack pnpm --filter @atlas/db exec jiti tests/desired-admission-profile-publication.integration.test.ts       PASS (1 test)
corepack pnpm --filter @atlas/db exec jiti tests/provider-work-reservation-window.integration.test.ts             PASS (1 test)
corepack pnpm --filter @atlas/db exec jiti tests/fair-admission-atomic-dispatch.integration.test.ts              PASS (1 test)
corepack pnpm --filter @atlas/db exec jiti tests/provider-route-bound-admission.integration.test.ts               PASS (1 test)
corepack pnpm --filter @atlas/db exec jiti tests/provider-route-bound-operational-runtime.integration.test.ts     PASS (8 tests)
corepack pnpm --filter @atlas/db exec jiti tests/plan-wakeup-convergence.integration.test.ts                     PASS (1 test)
corepack pnpm --filter @atlas/db exec jiti tests/background-route-aware-admission.integration.test.ts             PASS (1 test)
corepack pnpm --filter @atlas/agents-bridge exec jiti tests/provider-admitted-worker.integration.test.ts          PASS (1 test)
corepack pnpm --filter @atlas/agents-bridge exec jiti tests/provider-wakeup-worker.integration.test.ts            PASS (1 test)
corepack pnpm --filter @atlas/db typecheck                                                                        PASS
corepack pnpm --filter @atlas/agents-bridge typecheck                                                             PASS
git diff --check                                                                                                  PASS
```

The retained `25P01` cleanup warnings in existing transaction fixtures are expected after their explicit rollback attempts; every named assertion passed. The worker fixture captures exact nonzero reservation, job, claim, outcome, send, and wakeup observations. No live provider, source content, provider credential, header/body, external consumer, secondary queue/broker, BSS-V2-007 analytics, or Atlas-truth path is configured or invoked.

Internal readiness: READY_FOR_CK
