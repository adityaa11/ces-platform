# CK review — BSS-V2-006-01

- **Ticket:** `BSS-V2-006-01` — Provider-work, reservation, quota-window and attempt foundation
- **Batch:** `BSS-V2-BATCH-06-01`
- **Ticket state:** `awaiting_review`
- **Frozen ticket:** `project's goal/Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-006-01-provider-work-reservation-window-foundation.md` at reviewed commit `83ee4369ddfc42309881dac871f6f0c05ee2ad40`
- **GO checkpoint:** `project's goal/feedback/BSS-V2-BATCH-06-01-go.md`
- **Reviewed commit:** `83ee4369ddfc42309881dac871f6f0c05ee2ad40` (`feat(admission): add provider work reservation foundation`)
- **Review type:** first consolidated review

## Review target and authority

The ticket is `awaiting_review`, names batch `BSS-V2-BATCH-06-01`, and the GO checkpoint identifies the implementation commit by its commit message; `HEAD` matches that committed implementation. The worktree contains unrelated Atlas fixture and temporary files, but no overlapping changes to the reviewed migration, test, ticket, or GO checkpoint, so the review target is unambiguous.

Authority is the frozen ticket, its incorporated provider-admission context §§21.1–21.4, and the approved BSS-006/BSS-003 persistence and role boundaries. No fairness policy or provider transport is required by this child; the ticket's hard stop remains persistence/state only.

## Review Contract outcomes

| Row | Status | Evidence |
| --- | --- | --- |
| `RC-BSSV2-00601-01` | UNRESOLVED | The registration function uses `ON CONFLICT DO NOTHING` and validates only quota-domain/profile/activation identity after a duplicate. It does not reject conflicting process, fairness, envelope, or deadline input. The envelope is only constrained to be a JSON object, with no prompt/source/credential/connection redaction boundary. See `CK-001.a`–`CK-001.b`. |
| `RC-BSSV2-00601-02` | UNRESOLVED | The table stores window fields, but `provider_capacity_profile_version` is not referentially bound and no rollover/refill transition derives state from the active profile. An inline PostgreSQL probe successfully inserted `MISSING-CAPACITY`; the focused test does not exercise restart or rollover/refill. See `CK-002.a`. |
| `RC-BSSV2-00601-03` | PROVEN | The partial unique index permits one live reservation per logical work/attempt, the reservation copies the attempt envelope and plan revision, and the focused integration test rejects a second live reservation and observes plan attribution. |
| `RC-BSSV2-00601-04` | UNRESOLVED | The state constraint names the uncertainty states, but execution-deadline expiry is not enforced by reservation/transport transitions, and there is no durable terminal/reconciled transition or stale-callback fence. An inline probe reserved work whose execution deadline was already past and then successfully marked transport as started. See `CK-003.a`–`CK-003.b`. |
| `RC-BSSV2-00601-05` | IMPLEMENTED_UNPROVEN | The wakeup table is Bridge-owned and deduplicates by domain/key, but the test covers only duplicate requests for the same plan. Later plan-change attachment and rejection of stale/missing plan references are not proven. See `CK-002.b`. |
| `RC-BSSV2-00601-06` | PROVEN | The migration makes Bridge the owner, revokes table/function access from `atlas_app`, and the focused test denies Atlas access. A direct role probe also returned `agents_bridge` `atlas_create=false` and `bridge_create=true`. |
| `RC-BSSV2-00601-07` | UNRESOLVED | Server-selected service class and admission deadlines are represented, but the execution deadline/cancellation linkage and restart/lost-ack/stale-callback behavior required by the interactive lifetime contract are incomplete. See `CK-001.b` and `CK-003.a`–`CK-003.b`. |

## Validation and evidence

Executed for this review:

```text
pnpm --filter @atlas/db migrate                                      PASS
pnpm --filter @atlas/db test:provider-work-reservation-window        PASS (1 test, 0 failures)
pnpm --filter @atlas/db test:desired-admission-profile-publication   PASS (1 test, 0 failures)
pnpm --filter @atlas/db typecheck                                    PASS
pnpm --filter @atlas/agents-bridge typecheck                         PASS
pnpm --filter @atlas/db migration:check                              PASS
git diff --check                                                     PASS
```

