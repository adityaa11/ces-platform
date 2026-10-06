# IDSER-BATCH-07 CK verification — `e4d5cb3`

- **Ticket:** IDSER-007 — Bounded reconciliation and procedural advancement
- **Batch:** IDSER-BATCH-07
- **Review type:** Bounded post-CFC verification
- **Ticket state:** `awaiting_review`
- **Remediation commit:** `e4d5cb34f32a6d67e7599506f5daf34d79852426` (`fix(idser): close reconciliation feedback matrix`)
- **Consumed CK artifact:** `project's goal/feedback/IDSER-BATCH-07-f16a7ab-review.md`
- **CFC checkpoint:** `project's goal/feedback/IDSER-BATCH-07-cfc-remediation.md`
- **Result:** `CHANGES_REQUIRED`

## Verification scope and target

`HEAD` is the committed CFC remediation. The remediation diff is limited to the reconciliation selector/context schema, semantic evidence paging, retrieval indexes, their contract/integration tests, and the CFC record. Existing dirty generated/build files and unrelated untracked workflow artifacts do not change the committed target.

This verification checks only CK-001.a, CK-002.a, CK-003.a through CK-003.d, the remediation diff, evidence needed for those clauses, and direct regressions. IDSER-003 through IDSER-006 remain accepted dependencies. The recorded IDSER-006 Node 24 assertion-container mismatch remains outside this verification.

## Validation performed

- `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/db test:reconciliation-acceptance` — **passed**, 1/1, no skips. The test exercised prior byte fitting, evidence paging, three-document progression, independent-bundle advancement, rollback, negative references, and query-plan assertions.
- `corepack pnpm --filter @atlas/contracts test` — **passed**, 11/11.
- `corepack pnpm --filter @atlas/db typecheck` — **passed**.
- `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/db migration:check` — **passed**.
- `corepack pnpm --filter @atlas/app build` — **passed**.
- `git diff --check f16a7ab..HEAD` — **passed**.

## Original frozen clause outcomes

| Frozen clause | Outcome | Verification against the frozen oracle |
|---|---|---|
| CK-001.a | **UNRESOLVED** | Byte-aware omission, complete retained prior records, exact byte/count metadata, and repeat stability are implemented and exercised at `packages/atlas-db/tests/reconciliation-acceptance.integration.test.ts:103-123`. The frozen oracle also requires a separate over-budget current-set case proving technical failure without dropping current candidates. No such selector fixture or assertion exists in the committed integration test or `packages/atlas-contracts/tests/semantic.test.ts`; expected state is unproven. |
| CK-002.a | **RESOLVED** | `packages/atlas-db/tests/reconciliation-acceptance.integration.test.ts:144-152` uses 101 evidence records, verifies the first response is capped at 100, then obtains the final record by cursor with no duplicate IDs. The Core interface and DB adapter now expose that continuation. |
| CK-003.a | **UNRESOLVED** | The integration test persists the relationship vocabulary and cross-document proposals, but its same-document candidate fixture remains `current-a` / `current-b` with those strings as normalized meanings and empty payloads (`packages/atlas-db/tests/reconciliation-acceptance.integration.test.ts:31-39`). It does not establish the required conflicting-quota inputs or their contradiction/unresolved observation. The later `supported`/`unsupported` labels are payload strings attached to the same evidence reference (`:124-128`), not distinct evidence-supported and unsupported fixtures. |
| CK-003.b | **RESOLVED** | `packages/atlas-db/tests/reconciliation-acceptance.integration.test.ts:65-69` rejects missing accounting, invented, unselected same-bundle, and foreign-scope targets without partial writes. `packages/atlas-contracts/tests/semantic.test.ts:73-75, 90-96` covers 500+500, over-count, and byte boundaries; the Compose selector fixture uses multibyte evidence, checks current retention and repeat IDs/metadata (`reconciliation-acceptance.integration.test.ts:103-123`). |
| CK-003.c | **RESOLVED against the frozen oracle** | The Compose test proves D1→D2→D3 sequencing and final rollback (`reconciliation-acceptance.integration.test.ts:86-90, 126-143`), advances a separate bundle concurrently despite matching display wording (`:51-87`), rejects injected enqueue failure without a partial result (`:70-74`), and confirms replay after authority reconstruction does not add another job (`:88-90`). A separate ticket-proof gap is recorded below for the distinct-user and actual worker-restart dimensions not made explicit in the frozen closure oracle. |
| CK-003.d | **UNRESOLVED** | The committed test's `EXPLAIN` assertions (`packages/atlas-db/tests/reconciliation-acceptance.integration.test.ts:153-168`) force `enable_seqscan=off` and explain simplified predicates on `knowledge_index.semantic_key` / `.kind`. The production selector filters `semantic_candidate.semantic_key` / `.kind` (`packages/atlas-db/src/reconciliation-selector.ts:28-38`), so those assertions do not prove the selector's actual retrieval SQL uses the new key/kind indexes. The frozen oracle requires plans tied to the actual selector/repository SQL. |

## Review-contract gap

The frozen CK-003.c oracle generalized two ticket-required proof dimensions that were visible during first review:

- **Omitted authority:** IDSER-007 Validation requires concurrent distinct bundles/users and worker restart. The frozen oracle required independent bundles to progress concurrently and duplicate/restart delivery not to double-advance, without requiring distinct user identities or a restart of the actual Compose worker.
- **Why omitted:** The first review compressed those named scenarios into the bundle-concurrency and restart-delivery observations. Reconstructing a `PostgresSemanticAuthority` instance is useful persisted-state replay evidence, but it does not exercise the pg-boss worker process restart; the concurrent foreign bundle fixture also uses the same owner.
- **Completion impact:** These ticket-authorized observations remain unproven. They are not added to the frozen CFC closure oracle and are not enforced as new CFC findings in this verification. Human/planning authority must resolve the review-contract gap before IDSER-007 can claim complete ticket-required proof.
- **Handoff:** Return the gap to human/planning authority. Any further remediation cycle requires a fresh explicit HMN authorization; CK does not authorize another CFC pass.

## Direct regressions

No direct remediation regression was observed. The required PostgreSQL/pg-boss integration test, contract suite, DB typecheck, migration check, app build, and diff check passed. The unresolved items above are original ticket obligations and frozen-clause proof, not regressions introduced by the CFC diff.

## Decision

`CHANGES_REQUIRED` for IDSER-007 / IDSER-BATCH-07 at `e4d5cb34f32a6d67e7599506f5daf34d79852426`. CK-002.a, CK-003.b, and CK-003.c are resolved against their frozen oracles. CK-001.a, CK-003.a, and CK-003.d remain unresolved with the exact expected states and evidence locations stated above. Keep IDSER-007 `awaiting_review` and return control to human/planning authority. This is the one post-CFC verification; do not start another CFC cycle without a newer explicit HMN authorization.
