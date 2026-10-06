# HMN Authorization: IDSER-004

Ticket: `IDSER-004: Semantic context and result authority`
Batch: `IDSER-BATCH-04`
HMN authorization ID: `HMN-IDSER-004-005`
Invocation: explicit user `hmn` delegation
Current workflow state: post-CFC CK verification returned `CHANGES_REQUIRED`; CK-004 remains solely as bounded validation evidence.

Frozen ticket reference: `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-004-semantic-context-and-result-authority.md`
Current HEAD: `eaf0c7de4f59da797abbb9e1ef7b73d92dc0e723` (`test(idser): extend semantic authority route evidence`)
Relevant GO commit: `4c2ba356dfe760b3bcfc6c94d017c767d1444b72`
Relevant CK artifact: `project's goal/feedback/IDSER-BATCH-04-eaf0c7d-verification.md` (`CHANGES_REQUIRED`)
Relevant CFC commit: `eaf0c7de4f59da797abbb9e1ef7b73d92dc0e723`
Prior HMN authorization: `HMN-IDSER-004-004` (`AUTHORIZE_EVIDENCE_REMEDIATION`), consumed by the committed cycle-4 remediation and bounded CK verification
Worktree state: no tracked changes. Pre-existing untracked planning and feedback artifacts are outside this authorization and must be preserved.

## Diagnosis

The current real route/PostgreSQL suite has closed wrong skill version, expiry, oversized input rejection, redacted error, and concurrent identical completion behavior. All earlier findings remain resolved, and CK found no direct regression; the reviewed Compose build, migration status, DB/Core test suites, DB/Core typechecks, application build, and diff check passed.

CK-004 remains open only because the following explicit IDSER-004 validation cases lack executable proof: cancelled execution rejection; exact-at-limit and one-byte-over streamed request and serialized response boundaries; handler/enqueue failure with no acknowledgement, completed lifecycle, or partial accepted state; duplicate failure notification and both completion-versus-failure race orderings; and concurrent conflicting completion delivery. The ticket itself supplies the authority for this evidence; no product, policy, provider, deployment, or architectural decision is missing.

## Ticket-authority trace

- IDSER-004 scope requires stale, expired, completed, and cancelled requests to fail closed; bounded streamed/serialized payloads; transactional acceptance before acknowledgement; and idempotent, completion-safe failure notification.
- IDSER-004 validation explicitly requires concurrency, handler persistence/enqueue failure, retryable and terminal duplicate/race behavior, and safe-output tests using real route/DB coverage.
- `IDSER-BATCH-04-eaf0c7d-verification.md` records that all remaining work is CK-004 validation evidence and identifies no direct regression or scope-change requirement.

## Decision

`AUTHORIZE_EVIDENCE_REMEDIATION`

Authorize exactly one new CFC cycle for the remaining CK-004 real route/DB evidence. This authorization is newer than the CK verification it addresses and is consumed by one remediation commit only.

## Authorized scope

1. Add an executable cancelled-execution rejection case through the real internal route and PostgreSQL authority.
2. Add exact-at-limit and one-byte-over cases for both request ingestion and serialized response emission through the real streamed HTTP path; assert bounded, redacted errors and no document/provider/credential/capability/SQL leakage.
3. Add a PostgreSQL-backed handler/enqueue failure case that proves the caller receives no success acknowledgement, execution lifecycle remains uncompleted, and the transaction leaves no partial accepted state.
4. Add duplicate failure-notification coverage plus both race orderings: completion before failure remains completed, and failure before completion prevents unapproved acceptance; verify idempotency and Atlas lifecycle authority.
5. Add a simultaneous conflicting-completion case proving only one canonical completion can take effect and no duplicate handler effect occurs.
6. Preserve production authority behavior, selection-port behavior, cache binding, contracts, migrations, and all resolved evidence. Minimal test-fixture or testability seams must not weaken real authentication, authorization, transaction, or byte-bound enforcement.

## Required validation

- Run the authoritative Compose build, migrations, registered DB semantic-authority suite, Core route suite and typecheck, DB typecheck, and app build on the final commit.
- Record every new scenario, exact command, pass/fail count, skip, and environmental limitation in the CFC checkpoint; run `git diff --check` for the remediation delta.

## Forbidden work

- Do not alter ticket scope, acceptance criteria, service credential model, route/selection/completion contracts, database schema except minimal test fixtures, browser boundary, provider/runtime/deployment policy, or IDSER-007 selection policy.
- Do not add production features, downstream ticket behavior, polling services, or unrelated refactors to address a validation-only gap.
- Do not overwrite, stage, commit, or delete unrelated pre-existing untracked artifacts.
- Do not start another CFC after this commit without a later CK result and a fresh explicit user `hmn` invocation.

## Handoff

CFC may make one test/evidence-only remediation commit for the named CK-004 cases, record consumption of `HMN-IDSER-004-005`, and leave the ticket at `awaiting_review`. The exact commit goes directly to CK for bounded verification. This authorization is not a PASS record.

Expected next command: `cfc IDSER-004`
