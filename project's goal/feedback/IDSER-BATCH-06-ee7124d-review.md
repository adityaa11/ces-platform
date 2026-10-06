# IDSER-BATCH-06 CK review — `ee7124d`

- **Ticket:** IDSER-006, `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-006-extraction-validation-and-index-materialization.md`
- **Batch:** IDSER-BATCH-06
- **Review type:** First consolidated CK review
- **Ticket state:** `awaiting_review`
- **Review target:** `ee7124d0dcf7d38c3947c66c10d9fab6dba3fd80` (`feat(idser): materialize validated extraction state`), as recorded in the ticket.
- **Checkout:** HEAD `21524ec033574c3c531fe5b9108bd98545cdbe65`; that later commit only changes the ticket state/checkpoint/evidence and readiness. The in-scope implementation paths have no working-tree modifications. Existing generated-file edits and unrelated workflow artifacts do not make the target ambiguous.
- **Frozen authority:** The current IDSER-006 ticket, especially Scope, Acceptance Criteria 1–6, Validation, and mandatory review bindings REV-READY-IDSER-006-01/02/03; approved IDSER-004 and IDSER-005 interfaces actually consumed.
- **Dependency check:** IDSER-005's `IDSER-BATCH-05-2707518-verification.md` records `PASS`; IDSER-004 is recorded approved in the ticket set README.
- **Result:** `CHANGES_REQUIRED`

## Review Contract

| Row | Authority / requirement | Evidence reviewed | Status |
|---|---|---|---|
| RC-001 | IDSER-006 Scope and AC-01: perception acceptance, extraction execution and enqueue are atomic; replay does not create another continuation. | `packages/atlas-db/src/perception-authority.ts`; `packages/atlas-db/tests/extraction-acceptance.integration.test.ts`; Compose integration passed 2/2, but its queue is an in-memory double, not pg-boss; see CK-001.f. | IMPLEMENTED_UNPROVEN |
| RC-002 | IDSER-006 Scope, AC-02/03, Validation, REV-READY-IDSER-006-01: independently validate schema, scope, evidence, locators, excerpts, source accounting and candidate identity before writes. | `packages/atlas-db/src/extraction-acceptance.ts`; `packages/atlas-contracts/src/semantic.ts`; `packages/atlas-contracts/tests/semantic.test.ts`; focused PostgreSQL integration. Several explicitly named negative cases lack Atlas/PostgreSQL acceptance evidence; see CK-001.a. | IMPLEMENTED_UNPROVEN |
| RC-003 | IDSER-006 Scope and AC-02/06: persist complete validated result/provenance and stable candidate/evidence/index/mapping rows; expose scoped, bounded reads. | `packages/atlas-db/src/extraction-acceptance.ts`; `packages/atlas-db/src/semantic-candidate-repository.ts`; migration `0018_idser006_candidate_identity_map.sql`; integration checks row counts and basic read/scope behavior, but not the required provenance/mapping/reindex and cap observations; see CK-001.c/e. | IMPLEMENTED_UNPROVEN |
| RC-004 | IDSER-006 Scope and AC-04, Validation, REV-READY-IDSER-006-02: exact replay preserves IDs and one continuation; a different completion conflicts without overwrite. | Focused PostgreSQL integration does sequential exact replay and changes `provider.attempt` for the conflicting envelope. It does not exercise concurrent acceptance materialization or a changed extraction result; see CK-001.b. | IMPLEMENTED_UNPROVEN |
| RC-005 | IDSER-006 Scope, AC-05/24, Validation, REV-READY-IDSER-006-02: materialization and continuation failures roll back and redelivery succeeds cleanly. | Focused PostgreSQL integration injects failures at result/candidate/index/map/evidence inserts and queue handoff; it uses an in-memory queue double, so durable pg-boss enlistment/rollback is not proven; see CK-001.f. | IMPLEMENTED_UNPROVEN |
| RC-006 | IDSER-006 Scope, AC-06, Validation, REV-READY-IDSER-006-03: preserve exact execution/source identity across cache use and expose candidate-only, scoped, capped reads. | Source binding in `packages/atlas-db/src/extraction-acceptance.ts`; candidate read adapter; focused integration checks wrong-project denial and lookup. Shared-hash execution/project handling and a >100-row bounded-read observation are absent; see CK-001.d/e. | IMPLEMENTED_UNPROVEN |

