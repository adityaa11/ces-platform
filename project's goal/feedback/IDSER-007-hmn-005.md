# HMN Authorization: IDSER-007

Ticket: IDSER-007 — Bounded reconciliation and procedural advancement
Batch: IDSER-BATCH-07
HMN authorization ID: HMN-IDSER-007-005
Invocation: explicit user `hmn` delegation
Current workflow state: post-CFC verification at `e8d3851` resolved every original frozen clause and returned `REVIEW_CONTRACT_GAP`; the recorded planning decision now authorizes a supplemental CK contract-boundary freeze only.

Frozen ticket reference: `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-007-bounded-reconciliation-and-procedural-advancement.md`
Current HEAD: `e8d3851a491b9ece4419216a848524c1dfe15c28` (`fix(idser): prove residual reconciliation clauses`)
Relevant GO commit: `f16a7ab2317fe04b1c5aae89efdcdc9256f1d850` (`feat(idser): add bounded reconciliation advancement`)
Relevant CK artifact: `project's goal/feedback/IDSER-BATCH-07-e8d3851-verification.md`
Relevant CFC commit: `e8d3851a491b9ece4419216a848524c1dfe15c28`
Prior HMN authorization: `HMN-IDSER-007-004` (`HUMAN_DECISION_REQUIRED`), resolved by `project's goal/feedback/Planning decision for IDSER-007 \`RE.md`
Worktree state: the reviewed remediation target is committed. Existing generated/build edits and untracked workflow artifacts are unrelated and remain preserved; they do not alter this authorization.

## Diagnosis

The latest bounded CK verification proves CK-001.a, CK-003.a, and CK-003.d,
while retaining CK-002.a, CK-003.b, and CK-003.c as protected resolved rows.
No direct remediation regression remains. Its sole remaining item is a
`REVIEW_CONTRACT_GAP`: the original matrix omitted the ticket's explicit
Validation observations for concurrent distinct bundles/users and an actual
Compose-worker restart.

The recorded planning decision resolves the authority question. It establishes
that these are pre-existing ticket requirements, not new acceptance criteria,
and directs a supplemental frozen CK closure boundary for those two
observations only. It expressly prohibits reopening, renumbering, or
strengthening the original matrix.

## Ticket-authority trace

| Item | Authority / evidence | State |
|---|---|---|
| CK-001.a, CK-003.a, CK-003.d | Original frozen matrix and `IDSER-BATCH-07-e8d3851-verification.md` | Resolved; protected from reopening. |
| CK-002.a, CK-003.b, CK-003.c | Original frozen matrix and post-CFC verification | Previously resolved; protected from reopening. |
| Distinct-bundle/distinct-user concurrency | IDSER-007 `Validation`; `Planning decision for IDSER-007 \`RE.md` | Ticket-authorized observation omitted from the original matrix; supplemental CK freeze authorized. |
| Actual Compose-worker restart | IDSER-007 `Validation`; `Planning decision for IDSER-007 \`RE.md` | Ticket-authorized observation omitted from the original matrix; supplemental CK freeze authorized. |

## Decision

`RETURN_TO_CK` — perform the planning-authorized supplemental
review-contract-gap freeze. This is not a new broad review, an implementation
checkpoint review, or a CFC authorization.

## Authorized scope

CK may create one supplemental IDSER-007 review-contract-gap artifact derived
directly from the frozen ticket's `Validation` authority. It may freeze exactly
two supplemental unresolved closure clauses: the required real DB/queue Compose
evidence for concurrent distinct bundles/users, and the required actual
worker-restart evidence at the ticket-required worker/Compose boundary.

The supplemental artifact must state that it repairs an omission in the
original review contract. It must preserve all existing CK-001, CK-002, and
CK-003 clause identifiers, findings, evidence, and resolved status unchanged.

## Required validation

This CK handoff is limited to freezing objective closure oracles and evidence
expectations traceable to those two existing ticket requirements. It must not
claim either supplemental clause proven, perform a new implementation review,
or assess unrelated IDSER-007 requirements. After the supplemental clauses are
frozen, return control to human/HMN authority for any later evidence-remediation
decision.

## Forbidden work

- Do not alter, reopen, renumber, or strengthen the historical original CK matrix.
- Do not add any IDSER-007 requirement beyond the two planning-authorized omitted observations.
- Do not authorize or begin CFC work; a later explicit `hmn IDSER-007` is required before an evidence-remediation cycle.
- Do not redesign resolved implementation or evidence, modify accepted dependencies, alter ticket scope, or claim `PASS`.

## Handoff

CK must write the supplemental review-contract-gap artifact only, using the
two planning-authorized observations as its bounded target. On completion,
IDSER-007 remains `awaiting_review` and returns to human/HMN authority. A
subsequent explicit HMN invocation may decide whether to authorize one bounded
`AUTHORIZE_EVIDENCE_REMEDIATION` cycle for the exact supplemental clause IDs.

Expected next command: `ck IDSER-007`
