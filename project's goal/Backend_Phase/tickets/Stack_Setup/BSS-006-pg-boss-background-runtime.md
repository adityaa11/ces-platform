# BSS-006: pg-boss background runtime

- **State:** `approved`
- **Review batch:** BSS-BATCH-06
- **Depends on:** BSS-003, BSS-005
- **Baseline:** [Production Baseline](../../atlas-backend-production-baseline.md) §§2, 7, 8, 10, 11, 12, 19, 21; [Architecture Checkpoint](../../atlas-core-architecture-checkpoint-v2.md) — Cross-Cutting: Incremental by Default

## Outcome

Run bounded, retryable background reasoning work through pg-boss and PostgreSQL, sharing the Agents Bridge execution runtime while preserving Atlas's authority boundary.

## Scope

- Add pg-boss queue setup and a separate Bridge worker entry point using the restricted Agents Bridge database role.
- Add the worker as a root Compose service so `docker compose up` starts it after PostgreSQL and its Bridge runtime dependencies are ready; its Compose lifecycle must preserve the ticket's graceful-shutdown policy.
- Establish worker lifecycle handling for startup, graceful shutdown, bounded concurrency, timeout/cancellation, retry/backoff, and failed-job visibility.
- Demonstrate transactionally coupled enqueueing for a test job and idempotent handling across retries.
- Keep provider capacity and usage/budget accounting owned by the Bridge runtime boundary, without making skills aware of pricing.
- Do not add production extraction, reconciliation, CES, rebuild, or provider-specific jobs in this setup ticket.

## Acceptance criteria

- pg-boss stores queue state in the baseline PostgreSQL deployment; no separate Redis/Kafka service is introduced.
- A test job can be enqueued in the same database transaction as its source operation: commit makes both visible, rollback leaves neither committed.
- A failing test job retries according to configured policy; replaying an idempotent test job does not duplicate its effect.
- Worker shutdown stops accepting new work and completes or safely releases in-flight work within the configured policy.
- `docker compose up` boots the worker without a separate manual process-start command, and stopping the Compose stack exercises the worker's configured shutdown behavior.
- The worker uses the Bridge role and cannot directly mutate Atlas trusted-state tables.
- Interactive and background paths invoke the same provider-neutral execution runtime defined in BSS-005.

## Validation

- Run queue integration tests against PostgreSQL for enqueue, transaction rollback, successful completion, retry, idempotency, and shutdown.
- Boot the complete supported local stack with `docker compose up` and verify that the worker becomes ready through its Compose-managed lifecycle.
- Verify database role permissions deny trusted Atlas writes from the worker process.
- Verify concurrency and timeout settings are loaded from configuration and have bounded defaults.
- Run type-check and tests for the BSS-owned worker and queue packages and directly affected integration targets; the ticket-set fixture-suite exclusion applies.

## Review checkpoint

- **Review question:** Can the background runtime process PostgreSQL-backed jobs with retries while remaining unable to mutate trusted Atlas state?
- **Combined acceptance:** Transactional enqueue, retry/idempotency behavior, controlled shutdown, shared executor use, and Bridge write denial all pass integration checks.
- **Commit to review:** `HEAD` (the BSS-006 checkpoint commit).

## Implementation checkpoint

- Added a `pgboss` PostgreSQL schema owned by `agents_bridge`, plus a Bridge-owned idempotency ledger under `bridge`; Atlas has only the queue metadata and job-insert privileges required to transactionally enqueue bounded work.
- Added a standalone Agents Bridge worker entry point with bounded concurrency, timeout, retry/backoff, graceful shutdown, and a Compose readiness signal.
- Added a transactional queue producer that validates the BSS-005 provider-neutral envelope and joins the caller's source-operation transaction through pg-boss's Drizzle adapter.
- Added a test-only queue isolation path so integration tests exercise transactional enqueue/rollback, retry, idempotency, cancellation/shutdown, and the shared `ReasoningRuntime` without contending with the Compose worker.
- Verified the Bridge worker and PostgreSQL integration suite, direct database permission denial for trusted Atlas writes, affected package type-checks, Compose configuration, and a full Compose boot with all services healthy.

## Narrow atomic-idempotency amendment

The callback-provided pg-boss transaction used by the original checkpoint is
replaced by the approved Bridge-managed PostgreSQL state machine. pg-boss
continues to own delivery, retry/backoff, concurrency, acknowledgement, and
worker coordination. Bridge-owned records now provide short transactional
claim, bounded lease, fencing generation, and transactional logical
completion. Delivery and external provider calls are at-least-once; completed
logical effects are exactly-once per idempotency key.

This amendment does not change queue technology, ownership, transactional
enqueue, restricted Bridge permissions, or Atlas trusted-state authority.
