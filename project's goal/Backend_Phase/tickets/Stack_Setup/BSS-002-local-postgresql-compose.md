# BSS-002: Local PostgreSQL with Docker Compose

- **State:** `awaiting_review`
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

## Implementation checkpoint

The local database uses the PostgreSQL 18 official Alpine image with a Compose-project-scoped named volume mounted at `/var/lib/postgresql`, matching the PostgreSQL 18 image's version-specific data-directory layout. The Compose configuration validates with `.env.example` and the live checks passed in an isolated Compose project using host port `55432` because host port `5432` was unavailable:

- Docker Engine `29.1.3` and Docker Compose `v2.40.3` are available.
- The service starts and reports `healthy` through its readiness health check.
- `psql` connects successfully as `atlas` to `atlas_dev` and returns `current_database`, `current_user`, and `1`.
- A probe row survives `docker compose stop postgres` followed by `docker compose start postgres`, confirming named-volume persistence.
- `docker compose down --volumes` removes the isolated named volume; a fresh start no longer contains the probe table, confirming reset behavior.
- The isolated verification container, network, and volume were removed after validation.

The implementation and BSS-scoped validation are complete. The ticket is ready for its committed review checkpoint.
