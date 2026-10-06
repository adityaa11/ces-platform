# CK verification: IDSER-004 / IDSER-BATCH-04

- Ticket / batch: `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-004-semantic-context-and-result-authority.md` / `IDSER-BATCH-04`
- Reviewed remediation commit: `301c71eb18b387026931fb695dfe391096dad235` (`test(idser): prove semantic failure atomicity`)
- Consumed HMN authorization: `HMN-IDSER-004-005` (`AUTHORIZE_EVIDENCE_REMEDIATION`)
- CK source: `IDSER-BATCH-04-eaf0c7d-verification.md` (`CHANGES_REQUIRED`, CK-004 only)
- Review type: bounded verification of the remaining CK-004 evidence, the HMN-named test changes, and direct regressions.
- Result: `CHANGES_REQUIRED`

## Verification evidence

- Confirmed IDSER-004 remains `awaiting_review`; the cycle-5 checkpoint and CFC record identify `HMN-IDSER-004-005` as consumed. `HEAD` is the bounded test/evidence commit. The tracked worktree is clean; pre-existing untracked review/context artifacts remain outside the target.
- Inspected the active HMN authorization, IDSER-004 cycle-5 checkpoint, cycle-5 CFC record, prior CK verification, and the `eaf0c7d..301c71e` test/checkpoint diff.
- The PostgreSQL-backed route test now injects an acceptance handler that throws. It asserts a 409 response and that the reconciliation execution remains `running`; it then sends the same failure twice, checks the lifecycle is `failed`, and verifies a subsequent completion request is rejected. This proves the named sequential failure-before-completion behavior and duplicate failure call does not change the terminal lifecycle.
- The cycle-4 evidence continues to cover expired capability, wrong skill version, redacted errors, and concurrent identical result delivery with a single handler effect.
- The HMN-required CK-004 matrix remains incomplete:
  - No cancelled-execution rejection case.
  - No exact-at-limit and one-byte-over request or serialized-response checks through the streamed HTTP path; the existing oversized object assertion tests only one over-limit input case.
  - No partial accepted-state assertion around handler/enqueue failure. The injected handler throws without writing any accepted rows, and the test checks only the response and execution lifecycle.
  - Completion-before-failure and failure-before-completion are exercised sequentially; no concurrent interleaving test verifies both race outcomes.
  - No concurrent conflicting-completion test; the concurrent claim case uses identical envelopes.
- Compose validation against the reviewed source passed: `docker compose up -d --build postgres atlas`; `docker compose exec -T atlas corepack pnpm --filter @atlas/db migrate` (already up to date); `docker compose exec -T atlas corepack pnpm --filter @atlas/db test:semantic-authority` (1 passed, 0 skipped); `docker compose exec -T atlas corepack pnpm --filter @atlas/core test` (18 assertions passed); `docker compose exec -T atlas corepack pnpm --filter @atlas/core typecheck`; `docker compose exec -T atlas corepack pnpm --filter @atlas/db typecheck`; `docker compose exec -T atlas corepack pnpm --filter @atlas/app build`; and `git diff --check eaf0c7d..HEAD` all passed.
- The bounded diff changes only test evidence and checkpoint documentation. No direct regression to previously reviewed production authority behavior was identified.

## Original finding status

| ID | Status | Verification |
|---|---|---|
| CK-004 | OPEN | Handler rejection and terminal lifecycle behavior are now tested, but canceled execution, streamed request/response boundaries, no-partial-state on handler failure, concurrent completion/failure races, and concurrent conflicting delivery remain unproved. |

## Direct remediation regressions

No direct regression was identified in the test/evidence diff. The Compose DB suite, Core tests and typecheck, DB typecheck, app build, migration check, and diff check passed on the reviewed checkpoint.

## Decision

CK-004 remains unresolved, so record `CHANGES_REQUIRED` for IDSER-004 / `IDSER-BATCH-04` at `301c71eb18b387026931fb695dfe391096dad235`. Keep IDSER-004 at `awaiting_review` and return control to human/planning authority. This consumes `HMN-IDSER-004-005`; do not start another CFC cycle without a later explicit HMN authorization.