## Evidence and validation performed

PostgreSQL and the Compose `atlas` service were healthy (`docker compose ps`). I ran these checks against the review checkout:

- `docker compose run --rm --no-deps atlas corepack pnpm --filter @atlas/db test:extraction-acceptance` — passed, 2/2.
- `docker compose exec -T atlas corepack pnpm --filter @atlas/db test:semantic-authority` — passed, 1/1.
- `docker compose exec -T atlas corepack pnpm --filter @atlas/db test:perception-authority` — passed, 1/1.
- `docker compose run --rm --no-deps atlas corepack pnpm --filter @atlas/contracts test` — passed (execution 2/2, perception 2/2, semantic 7/7).
- `docker compose run --rm --no-deps atlas corepack pnpm --filter @atlas/core test` — all included suites passed (19 tests total).
- `docker compose run --rm --no-deps atlas corepack pnpm --filter @atlas/db typecheck` — passed.
- `docker compose run --rm --no-deps atlas corepack pnpm --filter @atlas/core typecheck` — passed.
- `git diff --check ee7124d0dcf7d38c3947c66c10d9fab6dba3fd80^ ee7124d0dcf7d38c3947c66c10d9fab6dba3fd80` — passed.

The tests show the main implementation and rollback paths work. The missing observations below are explicit IDSER-006 validation obligations, so generic/parser-level tests or code inspection do not substitute for the named PostgreSQL evidence.

## Finding CK-001 — IDSER-006 PostgreSQL acceptance evidence is incomplete

### CK-001.a — Required invalid-source cases are not exercised through acceptance

**Ticket authority:** IDSER-006 Validation, “Negative tests for invented page/block/table/visual IDs, wrong locator type, inconsistent excerpts, missing inventory, dangling/duplicate local IDs and cross-document evidence”; AC-03 requires invalid schema/evidence/source accounting/scope to create no accepted partial state or reconciliation job.

**Unsatisfied evidence:** `packages/atlas-db/tests/extraction-acceptance.integration.test.ts:77-85` submits one invented text-block locator. Contract tests in `packages/atlas-contracts/tests/semantic.test.ts` cover malformed schema and a dangling destination, but do not prove the remaining named cases at the Atlas acceptance boundary and in PostgreSQL. The required wrong-type, inconsistent-excerpt, missing-inventory, duplicate-local-ID, and cross-document cases are not exercised there; neither are the separate invented page/block/table/visual locator variants.

**Observable correction:** Add PostgreSQL acceptance cases for each named invalid input, including the locator variants, and verify each rejection leaves no accepted result, candidate, evidence, index/mapping row or reconciliation job and does not complete the extraction execution.

**Binary closure oracle:** `packages/atlas-db/tests/extraction-acceptance.integration.test.ts` (or a directly invoked companion suite) contains passing production-handler/PostgreSQL cases for every named invalid source/schema case; every case observes zero accepted extraction materialization/continuation and an uncompleted execution. Direct-regression boundary: IDSER-006 invalid extraction rejection and its AC-03 atomic no-partial-state behavior only.

### CK-001.b — Replay/conflict behavior is not proven on concurrent materialization

**Ticket authority:** IDSER-006 AC-04 and Validation: PostgreSQL integration must cover concurrent identical delivery and conflicting second results; exact replay retains IDs and one continuation, while different completion fingerprints conflict without overwrite.

**Unsatisfied evidence:** `packages/atlas-db/tests/extraction-acceptance.integration.test.ts:72-75` re-delivers sequentially, and its conflict changes only provider `attempt`. `packages/atlas-db/tests/semantic-authority.integration.test.ts` covers concurrent calls with a stub handler, not concurrent writes through `PostgresExtractionAcceptanceHandler`; the actual materialized candidate IDs and continuation count are therefore not proven for concurrent identical deliveries or for a changed extraction result.

