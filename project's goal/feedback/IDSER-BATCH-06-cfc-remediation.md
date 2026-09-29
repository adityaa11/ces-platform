# IDSER-006 CFC remediation progress

- Ticket / batch: IDSER-006 / IDSER-BATCH-06
- Frozen CK artifact: `project's goal/feedback/IDSER-BATCH-06-ee7124d-review.md`
- Review target: `ee7124d0dcf7d38c3947c66c10d9fab6dba3fd80`
- CFC cycle: second bounded remediation pass, authorized by `HMN-IDSER-006-001`

## Working closure view

| Frozen clause | Ticket-bound remediation scope | Status | Planned evidence |
|---|---|---|---|
| CK-001.a | PostgreSQL acceptance evidence for every named invalid extraction case and no-partial-state observation. | PROVEN | `extraction-acceptance.integration.test.ts:102-123` now includes a dangling local-candidate destination alongside the already covered invented page/block/table/visual IDs, wrong locator type, excerpt mismatch, incomplete inventory, and duplicate identities. Every rejection observes zero result rows, a queued execution, and no additional continuation. |
| CK-001.b | Concurrent identical delivery and changed-result conflict through the production materializer. | PROVEN | `extraction-acceptance.integration.test.ts:124-143` uses two Atlas SQL connections for concurrent identical delivery, then observes exactly one result, two candidate/index/map rows, three evidence rows, stable candidate/index/map identities, and one continuation. A changed normalized meaning rejects and preserves the result fingerprint/JSON and all materialized identities/counts. |
| CK-001.c | Stored provenance/result/mapping inspection and retained-result reindex identity check. | PROVEN | Test inspects source SHA, provider provenance, full result, and identity map; removes/rebuilds index and map from retained result and confirms canonical semantic IDs remain stable. |
| CK-001.d | Shared-hash, multi-execution/project source-binding proof. | PROVEN | A second project with the same source SHA and distinct execution/document/capability materializes successfully; a cache deliberately bound to another document/execution is rejected with zero rows and no continuation. |
| CK-001.e | More-than-cap scoped read with deterministic ordering. | PROVEN | 101 in-scope candidate/index rows queried with limit 999 return exactly 100 semantic-ID-sorted rows; wrong-project lookup is empty. |
| CK-001.f | Actual pg-boss transactional enqueue, rollback, replay and durable-row observations. | PROVEN | Real pg-boss producer persists the perception-to-extraction job once; a post-reconciliation-enqueue trigger rolls back both Atlas rows and durable job, then replay persists exactly one reconciliation job. |

Already proven rows and unrelated workspace changes are preserved. This progress view does not alter the frozen CK closure oracles.

## CFC checkpoint

- Remediation commit: `test(idser): complete extraction CFC evidence` (this bounded CFC checkpoint).
- HMN authorization consumed: `HMN-IDSER-006-001`.
- Container evidence:
  - `docker compose run --rm --no-deps atlas corepack pnpm --filter @atlas/db test:extraction-acceptance` — 2/2 passed. This is the frozen PostgreSQL harness for both authorized closure oracles.
  - `git diff --check -- packages/atlas-db/tests/extraction-acceptance.integration.test.ts` — passed.

Internal readiness: READY_FOR_CK. Both authorized frozen closure oracles pass; CK-001.c through CK-001.f remain proven and untouched. This checkpoint is `awaiting_review` by CK and does not claim PASS.
