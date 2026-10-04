# Verification: SEMIR-001 / SEMIR-BATCH-01

- Ticket / batch: `project's goal/Backend_Phase/tickets/IR_Test_Phase/SEMIR-001-semantic-qualification-corpus.md` / `SEMIR-BATCH-01`
- Verified remediation commit: `8e865a9ce0cde931ad51acff5603c9b748de552d`
- Remediation base: `68a474cce430996a1077971752345ac38ffbc5ea`
- Original CK artifact: `project's goal/feedback/SEMIR-BATCH-01-68a474c-review.md`
- CFC checkpoint: `project's goal/feedback/SEMIR-BATCH-01-68a474c-cfc-checkpoint.md`
- Frozen ticket reference: SEMIR-001 at the verified commit; state `awaiting_review`.
- Result: `PASS`

## Verification scope

This is a post-CFC verification of only the original frozen clauses `CK-001.a`, `CK-001.b`, and `CK-002.a`, the `68a474c..8e865a9` remediation diff, their required evidence, and direct regressions introduced by that remediation. It is not a new broad review.

## Evidence

- `8e865a9` changes only the CFC checkpoint and `scripts/semantic-ir-v0/{README.md,check-semir-001-corpus.mjs,semir-001-corpus.mjs}`. There are no tracked working-tree changes in those reviewed paths.
- `node scripts/semantic-ir-v0/check-semir-001-corpus.mjs` passed: `43 human-authored cases, 11 coverage families, 50 §13 member expectations, A–E contrasts, proposition/evidence expectations, zero provider calls`.
- `git diff --check 68a474c 8e865a9` passed with no whitespace errors.
- The remediation retains isolated fixture/checker-only scope: static inspection of its diff finds no Semantic IR schema, extraction implementation, canonicalization, production contract, `NormalizedDocument v1`, provider integration, or provider configuration change.

## Frozen finding closure verification

| Original finding | Clause | Status | Expected state | Actual state and evidence | Direct-regression result |
| --- | --- | --- | --- | --- | --- |
| CK-001 | CK-001.a | RESOLVED | Authorized stable-ID coverage exists for `definition`, `missing scope`, and `ambiguous attachment`, and the checker asserts those mappings. | Cases `SEMIR-001-041`–`043` respectively provide those members; `requiredMembers` maps each to its stable ID; the checker passed. | No regression: mandatory A–E cases remain and the diff adds no provider, schema, extraction, or production behavior. |
| CK-001 | CK-001.b | RESOLVED | Deterministic validation proves the complete §13 member map and distinct semantic expectations for A–E contrasts. | The checker iterates `requiredMembers` and asserts distinct dimension signatures for contrast sets A–E; its executed output reports 50 §13 member expectations and A–E contrasts. | No regression: prior stable-ID, authorization, disposition/context, nested-modality, multi-proposition, and `needs_review` checks remain present and passed. |
| CK-002 | CK-002.a | RESOLVED | Applicable fixtures contain human-authored semantic proposition and source-grounded evidence expectations; cases 023, 024, and 034 retain more than one proposition; no serialized-IR/extraction/canonicalization/provider content is introduced. | Every fixture has `evidenceExpectations` tied to its source ID and source-text quote; semantic cases have `propositions`; the checker explicitly verifies multi-proposition cases 023, 024, and 034. The executed check passed, and the remediation diff remains corpus-only. | No regression: source authorization, source disposition/context classification, unresolved meaning, and prohibited interpretations are preserved. |

## Scope-change observations

None. The verification found no unresolved frozen oracle, direct remediation regression, or ticket-authority issue.

## Decision

All original frozen CK clauses are proven against their existing closure oracles, and no direct regression was introduced by the bounded remediation. SEMIR-001 is `PASS`; SEMIR-002's documented dependency gate is now satisfied.
