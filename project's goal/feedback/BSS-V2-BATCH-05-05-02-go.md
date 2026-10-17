# GO checkpoint — BSS-V2-005-05-02

- **Ticket:** BSS-V2-005-05-02 — Authenticated capacity-planning snapshot boundary
- **Batch:** BSS-V2-BATCH-05-05-02
- **State:** `awaiting_review`
- **HMN authorization:** `HMN-BSSV2-005-05-02-001` (`RETURN_TO_GO`)
- **Review target commit:** pending GO commit
- **Dependencies consumed:** BSS-V2-005-04 CK `PASS` (immutable active DesiredAdmissionProfile read seam) and BSS-V2-005-05-01 CK `PASS` (server-qualified process/workload/route capability boundary).

## Bounded implementation

- Added an isolated Bridge PostgreSQL/pg-boss integration fixture for the one versioned `CapacityPlanningSnapshot/v1` read boundary. The fixture alone owns the `agents_bridge` connection; two independent fake consumers hold distinct opaque credentials and receive only typed planning results.
- Bound the exact HMN fixture identities: `semantic:v1` / `shared-route` / `atlas.semantic.extract` / `background` and `chat:v1` / `chat-route` / `atlas.chat.default` / `interactive`. The immutable `shared:v1` capacity fixture explicitly associates both routes and the test separately asserts each process capability.
- The snapshot reads the accepted 005-04 active-plan resolver and returns the versioned process, workload structural/estimator/output/safety, capacity/window/accounting, plan and activation identity. It is a test fixture only: no production code, migration, planner, publication, direct consumer SQL capability, reservation, dispatch, provider transport, or runtime-admission surface was added.

## Review Contract Closure

| Row | Ticket authority | Required proof | Evidence / validation locator | Exact command and outcome | Status |
| --- | --- | --- | --- | --- | --- |
| `RC-00505-10` | Frozen review-contract row 10; HMN fixture bindings | Two independently authenticated unrelated consumers use the same versioned read, receive coherent server-selected policy and active-plan identity, lack direct Bridge access, and cause zero attempts, quota mutation, reservations, provider jobs, and transports. | `packages/atlas-db/tests/capacity-planning-snapshot.integration.test.ts` fixture and `RC-00505-10/11` test; PostgreSQL role-denial assertions and scoped counters. | `pnpm --filter @atlas/db test:capacity-planning-snapshot` — passed, 1/1. | `PROVEN` |
| `RC-00505-11` | Frozen review-contract row 11; HMN prospective-view authorization | Foreign credential/route/class and dispatch intent fail closed; stale activation and missing plan are typed `stale`; zero/unknown required quota fail closed; only the semantic principal receives a distinctly inactive prospective sizing view that cannot dispatch, reserve, or grant admission. | `packages/atlas-db/tests/capacity-planning-snapshot.integration.test.ts` typed-negative, prospective sizing, zero/unknown capacity, and missing-plan assertions. | `pnpm --filter @atlas/db test:capacity-planning-snapshot` — passed, 1/1. | `PROVEN` |

Additional validation:

- `pnpm --filter @atlas/db test:desired-admission-profile-publication` — passed, 1/1.
- `pnpm --filter @atlas/db migration:check` — passed.
- `pnpm --filter @atlas/db typecheck` — passed.
- `git diff --check` — passed.

Internal readiness: `READY_FOR_CK`.

This is not a self-issued `PASS`. CK must review only the two frozen rows, the authorized test-fixture/checkpoint/ticket diff, the exact HMN bindings, and direct regressions.
