# CK review — BSS-V2-006-04-03

- **Ticket:** `BSS-V2-006-04-03` — Operational outcome and feedback recovery projection
- **Batch:** `BSS-V2-BATCH-06-04-03`
- **Ticket/checkpoint state:** `awaiting_review`
- **Frozen ticket:** `project's goal/Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-006-04-03-operational-outcome-feedback-recovery-projection.md`
- **GO checkpoint:** `project's goal/feedback/BSS-V2-BATCH-06-04-03-go.md`
- **Reviewed commit:** `895d811a58c3c1b3e70e371507fdecc4a910fd1a` (`feat(admission): project operational feedback outcomes`)
- **Review type:** first consolidated review
- **Result:** `CHANGES_REQUIRED`

## Review target and authority

The active-ticket tuple is unambiguous: the user-selected ticket is
`BSS-V2-006-04-03`, the ticket is `awaiting_review`, and the GO checkpoint,
implementation, migrations, and focused integration fixture were committed
together in `895d811a`. The ticket-owned implementation paths have no
unstaged modifications. The worktree contains unrelated tracked and
untracked fixture, diagnostic, migration, and semantic-cutover material; it
was excluded from this review and does not make the target ambiguous.

The review authority is the frozen ticket's Outcome, Authorized scope,
three-row Review contract, Required evidence, and named Security Readiness
bindings, together with the approved `BSS-V2-006-04-02` and 03A interfaces
actually consumed. No new provider, deployment target, semantic interpreter,
recursive retry, or future-ticket requirement is added here.

## Review Contract outcomes

| Row | Status | Evidence |
| --- | --- | --- |
| `RC-BSSV2-00604-03` | `IMPLEMENTED_UNPROVEN` | `apps/agents-bridge/tests/provider-work-admission.integration.test.ts:95-142` proves the public replay identity, one positive durable identity chain, consumer-owned malformed-output separation, and no optimistic refund for the ack-loss TPM row. The required exact usage ledger proof and restart/crash proof for unknown usage are absent. |
| `RC-BSSV2-00604-13` | `IMPLEMENTED_UNPROVEN` | `:170-216` and `:221-252` cover provider failure, metadata-free 429, usable Retry-After, pressure recovery, restart of the rate-limited outcome, and distinct explicit retry reservations. The named timeout/connection-loss case is not exercised, and the ack-loss unknown state is not verified after restart. |
| `RC-BSSV2-00604-14b` | `IMPLEMENTED_UNPROVEN` | `:102-166` covers API replay, immutable-hash denial, stale denial, and dispatched-but-unclaimed cancellation; `:254-264` covers one post-send ack-loss state. The required per-case reservation/claim/send/usage/pressure/outcome record is not captured, and no duplicate-delivery or post-restart replay observation is supplied for the unknown case. |
| `SR-0403-T1`, `SR-0403-C1`, `SR-0403-R1` | `IMPLEMENTED_UNPROVEN` | The migration allowlist and typed operational ingress are bounded and redacted by inspection, but the required once-only recovery observation across restart is not proven by the committed fixture. |

The focused implementation and regression commands passed, but those passes
do not replace the ticket-named timeout, restart/crash, and durable-row
observations.

## Findings

### CK-001 — Required timeout/restart and complete durable recovery evidence is missing

The implementation appears to contain the conservative thrown-transport
fallback (`may_have_started` with unknown accounting), but the committed
evidence does not prove the complete frozen contract.

#### Frozen Finding Closure Matrix

