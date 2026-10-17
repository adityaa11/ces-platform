# BSS-V2-006-04-02 — Provider work admission and exclusive send boundary

- **State:** `awaiting_review`
- **Review batch:** `BSS-V2-BATCH-06-04-02`
- **Parent:** [BSS-V2-006-04 split map](BSS-V2-006-04-integrated-provider-admission-runtime-checkpoint.md)
- **Dependencies:** `BSS-V2-006-04-01` CK `PASS` and parent family dependencies.

## Outcome

Expose `ProviderWorkAdmission/v1` for one server-authorized background reference consumer, binding immutable logical work, payload reference/hash and `RequestResourceEnvelope` to one BSS-owned reservation, pg-boss dispatch and claimed 03A send.

## Authorized scope

Add idempotent logical-work registration and explicit attempt identity; validate server-selected process/workload/service class/route/domain, immutable reference/hash and envelope, active policy/constraint revision, idempotency/replay and cancellation-before-send. Return bounded durable states (`waiting`, `reserved`, `dispatched_or_may_have_started`, `terminal_*`, `pressure_limited`, `policy_or_resource_unfit`) through a versioned boundary. A narrowly qualified server-selected payload adapter may hydrate consumer-owned opaque references only after the claimed send fence and return raw provider output only to the consumer-owned bounded result boundary.

Do not add semantic parsing, reconciliation, client-selected identity, source/prompt/credential persistence, a second scheduler, an adapter-local send, a fake-success branch, or a retry loop. Existing ordinary semantic transport is not cut over here.

## Review contract

| ID | PASS iff / direct negative |
| --- | --- |
| `RC-BSSV2-00604-01` | Every reference-consumer fake outbound send has one prior durable reservation and explicit attempt; denied work has zero transport and no reservation authorizes two attempts. |
| `RC-BSSV2-00604-12a` | One independently implemented semantic-like **background** fake consumer registers work and receives typed outcomes solely through the generic API; a positive send has one matching reservation/attempt and no direct adapter bypass. |
| `RC-BSSV2-00604-14a` | Read-to-admit TOCTOU, stale process/policy revision, stale envelope or payload hash, duplicate registration and pre-send cancellation cannot produce unreserved, stale or double transport. |

## Required evidence

Drive the actual Bridge admission entrypoint and actual 03A pg-boss claimed transport with only the outbound HTTP transport faked. Assert exact durable work/attempt/reservation/job/claim/send identities, plus explicit zero direct-adapter sends. Replay, denied admission, stale hash and cancelled work must each be independently labeled.

## Security Readiness

`SR-0402-T1`: opaque consumer reference crosses into BSS attempt authority. `SR-0402-S1`: payload-hydration/result-return adapter is the sole extensibility seam. `SR-0402-C1`: no alternate sender, client-selected privilege, raw payload or hidden retry. `SR-0402-R1`: CK proves reservation-to-send one-to-one and negative bypass counters.

## Review Contract Closure

| Row | Ticket authority / required proof | Evidence and exact validation | Status |
| --- | --- | --- | --- |
| `RC-BSSV2-00604-01` | One durable reservation and explicit attempt precede each fake outbound send; replay/denial cannot produce a second transport. | `apps/agents-bridge/tests/provider-work-admission.integration.test.ts` drives `POST /v1/provider-work-admissions` through real PostgreSQL, pg-boss, 03A claim and fake transport; it asserts one reservation/job/claim/send and immutable idempotency/hash rejection. `DATABASE_URL=postgresql://atlas:atlas_local_dev_only@localhost:5432/atlas_dev corepack pnpm --filter @atlas/agents-bridge exec jiti tests/provider-work-admission.integration.test.ts` — PASS. | `PROVEN` |
| `RC-BSSV2-00604-12a` | An independent semantic-like background consumer uses only `ProviderWorkAdmission/v1`; its successful send has the matching reservation/attempt and no adapter bypass. | Same external Bridge fixture authenticates one background principal, does not call internal admission helpers, and verifies that its payload adapter executes only after the durable claim. It supplies the only fake outbound transport and observes exactly one send. Command above — PASS. | `PROVEN` |
| `RC-BSSV2-00604-14a` | Stale read-to-admit revision, changed payload hash under idempotency, duplicate registration, and pre-send cancellation cannot create stale, unreserved, or double transport. | Same fixture labels replay/hash conflict, stale revision (zero attempt/reservation), and cancellation while pg-boss delivery is stopped (terminal attempt, zero send). `packages/atlas-db/migrations/0070_bssv20060402_pre_send_cancellation_forward_fix.sql` closes the dispatched-before-claim cancellation fence. Command above — PASS. | `PROVEN` |

Direct regression validation also passed:

- `corepack pnpm --filter @atlas/agents-bridge typecheck`
- `DATABASE_URL=postgresql://atlas:atlas_local_dev_only@localhost:5432/atlas_dev corepack pnpm --filter @atlas/agents-bridge exec jiti tests/provider-admitted-worker.test.ts`
- `DATABASE_URL=postgresql://atlas:atlas_local_dev_only@localhost:5432/atlas_dev corepack pnpm --filter @atlas/agents-bridge exec jiti tests/provider-admitted-worker.integration.test.ts`
- `DATABASE_URL=postgresql://atlas:atlas_local_dev_only@localhost:5432/atlas_dev corepack pnpm --filter @atlas/agents-bridge exec jiti tests/runtime-capacity-constraint.integration.test.ts`
- `DATABASE_URL=postgresql://atlas:atlas_local_dev_only@localhost:5432/atlas_dev corepack pnpm --filter @atlas/db migration:check`

All commands passed. The production worker remains deliberately fail-closed until a separately qualified consumer payload adapter and outbound transport are provided; no semantic transport is cut over by this ticket.

Internal readiness: READY_FOR_CK
