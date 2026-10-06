# HMN Authorization: IDSER-002

Ticket: `IDSER-002: Semantic contracts and production skills`
Batch: `IDSER-BATCH-02`
HMN authorization ID: `HMN-IDSER-002-002`
Invocation: explicit user `hmn` delegation
Current workflow state: the CFC cycle authorized by `HMN-IDSER-002-001` was committed and post-CFC CK verification returned `CHANGES_REQUIRED` for one remaining CK-004 evidence case.

Frozen ticket reference: `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-002-semantic-contracts-and-production-skills.md`
Current HEAD: `b9fe0c75595c0c520b30d443dcd594e6b15f29bf` (`docs(idser): record HMN evidence remediation`)
Relevant GO commit: `f4b65f08c949d223a690ca0c3c1b6e98e7b797ff` (`feat(contracts): add semantic skill contracts`)
Relevant CK artifact: `project's goal/feedback/IDSER-BATCH-02-dbf9661-verification.md` (`CHANGES_REQUIRED`)
Relevant CFC commit: `dbf9661962c2957cfadb5bd15ba06383ef5dc329` (`test(contracts): complete IDSER-002 evidence matrix`)
Prior HMN authorization: `HMN-IDSER-002-001`, consumed by `dbf9661`
Worktree state: no tracked modifications; pre-existing untracked planning and review artifacts are present, including the latest CK verification.

## Diagnosis

The prior HMN-authorized CFC added the named evidence matrix and has been committed. Post-CFC CK confirms all of its other named cases and all Compose checks pass with no direct regression. CK-004 remains open only because the exact-at and one-byte-over 1 MiB fixture invokes `parseSemanticExtractionContext` but not `parseSemanticReconciliationContext`.

The frozen ticket explicitly requires boundaries at and above every context byte cap and defines both extraction and reconciliation contexts as 1 MiB. The remaining work is therefore a narrow, ticket-bound evidence gap. It needs no change to the parser, limit, provider-neutral contract, scope, or product behavior.

## Ticket-authority trace

- IDSER-002 Handoff and limits sets the serialized extraction context and serialized reconciliation context maximum to 1 MiB and requires UTF-8 JSON byte accounting.
- IDSER-002 Validation requires boundary tests at and above all count and byte caps.
- `HMN-IDSER-002-001` explicitly authorized exact-at/one-byte-over 1 MiB boundaries for both extraction and reconciliation contexts.
- `IDSER-BATCH-02-dbf9661-verification.md` verifies the prior remediation and identifies the missing reconciliation-context fixture as the sole unresolved CK-004 item.

## Decision

`AUTHORIZE_EVIDENCE_REMEDIATION`

Authorize one new, bounded CFC cycle for the single remaining CK-004 reconciliation-context byte-boundary fixture. This authorization is newer than the CK verification it addresses and is consumed by exactly one remediation commit.

## Authorized scope

1. Add deterministic `@atlas/contracts` fixture/helper coverage that constructs valid `atlas.semantic.reconcile` contexts at exactly `semanticLimits.contextBytes` and at one UTF-8 JSON byte above it.
2. Assert `parseSemanticReconciliationContext` accepts the exact-limit context and deterministically rejects the one-byte-over context.
3. Modify production contract code only if the new fixture exposes a direct, deterministic failure of the already-frozen 1 MiB reconciliation-context limit. Any such repair must be limited to enforcing that existing limit and include the regression assertion.
4. Preserve all existing CK-001 through CK-004 fixtures, especially extraction-context and result-envelope boundary coverage. Record `HMN-IDSER-002-002` in the CFC checkpoint and make one bounded remediation commit.

## Required validation

- Run `git diff --check` for the remediation diff.
- In Docker Compose, run the registered `@atlas/contracts` test and typecheck scripts and the registered `@atlas/skills` test and typecheck scripts.
- Record that exact-limit reconciliation context passes and the one-byte-over context fails under UTF-8 JSON byte accounting.
- Confirm the diff introduces no provider/model/endpoint field, fixture-runtime authority, persistence mutation, dispatcher, worker, projection, or UI behavior.

## Forbidden work

- Do not modify IDSER-002 acceptance criteria, numeric limits, schemas, semantic vocabulary, authority boundaries, or the local/canonical identity model except for a direct parser enforcement repair described above.
- Do not redesign correct production contracts, reopen CK-001 through CK-003, expand the test matrix beyond the unresolved reconciliation-context byte boundary, or begin IDSER-003 work.
- Do not start another CFC cycle after this remediation without a new explicit user `hmn` invocation and a new HMN artifact.

## Handoff

This opens one bounded evidence-remediation CFC cycle for `HMN-IDSER-002-002`. After one remediation commit and recorded validation, set the checkpoint to `awaiting_review` and hand that exact commit to CK. This artifact does not issue a PASS.

Expected next command: `cfc IDSER-002`
