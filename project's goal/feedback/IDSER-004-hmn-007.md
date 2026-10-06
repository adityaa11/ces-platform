# HMN Authorization: IDSER-004

Ticket: `IDSER-004: Semantic context and result authority`
Batch: `IDSER-BATCH-04`
HMN authorization ID: `HMN-IDSER-004-007`
Invocation: explicit user `hmn` delegation
Current workflow state: `awaiting_review`; an unconsumed CFC authorization remains active and no newer implementation or CK checkpoint exists.

Frozen ticket reference: `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-004-semantic-context-and-result-authority.md`
Current HEAD: `301c71eb18b387026931fb695dfe391096dad235` (`test(idser): prove semantic failure atomicity`)
Relevant GO commit: `4c2ba356dfe760b3bcfc6c94d017c767d1444b72`
Relevant CK artifact: `project's goal/feedback/IDSER-BATCH-04-301c71e-verification.md` (`CHANGES_REQUIRED`, CK-004 open)
Relevant CFC commit: `301c71eb18b387026931fb695dfe391096dad235` (cycle 5; consumed `HMN-IDSER-004-005`)
Prior HMN authorization: `HMN-IDSER-004-006` (`AUTHORIZE_EVIDENCE_REMEDIATION`), active and unconsumed
Worktree state: no tracked modifications since the CK verification. Pre-existing untracked planning and feedback artifacts, including prior HMN records, remain outside this decision and must be preserved.

## Diagnosis

The latest CK verification returned `CHANGES_REQUIRED` for CK-004 only. In response,
`HMN-IDSER-004-006` already authorized exactly one evidence-only CFC cycle covering
cancelled execution; precise streamed request and serialized-response boundaries;
transaction rollback after provisional accepted-state work; genuinely concurrent
completion/failure races; and conflicting concurrent completion delivery.

There is no subsequent remediation commit, partial tracked remediation, new CK result,
or changed ticket authority. The prior authorization is therefore still the only valid
bounded implementation authority. Issuing another CFC authorization would create an
overlapping cycle without a new verification event to justify it.

## Ticket-authority trace

- IDSER-004 validation explicitly requires cancellation rejection, byte-boundary
  checks, no partial accepted state after handler/enqueue failure, concurrent
  success/failure races, and concurrent acceptance claims.
- `IDSER-BATCH-04-301c71e-verification.md` identifies those gaps as CK-004 and no
  production defect, scope change, or architecture/policy decision.
- `IDSER-004-hmn-006.md` authorizes precisely those test/evidence repairs and directs
  the committed remediation back to CK.

## Decision

`CONTINUE_CURRENT_CFC`

Continue the already-authorized CFC cycle under `HMN-IDSER-004-006`. This record
confirms the continuation after the explicit HMN invocation; it does not open a second
CFC cycle, broaden the scope, or supersede the still-active authorization.

## Authorized scope

1. Complete only the CK-004 test/evidence scenarios enumerated in
   `HMN-IDSER-004-006.md`.
2. Preserve the existing production authority, credentials, selection port, cache
   binding, migrations, contracts, and prior evidence.
3. Make one bounded remediation commit that records consumption of
   `HMN-IDSER-004-006`; this continuation record is not an additional authorization to
   consume.

## Required validation

- Run the authoritative Compose build and migrations, registered DB
  semantic-authority suite, Core route tests and typecheck, DB typecheck, app build,
  and `git diff --check` against the final remediation commit.
- Record each CK-004 scenario, commands, outcomes, counts/skips, and environment
  limitations in the CFC checkpoint.

## Forbidden work

- Do not change ticket scope, acceptance criteria, production authority design,
  credential/route/selection/completion contracts, database schema except minimal
  test fixtures, browser boundary, provider/runtime/deployment policy, or
  downstream-ticket behavior.
- Do not begin another CFC cycle, overwrite/stage/commit/delete the pre-existing
  untracked artifacts, or return work to GO.

## Handoff

CFC continues the active `HMN-IDSER-004-006` evidence-remediation cycle, makes one
bounded commit, retains `awaiting_review`, and returns that exact checkpoint to CK.

Expected next command: `cfc IDSER-004`
