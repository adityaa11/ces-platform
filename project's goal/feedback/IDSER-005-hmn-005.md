# HMN Authorization: IDSER-005

Ticket: `IDSER-005: Production semantic worker and replay`  
Batch: `IDSER-BATCH-05`  
HMN authorization ID: `HMN-IDSER-005-005`  
Invocation: explicit user `hmn` delegation  
Current workflow state: post-CFC CK verification returned `CHANGES_REQUIRED`.
Original CK-001 is resolved; only original CK-002 remains open.

Frozen ticket reference: `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-005-production-semantic-worker-and-replay.md`  
Current HEAD: `fd7a5aa` (`docs(idser): record fixture regression remediation`)  
Relevant GO commit: `0209921f5bc0cc1aaed6d74b2c30098f3e68b9b8`  
Relevant CK artifact: `project's goal/feedback/IDSER-BATCH-05-56cbb80-verification.md` (`CHANGES_REQUIRED`)  
Relevant CFC commit: `56cbb8063f9e771ddef502b263ab03820ad1e20c` (`test(idser): repair semantic fixture import`)  
Prior HMN authorization: `HMN-IDSER-005-004`, consumed by `56cbb80`  
Worktree state: no tracked modifications. Existing untracked planning and
feedback artifacts are outside this authorization and must be preserved.

## Diagnosis

The repaired integration harness now proves the core worker/replay invariant:
CK-001 is resolved. CK-002 remains because the harness covers only combined
acknowledgement-loss/cleanup, unavailable-handler, and successor replay cases.
The frozen ticket requires explicit evidence for the remaining failure and
restart matrix through the same real semantic worker, Bridge database, HTTP
Mistral, and Atlas route path.

There is one implementation seam the matrix must settle: after a durable result
has been staged, an Atlas delivery timeout or transport cancellation must remain
retryable. It must not be converted into `client.fail`, because that would
terminally reject the already-staged result. The current dispatcher catches
non-`handoff was rejected` errors after staging, so the expanded timeout/outage
cases may expose that exact defect. This correction is authorized only at that
post-stage handoff boundary.

## Ticket-authority trace

- IDSER-005 acceptance criteria 2--5 and its validation section require the
  remaining delivery/restart, duplicate/fence, configured-provider, bounds,
  timeout, cancellation, and shutdown proofs.
- CK-002 at `56cbb80` expressly identifies these absent cases while confirming
  the working production-path harness and resolving CK-001.
- The execution contract requires durable output to be replayed after a failed
  handoff; only errors before trusted output may take the Atlas failure route.
  That authority permits a narrow post-stage delivery-failure correction if the
  new integration scenario demonstrates the current catch path violates it.

## Decision

`AUTHORIZE_NEXT_CFC`

Authorize one bounded CFC cycle for the unresolved CK-002 production-path
matrix. It must extend the existing passing semantic integration harness, not
replace it or re-open the resolved fencing work.

## Authorized scope

1. Refactor only `semantic-worker.integration.test.ts` as needed to share its
   existing real PostgreSQL/pg-boss/replay/Fastify Atlas/HTTP Mistral fixture.
   Add separate named deterministic cases, using unique execution and
   idempotency identities, for the following required groups:
   - delivery outage and Atlas result timeout after staging; restart after
     staging; restart after Atlas acceptance before Bridge completion; and
     cleanup fault. Each must retain the exact staged envelope, call Mistral
     once, produce one Atlas logical effect, and eventually complete and clean
     the replay record with a fenced effect lease;
   - duplicate queue jobs, an expired/superseded lease, and a conflicting
     idempotency key/execution. Assert no duplicate provider call or Atlas
     logical effect, no staged-envelope replacement, no stale cleanup, and no
     stale terminal failure;
   - configured semantic failures through the actual worker and HTTP mocks:
     missing credential, provider credential rejection, malformed provider
     JSON, schema-valid JSON with schema-invalid semantic result, provider
     request bound, provider response bound, Atlas context/result bound, provider
     timeout, Atlas timeout, cancellation, and orderly worker stop.
2. For each case, assert the public bounded outcome and inspect the actual
   `bridge.background_effects` status/lease generation, the
   `bridge.semantic_result_delivery` row, provider-call count, Atlas lifecycle,
   and Atlas acceptance/failure handler counts. Also assert errors, queued job
   data, and route responses exclude provider credentials, prompts, grants,
   source content, and result bodies.
3. If the delivery-outage or Atlas-timeout integration case confirms that a
   durable staged envelope reaches `client.fail`, make the minimal production
   correction in `semantic-worker.ts`: distinguish errors before any trusted
   stage from retryable post-stage result-delivery errors. The latter must be
   rethrown to pg-boss while preserving the replay row; they must not invoke the
   Atlas failure route. Include the exact regression assertion in the same
   integration suite. No other production behavior change is authorized.
4. Keep and run the existing `test:semantic-integration` case. Register any
   additional focused semantic integration command if it improves deterministic
   execution, and keep every case included in the full Bridge test script.
   Update the IDSER-005 CFC checkpoint with scenario-by-scenario evidence,
   commands, service state, and limitations.

## Required validation

- Rebuild the Compose image after source changes, start PostgreSQL and required
  Atlas/Bridge services, and verify migrations before tests. Do not rely on a
  stale image or a `--no-deps` environment without PostgreSQL.
- Run Bridge typecheck; the full semantic integration matrix; `test:semantic`;
  the complete Bridge suite with database services available; consumed Atlas
  Core and DB semantic authority/route suites; relevant contract and skills
  tests; and `git diff --check`.
- Record for every named scenario its provider calls, Atlas effect/failure
  calls and lifecycle, Bridge effect/lease state, replay row outcome, and
  cleanup outcome. No live Mistral credential is permitted.

## Forbidden work

- Do not alter resolved CK-001 fencing behavior, replay schema, queue
  technology, provider-selection policy, Atlas truth authority, semantic
  contracts, extraction/reconciliation behavior, deployment configuration, or
  downstream IDSER-006--011 work.
- Do not use injected-fetch/unit-only doubles for the authorized matrix, skip
  integration cases, weaken assertions, swallow a post-stage delivery error,
  terminally fail an already-staged result, overwrite replay output, or perform
  unfenced cleanup.
- Do not add a service, polling process, direct Atlas SQL from Bridge, live
  credential, or speculative migration. Do not overwrite, stage, commit, or
  delete pre-existing untracked artifacts.
- After one remediation commit, await CK. A later unresolved CK requires a new
  explicit `hmn` invocation.

## Handoff

CFC may make exactly one remediation commit consuming `HMN-IDSER-005-005`,
retain IDSER-005 as `awaiting_review`, and hand that exact commit directly to
CK. CK is limited to the unresolved original CK-002 matrix.

Expected next command: `cfc IDSER-005`
