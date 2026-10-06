# HMN Authorization: IDSER-004

Ticket: `IDSER-004: Semantic context and result authority`
Batch: `IDSER-BATCH-04`
HMN authorization ID: `HMN-IDSER-004-001`
Invocation: explicit user `hmn` delegation
Current workflow state: first consolidated CK returned `CHANGES_REQUIRED`; an in-scope CFC remediation is partially present in the worktree and has not been handed to CK.

Frozen ticket reference: `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-004-semantic-context-and-result-authority.md`
Current HEAD: `4c2ba356dfe760b3bcfc6c94d017c767d1444b72` (`feat(idser): add semantic execution authority`)
Relevant GO commit: `4c2ba356dfe760b3bcfc6c94d017c767d1444b72`
Relevant CK artifact: `project's goal/feedback/IDSER-BATCH-04-4c2ba35-review.md` (`CHANGES_REQUIRED`)
Relevant CFC commit: none; the active remediation is uncommitted
Prior HMN authorization: none found
Worktree state: tracked, in-scope edits exist in `packages/atlas-core/tests/semantic-internal-route.test.ts`, `packages/atlas-db/package.json`, and `packages/atlas-db/src/semantic-authority.ts`; unrelated pre-existing untracked planning and feedback artifacts remain outside this authorization.

## Diagnosis

CK-001 through CK-005 are all explicitly repairable within the frozen IDSER-004 scope. The original CK conclusion already permits CFC to address only those findings. The current in-scope worktree changes correct the route double's handler invocation (CK-004), declare the DB contracts dependency (CK-005), replace the shallow completion digest with recursive canonicalization (CK-001), and bind the normalized document to the joined perception-execution identity (CK-003). They have not been committed or reviewed, and reconciliation context authority and its required proof (CK-002) remain unfinished.

This is an interrupted ordinary CFC pass, not a post-CFC CK result. No remediation has been committed, no checkpoint has moved to `awaiting_review` for a remediation commit, and CK has not reviewed this partial work. The existing CFC authorization remains valid; issuing a new CFC cycle would be incorrect.

## Ticket-authority trace

- IDSER-004 outcome and scope require Atlas-owned execution/context authority, persisted execution scope, reproducible reconciliation context, execution-bound normalized-document identity, canonical completion idempotency, and fail-closed acceptance.
- IDSER-004 validation explicitly requires route/DB coverage for scope, capability, expiry/completion, replay/concurrency, acceptance failure, cross-execution cache reuse, failure races, and safe output.
- `IDSER-BATCH-04-4c2ba35-review.md` records CK-001 through CK-005 and authorizes CFC only for those findings. It records no scope-change observation.

## Decision

`CONTINUE_CURRENT_CFC`

Continue the existing, uncommitted CFC remediation. `HMN-IDSER-004-001` records the handoff decision only; it does not open or authorize an additional remediation cycle.

## Authorized scope

Complete one committed remediation for CK-001 through CK-005 only:

1. Preserve and validate recursive canonical completion hashing; prove equal envelopes replay idempotently and changes to nested scope, provenance, and result content conflict (CK-001).
2. Implement the frozen-ticket bounded reconciliation selection/context authority port. Persist or bind the exact selected IDs/snapshot and fingerprint to the execution; prove retry stability and that later candidate availability cannot broaden a replay (CK-002).
3. Preserve the perception-execution binding in normalized-cache retrieval and add the required distinct-execution same-byte cache isolation coverage (CK-003).
4. Preserve the corrected Core route test double and add the required registered real route/DB tests for the stated authority, lifecycle, bound, replay/concurrency, handler-failure, failure-race, and safe-output cases (CK-004).
5. Preserve the direct `@atlas/contracts` dependency and update the lockfile only if the package manager requires it to restore authoritative DB typechecking (CK-005).

## Required validation

- Run the authoritative Compose checks for `@atlas/core` tests and typecheck, `@atlas/db` typecheck and registered semantic-authority integration coverage, and the Atlas application build.
- Run the IDSER-004-required real route/DB matrix named above, including concurrent completion/failure behavior and no partial accepted state when the handler/enqueue fails.
- Run `git diff --check` for the remediation diff.
- Record exact commands and outcomes in the IDSER-004 CFC checkpoint, name this HMN record as continuation context, and make one bounded remediation commit.

## Forbidden work

- Do not alter IDSER-004 acceptance criteria, dependency gates, service-credential model, provider/runtime/deployment choices, browser boundary, or perception/OCR/cache transport.
- Do not implement IDSER-005, IDSER-006, IDSER-007, IDSER-008, or an unbounded candidate-selection policy beyond the IDSER-004 context port and its persisted replay binding.
- Do not discard, overwrite, or commit unrelated pre-existing worktree changes or untracked artifacts.
- Do not start another CFC cycle after this committed remediation without a later CK result and a fresh explicit user `hmn` invocation.

## Handoff

The existing CFC must retain completed partial fixes, finish CK-002 and the complete CK-001--CK-005 evidence matrix, then commit the bounded remediation and record its checkpoint as `awaiting_review`. CK, not CFC or HMN, reviews that exact commit.

Expected next command: `cfc IDSER-004`
