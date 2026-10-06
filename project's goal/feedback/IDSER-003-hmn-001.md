# HMN Authorization: IDSER-003

Ticket: `IDSER-003: Transactional project bundle kickoff`
Batch: `IDSER-BATCH-03`
HMN authorization ID: `HMN-IDSER-003-001`
Invocation: explicit user `hmn` delegation
Current workflow state: the first CFC remediation was committed, and post-CFC CK verification returned `CHANGES_REQUIRED` for the remaining portion of CK-002.

Frozen ticket reference: `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-003-transactional-project-bundle-kickoff.md`
Current HEAD: `1b19d1d066eec568a0e61fbab1a93b7d90ef51ab` (`docs(idser): record IDSER-003 CFC remediation`)
Relevant GO commit: `1c689126cdb1ab2fa44a3cd7f6c9c220846dd28c` (`feat(idser): atomically kick off first perception`)
Relevant CK artifact: `project's goal/feedback/IDSER-BATCH-03-470a161-verification.md` (`CHANGES_REQUIRED`)
Relevant CFC commit: `470a161a0b5c193d0b6d5030056d1894b94b9f5d` (`test(idser): prove transactional kickoff remediation`)
Prior HMN authorization: none found
Worktree state: no tracked modifications; pre-existing untracked planning and review artifacts are present, including the CK artifacts above.

## Diagnosis

The first CFC remediation resolved CK-001 and corrected the rollback case so a real transactional pg-boss enqueue occurs before a controlled later transaction failure. CK verified the relevant Compose tests and found no direct regression. CK-002 remains open solely because the repository test observes the separate connection only after `repository.create` has returned, and its failure assertion does not enumerate every affected Atlas graph row.

The frozen ticket requires actual DB/job visibility from a second connection across commit and a rollback proof for the full graph. The remaining work therefore closes required deterministic evidence; it does not require a product, schema, queue, runtime, storage, source-grant, or architecture change.

## Ticket-authority trace

- IDSER-003 acceptance criterion 2 requires every DB/queue-write failure to roll back the entire graph/job and prohibits loss of kickoff after commit.
- IDSER-003 Validation requires Compose integration to inspect Atlas and pg-boss rows before and after commit, injected enqueue/transaction failure, and first-job visibility only after commit using a second DB connection.
- `REV-READY-IDSER-003-01` requires actual DB/job visibility and crash evidence proving a shared transaction.
- `IDSER-BATCH-03-470a161-verification.md` resolves CK-001 and identifies the remaining CK-002 before/after visibility and complete rollback-row assertions as the only unresolved finding.

## Decision

`AUTHORIZE_EVIDENCE_REMEDIATION`

Authorize one new, bounded CFC cycle for the remaining CK-002 proof only. This authorization is newer than the CK verification it addresses and is consumed by exactly one remediation commit.

## Authorized scope

1. Extend `packages/atlas-db/tests/project-repository.integration.test.ts` and only its directly supporting test-local helpers to coordinate the existing real transactional perception queue producer: after its real enqueue has run but before the enclosing Atlas transaction may commit, observe from the independent `admin` PostgreSQL connection that the matching pg-boss job and associated project graph are not visible; release the test gate, await creation, then prove the matching records are visible after commit.
2. Keep the real `createTransactionalPerceptionQueueProducer` and the current controlled post-enqueue failure. Explicitly assert after rollback that no rows belonging to the failed creation remain in `atlas.project`, `atlas.project_member`, `atlas.workspace`, `atlas.document`, `atlas.extraction_bundle`, `atlas.extraction_bundle_document`, `atlas.document_perception_execution`, or `atlas.document_perception_source_grant`, and that no matching `pgboss.job` remains.
3. Preserve the already resolved CK-001 application integration and existing success, input-order, D1-only, source-grant, and rollback assertions. Production code may change only if the new evidence exposes a direct failure of the frozen shared-transaction contract; such a repair must be the smallest correction and include its regression assertion.
4. Record `HMN-IDSER-003-001` in the CFC remediation checkpoint and make one bounded remediation commit.

## Required validation

- Run `git diff --check` for the remediation diff.
- In Docker Compose with the worker isolated as required for deterministic queue inspection, run `@atlas/db`'s project-repository integration test and preserve the affected authenticated `@atlas/app` project-creation integration regression.
- Record the independent-connection observation: no matching job or graph before commit, and the expected committed graph plus exactly one D1 job after commit.
- Record the controlled post-enqueue-failure observation: every named Atlas graph row and the matching pg-boss job are absent after rollback.
- Confirm the diff introduces no new queue framework, producer privilege, after-commit callback, poller, worker/runtime behavior, source-grant policy, schema migration, UI behavior, or IDSER-004 work.

## Forbidden work

- Do not change the frozen IDSER-003 scope, acceptance criteria, creation flow, atomicity requirements, BSS-009 source-grant validity policy, queue identity, or DocumentStore ordering/rollback policy.
- Do not redesign correct production transaction or queue code merely to avoid writing the required cross-connection evidence.
- Do not reopen resolved CK-001, add semantic extraction/result processing, schedule D2 or later documents, create a new worker/service, modify UI, or begin IDSER-004.
- Do not start another CFC cycle after this remediation without a new explicit user `hmn` invocation and a new HMN artifact.

## Handoff

This opens one bounded evidence-remediation CFC cycle for `HMN-IDSER-003-001`. After one remediation commit and recorded validation, set the checkpoint to `awaiting_review` and hand that exact commit to CK. This artifact does not issue a PASS.

Expected next command: `cfc IDSER-003`
