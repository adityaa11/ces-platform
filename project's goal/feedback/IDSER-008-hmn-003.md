# HMN Authorization: IDSER-008

Ticket: IDSER-008 — Bundle completion and failure lifecycle
Batch: IDSER-BATCH-08
HMN authorization ID: HMN-IDSER-008-003
Invocation: explicit user `hmn` delegation
Current workflow state: first CK review returned `CHANGES_REQUIRED`; one bounded CFC cycle is authorized.

Frozen ticket reference: `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-008-bundle-completion-and-failure-lifecycle.md`
Current HEAD: `243f33e885d8df6739533cccfefe5e45001e39cf` (`feat(idser): complete bundle lifecycle`)
Relevant GO commit: `243f33e885d8df6739533cccfefe5e45001e39cf` (`feat(idser): complete bundle lifecycle`)
Relevant CK artifact: `project's goal/feedback/IDSER-BATCH-08-243f33e-review.md`
Relevant CFC commit: none
Prior HMN authorization: `HMN-IDSER-008-002` (`RETURN_TO_GO`), consumed by the GO checkpoint
Worktree state: no uncommitted change touches the authorized perception-worker, completion-gate, or named acceptance-test paths. Existing generated/build changes and untracked workflow artifacts are unrelated and must be preserved.

## Diagnosis

The committed GO checkpoint at `243f33e` was reviewed by the first CK artifact,
which returned `CHANGES_REQUIRED`. Its frozen matrix identifies `CK-001.a`,
`CK-001.b`, and `CK-001.c` as unresolved with objective mismatches, binary
closure oracles, and direct ticket traces. No CFC checkpoint, later CK event,
or in-scope partial remediation exists to continue. The CK review records no
scope-change observation, and repository evidence does not require a product,
provider, runtime, deployment, architecture, or policy decision.

## Ticket-authority trace

| Clause | Frozen ticket authority | Current state |
|---|---|---|
| CK-001.a | IDSER-008 Lifecycle rules; AC-28/29; validation of delayed availability and recovery within the existing BSS-006/BSS-009 boundaries | Unresolved in the first CK review. |
| CK-001.b | IDSER-008 mandatory completion gate conditions 7-9 and 11; AC-23/31; isolated fixture validation | Unresolved in the first CK review. |
| CK-001.c | IDSER-008 Lifecycle rules and Validation; AC-28/29/31/32; REV-READY-IDSER-008-02 | Unresolved in the first CK review. |
| RC-003 | IDSER-008 AC-31/32; REV-READY-IDSER-008-03; mandatory gate conditions 11-12 | Proven by CK; protected from redesign. |

## Decision

`AUTHORIZE_NEXT_CFC` — open exactly one bounded remediation cycle for the
three unresolved frozen clauses in the latest CK artifact. This authorization
is newer than the CK event it addresses; it neither changes the ticket nor
authorizes a broader review.

## Authorized scope

Authorize CFC only for `CK-001.a`, `CK-001.b`, and `CK-001.c` in
`project's goal/feedback/IDSER-BATCH-08-243f33e-review.md`. That CK artifact
remains the sole source of the defects, closure oracles, repair targets, and
validation evidence. One committed remediation checkpoint may consume this
authorization only by citing `HMN-IDSER-008-003`.

## Required validation

Perform and record only the validation required by the referenced frozen CK
clauses. The CFC checkpoint must map every authorized clause to its evidence
and executed required command, and it may hand off to CK only after every
frozen closure oracle passes.

## Forbidden work

- Do not redesign or reopen proven `RC-003`, its Master/candidate-only
  authority boundary, or accepted IDSER-003 through IDSER-007 predecessor work.
- Do not expand the frozen matrix, add acceptance conditions, substitute a
  different harness, or elevate diagnostic probes into ticket requirements.
- Do not change queue/grant policy, introduce another recovery service, alter
  downstream/Master authority surfaces, or begin IDSER-009 work.
- Do not modify unrelated user worktree changes.

## Handoff

CFC may make one bounded remediation commit for `CK-001.a`, `CK-001.b`, and
`CK-001.c`, citing this authorization and the latest CK artifact. Once that
checkpoint is ready for review, it is awaiting CK. Any later unresolved
post-CFC CK result requires a fresh explicit user `hmn` invocation.

Expected next command: `cfc IDSER-008`
