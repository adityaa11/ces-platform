# IDSER-BATCH-06 CK verification — `7785b6f`

- **Ticket:** IDSER-006
- **Batch:** IDSER-BATCH-06
- **Review type:** Bounded post-CFC verification of original finding CK-001
- **Original CK artifact:** `project's goal/feedback/IDSER-BATCH-06-ee7124d-review.md`
- **CFC checkpoint:** `project's goal/feedback/IDSER-BATCH-06-cfc-remediation.md`
- **Remediation commit reviewed:** `7785b6f19b5cafc78b172aac8946c2a34d66887c` (`test(idser): close extraction acceptance feedback`)
- **Original review target:** `ee7124d0dcf7d38c3947c66c10d9fab6dba3fd80`
- **Result:** `CHANGES_REQUIRED`

This verification is limited to CK-001.a through CK-001.f, the CFC diff in `apps/agents-bridge/src/queue.ts` and `packages/atlas-db/tests/extraction-acceptance.integration.test.ts`, the evidence needed for those clauses, and direct regressions in the affected transactional queue/perception behavior. No new findings were added.

## Validation performed

- `docker compose run --rm --no-deps atlas corepack pnpm --filter @atlas/db test:extraction-acceptance` — passed, 2/2. This exercised the new PostgreSQL rejection cases, concurrent delivery, cache binding, result/map inspection, bounded reads, and real pg-boss rollback/replay.
- `docker compose run --rm --no-deps atlas corepack pnpm --filter @atlas/db test:perception-authority` — passed, 1/1. The CFC checkpoint's reported Bridge-denial failure did not reproduce in this fresh Compose run.
- `docker compose exec -T atlas corepack pnpm --filter @atlas/agents-bridge exec jiti tests/worker.integration.test.ts` — passed, 2/2, including pg-boss atomic enqueue/retry/shutdown behavior.
- `docker compose exec -T atlas corepack pnpm --filter @atlas/agents-bridge typecheck` — passed.
- `git diff --check ee7124d0dcf7d38c3947c66c10d9fab6dba3fd80..7785b6f19b5cafc78b172aac8946c2a34d66887c` — passed.

## Frozen clause outcomes

| Original clause | Outcome | Verification evidence |
|---|---|---|
| CK-001.a | **UNRESOLVED** | CFC adds page/block/table/visual locators, wrong locator type, inconsistent excerpt, incomplete inventory, duplicate candidate ID, duplicate source identity, and cross-document cache binding cases in `packages/atlas-db/tests/extraction-acceptance.integration.test.ts:102-123,142-151`. The frozen oracle includes a dangling local candidate destination at the PostgreSQL acceptance boundary. The new `malformedResults` matrix at lines 102-112 has no result whose inventory destination references a missing local candidate ID; the prior contracts parser test is not a PostgreSQL acceptance case. **Expected:** every named case, including dangling destination, rejects at acceptance with zero materialization/continuation and execution not completed. **Actual:** the DB integration has no dangling-destination case; only parser-level evidence exists. **Locator:** `packages/atlas-db/tests/extraction-acceptance.integration.test.ts:102-123`; existing parser case `packages/atlas-contracts/tests/semantic.test.ts:39`. |
| CK-001.b | **UNRESOLVED** | CFC submits concurrent identical deliveries and a changed extraction result in `packages/atlas-db/tests/extraction-acceptance.integration.test.ts:124-129`. It asserts one result and two identity-map rows, then only asserts that the changed result rejects. **Expected:** the concurrent path observes one result/candidate/evidence/index/map set, stable IDs, and one continuation; after conflict it verifies all persisted rows and fingerprint remain unchanged. **Actual:** concurrent assertions cover only result count and map count; the conflict has no post-rejection persistence/fingerprint assertions. **Locator:** `packages/atlas-db/tests/extraction-acceptance.integration.test.ts:124-129`. |
| CK-001.c | **RESOLVED** | `packages/atlas-db/tests/extraction-acceptance.integration.test.ts:70-83` reads source hash, provider provenance, full result JSON and mapping values, reconstructs index/map rows from the retained result, and verifies the canonical IDs remain unchanged. |
| CK-001.d | **RESOLVED** | `packages/atlas-db/tests/extraction-acceptance.integration.test.ts:131-151` materializes the same source hash in another project with its own execution/document/capability, then rejects a cache snapshot bound to another artifact/execution without rows or continuation. |
| CK-001.e | **RESOLVED** | `packages/atlas-db/tests/extraction-acceptance.integration.test.ts:175-182` queries more than 100 in-scope candidates with limit 999; result count is exactly 100 and IDs are sorted. The wrong-project read remains empty at lines 84-89. |
| CK-001.f | **RESOLVED** | `packages/atlas-db/tests/extraction-acceptance.integration.test.ts:207-260` uses `createTransactionalQueueProducer`, checks durable pg-boss perception enqueue/replay, injects a database failure after reconciliation enqueue, verifies rollback leaves no durable job/result, and verifies replay commits one durable reconciliation job. The focused suite passed. |

## Decision

Two frozen clauses remain unresolved, so the checkpoint remains `CHANGES_REQUIRED`. Return control to human/planning authority. This verification authorizes no further CFC pass.
