# HMN Authorization: SEM-CUTOVER-005-INTEROPERABILITY

Ticket: `SEM-CUTOVER-005-INTEROPERABILITY`
Batch: `SEM-CUTOVER`
HMN authorization ID: `HMN-SEM-CUTOVER-005-INTEROPERABILITY-004`
Invocation: explicit user `HMN SEM-CUTOVER-005-INTEROPERABILITY — RECORD AUTHORIZATION 004`
Current workflow state: `authorized_for_bounded_cfc`

## Frozen ticket reference

- Frozen CK review: `project's goal/feedback/SEM-CUTOVER-005-INTEROPERABILITY-afe885f-review.md` (`CHANGES_REQUIRED`).
- Reviewed implementation: `afe885f8c544bdd53b47cb1982f1ffda0e9f8471`.
- Original bounded interoperability authority: `project's goal/feedback/SEM-CUTOVER-005-INTEROPERABILITY-hmn-001.md`.
- Corrected identity ownership and prerequisite boundary: `project's goal/feedback/SEM-CUTOVER-005-INTEROPERABILITY-hmn-002.md`.
- Current five-row frozen matrix: `project's goal/feedback/SEM-CUTOVER-005-INTEROPERABILITY-hmn-003.md`.

Current HEAD: `afe885f8c544bdd53b47cb1982f1ffda0e9f8471` (`feat(sem-cutover): compose relationship interoperability`).
Relevant GO commit: `afe885f8c544bdd53b47cb1982f1ffda0e9f8471`.
Relevant CK artifact: `project's goal/feedback/SEM-CUTOVER-005-INTEROPERABILITY-afe885f-review.md`.
Relevant CFC commit: none; this authorization opens one bounded CFC cycle.
Prior HMN authorization: `HMN-SEM-CUTOVER-005-INTEROPERABILITY-003`.

Worktree state: pre-existing tracked edits under finalizer/worker/generated-fixture paths and unrelated untracked planning/laboratory files remain user work. They are not implementation targets, merge bases, or evidence for this authorization. The previously recorded CK review artifact is preserved and is not modified by this administrative record.

## Diagnosis

The independent CK review returned `CHANGES_REQUIRED` for the five frozen
interoperability clauses `CK-001.a` through `CK-001.e`. The user decision
authorizes exactly one bounded CFC remediation cycle for those original frozen
clauses. The CFC must read the frozen closure oracles directly from the CK
artifact and must not create new requirements or reopen resolved predecessor
contracts.

## Ticket-authority trace

| Authority | Binding effect |
| --- | --- |
| Frozen interoperability ticket and HMN-003 matrix | Keeps the five producer-to-consumer interoperability rows, identity invariants, pure/effect-free boundary, and protected predecessor contracts in force. |
| CK review `SEM-CUTOVER-005-INTEROPERABILITY-afe885f-review.md` | Selects only the original unresolved findings `CK-001.a` through `CK-001.e` and supplies their frozen closure oracles. |
| Explicit user HMN-004 decision | Authorizes one CFC cycle, limited to those five clauses and the four permitted implementation/test files. |

## Decision

`AUTHORIZE_NEXT_CFC` — approve one bounded CFC remediation for `CK-001.a`
through `CK-001.e`.

This is one new bounded remediation cycle after the first independent CK
`CHANGES_REQUIRED` result. It does not initiate another GO, issue CK `PASS`,
reopen independently qualified predecessor tickets, redefine immutable
contracts, or expand the interoperability architecture.

## Authorized scope

The CFC may modify only these implementation/test paths:

- `apps/agents-bridge/src/semantic-relationship-interoperability-bridge.ts`
- `apps/agents-bridge/tests/semantic-relationship-interoperability-bridge.test.ts`
- `packages/atlas-skills/src/provisional-semantic-sidecar.ts`
- `packages/atlas-skills/tests/provisional-semantic-sidecar.test.ts`

Prefer test-only changes where the finding concerns missing evidence. Modify
production code only where required by the frozen CK findings. Preserve the
protected worktree and all unrelated tracked/untracked files.

The CFC must close only `CK-001.a` through `CK-001.e`, using the frozen CK
artifact as the sole source for their closure oracles. Resolved predecessor
rows and historical PASS records are protected from redesign.

## Required validation

The CFC must use actual outputs from:

- `buildStepwiseRelationshipEnvelopeRequest()`
- `prepareProvisionalRelationshipRevisions()`
- `prepareDeferredDependentInterpretations()`
- `prepareProvisionalSemanticCompositeAccounting()`

It must provide the frozen CK artifact's required evidence for exact source
slot/source-SHA/locator/asset/candidate/revision identity, mixed accounting,
a separate fully deferred source, genuine projected history, cross-execution
identity rejection, deterministic integrated replay, unchanged trusted inputs,
and the zero-effect pure boundary. A test name, revision count, isolated hash,
empty request projection, fabricated `non_fact`, or inert/unconnected counter
is not sufficient proof.

Execute and record outcomes for:

- focused interoperability bridge tests;
- focused provisional composite-accounting tests;
- `@atlas/skills` typecheck;
- `@atlas/agents-bridge` typecheck;
- the REL-03 direct regression suite;
- applicable stepwise request/source-packet regressions;
- `git diff --check`;
- exact changed-file and import-boundary inspection.

For each original clause `CK-001.a` through `CK-001.e`, the CFC checkpoint
must record the original frozen oracle, exact corrective code or test,
executed command, observable positive and negative outcome, and any residual
limitation. It must distinguish evidence-only closure from code correction.

## Forbidden work

- Do not initiate another GO or CFC cycle.
- Do not reopen independently qualified REL-01, REL-03, or SEM-005 predecessor tickets or redefine their immutable contracts.
- Do not modify provider, repository/persistence, SQL, database, worker, staging, Master, publication, acceptance, deployment, SEM-CUTOVER-006, or SEM-CUTOVER-007 paths.
- Do not expand the four-file modification scope.
- Do not stage unrelated dirty or untracked files.
- Do not regenerate identities, silently reconcile execution identities, fabricate scenarios, or claim unexecuted validation passed.
- Do not self-issue CK `PASS`.

## Handoff

Expected next command: `CFC SEM-CUTOVER-005-INTEROPERABILITY`.

The CFC must consume authorization ID
`HMN-SEM-CUTOVER-005-INTEROPERABILITY-004`, create one bounded remediation
commit containing only authorized corrections and the required CFC checkpoint,
record `Internal readiness: READY_FOR_CK`, set the checkpoint to
`awaiting_review`, and hand off to independent CK verification of the original
five frozen clauses.

Decision: `APPROVE` — durable HMN recording and one subsequent bounded CFC
authorization.
