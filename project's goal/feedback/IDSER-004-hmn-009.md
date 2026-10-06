# HMN Authorization: IDSER-004

Ticket: `IDSER-004: Semantic context and result authority`
Batch: `IDSER-BATCH-04`
HMN authorization ID: `HMN-IDSER-004-009`
Invocation: explicit user `hmn` delegation
Current workflow state: post-CFC CK verification remains `CHANGES_REQUIRED`; the unconsumed evidence-only authorization cannot implement the frozen cancellation invariant because it forbids the required production lifecycle migration.

Frozen ticket reference: `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-004-semantic-context-and-result-authority.md`
Current HEAD: `301c71eb18b387026931fb695dfe391096dad235` (`test(idser): prove semantic failure atomicity`)
Relevant GO commit: `4c2ba356dfe760b3bcfc6c94d017c767d1444b72`
Relevant CK artifact: `project's goal/feedback/IDSER-BATCH-04-301c71e-verification.md` (`CHANGES_REQUIRED`, CK-004 open)
Relevant CFC commit: `301c71eb18b387026931fb695dfe391096dad235` (cycle 5; consumed `HMN-IDSER-004-005`)
Prior HMN authorization: `HMN-IDSER-004-008` (`CONTINUE_CURRENT_CFC`), which confirmed the active but unconsumed `HMN-IDSER-004-006`
Worktree state: no tracked IDSER-004 changes. Pre-existing untracked planning and feedback artifacts remain outside this authorization and must be preserved.

## Diagnosis

The frozen ticket requires real rejection of cancelled semantic executions and a
real route/DB cancellation test. The current production constraint in
`0009_idser001_domain_persistence_foundation.sql` limits
`atlas.semantic_execution.lifecycle` to `queued`, `running`, `completed`, and
`failed`; it cannot represent `cancelled`. In addition,
`PostgresSemanticAuthority` does not fail closed for a cancelled execution in all
redeem, completion, and failure paths.

Consequently, a fixture-only cancellation assertion would not prove the required
production invariant. `HMN-IDSER-004-006` was intentionally limited to tests and
fixtures and therefore cannot be consumed for this correction. The lifecycle
constraint and matching fail-closed guards are the smallest implementation change
needed to satisfy the ticket's existing cancellation requirement; they do not add a
new lifecycle policy, provider choice, service, or ticket scope.

## Ticket-authority trace

- IDSER-004 scope requires Atlas to reject stale, expired, completed, **cancelled**,
  mismatched, and unauthorized context requests, and to retain Atlas as lifecycle
  authority.
- IDSER-004 validation requires real route/DB coverage for cancelled executions.
- CK-004 remains open for that cancellation proof together with precise byte-boundary,
  rollback, concurrent completion/failure, and conflicting-completion evidence.
- The current semantic-execution check constraint and authority lifecycle branches
  prevent a valid production cancellation state from being represented and protected.

## Decision

`AUTHORIZE_NEXT_CFC`

Authorize one replacement, bounded CFC cycle. `HMN-IDSER-004-006` and its
continuation records `HMN-IDSER-004-007`/`-008` are superseded without consumption:
no remediation commit was made under them. This authorization is the only active
authority for the next remediation commit and is newer than the CK verification it
addresses.

## Authorized scope

1. Add one additive IDSER-004 migration that replaces only the
   `atlas.semantic_execution.lifecycle` check constraint so it additionally permits
   `cancelled`; register that exact migration in the repository migration runner.
2. Make the smallest matching `PostgresSemanticAuthority` changes so redeem,
   completion delivery, and failure notification reject a cancelled execution before
   any handler or lifecycle mutation. Preserve the existing terminal semantics for
   completed and failed executions.
3. Add real PostgreSQL/internal-route cancellation coverage that persists
   `cancelled`, proves no context/result/failure acceptance or handler effect, and
   verifies redacted, bounded failure output.
4. Complete the remaining existing CK-004 evidence only: exact-at-limit and
   one-byte-over streamed request/serialized response boundaries; transactional
   rollback after a visible provisional accepted-state write; genuinely overlapping
   completion/failure operations in both arrival orders; and genuinely concurrent
   conflicting completion envelopes with one accepted effect.
5. Update only the bounded CFC checkpoint and ticket checkpoint documentation needed
   to record the migration, validation, and consumption of `HMN-IDSER-004-009`.

## Required validation

- Run the authoritative Compose build, migration application and migration check,
  registered DB semantic-authority suite, Core route tests and typecheck, DB
  typecheck, app build, and `git diff --check` on the remediation commit.
- Prove the migration applies from the current schema and the cancellation test uses
  the persisted `cancelled` value, not a mocked lifecycle.
- Record every CK-004 scenario, commands, outcomes, counts/skips, and environment
  limitations in the CFC checkpoint.

## Forbidden work

- Do not add any lifecycle value other than `cancelled`, change unrelated tables or
  constraints, modify broader lifecycle policy, or introduce services, polling,
  providers, browser changes, or downstream-ticket behavior.
- Do not redesign credentials, routes, selection, completion fingerprints,
  reconciliation, cache binding, or migrations unrelated to the named constraint.
- Do not overwrite, stage, commit, or delete pre-existing untracked artifacts.
- Do not begin a further CFC cycle after this commit without CK verification and a
  fresh explicit `hmn` invocation.

## Handoff

CFC may make one bounded remediation commit consuming `HMN-IDSER-004-009`. It must
include the minimal lifecycle-constraint migration, matching fail-closed authority
guards, and the named CK-004 route/DB evidence, retain `awaiting_review`, and return
the exact commit directly to CK.

Expected next command: `cfc IDSER-004`
