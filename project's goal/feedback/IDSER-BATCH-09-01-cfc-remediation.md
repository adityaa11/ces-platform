# CFC remediation checkpoint: IDSER-009-01 / IDSER-BATCH-09-01

- Frozen ticket: `IDSER-009-01-authorized-persisted-lifecycle-read.md`
- Source CK artifact: `IDSER-BATCH-09-01-d6354f7-review.md`
- Reviewed base commit: `d6354f7348ac35591c83e1284901a33e36c5a58d`
- Remediation scope: `CK-001.a`, `CK-001.b`, and `CK-002.a` only.
- Checkpoint state: `awaiting_review`

## Frozen finding closure progress

| Frozen clause | Ticket authority and frozen oracle | Repair and evidence locator | Required command and outcome | Oracle status |
|---|---|---|---|---|
| CK-001.a | RC-009-01-04: terminal failure must fail closed when persisted `X` disagrees with completed member facts. The CK oracle requires the mismatched-X `needs_attention` fixture to be omitted while the valid terminal failure remains a bounded `technical_failure`. | `packages/atlas-db/src/project-repository.ts` requires `completed === completedFacts` for `needs_attention`; `packages/atlas-db/tests/project-repository.integration.test.ts` adds `mismatched_failure`, verifies omission, and asserts the valid failure facts. | `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/db test:project-repository` — passed, 3/3 tests, 0 skipped. | PROVEN — frozen oracle passed. |
| CK-001.b | RC-009-01-03 and RC-009-01-04, consuming IDSER-008 waiting rule: waiting can contain only `pending` or `perception_queued` members. The CK oracle requires active and completed waiting contradictions to be omitted while valid pending/pending waiting remains returned. | `packages/atlas-db/src/project-repository.ts` validates waiting member states; `packages/atlas-db/tests/project-repository.integration.test.ts` adds `waiting_active` and `waiting_completed` omissions and explicitly asserts the valid waiting read. | `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/db test:project-repository` — passed, 3/3 tests, 0 skipped. | PROVEN — frozen oracle passed. |
| CK-002.a | RC-009-01-02: PostgreSQL proof must show truthful typed facts, `N`, `X`, ordered member state, and failure indication for waiting, processing, terminal failure, and ready. | `packages/atlas-db/tests/project-repository.integration.test.ts` explicitly asserts each valid state's expected `N`/`X`, ordered document/member facts, state, and bounded failure indicator; the existing raw-failure redaction assertion remains. | `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/db test:project-repository` — passed, 3/3 tests, 0 skipped. | PROVEN — frozen oracle passed. |

## Direct regressions checked

- `needs_attention` reads retain the valid terminal-failure `technical_failure` result with `N=2`, `X=0`, ordered `needs_attention`/`pending` facts, bounded failure indication, and no raw failure payload.
- Valid waiting reads retain the `pending`/`pending`, `N=2`, `X=0` bundle result.
- Processing and completion-gated ready persisted facts remain asserted by the same PostgreSQL fixture.
- `docker compose run --rm --build --no-deps atlas sh -lc 'corepack pnpm --filter @atlas/core typecheck && corepack pnpm --filter @atlas/db typecheck'` — passed.

## Internal readiness

All authorized frozen clauses are `PROVEN` with their required PostgreSQL harness and direct-regression observations. No unrelated paths were staged.

Internal readiness: READY_FOR_CK