**Observable correction:** Exercise concurrent identical delivery and a distinct extraction completion against the PostgreSQL authority plus extraction handler, retaining the existing first result when the conflict is rejected.

**Binary closure oracle:** A passing PostgreSQL integration assertion proves concurrent identical deliveries yield one accepted result/candidate/evidence/index/map set, stable IDs, and one reconciliation continuation; a changed extraction result is rejected and leaves those persisted rows/fingerprint unchanged. Direct-regression boundary: IDSER-006 completion replay/conflict and materialization only.

### CK-001.c — Persisted provenance, identity mapping, and reindex stability are not inspected

**Ticket authority:** IDSER-006 Scope and AC-02/04; Validation requires PostgreSQL integration to inspect provenance/mapping and verify reindexing from retained full result without changing canonical IDs.

**Unsatisfied evidence:** The focused integration checks row counts and candidate reads, but does not assert stored `result_json`, source hash/provider provenance, the local-to-canonical identity-map values, or that reconstruction/reindex from the retained result leaves canonical IDs unchanged. No committed test provides this required inspection.

**Observable correction:** Extend PostgreSQL evidence to inspect the persisted result and its source/provider provenance, verify each local ID maps to the expected canonical/index identity, and reconstruct/reindex from retained `result_json` while checking IDs remain identical.

**Binary closure oracle:** A passing Compose PostgreSQL integration assertion reads the persisted full result/provenance and identity mappings, performs the ticket-required reconstruction/reindex check, and observes byte/field-equivalent source provenance plus unchanged canonical IDs. Direct-regression boundary: IDSER-006 result, provenance, mapping, index materialization and exact replay only.

### CK-001.d — Shared-hash cache handling across executions/projects is not proven

**Ticket authority:** IDSER-006 Scope and Validation: preserve an execution-bound normalized-document reference/snapshot; verify shared-hash cache handling across executions and projects so cache reuse cannot substitute mismatched execution/artifact identity or locator sets; REV-READY-IDSER-006-03.

**Unsatisfied evidence:** The acceptance integration seeds separate cache entries for its executions and checks one binding. No PostgreSQL scenario uses a shared source hash across executions/projects and observes that each extraction sees only its own execution/artifact/locator set. Code-level identity checks do not satisfy the named cache validation.

**Observable correction:** Add a Compose PostgreSQL shared-hash case across distinct executions and projects, then demonstrate that each correct execution uses its own normalized snapshot and a mismatched execution/artifact/locator set is rejected before persistence.

**Binary closure oracle:** The shared-hash Compose scenario passes for both scopes, proves exact execution/artifact/source and locator binding for each accepted result, and proves mismatched cache content creates no accepted rows or continuation. Direct-regression boundary: IDSER-006 normalized-cache lookup and source/evidence binding only.

### CK-001.e — Bounded-read cap has no meaningful query assertion

**Ticket authority:** IDSER-006 Scope requires capped scoped reads “as in README”; Validation requires query tests proving scope filters and stable bounded reads; AC-06.

**Unsatisfied evidence:** `packages/atlas-db/tests/extraction-acceptance.integration.test.ts:68-70` requests `limit: 999` but has only one matching row. It proves a filter and basic lookup, not the maximum page bound or stable ordering under an over-limit result set.

**Observable correction:** Seed more than the documented retrieval cap and query with an over-limit value; assert the returned page stays at the cap with deterministic ordering and remains scoped.

**Binary closure oracle:** A passing PostgreSQL query test with more than 100 scoped candidates and `limit > 100` returns exactly at most 100 rows in stable semantic-ID order, and an out-of-scope query returns no rows. Direct-regression boundary: IDSER-006 semantic candidate/evidence bounded reads only.

### CK-001.f — Atomic queue handoff is tested with a queue double, not pg-boss

