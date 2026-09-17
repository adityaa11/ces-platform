# BSS-003: PostgreSQL, Drizzle, and repository boundaries

- **State:** `approved`
- **Review batch:** BSS-BATCH-03
- **Depends on:** BSS-001, BSS-002
- **Baseline:** [Production Baseline](../../atlas-backend-production-baseline-mistral-synced.md) §§4, 5, 6, 12; [Architecture Checkpoint](../../atlas-core-architecture-checkpoint-v2-mistral-enriched-v2.md) — Section 1, Cross-Cutting: Reasoning vs Deterministic Authority

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
- **Commit to review:** `9c1dcdb98d7e2925db2f0a7a9062210d9cfb3472`.

## Implementation checkpoint

- Added `@atlas/core` persistence-neutral transaction contracts and `@atlas/db` as the sole Drizzle/PostgreSQL adapter package.
- Added an idempotent SQL migration that establishes `auth`, `atlas`, and `bridge` namespaces, migration metadata, and separate `atlas_app` and `agents_bridge` roles. The Bridge role is explicitly denied all `atlas` schema and table privileges.
- Verified a clean migration-status check and the live least-privilege proof on the Compose PostgreSQL service at port `5432`: `agents_bridge` was denied an insert to `atlas.boundary_probe`, while `atlas_app` successfully performed the authorized insert.
- Type-checks passed for both `@atlas/core` and `@atlas/db`; no final Atlas domain table or constraint was introduced.

## Feedback remediation

The accepted BSS-BATCH-03 finding F-001 was remediated in `2f5447f36b5aa9345c7fca982d1d8965ae034eb2`. The live-role test now verifies that `agents_bridge` is denied `INSERT`, `UPDATE`, and `DELETE` against trusted Atlas state, while retaining the authorized `atlas_app` insert and cleanup.
