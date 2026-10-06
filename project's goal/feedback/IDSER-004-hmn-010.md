# HMN Authorization: IDSER-004

Ticket: `IDSER-004: Semantic context and result authority`
Batch: `IDSER-BATCH-04`
HMN authorization ID: `HMN-IDSER-004-010`
Invocation: explicit user `hmn` delegation
Current workflow state: post-CFC CK verification returned `CHANGES_REQUIRED`; CK-004 remains open solely for specific missing execution-bound validation evidence.

Frozen ticket reference: `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-004-semantic-context-and-result-authority.md`
Current HEAD: `54967573b116cfd94e1b26bd4a28f4cf49a79145` (`fix(idser): close semantic cancellation authority gaps`)
Relevant GO commit: `4c2ba356dfe760b3bcfc6c94d017c767d1444b72`
Relevant CK artifact: `project's goal/feedback/IDSER-BATCH-04-5496757-verification.md` (`CHANGES_REQUIRED`, CK-004 open)
Relevant CFC commit: `54967573b116cfd94e1b26bd4a28f4cf49a79145` (cycle 6; consumed `HMN-IDSER-004-009`)
Prior HMN authorization: `HMN-IDSER-004-009` (`AUTHORIZE_NEXT_CFC`), consumed by the cycle-6 commit
Worktree state: no tracked modifications. Pre-existing untracked planning and feedback artifacts remain outside this authorization and must be preserved.

## Diagnosis

Cycle 6 resolved the prior implementation blocker: migration `0016` persists
`cancelled`, the migration runner registers it, and production authority rejects
cancelled context, result, and failure operations before handler effects. It also
proves provisional accepted-state rollback and one-effect conflicting completion.

The CK verification found no direct production regression. CK-004 remains open only
because the changed PostgreSQL/internal-route test does not yet prove exact-at-limit
and one-byte-over streamed request and serialized-response boundaries, does not
inspect the cancelled-route error body for bounded redaction, and forces only the
completion-wins contention order. These are explicit frozen-ticket validation cases;
the underlying cancellation authority, schema, and contracts must remain unchanged.

## Ticket-authority trace

- IDSER-004 requires bounded request/response handling and safe error output.
- IDSER-004 validation requires oversized streamed bodies/responses and
  success-versus-failure races.
- `IDSER-BATCH-04-5496757-verification.md` identifies the exact absent proofs and
  states that the bounded production change introduced no direct regression.

## Decision

`AUTHORIZE_EVIDENCE_REMEDIATION`

Authorize one new, evidence-only CFC cycle for CK-004. This authorization is newer
than the CK verification it addresses and is consumed by exactly one remediation
commit. It protects the cycle-6 production migration and authority implementation
from redesign.

## Authorized scope

1. In the real internal HTTP route path, add exact-at-limit and one-byte-over tests
   for streamed request ingestion and serialized context/result response emission.
   Assert the accepted boundary is usable, the rejected boundary produces no trusted
   state or handler effect, and error output remains bounded and redacted.
2. Extend the persisted-cancelled route tests to assert the returned error bodies are
   bounded and exclude provider payloads, document material, credentials, grants,
   prompts, and SQL details; retain their existing no-handler-effect assertions.
3. Add genuinely overlapping completion-versus-failure tests for both terminal
   orders. Use only a test-local transactional synchronization seam to make each
   operation contend for the real row lock: prove completion wins when its transaction
   commits first and failure wins when its transaction commits first, with no later
   operation undoing the terminal lifecycle or adding a handler effect.
4. Retain the existing conflicting-completion and provisional-write rollback cases;
   add only assertions needed to make their one-effect/rollback outcomes explicit if
   required by the new race fixture.
5. Update the CFC checkpoint and ticket checkpoint only to identify every individual
   CK-004 scenario, its exact command, result, test count/skips, and any environment
   limitation.

## Required validation

- Run the authoritative Compose build, migration application and migration check,
  DB semantic-authority suite, Core route tests and typecheck, DB typecheck, app
  build, and `git diff --check` on the remediation commit.
- Record per-scenario evidence for the two byte boundaries in both directions,
  cancellation redaction, each race order, rollback, and conflicting delivery. State
  exact counts/skips rather than a general pass summary.

## Forbidden work

- Do not change the cycle-6 lifecycle migration, lifecycle values, database schema,
  production authority/route/credential contracts, selection, completion semantics,
  provider/runtime policy, browser boundary, or downstream-ticket behavior.
- Do not replace real route/transaction behavior with mocks or a fixture-only success
  stub, add services/polling, or begin another CFC cycle after this commit without a
  new CK result and explicit `hmn` delegation.
- Do not overwrite, stage, commit, or delete pre-existing untracked artifacts.

## Handoff

CFC may make one test/evidence-only remediation commit consuming
`HMN-IDSER-004-010`, retain `awaiting_review`, and hand that exact commit directly to
CK. No further HMN action is needed before CK reviews the committed checkpoint.

Expected next command: `cfc IDSER-004`
