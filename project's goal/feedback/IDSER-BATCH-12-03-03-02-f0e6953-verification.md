# CK verification after CFC: IDSER-012-03-03-02 / IDSER-BATCH-12-03-03-02

- **Ticket:** `IDSER-012-03-03-02` — GHR output compatibility and composition closure.
- **Batch:** `IDSER-BATCH-12-03-03-02`.
- **Reviewed remediation commit:** `f0e6953251621276de1c8807d0f80ebb21048be5` (`fix(idser): close output composition review findings`).
- **CFC checkpoint:** `project's goal/feedback/IDSER-BATCH-12-03-03-02-cfc-checkpoint.md`.
- **Original CK:** `project's goal/feedback/IDSER-BATCH-12-03-03-02-e20d7b5-review.md`.
- **Ticket state:** `awaiting_review`.
- **Review type:** bounded post-CFC verification of original `CK-001.a`, `CK-001.b`, and `CK-002.a` through `CK-002.c` only.
- **Result:** `CHANGES_REQUIRED`.

## Verification scope and preconditions

- The CFC checkpoint consumes only the original frozen matrix; no HMN authorization is claimed or required.
- The remediation commit is unambiguous. The reviewed production file and integration test are clean after `f0e69532`; unrelated modified/untracked worktree entries were preserved.
- Verification is limited to the five original closure oracles, the remediation diff, required evidence, and direct regressions. No broad review or new finding was opened.
- Historical Review Contract rows and original CK outcomes outside these clauses are carried forward unchanged.

## Original finding verification

### CK-001 — Strict receiver ownership and bounded-input closure

| Clause | Frozen closure oracle | Outcome | Evidence |
| --- | --- | --- | --- |
| `CK-001.a` | The committed receiver and a real PostgreSQL assertion prove that the persisted plan's eligible locator set is covered exactly once by referenced handoff `ownedLocators`, rejecting missing, foreign, duplicate, or incomplete ownership. | **RESOLVED** | `packages/atlas-db/src/semantic-batch-plan-ready-fixture.ts:139-155` derives eligible and owned locator keys, rejects invalid/duplicate keys, and enforces exact set equality. `packages/atlas-db/tests/semantic-batch-plan-ready-fixture.integration.test.ts:104-108` corrupts a persisted handoff's owned set and proves `receive` rejects it. |
| `CK-001.b` | The committed test proves oversized bounded input is rejected and a body with more than 100 entries raises `SemanticBatchPlanReadyManifestRequiredError` without truncation or generated fields, while the existing rejection matrix remains passing. | **RESOLVED** | `packages/atlas-db/tests/semantic-batch-plan-ready-fixture.integration.test.ts:101-103` asserts rejection of a 201-character opaque field and the typed blocker for 101 handoffs; the same test retains the prior rejection cases. |

### CK-002 — Real composition replay, provenance, and zero-effect evidence

| Clause | Frozen closure oracle | Outcome | Evidence |
| --- | --- | --- | --- |
| `CK-002.a` | Replay the composed path across changed source/asset/REL/profile/structural conditions, proving same-input identity stability and that changed authorized versions do not mutate the prior plan/handoffs through the approved repository. | **UNRESOLVED** | Same-input replay is proven at `packages/atlas-db/tests/semantic-batch-plan-ready-fixture.integration.test.ts:168-174`, and prior-plan immutability is checked after changed asset, BSS profile, and structural versions at `:192-203`. However, the committed composition test does not exercise a changed REL condition or a distinct changed-source condition. The actual evidence therefore does not satisfy the full frozen oracle. Required observable correction: add real composed-path replay cases for changed REL and changed source, then assert the original plan/handoff content remains byte-for-byte unchanged through the approved repository and rerun the real PostgreSQL harness. Direct-regression boundary remains the existing accepted-source composition, immutable persistence, and non-delivering behavior. |
| `CK-002.b` | The real composition test queries the stored plan and every referenced handoff and proves exact BSS provenance, media/REL state, eligible/deferred units, owned/context locators, and bounded envelopes, including unknown/not-enforced RPD treatment. | **RESOLVED** | `packages/atlas-db/tests/semantic-batch-plan-ready-fixture.integration.test.ts:175-190` reads the stored plan and all handoffs and asserts exact source/media/REL, BSS snapshot, structural and eligible dimensions, units, owned/context locators, and bounded envelopes. |
| `CK-002.c` | The real positive composition and receiver validation prove zero delta across all available ticket-named GHR, BSS, SEM, semantic-truth, and reconciliation surfaces without adding downstream implementation. | **RESOLVED** | `packages/atlas-db/tests/semantic-batch-plan-ready-fixture.integration.test.ts:74-76` captures all available counters, including admissions, dispatch, transport claims, evidence, and knowledge index; `:168-174` and `:204-205` prove zero delta around the positive composed receive. The remediation diff adds evidence only and no downstream route or execution implementation. |

## Validation and direct-regression evidence

- `corepack pnpm --filter @atlas/db typecheck` — **PASS**.
- `corepack pnpm --filter @atlas/agents-bridge typecheck` — **PASS**.
- `node --env-file=.env packages/atlas-db/scripts/migrate.mjs --check` — **PASS**: Atlas database migration check passed.
- `node --env-file=.env ./packages/atlas-db/node_modules/jiti/lib/jiti-cli.mjs packages/atlas-db/tests/semantic-batch-plan-ready-fixture.integration.test.ts` — **PASS**: 3 tests, 3 pass, 0 fail, 0 skipped.
- `node --env-file=.env ./packages/atlas-db/node_modules/jiti/lib/jiti-cli.mjs packages/atlas-db/tests/semantic-batch-plan-input.integration.test.ts` — **PASS**: 1 test, 1 pass, 0 fail, 0 skipped.
- `node --env-file=.env ./packages/atlas-db/node_modules/jiti/lib/jiti-cli.mjs packages/atlas-db/tests/immutable-semantic-corpus-plan.integration.test.ts` — **PASS**: 6 tests, 6 pass, 0 fail, 0 skipped.
- `node --env-file=.env ./apps/agents-bridge/node_modules/jiti/lib/jiti-cli.mjs apps/agents-bridge/tests/idser-structural-fit-corpus-partition.test.ts` — **PASS**: 4 tests, 4 pass, 0 fail, 0 skipped.
- `git diff --check e20d7b5b..f0e69532` — **PASS**.

No direct remediation regression was identified. The only residual is the unresolved original `CK-002.a` closure oracle. No additional CFC cycle is authorized by this verification; control returns to human/planning authority under the bounded workflow.

## Decision

`CHANGES_REQUIRED`. `CK-002.a` remains unresolved against its frozen oracle. The other four original clauses are resolved, and no direct remediation regression remains. This verification does not authorize another CFC cycle.
