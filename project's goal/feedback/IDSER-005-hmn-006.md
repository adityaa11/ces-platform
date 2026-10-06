# HMN Authorization: IDSER-005

Ticket: `IDSER-005: Production semantic worker and replay`  
Batch: `IDSER-BATCH-05`  
HMN authorization ID: `HMN-IDSER-005-006`  
Invocation: explicit user `hmn` delegation  
Current workflow state: post-CFC CK verification returned `CHANGES_REQUIRED`.
Original CK-001 remains resolved; original CK-002 is the only open finding.

Frozen ticket reference: `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-005-production-semantic-worker-and-replay.md`  
Current HEAD: `72c06f2fc706e12779971ed15379d4ae5b96cf0a` (`fix(idser): retain staged semantic delivery retries`)  
Relevant GO commit: `0209921f5bc0cc1aaed6d74b2c30098f3e68b9b8`  
Relevant CK artifact: `project's goal/feedback/IDSER-BATCH-05-72c06f2-verification.md` (`CHANGES_REQUIRED`)  
Relevant CFC commit: `72c06f2fc706e12779971ed15379d4ae5b96cf0a`  
Prior HMN authorization: `HMN-IDSER-005-005`, consumed by `72c06f2`  
Worktree state: no tracked modifications. Existing untracked planning and
feedback artifacts, including earlier HMN/CK records, are outside this
authorization and must be preserved.

## Diagnosis

The current Compose-backed fixture is a valid production-path harness: it uses
pg-boss, Bridge effect and replay rows, configured HTTP `MistralProvider`, and
Atlas internal routes. It now proves both production skills, acknowledgement
loss with completion/cleanup retries, handler unavailability followed by an
expired successor, delivery outage, Atlas result timeout, and duplicate queue
delivery. The post-stage timeout correction is therefore evidence-backed.

CK correctly remains `CHANGES_REQUIRED` because the fixture is one combined
test and does not implement the remaining mandatory cases. In particular it
does not simulate process restarts at either required crash boundary, does not
exercise a true conflicting idempotency/staging input, and does not drive the
listed provider, Atlas-boundary, cancellation, and shutdown failures through
the semantic worker's real HTTP/Atlas/replay path. Generic provider or worker
tests cannot substitute for those observations.

## Ticket-authority trace

- IDSER-005 execution contract requires immutable replay after staging,
  successful Atlas handoff before logical completion, and fenced cleanup only
  after both; acceptance criteria 1--5 require bounded failures, replay-safe
  restart/duplicate handling, and no TestRuntime fallback.
- IDSER-005 Validation explicitly requires mocked HTTP `MistralProvider`
  coverage for both skill definitions, acknowledgement loss, delivery outage,
  restart after staging, restart after Atlas acceptance, lease/conflict races,
  configuration, malformed output, bounds, timeout, cancellation, and orderly
  stop, with Bridge-ledger and Atlas-handler evidence.
- `IDSER-BATCH-05-72c06f2-verification.md` confirms the implemented cases and
  identifies the unimplemented cases above as the unresolved portion of
  original CK-002. It reports no scope change.

## Decision

`AUTHORIZE_NEXT_CFC`

Authorize exactly one new bounded CFC cycle for the complete remaining
original CK-002 scenario matrix. This authorization supersedes no prior CK
event and is newer than the CK event it addresses. It does not reopen CK-001.

## Authorized scope

Extend the existing registered
`apps/agents-bridge/tests/semantic-worker.integration.test.ts` harness. Split
or refactor it into independently named deterministic cases where needed; do
not replace real PostgreSQL/pg-boss/Bridge replay/HTTP Mistral/Atlas-route
coverage with unit or injected-fetch substitutes. Preserve every currently
passing case and add the following missing cases.

