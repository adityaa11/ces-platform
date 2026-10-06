# CK verification: IDSER-002 / IDSER-BATCH-02

- Ticket / batch: `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-002-semantic-contracts-and-production-skills.md` / `IDSER-BATCH-02`
- Reviewed remediation commit: `c75d8aa1b12df9dbdafc2703fd37cce477584427` (`fix(contracts): address IDSER-002 CK findings`)
- Checkpoint-record commit: `af5bc33f85c385883a47abbdbad0ae17e98db5f3`
- Frozen ticket reference: IDSER-002 remains `awaiting_review`; its CFC checkpoint names the reviewed remediation commit.
- Original CK: `IDSER-BATCH-02-f4b65f0-review.md`, result `CHANGES_REQUIRED`.
- Review type: bounded post-CFC verification of CK-001 through CK-004, the remediation diff, required evidence, and direct regressions only.
- Result: `CHANGES_REQUIRED`

## Verification evidence

- `HEAD` is `af5bc33f85c385883a47abbdbad0ae17e98db5f3`, which records remediation commit `c75d8aa1b12df9dbdafc2703fd37cce477584427`. The tracked worktree is clean. Existing untracked review/context artifacts do not change the named checkpoint.
- Inspected only the original consolidated findings, `f4b65f0..c75d8aa` changes to `packages/atlas-contracts/src/semantic.ts` and `packages/atlas-contracts/tests/semantic.test.ts`, the CFC evidence in IDSER-002, and direct behavior exercised by the required package checks.
- `docker compose build atlas` succeeded. Compose checks passed: `docker compose run --rm --no-deps atlas corepack pnpm --filter @atlas/contracts test` (8 tests, 0 failed/skipped); contracts typecheck; `docker compose run --rm --no-deps atlas corepack pnpm --filter @atlas/skills test` (1 test, 0 failed/skipped); skills typecheck.
- `git diff --check f4b65f0..c75d8aa` passed.

## Original finding status

| ID | Status | Verification |
|---|---|---|
| CK-001 | RESOLVED | `evidenceRefSchema` now requires excerpts for `text_block` and `table`; `parseSemanticExtractionResult` rejects candidate IDs omitted from inventory. Added negative fixtures for missing text evidence and missing source accounting. |
| CK-002 | RESOLVED | `assertBoundedPayload` enforces nested depth, array/object size, and string limits on extraction payloads, reconciliation-context candidates, and relationship payloads. The added deep-payload negative fixture passes. |
| CK-003 | RESOLVED | `parseSemanticExtractionContext` now rejects a `scope.documentId` that differs from `normalizedDocument.artifactId`; the mismatch fixture passes by throwing. |
| CK-004 | OPEN | The new fixtures cover all sixteen valid semantic kinds, all ten valid relationship types, non-fact-only inventory with a question, missing excerpts/accounting, deep payload rejection, maximum/over-maximum current candidates, a malformed envelope, and mismatched document scope. The original ticket also requires empty extraction, ambiguous statements, same-document contradictions, and boundaries at/above every count and byte cap. Those cases remain absent: no fully empty extraction fixture; no unresolved/ambiguous extraction candidate or same-document contradiction scenario; no prior-candidate 500/501 boundary; and no 1 MiB context or 2 MiB result-envelope byte boundary tests. The existing multibyte overflow case covers the job limit only. |

## Direct remediation regressions

No direct regression in behavior needed to verify the original findings was identified. The required contracts and skills tests/typechecks all passed.

## Decision

CK-001 through CK-003 are resolved and no direct remediation regression was found, but CK-004 remains unresolved against the original ticket's explicit validation matrix. Record `CHANGES_REQUIRED` for IDSER-002 / `IDSER-BATCH-02`. Return control to human/planning authority; this post-CFC verification does not authorize another CFC pass or a new full review.
