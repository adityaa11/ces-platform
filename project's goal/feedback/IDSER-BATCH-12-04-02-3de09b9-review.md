# CK review: IDSER-012-04-02 / IDSER-BATCH-12-04-02

- **Ticket:** `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-012-04-02-complete-sem-candidate-request-estimator.md`
- **Reviewed commit:** `3de09b92996abef5bde7832530f3c12bdf0b2f5d` (`feat(idser): add complete SEM request estimator`)
- **Checkpoint:** `project's goal/feedback/IDSER-BATCH-12-04-02-go-checkpoint.md`
- **Ticket state:** `awaiting_review`.
- **Batch:** `IDSER-BATCH-12-04-02`.
- **Review type:** first consolidated CK review.
- **Result:** `PASS`.

## Review preconditions and evidence

- The active tuple is unambiguous: named ticket `IDSER-012-04-02`, batch `IDSER-BATCH-12-04-02`, ticket state `awaiting_review`, and implementation target `3de09b9` all agree.
- The recorded implementation commit exists and is the committed revision under review. The current worktree has unrelated modified and untracked paths, but the reviewed implementation, focused test, package script, ticket, and GO checkpoint paths are clean relative to `3de09b9`; no unrelated entry makes this review target ambiguous.
- The consumed predecessor is the recorded CK `PASS` for `IDSER-012-04-01`; the GO checkpoint records the approved canonical packet boundary and existing `RequestResourceEnvelope` parser.
- Reviewed the frozen child ticket, its parent split map, the GO closure, the committed estimator and focused test, `buildStepwiseRelationshipEnvelopeRequest()`, `StepwiseSourcePacket`, and `parseRequestResourceEnvelope()`.

## Review Contract

| Row | Ticket authority | Required proof | CK assessment |
| --- | --- | --- | --- |
| `RC-0120402-01` | Actual canonical packet plus actual SEM prompt/schema identities are measured once; fixed overhead and selected source content are not counted again. | `apps/agents-bridge/src/complete-sem-candidate-request-estimator.ts:143-152,185-190` composes the approved packet through `buildStepwiseRelationshipEnvelopeRequest()`, counts UTF-8 prompt/source/schema/framing/media/margin components once, and records hashes/counts only. The focused test proves the exact component arithmetic and packet provenance. | `PROVEN` |
| `RC-0120402-02` | Frozen byte/token formulas apply; output reservation is excluded from inputs, enters the existing envelope once, and invalid or overflowing configuration fails closed. | `complete-sem-candidate-request-estimator.ts:94-109,151-164` validates pinned identities and safe bounds, computes the frozen formulas, keeps `reservedOutputTokens` out of `inputTokens`, and passes only the single prospective demand to the existing envelope parser. The focused tests prove the distinction, one insertion, invalid configuration rejection, and safe-integer guards. | `PROVEN` |
| `RC-0120402-03` | Changed canonical packet, selected media, framing/schema allowance, or pinned estimator configuration changes deterministic measurement with versioned provenance. | `complete-sem-candidate-request-estimator.ts:111-129,165-190` validates selected media against packet identities, canonicalizes its accounting, and hashes packet/request/configuration/media provenance. The focused changed-input fixture proves packet, media, framing, and configuration changes are reflected deterministically. | `PROVEN` |
| `RC-0120402-04` | Logical sizing makes no exact-provider claim and has zero BSS reads/writes, plan records, GHR effects, SEM calls, or source-content storage. | The estimator imports only the approved in-memory SEM request composer and existing envelope parser; it has no reader, persistence, partition, queue, provider, or worker seam. Its result contains hashes, counts, and measurements rather than source content or request bodies. The focused import-fence test passes, and the committed diff is limited to the estimator, focused test, and package test registration. | `PROVEN` |

## Validation and direct-regression checks

- `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/complete-sem-candidate-request-estimator.test.ts` — **PASS**: 4 tests, 0 failures.
- `corepack pnpm --filter @atlas/agents-bridge typecheck` — **PASS**.
- `corepack pnpm --filter @atlas/skills test` — **PASS**: 18 tests, 0 failures.
- `git diff --check 3de09b9^ 3de09b9 -- apps/agents-bridge/package.json apps/agents-bridge/src/complete-sem-candidate-request-estimator.ts apps/agents-bridge/tests/complete-sem-candidate-request-estimator.test.ts` — **PASS**.
- `corepack pnpm --filter @atlas/agents-bridge test` reaches and passes the new estimator suite, then fails at the unrelated existing Docling assertion `apps/agents-bridge/tests/docling-provider.test.ts:109-112`: `docling-digital-pdf` lacks the approved RUN-003 qualification. The reviewed commit does not modify that test or its route-registry path, and the GO checkpoint records the same baseline failure.

## Frozen Finding Closure Matrix

No ticket-bound implementation or evidence deficiency was identified. No `CK-###` finding or closure clause is frozen.

## Scope-change observations

None. The unrelated Docling suite failure is outside this ticket's authorized estimator scope and does not require a ticket change, dependency change, provider/runtime/deployment target, architecture decision, or reopening of approved predecessor work.

## Decision

`PASS`. All four ticket-derived Review Contract rows are proven by the committed implementation and validation evidence, and no direct in-scope regression remains. This is the first CK review; the ticket remains `awaiting_review` unless the repository workflow separately records the approved state transition.
