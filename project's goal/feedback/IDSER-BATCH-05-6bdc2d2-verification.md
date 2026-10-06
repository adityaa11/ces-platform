# CK verification: IDSER-005 / IDSER-BATCH-05

- Ticket / batch: `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-005-production-semantic-worker-and-replay.md` / `IDSER-BATCH-05`
- Reviewed remediation commit: `6bdc2d285538f758a3fd6d7dbde3e72159558d6e` (`fix(idser): fence semantic replay staging`)
- Frozen ticket reference: IDSER-005 remains `awaiting_review`. Its CFC remediation checkpoint names this commit and identifies `project's goal/feedback/IDSER-BATCH-05-0209921-review.md` as the source review.
- Review type: post-CFC verification of original findings CK-001 and CK-002 only.
- Result: `CHANGES_REQUIRED`

## Verification evidence

- The remediation is a committed descendant of the original review target. The later documentation-only commit `c8cf319` records the remediation checkpoint. Pre-existing untracked feedback artifacts do not alter the verification target.
- Reviewed the CFC diff, the direct worker/replay/migration changes, and only the evidence needed to assess original CK-001 and CK-002. `git diff --check 6bdc2d2^..6bdc2d2` passed.
- In Compose, `corepack pnpm --filter @atlas/agents-bridge typecheck` passed and the focused semantic script passed 3/3. The registered Bridge suite was also started and its reported service, provider, perception, focused semantic, and worker checks passed through the worker-integration portion. These checks do not exercise the real semantic replay SQL/lease path.

## Original findings verification

| Original finding | Verification | Evidence and required state |
|---|---|---|
| CK-001: fenced immutable replay must not let a stale claimant terminally fail the winning execution | **Unresolved.** | `apps/agents-bridge/src/semantic-result-replay.ts:18-19` now rejects a claimant whose lease owner/generation is superseded before attempting to stage or load the winner. `apps/agents-bridge/src/semantic-worker.ts:23-27` still catches that error after context acquisition and calls `client.fail(...)`. Under the consumed Atlas authority, that terminally marks the execution failed, so a later delivery of the winning staged envelope is rejected. The new test at `apps/agents-bridge/tests/semantic-worker.test.ts:31-35` has its fake `stage` directly return the winner; it does not execute the real lease query or demonstrate a superseded claim. The remediation must ensure a stale claimant cannot issue terminal failure, and prove the actual database/worker lease-expiry and winning-stage path redelivers safely. |
| CK-002: required real mocked-HTTP, Bridge-ledger, Atlas-route, restart/fencing, and configuration integration matrix | **Unresolved.** | The CFC checkpoint expressly leaves CK-002 open. The only semantic test file remains an in-memory dispatcher test; there is still no semantic Atlas-client test or Compose semantic worker/DB/Atlas integration suite. The ticket's required real Mistral structured path for both skills, acknowledgement-loss/delivery-outage/restart call counts, duplicate/lease/conflicting-stage ledger evidence, and credential/bound/timeout/cancellation/shutdown cases remain unproven. |

## Scope-change observations

None. The unresolved work remains within the frozen IDSER-005 worker, replay, and validation scope.

## Decision

IDSER-005 / `IDSER-BATCH-05` remains `CHANGES_REQUIRED` at the post-CFC verification checkpoint `6bdc2d285538f758a3fd6d7dbde3e72159558d6e`. The single ordinary CFC opportunity has been consumed. Return control to human/planning authority; do not begin another CFC without a new explicit HMN authorization.
