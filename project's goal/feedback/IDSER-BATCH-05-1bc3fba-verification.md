# CK verification: IDSER-005 / IDSER-BATCH-05

- Ticket / batch: `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-005-production-semantic-worker-and-replay.md` / `IDSER-BATCH-05`
- Reviewed remediation commit: `1bc3fba695771954576313a5f782b60d15541a26` (`test(idser): extend semantic worker matrix`)
- Frozen ticket reference: IDSER-005 remains `awaiting_review`; this commit consumes `HMN-IDSER-005-006`. CK is limited to original finding `CK-002`; `CK-001` remains resolved and is not reopened.
- Review type: HMN-authorized bounded verification of original `CK-002` only.
- Result: `CHANGES_REQUIRED`

## Verification evidence

- Confirmed `HEAD` is `1bc3fba695771954576313a5f782b60d15541a26`, the HMN-006 CFC handoff commit. Pre-existing untracked HMN/CK artifacts were preserved.
- Read `IDSER-005-hmn-006.md`, the ticket's HMN-006 checkpoint, the authorized `CK-002` scenarios, and the commit's test/checkpoint diff.
- Rebuilt and started Compose `postgres`, `atlas`, `agents-bridge`, and `agents-bridge-worker`; all reported healthy. `@atlas/db migration:check` passed.
- Bridge typecheck passed. `test:semantic-integration` passed 1/1 against Compose PostgreSQL. `test:semantic` passed four worker tests and one client integration test. The full Bridge test script passed, including semantic worker, worker, and database-backed integration suites.
- Atlas Core's complete test script passed, including semantic route and byte-bound cases. Atlas DB `test:semantic-authority` passed 1/1. Contracts passed 11 cases; skills passed 1/1. `git diff --check HEAD^ HEAD` passed.
- Deterministic tests used loopback provider/Atlas hosts and synthetic credentials; no live Mistral credential was used.

## Original finding verification

| Original finding | Verification | Evidence and required state |
|---|---|---|
| CK-002: required production integration and validation matrix | **Unresolved.** | The updated integration test adds worker replacement at two replay boundaries and actual worker-path cases for missing/rejected credentials, malformed provider JSON, schema-invalid output, provider timeout, and provider request/response bounds. However, the authorized matrix still has no conflicting idempotency/stage case, Atlas context-bound case, Atlas result-envelope-bound case, semantic-worker cancellation case, or orderly stop during an in-flight semantic execution followed by a fresh worker. The `worker.stop()` calls at `semantic-worker.integration.test.ts:184,211` occur between a durable-replay observation and retry completion; they do not prove the separately required in-flight shutdown behavior. New failure cases assert lifecycle, effect status, failure count, and replay absence, but do not consistently assert the required lease owner/generation, completion state, response/job/error redaction, and (for bounds) provider call counts. Atlas/Core bounds tests exercise their own route/authority seam, not the semantic worker + Bridge replay handoff required by HMN-006. Required repair: complete those production-path cases and assertions under the existing Compose harness, then update the scenario evidence table. |

## Scope-change observations

None. The remaining cases and assertions are within the frozen IDSER-005 validation scope and HMN-006 authorization.

## Decision

IDSER-005 / `IDSER-BATCH-05` remains `CHANGES_REQUIRED` at `1bc3fba695771954576313a5f782b60d15541a26` for unresolved original finding `CK-002`. The added cases and required regression suites pass, but the explicitly authorized production-path matrix and per-scenario observations are not complete. Return control to human/planning authority; any further remediation requires a fresh explicit `hmn` invocation.