The Compose PostgreSQL service was healthy. A transaction-scoped reviewer probe, rolled back after execution, demonstrated: conflicting duplicate registration returned the original process/service/envelope; a past `execution_deadline_at` still reserved and accepted `mark_provider_work_transport_may_have_started`; and a quota-window row with `provider_capacity_profile_version = 'MISSING-CAPACITY'` was accepted. The focused test at `packages/atlas-db/tests/provider-work-reservation-window.integration.test.ts:7-57` covers the happy-path duplicate count, one reservation, pre-reservation cancellation, possible-transport cancellation, unknown reset timestamp, same-key wakeup dedupe, and Atlas read/function denial, but not the negative cases above or restart/window rollover.

## Frozen Finding Closure Matrix

### CK-001 — Registration identity and redaction are not closed

**Ticket authority:** `RC-BSSV2-00601-01` requires idempotent registration by logical-work/attempt identity, persistence of only process/quota/fairness/resource references, and absence of prompt/source bodies. The interactive lifetime contract and `RC-BSSV2-00601-07` also prohibit prompt, tokenized question, authorization-header, and connection-identifier metadata.

**Unsatisfied evidence:** `packages/atlas-db/migrations/0030_bssv200601_provider_work_reservation_window_foundation.sql:101-110` silently ignores a duplicate and compares only quota-domain/profile/activation fields. Lines `12` and `27` constrain the envelope only to a JSON object; arbitrary sensitive keys or bodies can therefore be persisted. The reviewer probe showed a conflicting process and changed envelope returned the original row instead of failing.

#### CK-001.a

- **Required observable state:** Re-registering an existing logical-work/attempt with any different process/profile, fairness key, resource envelope, service class source, or deadline is rejected as an identity conflict; an identical retry returns the unchanged waiting attempt.
- **Exact evidence / validation:** Add focused PostgreSQL assertions to `packages/atlas-db/tests/provider-work-reservation-window.integration.test.ts` for identical replay and conflicting process/envelope/deadline replay; run `pnpm --filter @atlas/db test:provider-work-reservation-window` with all assertions passing.
- **Direct-regression boundary:** Provider-work registration identity and its immutable attempt fields only. Reservation, provider transport, fairness ordering, and unrelated migrations are outside this clause unless directly changed by the repair.

#### CK-001.b

- **Required observable state:** Registration rejects prompt/source bodies, tokenized user questions, authorization headers/credentials, and connection identifiers in the RequestResourceEnvelope or other persisted quota metadata while retaining allowed resource metadata.
- **Exact evidence / validation:** Add deterministic negative registration assertions using synthetic sensitive sentinels and query the persisted attempt/reservation/window rows to prove the sentinels are absent; run the focused PostgreSQL test and the migration check successfully.
- **Direct-regression boundary:** Envelope/schema validation and redaction for provider-work operational state only. Provider adapter payloads, external transport, and Atlas trusted state are outside this clause.

### CK-002 — Window-policy and plan-change state is not fail-closed or fully proven

**Ticket authority:** `RC-BSSV2-00601-02` requires active-plan-derived exact window/refill identity/state, restart preservation, rollover/refill using only the referenced policy, and fail-closed missing/unknown policy behavior. `RC-BSSV2-00601-05` requires deduplicated future/domain wakeups including later plan-change attachment. The ticket's workflow evidence explicitly names migration, window, restart, and wakeup tests.

**Unsatisfied evidence:** `provider_quota_window_state.provider_capacity_profile_version` has no foreign key or active-profile validation, and the migration provides no rollover/refill transition that reads the referenced policy. The reviewer probe inserted `MISSING-CAPACITY` successfully. `request_provider_work_wakeup` accepts arbitrary optional plan/revision values, while the committed test repeats the same plan revision and does not exercise a later plan attachment.

#### CK-002.a

