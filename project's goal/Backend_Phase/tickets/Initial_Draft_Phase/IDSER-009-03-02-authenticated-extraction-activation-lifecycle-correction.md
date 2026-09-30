# IDSER-009-03-02: Authenticated extraction activation lifecycle correction

- **State:** `awaiting_review` (corrected review contract pending supplemental CK freeze).
- **Depends on:** IDSER-009-03-01 `PASS`.
- **Unblocks:** IDSER-009-04 only after this and IDSER-009-03-01 reach CK `PASS`.
- **Execution environment:** Compose PostgreSQL, existing pg-boss/worker and authenticated Atlas internal perception-source route harness.
- **Corrects:** The persisted production prerequisite consumed by frozen IDSER-009-04 `CK-001.c`; final authenticated `/home` observation remains IDSER-009-04.

## 2026-09-30 review-contract correction

The original GO/CK/CFC history remains preserved in its existing artifacts, including the original CK matrix and `CFC_NOT_READY_FOR_CK` record. That cycle exposed a contract-sizing error: the former integrated production-card observation was assigned to this lifecycle-authority ticket even though it is final integration evidence owned by IDSER-009-04.

Under explicit human/planning authority recorded in `project's goal/feedback/IDSER-009-03-02-review-contract-correction.md`, this corrected ticket owns only authenticated, exact-scope persisted lifecycle activation at `PostgresPerceptionAuthority.redeem()`. The corrected closure contract is RC-A through RC-C below. It does not alter production lifecycle semantics, predecessor contracts, or any historical evidence; it removes the full authenticated `/home` card sequence from this ticket's PASS conditions and assigns that sequence to IDSER-009-04.

## Authority question

At what trusted execution boundary may Atlas change a newly created bundle from waiting to processing?

This ticket owns only authenticated execution-start activation. It preserves the approved IDSER-003 transactional project kickoff and IDSER-008 lifecycle rule; it does not create a queue or independent lifecycle authority.

## Frozen lifecycle rule and selected seam

Approved IDSER-008 controls: `waiting` means no document has started active processing and no technical failure exists. A durably queued initial perception remains waiting. Only authenticated, scope-valid execution start activates processing; queue existence, elapsed time, browser refresh, and simulated UI state are not authority.

Use `PostgresPerceptionAuthority.redeem()` as the activation seam. Repository inspection shows that it is reached through the service-authenticated internal perception-source route, verifies the signed source grant against the persisted execution/artifact/source tuple, and runs in a PostgreSQL transaction immediately before Atlas releases the protected source identity to the worker. In that transaction, prove the grant/execution is linked to the exact D1 member and the same project/workspace/bundle. An authorized first redemption changes `bundle waiting -> processing` and `D1 perception_queued -> perceiving`, setting the bundle start time once, before source release. Later perception delivery may advance the member using the existing lifecycle. Queue publication and project creation alone do not activate.

The accepted schema already supports the bundle and member states required; do not add a new lifecycle state, table, column, or migration. If GO discovers that the existing authenticated grant redemption cannot provide the scope-valid execution-start boundary without a new independent authority or schema change, stop and record `HUMAN_DECISION_REQUIRED` rather than selecting another architecture.

## Preserve IDSER-003 transactional kickoff

Project creation continues to atomically establish the owner/project graph, empty Master, Initial Draft, document metadata, one ordered bundle and manifest, D1 perception execution/source grant, and one durable pg-boss job. On successful commit and before worker redemption the persisted facts are exactly:

```text
bundle = waiting
D1 member = perception_queued
completed X = 0
D1 job = durably queued
```

Queue/job creation failure still rolls back the full graph and job. Do not use post-commit best-effort scheduling, a second queue, polling, timers, UI/local-storage authority, artificial production delay, normal-worker sleep, queue-length inference, arbitrary reset, or manual repair.

## Activation, replay, and negative authority

At the first valid authenticated, scope-matched redemption, activation and the existing protected-source redemption decision commit atomically. The member enters `perceiving`; the bundle enters `processing`; `started_at` is set once. A replay of that same valid active execution is idempotent: it does not reset start time/progress or regress a member already advanced by the real pipeline. It cannot change a ready or terminal bundle/member.

The smallest negative matrix is derived from the actual source-grant boundary: unauthenticated/incorrect service credential; forged or tampered grant; expired grant; revoked/missing persisted grant; stale or terminal execution; execution/artifact/source metadata mismatch (including wrong document); and a valid grant whose execution has no matching D1 member in the same project/workspace/bundle or targets another bundle. Each rejected case must leave the target and unrelated lifecycle rows unchanged. Do not add hypothetical invalid categories unsupported by this request/grant contract.

## Final card proof ownership

The previous deterministic worker-pause/browser-card sequence is not a closure condition for this ticket. IDSER-009-04 owns the real authenticated creation -> persisted waiting card -> authenticated execution start -> persisted extracting card sequence. This ticket supplies the persisted authority consumed by that final integration proof; it must not add a production pause hook, worker delay, environment-controlled lifecycle authority, or browser-card assertion to do so.

