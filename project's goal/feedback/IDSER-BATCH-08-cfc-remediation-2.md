# CFC remediation: IDSER-008 / IDSER-BATCH-08

- **Ticket:** IDSER-008 bundle completion and failure lifecycle
- **Original frozen CK artifact:** `IDSER-BATCH-08-243f33e-review.md`
- **Latest CK verification:** `IDSER-BATCH-08-fe41a35-verification.md`
- **HMN authorization consumed:** `HMN-IDSER-008-004`
- **Status:** `awaiting_review`

## Authorized-clause closure

| Frozen clause | Status | Evidence and required command | Frozen oracle |
|---|---|---|---|
| `CK-001.a` | PROVEN | Preserved previously proven Compose recovery coverage in `apps/agents-bridge/tests/perception-integration.test.ts`: real pg-boss work retains a pending Bridge effect and non-terminal Atlas execution through replay-load, Atlas source-handoff, and replay-stage outages, then completes after recovery. `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/agents-bridge exec jiti tests/perception-integration.test.ts` passed (1/1). | PASS |
| `CK-001.b` | PROVEN | `reconciliation-acceptance.ts` checks all bundle candidates and resolves each evidence locator exactly against the corresponding normalized document. The acceptance fixture independently rejects wrong extraction scope, wrong evidence document, missing locator, an earlier completed member's missing locator, unauthorized reconciliation reference, active-stage corruption, and preserves transaction rollback, valid atomic acceptance, and replay. The restarted worker now owns per-fixture real pg-boss queues, preventing the always-on Compose worker from executing intentionally incomplete fixture work. `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/db test:reconciliation-acceptance` passed (1/1). | PASS |
| `CK-001.c` | PROVEN | The passing reconciliation acceptance command proves durable queued delivery through a stopped and restarted worker, with one completion and one next-stage enqueue. `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/agents-bridge test:semantic-integration` passed (1/1) for semantic replay/outage, stop/restart, bounded failure, and success/failure race behavior. `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/agents-bridge exec jiti tests/perception-negative.integration.test.ts` passed (1/1) for expired/tampered grants and non-completion negatives. | PASS |

## Root-cause trace and remediation

The original required reconciliation command failed after the fixture's first
accepted reconciliation enqueued synthetic next-document perception work on the
default queue. The always-on Compose `agents-bridge-worker` legitimately
claimed that intentionally incomplete fixture work and transitioned the bundle
to `needs_attention`; the intended restarted reconciliation worker then reached
the acceptance guard with a non-`processing` bundle and reported
`Reconciliation bundle state is unavailable`. The queued reconciliation job
also raced the same always-on worker. This was neither lost reconciliation
state nor an invalid persisted-context lookup.

The test now creates unique real pg-boss perception and reconciliation queues
per fixture, registers the perception queue, and passes both queue names to
the worker process. It retains the actual stop/start process boundary,
transactional enqueue, durable job/effect, and recovery assertions. No retry,
assertion, handler, or production lifecycle behavior was weakened.

## Direct regressions and validation

- `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/contracts typecheck` — passed.
- `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/core test` — passed.
- `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/agents-bridge typecheck` — passed.
- `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/db typecheck` — passed.
- `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/agents-bridge exec jiti tests/atlas-perception-client.test.ts` — passed (4/4).
- `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/agents-bridge exec jiti tests/perception-integration.test.ts` — passed (1/1).
- `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/agents-bridge exec jiti tests/perception-negative.integration.test.ts` — passed (1/1).
- `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/agents-bridge test:semantic-integration` — passed (1/1).
- `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/db test:semantic-authority` — passed (1/1).
- `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/db test:reconciliation-acceptance` — passed (1/1).
- `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/db migration:check` — passed.
- `git diff --check` — passed.

Internal readiness: READY_FOR_CK

This single bounded remediation consumes `HMN-IDSER-008-004`. IDSER-008
remains `awaiting_review`; CK may verify only the original frozen clauses, this
remediation diff, and direct regressions.