- **Required observable state:** Window state can be created and advanced only from the active DesiredAdmissionProfile's exact capacity profile and per-dimension window/refill policy; stale, missing, or unknown-required policy references fail closed; known-policy rollover/refill preserves the exact referenced identity and state across restart.
- **Exact evidence / validation:** Add Bridge-owned initialization/transition validation and focused PostgreSQL tests for missing capacity policy, unknown reset semantics, fixed/rolling/refill rollover, active-plan cutover, and database/worker restart persistence; run the named focused test, migration check, and typechecks successfully.
- **Direct-regression boundary:** `provider_quota_window_state` creation/transition and direct plan/window references. Fairness debt, provider feedback, and provider transport remain outside this clause.

#### CK-002.b

- **Required observable state:** A later active plan can attach to an existing deduplicated wakeup without creating a duplicate, while stale or unknown plan/revision attachment is rejected or safely ignored according to the active-plan boundary.
- **Exact evidence / validation:** Add a focused integration scenario that submits the same domain/key under the initial active plan and then a later active plan, asserts one durable wakeup carrying the valid later revision, and covers stale/missing plan rejection; run `pnpm --filter @atlas/db test:provider-work-reservation-window` successfully.
- **Direct-regression boundary:** Wakeup deduplication and plan-revision attachment only. pg-boss remains the sole broker; no provider dispatch or fairness behavior is added by this clause.

### CK-003 — Interactive expiry and attempt fencing do not close stale execution

**Ticket authority:** `RC-BSSV2-00601-04` requires restart/replay-safe attempt fencing that preserves transport uncertainty and prevents a second authorization. The prospective interactive lifetime contract requires bounded execution deadline/cancellation linkage, persisted expiry/cancellation across restart, lost-ack/race handling, and rejection of stale callbacks. `RC-BSSV2-00601-07` requires expiry/cancellation to produce zero pre-reservation reservation/job/transport and conservative accounting after possible transport.

**Unsatisfied evidence:** `execution_deadline_at` is stored at `0030...sql:18` but is not checked by `reserve_provider_work_attempt` or `mark_provider_work_transport_may_have_started` (`115-139`). The latter accepts any reserved attempt even after its execution deadline. Cancellation after possible transport leaves the attempt in `transport_may_have_started` (`154-156`), and no committed transition function reaches `reconciled`; `state_version` is incremented but is not supplied as a stale-callback fence. The focused test covers only one in-transaction cancellation path and does not restart the worker/database or replay a stale callback.

#### CK-003.a

- **Required observable state:** An expired or canceled interactive attempt cannot be reserved or marked for transport; pre-transport cancellation releases its live reservation exactly once and makes dispatch impossible, while possible transport preserves the conservative unknown-usage state.
- **Exact evidence / validation:** Add focused PostgreSQL scenarios for admission expiry, execution expiry after reservation, caller cancellation before reservation, caller cancellation after reservation but before transport, and cancellation after possible transport; assert reservation/job/transport counts and terminal/unknown accounting, then run the focused test successfully.
- **Direct-regression boundary:** Interactive attempt deadline/cancellation transitions and reservation release. Provider success, fairness ordering, and external SLA are outside this clause.

#### CK-003.b

- **Required observable state:** After worker restart, lost acknowledgement, or replay, a stale callback cannot resurrect expired work, make uncertain transport look untransmitted, or authorize a second live reservation; the attempt can progress through the ticket-defined terminal/reconciled fence without bypassing its original plan/attempt identity.
- **Exact evidence / validation:** Add a restart/replay integration scenario using the persisted attempt fence and explicit terminal/reconciled transitions, including a stale callback assertion; run the required restart/attempt-fence test and the existing migration/typecheck validation successfully.
- **Direct-regression boundary:** Attempt state fencing, replay, terminal/reconciled transitions, and one-live-reservation protection. New fairness policy, provider transport, and later usage reconciliation are outside this clause.

## Scope-change observations

None. The findings are implementation-repairable under the frozen ticket and require no product, policy, architecture, provider/runtime, deployment, or predecessor decision.

## Decision

`CHANGES_REQUIRED`. `RC-BSSV2-00601-03` and `RC-BSSV2-00601-06` are proven. Registration identity/redaction, exact policy-derived window behavior, plan-change wakeup attachment, and interactive expiry/replay fencing remain unresolved under `CK-001` through `CK-003`. Keep the ticket at `awaiting_review` and return control to human/planning authority for the bounded remediation workflow.
