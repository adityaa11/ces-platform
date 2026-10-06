# CK verification: IDSER-004 / IDSER-BATCH-04

- Ticket / batch: `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-004-semantic-context-and-result-authority.md` / `IDSER-BATCH-04`
- Reviewed remediation commit: `98acb502a0343fe457ba70a629aa917a2c142b30` (`fix(idser): bind reconciliation selection authority`)
- Consumed HMN authorization: `HMN-IDSER-004-002` (`AUTHORIZE_NEXT_CFC`)
- CK source: `IDSER-BATCH-04-04149db-verification.md` (`CHANGES_REQUIRED`, CK-002 through CK-004)
- Review type: bounded verification of CK-002 through CK-004, the HMN-named remediation, required evidence, and direct regressions.
- Result: `CHANGES_REQUIRED`

## Verification evidence

- Confirmed IDSER-004 remains `awaiting_review`; the cycle-2 checkpoint names `HMN-IDSER-004-002`, and the CFC record identifies that authorization as consumed. `HEAD` is the single remediation commit. The tracked worktree is clean; pre-existing untracked review/context artifacts are outside the target.
- Inspected the active HMN authorization, IDSER-004 cycle-2 checkpoint, cycle-2 CFC record, prior CK verification, and the bounded `04149db..98acb50` remediation diff.
- CK-002 implementation now injects a `SemanticReconciliationSelectionPort`, fails closed when it is absent, parses and scope-checks the returned reconciliation context, then persists its fingerprinted snapshot. A later redemption first checks for that snapshot and returns it without invoking the selector. The PostgreSQL test redeems twice and asserts equal contexts, but the selector returns the same fixed context on every call; the test does not assert selector call count or change candidate availability between redemptions. It therefore does not demonstrate the HMN-required no-broadening case.
- CK-003 adds a PostgreSQL case with two perception execution IDs for the same document and source hash. It changes the normalized cache payload to identify the other perception execution, asserts redemption rejects the mismatch, restores the authorized identity, and asserts redemption succeeds. This directly covers the named cache identity finding.
- CK-004's registered PostgreSQL suite now exercises capability rejection, same-execution context retry, cache identity, identical delivery replay, conflicting provider provenance, failure notification after completion, and Bridge SQL denial. It still does not provide the HMN-required real route/DB matrix: wrong scope and skill/version, expired/cancelled execution, streamed request/response bounds, concurrent completion claims, handler/enqueue failure with no partial accepted state, duplicate/failure races, or safe error output are not covered. The existing Core route test remains a fake authority test.
- The recursive fingerprint implementation and direct `@atlas/contracts` dependency were not changed in this remediation diff; no direct regression to CK-001 or CK-005 was identified.
- `git diff --check 04149dbba2585bd62364f3c4be5baaefebc04738..HEAD` passed.
- Retried validation with the current `98acb50` source. `docker compose build atlas` passed, and Postgres and Atlas reported healthy. `docker compose exec -T atlas corepack pnpm --filter @atlas/db test:semantic-authority` passed 1/1 with 0 skipped; `docker compose exec -T atlas corepack pnpm --filter @atlas/core test` passed all 18 assertions across its suites; `docker compose exec -T atlas corepack pnpm --filter @atlas/core typecheck` and `docker compose exec -T atlas corepack pnpm --filter @atlas/db typecheck` passed; `docker compose exec -T atlas corepack pnpm --filter @atlas/app build` completed successfully; and `docker compose exec -T atlas corepack pnpm --filter @atlas/db migrate` reported that migrations were already up to date. `git diff --check 04149db..HEAD` passed. These successful reruns supersede the earlier inability to access Docker; the coverage gaps described here remain because the passing suite does not implement those assertions.

## Original finding status

| ID | Status | Verification |
|---|---|---|
| CK-002 | OPEN | The injected selector and persisted snapshot are implemented, but the required executable no-broadening proof is missing: the test uses a fixed selector result and does not show that later candidate availability cannot alter a replay. |
| CK-003 | RESOLVED | The PostgreSQL test rejects a same-document, same-source-hash cache payload bound to a different perception execution, then accepts the restored authorized binding. |
| CK-004 | OPEN | The new DB suite covers only a subset of the required cases. The real route/DB scope, lifecycle, bounds, concurrency, handler-failure/atomicity, failure-race, and safe-output matrix remains incomplete. |

## Direct remediation regressions

No direct regression was identified in the bounded implementation diff. Compose verification passed on the reviewed source; its coverage remains limited as described under CK-002 and CK-004.

## Decision

CK-002 and CK-004 remain unresolved, so record `CHANGES_REQUIRED` for IDSER-004 / `IDSER-BATCH-04` at remediation commit `98acb502a0343fe457ba70a629aa917a2c142b30`. Keep IDSER-004 at `awaiting_review` and return control to human/planning authority. This consumes `HMN-IDSER-004-002`; do not start another CFC cycle without a later explicit HMN authorization.
