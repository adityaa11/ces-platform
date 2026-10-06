# HMN Authorization: IDSER-007

Ticket: IDSER-007 — Bounded reconciliation and procedural advancement
Batch: IDSER-BATCH-07
HMN authorization ID: HMN-IDSER-007-002
Invocation: explicit user `hmn` delegation
Current workflow state: initial GO implementation remains uncommitted and planned; a predecessor test-harness failure blocks the GO workflow's requested regression gate.

Frozen ticket reference: `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-007-bounded-reconciliation-and-procedural-advancement.md`
Current HEAD: `266f5a33d9d141a04a6558fe18b06ea3d9f50920` (`test(idser): complete extraction CFC evidence`)
Relevant GO commit: none
Relevant CK artifact: none for IDSER-007; `project's goal/feedback/IDSER-BATCH-06-266f5a3-verification.md` records IDSER-006 `PASS`
Relevant CFC commit: none for IDSER-007; IDSER-006 remediation is `266f5a3`
Prior HMN authorization: `HMN-IDSER-007-001` (`RETURN_TO_GO`)
Worktree state: IDSER-007 implementation and test paths remain uncommitted, alongside unrelated generated, build, and workflow artifacts. The reported blocker is in the committed IDSER-006 extraction-acceptance test; no IDSER-007 checkpoint has been committed or reviewed.

## Diagnosis

The reported Compose command was reproduced at the current HEAD. Its first
IDSER-006 test fails at
`packages/atlas-db/tests/extraction-acceptance.integration.test.ts:139` because
`assert.deepStrictEqual` compares PostgreSQL's `Result(1)` object with the
plain-array snapshot captured before a conflicting delivery. The output shows
the same persisted record values; the mismatch is the Node 24/runtime result
container, not an IDSER-007 behavior or validation mismatch.

IDSER-006's post-CFC CK verification recorded this exact test command as
passing and issued `PASS` at `266f5a3`. IDSER-007 depends on that approved
predecessor and names its own Compose, PostgreSQL/queue, concurrency, and
query-plan evidence. It does not authorize modifying an approved IDSER-006
test harness, and no IDSER-007 CK finding exists from which CFC could derive
such authority.

## Ticket-authority trace

| Area | Authority | State |
|---|---|---|
| IDSER-006 predecessor closure | `IDSER-BATCH-06-266f5a3-verification.md` | `PASS`; its frozen rows are closed. |
| IDSER-007 initial implementation and its required evidence | IDSER-007 Outcome, Validation, and REV-READY-IDSER-007-01/02/03 | Still GO work; no committed checkpoint. |
| Repair of the Node 24 assertion container mismatch | No IDSER-007 clause or unresolved CK clause | Outside the frozen current-ticket authority. |

## Decision

`HUMAN_DECISION_REQUIRED` — deciding to reopen the approved IDSER-006
checkpoint for a runtime-specific test-harness repair, or to accept its
recorded `PASS` evidence without rerunning that predecessor suite as an
IDSER-007 gate, is a predecessor-scope decision. HMN cannot make either choice
under IDSER-007's frozen authority.

## Authorized scope

No GO or CFC repair is authorized by this record. IDSER-007's frozen initial
implementation scope remains unchanged, but this record does not permit edits
to the approved IDSER-006 test or its evidence artifacts.

## Required validation

No additional validation is authorized until planning authority selects the
predecessor-handling decision. The reproduced failed command and failure
location above are the diagnostic evidence for that decision.

## Forbidden work

- Do not modify `packages/atlas-db/tests/extraction-acceptance.integration.test.ts`
  under IDSER-007 authority.
- Do not reinterpret the predecessor's `PASS` as an IDSER-007 CK finding or
  start CFC without a frozen IDSER-007 clause.
- Do not weaken IDSER-007's ticket-required Compose, PostgreSQL/queue,
  concurrency, or query-plan evidence.
- Do not commit or hand off the current IDSER-007 work as `awaiting_review`
  while the selected regression-gate policy remains unresolved.

## Handoff

Planning authority must choose one bounded path: authorize a separate
predecessor test-harness correction with its own checkpoint/review, or record
that IDSER-006's existing `PASS` evidence remains the dependency closure and
the Node 24 container assertion is not an IDSER-007 completion gate. After
that decision is recorded, return to GO for IDSER-007.

Expected next command: human/planning decision; then `go IDSER-007`
