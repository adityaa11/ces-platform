# HMN Authorization: IDSER-008

Ticket: IDSER-008: Bundle completion and failure lifecycle
Batch: IDSER-BATCH-08
HMN authorization ID: HMN-IDSER-008-002
Invocation: explicit user `hmn` delegation
Current workflow state: initial implementation remains incomplete; ticket is not eligible for `awaiting_review`.

Frozen ticket reference: `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-008-bundle-completion-and-failure-lifecycle.md`
Current HEAD: `4fa28d44eba6fcf8bc0cf3d7b9419e82c3c758bc`
Relevant GO commit: none
Relevant CK artifact: none
Relevant CFC commit: none
Prior HMN authorization: `HMN-IDSER-008-001` (`project's goal/feedback/IDSER-008-hmn-001.md`)
Worktree state: dirty with uncommitted IDSER-008 migration, completion-gate, failure-lifecycle, and integration-test work; unrelated pre-existing changes are also present and must be preserved.

## Diagnosis

IDSER-007 is `PASS` at `c890410`, so the predecessor gate is clear. IDSER-008 still has neither a recorded GO checkpoint nor a CK finding/CFC checkpoint. Its active work is therefore bounded initial GO work, not a post-review remediation.

The former apparent GO blocker was reproduced and isolated. The one-off Compose runner had been rebuilt from the worktree while the long-running `atlas` service still ran an older image. The restarted worker then received a rejected semantic-context handoff, exhausted its retries, and left the pg-boss job failed. After rebuilding and recreating the persistent `atlas` service from the same worktree revision, the identical reconciliation acceptance scenario passed. The semantic-authority Compose test and migration check also pass with the uncommitted work.

The migration runner currently enumerates `0018` and `0020` but omits committed predecessor migration `0019`; the existing development database masks this because `0019` is already recorded as applied. This remains relevant initial-GO migration/evidence work, not a new acceptance criterion or a reason to open CFC.

## Ticket-authority trace

- The IDSER-008 lifecycle and completion-gate rules require an atomic review-ready transition and durable recoverable technical failure without stale regression.
- Its Validation section requires focused Core/DB/Bridge Compose integration, including completion integrity and failure/recovery behavior.
- The ticket review checkpoint requires proven integrity and no premature advancement before any first CK handoff.

## Decision

`RETURN_TO_GO`

There is no committed initial implementation checkpoint and no applicable CK finding. The uncommitted changes and remaining migration/Compose evidence belong to the frozen initial implementation. The refreshed Compose result removes the stale-service diagnosis; it does not establish ticket completion.

## Authorized scope

Resume and complete the frozen IDSER-008 implementation and its required evidence only. Preserve the uncommitted completion-gate and failure-lifecycle work that has now been exercised, while resolving ticket-bound migration/composition defects exposed by that work. Keep all IDSER-007 proven rows and unrelated worktree changes intact.

## Required validation

Use the ticket-required Compose environment with mutually consistent service and runner revisions. Record the ticket-required atomic completion, technical-failure/recovery, race, corruption, and authority-boundary evidence before any checkpoint.

## Forbidden work

Do not move IDSER-008 to `awaiting_review`, create a GO checkpoint, start CK or CFC, weaken required lifecycle proof, redesign resolved predecessor behavior, change queue/grant policy, or alter downstream/Master authority surfaces. Do not modify unrelated user changes.

## Handoff

Expected next command: `go IDSER-008`

GO must finish the bounded initial implementation and evidence, then create the first IDSER-008 checkpoint for CK.
