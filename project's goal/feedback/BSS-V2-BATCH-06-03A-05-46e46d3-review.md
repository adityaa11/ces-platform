# CK review — BSS-V2-006-03A-05

- **Ticket:** `BSS-V2-006-03A-05` — Background route-aware admission with interactive protection
- **Batch:** `BSS-V2-BATCH-06-03A-05`
- **Ticket/checkpoint state:** `awaiting_review`
- **Frozen ticket:** `project's goal/Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-006-03A-05-background-route-aware-admission.md`
- **GO checkpoint:** `project's goal/feedback/BSS-V2-BATCH-06-03A-05-go.md`
- **Reviewed commit:** `46e46d31b8d4a2a459ed6910dcc4fd5431223159`
- **Review type:** first consolidated review

## Review target and authority

The active-ticket tuple is unambiguous: the explicit user command selected
`BSS-V2-006-03A-05`, the ticket is `awaiting_review`, and the committed GO
checkpoint names reviewed HEAD `46e46d3`. The implementation paths in the
target commit have no unstaged edits. The primary worktree contains unrelated
dirty and untracked material, including unregistered diagnostic migrations
`0039`–`0046`; those paths are outside the reviewed commit and were excluded
from the target.

The frozen ticket's three-row Review Contract, its explicit cross-class
admission and protected-reserve obligations, the approved 03A-02 accounting
interface actually consumed, and repository evidence are the review authority.
No second scheduler, reserve lending, public consumer contract, semantic
execution, deployment target, or future dependency work is required here.

## Review Contract outcomes

| Row | Status | Evidence |
| --- | --- | --- |
| `RC-05-01` | `PROVEN` | `0063`–`0065` define one `admit_route_aware_provider_work_attempt` authority. The targeted interactive entrypoint delegates to it, and the fair selector delegates to it after retaining interactive-first ordering and durable background lane/key accounting. `background_admission_capacity` clamps background capacity to the post-reserve vector. `background-route-aware-admission.integration.test.ts` admits background and interactive work, then proves another background decision is unavailable while the protected interactive headroom remains usable. |
| `RC-05-02` | `PROVEN` | The focused integration test covers full concurrency, cancellation, deadline expiry, and route pressure. Each returns bounded non-success (`unavailable`, `deadline_expired`, or `pressure_limited`) and asserts zero `provider_work_dispatch` rows for the rejected background attempt, proving no late send before transport. |
| `RC-05-03` | `PROVEN` | The focused test closes and reopens the database connection, observes persisted background fairness state, and admits the next fair lane through the common route-aware path. The shared authority calls `reserve_provider_operational_windows` before enqueueing, and the 03A-02 route-runtime regression continues to prove conservative mixed/may-have-started liabilities and durable claim fencing. |

## Validation and evidence

Validation was run against the local Compose PostgreSQL service using
`postgresql://atlas:atlas_local_dev_only@localhost:5432/atlas_dev`:

```text
corepack pnpm --filter @atlas/db migrate                                                        PASS
corepack pnpm --filter @atlas/db migration:check                                                 PASS
corepack pnpm --filter @atlas/db exec jiti tests/background-route-aware-admission.integration.test.ts PASS (1 test)
corepack pnpm --filter @atlas/db exec jiti tests/fair-admission-atomic-dispatch.integration.test.ts PASS (1 test)
corepack pnpm --filter @atlas/db exec jiti tests/provider-route-bound-operational-runtime.integration.test.ts PASS (8 tests)
corepack pnpm --filter @atlas/db exec jiti tests/plan-wakeup-convergence.integration.test.ts     PASS (1 test)
corepack pnpm --filter @atlas/agents-bridge exec jiti tests/provider-admitted-worker.integration.test.ts PASS (1 test)
corepack pnpm --filter @atlas/db typecheck                                                   PASS
corepack pnpm --filter @atlas/agents-bridge typecheck                                        PASS
git diff --check HEAD^ HEAD                                                                  PASS
```

The route-runtime and wakeup tests emit the repository-documented PostgreSQL
`25P01` cleanup warning after explicit rollback; all assertions pass. The
target commit contains the route-aware admission migrations, migration
registration, focused cross-class test, predecessor regression update, ticket
state, and GO record.

## Frozen Finding Closure Matrix

No `CK-###` findings were identified. All ticket-derived Review Contract rows
are proven by the evidence above, so there are no closure clauses to freeze.

## Scope-change observations

None. No ticket change, new provider/runtime/deployment target, architecture or
product decision, unresolved policy, or predecessor reopening is required for
this checkpoint.

## Decision

`PASS`. The committed work satisfies all three frozen ticket rows, the required
cross-class and negative-case evidence, direct predecessor regressions, and the
explicit validation obligations. The integrated route-aware background and
interactive admission authority may be handed off to `BSS-V2-006-03A-06` for
destructive-path evidence.
