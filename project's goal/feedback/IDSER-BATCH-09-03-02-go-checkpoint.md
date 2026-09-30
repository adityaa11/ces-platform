# GO checkpoint: IDSER-009-03-02 / IDSER-BATCH-09-03-02

- **Ticket:** `IDSER-009-03-02-authenticated-extraction-activation-lifecycle-correction.md`
- **Ticket state:** `awaiting_review`
- **Consumed predecessor:** IDSER-009-03-01 `PASS` at `ed38f6a`, recorded approved at `507a00d`.
- **Implementation commit:** this GO handoff commit.

## Review Contract Closure

| Row | Required proof | Evidence / outcome | Status |
|---|---|---|---|
| RC-009-03-02-01 | Creation commits waiting bundle, queued D1, X=0 and durable job; failed enqueue rolls back. | `project-repository.integration.test.ts` asserts waiting D1 bundle and durable job plus controlled enqueue rollback. Compose DB suite passed 3/3. | PROVEN |
| RC-009-03-02-02 | First valid service-authenticated redemption activates only its exact waiting D1 pair before source release. | `PostgresPerceptionAuthority.redeem()` locks and validates grant/execution/member/bundle scope, then transitions waiting/queued to processing/perceiving in its transaction. Compose perception integration passed 2/2. | PROVEN |
| RC-009-03-02-03 | Invalid credentials/grants/identity and terminal cases do not activate; replay does not regress. | Existing service-route integration exercises credential and grant/identity negatives; authority rejects terminal bundle/member states. Compose perception and authority suites passed. | PROVEN |
| RC-009-03-02-04 | Durable queue alone remains waiting; real authenticated redemption transitions the persisted lifecycle to extracting. | `perception-integration.test.ts` snapshots three real queued bundles as waiting/unstarted/perception_queued before worker redemption, then verifies accepted route/worker progression to processing/extracting. Compose suite passed 2/2. | PROVEN |

## Validation

- `docker compose run --rm --build --no-deps atlas sh -lc 'corepack pnpm --filter @atlas/db test:project-repository && corepack pnpm --filter @atlas/db test:perception-authority'` — passed: 3/3 and 1/1.
- `docker compose run --rm --build --no-deps atlas sh -lc 'cd apps/agents-bridge && corepack pnpm exec jiti tests/perception-integration.test.ts'` — passed, 2/2.
- `docker compose run --rm --build --no-deps atlas sh -lc 'corepack pnpm --filter @atlas/db typecheck'` — passed.
- `git diff --check` — passed.

Internal readiness: READY_FOR_CK
