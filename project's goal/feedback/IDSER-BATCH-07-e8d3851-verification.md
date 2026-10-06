# IDSER-BATCH-07 CK verification — `e8d3851`

- **Ticket:** IDSER-007 — Bounded reconciliation and procedural advancement
- **Batch:** IDSER-BATCH-07
- **Review type:** HMN-authorized bounded post-CFC verification
- **Ticket state:** `awaiting_review`
- **Remediation commit:** `e8d3851a491b9ece4419216a848524c1dfe15c28` (`fix(idser): prove residual reconciliation clauses`)
- **Consumed authorization:** `HMN-IDSER-007-003`
- **Original frozen CK artifact:** `project's goal/feedback/IDSER-BATCH-07-f16a7ab-review.md`
- **Prior bounded verification:** `project's goal/feedback/IDSER-BATCH-07-e4d5cb3-verification.md`
- **CFC checkpoint:** `project's goal/feedback/IDSER-BATCH-07-cfc-remediation-2.md`
- **Result:** `REVIEW_CONTRACT_GAP`

## Verification scope and target

`HEAD` is the committed remediation and CFC-2 records consumption of the newer `HMN-IDSER-007-003`. This review verifies only its authorized clauses CK-001.a, CK-003.a, and CK-003.d, the remediation diff, the evidence needed for those clauses, and direct regressions. CK-002.a, CK-003.b, and CK-003.c remain protected as previously resolved. The distinct-user and actual worker-restart review-contract gap remains excluded from this CFC by HMN-IDSER-007-003.

The CFC diff changes the selector's prior predicates to use indexed `knowledge_index` key/kind columns and adds bounded fixtures for the authorized residuals. Existing dirty generated/build files and unrelated untracked workflow artifacts do not change the committed review target.

## Validation performed

- `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/db test:reconciliation-acceptance` — **passed**, 1/1, no skips. This exercised the three authorized clauses in the Compose PostgreSQL/pg-boss harness.
- `corepack pnpm --filter @atlas/contracts test` — **passed**, 11/11.
- `corepack pnpm --filter @atlas/db typecheck` — **passed**.
- `corepack pnpm --filter @atlas/core typecheck` — **passed**.
- `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/db migration:check` — **passed**.
- `git diff --check e4d5cb3..HEAD` — **passed**.

## Original frozen clause outcomes

| Frozen clause | Outcome | Verification against the frozen oracle |
|---|---|---|
| CK-001.a | **RESOLVED** | The integration fixture creates 500 current candidates with multibyte payloads and required evidence whose serialized context exceeds the bound (`packages/atlas-db/tests/reconciliation-acceptance.integration.test.ts:151-161`). `selector.select` rejects with the current-set technical-failure path and the test confirms all 500 candidate rows remain. The earlier byte-aware prior fitting, exact counts/byte metadata and stable repeat-selection evidence remain in the committed test at `:105-125`. |
| CK-003.a | **RESOLVED** | The same-document fixture now records quota values 40 and 45, meaningful source text/evidence, and unresolved candidate flags (`packages/atlas-db/tests/reconciliation-acceptance.integration.test.ts:31-39, 78-81`). The persisted same-document `contradicts` row requires resolution. Cross-document supersession cases cite distinct authorized excerpts describing a supported replacement and an unresolved replacement claim; the test checks those exact evidence locators in the persisted result (`:96-98, 126-135`). The integration fixture also preserves the ten relationship types without changing candidate state. |
| CK-003.d | **RESOLVED** | Prior retrieval now filters and ranks on `k.semantic_key` / `k.kind`, the indexed knowledge-index columns (`packages/atlas-db/src/reconciliation-selector.ts:28-38`). The Compose test analyzes representative multi-document table statistics and runs an unforced `EXPLAIN` of the selector's prior-neighborhood SQL with those predicates, then asserts a knowledge-index scan (`packages/atlas-db/tests/reconciliation-acceptance.integration.test.ts:171-190`). Evidence and relationship traversal plans are also asserted. |

## Protected original clauses

CK-002.a, CK-003.b, and CK-003.c remain resolved against their frozen oracles. They were not redesigned in this remediation. The authorized check found no direct regression in these protected areas.

## Review-contract gap retained for planning

The prior CK verification recorded that the frozen CK-003.c closure oracle omitted two explicit ticket-validation dimensions: concurrent distinct bundles **and users**, and an actual worker restart. HMN-IDSER-007-003 excluded them from this bounded CFC cycle. The CFC fixture still uses one owner for its separate projects and reconstructs the authority object rather than restarting the Compose worker. Those observations remain unproven; this artifact does not add them as CFC failures or expand the frozen matrix. Human/planning authority must resolve the gap before a final IDSER-007 completion claim.

## Direct regressions

No direct remediation regression was observed. The required PostgreSQL/pg-boss acceptance test, contract tests, DB/Core typechecks, migration check, and diff check passed. The app-facing implementation path was not changed by this remediation.

## Decision

All three HMN-authorized original frozen clauses are `RESOLVED`, and no direct remediation regression remains. Record `REVIEW_CONTRACT_GAP` for the still-unproven distinct-user and actual worker-restart obligations omitted from the frozen closure oracle. Return control to human/planning authority; do not authorize another CFC cycle. IDSER-007 remains `awaiting_review` and cannot make a final completion claim until the planning gap is resolved.
