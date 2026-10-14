# REL-03-DURABLE-001 - Fenced durable composite staging and replay

**Status:** `approved` after independent CK `PASS` for reviewed remediation commit `7657d92eff2cb0d624814d08512f025f758b2da4` ([verification record](../../../feedback/REL-03-DURABLE-001-7657d92-verification.md)). GO checkpoint: `REL-03-DURABLE-001-go-665b744.md`.
**Owner:** REL-03 durable integration / Bridge persistence only.
**Dependency:** `SEM-CUTOVER-007` remains planned and requires its own independent workflow authority; this prerequisite has achieved independent CK `PASS`.

## Outcome

Qualify one Bridge-owned, immutable, atomic and idempotent durable composite winner containing, when genuinely available:

- canonical Semantic V1 output;
- immutable provisional relationship revision records;
- the qualified SEM-005 provisional/deferred sidecar;
- exact source snapshot, profile, request, execution, revision and composite identities;
- the idempotency key and authoritative lease fence.

A legitimate fully deferred outcome may have no canonical Semantic V1 result. No deferred meaning may be fabricated as `non_fact`.

This prerequisite performs no semantic interpretation, accepted-context issuance, Atlas relationship publication or Master mutation. It consumes only qualified REL-03, SEM-005 and SEM-006 contracts. It does not activate or compose the production worker path.

## Authorized implementation paths

Only these implementation paths are authorized after the ownership blocker is resolved:

- `apps/agents-bridge/src/semantic-composite-replay.ts`
- `apps/agents-bridge/tests/semantic-composite-replay.integration.test.ts`
- `packages/atlas-db/migrations/0025_rel03_semantic_composite_stage.sql`
- `packages/atlas-db/scripts/migrate.mjs` - exact additive registration of `0025_rel03_semantic_composite_stage` immediately after `0024_idser012_derived_assets`; no other runner change
- this prerequisite ticket and its HMN/GO/CK evidence artifacts

Migration `0025` is intentionally unused at the current baseline. HMN-002 resolves only its registration ownership by authorizing the exact additive allowlist entry above. Migration discovery, execution order, transaction behavior, credentials, error handling, role configuration and all existing migration identifiers remain frozen.

## Frozen transaction and identity contract

Before any durable effect, the complete winner is validated as one mutually consistent object: canonical result (when present), relationship revisions, provisional sidecar, source identity, profile/request identities, execution identity, idempotency key and composite hash.

The authoritative claimant check and composite insertion must share one PostgreSQL transaction or equivalent atomic SQL operation. The check must bind the exact idempotency key, execution identity, current lease owner and generation, and an unexpired running lease. Stale, superseded or expired claimants write zero rows. Concurrent claimants produce one winner.

After commit, the complete winner is immutable. An identical retry returns the stored winner. Any conflict in execution, source SHA, profile/request hash, revision set, sidecar hash or composite identity fails without modifying it. The winner remains available after process restart, cancellation, delivery failure or acknowledgement loss; ordinary transport acknowledgement does not delete it.

The table is Bridge-owned staging/recovery material. It must not be an Atlas trusted semantic or Master table. Effective `agents_bridge` and `atlas_app` role checks are mandatory in isolated PostgreSQL qualification.

## Frozen Review Contract

| Row | Authority | Required proof | Status before implementation |
|---|---|---|---|
| `RC-DURABLE-01` | HMN request RC-DURABLE-01 | Complete composite validation rejects malformed or mismatched result, revisions, sidecar, source, profile/request identities and composite hash before durable effect; no partial state remains. | `UNRESOLVED` |
| `RC-DURABLE-02` | HMN request RC-DURABLE-02 | Real PostgreSQL transaction/atomic SQL proves one fenced winner, current lease/expiry enforcement, concurrent contention behavior and zero stale-claimant writes. | `UNRESOLVED` |
| `RC-DURABLE-03` | HMN request RC-DURABLE-03 | Exact payload/hash persistence, immutable identical replay, conflicting retry rejection and restart retrieval are observed from the database. | `UNRESOLVED` |
| `RC-DURABLE-04` | HMN request RC-DURABLE-04 | Deterministic failure injection proves no pre-commit partial state and preserves the post-commit winner through crash/cancel/delivery/acknowledgement-loss recovery. | `UNRESOLVED` |
| `RC-DURABLE-05` | HMN request RC-DURABLE-05 | Isolated effective-role checks prove Bridge staging ownership and zero Atlas trusted-state or Master effects; ordinary semantic replay remains unchanged. | `UNRESOLVED` |
| `RC-DURABLE-06` | HMN request RC-DURABLE-06 | Independent CK observes a fresh isolated PostgreSQL database using the real migration path and roles, with positive complete/deferred outcomes, negative identity cases, concurrency, cancellation and recovery scenarios. | `BLOCKED_AUTHORITY` |

`READY_FOR_CK` is permitted only after all applicable rows are `PROVEN` with the required isolated PostgreSQL harness. In-memory mocks do not qualify. Exactly-once external provider execution before the initial commit is explicitly outside this ticket.

## Current ownership and schema verification

The local branch is `codex/new-atlas-backend` at `604d662818174092d3305bbfab1e0dcab63a65ff`. The Bridge schema and role boundary are compatible in principle: `bridge` is created separately, Bridge tables are owned by `agents_bridge`, and `agents_bridge` has no Atlas-schema privileges; the migration must preserve/restate these boundaries.

The repository currently contains migrations `0000` through `0024`; `0025_rel03_semantic_composite_stage.sql` does not exist and its name is absent from `packages/atlas-db/scripts/migrate.mjs`. That runner is a hard-coded allowlist used by both `@atlas/db` `migrate` and `migration:check`. HMN-002 authorizes only the exact additive registration needed for the real isolated qualification database; it does not authorize migration-runner redesign or any other runner change.

## Exclusions and STOP conditions

Do not modify SEM-005 accounting, the REL-03 pure interface, SEM-006 finalizer, SEM-ACV-001, semantic worker/worker-main, existing `semantic-result-replay.ts`, Bridge completion lifecycle, provider adapters, source hydration/grant authority, Atlas semantic/reconciliation tables, admission, publication, Master, accepted RUN-003 state, protected volumes, source PDFs or visual assets. Do not reset Docker, use a normal D1 semantic job, make an external provider request, reserve admission or mutate Master.

Return `OWNERSHIP_CONFLICT_BLOCKED` if migration registration, transaction infrastructure, effective role setup or integration fixtures require files outside the authorized ownership. Return `SCHEMA_FIT_BLOCKED` if qualified contracts cannot represent the composite without changing another owner. Return `DURABILITY_BLOCKED` if isolated PostgreSQL evidence cannot prove atomic commit, immutable replay and stale-claimant rejection.

## Handoff

This ticket is a separately owned prerequisite for `SEM-CUTOVER-007`. The later cutover ticket may consume this API only after independent CK `PASS`; it does not inherit this ticket's implementation or review authority. HMN-002 hands the four-file implementation scope to `GO REL-03-DURABLE-001`; independent CK remains required before `SEM-CUTOVER-007` can proceed.
