# HMN Authorization: IDSER-005

Ticket: `IDSER-005: Production semantic worker and replay`  
Batch: `IDSER-BATCH-05`  
HMN authorization ID: `HMN-IDSER-005-007`  
Invocation: explicit user `hmn` delegation  
Current workflow state: post-CFC CK verification returned `CHANGES_REQUIRED`.
CK-001 remains resolved; original CK-002 is the only open finding.

Frozen ticket reference: `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-005-production-semantic-worker-and-replay.md`  
Current HEAD: `1bc3fba695771954576313a5f782b60d15541a26` (`test(idser): extend semantic worker matrix`)  
Relevant GO commit: `0209921f5bc0cc1aaed6d74b2c30098f3e68b9b8`  
Relevant CK artifact: `project's goal/feedback/IDSER-BATCH-05-1bc3fba-verification.md` (`CHANGES_REQUIRED`)  
Relevant CFC commit: `1bc3fba695771954576313a5f782b60d15541a26`  
Prior HMN authorization: `HMN-IDSER-005-006`, consumed by `1bc3fba`  
Worktree state: no tracked modifications. Existing untracked planning and
feedback artifacts are outside this authorization and must be preserved.

## Diagnosis

The current production-path harness and its existing cases pass. CK-002 remains
open only because five required semantic-worker cases are absent and the added
failure cases do not consistently prove the required Bridge lease/completion,
provider-call, and redaction observations. The correct final remediation is to
complete those exact cases in the existing Compose-backed harness and make the
evidence uniform. CK-001 is resolved and must not be revisited.

This authorization is deliberately exhaustive for the remaining CK-002 scope:
one CFC commit must add every missing case below, preserve all current passing
cases, and provide the evidence table CK needs to determine the ticket result
without inference from generic tests.

## Ticket-authority trace

- IDSER-005 validation requires actual configured semantic worker, HTTP
  Mistral, Atlas internal route, Bridge ledger, and pg-boss proof for restart,
  conflict, bounds, cancellation, and orderly-stop behavior.
- `IDSER-BATCH-05-1bc3fba-verification.md` identifies the exact absent cases:
  conflicting idempotency/stage, Atlas context bound, Atlas result-envelope
  bound, semantic-worker cancellation, and in-flight orderly worker stop plus
  fresh-worker recovery. It also requires complete per-scenario observations.
- The execution contract authorizes minimal corrections in the existing worker,
  replay, client, or provider seams only if these tests expose a violation. A
  post-stage error must preserve durable replay and remain retryable; a
  pre-stage failure must never fabricate trusted output.

## Decision

`AUTHORIZE_EVIDENCE_REMEDIATION`

Authorize exactly one final bounded CFC evidence-remediation cycle for all
remaining original CK-002 work. The production implementation is not to be
redesigned; a code change is permitted only to correct a defect demonstrated by
one of the named production-path cases.

## Authorized scope

Extend `apps/agents-bridge/tests/semantic-worker.integration.test.ts`. It may
be factored into named tests and shared fixture helpers, but every named case
must retain real PostgreSQL roles, `createBackgroundWorker`/pg-boss,
`bridge.background_effects`, `bridge.semantic_result_delivery`, configured
default-fetch `MistralProvider`, loopback HTTP `createAtlasSemanticClient`, and
actual `createSemanticInternalRoutes`. No injected-fetch or unit substitute is
evidence for this authorization.

### Required new cases

1. **Conflicting idempotency/stage.** First create a durable staged winner for
   execution A while result delivery is unavailable. Submit execution B with
   the same idempotency key through the actual worker. Prove A's exact persisted
   envelope is unchanged; B has no accepted logical effect and does not replace
   A; no stale cleanup or terminal failure invalidates A; then restore delivery
   and prove A alone completes and cleans up. Record provider calls separately
   for A and B.
2. **Atlas context bound.** Seed a context whose serialized response exceeds
   the semantic context limit and drive it through the real context route and
   worker. Prove the route/client returns only a bounded redacted error, Mistral
   is never called, no replay row is created, no acceptance occurs, and the
   Atlas failure/effect result is bounded and recorded.
