# CFC checkpoint: IDSER-012-04-04 / IDSER-BATCH-12-04-04

- **Ticket:** `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-012-04-04-immutable-v2-plan-handoff-persistence.md`
- **Frozen CK artifact:** `project's goal/feedback/IDSER-BATCH-12-04-04-0c6300f-review.md`
- **Remediated findings:** `CK-001.a`, `CK-001.b`, and `CK-001.c` only.
- **State:** `awaiting_review`.

## Frozen closure evidence

| Clause | Status | Evidence and binary oracle | Required command and outcome |
| --- | --- | --- | --- |
| `CK-001.a` | `PROVEN` | `PostgresImmutableSemanticCorpusPlanRepository.persist()` now accepts only an omitted/exact v1 discriminator or exact v2 and throws `ImmutableSemanticCorpusPlanError` for v3 and `ImmutableSemanticCorpusPlan/future` before dispatching to a transaction. The v2 PostgreSQL test proves both rejected inputs leave zero scoped `semantic_corpus_plan` and `planned_semantic_corpus_handoff` rows; existing v1 and v2 paths remain exercised. **Frozen oracle passed.** | `node --env-file=.env ./packages/atlas-db/node_modules/jiti/lib/jiti-cli.mjs packages/atlas-db/tests/immutable-semantic-corpus-plan.integration.test.ts` — **PASS**: 7 tests, 0 failures. |
| `CK-001.b` | `PROVEN` | `parseImmutableSemanticCorpusPlanRecord()` now applies exact v2 structural-bound, allowed-unique dimension, non-negative envelope, exact predecessor, unique-inventory, and eligible-coverage validation. `immutable-semantic-corpus-plan-v2.test.ts` rejects each named malformed stored-parent shape and accepts canonical v2 parent content. **Frozen oracle passed.** | `corepack pnpm --filter @atlas/db exec jiti tests/immutable-semantic-corpus-plan-v2.test.ts` — **PASS**: 4 tests, 0 failures. |
| `CK-001.c` | `PROVEN` | V2 input and stored-child parsing require `ConservativeLogicalRequestBytes/v1.value === requestBytes`, retain positive safe-integer and final-fit-trace validation, and reject mismatch, zero, negative, non-integer, and final-fit variants. The canonical policy-consistent handoff remains accepted. **Frozen oracle passed.** | `corepack pnpm --filter @atlas/db exec jiti tests/immutable-semantic-corpus-plan-v2.test.ts` — **PASS**: 4 tests, 0 failures. |

## Direct regressions and validation

- `corepack pnpm --filter @atlas/db typecheck` — **PASS**.
- `node --env-file=.env packages/atlas-db/scripts/migrate.mjs --check` — **PASS**.
- `git diff --check -- packages/atlas-db/src/immutable-semantic-corpus-plan.ts packages/atlas-db/tests/immutable-semantic-corpus-plan-v2.test.ts packages/atlas-db/tests/immutable-semantic-corpus-plan.integration.test.ts project's goal/feedback/IDSER-BATCH-12-04-04-cfc-progress.md project's goal/feedback/IDSER-BATCH-12-04-04-cfc-checkpoint.md` — **PASS**.

The remediation changes only v2 dispatch and strict parser/accounting validation with focused proof. It does not reopen the already proven atomic persistence, zero-effect, migration, cancellation/replan, or immutable-record obligations.

Internal readiness: `READY_FOR_CK`.

This is one bounded remediation checkpoint. It does not issue `PASS`; CK must verify only the frozen clauses, this remediation diff, and direct regressions.
