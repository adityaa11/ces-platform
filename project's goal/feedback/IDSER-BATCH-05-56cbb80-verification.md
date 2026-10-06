# CK verification: IDSER-005 / IDSER-BATCH-05

- Ticket / batch: `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-005-production-semantic-worker-and-replay.md` / `IDSER-BATCH-05`
- Reviewed remediation commit: `56cbb8063f9e771ddef502b263ab03820ad1e20c` (`test(idser): repair semantic fixture import`)
- Frozen ticket reference: IDSER-005 remains `awaiting_review`. This commit consumes `HMN-IDSER-005-004` to repair the direct integration-fixture regression found at the preceding verification.
- Review type: HMN-authorized post-CFC verification of original CK-001 and CK-002 only.
- Result: `CHANGES_REQUIRED`

## Verification evidence

- Reviewed active `IDSER-005-hmn-004.md`, the one-file fixture repair, and `git diff --check 56cbb80^..56cbb80`, which passed.
- The repair is scoped as authorized: it replaces the unavailable/private DB helper with a local SHA-256 calculation for the literal fixture capability; it does not change production code or package exports.
- Rebuilt the Compose Atlas image because earlier `docker compose run` executions used a stale pre-fix image. With PostgreSQL, Atlas, Bridge, and worker dependencies active, Bridge typecheck passed and `test:semantic-integration` passed 1/1. It reached actual pg-boss, Bridge replay/lease, loopback Atlas route, and loopback Mistral scenarios.
- The registered full Bridge suite was also run on the rebuilt image. Its reported service, provider, perception, semantic unit/client/integration, and worker-integration portions all passed through the semantic integration test and worker integration test.

## Original findings verification

| Original finding | Verification | Evidence and required state |
|---|---|---|
| CK-001: actual worker/database stale-claim proof | **Resolved.** | The repaired production-path integration executes the real worker, `bridge.background_effects`, `semantic_result_delivery`, configured HTTP Mistral, and actual semantic internal routes. It demonstrates acknowledgement-loss recovery with one provider call and one Atlas logical effect, then handler-unavailable replay followed by an expired successor redelivering the stored envelope without another provider call and completing/cleaning it. This verifies the original stale-winner/replay concern on the actual database path. |
| CK-002: required production integration and validation matrix | **Unresolved.** | The new test is valuable but contains only its combined acknowledgement-loss/cleanup, unavailable-handler, and successor cases. It does not implement the frozen ticket's required explicit cases for delivery outage, restart after staging, restart after Atlas acceptance before Bridge completion, duplicate jobs, conflicting stage, missing/invalid credentials, malformed provider JSON, schema-invalid result, request/context/result bounds, provider and Atlas timeout, cancellation, and orderly worker stop. Existing generic/provider tests do not substitute for the required semantic worker/Atlas/replay-path evidence for this original finding. |

## Scope-change observations

None. Completing CK-002 remains within the frozen IDSER-005 validation scope.

## Decision

IDSER-005 / `IDSER-BATCH-05` remains `CHANGES_REQUIRED` at `56cbb8063f9e771ddef502b263ab03820ad1e20c`. The direct test-fixture regression is fixed and CK-001 is resolved, but CK-002's explicitly required production-path scenario matrix is incomplete. Return control to human/planning authority; a further remediation requires a fresh explicit `hmn` authorization and is limited to unresolved CK-002 evidence.
