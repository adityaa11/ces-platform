# HMN Authorization: IDSER-005

Ticket: `IDSER-005: Production semantic worker and replay`  
Batch: `IDSER-BATCH-05`  
HMN authorization ID: `HMN-IDSER-005-004`  
Invocation: explicit user `hmn` delegation  
Current workflow state: post-CFC CK verification of `HMN-IDSER-005-003` returned
`CHANGES_REQUIRED`; the newly registered integration suite aborts during fixture
bootstrap before any original CK scenario runs.

Frozen ticket reference: `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-005-production-semantic-worker-and-replay.md`  
Current HEAD: `820247f` (`docs(idser): record production-path evidence remediation`)  
Relevant GO commit: `0209921f5bc0cc1aaed6d74b2c30098f3e68b9b8`  
Relevant CK artifact: `project's goal/feedback/IDSER-BATCH-05-35784b0-verification.md` (`CHANGES_REQUIRED`)  
Relevant CFC commit: `35784b0c45ff27c504b61a55cc16c99466873614` (`fix(idser): recover semantic replay cleanup`)  
Prior HMN authorization: `HMN-IDSER-005-003`, consumed by `35784b0`  
Worktree state: no tracked modifications. Existing untracked planning and
feedback artifacts are outside this authorization and must be preserved.

## Diagnosis

The immediately preceding CFC introduced the registered integration test but
left its semantic-execution fixture unable to resolve the canonical context
fingerprint helper. CK reports the unavailable `@atlas/db` export; the current
source also reaches into `packages/atlas-db/src`, which is not a stable package
boundary. Either form makes the test bootstrap dependent on a helper it has not
validly imported. As a result, no real worker claim, replay row, provider call,
or Atlas route assertion has executed.

This is a direct regression in the prior authorized remediation, not a new
semantic-worker defect and not authority to extend the scenario matrix. The
effective next action is to make the already-written fixture self-contained and
then run the existing production-path suite under its required Compose services.

## Ticket-authority trace

- IDSER-005 requires deterministic production-path evidence, but it does not
  require exposing internal Atlas DB helpers as public production APIs.
- CK-001 and CK-002 remain open solely because the test stops before exercise.
  The CK explicitly permits repair of the registered test's unavailable symbol
  and completion of its already-authorized evidence.
- `HMN-IDSER-005-003` authorized the worker/pg-boss/Bridge/HTTP harness and
  `35784b0` supplies it. The smallest continuation is to repair that harness;
  no new provider, queue, data model, or application behavior is needed.

## Decision

`AUTHORIZE_DIRECT_REGRESSION_REPAIR`

Authorize one bounded CFC cycle to repair only the integration-fixture import
regression and prove that the existing registered scenarios execute. This is a
new remediation cycle and consumes this authorization.

## Authorized scope

1. In `apps/agents-bridge/tests/semantic-worker.integration.test.ts`, remove
   any import of `canonicalSemanticFingerprint` from `@atlas/db` or from a
   private `packages/atlas-db/src` path. For the fixed string capability used by
   this fixture, create the exact fixture fingerprint locally with Node's
   `createHash("sha256").update(JSON.stringify(capability)).digest("hex")`.
   This is equivalent for the literal string and avoids creating or depending
   on a new public Atlas DB API.
2. Keep the test's existing worker, pg-boss, replay, loopback Fastify Atlas,
   loopback HTTP Mistral, acknowledgement-loss, cleanup, unavailable-handler,
   and stale-successor cases intact. Do not replace them with injected-fetch or
   unit-only substitutes, reduce their assertions, or add unrelated scenarios.
3. If the now-running existing test exposes a directly adjacent fixture wiring
   mistake before its first intended scenario assertion, make only the smallest
   test-fixture correction necessary to start that existing harness. Do not
   alter production worker, replay, client, Atlas authority, migration, queue,
   contracts, or package exports in this cycle.
4. Record the exact import/fixture correction and the actual command outputs in
   the IDSER-005 CFC checkpoint. The remediation commit must state that it
   consumes `HMN-IDSER-005-004` and then awaits CK.

## Required validation

- Start normal Compose dependencies including PostgreSQL; do not run the suite
  in a `--no-deps` environment that lacks `postgres`.
- Run Bridge typecheck; `test:semantic-integration`; `test:semantic`; the full
  Bridge suite with its database service available; and `git diff --check`.
- For the integration test, record that it reaches all existing scenario
  assertions plus its observed provider-call counts, Atlas effect counts,
  `background_effects` lease/status values, replay-row results, and cleanup
  state. A startup-only pass is insufficient.

## Forbidden work

- Do not export internal DB helpers merely for this test, import a private
  source module across package boundaries, or alter public package API surface.
- Do not change production code, schema, migrations, queue/retry design,
  provider selection, semantic contracts, acceptance behavior, or downstream
  IDSER-006--011 scope.
- Do not weaken, skip, or convert the production-path test into a unit double;
  do not suppress its errors. Do not overwrite, stage, commit, or delete
  pre-existing untracked artifacts.
- Do not begin additional remediation after this one commit without CK
  verification and a fresh explicit `hmn` invocation.

## Handoff

CFC may make exactly one regression-repair commit consuming
`HMN-IDSER-005-004`, retain IDSER-005 as `awaiting_review`, and hand that
commit directly to CK. CK remains limited to original CK-001 and CK-002.

Expected next command: `cfc IDSER-005`
