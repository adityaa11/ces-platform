# HMN Authorization: IDSER-005

Ticket: `IDSER-005: Production semantic worker and replay`  
Batch: `IDSER-BATCH-05`  
HMN authorization ID: `HMN-IDSER-005-001`  
Invocation: explicit user `hmn` delegation, clarifying that the remediation must
be assessed as one coherent correction rather than the smallest isolated patch.  
Current workflow state: post-CFC CK verification returned `CHANGES_REQUIRED`;
CK-001 and CK-002 remain open.

Frozen ticket reference: `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-005-production-semantic-worker-and-replay.md`  
Current HEAD: `c8cf319c` (`docs(idser): record replay fencing remediation`)  
Relevant GO commit: `0209921f5bc0cc1aaed6d74b2c30098f3e68b9b8`  
Relevant CK artifact: `project's goal/feedback/IDSER-BATCH-05-6bdc2d2-verification.md` (`CHANGES_REQUIRED`)  
Relevant CFC commit: `6bdc2d285538f758a3fd6d7dbde3e72159558d6e` (ordinary CFC opportunity consumed)  
Prior HMN authorization: none  
Worktree state: no tracked modifications. Pre-existing untracked planning and
feedback artifacts must be preserved and are outside this authorization.

## Diagnosis

The failed verification is a single system-level defect with missing proof, not
two unrelated tickets. The current replay adapter checks the live Bridge lease
before it loads a same-execution winning envelope. A claimant superseded after
the initial `load` therefore throws during `stage`; `runSemanticJob` broadly
maps that error to `client.fail`, and Atlas marks the execution failed. That
terminal state rejects the valid envelope already staged by the winning worker.

The prior change added lease columns but did not establish the required state
machine: a same-execution durable winner must be the replay source of truth;
a stale claimant must never terminally fail it; and only the fenced current
claimant may complete the Bridge effect and retire the replay row. The existing
in-memory dispatcher test cannot establish this because it bypasses the
database claim query, replay ledger, worker retry/lease machinery, real
`MistralProvider.structured(...)`, and the authenticated Atlas HTTP routes.

## Ticket-authority trace

- IDSER-005 execution contract requires immutable staged output, safe replay
  after acknowledgement loss/restart, BSS-006 fencing through cleanup, and
  retryable delivery without semantic ambiguity.
- Its acceptance criteria 1--5 and review bindings `REV-READY-IDSER-005-01`,
  `-02`, and `-03` require production dispatch, single logical Atlas effect,
  bounded failure behavior, and real boundary evidence.
- CK-001 and CK-002 explicitly identify the production state-machine defect
  and the missing Compose integration matrix. The CK records no scope change;
  both remain repairable by the frozen worker/replay/validation authority.

## Decision

`AUTHORIZE_NEXT_CFC`

Authorize exactly one comprehensive CFC cycle. It must deliver the complete
IDSER-005 correction and evidence matrix below in one bounded remediation
commit. This is deliberately broader than a minimal CK-001 patch, while
remaining confined to the two original CK findings and frozen ticket scope.

## Authorized scope

1. Define and implement the semantic replay/lease state machine at the Bridge
   seam. A same-key, same-execution staged envelope is immutable and is the
   winning delivery payload even if the attempting claimant is now superseded.
   A different execution identity remains a bounded integrity conflict. A
   stale/superseded claimant with no winning same-execution envelope must
   produce a retryable worker outcome, never an Atlas terminal failure.
2. Refine `runSemanticJob`, replay adapter, and worker completion/cleanup
   interaction so that a result is staged before handoff; acknowledgement loss,
   delivery outage, restart after staging, restart after Atlas acceptance, and
   cleanup failure redeliver the exact persisted envelope without another
   provider invocation. Completion and replay deletion remain fenced to the
   claimant that owns the current lease. Do not add a separate queue, polling
   process, persistence authority, or direct Atlas SQL.
3. Add one registered deterministic Compose semantic integration suite,
   modelled on the existing perception integration fixture but exercising the
   production semantic queue/worker, real Bridge SQL replay ledger and lease
   rows, `createAtlasSemanticClient`, the actual Atlas internal HTTP host and
   authenticated context/result/failure routes, and a mocked HTTP transport
   through a real configured `MistralProvider`. It must test both production
   extract and reconciliation skills.
4. In that suite, prove and assert provider call counts plus Bridge and Atlas
   terminal states for: acknowledgement loss; delivery outage; restart after
   staging; restart after Atlas acceptance before Bridge completion; replay
   cleanup fault; duplicate queue jobs; lease expiry/superseded claimant;
   conflicting stage; and unavailable acceptance handler. The stale winner
   case must prove no terminal failure can invalidate the staged envelope and
   must execute the actual database lease/replay path.
5. Cover the ticket's deterministic production-boundary failures through the
   real configured paths: missing and invalid credentials; unknown skill and
   version; malformed provider JSON and schema-invalid result; request/context/
   response byte limits; provider and Atlas timeout; cancellation; and orderly
   worker stop. Assertions must check bounded error identities and confirm that
   prompts, result bodies, grants, source content, and credentials are absent.
6. Preserve and run the existing generic worker, provider, perception, Atlas
   authority, and semantic contract tests. Register the new suite in package
   scripts and update the ticket/CFC checkpoint with exact commands, pass
   counts, Compose migration/service status, and limitations. No live provider
   credential is used; IDSER-011 remains the sole live-provider proof.

## Required validation

- Apply and verify the existing migrations in Compose; no speculative schema
  migration is permitted unless the frozen state-machine correction makes an
  additive replay constraint strictly necessary and its purpose is documented.
- Run Bridge typecheck; the new registered semantic Compose integration suite;
  the complete Bridge suite; directly consumed Atlas DB/Core authority and
  route suites; relevant contract/skill tests; and `git diff --check`.
- Record each scenario's provider-call assertion, replay-row/effect-lease
  observation, Atlas lifecycle/handler observation, and cleanup result. A
  passing fake-only test is supplemental, not evidence for this authorization.

## Forbidden work

- Do not alter ticket scope, acceptance criteria, semantic contracts, Atlas
  truth authority, extraction/reconciliation acceptance behavior, provider
  selection policy, deployment configuration, credentials boundary, queue
  technology, or downstream IDSER-006--011 work.
- Do not weaken the failure behavior by swallowing errors, report a stale lease
  as a terminal Atlas failure, overwrite a staged envelope, allow an unfenced
  cleanup, treat a mock provider object as production-path proof, or replace
  HTTP/DB/worker integration with unit doubles.
- Do not overwrite, stage, commit, or delete the pre-existing untracked
  artifacts. Do not start another remediation cycle after this commit without
  CK verification and a fresh explicit `hmn` invocation.

## Handoff

CFC may make one remediation commit consuming `HMN-IDSER-005-001`, retain
IDSER-005 as `awaiting_review`, and hand that exact commit directly to CK. The
subsequent CK is limited to verifying CK-001 and CK-002 against this complete
contract.

Expected next command: `cfc IDSER-005`
