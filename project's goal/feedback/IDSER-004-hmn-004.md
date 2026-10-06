# HMN Authorization: IDSER-004

Ticket: `IDSER-004: Semantic context and result authority`
Batch: `IDSER-BATCH-04`
HMN authorization ID: `HMN-IDSER-004-004`
Invocation: explicit user `hmn` delegation
Current workflow state: post-CFC CK verification returned `CHANGES_REQUIRED`; all remaining work is ticket-required real route/DB validation evidence for CK-004.

Frozen ticket reference: `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-004-semantic-context-and-result-authority.md`
Current HEAD: `92ba3f5f08884367e3e403c2ace5530000b24a60` (`test(idser): prove semantic authority evidence`)
Relevant GO commit: `4c2ba356dfe760b3bcfc6c94d017c767d1444b72`
Relevant CK artifact: `project's goal/feedback/IDSER-BATCH-04-92ba3f5-verification.md` (`CHANGES_REQUIRED`)
Relevant CFC commit: `92ba3f5f08884367e3e403c2ace5530000b24a60`
Prior HMN authorization: `HMN-IDSER-004-003` (`AUTHORIZE_EVIDENCE_REMEDIATION`), consumed by the committed cycle-3 remediation and bounded CK verification
Worktree state: no tracked changes. Pre-existing untracked planning and feedback artifacts are outside this authorization and must be preserved.

## Diagnosis

Cycle 3 resolved CK-002 with an executable selector non-reinvocation/no-broadening proof. CK-003 remains resolved. The real internal semantic route over `PostgresSemanticAuthority` now covers credential, scope, skill, capability, cache identity, snapshot replay, result replay/conflict, post-completion failure rejection, and Bridge SQL denial. Compose build, migrations, DB/Core tests, DB/Core typechecks, application build, and diff check passed at the reviewed commit; CK found no direct regression.

CK-004 remains open exclusively because the frozen ticket's validation matrix still lacks executable cases for skill-version mismatch; expired and cancelled execution; streamed request and serialized response byte boundaries; concurrent completion claims; handler/enqueue failure with no acknowledgement or partial accepted state; duplicate notification and completion-versus-failure races; and safe bounded error output. The outstanding work is evidence completion, not a change to the production authority design.

The latest CK verification explicitly returned control to human/planning authority. Each remaining case is explicitly required by IDSER-004 and repairable within its existing test seams, so one further evidence-only CFC cycle is authorized.

## Ticket-authority trace

- IDSER-004 requires real route/DB tests for wrong skill/version, expired/cancelled/completed execution, bounded streamed bodies/responses, idempotent and concurrent delivery, transactional handler/enqueue failure, duplicate and success-vs-failure notifications, and safe error output.
- Acceptance criteria 3--5 require distinct context versus completion replay rules, no acknowledgement before the owning acceptance transaction commits, and scope-checked completion-safe failure notification.
- `IDSER-BATCH-04-92ba3f5-verification.md` records CK-002 resolved, no direct regression, successful authoritative Compose validation, and CK-004 as the sole remaining evidence defect.

## Decision

`AUTHORIZE_EVIDENCE_REMEDIATION`

Authorize exactly one new CFC cycle for CK-004's remaining real route/DB test and evidence matrix. It is newer than the CK verification it addresses and is consumed by one remediation commit only.

## Authorized scope

1. Extend the registered PostgreSQL-backed semantic route/authority suite with executable rejections for wrong skill version, expired execution, and cancelled execution.
2. Prove request and serialized response byte-boundary behavior using exact-at-limit and one-byte-over cases through the real internal route/authority path; verify safe bounded errors contain neither provider/document material, credentials, capabilities, nor SQL details.
3. Prove concurrent completion claims have one authoritative acceptance outcome, identical replay is idempotent, and conflicting content cannot create duplicate effects.
4. Inject handler persistence/enqueue failure through the real authority path and assert a retryable bounded failure, no success acknowledgement, no lifecycle completion, and no partial accepted state.
5. Prove duplicate failure notification idempotency and both completion-versus-failure race orderings preserve Atlas lifecycle authority and cannot undo an accepted completion.
6. Preserve all production authority code, selection-port behavior, cache execution binding, migration shape, and resolved CK-001--CK-003 evidence. Test-only fixtures or minimal testability hooks may not weaken credential, scope, transaction, or byte-boundary enforcement.

## Required validation

- Run the authoritative Compose build; migrations; registered `@atlas/db` semantic-authority suite; `@atlas/core` route tests and typecheck; `@atlas/db` typecheck; and the Atlas app build against the final commit.
- Record each new scenario and its exact assertion in the IDSER-004 CFC checkpoint, including command outcomes, pass/fail counts, skips, and any environmental limitation.
- Run `git diff --check` for the bounded remediation.

## Forbidden work

- Do not alter IDSER-004 acceptance criteria, service credential or route authority design, completion/selection contracts, database schema beyond minimal test fixtures, browser boundary, provider/runtime/deployment policy, or IDSER-007 selection policy.
- Do not add new production features, downstream IDSER-005/006/007/008 behavior, polling services, or unrelated refactors to compensate for missing test coverage.
- Do not overwrite, stage, commit, or delete unrelated pre-existing untracked artifacts.
- Do not start an additional CFC cycle after this remediation without a later CK result and a fresh explicit user `hmn` invocation.

## Handoff

CFC may commit one test/evidence-only remediation for the remaining CK-004 cases, record consumption of `HMN-IDSER-004-004`, and set the checkpoint to `awaiting_review`. The resulting commit goes directly to CK for bounded verification. This authorization is not a PASS record.

Expected next command: `cfc IDSER-004`
