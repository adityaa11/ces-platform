# BSS-006: pg-boss background runtime

- **State:** `planned`
- **Review batch:** BSS-BATCH-06
- **Depends on:** BSS-003, BSS-005
- **Baseline:** [Production Baseline](../../atlas-backend-production-baseline.md) §§2, 7, 8, 10, 11, 12, 19, 21; [Architecture Checkpoint](../../atlas-core-architecture-checkpoint-v2.md) — Cross-Cutting: Incremental by Default

## Outcome

Run bounded, retryable background reasoning work through pg-boss and PostgreSQL, sharing the Agents Bridge execution runtime while preserving Atlas's authority boundary.

## Scope

- Add pg-boss queue setup and a separate Bridge worker entry point using the restricted Agents Bridge database role.
- Establish worker lifecycle handling for startup, graceful shutdown, bounded concurrency, timeout/cancellation, retry/backoff, and failed-job visibility.
- Demonstrate transactionally coupled enqueueing for a test job and idempotent handling across retries.
- Keep provider capacity and usage/budget accounting owned by the Bridge runtime boundary, without making skills aware of pricing.
- Do not add production extraction, reconciliation, CES, rebuild, or provider-specific jobs in this setup ticket.

## Acceptance criteria

- pg-boss stores queue state in the baseline PostgreSQL deployment; no separate Redis/Kafka service is introduced.
- A test job can be enqueued in the same database transaction as its source operation: commit makes both visible, rollback leaves neither committed.
- A failing test job retries according to configured policy; replaying an idempotent test job does not duplicate its effect.
- Worker shutdown stops accepting new work and completes or safely releases in-flight work within the configured policy.
- The worker uses the Bridge role and cannot directly mutate Atlas trusted-state tables.
- Interactive and background paths invoke the same provider-neutral execution runtime defined in BSS-005.

## Validation

- Run queue integration tests against PostgreSQL for enqueue, transaction rollback, successful completion, retry, idempotency, and shutdown.
- Verify database role permissions deny trusted Atlas writes from the worker process.
- Verify concurrency and timeout settings are loaded from configuration and have bounded defaults.
- Run workspace type-check and tests.

## Review checkpoint

- **Review question:** Can the background runtime process PostgreSQL-backed jobs with retries while remaining unable to mutate trusted Atlas state?
- **Combined acceptance:** Transactional enqueue, retry/idempotency behavior, controlled shutdown, shared executor use, and Bridge write denial all pass integration checks.
- **Commit to review:** Pending implementation commit.
