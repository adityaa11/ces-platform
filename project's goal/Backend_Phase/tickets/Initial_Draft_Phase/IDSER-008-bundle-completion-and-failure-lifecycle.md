# IDSER-008: Bundle completion and failure lifecycle

- **State:** `approved`
- **Review batch:** `IDSER-BATCH-08`
- **Depends on:** IDSER-003 through IDSER-007 `PASS`.
- **Baseline:** SRC-IDSER-01 sections 10-11, 23-29, 32, 41.6-41.9; AC-23/27/28/29/31/32. See [README](README.md).
- **Execution environment:** Docker Compose for state transitions, queue recovery and completion integrity.

## Outcome

Finish Atlas lifecycle orchestration so a bundle reaches review-ready state only
after all required stages validate, while technical failures durably surface as
`needs_attention`. Semantic uncertainty remains valid reviewable state.

## Inspected seams and edit scope

- Implement Core bundle completion/lifecycle services and transactional DB repositories over IDSER-001 records.
- Complete final-member transition from IDSER-007 and start/failure handling from IDSER-004/005, including existing BSS-009 failure propagation through the authenticated Atlas boundary.
- Wire the real creation/perception/semantic/reconciliation handlers end to end in existing Atlas/Bridge composition roots.
- Keep queue retries, lease handling and worker lifecycle under the existing BSS-006 runtime; no second polling or recovery service.

## Lifecycle rules

- Bundle `waiting` means no document has started active processing and no technical failure. Queued initial perception may still be waiting until durable activation. Transition to `processing` from an authenticated, scope-validated execution start; do not infer start from elapsed UI time.
- Use member `pending`, `perception_queued`, `perceiving`, `extracting`, `reconciling`, `completed`, `needs_attention` states. Keep bootstrap workspace `draft` during waiting/processing/failure; only the completion gate permits `ready_for_review`.
- Approved transient retries keep processing recoverable. Deterministic schema/evidence/reference/identity/integrity failure or exhausted technical retries blocks advancement and records bounded failure code/time on member/bundle.
- Cover perception/provider failure, timeout, malformed JSON, invalid locators/accounting, wrong scope, stale authorized execution, conflicting completion, persistence/enqueue failure and corrupted transitions. An unauthorized forged request must not mark an unrelated valid execution failed.
- Contradiction, ambiguity, uncertain actor/scope/condition, possible/partial supersession and human-resolution requirements are not technical failures.
- Finish durable failure reporting when Atlas is temporarily unavailable or the worker restarts: the existing queue/operational ledger retains retry responsibility until Atlas records the terminal outcome. A failed DB write cannot itself be claimed as persisted `needs_attention`.
- Failure/result races must preserve a previously committed accepted completion; stale notifications cannot regress completed members or double progress.
- Recovery after ordinary worker/process restarts follows durable execution/replay state. Do not introduce an operator retry UI, arbitrary reset command, source-grant extension or manual truth repair.

## Mandatory completion gate

In the final reconciliation acceptance transaction verify every item below before
changing both bundle and bootstrap workspace to `ready_for_review`:

1. The manifest has not changed.
2. X equals the expected manifest count N.
3. Every member is `completed`.
4. Every member's perception execution is completed.
5. Each document has exactly one accepted logical extraction execution for the active version.
6. Each document has exactly one accepted logical reconciliation execution for the active version.
7. All candidate IDs resolve to the correct extraction result and scope.
8. All evidence resolves to the correct document and normalized locator.
9. All reconciliation references resolve to the authorized semantic context.
10. No active-version stage is queued, running or failed.
11. No candidate/result has been promoted to accepted or resolved knowledge.
12. Master remains unchanged and empty.

This gate concerns Atlas semantic/perception stage state. The delivering
pg-boss job may still await transport acknowledgement after the Atlas transaction;
do not create a circular requirement that pg-boss acknowledge before result
acceptance. Exact replay of the already accepted final result remains valid.

## Acceptance criteria

1. All twelve completion conditions are independently enforced, with atomic final result/relationship/count/workspace/bundle transition.
2. Unresolved conflicts can reach `ready_for_review`; technical failure cannot mark the affected PRD processed or schedule its successor.
3. Persisted safe failure state survives worker restart and delayed Atlas availability; current-state checks prevent stale notification regressions.
4. Different bundles progress concurrently with no shared context or progress. Same display names are irrelevant.
5. No accepted truth, review decisions, CES, projections, conversation, approval, revision, publication or Master HEAD movement exists.

## Validation

- Mutate/inject each missing or inconsistent completion precondition in isolated DB fixtures and prove review-ready transition fails; restore valid state and prove success.
- Crash/rollback tests around final acceptance, workspace update, progress recomputation and response acknowledgement; duplicate final delivery has no second effect.
- Retry exhaustion, unavailable Atlas failure handoff, worker restart and success/failure races for perception and both semantic stages.
- Delayed perception source/delivery exceeding existing grant validity must produce bounded failure/recovery under BSS-009, never silent hang or bypass. If required behavior is incompatible with the frozen contract, record exact `SCOPE_CHANGE` evidence rather than changing grant rules.
- Confirm all real handlers are wired and no intermediate fail-closed placeholder or TestRuntime handles production semantic success.
- Inspect Master and all forbidden downstream authority surfaces; run focused Core/DB/Bridge integration in Compose.

## Security Refactor Readiness

- **Status:** `applicable`.
- **Inherited boundaries:** Atlas lifecycle authority; existing queue retry policy and Bridge operational state.
- **Trust boundaries / assets:** worker start/failure/completion reports -> durable Atlas transitions; lifecycle, provenance and unresolved semantic data.
- **Identity context:** active bundle contract versions, ordered document/execution IDs and completion fingerprints.
- **SEAM-IDSER-008-01:** One deterministic completion gate with independent checks and atomic transition.
- **SEAM-IDSER-008-02:** Durable authenticated bounded failure reporting separates technical integrity from semantic uncertainty.
- **COUPLING-IDSER-008-01:** No queue-length/timer truth, late failure regression, implicit acceptance or Master mutation.
- **Unresolved security policy:** human resolution, retry UI and future publication remain deferred.
- **Planning findings:** PLAN-IDSER-06 is tested here; frozen grant constraints remain authoritative.

| Mandatory review binding | Readiness reference | Question / evidence |
|---|---|---|
| REV-READY-IDSER-008-01 | SEAM-IDSER-008-01 | Does every missing precondition prevent atomic review-ready completion? Corruption/rollback tests. |
| REV-READY-IDSER-008-02 | SEAM-IDSER-008-02 | Do terminal failures persist after outages without treating uncertainty as failure? Recovery/race tests. |
| REV-READY-IDSER-008-03 | COUPLING-IDSER-008-01 | Is Master untouched and reviewable state distinct from accepted state? Negative authority queries. |

## Review checkpoint

**Question:** Is review-ready state a proven integrity boundary, with truthful
recoverable technical failure and no premature advancement of project truth?

**Implementation checkpoint:** `project's goal/feedback/IDSER-BATCH-08-go-checkpoint.md`; CK verification and approval are recorded below.

## CK approval and GO checkpoint

- **CK result:** `PASS` in [`IDSER-BATCH-08-ec1e973-verification.md`](../../../feedback/IDSER-BATCH-08-ec1e973-verification.md), reviewed remediation commit `ec1e97380b7a23226baa87de9726e1b95e4a51f7`.
- **GO decision:** recorded IDSER-008 as approved. Per the user's bounded authorization, stop here; IDSER-009 has not been started.