3. **Atlas result-envelope bound after stage.** Return a schema-valid semantic
   result whose envelope exceeds the semantic result limit. Prove it stages
   immutably before the Atlas client rejects the oversized handoff; no Atlas
   failure route is called for that durable result; the Bridge effect is not
   completed; the identical replay row remains for retry. If a later permitted
   bounded delivery is used to drain it, prove one provider call, one logical
   Atlas effect, fenced completion, and cleanup. Do not replace the staged
   envelope to make the test pass.
4. **Semantic-worker cancellation.** Drive an actual in-flight provider or
   Atlas request with its real job `AbortSignal`, then cancel it. Assert the
   distinction dictated by staging: before immutable stage there is no replay
   or accepted effect and only a bounded cancellation outcome; after immutable
   stage there is no terminal failure, the replay row is retained, and a later
   worker may deliver it once. In both variants record provider calls, Atlas
   acceptance/failure counts and lifecycle, and effect lease/status.
5. **Orderly in-flight worker stop and fresh worker.** Block the actual worker
   after the test has observed the intended in-flight boundary, call
   `worker.stop()`, and start a fresh worker against the same Bridge rows. For
   a pre-stage stop, at-least-once provider execution is allowed but no trusted
   effect may precede the fresh worker. For a post-stage stop, prove no second
   provider call, immutable replay redelivery, one Atlas logical effect at
   most, later fenced completion, and replay cleanup. The test must stop while
   a job is active; stopping only between retries is insufficient.

### Uniform evidence contract

For every new case and every pre-existing CK-002 case (extract/reconcile,
acknowledgement loss, completion fault, cleanup fault, unavailable handler,
expired successor, delivery outage, Atlas timeout, duplicate job, missing and
rejected credential, malformed JSON, schema-invalid result, provider timeout,
and provider request/response bounds), add or retain explicit assertions and
record them in the checkpoint table:

- provider call count; Atlas acceptance and failure-handler counts; Atlas
  execution lifecycle;
- `background_effects` status, lease owner, lease generation, and completion
  state; replay-row presence, envelope identity, and cleanup result;
- provider-call count is explicitly asserted in each bounds case;
- job payload, public HTTP response, stored error, and thrown error contain no
  credential, prompt, grant, source content/path, or result body.

If any named case reveals a defect, CFC may make the smallest correction only
at `semantic-worker.ts`, `semantic-result-replay.ts`, `atlas-semantic-client.ts`,
`worker.ts`, or `providers/mistral.ts`, and must retain a direct regression
assertion in this matrix. Do not make unrelated production changes.

## Required validation

- Rebuild changed Compose images. Start and verify healthy `postgres`, `atlas`,
  `agents-bridge`, and `agents-bridge-worker`; run the database migration check
  before the integration matrix. Do not test against a stale image or use a
  PostgreSQL-free `--no-deps` execution.
- Run Bridge typecheck; the complete named semantic integration matrix;
  `test:semantic`; the full registered Bridge suite with database services;
  Atlas Core semantic route/bound suite; Atlas DB semantic authority suite;
  relevant contracts and skills suites; and `git diff --check`.
- Update the IDSER-005 CFC checkpoint with one table row per required case,
  including exact commands and the uniform evidence contract above. State
  explicitly that all CK-002 scenarios ran on the production-path harness and
  that no live Mistral credential was used.

## Forbidden work

- Do not modify resolved CK-001 fencing, replay schema, queue technology,
  provider policy, Atlas truth authority, semantic contracts/skills, deployment
  configuration, or downstream IDSER-006--011 work.
- Do not skip, weaken, or fake a required case; use generic unit/provider/Core
  coverage as a substitute; overwrite a replay envelope; unfenced-clean a row;
  or terminally fail a valid staged envelope.
- Do not add a service, poller, direct Atlas SQL from Bridge, live credential,
  speculative migration, or unrelated refactor. Do not overwrite, stage,
  commit, or delete pre-existing untracked artifacts.
- This authorization allows one remediation commit only. A further CK failure
  requires a new explicit `hmn` invocation.

## Handoff

CFC may make exactly one commit consuming `HMN-IDSER-005-007`, retain IDSER-005
as `awaiting_review`, and hand that exact commit directly to CK. CK is limited
to original CK-002. If every named case and validation gate above is evidenced,
CK has the complete frozen-ticket basis to assess a PASS.

Expected next command: `cfc IDSER-005`
