# GO checkpoint: IDSER-012-04-06 / IDSER-BATCH-12-04-06

- **Ticket:** `IDSER-012-04-06` — Read-only SEM batch reconstruction.
- **Ticket authority:** `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-012-04-06-read-only-sem-batch-reconstruction.md`.
- **Dependencies consumed:** `IDSER-012-04-01` CK `PASS` at `f5302803038befd36efaf01c3e2d26ff531e9656`; `IDSER-012-04-04` CK `PASS` at `66df38b5`; the existing server-owned `PostgresAcceptedSemanticBatchPlanDocumentResolver`.
- **Implementation commit:** `afea35fa` (`feat(idser): reconstruct persisted semantic batches`).
- **Ticket state:** `awaiting_review`.

## Bounded implementation

`PostgresSemanticBatchReconstructionResolver` is a SELECT-only SEM-facing compatibility boundary. Given an authenticated scope and immutable v2 plan/handoff reference, it validates parent/child/version/hash/profile bindings, cancellation state, inventory ownership, and the exact handoff selection. It redeems the original accepted `NormalizedDocument V1` only through the existing server-owned resolver, calls `buildStepwiseSourcePacket()` with that persisted owned/context selection, and returns the reconstructed source specification only after its SHA-256 equals the persisted planned hash.

The boundary has no worker, provider, Docling, BSS admission/reservation/send, GHR, plan mutation, semantic-acceptance, reconciliation, Master, or CES operation. Missing, foreign, cancelled, malformed, stale, profile-inconsistent, unavailable-source, invalid-selection, and hash-mismatch cases fail closed.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence / validation locator | Exact command and outcome | Status |
| --- | --- | --- | --- | --- |
| `RC-0120406-01` | Authorized persisted v2 handoff and parent must resolve to the exact original document and owned/context selection. | `semantic-batch-reconstruction.ts` binds authenticated scope, parent, child, cancellation, v2 parser, plan hash, inventory, eligible ownership, and matching profile identities before redemption. The PostgreSQL test creates an actual accepted source, persists a v2 plan/handoff, and observes byte-identical reconstruction. | `node --env-file=.env ./packages/atlas-db/node_modules/jiti/lib/jiti-cli.mjs packages/atlas-db/tests/semantic-batch-reconstruction.test.ts` — **PASS** (4 tests). | `PROVEN` |
| `RC-0120406-02` | The shared builder must emit byte-identical planned source specification and matching SHA-256; a mismatch is an integrity failure. | The resolver calls only `buildStepwiseSourcePacket()` and compares `sourceSpecificationSha256`; focused and PostgreSQL paths assert source-byte/hash parity, while the mismatch case rejects. | Same focused command — **PASS**. | `PROVEN` |
| `RC-0120406-03` | Foreign/stale/cancelled/missing/mismatched reference, source, selection, parent, or hash must fail closed without conversion fallback or repartition. | Focused cases cover foreign, cancelled, profile-mismatched, duplicate, deferred-owner, unavailable-source, and changed-hash paths; PostgreSQL probe rejects a foreign authenticated project scope. The module has no Docling, partition, or mutation dependency. | Same focused command — **PASS**. | `PROVEN` |
| `RC-0120406-04` | Reconstruction must remain read-only with zero GHR/BSS/SEM execution, semantic acceptance, reconciliation, Master, or CES effect. | The only repository SQL in the new boundary is a `SELECT`; the PostgreSQL test snapshots jobs, BSS attempts/reservations, semantic executions/candidates, and reconciliation before/after exact reconstruction. | Same focused command — **PASS**; scoped counters unchanged. | `PROVEN` |

## Validation

- `corepack pnpm --filter @atlas/db typecheck` — **PASS**.
- `node --env-file=.env ./packages/atlas-db/node_modules/jiti/lib/jiti-cli.mjs packages/atlas-db/tests/semantic-batch-reconstruction.test.ts` — **PASS**: 4 tests.
- `corepack pnpm --filter @atlas/db exec jiti tests/immutable-semantic-corpus-plan-v2.test.ts` — **PASS**: 4 tests.
- `node --env-file=.env ./packages/atlas-db/node_modules/jiti/lib/jiti-cli.mjs packages/atlas-db/tests/immutable-semantic-corpus-plan.integration.test.ts` — **PASS**: 7 tests; expected PostgreSQL drop-if-missing notices only.
- `corepack pnpm --filter @atlas/skills test` — **PASS**: 18 tests.
- `git diff --check` — **PASS**.

No source text, image bytes, prompts, credentials, or database dumps were recorded in this checkpoint.

Internal readiness: `READY_FOR_CK`.

This is GO implementation readiness only, not a self-issued CK `PASS`. Control returns to CK.
