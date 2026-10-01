# IDSER-010-05: Staged-result replay, restart and fencing

- **State:** `approved`; **Review batch:** `IDSER-BATCH-10-05` (`PASS` at `51b0f8f`).
- **Predecessors:** IDSER-010-04 `PASS`.
- **Consumes:** approved `semantic_result_delivery` outbox, semantic acceptance idempotency, pg-boss leases and worker shutdown behavior.
- **Execution environment:** controlled-provider Compose worker and durable PostgreSQL/pg-boss restart harness.

## Authority and bounded outcome

Own Scenario H: interruption after Bridge staging and after Atlas acceptance/retry must resume from authoritative durable state. Prove stage-before-delivery, acknowledgement-loss redelivery without a new provider call, identical Atlas replay idempotency, conflicting completion-fingerprint rejection, stale lease/fencing denial, and exactly-once logical candidates/relationships/counts/next jobs. The required observations are durable outbox, provider call count, execution lease generation, persisted IDs/row counts and queue history.

## Explicit non-authority

No normal multi-document semantics, generic failure lifecycle, concurrency suite, new replay architecture, retry-policy redesign, browser regression, or live provider. This child must not change the producer/provider to hide a replay defect or use an in-memory fixture as the durable oracle.

## Review Contract

| Row | Exact bounded behavior | Smallest authoritative proof and binary closure oracle |
|---|---|---|
| RC-010-05-01 | Validated semantic envelope is durably staged before trusted Atlas delivery; worker interruption after staging redelivers that exact envelope. | Controlled worker stop/restart with outbox and envelope fingerprint observation. **PASS iff** durable staged record survives interruption and the resumed delivery byte-equates at the approved envelope boundary. |
| RC-010-05-02 | Acknowledgement loss/restart never triggers another Mistral call for staged work. | Provider call counter plus persisted idempotency key/outbox evidence. **PASS iff** call count remains one while delivery retries and acknowledgement eventually clears only the delivered stage. |
| RC-010-05-03 | Identical Atlas replay has exactly-once logical effects; conflicting fingerprint/result and stale lease claimant are rejected without mutation. | Compose semantic authority/replay fixture with result/count/job/lease snapshots. **PASS iff** IDs, candidates, relationships, processed count and successor job remain singular and losing claimant/control rows are unchanged. |

## Security, repair and handoff

**Security readiness: applicable.** `SEAM-010-06` / `REV-010-06` protects the durable envelope, idempotency key, execution scope and lease generation. Mandatory negatives are no provider recall after stage, conflicting replay, stale lease, duplicate IDs/rows/count/job and cross-execution envelope reuse. Direct regressions are semantic worker, replay store, queue lease and Atlas acceptance tests.

CFC remains in replay storage, existing worker restart harness, or exact count/fencing assertion. HMN may resolve one staging/ack/call-count/fingerprint/lease oracle; it cannot authorize general retries, concurrency, selector changes or a replacement worker/queue.

## Hard stop and required handoff

Before `awaiting_review`, all replay rows are `PROVEN` with exact Compose commands, staged/delivered IDs, provider-call count, lease generations and DB/queue counts. Scenario H authority is complete. Only 010-06 remains and it owns composition/evidence, not replay implementation. Record `Internal readiness: READY_FOR_CK`; CK makes one durable replay/fencing decision.
