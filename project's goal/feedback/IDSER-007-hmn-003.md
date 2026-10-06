# HMN Authorization: IDSER-007

Ticket: IDSER-007 — Bounded reconciliation and procedural advancement
Batch: IDSER-BATCH-07
HMN authorization ID: HMN-IDSER-007-003
Invocation: explicit user `hmn` delegation
Current workflow state: post-CFC CK verification at `e4d5cb3` returned `CHANGES_REQUIRED`; one further bounded CFC cycle is authorized for frozen unresolved clauses only.

Frozen ticket reference: `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-007-bounded-reconciliation-and-procedural-advancement.md`
Current HEAD: `e4d5cb34f32a6d67e7599506f5daf34d79852426` (`fix(idser): close reconciliation feedback matrix`)
Relevant GO commit: `f16a7ab2317fe04b1c5aae89efdcdc9256f1d850` (`feat(idser): add bounded reconciliation advancement`)
Relevant CK artifact: `project's goal/feedback/IDSER-BATCH-07-e4d5cb3-verification.md`
Relevant CFC commit: `e4d5cb34f32a6d67e7599506f5daf34d79852426`
Prior HMN authorization: `HMN-IDSER-007-001` (`RETURN_TO_GO`); `HMN-IDSER-007-002` (superseded by the recorded planning decision)
Worktree state: the CFC target is committed. Current dirty build/generated files and untracked workflow artifacts are unrelated to the authorized IDSER-007 remediation and are preserved.

## Diagnosis

The latest verification is a valid bounded post-CFC review. It identifies
objective, ticket-traceable residual mismatches for CK-001.a, CK-003.a, and
CK-003.d in the original frozen matrix. CK-002.a, CK-003.b, and CK-003.c pass
their frozen closure oracles and have no direct regression.

The verification also records `REVIEW_CONTRACT_GAP`: the frozen CK-003.c
oracle omitted the ticket's distinct-user and actual worker-restart proof
dimensions. That omission is reported before this authorization. It is not a
new CFC clause, is not authorized for this cycle, and prevents a later final
completion claim until planning authority resolves it. It does not alter the
three existing frozen residual clauses or require reopening the closed
IDSER-006 dependency.

## Ticket-authority trace

| Item | Frozen authority / evidence | State |
|---|---|---|
| CK-001.a | IDSER-007 neighborhood byte-limit and bounded-prior omission obligation; `IDSER-BATCH-07-e4d5cb3-verification.md` | Unresolved and authorized. |
| CK-003.a | IDSER-007 required relationship semantic cases and proposal preservation; latest verification | Unresolved and authorized. |
| CK-003.d | IDSER-007 representative actual retrieval query-plan/index evidence; latest verification | Unresolved and authorized. |
| CK-002.a, CK-003.b, CK-003.c | Original frozen matrix; latest verification | Proven against their frozen oracles; protected from redesign. |
| Review-contract gap | IDSER-007 Validation distinct bundles/users and actual worker restart; latest verification | Ticket-authorized but omitted from the frozen matrix; not CFC authority. |

## Decision

`AUTHORIZE_NEXT_CFC` — open exactly one new, bounded remediation cycle for
CK-001.a, CK-003.a, and CK-003.d. The authorization is newer than the CK event
it addresses. The separately recorded review-contract gap is explicitly
excluded rather than silently added to this cycle.

## Authorized scope

Authorize CFC only for `CK-001.a`, `CK-003.a`, and `CK-003.d` in
`project's goal/feedback/IDSER-BATCH-07-e4d5cb3-verification.md`. That
verification artifact remains the sole source of each residual mismatch,
closure oracle, repair target, and required validation. This authorization is
consumed by one committed remediation checkpoint that cites
`HMN-IDSER-007-003`.

## Required validation

Perform and record only the validation required by the referenced frozen
clauses. The CFC checkpoint must map all three authorized clauses to their
evidence and executed required commands, then become ready for CK only when
each frozen closure oracle passes. The review-contract gap must be retained as
an unresolved planning item, not represented as a passed or newly remediated
CFC clause.

## Forbidden work

- Do not redesign or reopen CK-002.a, CK-003.b, CK-003.c, their proven rows,
  or the closed IDSER-003 through IDSER-006 dependencies.
- Do not add distinct-user or actual worker-restart proof as an implicit fourth
  CFC clause; it requires a separate review-contract-gap decision.
- Do not expand the frozen matrix, change acceptance criteria, substitute a
  different harness, or add accepted-base, precedence, projection, or
  IDSER-008 completion behavior.
- Do not modify unrelated build/generated files or workflow artifacts as part
  of this remediation.

## Handoff

CFC may make one remediation commit for the three authorized frozen clauses,
citing this authorization and the latest CK verification. After a committed
checkpoint is ready for review, it awaits CK. The recorded review-contract gap
remains for planning authority before IDSER-007 can reach final completion;
a later unresolved post-CFC CK result requires another explicit `hmn`
invocation.

Expected next command: `cfc IDSER-007`
