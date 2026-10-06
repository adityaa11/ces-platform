# HMN Authorization: IDSER-004

Ticket: `IDSER-004: Semantic context and result authority`
Batch: `IDSER-BATCH-04`
HMN authorization ID: `HMN-IDSER-004-006`
Invocation: explicit user `hmn` delegation
Current workflow state: post-CFC CK verification returned `CHANGES_REQUIRED`; CK-004 remains solely as incomplete real route/DB evidence.

Frozen ticket reference: `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-004-semantic-context-and-result-authority.md`
Current HEAD: `301c71eb18b387026931fb695dfe391096dad235` (`test(idser): prove semantic failure atomicity`)
Relevant GO commit: `4c2ba356dfe760b3bcfc6c94d017c767d1444b72`
Relevant CK artifact: `project's goal/feedback/IDSER-BATCH-04-301c71e-verification.md` (`CHANGES_REQUIRED`)
Relevant CFC commit: `301c71eb18b387026931fb695dfe391096dad235`
Prior HMN authorization: `HMN-IDSER-004-005` (`AUTHORIZE_EVIDENCE_REMEDIATION`), consumed by the committed cycle-5 remediation and bounded CK verification
Worktree state: no tracked changes. Pre-existing untracked planning and feedback artifacts are outside this authorization and must be preserved.

## Diagnosis

Cycle 5 proves a rejecting acceptance handler produces a 409 response, retains the execution in `running`, makes duplicate failure notification terminally idempotent, and rejects completion after sequential failure. Earlier evidence continues to cover expiry, skill mismatch, bounded/redacted oversized input, cache identity, replay, selector snapshots, and concurrent identical delivery. The reviewed Compose suite and builds passed, and CK found no direct regression.

CK-004 remains open only for executable proof of cancelled execution; exact-at-limit and one-byte-over streamed request/serialized response boundaries; no partial accepted state when a handler/enqueue operation fails after beginning accepted-state work; true concurrent completion/failure race outcomes; and concurrent conflicting completion. These are explicit frozen-ticket validation cases and need no new architecture or policy decision.

## Ticket-authority trace

- IDSER-004 requires cancellation rejection, bounded streamed/serialized payloads, transactional acceptance with no partial effects on failure, concurrent idempotent completion, and completion-safe failure lifecycle rules.
- Its validation explicitly names handler persistence/enqueue failure, no partial accepted state, retryable/terminal failure notification, duplicate notification, success-vs-failure races, and concurrent acceptance claims.
- `IDSER-BATCH-04-301c71e-verification.md` identifies no production defect or scope change; all remaining CK-004 work is specified executable evidence.

## Decision

`AUTHORIZE_EVIDENCE_REMEDIATION`

Authorize exactly one new CFC cycle for the remaining CK-004 test and validation evidence. This authorization is newer than the CK verification it addresses and is consumed by one remediation commit only.

## Authorized scope

1. Add a real route/PostgreSQL cancelled-execution rejection assertion.
2. Add exact-at-limit and one-byte-over assertions for streamed route request ingestion and serialized context/result response emission, including redacted bounded error behavior.
3. Exercise a handler/enqueue failure that creates a deliberately observable provisional accepted-state write inside the owning transaction, then fails; prove rollback leaves no provisional/accepted rows, no 2xx acknowledgement, and no completed lifecycle.
4. Run genuinely overlapping completion-versus-failure operations in both arrival orders, asserting completion wins only when it commits first, failure wins when it commits first, and neither result can undo the terminal authority state.
5. Run genuinely overlapping conflicting completion envelopes, asserting one canonical completion/fingerprint and one handler effect only; the losing conflicting delivery must fail without an additional effect.
6. Retain all working production authority, credentials, selection port, cache binding, migrations, and prior evidence. Any fixture or testability seam must preserve real transaction, concurrency, authentication, authorization, and byte-boundary semantics.

## Required validation

- Run the authoritative Compose build, migrations, registered DB semantic-authority suite, Core route tests and typecheck, DB typecheck, app build, and `git diff --check` on the final commit.
- Record all scenarios, commands, outcomes, counts/skips, and any environment limitation in the CFC checkpoint.

## Forbidden work

- Do not alter ticket scope, acceptance criteria, production authority design, credential/route/selection/completion contracts, database schema except minimal test fixtures, browser boundary, provider/runtime/deployment policy, or downstream-ticket behavior.
- Do not add services, polling, unrelated refactors, or a new selection policy in place of bounded evidence.
- Do not overwrite, stage, commit, or delete unrelated pre-existing untracked artifacts.
- Do not begin another CFC cycle after this remediation without a later CK result and a fresh explicit user `hmn` invocation.

## Handoff

CFC may make one test/evidence-only remediation commit for the named CK-004 scenarios, record consumption of `HMN-IDSER-004-006`, and retain `awaiting_review`. The exact commit returns directly to CK for bounded verification. This authorization is not a PASS record.

Expected next command: `cfc IDSER-004`
