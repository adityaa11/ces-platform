# CK verification: IDSER-012-03-01-02 / IDSER-BATCH-12-03-01-02

- **Ticket:** `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-012-03-01-02-authorized-accepted-document-resolver.md`
- **Reviewed commit:** `e378f930e4ae6622fdd6c512fe27b934888ad614` (`test(idser): prove unaccepted resolver lifecycle rejection`)
- **Checkpoint:** `project's goal/feedback/IDSER-BATCH-12-03-01-02-cfc-checkpoint.md`
- **Frozen CK artifact:** `project's goal/feedback/IDSER-BATCH-12-03-01-02-d5d8906-review.md`
- **Ticket state:** `awaiting_review`.
- **Review type:** post-CFC verification of the original frozen finding only.
- **Result:** `PASS`.

## Review preconditions and scope

- The active tuple is unambiguous: ticket `IDSER-012-03-01-02`, batch `IDSER-BATCH-12-03-01-02`, and committed CFC checkpoint `e378f930`.
- The CFC checkpoint consumes only frozen clause `CK-001.a` and records `READY_FOR_CK`.
- The checkout contains unrelated modified and untracked files, but the reviewed test path and checkpoint path are clean and the committed remediation diff is unambiguous.
- This verification checks only the original `CK-001.a` closure oracle, the remediation diff, the required evidence, and direct regressions necessary to assess that remediation. No new findings are introduced.

## Validation and evidence

- `pnpm --filter @atlas/db typecheck` — **PASS** (`tsc -p tsconfig.json`).
- With `DATABASE_URL` loaded from the repository `.env`, `pnpm --filter @atlas/db test:semantic-batch-plan-input` — **PASS**: 1 test, 1 pass, 0 failures, 0 skips.
- `git diff --check e378f930^ e378f930` — **PASS**.
- The remediation diff adds the persisted lifecycle mutation to `perception_queued`, invokes the real resolver with the otherwise-valid authenticated input, asserts the generic unavailable/unauthorized rejection, and restores `perceived` before the existing media checks at `packages/atlas-db/tests/semantic-batch-plan-input.integration.test.ts:86-88`.
- The same passing integration run retains the final read-only side-effect counter assertion at `packages/atlas-db/tests/semantic-batch-plan-input.integration.test.ts:97`.

## Frozen Finding Closure Matrix

| Clause | Original authority | Verification outcome | Evidence and oracle result | Direct-regression boundary |
| --- | --- | --- | --- | --- |
| `CK-001.a` | Frozen CK `RC-012030102-02`, specifically the requirement that an otherwise-valid resolver redemption with an unaccepted persisted member status fails closed without content leakage, bound by `SR-012030102-R1`. | `RESOLVED` | The real PostgreSQL integration test changes the persisted member from `perceived` to valid unaccepted `perception_queued`, calls the resolver with the otherwise-valid scope and input, and observes an unavailable/unauthorized rejection without a planner result. It restores `perceived`, completes the remaining checks, and proves unchanged cache, asset, media, semantic, index, and reconciliation counts. The passing command is `pnpm --filter @atlas/db test:semantic-batch-plan-input` with repository `.env` loaded. **Closure oracle: PASS.** | Accepted-document resolver member lifecycle fence and direct read-only effects only; parser, BSS planner, GHR, provider, and downstream semantic behavior remain outside this verification. |

## Direct regression checks

The remediation changes only the named persisted integration scenario and preserves the existing positive, cancellation, media, parser, and side-effect assertions. Typecheck, the real PostgreSQL integration harness, and committed diff whitespace validation all pass. No direct remediation regression was found.

## Scope-change observations

None.

## Decision

`PASS`. The sole frozen clause `CK-001.a` is resolved against its unchanged closure oracle, and no direct regression remains. The ticket may proceed from this CK checkpoint under the existing Atlas workflow.