## Security readiness

- **Status:** `applicable`.
- **Inherited boundaries:** IDSER-009 `SEAM-IDSER-009-01` (persisted lifecycle read and no queue/timer/UI truth); approved IDSER-003 `SEAM-IDSER-003-01` / `COUPLING-IDSER-003-01` (one transaction, durable D1 kickoff, no nested independent commit); BSS-009 source-grant scope; approved IDSER-008 `SEAM-IDSER-008-02` (authenticated lifecycle/failure authority).
- **Trust boundary:** service-authenticated worker request + signed, persisted D1 source grant -> scope-locked Atlas transaction -> bundle/member activation -> protected source release.
- **Protected asset/authority:** owner/project/bundle lifecycle truth, document execution scope, source grant, and protected source access.
- **Identity context:** authenticated internal worker principal; exact grant ID; execution/document/source identity; project/workspace/bundle/member identity; bundle and member lifecycle state.
- **Extension seam:** retain the authenticated route, capability/grant verification, explicit project-workspace-bundle-member join, row locks, and one atomic transition for future policy attachment.
- **Prohibited coupling:** queue depth, browser/UI, time, caller-supplied project identity, unscoped grant lookup, post-commit queue, or test-only worker control as production state.
- **Minimal security proof:** wrong service credential and each applicable grant/scope negative leave all bundle/member state unchanged; same project valid grant activates only its exact bundle/member; same valid replay is idempotent and cannot regress terminal or progressed state.
- **Deferred:** semantic-information projection (009-03-01), semantic uncertainty versus failure model/presentation, all authenticated production-card and browser visual proof, broad IDSER-009-04 regression, IDSER-010, and unrelated security baseline work.

## Review contract

Rows prove this lifecycle prerequisite only. They do not close frozen IDSER-009-04 `CK-001.c`.

| Row | Ticket authority and exact required behavior | Smallest authoritative proof | Binary closure oracle | Direct-regression boundary |
|---|---|---|---|---|
| RC-A | This ticket plus approved IDSER-003: successful creation commit contains one waiting bundle, D1 `perception_queued`, X=0 and the durable D1 job; enqueue failure leaves no partial graph/job. | Focused existing Compose project-repository integration with an independent DB connection, actual pg-boss producer, and controlled enqueue failure. | **PASS** iff committed observations match all four facts and failure leaves no project graph or matching job. | Existing atomic project-create transaction and D1 kickoff only; do not reopen IDSER-003 authority. |
| RC-B | This ticket plus IDSER-008: only authenticated, exact-scope first grant redemption activates the matched bundle and D1 member before protected source release; start times are set once. | Compose PostgreSQL perception-authority integration through `PostgresPerceptionAuthority.redeem()`. | **PASS** iff valid first redemption changes exactly the target waiting/perception_queued pair to processing/perceiving, preserves X=0, sets each start time once, and no activation is committed before the trusted redemption transaction. | Existing grant redemption and persisted bundle/member transition; no new execution authority. |
| RC-C | This ticket: invalid auth/grant/execution/document/scope and terminal cases cannot activate; valid replay cannot reset progress, timestamps, advanced state, or mutate an unrelated/terminal bundle. | Table-driven Compose PostgreSQL authority integration from the applicable source-grant matrix, with before/after target and unrelated-row snapshots. | **PASS** iff every applicable negative is rejected without lifecycle mutation and replay leaves timestamps, progress, progressed/terminal state, and unrelated rows unchanged. | Grant validation and lifecycle activation transaction only; do not expand into semantic/pipeline failure behavior. |

## CFC repair and hard stop

Normal findings are repairable inside the existing repository, `PostgresPerceptionAuthority.redeem()` transaction, authenticated route, and named Compose harness. Preserve the IDSER-003 atomic graph/job and IDSER-008 transition authority in every repair. Do not resolve a finding by changing IDSER-009-04's eventual card expectation to `Waiting OR Extracting`.

If implementation requires new schema/lifecycle authority, a separate queue/worker architecture, a migration not implied by this state transition, or another materially distinct proof harness, stop with `HUMAN_DECISION_REQUIRED` and report the specific boundary; do not create another ticket. IDSER-009-04 retains the final integrated create-to-card regression closure.

## Explicit non-authority

This ticket does not own semantic uncertainty/model/presentation, new database authority, initial kickoff redesign, queue or grant-policy redesign, retry/failure/completion semantics beyond preventing invalid activation, artificial production timing, browser visual evidence, or final IDSER-009-04 `CK-001.c` closure.

## Required handoff

Before CK handoff, the bounded remediation checkpoint records RC-A through RC-C as `PROVEN` with exact Compose commands/results and `Internal readiness: READY_FOR_CK`. CK `PASS` proves only the authenticated activation prerequisite. The unchanged IDSER-009-04 retains final integrated closure authority.
