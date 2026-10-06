# CK verification: IDSER-005 / IDSER-BATCH-05

- Ticket / batch: `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-005-production-semantic-worker-and-replay.md` / `IDSER-BATCH-05`
- Reviewed remediation commit: `72c06f2fc706e12779971ed15379d4ae5b96cf0a` (`fix(idser): retain staged semantic delivery retries`)
- Frozen ticket reference: IDSER-005 remains `awaiting_review`; this commit consumes `HMN-IDSER-005-005` and CK is limited to original finding `CK-002`.
- Review type: HMN-authorized bounded verification of original `CK-002` only.
- Result: `CHANGES_REQUIRED`

## Verification evidence

- Confirmed `HEAD` is `72c06f2fc706e12779971ed15379d4ae5b96cf0a`, the ticket's latest CFC handoff commit. No tracked worktree edits make the target ambiguous; pre-existing untracked feedback artifacts were preserved.
- Read the frozen IDSER-005 acceptance/validation criteria, active `IDSER-005-hmn-005.md`, the current CFC checkpoint, prior `IDSER-BATCH-05-56cbb80-verification.md`, and the current commit diff.
- Rebuilt and started `postgres`, `atlas`, `agents-bridge`, and `agents-bridge-worker` with `docker compose up -d --build ...`; all four reported healthy in `docker compose ps`. `@atlas/db migration:check` passed.
- Bridge `typecheck` passed. `test:semantic-integration` passed 1/1. `test:semantic` passed its four worker tests and one semantic-client integration test. The full registered Bridge suite passed all constituent tests, including the database-backed semantic worker, worker, and perception integration suites.
- Atlas Core's complete test script passed, including the semantic internal route and byte-bound tests. Atlas DB `test:semantic-authority` passed 1/1, contracts tests passed (11 cases), and skills tests passed 1/1. `git diff --check HEAD^ HEAD` passed.
- The first DB authority attempt via a one-off Compose container failed because that test calls Atlas at `127.0.0.1:3001`, which was not reachable from the one-off container. Re-running the same command inside the healthy Atlas service, where the expected localhost route is available, passed. This was a test invocation topology issue, not a test failure against the implementation.
- The current committed integration test is registered as `test:semantic-integration` and in the Bridge `test` script. Inspection of `apps/agents-bridge/tests/semantic-worker.integration.test.ts` confirms real pg-boss, Bridge rows, configured HTTP Mistral, and loopback Atlas routes for its implemented cases.
- The current integration test covers acknowledgement loss/completion and cleanup faults, handler unavailability with successor replay, result outage, result timeout, and duplicate queue delivery. It does not contain distinct process-restart scenarios or the full authorized failure/configuration matrix. The CFC checkpoint's reference to generic provider/worker tests does not supply the production semantic worker + Atlas route + Bridge replay evidence required by HMN-005.

## Original finding verification

| Original finding | Verification | Evidence and required state |
|---|---|---|
| CK-002: required production integration and validation matrix | **Unresolved.** | The committed integration fixture exercises useful post-stage retry cases, but lacks explicit restart-after-staging and restart-after-Atlas-acceptance-before-Bridge-completion scenarios, a conflicting idempotency/stage case, and the authorized actual-worker/HTTP-path checks for missing and rejected credentials, malformed provider JSON, schema-invalid semantic output, request/context/result bounds, provider timeout, cancellation, and orderly worker stop. These are explicitly required by the ticket validation and `HMN-IDSER-005-005`. The generic Bridge tests cited by the CFC checkpoint are not substitutes for those semantic-worker/Atlas/replay observations. Required repair: complete and assert the remaining bounded production-path scenarios under the authorized integration harness, with provider call counts, Atlas lifecycle/acceptance/failure counts, Bridge effect lease/status and replay-row outcomes. The listed Compose-backed tests passed, but passing the existing partial matrix does not close the finding. |
| CK-001: fenced staging and stale-winner handling | **Outside this verification scope.** | The active HMN handoff and prior checkpoint state that CK-001 was resolved. This verification does not reopen it. |

## Scope-change observations

None. Completing the remaining CK-002 evidence remains within the frozen IDSER-005 validation scope and the active HMN authorization.

## Decision

IDSER-005 / `IDSER-BATCH-05` remains `CHANGES_REQUIRED` at `72c06f2fc706e12779971ed15379d4ae5b96cf0a` for unresolved original finding `CK-002`. The post-stage delivery retry correction and covered integration cases are within scope, but the authorized production-path matrix is incomplete. Return control to human/planning authority; any further remediation requires a fresh explicit `hmn` invocation.
