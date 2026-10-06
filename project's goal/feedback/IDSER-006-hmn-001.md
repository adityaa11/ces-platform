# HMN Authorization: IDSER-006

Ticket: IDSER-006 — Extraction validation and index materialization
Batch: IDSER-BATCH-06
HMN authorization ID: HMN-IDSER-006-001
Invocation: explicit user `hmn` delegation
Current workflow state: post-CFC CK verification returned `CHANGES_REQUIRED`; one new bounded CFC cycle is authorized.

Frozen ticket reference: `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-006-extraction-validation-and-index-materialization.md`
Current HEAD: `7785b6f19b5cafc78b172aac8946c2a34d66887c` (`test(idser): close extraction acceptance feedback`)
Relevant GO commit: `ee7124d0dcf7d38c3947c66c10d9fab6dba3fd80` (`feat(idser): materialize validated extraction state`)
Relevant CK artifact: `project's goal/feedback/IDSER-BATCH-06-7785b6f-verification.md`
Relevant CFC commit: `7785b6f19b5cafc78b172aac8946c2a34d66887c`
Prior HMN authorization: none
Worktree state: no uncommitted change touches the authorized implementation or acceptance-test paths. Existing unrelated changes and untracked workflow artifacts are preserved.

## Diagnosis

The first bounded CFC pass committed at `7785b6f` and was reviewed by the
post-CFC CK artifact. CK verified that CK-001.c through CK-001.f are resolved
and returned `CHANGES_REQUIRED` only for CK-001.a and CK-001.b. Both residual
clauses are frozen, have objective mismatches recorded by CK, and trace
directly to IDSER-006 validation obligations and AC-03/AC-04. No partial CFC
work exists to continue, and no ticket-scope, product, provider, runtime, or
architecture decision is required.

## Ticket-authority trace

| Clause | Frozen ticket authority | Current state |
|---|---|---|
| CK-001.a | IDSER-006 Validation negative-test list; AC-03 | Unresolved in the post-CFC CK verification. |
| CK-001.b | IDSER-006 AC-04 and Validation concurrent identical/conflicting completion cases | Unresolved in the post-CFC CK verification. |
| CK-001.c | IDSER-006 Scope, AC-02/04, Validation provenance/mapping/reindex | Proven; protected from redesign. |
| CK-001.d | IDSER-006 Scope, Validation shared-hash cache check, REV-READY-IDSER-006-03 | Proven; protected from redesign. |
| CK-001.e | IDSER-006 Scope capped reads, Validation bounded-read tests, AC-06 | Proven; protected from redesign. |
| CK-001.f | IDSER-006 AC-01/05, Validation, REV-READY-IDSER-006-02 | Proven; protected from redesign. |

## Decision

`AUTHORIZE_NEXT_CFC` — open exactly one new, bounded remediation cycle for
the two unresolved frozen clauses in the latest CK artifact. This authorization
is newer than the CK event it addresses and does not authorize a broad
re-review or any new acceptance condition.

## Authorized scope

Authorize CFC only for `CK-001.a` and `CK-001.b` in
`project's goal/feedback/IDSER-BATCH-06-7785b6f-verification.md`. The frozen
CK artifact remains the sole source of each defect, closure oracle, repair
target, and validation evidence. This authorization is consumed by one
committed remediation checkpoint that cites `HMN-IDSER-006-001`.

## Required validation

Perform and record only the validation required by the referenced frozen CK
clauses. The CFC checkpoint must map both authorized clauses to their evidence
and executed required commands, then mark the checkpoint ready for CK only
when both frozen closure oracles pass.

## Forbidden work

- Do not alter or redesign already proven CK-001.c through CK-001.f, their
  resolved Review Contract rows, or unrelated IDSER work.
- Do not expand the frozen matrix, add acceptance criteria, substitute a
  different harness, or treat diagnostic probes as new conditions.
- Do not modify product behavior, provider/runtime/deployment choices,
  architecture, or downstream IDSER-007 work.

## Handoff

CFC may perform one bounded remediation commit for `CK-001.a` and `CK-001.b`,
citing this authorization and the latest CK artifact. After that committed
checkpoint is ready for review, it is awaiting review by CK. Any later
unresolved post-CFC CK result requires a fresh explicit user `hmn` invocation.

Expected next command: `cfc IDSER-006`
