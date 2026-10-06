# HMN Authorization: IDSER-004

Ticket: `IDSER-004: Semantic context and result authority`
Batch: `IDSER-BATCH-04`
HMN authorization ID: `HMN-IDSER-004-003`
Invocation: explicit user `hmn` delegation
Current workflow state: post-CFC CK verification returned `CHANGES_REQUIRED`; production authority behavior is materially correct, but required deterministic validation remains incomplete.

Frozen ticket reference: `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-004-semantic-context-and-result-authority.md`
Current HEAD: `98acb502a0343fe457ba70a629aa917a2c142b30` (`fix(idser): bind reconciliation selection authority`)
Relevant GO commit: `4c2ba356dfe760b3bcfc6c94d017c767d1444b72`
Relevant CK artifact: `project's goal/feedback/IDSER-BATCH-04-98acb50-verification.md` (`CHANGES_REQUIRED`)
Relevant CFC commit: `98acb502a0343fe457ba70a629aa917a2c142b30`
Prior HMN authorization: `HMN-IDSER-004-002` (`AUTHORIZE_NEXT_CFC`), consumed by the committed cycle-2 remediation and its bounded CK verification
Worktree state: no tracked changes. Pre-existing untracked planning and feedback artifacts are outside this authorization and must be preserved.

## Diagnosis

CK-003 is resolved. The cycle-2 implementation for CK-002 correctly injects `SemanticReconciliationSelectionPort`, fails closed when the selection authority is unavailable, validates scope-bound selection output, and persists a fingerprinted context snapshot that a later redemption reads before invoking the selector. CK found no direct regression. However, its current test supplies the same fixed selection on each redemption and does not prove that later selection availability cannot change the replayed context.

CK-004 also remains only as an evidence defect: the registered PostgreSQL suite proves some authority behavior, but not all frozen-ticket validation cases. The real route/DB assertions still lack the named scope and skill/version rejections, expiry/cancellation behavior, streamed request/response bounds, concurrent completion claims, handler/enqueue atomic failure behavior, duplicate/failure races, and safe-output behavior. The latest CK reran the Compose build, route suite, typechecks, DB suite, migration status, and application build successfully; the missing work is the executable coverage, not an environment or production-implementation failure.

The post-CFC CK verification explicitly returned control to human/planning authority. These gaps are ticket-bound and repairable without changing the accepted authority design, so one evidence-only CFC cycle is appropriate.

## Ticket-authority trace

- IDSER-004 requires persisted, reproducible reconciliation context with no replay broadening and explicitly requires real route/DB tests for scope, lifecycle, bounds, replay/concurrency, failure handling, cache isolation, and safe output.
- The ticket's inspected edit scope requires unavailable intermediate functionality to reject rather than become a production success stub; cycle 2 already meets that constraint through the injected selection port.
- `IDSER-BATCH-04-98acb50-verification.md` identifies only CK-002's no-broadening proof and CK-004's incomplete validation matrix as open, and records no direct remediation regression.

## Decision

`AUTHORIZE_EVIDENCE_REMEDIATION`

Authorize exactly one new CFC cycle for test, fixture, registration, and validation evidence addressing CK-002 and CK-004. This authorization is newer than the CK verification it addresses and is consumed by one remediation commit only.

## Authorized scope

1. Add a deterministic PostgreSQL-backed no-broadening test for reconciliation context: first redemption selects one valid bounded context; before the second redemption, make later candidate availability or selector output differ; assert the stored first snapshot is returned unchanged and the selection port is not invoked again. Preserve the existing fail-closed behavior when no port is supplied.
2. Extend registered real route/DB integration coverage to prove: wrong persisted scope and skill/version rejection; expired, cancelled, and completed lifecycle handling; streamed request and serialized response byte bounds; concurrent completion claims; handler or enqueue failure causing neither acknowledgement nor partial accepted state; duplicate notification and completion-versus-failure races; and bounded safe error output with denied direct Bridge DB access.
3. Where a route test is necessary, drive the real route plus a PostgreSQL-backed authority. A fake authority, source inspection, regex assertion, or unit-only helper test cannot substitute for the named case.
4. Keep the cycle-2 `SemanticReconciliationSelectionPort`, snapshot behavior, cache execution binding, canonical fingerprint, and direct contracts dependency unchanged except for minimal testability seams that do not alter production authority semantics.

## Required validation

- Run the authoritative Compose build; `@atlas/core` route tests and typecheck; `@atlas/db` typecheck, migrations as required, and the registered PostgreSQL semantic-authority suite; and the Atlas app build.
- Run every new test against the final commit, recording exact commands, pass/fail counts, skips, and any environment limitation in the IDSER-004 CFC checkpoint.
- Run `git diff --check` for the remediation delta.

## Forbidden work

- Do not change IDSER-004 acceptance criteria, ticket/dependency gates, the selection-port contract, service credential model, browser boundary, cache transport, provider/runtime/deployment policy, or selection policy owned by IDSER-007.
- Do not redesign working production implementation merely because the gap is evidence; no new service, polling mechanism, or downstream IDSER-005/006/007/008 implementation is authorized.
- Do not overwrite, stage, commit, or delete unrelated pre-existing untracked artifacts.
- Do not begin another CFC after this committed remediation without a later CK result and a fresh explicit user `hmn` invocation.

## Handoff

CFC may create one test/evidence-focused remediation commit for CK-002 and CK-004, record consumption of `HMN-IDSER-004-003`, and keep the checkpoint `awaiting_review`. The exact commit returns directly to CK for bounded verification. This authorization is not a PASS record.

Expected next command: `cfc IDSER-004`
