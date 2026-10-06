# HMN Authorization: IDSER-008

Ticket: IDSER-008 — Bundle completion and failure lifecycle
Batch: IDSER-BATCH-08
HMN authorization ID: HMN-IDSER-008-005
Invocation: explicit user `hmn` delegation
Current workflow state: post-CFC CK verification returned `CHANGES_REQUIRED`; one additional bounded evidence-remediation cycle is authorized.

Frozen ticket reference: `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-008-bundle-completion-and-failure-lifecycle.md`
Current HEAD: `8e0abcadb7c8f882ec2d28a50f7eb26656776892` (`fix(idser): prove restarted reconciliation recovery`)
Relevant GO commit: `243f33e885d8df6739533cccfefe5e45001e39cf` (`feat(idser): complete bundle lifecycle`)
Relevant CK artifact: `project's goal/feedback/IDSER-BATCH-08-8e0abca-verification.md`
Relevant CFC commit: `8e0abcadb7c8f882ec2d28a50f7eb26656776892` (`fix(idser): prove restarted reconciliation recovery`)
Prior HMN authorization: `HMN-IDSER-008-004`, consumed by `IDSER-BATCH-08-cfc-remediation-2.md`
Worktree state: `HEAD` is the reviewed remediation commit. Existing modified generated/build files and untracked workflow artifacts are unrelated user work and must be preserved.

## Diagnosis

The committed CFC remediation consumed `HMN-IDSER-008-004` and completed its CK handoff. The latest bounded verification returned `CHANGES_REQUIRED` only for the original frozen `CK-001.b` and `CK-001.c`; `CK-001.a` is resolved. The verification records objective, ticket-traceable missing observations and no new finding, review-contract gap, direct regression, architecture decision, or scope-change decision. The current completion fixture already exercises the same completion transaction and has an active-stage probe, but sets that probe to `failed`; changing it to a real `queued` or `running` active-version state is a production-valid fixture/proof correction. The remaining named worker scenarios are likewise ticket-required Compose proof gaps. If their execution exposes a production defect, the frozen ticket permits only the minimum causal code correction needed to make that existing behavior true.

This is not `CONTINUE_CURRENT_CFC`: the prior cycle has a committed checkpoint, its authorization is consumed, and CK has returned control to HMN.

## Ticket-authority trace

| Clause | Frozen ticket authority | Current state |
|---|---|---|
| `CK-001.a` | IDSER-008 lifecycle retry/recovery rules; AC-28/29 | Resolved by `IDSER-BATCH-08-8e0abca-verification.md`; protected from redesign. |
| `CK-001.b` | IDSER-008 mandatory completion gate condition 10; AC-23/31; isolated DB-fixture validation | Unresolved only for its frozen queued/running active-version-stage proof. |
| `CK-001.c` | IDSER-008 lifecycle rules and Validation; AC-28/29/31/32; REV-READY-IDSER-008-02 | Unresolved only for the named Compose worker proof observations recorded by the latest CK verification. |
| `RC-003` | IDSER-008 AC-31/32; REV-READY-IDSER-008-03 | Previously proven and protected. |

## Decision

`AUTHORIZE_EVIDENCE_REMEDIATION` — open exactly one new bounded CFC cycle for the unresolved original frozen clauses `CK-001.b` and `CK-001.c` in the latest CK artifact. This authorization is newer than the CK event it addresses. It does not amend the frozen ticket, original closure matrix, or either oracle.

## Authorized scope

Authorize CFC only for `CK-001.b` and `CK-001.c` in `project's goal/feedback/IDSER-BATCH-08-8e0abca-verification.md`, with the original frozen matrix at `IDSER-BATCH-08-243f33e-review.md` remaining the sole source of closure criteria.

- `CK-001.b`: demonstrate final reconciliation rejection using a real `queued` or `running` active-version semantic stage, with the frozen transaction/rollback proof.
- `CK-001.c`: add the missing real Compose worker observations for perception retry exhaustion; delayed source or delivery crossing grant expiry with the ticket-required bounded terminal/recovery behavior; accepted-completion versus failure races for perception and reconciliation; and retain the already-passing restart, replay, and race evidence.

Production-valid fixture and test changes against the existing implementation are authorized. A production correction is authorized only if implementing one of those exact scenarios exposes a defect, and then only to the minimum extent causally necessary for the frozen behavior to hold.

## Required validation

Perform and record only the Compose worker and completion-transaction validation required by the referenced frozen clauses. The CFC checkpoint must map each authorized clause to its evidence and executed required command, and may hand off only after every selected frozen oracle passes. It must retain the existing passing restart/replay/race evidence rather than substituting mocked, unit, or in-process proof.

## Forbidden work

- Do not reopen or redesign `CK-001.a`, except for an unavoidable non-semantic shared-fixture dependency; preserve its resolved recovery proof.
- Do not weaken, rewrite, or replace either frozen CK oracle or its Compose worker proof with mocked or in-process proof.
- Do not remove or dilute the named race, restart, expiry, or failure scenarios, and do not expand their requirements beyond the frozen clauses.
- Do not redesign the lifecycle, change queue or grant policy, add a recovery service, introduce architecture or security work, refactor unrelated code, reopen predecessors, alter Master/downstream authority, or begin IDSER-009.
- Do not modify unrelated user worktree changes.

## Handoff

CFC may make one bounded remediation commit for `CK-001.b` and `CK-001.c`, citing `HMN-IDSER-008-005` and the latest CK artifact. After its committed checkpoint is ready for review, the ticket remains `awaiting_review` for CK. Any later unresolved post-CFC CK result requires a fresh explicit user `hmn` invocation.

Expected next command: `cfc IDSER-008`
