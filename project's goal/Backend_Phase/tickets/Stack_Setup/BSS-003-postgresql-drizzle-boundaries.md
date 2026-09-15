# BSS-003: PostgreSQL, Drizzle, and repository boundaries

- **State:** `in_progress`
- **Review batch:** BSS-BATCH-03
- **Depends on:** BSS-001, BSS-002
- **Baseline:** [Production Baseline](../../atlas-backend-production-baseline.md) §§4, 5, 6, 12; [Architecture Checkpoint](../../atlas-core-architecture-checkpoint-v2.md) — Section 1, Cross-Cutting: Reasoning vs Deterministic Authority

## Outcome

Establish PostgreSQL migrations and the Drizzle adapter boundary while keeping Atlas semantics independent of the persistence library and enforcing the Atlas/Agents Bridge authority split.

## Scope

- Create `packages/atlas-db` for Drizzle schema, connection configuration, and migrations.
- Create or configure the `packages/atlas-core` boundary so it can define domain behavior without importing Drizzle.
- Establish separate PostgreSQL namespaces for `auth`, `atlas`, and `bridge`; reserve queue infrastructure to pg-boss's own schema.
- Define least-privilege application roles for Atlas and Agents Bridge. Agents Bridge may access its execution/queue state and explicitly granted read views, but has no write permission on trusted Atlas state.
- Establish migration and test-database commands without designing the final project, workspace, revision, knowledge, or publication tables.

## Acceptance criteria

- Drizzle schema and migration code live under `packages/atlas-db`; `packages/atlas-core` has no runtime dependency on Drizzle or `atlas-db`.
- Migrations can be applied and checked against the local PostgreSQL service.
- Authentication, Atlas domain, and Bridge execution state have separate schema ownership boundaries.
- Database permission tests demonstrate that the Agents Bridge role cannot insert, update, or delete in the Atlas trusted-state namespace, while the Atlas application role can perform its authorized operations.
- The baseline's transaction boundary can be used by repositories and queueing without direct Drizzle calls leaking into Atlas Core.
- The migration setup does not claim the final domain schema is decided; domain tables and constraints are deferred to their own design/implementation tickets.

## Validation

- Apply migrations to an empty database and verify migration status is clean.
- Run permission tests using the actual Atlas and Bridge database roles, including a denied trusted-state write from the Bridge role.
- Run package-boundary checks confirming Atlas Core does not import Drizzle or the database adapter.
- Run type-check and tests for the BSS-owned database packages and directly affected integration targets; the ticket-set fixture-suite exclusion applies.

## Review checkpoint

- **Review question:** Are PostgreSQL migrations, schema ownership, and repository boundaries established without prematurely fixing the domain schema?
- **Combined acceptance:** Clean migration from an empty database, verified schema/role boundaries, denied Bridge writes to trusted Atlas state, and no Drizzle dependency in Atlas Core.
- **Commit to review:** Pending implementation commit.
