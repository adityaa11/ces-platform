# GO checkpoint: IDSER-012-05-03-02

- **Ticket:** [IDSER-012-05-03-02](../Backend_Phase/tickets/Initial_Draft_Phase/IDSER-012-05-03-02-v3-operational-cutover-and-reference-ghr-validation.md)
- **Batch:** `IDSER-BATCH-12-05-03-02`
- **State:** `awaiting_review`
- **Implementation commit:** `aaf142a54ecb4bc354747b8c7053c7621604e6ae` (`feat(idser): complete v3 operational cutover`)
- **Planning authority:** [contract freeze 001](IDSER-012-05-03-02-contract-freeze-001.md)
- **Predecessor:** `IDSER-012-05-03-01` CK PASS, reviewed commit `ed07f338daf5e7158a5459b427f0fda2f329589b`.
- **Maintenance authority:** operator decision `AUTHORIZE_BOUNDED_FIXTURE_CLEANUP` in this task, 2026-10-21. It authorized only the four verified v2 fixture plan/handoff pairs.

## Review Contract Closure

| Row | Ticket authority | Required proof | Evidence and outcome | Status |
| --- | --- | --- | --- | --- |
| `RC-01205-0302-01` | Frozen CK contract, clean v3 fixture-cleanup procedure | Identify the target, freeze exact candidates and dependencies, delete only exclusively disposable fixture pairs transactionally, preserve canonical data, and leave zero legacy plans. | Target was `atlas-canonical-perception` / `atlas_dev`, PostgreSQL system identifier `7695866785335762982`, protected volumes `atlas-canonical-perception_postgres-data` and `atlas-canonical-perception_atlas-data`. The transaction revalidated and deleted exactly four v2 plans and four handoffs: `469db…c3e/2fe547…9e5`, `4abacf…82b/905d71…ef2`, `7f8f83…779/137641…ee1`, and `fd55b3…5c8/27f0eb…022`. It disabled only `planned_semantic_corpus_handoff_immutable` and `semantic_corpus_plan_immutable`, retained FK enforcement (`session_replication_role=origin`), restored both guards to `O` before commit, and reported zero remaining target rows. Post-inventory: zero `ImmutableSemanticCorpusPlan/v1` or `/v2` rows. | `PROVEN` |
| `RC-01205-0302-02` | Frozen CK contract, sole scope and boundaries | Active v1/v2 writer/parser/GHR paths fail at active boundaries; v3 planning remains usable. | `packages/atlas-db/src/immutable-semantic-corpus-plan.ts` makes the operational writer v3-only; `semantic-batch-plan-ready-fixture.ts` accepts only v3 persisted membership. `pnpm --filter @atlas/db test:immutable-semantic-corpus-plan-v3` passed 4/4; database-backed immutable-plan and ready-fixture tests passed their v3 cases and retain v1/v2 retirement assertions. | `PROVEN` |
| `RC-01205-0302-03` | Frozen CK contract and canonical reconstruction acceptance | Reference-only receiver validates immutable v3 membership, performs no delivery, and v3 reconstruction preserves selected text/image request identity without persisting the request. | `scripts/idser-012-05-03-02/safara-v3-qualification.mts` persisted Safara v3 plan `semantic-plan-104e4bb140ac08e7e81cb013ee88279908469706fb86be01121eeea0813b7e7e`, handoff `semantic-handoff-e544060a49bfaff00440be63bcb9ad7627fe8dc790540ae6057fb86d4cc33aa7`, selected image `derived/153792cf-7ac4-47e0-90db-f44a75a15a56`, source specification hash `bcf96650aabab0f9249e5beac2dd1ea93e47145c3cfa846539424cef9fa4a28f`, and reconstructed request hash `688dd66560530a650bf397e36d426924e761c370e5de76c7f0f433f263b795ff`. The script’s second run was idempotent. Post-check observed zero Safara semantic executions, admissions, attempts, reservations, dispatches, and semantic deliveries. | `PROVEN` |
| `RC-01205-0302-04` | Canonical perception and reconstruction acceptance | Preserve Safara documents, source hashes, completed perception records, and visual assets through the cleanup and validation. | Post-check retained all four Safara documents and source hashes. The three RUN-003 documents each retain one completed execution; the Professional document retains one completed execution, five manifests, and five active derived assets. No protected volume was removed, recreated, pruned, or reset. | `PROVEN` |

## Validation

- `DATABASE_URL=postgresql://atlas:…@127.0.0.1:5432/atlas_dev pnpm --filter @atlas/db test:immutable-semantic-corpus-plan` — pass 4, skipped 4 retired v1/v2 cases; real v3 persistence passed.
- `DATABASE_URL=postgresql://atlas:…@127.0.0.1:5432/atlas_dev pnpm --filter @atlas/db test:semantic-batch-plan-ready` — pass 2, skipped 4 retired v1/v2 cases; real v3 reference-only receiver passed.
- `pnpm --filter @atlas/db test:immutable-semantic-corpus-plan-v3` — pass 4/4.
- `pnpm --filter @atlas/db typecheck` — pass.
- `pnpm --filter @atlas/db exec jiti ../../scripts/idser-012-05-03-02/safara-v3-qualification.mts` — pass twice; the second run returned the same immutable plan/handoff identities.

The earlier reported population of 21 v1 fixtures was not in the authoritative snapshot used here: before deletion, this exact database identity contained only the four v2 targets and no v1 plan; after deletion it contains one v3 plan and no legacy plan. The cluster exposes only `atlas_dev` and `postgres`, so the 21-v1 report belongs to a different historical inventory snapshot, not this cleanup target. No attempt was made to infer or modify that absent population.

Internal readiness: READY_FOR_CK
