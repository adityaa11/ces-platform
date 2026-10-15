# GO Checkpoint — BSS-V2-BATCH-06-01

- Ticket: `BSS-V2-006-01` — Provider-work, reservation, quota-window and attempt foundation
- Ticket state: `awaiting_review`
- Authorized checkpoint: `BSS-V2-BATCH-06-01`
- Predecessors: BSS-V2-005-04 CK `PASS` at `92b8e0a`; approved BSS-006 pg-boss and BSS-003 Bridge persistence/role boundaries.
- Implementation commit: this checkpoint's `feat(admission): add provider work reservation foundation` commit

## Bounded implementation

- Added `0030_bssv200601_provider_work_reservation_window_foundation`, containing only Bridge-owned provider-work attempts, per-attempt reservations, exact window state and durable wakeup deduplication intent.
- Registration references an active immutable DesiredAdmissionProfile revision and persists only identity/policy/envelope metadata. It contains no prompt, source body, authorization header, connection identifier, provider transport, fairness ordering, or provider call.
- Reservation is fenced to one live row per logical-work/attempt. Cancellation before reservation creates no reservation; cancellation after a definitely unstarted reservation releases it; a possible transport is marked `consumed_unknown` rather than refunded.
- Wakeup requests are deduplicated Bridge state expressly attached to the existing pg-boss worker path; they are not a scheduler, polling loop, or broker.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence / validation | Status |
| --- | --- | --- | --- |
| `RC-BSSV2-00601-01` | Ticket § Review Contract: duplicate logical-work/attempt registration gives one waiting attempt and contains no content/secrets. | `0030...sql` `register_provider_work_attempt`; `provider-work-reservation-window.integration.test.ts` registers `interactive-1` twice and proves one row. The schema has no content-bearing columns. | PROVEN |
| `RC-BSSV2-00601-02` | Ticket § Review Contract: persist active plan, exact window identity/state, concurrency/cooldown; unknown reset fails closed. | `provider_quota_window_state` retains active profile/revision, capacity profile, dimension and JSON policy identity/state, cooldown and concurrency. The focused test proves unknown reset semantics reject a fabricated reset timestamp. Durable PostgreSQL state is restart-safe by persistence. | PROVEN |
| `RC-BSSV2-00601-03` | Ticket § Review Contract: one attributable reservation binds attempt, envelope and authorizing plan. | Partial unique index plus `reserve_provider_work_attempt`; focused test proves plan attribution and rejects duplicate live reservation. | PROVEN |
| `RC-BSSV2-00601-04` | Ticket § Review Contract: fencing preserves waiting/reserved/transport uncertainty and prevents silent second authorization. | Attempt state constraint and fenced transition functions; focused test proves possibly transmitted cancellation becomes `consumed_unknown`, not refunded, and cannot reserve again. | PROVEN |
| `RC-BSSV2-00601-05` | Ticket § Review Contract: pg-boss remains the only broker; future/domain wakeups deduplicate and can attach to plan changes. | Migration documents wakeup rows as deduplication intent only, keyed by domain/key with optional plan revision. Focused test submits duplicate window wakeups and observes one durable row. No broker, timer, polling loop or provider job is created. | PROVEN |
| `RC-BSSV2-00601-06` | Ticket § Review Contract: only Bridge owns operational persistence and Atlas trusted state remains unavailable. | Migration owns all relations/functions with `agents_bridge`, revokes `atlas_app`, and the focused test proves `atlas_app` cannot read attempts or call reservation. | PROVEN |
| `RC-BSSV2-00601-07` | Ticket § interactive lifetime contract: server-selected interactive class/deadline, zero pre-reservation transport, single release before transport, conservative possible-transport accounting. | The process profile supplies `service_class`; interactive work requires an admission deadline. Focused test covers terminal-before-reservation and post-transport cancellation uncertainty/restart-safe persisted fence. | PROVEN |

## Validation evidence

```text
pnpm --filter @atlas/db migrate                                      PASS
pnpm --filter @atlas/db test:provider-work-reservation-window        PASS (1 test, 0 failures)
pnpm --filter @atlas/db test:desired-admission-profile-publication   PASS (1 test, 0 failures)
pnpm --filter @atlas/db typecheck                                    PASS
pnpm --filter @atlas/agents-bridge typecheck                         PASS
pnpm --filter @atlas/db migration:check                              PASS
git diff --check                                                     PASS
```

Internal readiness: READY_FOR_CK
