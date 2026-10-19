# GO checkpoint: IDSER-012-03-03-01 / IDSER-BATCH-12-03-03-01

- **Ticket:** `IDSER-012-03-03-01` — Immutable plan/handoff persistence.
- **Ticket authority:** `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-012-03-03-01-immutable-plan-handoff-persistence.md`.
- **Dependency consumed:** `IDSER-012-03-02-03` CK `PASS`, recorded at `c0d3d1e1`.
- **Implementation commit:** pending final GO commit amendment.
- **State:** `awaiting_review`.

## Bounded implementation

- Added Atlas-owned `semantic_corpus_plan`, `planned_semantic_corpus_handoff`, and append-only cancellation tables. They are owned by `atlas_app` and explicitly unavailable to `agents_bridge`.
- Added canonical, non-cyclic hashing: the plan records stable batch IDs; each handoff then binds the completed parent plan hash. The repository serializes concurrent scoped idempotency retries, writes plan plus all handoffs in one PostgreSQL transaction, and verifies complete child membership on replay.
- Added immutable conflict, owned-coverage, metadata-only, replan-predecessor, cancellation, and rollback fences. This does not create a GHR route/outbox, BSS work, SEM intake, provider call, semantic truth, or reconciliation effect.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence / command | Status |
| --- | --- | --- | --- |
| `RC-012030301-01` | One qualified N-batch proposal atomically produces one immutable scoped plan and exactly N handoffs; parent/child hashes are noncyclic and independently replayable. | `packages/atlas-db/src/immutable-semantic-corpus-plan.ts`; real PostgreSQL test `packages/atlas-db/tests/immutable-semantic-corpus-plan.integration.test.ts` proves two concurrent retries yield one plan/two handoffs and replays stored content hash. Command: `node --env-file=.env ./packages/atlas-db/node_modules/jiti/lib/jiti-cli.mjs packages/atlas-db/tests/immutable-semantic-corpus-plan.integration.test.ts` — PASS (2 tests). | `PROVEN` |
| `RC-012030301-02` | Same accepted identity returns the same refs; divergent immutable content, invalid ownership, foreign/stale predecessor, and incomplete coverage reject or use an authorized distinct version. | Repository idempotency/proposal uniqueness, immutable-content comparison, scoped predecessor lock, and `canonicalImmutableSemanticCorpusPlanV1`; focused integration assertions cover replay, divergent content, and incomplete ownership. Same command — PASS. | `PROVEN` |
| `RC-012030301-03` | Concurrent claim, crash-before-commit, rollback, restart/lost acknowledgement, cancellation and replan ancestry never expose a completed parent without children or mutate its content. | Scoped `pg_advisory_xact_lock`, transaction body, append-only cancellation table; integration test exercises parallel persist, deliberate handoff-insert trigger failure, retry, cancellation, and predecessor record. Same command — PASS. | `PROVEN` |
| `RC-012030301-04` | Durable writes are non-inert and create zero GHR, BSS, SEM, semantic-truth, or reconciliation effects. | Integration test reads durable plan/handoff rows and compares pg-boss/BSS counters to their pre-write values while requiring zero document-scoped semantic/reconciliation rows. No bridge queue, router, or downstream repository is imported. Same command — PASS. | `PROVEN` |

Additional validation:

- `corepack pnpm --filter @atlas/db typecheck` — PASS.
- `node --env-file=.env packages/atlas-db/scripts/migrate.mjs --check` — PASS after applying migration `0085_idser012_immutable_semantic_corpus_plan` to the local validation database.
- `git diff --check` — PASS.

Internal readiness: READY_FOR_CK

This is an implementation readiness assertion only. CK remains the sole authority to issue `PASS`.
