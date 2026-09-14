# BSS-002: Local PostgreSQL with Docker Compose

- **State:** `planned`
- **Review batch:** BSS-BATCH-02
- **Depends on:** BSS-001
- **Baseline:** [Production Baseline](../../atlas-backend-production-baseline.md) §§2, 4, 17, 19; [Architecture Checkpoint](../../atlas-core-architecture-checkpoint-v2.md) — Section 1

## Outcome

Give developers a repeatable local PostgreSQL service that reflects the production database boundary without adding infrastructure the baseline defers.

## Scope

- Add a Docker Compose definition for PostgreSQL with a pinned, documented major version.
- Persist database data in a named Docker volume, not a repository bind mount.
- Provide non-secret local configuration through documented environment variables and `.env.example` values.
- Add a readiness health check and a concise start, stop, and reset workflow.
- Keep Atlas, Agents Bridge, and DocumentStore processes runnable through their normal development commands; this ticket does not containerize the applications.

## Acceptance criteria

- A developer can start PostgreSQL with one documented Compose command and verify that it is healthy.
- Restarting the container preserves database contents in the named volume; an explicit reset procedure removes local database state.
- No real credential is committed, and Compose does not write downloaded dependencies or caches into the repository.
- The Compose file pins a PostgreSQL major version rather than using a floating `latest` tag.
- PostgreSQL is the only database/queue infrastructure added; no Redis, Kafka, vector database, or Kubernetes service is introduced.
- The local configuration can be used by the later Drizzle and pg-boss tickets without embedding machine-specific paths.

## Validation

- Run `docker compose config`.
- Start the service and verify its health status and a successful SQL connection.
- Restart it and verify persisted data remains; verify the documented reset workflow clears only the named local volume.

## Review checkpoint

- **Review question:** Can developers start a durable local PostgreSQL instance through the documented Compose workflow?
- **Combined acceptance:** Compose configuration validates, PostgreSQL becomes healthy and accepts a connection, and named-volume persistence/reset behavior matches the documentation.
- **Commit to review:** Pending implementation commit.
