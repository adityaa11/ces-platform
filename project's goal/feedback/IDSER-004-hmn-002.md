# HMN Authorization: IDSER-004

Ticket: `IDSER-004: Semantic context and result authority`
Batch: `IDSER-BATCH-04`
HMN authorization ID: `HMN-IDSER-004-002`
Invocation: explicit user `hmn` delegation
Current workflow state: post-CFC CK verification returned `CHANGES_REQUIRED`; the prior continuation has been consumed and one new, bounded remediation is required before another CK review.

Frozen ticket reference: `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-004-semantic-context-and-result-authority.md`
Current HEAD: `04149dbba2585bd62364f3c4be5baaefebc04738` (`fix(idser): remediate semantic authority review`)
Relevant GO commit: `4c2ba356dfe760b3bcfc6c94d017c767d1444b72`
Relevant CK artifact: `project's goal/feedback/IDSER-BATCH-04-04149db-verification.md` (`CHANGES_REQUIRED`)
Relevant CFC commit: `04149dbba2585bd62364f3c4be5baaefebc04738`
Prior HMN authorization: `HMN-IDSER-004-001` (`CONTINUE_CURRENT_CFC`), consumed by the committed remediation and bounded CK verification
Worktree state: no tracked changes. Pre-existing untracked planning and feedback artifacts are outside this authorization and must be preserved.

## Diagnosis

The original CFC resolved CK-001 and CK-005. CK-002 remains open because `PostgresSemanticAuthority` itself selects all bounded `knowledge_index` rows instead of consuming the selected-prior-neighborhood authority promised by IDSER-004 for IDSER-007. Its persisted snapshot is useful but does not establish the required selection authority or prove stable/no-broadening behavior. CK-003 remains an evidence gap: the execution-identity guard is implemented but has no real PostgreSQL same-byte, distinct-execution cache-isolation proof. CK-004 remains materially incomplete because the registered semantic-authority test is only a fingerprint unit test and the required real route/DB authority, lifecycle, bound, replay/concurrency, handler-failure, failure-race, and safe-output matrix is absent.

The post-CFC verification at `04149db` explicitly returned control to human/planning authority. These remaining defects are ticket-bound and implementation-repairable without modifying acceptance criteria, dependencies, provider/runtime choices, or architecture. This authorization is therefore one new CFC cycle, not a continuation of the consumed `HMN-IDSER-004-001` cycle.

## Ticket-authority trace

- IDSER-004 requires reconciliation context from the IDSER-007 selected prior neighborhood, a reproducible snapshot or exact selected IDs plus fingerprint, and no silent replay broadening.
- Its inspected edit scope requires typed context-construction ports and says intermediate production handlers reject unavailable functionality; it does not authorize prematurely implementing IDSER-007's selection policy.
- Its validation requires real route/DB coverage for credentials, capabilities, scope, lifecycle, bounds, idempotent/concurrent replay, handler failure, cache isolation, failure races, safe output, and denied direct DB access.
- `IDSER-BATCH-04-04149db-verification.md` identifies CK-002 through CK-004 as unresolved and confirms no scope-change observation or direct regression.

## Decision

`AUTHORIZE_NEXT_CFC`

Authorize exactly one new CFC remediation cycle for CK-002, CK-003, and CK-004. This authorization is newer than the CK verification it addresses and is consumed by one committed remediation checkpoint only.

## Authorized scope

1. Replace the authority-owned fallback that selects every current/prior candidate with a typed, bounded reconciliation-selection/context port. It must accept only persisted execution scope, return the exact selected current candidates and IDSER-007-selected prior neighborhood (or reject as unavailable in production until IDSER-007 supplies it), validate the returned context, and persist/reuse its snapshot and fingerprint on retry. Do not create an independent selection policy in IDSER-004.
2. Add real PostgreSQL integration coverage proving the exact execution binding for same-byte cache reuse across distinct executions and no cross-execution identity leakage (CK-003).
3. Register and implement the IDSER-004 real route/DB evidence matrix: credential/capability/scope and skill-version rejections; stale, expired, completed and cancelled execution handling; bounded request/response behavior; identical/conflicting replay and concurrent claims; handler/enqueue failure with no acknowledgement or partial accepted state; context snapshot retry/no-broadening; duplicate and completion-versus-failure races; safe error output and denied direct DB access (CK-004).
4. Keep CK-001's recursive canonical fingerprint and CK-005's direct contracts dependency intact. Amend the existing ticket CFC checkpoint with this authorization ID, exact commit, and validation results.

## Required validation

- Run the authoritative Compose environment for `@atlas/core` test and typecheck, `@atlas/db` typecheck and the newly registered semantic-authority PostgreSQL integration suite, `@atlas/db migrate` against the test database as needed, and `@atlas/app build`.
- Demonstrate every CK-002--CK-004 case listed in Authorized scope with executable assertions; do not substitute inspection, regex, fake-authority, or fingerprint-only tests for the real DB/route cases.
- Run `git diff --check` for the remediation delta and record exact commands, results, environment limitations, and the consumed authorization ID in the checkpoint.

## Forbidden work

- Do not change IDSER-004 acceptance criteria, dependency gates, service credential model, browser/Cloudflare boundary, perception source/OCR/cache transport, or provider/runtime/deployment policy.
- Do not implement IDSER-007 candidate-selection policy, IDSER-005/006/008 behavior, or a second monitoring/polling service. An unavailable IDSER-007 selection implementation must fail closed rather than fall back to broad candidate discovery.
- Do not redesign the resolved canonical fingerprint or direct dependency correction except where required for direct regression coverage.
- Do not overwrite, stage, commit, or delete unrelated untracked artifacts.
- Do not start another CFC pass after this commit without a later CK result and another explicit user `hmn` invocation.

## Handoff

CFC may make one bounded remediation commit addressing CK-002 through CK-004, recording consumption of `HMN-IDSER-004-002` and setting the ticket checkpoint to `awaiting_review`. The exact committed checkpoint then returns directly to CK. This authorization is not a PASS record.

Expected next command: `cfc IDSER-004`
