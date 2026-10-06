# CK verification: IDSER-004 / IDSER-BATCH-04

- Ticket / batch: `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-004-semantic-context-and-result-authority.md` / `IDSER-BATCH-04`
- Reviewed remediation commit: `eaf0c7de4f59da797abbb9e1ef7b73d92dc0e723` (`test(idser): extend semantic authority route evidence`)
- Consumed HMN authorization: `HMN-IDSER-004-004` (`AUTHORIZE_EVIDENCE_REMEDIATION`)
- CK source: `IDSER-BATCH-04-92ba3f5-verification.md` (`CHANGES_REQUIRED`, CK-004 only)
- Review type: bounded verification of the remaining CK-004 evidence, the HMN-named test remediation, and direct regressions.
- Result: `CHANGES_REQUIRED`

## Verification evidence

- Confirmed IDSER-004 remains `awaiting_review`; the cycle-4 ticket checkpoint and CFC record identify `HMN-IDSER-004-004` as consumed. `HEAD` is the bounded test/evidence commit. The tracked worktree is clean; pre-existing untracked review/context artifacts remain outside the target.
- Inspected the active HMN authorization, IDSER-004 cycle-4 checkpoint, cycle-4 CFC record, prior CK verification, and the `92ba3f5..eaf0c7d` test/checkpoint diff.
- New executable assertions cover wrong skill version, an expired capability on the persisted execution, oversized job object rejection, a redacted bounded route error, and concurrent identical result deliveries with one acceptance effect. The test's conflicting replay assertion remains sequential; the concurrent case uses identical envelopes.
- The HMN-required evidence remains incomplete:
  - No cancelled-execution rejection case.
  - No exact-at-limit and one-byte-over request and serialized-response byte-bound tests through the real streamed HTTP path; the new oversized-job case is a single over-limit object passed to the route factory.
  - No handler/enqueue failure test through the PostgreSQL-backed authority proving no success acknowledgement, no completed lifecycle, and no partial accepted state.
  - No duplicate-failure-notification test or both orderings of completion-versus-failure races. The existing post-completion failure rejection covers only one side.
  - Concurrent identical completion is tested, but there is no concurrent conflicting-completion case.
- Compose validation against the reviewed source passed: `docker compose up -d --build postgres atlas`; `docker compose exec -T atlas corepack pnpm --filter @atlas/db migrate` (already up to date); `docker compose exec -T atlas corepack pnpm --filter @atlas/db test:semantic-authority` (1 passed, 0 skipped); `docker compose exec -T atlas corepack pnpm --filter @atlas/core test` (18 assertions passed); `docker compose exec -T atlas corepack pnpm --filter @atlas/core typecheck`; `docker compose exec -T atlas corepack pnpm --filter @atlas/db typecheck`; `docker compose exec -T atlas corepack pnpm --filter @atlas/app build`; and `git diff --check 92ba3f5..HEAD` all passed.
- The remediation diff changes only integration-test evidence and checkpoint documentation. No direct regression to the previously verified authority behavior was identified.

## Original finding status

| ID | Status | Verification |
|---|---|---|
| CK-004 | OPEN | The new PostgreSQL-backed route suite passes and closes several named cases, but cancelled execution, exact byte boundaries on streamed request/response handling, handler/enqueue atomic failure, duplicate failure and both race orderings, and concurrent conflicting delivery remain unproved. |

## Direct remediation regressions

No direct regression was identified in the bounded evidence diff. The Compose DB suite, Core tests and typecheck, DB typecheck, app build, migration check, and diff check passed on the reviewed checkpoint.

## Decision

CK-004 remains unresolved, so record `CHANGES_REQUIRED` for IDSER-004 / `IDSER-BATCH-04` at `eaf0c7de4f59da797abbb9e1ef7b73d92dc0e723`. Keep IDSER-004 at `awaiting_review` and return control to human/planning authority. This consumes `HMN-IDSER-004-004`; do not start another CFC cycle without a later explicit HMN authorization.
