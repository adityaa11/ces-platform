# HMN Authorization: IDSER-005

Ticket: `IDSER-005: Production semantic worker and replay`  
Batch: `IDSER-BATCH-05`  
HMN authorization ID: `HMN-IDSER-005-003`  
Invocation: explicit user `hmn` delegation  
Current workflow state: the CFC commit consuming `HMN-IDSER-005-002` received
post-CFC CK `CHANGES_REQUIRED`; original CK-001 and CK-002 remain unresolved.

Frozen ticket reference: `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-005-production-semantic-worker-and-replay.md`  
Current HEAD: `17c567f` (`docs(idser): record semantic evidence remediation`)  
Relevant GO commit: `0209921f5bc0cc1aaed6d74b2c30098f3e68b9b8`  
Relevant CK artifact: `project's goal/feedback/IDSER-BATCH-05-b4af1f5-verification.md` (`CHANGES_REQUIRED`)  
Relevant CFC commit: `b4af1f50688ffa07f7f15f0059448b2e2903cea1` (`test(idser): cover semantic provider and handoff path`)  
Prior HMN authorization: `HMN-IDSER-005-002`, consumed by `b4af1f5`  
Worktree state: no tracked modifications. Existing untracked planning and
feedback artifacts are outside this authorization and must be preserved.

## Diagnosis

The prior CFC added a useful configured-provider/client unit test, but it did
not execute the frozen-ticket production chain. It constructs `MistralProvider`
and `createAtlasSemanticClient` with injected fetch doubles; it never starts a
semantic worker, obtains a BSS-006 effect lease, invokes
`createSemanticResultReplay`, reads or writes `bridge.semantic_result_delivery`,
or reaches the Atlas semantic routes over HTTP. Its evidence cannot establish
the replay, fencing, retry, or terminal-lifecycle invariants.

The correct remediation is therefore not another broad test expansion. It is a
single deterministic integration harness patterned on
`perception-integration.test.ts`: real PostgreSQL roles and Bridge tables, a
real pg-boss worker created by `createBackgroundWorker`, real replay adapter,
real configured `MistralProvider` using an HTTP mock, and a listening Fastify
host that dispatches the actual `createSemanticInternalRoutes` route handlers.
The current code is directionally correct; this cycle must prove it and repair
only a defect exposed by that proof.

## Ticket-authority trace

- IDSER-005 requires a fenced Bridge claim, immutable staged output, a bounded
  Atlas HTTP handoff, completion before replay cleanup, retry-safe crash
  windows, and no second provider call after staging.
- Its validation explicitly calls for mocked-HTTP Mistral responses, both
  authorized skills, Bridge ledger observations, Atlas handler observations,
  restart and fencing races, and bounded configuration/error behavior.
- CK-001 requires an actual worker/database stale-claim proof. CK-002 requires
  the production integration matrix. The `b4af1f5` verification identifies no
  new design question; these remain repairable under the frozen ticket.

## Decision

`AUTHORIZE_EVIDENCE_REMEDIATION`

Authorize one new, bounded CFC cycle. It replaces the insufficient semantic
unit-only proof with the actual database/worker/HTTP integration proof required
by CK-001 and CK-002. This is a new remediation cycle; it does not continue the
one consumed by `b4af1f5`.

## Authorized scope

1. Add and register `semantic-worker.integration.test.ts`, gated only by the
   existing `DATABASE_URL` convention used by Bridge integration tests. Model
   fixture setup, unique IDs, temporary fault triggers, role-specific Atlas and
   Bridge connections, polling, and teardown on `perception-integration.test.ts`.
   It must use `createBackgroundWorker`, its actual pg-boss queue, a real
   `createSemanticResultReplay`, and real `bridge.background_effects` and
   `bridge.semantic_result_delivery` rows.
2. Within that suite, start a loopback Fastify Atlas test host. Register the
   actual `createSemanticInternalRoutes` context/result/failure handlers backed
   by `PostgresSemanticAuthority`; send requests with the production
   `createAtlasSemanticClient` and its default HTTP fetch. Start a separate
   loopback Mistral mock HTTP server and instantiate `MistralProvider` with its
   normal fetch and configured mock base URL. Do not use injected fetch doubles
   for the end-to-end cases.
