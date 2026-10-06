# BSS-V2-BATCH-04.02 CK review — `9c31002`

- **Ticket:** BSS-V2-004-02 — IDSER D1 persistent-Docling perception lifecycle checkpoint
- **Batch:** BSS-V2-BATCH-04.02
- **Reviewed commit:** `9c3100237a827dd565c6d7bbcee1b2cfdfa3a85b`
- **Frozen ticket:** `project's goal/Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-004-02-idser-d1-docling-lifecycle.md`
- **Implementer checkpoint:** `project's goal/feedback/BSS-V2-004-02-go-checkpoint.md`
- **Review type:** First CK review
- **Result:** `CHANGES_REQUIRED`

## Review target and authority

The frozen ticket is `awaiting_review`; the GO checkpoint identifies the
reviewed bounded implementation commit, which is HEAD `9c31002`. The worktree
contains unrelated modifications and untracked files, but none overlap the
committed ticket diff. Review is limited to the committed revision. No test or
validation command was executed during this review.

Authority is the frozen ticket, its explicit references, and the consumed
approved dependency interfaces. The ticket's frozen Review Contract rows
RC-BSSV2-004-02-01 through -07 are used as the contract. The GO checkpoint
records claimed validation and outcomes; source and test inspection was used
to assess whether those claims prove the required scenarios and observations.

## Review Contract disposition

| Row | Disposition | Review evidence |
| --- | --- | --- |
| RC-BSSV2-004-02-01 | `IMPLEMENTED_UNPROVEN` | The checkpoint claims a real Docling D1 seed and result. The committed seed script (`apps/atlas/scripts/perception-compose-seed.mjs`) directly inserts project, workspace, document, bundle, and member rows, creates the perception execution, and sends pg-boss work; it does not exercise the IDSER-003 project/bundle kickoff. The checkpoint records no end-to-end perception latency for the actual run. The required IDSER-003 Compose kickoff and operational latency observation are therefore not proven. |
| RC-BSSV2-004-02-02 | `IMPLEMENTED_UNPROVEN` | `docker-compose.yml` activates the approved route; `worker-main.ts` warms the configured Docling profile before publishing its ready marker; and the checkpoint reports config validation and a service restart. It does not record evidence that the running container's image digest was inspected and matched the qualified digest, as the ticket requires for deployment qualification. |
| RC-BSSV2-004-02-03 | `PROVEN` | The GO checkpoint reports the Compose PostgreSQL negative integration. Inspection of `perception-negative.integration.test.ts` confirms expired/tampered grant and hash, size, and MIME mismatch cases with no completed execution, active cache, or staged result. |
| RC-BSSV2-004-02-04 | `IMPLEMENTED_UNPROVEN` | The checkpoint cites mocked `docling-provider.test.ts` and a Compose negative matrix. The former is an injected-fetch unit test; the latter injects synthetic providers and does not exercise the named Docling service/network/processing/HTTP failures through the controlled Compose worker. The required controlled Compose service/HTTP/worker proof is absent for the named cases. |
| RC-BSSV2-004-02-05 | `PROVEN` | The checkpoint cites the Compose PostgreSQL perception integration and replay worker tests. The integration code stages normalized output, injects acknowledgement/cleanup loss, verifies one provider invocation and one accepted cache row, and confirms idempotent acknowledgement replay. |
| RC-BSSV2-004-02-06 | `IMPLEMENTED_UNPROVEN` | The checkpoint reports duplicate/fence/retry and conflicting-completion evidence, plus a Docling service restart. It does not identify a Bridge worker restart/replay scenario or scoped execution/cache/fence count evidence for that restart. The ticket explicitly names this case. |
| RC-BSSV2-004-02-07 | `PROVEN` | The checkpoint reports Bridge-role denial and no semantic execution after the real D1 run. Inspected integration evidence also asserts queue data omits source bytes/storage keys; the authority integration covers restricted Bridge writes. |

## Findings

### CK-001 — IDSER-003 kickoff and D1 run observation are not proven

**Ticket authority:** RC-BSSV2-004-02-01 requires a real IDSER-003 project/bundle kickoff that creates only its D1 execution/job and reaches the qualified service through the inherited authority path. The ticket's actual-run evidence clause also says to record end-to-end perception latency as operational evidence.

**Unsatisfied evidence:** The committed `apps/atlas/scripts/perception-compose-seed.mjs` constructs Atlas project/bundle/member database rows directly, calls `PostgresPerceptionAuthority.create`, and sends a pg-boss message. It does not exercise IDSER-003 kickoff. The GO checkpoint states that a scoped D1 seed completed through the real service but does not identify a kickoff run or provide the actual run's latency observation.

## Frozen Finding Closure Matrix

| Clause | Exact ticket authority and unsatisfied evidence | Observable correction | Binary closure oracle and direct-regression boundary |
| --- | --- | --- | --- |
| CK-001.a | RC-BSSV2-004-02-01: real IDSER-003 project/bundle kickoff creates only its D1 execution/job. Existing seed evidence bypasses that kickoff by inserting its rows and enqueueing directly. | Record one Compose-backed kickoff through the IDSER-003 entry point and the resulting D1 execution/job, followed through the approved Docling route to accepted `NormalizedDocument v1`; show that the kickoff creates no semantic execution/job. | **Pass iff** the recorded Compose run shows the IDSER-003 kickoff creating the D1 work and one accepted result through the ticketed path, with no semantic continuation. Evidence: the named kickoff output and scoped database/queue observations for that run. Direct-regression boundary: IDSER-003 kickoff, D1 queue payload, and BSS-009 source/result authority. |
| CK-001.b | Ticket's “actual D1 run should record end-to-end perception latency” requirement: no latency observation is recorded in the GO checkpoint. | Record the end-to-end latency measured for the actual real-service D1 run used to close CK-001.a. This is operational evidence and does not redefine the predecessor's <=20-second qualification gate. | **Pass iff** the same named actual D1 run has a recorded end-to-end latency value and run identity in the checkpoint/evidence. Evidence: the durable run record. Direct-regression boundary: none beyond the actual D1 run and its timing observation. |

