# CK verification: IDSER-004 / IDSER-BATCH-04

- Ticket / batch: `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-004-semantic-context-and-result-authority.md` / `IDSER-BATCH-04`
- Reviewed commit: `54967573b116cfd94e1b26bd4a28f4cf49a79145` (`fix(idser): close semantic cancellation authority gaps`)
- Frozen ticket reference: `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-004-semantic-context-and-result-authority.md`
- Consumed HMN authorization: `HMN-IDSER-004-009` (`AUTHORIZE_NEXT_CFC`)
- Review type: bounded verification of original CK-004 and HMN-009 remediation, plus direct regressions.
- Result: `CHANGES_REQUIRED`

## Verification evidence

- Confirmed IDSER-004 is `awaiting_review`; `HEAD` is the cycle-6 commit and its parent is the previously reviewed `301c71eb18b387026931fb695dfe391096dad235`. The tracked worktree is clean. Existing untracked planning and feedback files were preserved.
- Read the frozen ticket, HMN-009 authorization, previous CK verification, and cycle-6 CFC record; inspected the complete `301c71e..5496757` diff, focused semantic-authority test, and production migration/authority changes.
- The additive migration allows persisted `cancelled`, the migration runner registers it, and production authority rejects cancelled executions in context redemption, result delivery, and failure notification. The new PostgreSQL route assertions persist `cancelled`, check context/result/failure rejection, and assert the injected delivery handler is not called.
- The provisional-write trigger test checks that a failed completion leaves lifecycle `running` and rolls back the provisional acceptance row. The concurrent conflicting-completion case uses `Promise.allSettled` and asserts one success and one handler effect.
- `git diff --check 301c71e..5496757` passed.
- `docker compose up -d --build postgres atlas` passed; both services started healthy. `docker compose exec -T atlas corepack pnpm --filter @atlas/db migrate` passed and reported the database already up to date; `docker compose exec -T atlas corepack pnpm --filter @atlas/db migration:check` passed.
- `docker compose exec -T atlas corepack pnpm --filter @atlas/db test:semantic-authority` passed (1 passed, 0 failed, 0 skipped), exercising the PostgreSQL route/authority cases in this checkpoint.
- `docker compose exec -T atlas corepack pnpm --filter @atlas/core test` passed (18 tests across the package's registered test files; no failures or skips). Core typecheck, DB typecheck, and app build all passed in Compose.
- `git diff --check 301c71e..5496757` passed. No environment limitation remained after retrying Docker with engine access.

## Original finding status

| ID | Status | Verification |
|---|---|---|
| CK-004 | OPEN | Cancellation persistence/rejection and provisional-write rollback are now evidenced. The named exact-limit/one-byte-over streamed request and serialized-response cases are absent from the changed test. The completion/failure overlap test forces completion to hold the transaction lock before starting failure, so it exercises only completion-wins; failure-wins remains sequential in the pre-existing test. The cancellation route checks only status codes and does not assert the required bounded, redacted error body. The CFC record also gives only a general validation summary rather than per-scenario outcomes/counts and command details. |

## Direct remediation regressions

No direct regression was identified in the bounded production diff. The Compose build, migration application/check, PostgreSQL semantic-authority suite, Core tests/typecheck, DB typecheck, app build, and diff check all passed.

## Decision

CK-004 remains unresolved under the frozen ticket's Validation requirements and HMN-009's explicit authorized scope. In `packages/atlas-db/tests/semantic-authority.integration.test.ts`, the new completion gate at lines 84-88 deliberately starts failure only after completion is inside its acceptance handler and then releases completion; it cannot establish the required overlapping failure-wins outcome. The same changed test contains no exact-limit/one-byte-over streamed request or serialized-response cases, and its cancelled-route assertions at lines 60-63 inspect only status codes. Complete those explicitly named CK-004 scenarios and record their individual commands, outcomes, counts/skips, and environment limits in the checkpoint evidence. Record `CHANGES_REQUIRED` for IDSER-004 / `IDSER-BATCH-04` at `54967573b116cfd94e1b26bd4a28f4cf49a79145`; keep the ticket at `awaiting_review` and return control to human/planning authority. This was bounded post-HMN verification; it does not authorize another CFC cycle.
