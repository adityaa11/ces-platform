# CFC validation isolation: IDSER-012-01-01 / IDSER-BATCH-12-01-01

- **Authorized by:** `HMN-IDSER-012-01-01-003` (`CONTINUE_CURRENT_CFC`)
- **Frozen clause:** `CK-001.a` only
- **State:** `BLOCKED_BY_PREEXISTING_WINDOWS_SHUTDOWN_FAILURE`

## Base-versus-remediation evidence

Both runs used fresh isolated PostgreSQL databases, the same Windows host and
Node/Jiti test runner, and the same frozen reconciliation command:

```text
node --import ./packages/atlas-db/node_modules/jiti/lib/jiti-register.mjs --test --test-force-exit --test-reporter spec packages/atlas-db/tests/reconciliation-acceptance.integration.test.ts
```

| Target | Result | Shutdown observation |
| --- | --- | --- |
| Reviewed base `1b9bc7332c0ecf757113e76aa053b7264cb9f103` | FAIL | Existing `stopComposeReconciliationWorker` assertion reports `null !== 0` after 10.3s. |
| Current `CK-001.a` remediation worktree | FAIL | The same existing assertion reports `null !== 0` after the new no-permit assertions execute successfully. |

The base reproduction establishes that this Windows child-worker graceful-shutdown
failure predates the authorized remediation. It is not a direct regression in
the staged perception admission path.

## Preserved CK-001.a evidence

`packages/atlas-db/tests/reconciliation-acceptance.integration.test.ts` proves
that, while two non-terminal perception permits are present, reconciliation
acceptance leaves the successor `pending` with zero execution records. After
both permits become terminal, an explicit shared staged-gate refill admits the
pending successor. The assertion sequence completed before the unrelated
shutdown failure.

The following required direct evidence remains passing:

```text
corepack pnpm --filter @atlas/db typecheck
node --import ./packages/atlas-db/node_modules/jiti/lib/jiti-register.mjs --test --test-force-exit --test-reporter spec packages/atlas-db/tests/staged-perception-admission.integration.test.ts
```

The isolated staged-admission suite passed 2/2.

## CFC readiness

`CFC_NOT_READY_FOR_CK`: no remediation commit or CK handoff is created by this
record. The frozen reconciliation command is blocked by the pre-existing
Windows shutdown observation. No worker shutdown, process-exit, or unrelated
reconciliation lifecycle behavior was changed.