3. Drive `runSemanticJob` through the semantic queue handler used by the worker
   with that provider, client, and replay adapter. Cover both
   `atlas.semantic.extract/v1` and `atlas.semantic.reconcile/v1` with
   schema-valid mocked structured responses. Assert each provider call count,
   Atlas route/handler invocation count and execution lifecycle, effect status
   and lease generation, and replay-row lifecycle.
4. In that same real path, prove these precise outcome groups:
   - normal delivery plus acknowledgement loss, delivery outage, restart after
     staging, restart after Atlas acceptance before Bridge completion, and
     cleanup fault: exact durable envelope replay, one provider call, one
     logical Atlas handler effect, eventual fenced completion and cleanup;
   - duplicate jobs, lease expiry/superseded claimant, and conflicting stage:
     no envelope replacement, no duplicate logical effect, no stale terminal
     failure, and no stale cleanup. The stale-winner case must use a real
     `background_effects` lease transition and a stored same-execution envelope;
   - actual Atlas application's currently unavailable semantic acceptance
     handler: result delivery remains retryable and cannot be reported as a
     completed Bridge effect. This is the required handler-unavailable proof,
     not a reason to change IDSER-006/007 ownership.
5. Add focused deterministic cases through configured public seams for unknown
   skill/version, absent and rejected credentials, malformed provider JSON,
   schema-invalid output, request/context/result byte bounds, provider timeout,
   Atlas timeout, cancellation, and orderly worker stop. They must assert only
   bounded public codes/statuses and confirm that credentials, prompts, grants,
   source content, and result bodies do not occur in errors, jobs, or logs.
6. Register the integration suite separately (for example
   `test:semantic-integration`) and include it in the complete Bridge suite.
   Retain `semantic-client.integration.test.ts` as supplemental unit coverage;
   do not claim it satisfies integration acceptance. Update the IDSER-005 CFC
   checkpoint with exact commands and per-scenario observations.
7. A production code change is permitted only if an authorized integration case
   demonstrates a concrete violation. Limit it to the existing semantic worker,
   replay, client, or worker cleanup seams and include its regression case in
   the same remediation commit.

## Required validation

- Bring up the normal Compose dependencies (not a `--no-deps` run that omits
  PostgreSQL) and verify the current migrations, Atlas service, and Bridge
  worker dependencies before the integration suite.
- Run Bridge typecheck; the new semantic integration suite; `test:semantic`;
  the complete Bridge suite with its required database service available; the
  consumed Atlas Core and DB semantic authority/route suites; relevant contract
  and skill tests; and `git diff --check`.
- Record the exact commands, service status, provider-call count, Atlas
  lifecycle/handler count, effect lease/status, replay-row state, and cleanup
  result for every scenario. No live provider credential is permitted.

## Forbidden work

- Do not substitute injected-fetch/unit doubles for the authorized integration
  path; do not skip a failed integration test because a service was omitted.
- Do not redesign the queue, persistence, provider, or Atlas authority;
  introduce direct Atlas SQL, a new service, polling, provider policy, live
  credentials, or a speculative migration.
- Do not alter ticket scope, semantic contracts, extraction/reconciliation
  behavior, acceptance criteria, or downstream IDSER-006--011 work. Do not
  weaken replay fencing, overwrite staged output, swallow lease/delivery
  failures, or terminally fail a staged winner.
- Do not overwrite, stage, commit, or delete pre-existing untracked artifacts.
  After this one remediation commit, await CK; another unresolved CK requires a
  fresh explicit `hmn` invocation.

## Handoff

CFC may make one remediation commit consuming `HMN-IDSER-005-003`, retain
IDSER-005 as `awaiting_review`, and hand that exact commit directly to CK.
CK is limited to verifying unresolved original findings CK-001 and CK-002.

Expected next command: `cfc IDSER-005`
