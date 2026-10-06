# HMN Authorization: IDSER-007

Ticket: IDSER-007 — Bounded reconciliation and procedural advancement
Batch: IDSER-BATCH-07
HMN authorization ID: HMN-IDSER-007-001
Invocation: explicit user `hmn` delegation
Current workflow state: planned; no committed IDSER-007 implementation checkpoint or CK finding exists.

Frozen ticket reference: `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-007-bounded-reconciliation-and-procedural-advancement.md`
Current HEAD: `266f5a33d9d141a04a6558fe18b06ea3d9f50920` (`test(idser): complete extraction CFC evidence`)
Relevant GO commit: none
Relevant CK artifact: none
Relevant CFC commit: none
Prior HMN authorization: none
Worktree state: uncommitted changes include IDSER-007 implementation and test paths, alongside unrelated generated, build, and workflow artifacts. No IDSER-007 checkpoint has been committed, handed to CK, or placed under a CFC authorization. All existing worktree changes are preserved.

## Diagnosis

The frozen ticket records `State: planned` and `Implementation checkpoint: Not
started`. Repository evidence contains neither an IDSER-007 GO checkpoint nor
a consolidated CK artifact, frozen finding matrix, prior HMN authorization, or
CFC remediation commit. The current uncommitted implementation cannot be
classified as CFC work because no CK `CHANGES_REQUIRED` result exists and no
CFC cycle is authorized. The immediate predecessor checkpoint is IDSER-006 at
`266f5a3`; it does not create an IDSER-007 remediation obligation.

## Ticket-authority trace

| Review-contract area | Frozen authority | State |
|---|---|---|
| Bounded incoming selection and exact context | IDSER-007 Outcome, Neighborhood selection contract, AC-01/02/06, REV-READY-IDSER-007-01 | Unimplemented and unproven; no GO checkpoint exists. |
| Reconciliation acceptance and proposal preservation | IDSER-007 Result acceptance and advancement, AC-02/03/04, REV-READY-IDSER-007-03 | Unimplemented and unproven; no GO checkpoint exists. |
| Atomic ordered advancement and replay safety | IDSER-007 Result acceptance and advancement, AC-04/05, REV-READY-IDSER-007-02 | Unimplemented and unproven; no GO checkpoint exists. |
| Final-member fail-closed boundary | IDSER-007 Result acceptance and advancement; IDSER-008 ownership | Unimplemented and unproven; preserve the IDSER-008 boundary. |

## Decision

`RETURN_TO_GO` — IDSER-007 has not reached an initial committed implementation
checkpoint and no applicable CK finding requires CFC. GO is authorized to
complete the frozen initial implementation, including assessing the existing
in-scope uncommitted work, without treating it as a remediation cycle.

## Authorized scope

GO may complete only the implementation and validation expressly frozen in
IDSER-007, using its stated dependency interfaces and boundaries. It must
record the initial implementation checkpoint, normalized Review Contract
closure, and required Compose evidence before handing the resulting committed
target to CK. This authorization does not authorize CFC or amend the ticket.

## Required validation

Perform and record the deterministic, boundary, PostgreSQL/queue, concurrency,
and query-plan validation required by IDSER-007's `Validation` section and
mandatory review bindings. The initial GO checkpoint is ready for CK only when
each applicable frozen review-contract row is proven with its required
harness and observations.

## Forbidden work

- Do not treat the uncommitted worktree changes as CFC work or claim a CK
  finding has been closed.
- Do not alter ticket scope, acceptance criteria, numeric bounds, or the
  IDSER-008 final-completion ownership boundary.
- Do not add accepted-base loading, truth selection, projection work, provider
  infrastructure, or unbounded retrieval.
- Do not redesign already approved predecessor behavior except for a direct,
  necessary integration within IDSER-007's frozen scope.

## Handoff

GO should assess and complete the initial IDSER-007 implementation, preserving
unrelated worktree changes. It must commit and document its bounded checkpoint
before CK reviews that target. This HMN record is not a PASS record and does
not authorize a later CFC cycle.

Expected next command: `go IDSER-007`
