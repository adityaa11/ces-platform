# HMN Authorization: IDSER-008

Ticket: IDSER-008 — Bundle completion and failure lifecycle
Batch: IDSER-BATCH-08
HMN authorization ID: HMN-IDSER-008-004
Invocation: explicit user `hmn` delegation
Current workflow state: post-CFC CK verification returned `CHANGES_REQUIRED`; one new bounded CFC cycle is authorized.

Frozen ticket reference: `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-008-bundle-completion-and-failure-lifecycle.md`
Current HEAD: `fe41a3589f1b36fa62eff175ad9fb259a9ebb7dc` (`fix(idser): close bundle lifecycle feedback`)
Relevant GO commit: `243f33e885d8df6739533cccfefe5e45001e39cf` (`feat(idser): complete bundle lifecycle`)
Relevant CK artifact: `project's goal/feedback/IDSER-BATCH-08-fe41a35-verification.md`
Relevant CFC commit: `fe41a3589f1b36fa62eff175ad9fb259a9ebb7dc` (`fix(idser): close bundle lifecycle feedback`)
Prior HMN authorization: `HMN-IDSER-008-003`, consumed by the CFC checkpoint
Worktree state: an uncommitted change touches `apps/agents-bridge/tests/perception-negative.integration.test.ts`; generated/build changes and untracked workflow artifacts are also present. The prior CFC has already committed and handed off to CK, so this work cannot continue that consumed cycle. Preserve all existing worktree changes.

## Diagnosis

The CFC remediation at `fe41a35` consumed `HMN-IDSER-008-003` and was
reviewed by the bounded CK verification. That verification returns
`CHANGES_REQUIRED` solely for original frozen `CK-001.a`, `CK-001.b`, and
`CK-001.c`; it identifies no supplemental finding or scope change. The
verification records objective residual mismatches for each original clause
and a direct candidate/evidence-integrity regression within `CK-001.b` caused
by the reviewed CFC diff. This is not `CONTINUE_CURRENT_CFC`: the previous
cycle has a committed checkpoint and a completed CK handoff. The frozen ticket
and verification identify a repairable, ticket-bound continuation without a
product, provider, runtime, deployment, architecture, policy, or predecessor
reopening decision.

## Ticket-authority trace

| Clause | Frozen ticket authority | Current state |
|---|---|---|
| CK-001.a | IDSER-008 Lifecycle rules; AC-28/29; validation within the existing BSS-006/BSS-009 retry and recovery boundaries | Unresolved in `IDSER-BATCH-08-fe41a35-verification.md`. |
| CK-001.b | IDSER-008 mandatory completion gate conditions 7-9 and 11; AC-23/31; isolated fixture validation | Unresolved in `IDSER-BATCH-08-fe41a35-verification.md`; includes the direct remediation regression recorded there. |
| CK-001.c | IDSER-008 Lifecycle rules and Validation; AC-28/29/31/32; REV-READY-IDSER-008-02 | Unresolved in `IDSER-BATCH-08-fe41a35-verification.md`. |
| RC-003 | IDSER-008 AC-31/32; REV-READY-IDSER-008-03; mandatory gate conditions 11-12 | Previously proven and unaffected; protected from redesign. |

## Decision

`AUTHORIZE_NEXT_CFC` — open exactly one new bounded remediation cycle for
`CK-001.a`, `CK-001.b`, and `CK-001.c` in the latest CK artifact. This
authorization is newer than the verification it addresses and does not amend
the ticket, the original frozen matrix, or the closure oracles.

## Authorized scope

Authorize CFC only for `CK-001.a`, `CK-001.b`, and `CK-001.c` in
`project's goal/feedback/IDSER-BATCH-08-fe41a35-verification.md`. That
verification and the original frozen CK artifact remain the sole sources of
the residual mismatches, closure oracles, repair targets, and validation
evidence. One committed remediation checkpoint may consume this authorization
only by citing `HMN-IDSER-008-004`.

## Required validation

Perform and record only the validation required by the referenced frozen CK
clauses. The CFC checkpoint must map every authorized clause to its evidence
and executed required command, and it may hand off to CK only after every
frozen closure oracle passes.

## Forbidden work

- Do not redesign or reopen proven `RC-003`, its Master/candidate-only
  authority boundary, or accepted IDSER-003 through IDSER-007 predecessor work.
- Do not expand the frozen matrix, add acceptance conditions, replace the
  required harness, or elevate diagnostic probes into ticket requirements.
- Do not change queue/grant policy, introduce another recovery service, alter
  downstream/Master authority surfaces, or begin IDSER-009 work.
- Do not modify unrelated user worktree changes.

## Handoff

CFC may make one bounded remediation commit for `CK-001.a`, `CK-001.b`, and
`CK-001.c`, citing this authorization and the latest CK artifact. After the
committed checkpoint is ready for review, it is awaiting CK. Any later
unresolved post-CFC CK result requires a fresh explicit user `hmn` invocation.

Expected next command: `cfc IDSER-008`
