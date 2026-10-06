# HMN Authorization: IDSER-004

Ticket: `IDSER-004: Semantic context and result authority`
Batch: `IDSER-BATCH-04`
HMN authorization ID: `HMN-IDSER-004-008`
Invocation: explicit user `hmn` delegation
Current workflow state: `awaiting_review`; the previously authorized CFC cycle has not produced a remediation checkpoint or a CK handoff.

Frozen ticket reference: `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-004-semantic-context-and-result-authority.md`
Current HEAD: `301c71eb18b387026931fb695dfe391096dad235` (`test(idser): prove semantic failure atomicity`)
Relevant GO commit: `4c2ba356dfe760b3bcfc6c94d017c767d1444b72`
Relevant CK artifact: `project's goal/feedback/IDSER-BATCH-04-301c71e-verification.md` (`CHANGES_REQUIRED`, CK-004 open)
Relevant CFC commit: `301c71eb18b387026931fb695dfe391096dad235` (cycle 5; consumed `HMN-IDSER-004-005`)
Prior HMN authorization: `HMN-IDSER-004-007` (`CONTINUE_CURRENT_CFC`); the implementation authority it confirmed, `HMN-IDSER-004-006`, remains active and unconsumed
Worktree state: no tracked modifications and no new IDSER-004 CFC/CK artifact. Pre-existing untracked planning and feedback artifacts remain outside this decision and must be preserved.

## Diagnosis

The frozen ticket remains `awaiting_review` and CK-004 remains the latest open,
ticket-bound evidence gap. No remediation commit, partial tracked remedy, or newer CK
verification follows `HMN-IDSER-004-006` or the prior continuation record. The
existing authorization already permits one precise evidence-only CFC remediation.

No changed repository evidence permits or requires a second remediation cycle. A new
CFC authorization would overlap the still-active one and would not be justified by a
post-remediation CK event.

## Ticket-authority trace

- CK-004 requires cancelled-execution, byte-boundary, atomic rollback, genuine
  completion/failure race, and conflicting-concurrent-completion evidence.
- Those items are frozen-ticket validation requirements, not a design or policy
  decision.
- `HMN-IDSER-004-006` authorizes exactly those changes, and `HMN-IDSER-004-007`
  already confirmed continuation without broadening that scope.

## Decision

`CONTINUE_CURRENT_CFC`

Continue the existing CFC authorization `HMN-IDSER-004-006`. This invocation records
the unchanged continuation state only; `HMN-IDSER-004-008` neither adds an independent
cycle nor replaces the authorization that CFC must consume.

## Authorized scope

1. Complete only the CK-004 evidence scenarios enumerated in
   `IDSER-004-hmn-006.md`.
2. Preserve all production authority and previously accepted contracts; changes are
   limited to the required tests, fixtures, and validation evidence.
3. Commit one bounded remediation that consumes `HMN-IDSER-004-006`, then return the
   checkpoint to CK.

## Required validation

- Run the Compose build and migrations, DB semantic-authority suite, Core route tests
  and typecheck, DB typecheck, app build, and `git diff --check` on the remediation.
- Record the CK-004 scenarios, commands, outcomes, counts/skips, and limitations in
  the CFC checkpoint.

## Forbidden work

- Do not alter scope, acceptance criteria, production authority/route/credential/
  selection/completion contracts, database schema beyond minimal test fixtures, or
  downstream behavior.
- Do not create a further CFC cycle, return to GO, or modify the pre-existing
  untracked artifacts.

## Handoff

CFC continues `HMN-IDSER-004-006`, makes its one bounded evidence-remediation commit,
keeps the ticket `awaiting_review`, and hands the precise commit to CK. No new CFC
authority is issued by this record.

Expected next command: `cfc IDSER-004`