| Clause | Exact ticket authority | Unsatisfied evidence | Binary closure oracle |
| --- | --- | --- | --- |
| `CK-001.a` | Ticket **Authorized scope** requires timeout, ack loss, restart, and explicit new-attempt retry; `RC-BSSV2-00604-13` requires timeout and possible-send unknown usage to persist across restart; **Required evidence** requires restart/crash injection through ordinary infrastructure ports. | The fake transport only returns success/provider-failure/rate-limited outcomes or throws once after incrementing the send counter. No committed case times out or loses the connection, and the ack-loss case is not followed by worker/process restart and replay inspection. | **PASS iff** an executed real PostgreSQL/pg-boss fixture drives a named timeout/connection-loss (or equivalent crash-in-flight) case through the ordinary Bridge/worker path, then restarts the worker and proves the same reservation/attempt remains auditable, the public outcome remains the typed conservative unknown/dispatched state, unknown usage/concurrency is retained exactly once, no second job/claim/send occurs, and a later retry is accepted only as a distinct explicitly admitted attempt/reservation after the authorized recovery condition. **FAIL** if timeout is absent, restart is only tested for the unrelated rate-limit case, unknown resources are released, or replay sends again. Direct-regression boundary: the admitted worker, operational feedback ingress, physical-window accounting, pressure/recovery projection, and `ProviderWorkAdmission/v1`; no provider credentials or semantic result handling. |
| `CK-001.b` | `RC-BSSV2-00604-03` requires exact/unknown once-only capacity effects and no double spend/refund/stale release; `RC-BSSV2-00604-14b` requires duplicate delivery, lost ack, cancellation/replay, and auditable in-flight reservation; **Required evidence** requires reservation, claim, send, usage, pressure, and outcome rows for every case. | The positive exact-usage case asserts only the terminal API outcome and transport count; it does not assert the persisted RPM/TPM/RPD/concurrency ledger values. The fixture does not emit a complete matching durable-row record for the success, provider failure, both 429 variants, timeout/unknown, cancellation/replay, and explicit retry cases. | **PASS iff** the executed fixture records and asserts, per named case, the matching logical work/attempt, reservation, pg-boss dispatch/job, claim, fake-send count, feedback/usage ledger rows, pressure incident/recovery rows where applicable, and public outcome. The exact-usage case must show the reported consumption settled once; unknown/ack-loss/timeout must show request/day spend once with unknown metered usage and concurrency retained, with no duplicate job/claim/send or stale release; replay/cancellation must show the permitted zero or one identities; the explicit retry must have a different attempt and reservation identity. Exact evidence must be in the committed test output or named persisted-row assertions. Direct-regression boundary: only the BSS operational outcome, accounting, replay/cancellation, and public admission projection paths covered by this ticket. |

These clauses freeze the complete admissible closure target for this first
review. They do not require additional uniform observations outside the named
ticket cases.

## Validation and evidence

Executed against the local isolated Bridge PostgreSQL/pg-boss path:

```text
corepack pnpm --filter @atlas/agents-bridge typecheck                         PASS
DATABASE_URL=postgresql://atlas:atlas_local_dev_only@localhost:5432/atlas_dev corepack pnpm --filter @atlas/agents-bridge exec jiti tests/provider-work-admission.integration.test.ts PASS (1 test)
DATABASE_URL=postgresql://atlas:atlas_local_dev_only@localhost:5432/atlas_dev corepack pnpm --filter @atlas/agents-bridge exec jiti tests/provider-admitted-worker.test.ts PASS (1 test)
DATABASE_URL=postgresql://atlas:atlas_local_dev_only@localhost:5432/atlas_dev corepack pnpm --filter @atlas/agents-bridge exec jiti tests/provider-admitted-worker.integration.test.ts PASS (1 test)
DATABASE_URL=postgresql://atlas:atlas_local_dev_only@localhost:5432/atlas_dev corepack pnpm --filter @atlas/db migration:check PASS
corepack pnpm --filter @atlas/db typecheck                                  PASS
git diff --check 895d811a^ 895d811a                                      PASS
```

The focused integration test passed, but its current evidence is insufficient
for the frozen clauses above. No live provider request, raw provider payload,
semantic interpretation, or automatic recursive retry was observed.

## Scope-change observations

None. The deficiencies are implementation-repairable evidence/behavior gaps
within the frozen ticket. No ticket change, new provider/runtime/deployment
target, architecture or product decision, unresolved policy, or predecessor
reopening is required.

## Decision

`CHANGES_REQUIRED`. `CK-001.a` and `CK-001.b` are frozen as the single
consolidated closure target. Keep `BSS-V2-006-04-03` at `awaiting_review` and
return control to the bounded remediation/human-planning workflow; this CK
artifact does not authorize a CFC cycle by itself.