### CK-002 — Running Docling image digest is not evidenced

**Ticket authority:** RC-BSSV2-004-02-02 requires reviewed Compose/container image-digest evidence showing the running service matches the BSS-V2-004-01 qualified CPU image/runtime identity. The frozen route identity specifies `sha256:4ba36cb322283e3851d2a6c5f347dd1cc515d7afb8ea5cc1577da8b5bfe2fea7`.

**Unsatisfied evidence:** The GO checkpoint lists `docker compose config`, runtime checks, and a Docling stop/restart. It does not record the running container's resolved image digest or a comparison to the frozen qualified digest. Config evidence alone does not establish the identity of the running container.

## Frozen Finding Closure Matrix

| Clause | Exact ticket authority and unsatisfied evidence | Observable correction | Binary closure oracle and direct-regression boundary |
| --- | --- | --- | --- |
| CK-002.a | RC-BSSV2-004-02-02: reviewed Compose configuration and running container must match the pinned qualified image/runtime digest. Running-container digest evidence is absent. | Record the resolved Compose image and the running Docling container's inspected digest for the reviewed stack, including their match to the frozen qualified digest. | **Pass iff** the durable Compose and container inspection evidence identifies the running container and proves the expected digest matches `sha256:4ba36cb322283e3851d2a6c5f347dd1cc515d7afb8ea5cc1577da8b5bfe2fea7`. Evidence: the named config and container-inspection output. Direct-regression boundary: BSS-V2-004-01 image/runtime identity and this ticket's route readiness. |

### CK-003 — Required Docling failure/recovery cases lack controlled Compose proof

**Ticket authority:** RC-BSSV2-004-02-04 requires controlled Compose service/HTTP/worker cases for Docling service/network/processing failure, timeout/cancellation, malformed response, mapper rejection, and normalization/integrity failure. The ticket's required cases also name unavailable/not-ready, connection/reset/5xx, and malformed/incomplete response.

**Unsatisfied evidence:** `docling-provider.test.ts` uses an injected fetcher and unit-level responses. `perception-negative.integration.test.ts` runs against Compose PostgreSQL but injects generic synthetic providers rather than driving the Docling service/HTTP and worker arrangement. These are useful diagnostics, but do not prove the ticket's named controlled Compose cases or their perception-only outcome through the worker.

## Frozen Finding Closure Matrix

| Clause | Exact ticket authority and unsatisfied evidence | Observable correction | Binary closure oracle and direct-regression boundary |
| --- | --- | --- | --- |
| CK-003.a | RC-BSSV2-004-02-04 and “Required failure/recovery cases”: controlled Compose service/HTTP/worker proof is missing for the named Docling unavailable/not-ready, connection/reset/5xx, processing, timeout/cancellation, malformed/incomplete response, mapper rejection, and normalization/integrity cases. | Record the ticket-named controlled Compose cases through the real Bridge worker and Docling HTTP/service boundary, including the specified retry/terminal disposition and state observations showing failures remain perception-only. | **Pass iff** durable results for the named cases demonstrate the ticket's inherited bounded failure/recovery behavior, no invalid accepted result, no subprocess/remote-provider fallback, and no semantic continuation/job/state. Evidence: the Compose scenario outputs and scoped execution/cache/queue observations for each named case. Direct-regression boundary: BSS-006 worker disposition, BSS-009 failure handoff, and BSS-V2-004-01 Docling failure/readiness behavior used by these cases. |

### CK-004 — Bridge worker restart/replay is not proven

**Ticket authority:** RC-BSSV2-004-02-06 explicitly requires Compose duplicate, stale/conflict, worker-restart, and between-job service-restart scenarios with execution/cache/fence count inspection. The ticket's required cases separately name Bridge worker restart/replay.

**Unsatisfied evidence:** The GO checkpoint identifies duplicate/fence/retry integration assertions and a Docling service restart. It does not identify a Bridge worker process restart/replay scenario or its scoped logical-completion counts.

## Frozen Finding Closure Matrix

| Clause | Exact ticket authority and unsatisfied evidence | Observable correction | Binary closure oracle and direct-regression boundary |
| --- | --- | --- | --- |
| CK-004.a | RC-BSSV2-004-02-06: Bridge worker restart/replay must preserve one accepted perception state; the checkpoint reports no worker restart case or associated counts. | Record a Compose Bridge worker restart/replay scenario using the ticket's D1 operation and inspect the execution, cache, replay, and fence/completion counts required by the row. | **Pass iff** after the recorded worker restart/replay the identical completion is idempotent and exactly one logical execution/result/cache remains, with the ticket-required scoped counts recorded. Evidence: the named Compose restart scenario output and scoped count queries. Direct-regression boundary: BSS-006 retry/replay/fencing and BSS-009 source/result authority. |

## Separate scope-change observations

None. The findings above trace to the frozen ticket's explicit rows and cases; no new product, architecture, deployment-target, or policy decision is requested.

## Decision

`CHANGES_REQUIRED`. The implementation checkpoint provides meaningful evidence for several rows, but the four frozen clauses above remain unproven against explicit ticket obligations. This is the single consolidated first review for `9c31002`. The clauses and binary oracles are frozen by this artifact; any later CFC verification must use these oracles without strengthening them.
