# HMN Authorization: IDSER-005

Ticket: `IDSER-005: Production semantic worker and replay`  
Batch: `IDSER-BATCH-05`  
HMN authorization ID: `HMN-IDSER-005-002`  
Invocation: explicit user `hmn` delegation  
Current workflow state: post-CFC CK verification returned `CHANGES_REQUIRED`; the
unresolved portions of CK-001 and CK-002 remain ticket-bound.

Frozen ticket reference: `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-005-production-semantic-worker-and-replay.md`  
Current HEAD: `0aac480ace4d57cd08b6514df5c78dd949108957` (`docs(idser): record HMN replay correction`)  
Relevant GO commit: `0209921f5bc0cc1aaed6d74b2c30098f3e68b9b8`  
Relevant CK artifact: `project's goal/feedback/IDSER-BATCH-05-924d556-verification.md` (`CHANGES_REQUIRED`)  
Relevant CFC commit: `924d556cb23a99c55b50af39a80b067bd3ddd3a9` (`fix(idser): preserve staged winner after lease loss`)  
Prior HMN authorization: `HMN-IDSER-005-001`, consumed by `924d556`  
Worktree state: no tracked modifications and `git diff --check` passes. Existing
untracked planning and feedback artifacts, including the prior HMN record, are
outside this authorization and must be preserved.

## Diagnosis

The committed replay correction materially fixes the discovered terminal-failure
path: when a claimant loses its semantic replay lease but a same-execution
envelope is already durable, the dispatcher reloads and delivers that envelope;
when no winner exists, it remains retryable rather than calling the Atlas failure
route. The CK has not found contradictory ticket authority or a new production
defect.

The checkpoint nevertheless lacks the production-boundary proof required by
IDSER-005. `test:semantic` is three in-memory dispatcher tests. The registered
Bridge suite has no semantic Compose integration that runs the database lease and
replay path, configured `MistralProvider.structured(...)`, actual Atlas semantic
HTTP routes, or the production worker composition. Thus CK-001 still lacks the
required real lease/replay evidence and CK-002 is unresolved. This is an
evidence gap around the current implementation, not authority to redesign it.

## Ticket-authority trace

- IDSER-005's execution contract requires immutable staged output, fenced Bridge
  completion and cleanup, one logical Atlas effect, and redelivery after
  acknowledgement loss or restart without another provider invocation.
- Its validation section requires deterministic Compose worker integration
  through mocked HTTP Mistral responses and both real skills, with replay,
  fencing, restart, configuration, timeout, cancellation, and shutdown
  assertions.
- CK-001 and CK-002 in `IDSER-BATCH-05-0209921-review.md`, reaffirmed by the
  post-CFC verification at `924d556`, limit the remaining work to proving those
  already-frozen requirements. No ticket, provider, deployment, queue, or
  architecture decision is outstanding.

## Decision

`AUTHORIZE_EVIDENCE_REMEDIATION`

Authorize one new bounded CFC cycle that adds the missing deterministic,
production-path proof for the existing IDSER-005 implementation. The remediation
must preserve the established replay state-machine behavior. A production change
is permitted only when a registered integration test exposes a concrete defect
in that behavior, and must be the smallest correction necessary for the cited
CK finding.

## Authorized scope

1. Add and register a deterministic Compose semantic integration suite that
   exercises the real production semantic queue/worker composition, Bridge SQL
   lease and `semantic_result_delivery` ledger, `createAtlasSemanticClient`,
   authenticated Atlas semantic context/result/failure routes, and a mocked HTTP
   transport through a configured `MistralProvider`. It must cover both
   `atlas.semantic.extract/v1` and `atlas.semantic.reconcile/v1`.
2. Prove with provider call counts, replay-row/lease observations, and Atlas
   lifecycle/handler observations: acknowledgement loss; delivery outage;
   restart after staging; restart after Atlas acceptance before Bridge
   completion; replay cleanup fault; duplicate jobs; expired or superseded
   claimant; conflicting staging; and unavailable acceptance handler. The stale
   winner case must execute the actual database lease/replay path and prove that
   it cannot terminally fail the staged envelope.
3. Through the real configured paths, add deterministic coverage for missing and
   invalid credentials; unknown skill/version; malformed provider JSON and
   schema-invalid output; request/context/response byte limits; provider and
   Atlas timeout; cancellation; and orderly worker stop. Assert bounded error
   identities and that prompts, result bodies, grants, source content, and
   credentials are absent from emitted errors.
4. Register the suite in package scripts and update the IDSER-005 CFC checkpoint
   with the exact commands, scenario evidence, Compose migration/service state,
   and known limitations. Keep fake-only unit tests only as supplemental proof.
5. If—and only if—the authorized suite demonstrates a defect in the existing
   lease/replay or delivery code, correct that defect narrowly within the
   ticket's existing worker/replay/Atlas-client seams and prove the correction in
   the same suite. Do not alter a passing production design merely to broaden
   tests.

## Required validation

- Apply and verify the existing Compose migrations and services before running
  the new suite; no speculative schema migration is authorized.
- Run Bridge typecheck; the new registered semantic Compose integration suite;
  the complete Bridge suite; consumed Atlas DB/Core semantic authority and route
  suites; relevant contract and skill tests; and `git diff --check`.
- Record each scenario's provider-call assertion, replay-row/effect-lease state,
  Atlas lifecycle/handler observation, and cleanup result. No live provider
  credential may be used; IDSER-011 remains the sole live-provider proof.

## Forbidden work

- Do not redesign or weaken the replay state machine; replace the worker,
  replay, queue, or Atlas HTTP architecture; introduce another queue, polling
  process, persistence authority, direct Atlas SQL, provider-selection policy,
  deployment configuration, or live credentials.
- Do not change ticket scope, acceptance criteria, semantic contracts, Atlas
  truth authority, extraction/reconciliation behavior, or downstream
  IDSER-006--011 work.
- Do not replace required worker/HTTP/DB integration with unit doubles, swallow
  delivery or lease errors, allow an unfenced cleanup, overwrite a staged
  envelope, or report a stale claimant as an Atlas terminal failure.
- Do not overwrite, stage, commit, or delete the pre-existing untracked
  artifacts. Do not begin any further remediation after this one without CK
  verification and another explicit `hmn` invocation.

## Handoff

CFC may make exactly one remediation commit consuming `HMN-IDSER-005-002`. It
must retain IDSER-005 as `awaiting_review` and hand that exact commit directly
to CK. CK is limited to the remaining verification of CK-001 and CK-002.

Expected next command: `cfc IDSER-005`
