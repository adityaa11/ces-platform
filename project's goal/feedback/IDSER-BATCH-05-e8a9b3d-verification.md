# CK verification: IDSER-005 / IDSER-BATCH-05

- Ticket / batch: `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-005-production-semantic-worker-and-replay.md` / `IDSER-BATCH-05`
- Reviewed remediation commit: `e8a9b3d73c0f1e442b664e90761f4966fda9771d` (`fix(idser): complete semantic worker evidence matrix`)
- Frozen ticket reference: IDSER-005 remains `awaiting_review`; the checkpoint records consumption of `HMN-IDSER-005-007`.
- HMN authority: `project's goal/feedback/IDSER-005-hmn-007.md`; bounded verification of original `CK-002` only. `CK-001` remains closed and was not reopened.
- Review type: HMN-authorized post-CFC verification.
- Result: `CHANGES_REQUIRED`

## Verification evidence

- Confirmed HEAD is the exact CFC handoff commit named by IDSER-005. The two modified generated fixture files are outside the IDSER-005 diff; existing untracked planning and feedback artifacts were preserved. These changes do not make the review target ambiguous.
- Reviewed the frozen ticket, active HMN-007 authorization, prior CK-002 verification, CFC checkpoint, committed remediation diff, and `apps/agents-bridge/tests/semantic-worker.integration.test.ts` assertions. Review stayed within original CK-002.
- `git diff --check HEAD^ HEAD` passed.
- Attempted `docker compose ps`; Docker could not access `npipe:////./pipe/docker_engine` (`permission denied`) and reported access denied reading its config. Therefore this session could not independently confirm services or execute the Compose matrix. The checkpoint's validation claims are recorded as claims, not as checks run in this review.
- The integration test source contains real pg-boss, PostgreSQL Bridge records, configured HTTP Mistral, and loopback Atlas routes. Several authorized per-case observations listed below are not asserted in the committed harness, so the handoff does not establish the full uniform evidence contract even if its reported validation commands passed.

## Original finding verification

| Original finding / frozen clause | Verification | Ticket authority, unsatisfied evidence, and observable closure |
|---|---|---|
| `CK-002.a` — conflicting idempotency/stage | **Partially proven; clause remains unresolved.** The integration test stages a winner during delivery outage, enqueues a loser using the same key, checks aggregate provider count, unchanged envelope, and loser non-acceptance, then recovers and cleans up the winner. It does not record provider calls separately for A and B or assert per-scenario Atlas acceptance/failure counts, lifecycle, Bridge owner/generation/completion state, and cleanup state as required by HMN-007's uniform evidence contract. | IDSER-005 validation requires replay/idempotency/fencing evidence; HMN-007 Required case 1 and Uniform evidence contract. Add explicit separate A/B provider counts and the required Atlas and Bridge lifecycle/fence/cleanup/redaction observations around both conflict and winner recovery. |
| `CK-002.b` — Atlas context bound | **Unresolved.** The case observes the oversized request and checks zero acceptance, zero failure-route calls, no replay row, and a redacted `last_error`. It does not assert the provider-call count, Bridge effect status/lease owner/generation/completion state, Atlas execution lifecycle or bounded failure result, or the required response/job/thrown-error redaction. In particular, the current assertions require `failed === 0`, while the authorization requires the bounded failure/effect outcome to be recorded. | IDSER-005 validation requires context bounds and typed failure behavior; HMN-007 Required case 2 and Uniform evidence contract. Assert the zero provider calls, actual bounded context-failure/effect outcome and lifecycle, Bridge fence/completion state, and redaction of all required surfaces. |
| `CK-002.c` — result-envelope bound after stage | **Unresolved.** The test observes a replay row count of one and an incomplete Bridge status, but does not wait for or assert that the Atlas handoff was rejected, compare the stored envelope identity before/after rejection, or prove it remains identical for retry. It also omits lease owner and redaction observations. | IDSER-005 requires immutable durable staging before delivery; HMN-007 Required case 3 and Uniform evidence contract. Synchronize on the transport rejection, assert unchanged persisted envelope identity and retained fenced effect/replay state, and include required redaction and retry observations without replacing the envelope. |
| `CK-002.d` — semantic-worker cancellation | **Unresolved.** `worker.stop()` is called while the mock provider request is active, and the test observes no acceptance/replay plus a pending effect and positive lease generation. It does not assert the cancellation-time provider-call count, failure-handler count, Atlas lifecycle, lease owner/completion state, bounded cancellation outcome, or uniform redaction of job/response/thrown-error surfaces. | IDSER-005 requires cancellation behavior and bounded typed failures; HMN-007 Required case 4 and Uniform evidence contract. Record the exact pre-stage cancellation boundary and each provider, Atlas, Bridge, lease, and redaction observation before successor retry; retain the existing fresh-worker proof. |
| `CK-002.e` — orderly in-flight stop and fresh worker | **Partially proven; clause remains unresolved.** The test waits until the result route is in flight with a replay row, stops the worker, and proves a fresh worker yields one provider call, one acceptance, completed status, and cleanup. It does not assert the Atlas lifecycle, fenced lease owner/generation and completion state, replay envelope identity across the stop, failure count, or required payload/error redaction. | IDSER-005 requires restart/stop recovery and fenced completion; HMN-007 Required case 5 and Uniform evidence contract. Assert the per-boundary Atlas and Bridge lease/completion observations and immutable replay identity, plus required redaction, for the active-stop and successor path. |

The CFC checkpoint's broad validation list does not include exact commands, and Compose execution was unavailable during this verification. These limitations do not replace the assertion gaps above; the review result is based on the missing frozen CK-002 evidence, not on an assumption that reported tests failed.

## Scope-change observations

None. All unresolved proof remains within original CK-002 and HMN-007. CK-001 was not reviewed or reopened.

## Decision

IDSER-005 / `IDSER-BATCH-05` remains `CHANGES_REQUIRED` at `e8a9b3d73c0f1e442b664e90761f4966fda9771d` for unresolved original `CK-002` clauses. The committed harness adds the five authorized production-path cases, but does not assert all evidence required by the frozen uniform contract. Compose validation could not be independently executed because Docker access was denied. Return control to human/planning authority; another remediation requires a fresh explicit HMN authorization.
