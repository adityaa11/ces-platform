# IDSER-006 CFC remediation progress

- Ticket / batch: IDSER-006 / IDSER-BATCH-06
- Frozen CK artifact: `project's goal/feedback/IDSER-BATCH-06-ee7124d-review.md`
- Review target: `ee7124d0dcf7d38c3947c66c10d9fab6dba3fd80`
- CFC cycle: first bounded remediation pass

## Working closure view

| Frozen clause | Ticket-bound remediation scope | Status | Planned evidence |
|---|---|---|---|
| CK-001.a | PostgreSQL acceptance evidence for every named invalid extraction case and no-partial-state observation. | PROVEN | `extraction-acceptance.integration.test.ts`: invented block/table/visual IDs, nonexistent page, wrong locator type, excerpt mismatch, incomplete inventory, duplicate candidate/source IDs, and cross-document execution scope; every rejection observes zero result rows, queued execution, and no additional continuation. |
| CK-001.b | Concurrent identical delivery and changed-result conflict through the production materializer. | PROVEN | Two independent Atlas SQL connections deliver the same envelope concurrently and yield one result/two maps; a changed normalized meaning is rejected as a completion conflict. |
| CK-001.c | Stored provenance/result/mapping inspection and retained-result reindex identity check. | PROVEN | Test inspects source SHA, provider provenance, full result, and identity map; removes/rebuilds index and map from retained result and confirms canonical semantic IDs remain stable. |
| CK-001.d | Shared-hash, multi-execution/project source-binding proof. | PROVEN | A second project with the same source SHA and distinct execution/document/capability materializes successfully; a cache deliberately bound to another document/execution is rejected with zero rows and no continuation. |
| CK-001.e | More-than-cap scoped read with deterministic ordering. | PROVEN | 101 in-scope candidate/index rows queried with limit 999 return exactly 100 semantic-ID-sorted rows; wrong-project lookup is empty. |
| CK-001.f | Actual pg-boss transactional enqueue, rollback, replay and durable-row observations. | PROVEN | Real pg-boss producer persists the perception-to-extraction job once; a post-reconciliation-enqueue trigger rolls back both Atlas rows and durable job, then replay persists exactly one reconciliation job. |

Already proven rows and unrelated workspace changes are preserved. This progress view does not alter the frozen CK closure oracles.

## CFC checkpoint

- Remediation commit: the bounded CFC remediation commit containing this checkpoint.
- Container evidence:
  - `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/db test:extraction-acceptance` — 2/2 passed.
  - `docker compose exec -T atlas corepack pnpm --filter @atlas/db test:semantic-authority` — 1/1 passed.
  - `docker compose exec -T atlas corepack pnpm --filter @atlas/agents-bridge exec jiti tests/worker.integration.test.ts` — 2/2 passed.
  - `corepack pnpm --filter @atlas/db typecheck` and `corepack pnpm --filter @atlas/agents-bridge typecheck` — passed.
- Non-blocking validation note: `test:perception-authority` fails in the already-running Atlas container at its pre-existing Bridge-denial assertion (`Missing expected rejection`); CFC does not alter `perception-authority.ts`, so this was not remediated outside the frozen CK clauses.

READY_FOR_CK: CK-001.a through CK-001.f have bounded implementation and execution evidence. Re-run CK against the remediation commit; this CFC checkpoint does not claim PASS.