| Required named scenario | Required production-path assertions |
|---|---|
| Restart after immutable stage, before Atlas acceptance | First worker stages one envelope and exits/restarts while delivery is unavailable; a fresh worker redelivers that exact envelope, calls Mistral once, produces one Atlas logical effect, reaches fenced completion, and removes replay only after completion. |
| Restart after Atlas acceptance, before Bridge completion | Force the Bridge completion boundary to fail after Atlas accepts; stop/recreate the worker and prove one provider call, one Atlas effect, idempotent redelivery if attempted, later fenced completion, and eventual replay cleanup. |
| Conflicting idempotency/stage | Drive the actual replay/worker path with the same idempotency identity and an incompatible execution or envelope. Assert immutable winner preservation, no replacement, no duplicate provider/Atlas logical effect, no stale cleanup, and no terminal failure of a valid staged winner. |
| Missing credential and provider credential rejection | Through configured worker/provider composition and HTTP mocks, prove bounded failure delivery/state, zero unintended logical effects, no replay ambiguity, and no credential value in errors, jobs, or route responses. |
| Malformed provider JSON and schema-invalid structured result | Prove each is rejected by the actual semantic worker before trusted staging, reaches only the bounded failure path, creates no accepted effect, and exposes no sensitive payload. |
| Provider request and response bounds | Exercise an oversized semantic request and oversized provider response through the configured adapter. Assert no bypass/fallback, bounded failure state, no trusted replay result, and redacted diagnostics. |
| Atlas context and result-envelope bounds | Exercise both Atlas boundary limits through the real context/result routes. For context failure, assert no provider call. For result-envelope failure after staging, assert retry-safe durable replay and no erroneous terminal failure of the envelope. |
| Provider timeout | Cause the configured HTTP provider request to time out; assert bounded pre-stage failure, no trusted replay result, no duplicate effect, and no secrets in public/error data. |
| Cancellation | Abort at the semantic worker/provider or Atlas handoff boundary with a real `AbortSignal`; distinguish pre-stage bounded failure from post-stage retry preservation, assert no hidden continuation or duplicate logical effect, and verify replay/effect state. |
| Orderly worker stop | Stop the actual background worker during an in-flight semantic job, then start a fresh worker against the same Bridge state. Assert the defined cancellation/retry result, one immutable provider result at most once staged, one Atlas effect at most, and fenced eventual cleanup. |

For every added case, use distinct project/workspace/document/execution and
idempotency identities. Record and assert all of: provider-call count; Atlas
acceptance and failure-handler counts; Atlas execution lifecycle; actual
`bridge.background_effects` status, lease owner/generation, and completion
state; actual `bridge.semantic_result_delivery` presence/content identity and
cleanup outcome. Inspect error objects, queued job data, and HTTP responses to
prove they exclude credentials, prompts, grants, source content, and result
bodies.

The already implemented cases remain required regression coverage: extraction
and reconciliation structured dispatch, acknowledgement-loss plus
completion/cleanup retry, unavailable handler with expired-successor replay,
delivery outage, Atlas result timeout, and duplicate queue delivery. Give them
their own clear scenario evidence in the CFC checkpoint even when fixture setup
is shared.

If a newly required case exposes a production defect, CFC may make only the
minimal correction at the demonstrated semantic worker, replay, client, or
bounded-provider seam. Any post-stage delivery/cancellation/bound error must
preserve the immutable replay envelope and return retryably to pg-boss; it must
not invoke the Atlas terminal-failure route. Any pre-stage failure must remain
bounded and must not fabricate a replay result. No other production redesign
is authorized.

## Required validation

- Rebuild the Compose images; start `postgres`, `atlas`, `agents-bridge`, and
  `agents-bridge-worker`; record healthy service state and successful database
  migration check before integration tests. Do not use a stale image or a
  PostgreSQL-free `--no-deps` execution for database-backed tests.
- Run Bridge typecheck; the complete named semantic integration matrix;
  `test:semantic`; the full registered Bridge suite with database services
  reachable; consumed Atlas Core semantic-route/bound tests; DB semantic
  authority tests; relevant contracts and skills tests; and `git diff --check`.
- Register every new case in `test:semantic-integration` and the full Bridge
  `test` script. Deterministic loopback mocks only: no live Mistral credential.
- Update the IDSER-005 CFC checkpoint with a scenario-by-scenario evidence
  table containing command, provider calls, Atlas effect/failure counts and
  lifecycle, Bridge lease/effect state, replay-row state, cleanup result,
  service state, and any remaining limitation. A generic-suite pass statement
  is insufficient.

## Forbidden work

- Do not change resolved CK-001 fencing behavior, replay schema, queue
  technology, provider-selection policy, Atlas truth authority, semantic
  contracts/skills, deployment configuration, or downstream IDSER-006--011
  scope.
- Do not use unit-only or injected-fetch substitutes for this matrix; weaken
  assertions; swallow failures; overwrite replay output; unfenced-clean a
  replay row; or terminally fail a valid already-staged envelope.
- Do not add services, pollers, direct Atlas SQL from Bridge, live credentials,
  speculative migrations, or unrelated refactors. Do not overwrite, stage,
  commit, or delete pre-existing untracked artifacts.

## Handoff

CFC may make exactly one remediation commit consuming `HMN-IDSER-005-006`.
Keep IDSER-005 `awaiting_review`, record this authorization ID and the complete
scenario evidence in its CFC checkpoint, then hand that exact commit to CK.
CK is limited to original CK-002 and must verify the named production-path
matrix rather than infer coverage from generic tests. Any further unresolved
CK result requires a new explicit user `hmn` invocation.

Expected next command: `cfc IDSER-005`