**Ticket authority:** IDSER-006 AC-01/05 and Validation require perception/extraction and materialization/reconciliation enqueue to share a transaction, with rollback and redelivery; REV-READY-IDSER-006-02 explicitly asks for “Real DB/queue evidence.”

**Unsatisfied evidence:** `packages/atlas-db/tests/extraction-acceptance.integration.test.ts:13-14,96-109,128-150` uses `makeQueue()`, an in-memory object that appends jobs. Its transaction parameter is ignored. The tests cannot show that an actual pg-boss queue row commits/rolls back with the Atlas transaction. The production adapter wiring in `apps/atlas/perception-internal.ts` does not substitute for this named real queue proof.

**Observable correction:** Add a Compose integration case using the real transactional pg-boss producer for perception/extraction and reconciliation handoff; inject a failure at/after enqueue and verify both Atlas rows and durable queue rows roll back, then replay and verify exactly one durable job.

**Binary closure oracle:** A passing Compose PostgreSQL/pg-boss test observes no durable pg-boss continuation after the injected transaction failure, no accepted partial Atlas materialization, and exactly one durable continuation after successful replay. Direct-regression boundary: IDSER-006 transactional enqueue, rollback and replay only.

## Frozen Finding Closure Matrix

| Clause | Exact ticket authority | Unsatisfied evidence | Observable correction / proof | Binary closure oracle | Direct-regression boundary |
|---|---|---|---|---|---|
| CK-001.a | IDSER-006 Validation negative-test list; AC-03 | One fake text locator in the DB test; the full named matrix is not proven at acceptance/persistence boundary. | Add and run the named invalid-source/schema cases at the PostgreSQL acceptance boundary. | Every named case rejects with zero accepted materialization/continuation and execution not completed. | Invalid extraction rejection and AC-03 atomic no-partial-state behavior. |
| CK-001.b | IDSER-006 AC-04 and Validation concurrent identical/conflicting completion cases | Real materializer is only replayed sequentially; conflict changes provider metadata; authority concurrency test uses a stub handler. | Concurrent identical deliveries and a different extraction result against the PostgreSQL materializer. | One persisted set/continuation and stable IDs under concurrency; changed result rejected without changing persisted rows/fingerprint. | IDSER-006 replay, conflict, and materialization. |
| CK-001.c | IDSER-006 Scope, AC-02/04, Validation provenance/mapping/reindex | Existing test does not inspect full result/provenance/map values or reindex ID stability. | Inspect stored result/source/provider provenance and map values; reconstruct/reindex from stored result. | Persisted fields and mapping match the source/result; canonical IDs are unchanged after reconstruction/reindex. | IDSER-006 materialization, provenance, mapping, and index only. |
| CK-001.d | IDSER-006 Scope, Validation shared-hash cache check, REV-READY-IDSER-006-03 | No shared-hash, multi-execution/project acceptance case observes exact locator binding. | Compose PostgreSQL scenario with shared hash across separate executions/projects and mismatched snapshot rejection. | Both correct scope bindings pass; mismatched snapshot creates no accepted state or continuation. | IDSER-006 normalized-cache and evidence binding only. |
| CK-001.e | IDSER-006 Scope capped reads; Validation bounded-read query tests; AC-06 | Over-limit query currently matches only one candidate. | Query more than 100 rows with an over-limit limit and assert deterministic capped/scoped result. | Returned count is <=100, order is stable, out-of-scope read is empty. | IDSER-006 candidate/evidence reads only. |
| CK-001.f | IDSER-006 AC-01/05, Validation, REV-READY-IDSER-006-02 real DB/queue evidence | Integration uses an in-memory queue whose enqueue ignores the transaction. | Exercise the real transactional pg-boss producer under failure and replay. | Failed transaction leaves no durable job/Atlas state; replay commits exactly one durable continuation. | IDSER-006 transactional enqueue, rollback and replay only. |

All closure clauses and binary oracles are frozen by this artifact. No separate scope-change observation was identified. This is one consolidated `CHANGES_REQUIRED` finding; after remediation is committed, return to the bounded workflow for CK verification.
