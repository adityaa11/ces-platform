# GO Checkpoint — BSS-V2-006-03A-05

- **Ticket:** `BSS-V2-006-03A-05` — Background route-aware admission with interactive protection
- **Batch:** `BSS-V2-BATCH-06-03A-05`
- **Authority:** explicit user command `GO BSS-V2-006-03A-05`; frozen ticket at `project's goal/Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-006-03A-05-background-route-aware-admission.md`.
- **Predecessors:** 03A-01 through 03A-04 CK `PASS`; 03A-04 is recorded in `BSS-V2-BATCH-06-03A-04-a00ffd2-review.md`.
- **State:** `awaiting_review`; this is implementation readiness evidence, not a CK decision.

## Bounded implementation

- Added one route-bound operational admission function for both service classes. It validates the immutable route binding, active plan, cancellation/deadlines, scoped pressure, exact physical-window usage, and capacity before reserving, holding windows, and enqueueing the existing admitted job.
- The existing fair selector retains interactive-first ordering and durable background lane/key accounting, but delegates reservation and dispatch to that common authority. Background capacity is clamped below hard interactive reserve even when a trusted domain pressure clamp reduces usable capacity.
- Updated the inherited fair-admission regression to bind server-published routes and settle exact-window liabilities through the operational ingress. No public consumer surface, second scheduler, plan publication, reserve lending, or semantic execution was introduced.
- `0064` and `0065` are forward-only convergence migrations for the same new function after the first local upgrade exposed an output-column lookup ambiguity. The pristine `0063` definition contains the corrected lookup; no applied migration was rewritten.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence / exact validation | Status |
| --- | --- | --- | --- |
| `RC-05-01` | One admission authority and protected reserve; background cannot borrow it. | `0063`–`0065` make both `admit_next_provider_work_attempt` and the targeted interactive function call `admit_route_aware_provider_work_attempt`. `background-route-aware-admission.integration.test.ts` admits background then interactive capacity, while another background decision is unavailable. | `PROVEN` |
| `RC-05-02` | Pressure, cancellation, deadline expiry, and full concurrency produce bounded non-success with zero late send before transport. | The focused test observes `pressure_limited`, `unavailable`, and `deadline_expired` for background work and asserts zero `provider_work_dispatch` rows in every negative case. | `PROVEN` |
| `RC-05-03` | Durable fair background restart behavior and exact 03A-02 maybe-sent liabilities. | The focused test closes and reopens its database connection, observes persisted fairness lane state, then admits the next fair background lane through the common route-aware path. It settles successful fixture work through the typed ingress; common admission always calls `reserve_provider_operational_windows` before enqueue. | `PROVEN` |

## Validation evidence

Executed against the local Compose PostgreSQL service after applying migrations through `0065`:

```text
corepack pnpm --filter @atlas/db migrate                                                                  PASS
corepack pnpm --filter @atlas/db migration:check                                                          PASS
corepack pnpm --filter @atlas/db exec jiti tests/background-route-aware-admission.integration.test.ts    PASS (1 test)
corepack pnpm --filter @atlas/db exec jiti tests/fair-admission-atomic-dispatch.integration.test.ts      PASS (1 test)
corepack pnpm --filter @atlas/db exec jiti tests/provider-route-bound-operational-runtime.integration.test.ts PASS (8 tests)
corepack pnpm --filter @atlas/db exec jiti tests/plan-wakeup-convergence.integration.test.ts             PASS (1 test)
corepack pnpm --filter @atlas/agents-bridge exec jiti tests/provider-admitted-worker.integration.test.ts PASS (1 test)
corepack pnpm --filter @atlas/db typecheck                                                                PASS
corepack pnpm --filter @atlas/agents-bridge typecheck                                                     PASS
git diff --check                                                                                           PASS
```

The direct database regressions emit the known PostgreSQL `25P01` cleanup warning after explicit rollback; assertions pass. The admitted-worker regression passed after its durable pg-boss polling interval.

Internal readiness: READY_FOR_CK
