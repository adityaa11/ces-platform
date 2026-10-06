# CK verification: IDSER-005 / IDSER-BATCH-05

- Ticket / batch: `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-005-production-semantic-worker-and-replay.md` / `IDSER-BATCH-05`
- Reviewed remediation commit: `35784b0` (`fix(idser): recover semantic replay cleanup`)
- Frozen ticket reference: IDSER-005 remains `awaiting_review`. The checkpoint identifies `HMN-IDSER-005-003` as the consumed authorization for remaining CK-001 and CK-002 evidence.
- Review type: HMN-authorized post-CFC verification of original findings CK-001 and CK-002 only.
- Result: `CHANGES_REQUIRED`

## Verification evidence

- Read active `IDSER-005-hmn-003.md`; it authorizes an actual semantic worker/pg-boss/Bridge replay/Atlas HTTP integration suite, not unit substitutes. Reviewed the bounded remediation diff and `git diff --check 35784b0^..35784b0`, which passed.
- Compose PostgreSQL, Atlas, Agents Bridge, and worker were healthy. Bridge typecheck passed.
- `corepack pnpm --filter @atlas/agents-bridge test:semantic-integration` failed before any integration scenario: `apps/agents-bridge/tests/semantic-worker.integration.test.ts:12` imports `canonicalSemanticFingerprint` from `@atlas/db`, but it is not exported by that package, producing `TypeError: ... canonicalSemanticFingerprint is not a function` at test line 128.
- The complete registered Bridge suite also failed at that same semantic integration test after the preceding service, provider, perception, unit semantic, and client tests passed.

## Original findings verification

| Original finding | Verification | Evidence and required state |
|---|---|---|
| CK-001: actual worker/database stale-claim proof | **Unverified.** | The new test is directionally within the authorized production path, but it aborts during fixture setup before it can create semantic executions, acquire a Bridge claim, stage a replay row, or test stale-successor behavior. The required real lease/replay proof has not run. |
| CK-002: registered production integration and required scenario matrix | **Unresolved.** | `semantic-worker.integration.test.ts` is registered and the remediation includes a narrow cleanup correction, but its import failure prevents the suite from demonstrating even its implemented acknowledgement-loss, cleanup, handler-unavailable, and successor scenarios. The broader frozen ticket matrix is consequently also not verified. |

## Scope-change observations

None. Repairing the registered test's unavailable package symbol and completing its already-authorized evidence remain within frozen IDSER-005 scope.

## Decision

IDSER-005 / `IDSER-BATCH-05` remains `CHANGES_REQUIRED` at `35784b0`. The HMN-authorized integration checkpoint does not run. Return control to human/planning authority; another remediation requires a fresh explicit `hmn` authorization and may address only the unresolved original CK-001/CK-002 evidence.
