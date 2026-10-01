# GO checkpoint: IDSER-010-03-01 / IDSER-BATCH-10-03-01

- **Ticket:** `IDSER-010-03-01-creation-kickoff-rollback.md`
- **Authorized predecessor:** IDSER-010-02 `PASS` at `52545a9`.
- **State:** `awaiting_review`

## Bounded changes

- Strengthened the real authenticated project-create integration failure seam to
  snapshot all transaction-owned graph rows and the perception queue. Storage
  and injected database failures now prove that no project, membership,
  workspace, document, bundle/member, D1 execution, source grant, or job is
  exposed.
- Strengthened the focused PostgreSQL kickoff integration with a byte-for-byte
  snapshot of a successful control graph and its pg-boss job before a real
  post-enqueue trigger rejects a second creation transaction.
- Corrected the paused-worker creation observation to its durable pre-redemption
  state: bundle `waiting`, D1 member `perception_queued`, and one durable job.
  No production creation, queue, worker, DocumentStore, schema, lifecycle, or
  provider behavior changed.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence / command | Status |
|---|---|---|---|
| RC-010-03-01-01 | Successful authenticated creation commits the owner/project, workspaces, ordered bundle/member, D1 execution/source grant, and one durable pg-boss job together; no post-commit scheduler. | `apps/atlas/tests/project-create.integration.test.mjs` uses the real `/api/projects` boundary and independently queries Atlas and `pgboss.job` while the worker is paused. `docker compose exec -T atlas node --test apps/atlas/tests/project-create.integration.test.mjs` passed (1/1). | PROVEN |
| RC-010-03-01-02 | A controlled DocumentStore failure through the real create boundary exposes no transaction-owned graph or job. | The same integration test, with `ATLAS_PROJECT_CREATION_TEST_FAILURE=storage` on the Compose `atlas` service, returned the bounded 500 response and asserted zero scoped project/member/workspace/document/bundle/member/execution/grant counts plus an unchanged perception-job count. Passed (1/1). | PROVEN |
| RC-010-03-01-03 | Transaction or initial enqueue failure rolls back all target state/job and leaves an unrelated control unchanged. | `packages/atlas-db/tests/project-repository.integration.test.ts` uses the real transactional pg-boss producer, injects a post-enqueue trigger failure, proves zero target rows/job, and compares the control graph/job snapshot before and after rollback. `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/db test:project-repository` passed (3/3). The authenticated database-failure variant also passed (1/1). | PROVEN |

## Validation

- `docker compose up -d postgres` and `docker compose ps postgres` — PostgreSQL healthy.
- `docker compose stop agents-bridge-worker` — worker paused so D1's durable job could be observed before redemption.
- `docker compose exec -T atlas node --test apps/atlas/tests/project-create.integration.test.mjs` — passed (1/1), authenticated successful-create and graph/job observation.
- Compose `atlas` recreated with `ATLAS_PROJECT_CREATION_TEST_FAILURE=storage`; the same test command — passed (1/1).
- Compose `atlas` recreated with `ATLAS_PROJECT_CREATION_TEST_FAILURE=database`; the same test command — passed (1/1).
- `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/db test:project-repository` — passed (3/3).
- `node --check apps/atlas/tests/project-create.integration.test.mjs` — passed.
- `git diff --check` — passed; Git emitted line-ending notices for unrelated working-tree files.

Internal readiness: READY_FOR_CK

GO makes no PASS determination. CK owns the bounded atomicity review.
